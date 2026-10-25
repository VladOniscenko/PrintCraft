using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.OpenApi.Models;
using PrintCraft.Features.Admin;
using PrintCraft.Features.Content;
using PrintCraft.Features.Content.Data;
using PrintCraft.Features.Filaments;
using PrintCraft.Features.Filaments.Data;
using PrintCraft.Features.Notifications;
using PrintCraft.Features.Notifications.Data;
using PrintCraft.Features.Orders;
using PrintCraft.Features.Payments;
using PrintCraft.Features.Uploads;
using PrintCraft.Features.Users;
using PrintCraft.Shared.Configuration;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Services;
using QuestPDF.Infrastructure;

LoadDotEnv(
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env")),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "..", ".env")));

var environmentName = ApiEnvironment.ResolveName(
    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT"));
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    EnvironmentName = environmentName
});
QuestPDF.Settings.License = LicenseType.Community;

var isSeedOnly = args.Any(a => a is "--seed" or "--seed-only" or "seed")
                 || string.Equals(Environment.GetEnvironmentVariable("RUN_SEEDER"), "true", StringComparison.OrdinalIgnoreCase)
                 || string.Equals(Environment.GetEnvironmentVariable("SEED_ONLY"), "true", StringComparison.OrdinalIgnoreCase);

var forceReload = args.Any(a => a is "--force" or "-f" or "--reset" or "--overwrite")
                  || string.Equals(Environment.GetEnvironmentVariable("SEED_FORCE_RELOAD"), "true", StringComparison.OrdinalIgnoreCase)
                  || string.Equals(Environment.GetEnvironmentVariable("FORCE_SEED"), "true", StringComparison.OrdinalIgnoreCase);

// --- SERVICES ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException("ConnectionStrings__DefaultConnection must be configured via environment variables.");
}

if (string.IsNullOrWhiteSpace(builder.Configuration["FrontendBaseUrl"]))
{
    throw new InvalidOperationException("FrontendBaseUrl must be configured via environment variables.");
}

if (string.IsNullOrWhiteSpace(builder.Configuration["BackendBaseUrl"]))
{
    throw new InvalidOperationException("BackendBaseUrl must be configured via environment variables.");
}

var frontendBaseUrl = builder.Configuration["FrontendBaseUrl"]!.TrimEnd('/');

builder.Services.AddDbContextPool<PrintCraftDb>(opt => opt.UseNpgsql(connectionString));
builder.Services.AddMemoryCache();
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
});
builder.Services.AddHttpClient();

// Feature Modules
builder.Services.AddUsersFeature();
builder.Services.AddOrdersFeature(builder.Configuration);
builder.Services.AddFilamentsFeature(isSeedOnly);
builder.Services.AddPaymentsFeature();
builder.Services.AddUploadsFeature(isSeedOnly);
builder.Services.AddContentFeature();
builder.Services.AddNotificationsFeature(builder.Configuration, isSeedOnly);
builder.Services.AddAdminFeature();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers()
    .AddApplicationPart(typeof(PrintCraft.Features.Users.Controllers.AuthController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Orders.Controllers.OrdersController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Filaments.Controllers.FilamentsController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Payments.Controllers.PaymentsController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Uploads.Controllers.UploadController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Content.Controllers.CitiesController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Notifications.Controllers.EmailTemplatesController).Assembly)
    .AddApplicationPart(typeof(PrintCraft.Features.Admin.Controllers.AdminController).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// 2. Updated SwaggerGen to handle JWT with email/password login
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token: Bearer {your_token}"
    });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// JWT hardening: require configured secret and validate lifetime.
var secretKey = builder.Configuration["JwtSecret"];
if (string.IsNullOrWhiteSpace(secretKey) || secretKey.Length < 32)
{
    throw new InvalidOperationException("JwtSecret must be configured and at least 32 characters long.");
}

