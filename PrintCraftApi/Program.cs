using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using PrintCraftApi.Configuration;
using PrintCraftApi.Data;
using PrintCraftApi.Services;
using QuestPDF.Infrastructure;

LoadDotEnv(
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env")));

var environmentName = ApiEnvironment.ResolveName(
    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")
    ?? Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT"));
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    EnvironmentName = environmentName
});
QuestPDF.Settings.License = LicenseType.Community;

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

builder.Services.AddDbContext<PrintCraftDb>(opt => opt.UseNpgsql(connectionString));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<IDiscordWebhookService, DiscordWebhookService>();
builder.Services.AddScoped<IQuoteDraftService, QuoteDraftService>();
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection("Email"));
builder.Services.Configure<InvoiceOptions>(builder.Configuration.GetSection("Invoice"));
builder.Services.AddTransient<IEmailService, GmailSmtpEmailService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IPrintPricingService, PrintPricingService>();
builder.Services.AddSingleton<IPricingQueue, PricingQueue>();
builder.Services.AddHostedService<PricingBackgroundWorker>();
builder.Services.AddScoped<OrderStatusStateMachine>();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
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
app.UseAuthentication();
app.UseRateLimiter();
app.UseAuthorization();
var staticFileContentTypes = new FileExtensionContentTypeProvider();
staticFileContentTypes.Mappings[".3mf"] = "model/3mf";
staticFileContentTypes.Mappings[".stl"] = "model/stl";
staticFileContentTypes.Mappings[".obj"] = "model/obj";
staticFileContentTypes.Mappings[".step"] = "model/step";
staticFileContentTypes.Mappings[".stp"] = "model/step";
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = staticFileContentTypes,
});

// --- ROUTES ---
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PrintCraftDb>();
    db.Database.Migrate();
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"PaymentFlow\" character varying(32) NOT NULL DEFAULT 'bank_transfer';");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"EstimatedPrintTime\" text NULL;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"FilamentUsedGrams\" double precision NULL;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"ScaleFactor\" double precision NOT NULL DEFAULT 1.0;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"InfillPercent\" integer NOT NULL DEFAULT 20;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"PrintQuality\" character varying(64) NOT NULL DEFAULT 'Standard (0.20mm)';");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"SupportsNeeded\" boolean NOT NULL DEFAULT FALSE;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"OrderItems\" ADD COLUMN IF NOT EXISTS \"PlateCost\" double precision NOT NULL DEFAULT 2.0;");

    // Epic 8: State machine production fields
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"AssignedPrinter\" text NULL;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"AssignedMaterial\" text NULL;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"GCodeFinalized\" boolean NOT NULL DEFAULT FALSE;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"HoldReason\" text NULL;");
    db.Database.ExecuteSqlRaw("ALTER TABLE \"Orders\" ADD COLUMN IF NOT EXISTS \"FlaggedForRefundReview\" boolean NOT NULL DEFAULT FALSE;");

    HeroSlideSeeder.EnsureSeedAssets(app.Environment.WebRootPath, app.Environment.ContentRootPath);
    await HeroSlideSeeder.EnsureDatabaseSeededAsync(db);
}

app.Run();

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