var jwtIssuer = builder.Configuration["JwtIssuer"];
var jwtAudience = builder.Configuration["JwtAudience"];
var key = Encoding.ASCII.GetBytes(secretKey);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = !string.IsNullOrWhiteSpace(jwtIssuer),
            ValidIssuer = jwtIssuer,
            ValidateAudience = !string.IsNullOrWhiteSpace(jwtAudience),
            ValidAudience = jwtAudience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(opt => opt.AddPolicy("AllowReact", p => p.WithOrigins(frontendBaseUrl).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(new
        {
            message = "Too many requests. Please wait and try again."
        }, cancellationToken);
    };

    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var userId = httpContext.User?.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            : null;
        var isAdmin = httpContext.User?.IsInRole("admin") == true;

        var key = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

        return RateLimitPartition.GetFixedWindowLimiter(key, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = isAdmin ? 1200 : 120,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0,
            AutoReplenishment = true
        });
    });

    options.AddPolicy("AuthBurst", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"auth:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("UploadLimit", httpContext =>
        RateLimitPartition.GetTokenBucketLimiter(
            partitionKey: $"upload:{httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
            factory: _ => new TokenBucketRateLimiterOptions
            {
                TokenLimit = 5,
                TokensPerPeriod = 5,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("CheckoutLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"checkout:{httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 6,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));

    options.AddPolicy("QuoteLimit", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: $"quote:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 4,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

var app = builder.Build();

if (isSeedOnly)
{
    Console.WriteLine("====================================================================");
    Console.WriteLine($"[PrintCraft Seeder] Standalone CLI execution (ForceReload: {forceReload})");
    Console.WriteLine("====================================================================");

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();
        var connStr = db.Database.GetConnectionString() ?? "";
        try
        {
            var npgsqlBuilder = new Npgsql.NpgsqlConnectionStringBuilder(connStr);
            Console.WriteLine($"[PrintCraft Seeder] Target database: Host='{npgsqlBuilder.Host}', Port={npgsqlBuilder.Port}, Database='{npgsqlBuilder.Database}', User='{npgsqlBuilder.Username}'");
        }
        catch
        {
            Console.WriteLine("[PrintCraft Seeder] Target database connection string loaded.");
        }

        Console.WriteLine("[PrintCraft Seeder] Step 1/4: Applying database migrations & schema...");
        try
        {
            await db.Database.MigrateAsync();
            await EnsureSchemaColumnsAsync(db);
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine($"[PrintCraft Seeder] ERROR: Database connection failed: {ex.Message}");
            Console.WriteLine("[PrintCraft Seeder] Common causes & fixes:");
            Console.WriteLine("  1. The postgres container is not running: run 'docker compose ps' to check.");
            Console.WriteLine("  2. If using Docker, ensure the database host in ConnectionStrings__DefaultConnection is 'postgres' (the Docker service name), not 'localhost'.");
            Console.WriteLine("  3. Make sure the containers share the same network: run 'docker compose up -d postgres'.");
            Console.WriteLine("  4. Or run the seeder via Docker Compose directly: 'docker compose run --rm seeder'");
            Console.WriteLine();
            throw;
        }

        Console.WriteLine("[PrintCraft Seeder] Step 2/4: Seeding Hero Slides...");
        HeroSlideSeeder.EnsureSeedAssets(app.Environment.WebRootPath, app.Environment.ContentRootPath);
        var slideRes = await HeroSlideSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> Hero Slides: {slideRes.TotalBefore} before | +{slideRes.Inserted} inserted | {slideRes.Updated} updated | {slideRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 3/4: Seeding Email Templates...");
        var emailRes = await EmailTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> Email Templates: {emailRes.TotalBefore} before | +{emailRes.Inserted} inserted | {emailRes.Updated} updated | {emailRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 4/7: Seeding Standard Filaments (PLA & PETG)...");
        var filRes = await FilamentSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> Filaments: {filRes.TotalBefore} before | +{filRes.Inserted} inserted | {filRes.Updated} updated | {filRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 5/7: Seeding FAQ Items...");
        var faqRes = await FaqItemSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> FAQ Items: {faqRes.TotalBefore} before | +{faqRes.Inserted} inserted | {faqRes.Updated} updated | {faqRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 6/7: Seeding FAQ Topics & Solutions...");
        var topicRes = await FaqTopicSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> FAQ Topics: {topicRes.TotalBefore} before | +{topicRes.Inserted} inserted | {topicRes.Updated} updated | {topicRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 7/8: Seeding Dutch & Regional Cities...");
        var cityRes = await CitySeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> Cities: {cityRes.TotalBefore} before | +{cityRes.Inserted} inserted | {cityRes.Updated} updated | {cityRes.TotalAfter} total");

        Console.WriteLine("[PrintCraft Seeder] Step 8/8: Seeding Policy Templates...");
        var policyRes = await PolicyTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        Console.WriteLine($"[PrintCraft Seeder] -> Policy Templates: {policyRes.TotalBefore} before | +{policyRes.Inserted} inserted | {policyRes.Updated} updated | {policyRes.TotalAfter} total");

        Console.WriteLine("====================================================================");
        Console.WriteLine("[PrintCraft Seeder] Standalone seeding completed successfully! Exiting.");
        Console.WriteLine("====================================================================");
    }
    return;
}

// --- MIDDLEWARE ---

// 3. This enables the Swagger UI
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        var exception = feature?.Error;

        if (exception != null)
        {
            var logger = context.RequestServices
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("GlobalExceptionHandler");
            var discordWebhookService = context.RequestServices.GetRequiredService<IDiscordWebhookService>();

            logger.LogError(exception, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await discordWebhookService.SendUnhandledExceptionAsync(context, exception);
        }

        if (!context.Response.HasStarted)
        {
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(new
            {
                message = "An unexpected error occurred."
            });
        }
    });
});

app.UseHttpsRedirection();
app.UseCors("AllowReact");
app.UseResponseCompression();
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
var webRoot = app.Environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
var uploadsDir = Path.Combine(webRoot, "uploads");
Directory.CreateDirectory(uploadsDir);

var staticFileContentTypes = new FileExtensionContentTypeProvider();
staticFileContentTypes.Mappings[".3mf"] = "model/3mf";
staticFileContentTypes.Mappings[".stl"] = "model/stl";
staticFileContentTypes.Mappings[".obj"] = "model/obj";
staticFileContentTypes.Mappings[".step"] = "model/step";
staticFileContentTypes.Mappings[".stp"] = "model/step";
staticFileContentTypes.Mappings[".glb"] = "model/gltf-binary";
staticFileContentTypes.Mappings[".gltf"] = "model/gltf+json";
staticFileContentTypes.Mappings[".png"] = "image/png";
staticFileContentTypes.Mappings[".jpg"] = "image/jpeg";
staticFileContentTypes.Mappings[".jpeg"] = "image/jpeg";
staticFileContentTypes.Mappings[".webp"] = "image/webp";
staticFileContentTypes.Mappings[".gif"] = "image/gif";
staticFileContentTypes.Mappings[".svg"] = "image/svg+xml";

void PrepareStaticFileResponse(StaticFileResponseContext ctx)
{
    var path = ctx.Context.Request.Path.Value ?? string.Empty;
    var ext = Path.GetExtension(path).ToLowerInvariant();

    if (ext is ".html" or ".htm")
    {
        ctx.Context.Response.Headers.CacheControl = "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400";
    }
    else if (path.Contains("/assets/") || ext is ".js" or ".css" or ".woff2" or ".woff" or ".stl" or ".3mf" or ".glb" or ".obj")
    {
        ctx.Context.Response.Headers.CacheControl = "public, max-age=31536000, immutable";
    }
    else if (ext is ".png" or ".jpg" or ".jpeg" or ".webp" or ".svg" or ".ico")
    {
        ctx.Context.Response.Headers.CacheControl = "public, max-age=2592000";
    }
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRoot),
    ContentTypeProvider = staticFileContentTypes,
    ServeUnknownFileTypes = true,
    DefaultContentType = "application/octet-stream",
    OnPrepareResponse = PrepareStaticFileResponse
});

// Also serve from current directory wwwroot if webRoot is different
var altWebRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
if (!string.Equals(Path.GetFullPath(altWebRoot), Path.GetFullPath(webRoot), StringComparison.OrdinalIgnoreCase) && Directory.Exists(altWebRoot))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(altWebRoot),
        ContentTypeProvider = staticFileContentTypes,
        ServeUnknownFileTypes = true,
        DefaultContentType = "application/octet-stream",
        OnPrepareResponse = PrepareStaticFileResponse
    });
}

// --- ROUTES ---
app.MapControllers();

// Explicit fail-safe endpoint for serving uploaded files (including .glb, .stl, images)
app.MapGet("/uploads/{**filePath}", (string filePath, IWebHostEnvironment env, HttpContext context) =>
{
    if (string.IsNullOrWhiteSpace(filePath))
        return Results.NotFound();

    var cleanPath = filePath.TrimStart('/');
    var candidates = new List<string>
    {
        Path.Combine(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", cleanPath),
        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", cleanPath),
        Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", cleanPath)
    };

    string? targetPath = null;
    foreach (var candidate in candidates)
    {
        if (File.Exists(candidate))
        {
            targetPath = candidate;
            break;
        }
    }

    if (targetPath == null)
        return Results.NotFound();

    var ext = Path.GetExtension(targetPath).ToLowerInvariant();
    var contentType = ext switch
    {
        ".glb" => "model/gltf-binary",
        ".gltf" => "model/gltf+json",
        ".stl" => "model/stl",
        ".obj" => "model/obj",
        ".3mf" => "model/3mf",
        ".step" or ".stp" => "model/step",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".webp" => "image/webp",
        ".gif" => "image/gif",
        ".svg" => "image/svg+xml",
        _ => "application/octet-stream"
    };

    if (cleanPath.StartsWith("temp_", StringComparison.OrdinalIgnoreCase) || context.Request.Query.ContainsKey("v"))
    {
        context.Response.Headers.CacheControl = "no-cache, no-store, must-revalidate";
        context.Response.Headers.Pragma = "no-cache";
        context.Response.Headers.Expires = "0";
    }

    return Results.File(targetPath, contentType, enableRangeProcessing: true);
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PrintCraft DB] Migration warning (proceeding with safe schema sync): {ex.Message}");
    }

    try
    {
        await EnsureSchemaColumnsAsync(db);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PrintCraft DB] Schema check warning: {ex.Message}");
    }

    try
    {
        HeroSlideSeeder.EnsureSeedAssets(app.Environment.WebRootPath, app.Environment.ContentRootPath);
        await HeroSlideSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await EmailTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await FilamentSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await FaqItemSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await FaqTopicSeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await CitySeeder.EnsureDatabaseSeededAsync(db, forceReload);
        await PolicyTemplateSeeder.EnsureDatabaseSeededAsync(db, forceReload);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[PrintCraft DB] Seeder warning: {ex.Message}");
    }
}

app.Run();

static async Task EnsureSchemaColumnsAsync(PrintCraftDb db)
{
    static async Task SafeExecAsync(PrintCraftDb dbContext, string sql, string desc)
    {
        try
        {
            await dbContext.Database.ExecuteSqlRawAsync(sql);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[PrintCraft DB Schema] Note on '{desc}': {ex.Message}");
        }
    }

    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"PaymentFlow\" character varying(32) NOT NULL DEFAULT 'bank_transfer';", "Orders.PaymentFlow");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"EstimatedPrintTime\" text NULL;", "OrderItems.EstimatedPrintTime");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"FilamentUsedGrams\" double precision NULL;", "OrderItems.FilamentUsedGrams");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"ScaleFactor\" double precision NOT NULL DEFAULT 1.0;", "OrderItems.ScaleFactor");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"InfillPercent\" integer NOT NULL DEFAULT 20;", "OrderItems.InfillPercent");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"PrintQuality\" character varying(64) NOT NULL DEFAULT 'Standard (0.20mm)';", "OrderItems.PrintQuality");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"SupportsNeeded\" boolean NOT NULL DEFAULT FALSE;", "OrderItems.SupportsNeeded");
    await SafeExecAsync(db, "ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"PlateCost\" double precision NOT NULL DEFAULT 2.0;", "OrderItems.PlateCost");

    // State machine production fields
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" DROP COLUMN IF EXISTS \"AssignedPrinter\";", "Orders.AssignedPrinter");
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" DROP COLUMN IF EXISTS \"AssignedMaterial\";", "Orders.AssignedMaterial");
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" DROP COLUMN IF EXISTS \"GCodeFinalized\";", "Orders.GCodeFinalized");
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"HoldReason\" text NULL;", "Orders.HoldReason");
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"FlaggedForRefundReview\" boolean NOT NULL DEFAULT FALSE;", "Orders.FlaggedForRefundReview");

    // Express production & custom requests
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"IsExpress\" boolean NOT NULL DEFAULT FALSE;", "Orders.IsExpress");
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"RequestType\" text NOT NULL DEFAULT 'StandardUpload';", "Orders.RequestType");
    await SafeExecAsync(db, "ALTER TABLE \"QuoteDrafts\" ADD COLUMN IF NOT EXISTS \"IsExpress\" boolean NOT NULL DEFAULT FALSE;", "QuoteDrafts.IsExpress");
    await SafeExecAsync(db, "ALTER TABLE \"QuoteDrafts\" ADD COLUMN IF NOT EXISTS \"RequestType\" character varying(64) NOT NULL DEFAULT 'StandardUpload';", "QuoteDrafts.RequestType");

    // Multilingual preferences & templates
    await SafeExecAsync(db, "ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"Language\" text NOT NULL DEFAULT 'en';", "Orders.Language");
    await SafeExecAsync(db, "ALTER TABLE \"Users\" ADD COLUMN IF NOT EXISTS \"PreferredLanguage\" text NOT NULL DEFAULT 'en';", "Users.PreferredLanguage");
    await SafeExecAsync(db, "ALTER TABLE \"EmailTemplates\" ADD COLUMN IF NOT EXISTS \"Language\" text NOT NULL DEFAULT 'en';", "EmailTemplates.Language");
    await SafeExecAsync(db, "CREATE INDEX IF NOT EXISTS \"IX_EmailTemplates_TemplateName_Language\" ON \"EmailTemplates\" (\"TemplateName\", \"Language\");", "IX_EmailTemplates_TemplateName_Language");

    // Multilingual Hero Slides columns
    await SafeExecAsync(db, "ALTER TABLE \"HeroSlides\" ADD COLUMN IF NOT EXISTS \"Titles\" text NULL DEFAULT '{}';", "HeroSlides.Titles");
    await SafeExecAsync(db, "ALTER TABLE \"HeroSlides\" ADD COLUMN IF NOT EXISTS \"Subtexts\" text NULL DEFAULT '{}';", "HeroSlides.Subtexts");
    await SafeExecAsync(db, "ALTER TABLE \"HeroSlides\" ADD COLUMN IF NOT EXISTS \"PriceTexts\" text NULL DEFAULT '{}';", "HeroSlides.PriceTexts");
    await SafeExecAsync(db, "ALTER TABLE \"HeroSlides\" ADD COLUMN IF NOT EXISTS \"InstructionTooltips\" text NULL DEFAULT '{}';", "HeroSlides.InstructionTooltips");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""OrderItemChangeRequests"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""OrderItemId"" uuid NOT NULL,
            ""OrderId"" uuid NOT NULL,
            ""Status"" text NOT NULL DEFAULT 'pending_customer',
            ""ReasonCategory"" text NOT NULL DEFAULT 'broken_geometry',
            ""AdminNotes"" text NOT NULL DEFAULT '',
            ""RequiresNewFile"" boolean NOT NULL DEFAULT TRUE,
            ""RequestedBy"" text NULL,
            ""RequestedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""PreviousFileUrl"" text NULL,
            ""PreviousFileName"" text NULL,
            ""SubmittedFileUrl"" text NULL,
            ""SubmittedFileName"" text NULL,
            ""CustomerNotes"" text NULL,
            ""SubmittedAt"" timestamp with time zone NULL,
            ""ResolvedBy"" text NULL,
            ""ResolutionNotes"" text NULL,
            ""ResolvedAt"" timestamp with time zone NULL,
            CONSTRAINT ""FK_OrderItemChangeRequests_OrderItems_OrderItemId"" FOREIGN KEY (""OrderItemId"") REFERENCES ""OrderItems""(""Id"") ON DELETE CASCADE,
            CONSTRAINT ""FK_OrderItemChangeRequests_Orders_OrderId"" FOREIGN KEY (""OrderId"") REFERENCES ""Orders""(""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_OrderItemChangeRequests_OrderItemId_Status"" ON ""OrderItemChangeRequests""(""OrderItemId"", ""Status"");
        CREATE INDEX IF NOT EXISTS ""IX_OrderItemChangeRequests_OrderId_RequestedAt"" ON ""OrderItemChangeRequests""(""OrderId"", ""RequestedAt"");
    ", "OrderItemChangeRequests table");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""Cities"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""Slug"" text NOT NULL,
            ""Names"" text NOT NULL,
            ""Province"" text NOT NULL,
            ""Latitude"" double precision NULL,
            ""Longitude"" double precision NULL,
            ""IsActive"" boolean NOT NULL DEFAULT TRUE,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_Cities_Slug"" ON ""Cities"" (""Slug"");
        CREATE INDEX IF NOT EXISTS ""IX_Cities_Province_IsActive"" ON ""Cities"" (""Province"", ""IsActive"");
    ", "Cities table");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""FaqItems"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""Question"" text NOT NULL,
            ""Answer"" text NOT NULL,
            ""Category"" text NOT NULL,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""IsActive"" boolean NOT NULL DEFAULT TRUE,
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS ""IX_FaqItems_Category_IsActive_SortOrder"" ON ""FaqItems"" (""Category"", ""IsActive"", ""SortOrder"");
    ", "FaqItems table");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""FaqTopics"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""Slug"" text NOT NULL,
            ""Key"" text NULL,
            ""Names"" text NOT NULL,
            ""Tagline"" text NOT NULL,
            ""Badge"" text NOT NULL,
            ""HeroTitle"" text NOT NULL,
            ""HeroSubtitle"" text NOT NULL,
            ""Description"" text NOT NULL,
            ""Benefits"" text NOT NULL,
            ""RecommendedMaterials"" text NOT NULL,
            ""LeadTime"" text NOT NULL,
            ""Precision"" text NOT NULL,
            ""MetaTitle"" text NOT NULL,
            ""MetaDescription"" text NOT NULL,
            ""MetaKeywords"" text NOT NULL,
            ""Faqs"" text NOT NULL,
            ""IsActive"" boolean NOT NULL DEFAULT TRUE,
            ""SortOrder"" integer NOT NULL DEFAULT 0,
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_FaqTopics_Slug"" ON ""FaqTopics"" (""Slug"");
    ", "FaqTopics table");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""PolicyTemplates"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""Slug"" text NOT NULL,
            ""Title"" text NOT NULL,
            ""LastUpdated"" text NOT NULL,
            ""Sections"" text NOT NULL,
            ""ContactTitle"" text NOT NULL,
            ""ContactBody"" text NOT NULL,
            ""IsActive"" boolean NOT NULL DEFAULT TRUE,
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS ""IX_PolicyTemplates_Slug"" ON ""PolicyTemplates"" (""Slug"");
        CREATE INDEX IF NOT EXISTS ""IX_PolicyTemplates_IsActive"" ON ""PolicyTemplates"" (""IsActive"");
    ", "PolicyTemplates table");

    await SafeExecAsync(db, @"
        CREATE TABLE IF NOT EXISTS ""SupportTickets"" (
            ""Id"" uuid NOT NULL PRIMARY KEY,
            ""UserId"" uuid NULL,
            ""UserEmail"" character varying(256) NOT NULL DEFAULT '',
            ""OrderId"" uuid NULL,
            ""Category"" character varying(64) NOT NULL DEFAULT 'general',
            ""Subject"" character varying(256) NOT NULL DEFAULT '',
            ""Description"" text NOT NULL DEFAULT '',
            ""Status"" character varying(64) NOT NULL DEFAULT 'open',
            ""AttachmentUrls"" text NOT NULL DEFAULT '',
            ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
            CONSTRAINT ""FK_SupportTickets_Orders_OrderId"" FOREIGN KEY (""OrderId"") REFERENCES ""Orders""(""Id"") ON DELETE SET NULL,
            CONSTRAINT ""FK_SupportTickets_Users_UserId"" FOREIGN KEY (""UserId"") REFERENCES ""Users""(""Id"") ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS ""IX_SupportTickets_CreatedAt"" ON ""SupportTickets"" (""CreatedAt"");
        CREATE INDEX IF NOT EXISTS ""IX_SupportTickets_OrderId"" ON ""SupportTickets"" (""OrderId"");
        CREATE INDEX IF NOT EXISTS ""IX_SupportTickets_Status"" ON ""SupportTickets"" (""Status"");
        CREATE INDEX IF NOT EXISTS ""IX_SupportTickets_UserId"" ON ""SupportTickets"" (""UserId"");
    ", "SupportTickets table");
}

static void LoadDotEnv(params string[] candidatePaths)
{
    foreach (var path in candidatePaths)
    {
        if (!File.Exists(path)) continue;

        foreach (var rawLine in File.ReadAllLines(path))
        {
            var line = rawLine.Trim();
            if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#")) continue;

            var idx = line.IndexOf('=');
            if (idx <= 0) continue;

            var key = line[..idx].Trim();
            var value = line[(idx + 1)..].Trim().Trim('"');
            if (string.IsNullOrWhiteSpace(key)) continue;

            if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}
