using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PrintCraftApi.Data;
using PrintCraftApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using PrintCraftApi.Services;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    private static readonly HashSet<string> SupportedLanguages = new(StringComparer.OrdinalIgnoreCase)
    {
        "nl", "en", "tr", "ru", "ar"
    };

    private static string NormalizeLanguage(string? lang)
    {
        if (string.IsNullOrWhiteSpace(lang)) return "en";
        var trimmed = lang.Trim().ToLowerInvariant();
        return SupportedLanguages.Contains(trimmed) ? trimmed : "en";
    }

    public AuthController(
        PrintCraftDb db,
        IConfiguration configuration,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _db = db;
        _configuration = configuration;
        _emailService = emailService;
        _logger = logger;
    }

    // Permission: Public Mutate (Whitelisted: User Registration)
    [HttpPost("register")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthBurst")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req, CancellationToken cancellationToken = default)
    {
        var name = req.Name?.Trim();
        var email = req.Email?.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(name) || name.Length < 2 || name.Length > 80)
            return BadRequest(new { message = "Name must be between 2 and 80 characters." });

        if (!IsValidEmail(email))
            return BadRequest(new { message = "A valid email is required." });

        var normalizedEmail = email!;

        if (string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        if (await _db.Users.AnyAsync(u => u.Email == email, cancellationToken))
            return BadRequest(new { message = "Email already exists." });

        var lang = NormalizeLanguage(req.PreferredLanguage);
        var user = new User
        {
            Name = name,
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = "customer",
            PreferredLanguage = lang
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "User registered!" });
    }

    // Permission: Public Mutate (Whitelisted: User Authentication)
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthBurst")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return Unauthorized(new { message = "Invalid email or password." });

        var normalizedEmail = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var key = GetJwtSigningKey();
        var jwtIssuer = _configuration["JwtIssuer"];
        var jwtAudience = _configuration["JwtAudience"];

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Issuer = string.IsNullOrWhiteSpace(jwtIssuer) ? null : jwtIssuer,
            Audience = string.IsNullOrWhiteSpace(jwtAudience) ? null : jwtAudience,
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return Ok(new
        {
            token = tokenHandler.WriteToken(token),
            user = new { user.Id, user.Name, user.Email, user.Role, preferredLanguage = user.PreferredLanguage ?? "en" }
        });
    }

    // Permission: Authenticated User
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe(CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized(new { message = "Unauthorized." });

        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == Guid.Parse(userId), cancellationToken);
        return user != null
            ? Ok(new { user.Id, user.Name, user.Email, user.Role, preferredLanguage = user.PreferredLanguage ?? "en" })
            : NotFound();
    }

    // Permission: Authenticated User
    [HttpPut("me/language")]
    [Authorize]
    public async Task<IActionResult> UpdatePreferredLanguage([FromBody] UpdateLanguagePreferenceRequest req, CancellationToken cancellationToken = default)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized(new { message = "Unauthorized." });

        if (!Guid.TryParse(userId, out var userGuid))
            return Unauthorized(new { message = "Unauthorized." });

        var user = await _db.Users.FindAsync(new object?[] { userGuid }, cancellationToken);
        if (user == null)
            return NotFound(new { message = "User not found." });

        var lang = NormalizeLanguage(req.Language);
        user.PreferredLanguage = lang;
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Language preference updated.", preferredLanguage = lang });
    }

    // Permission: Public Mutate (Whitelisted: Forgot Password)
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthBurst")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var email = req.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Ok(new { message = "If the account exists, a reset email has been sent." });
        }

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user != null)
        {
            try
            {
                var token = GeneratePasswordResetToken(user);
                var frontendBaseUrl = GetRequiredConfig("FrontendBaseUrl").TrimEnd('/');
                var resetLink = $"{frontendBaseUrl}/reset-password?token={Uri.EscapeDataString(token)}";
                await _emailService.SendResetPasswordEmailAsync(user.Email, user.Name, resetLink);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email for user {UserId}", user.Id);
            }
        }

        return Ok(new { message = "If the account exists, a reset email has been sent." });
    }

    // Permission: Authenticated User
    [HttpPut("change-password")]
    [EnableRateLimiting("AuthBurst")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized(new { message = "Unauthorized." });

        // Fix 1: Parse the string to a Guid
        var user = await _db.Users.FindAsync(Guid.Parse(userId));
        if (user == null)
            return BadRequest(new { message = "User not found." });

        // Fix 2: Verify the CURRENT password before allowing the change
        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Incorrect current password." });

        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password has been updated." });
    }

    // Permission: Public Mutate (Whitelisted: Reset Password with Verified Token)
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthBurst")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Token))
            return BadRequest(new { message = "Reset token is required." });

        if (string.IsNullOrWhiteSpace(req.NewPassword) || req.NewPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters." });

        var userId = ValidatePasswordResetToken(req.Token);
        if (userId == null)
            return BadRequest(new { message = "Reset token is invalid or expired." });

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null)
            return BadRequest(new { message = "Reset token is invalid or expired." });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Password has been reset." });
    }

    private string GeneratePasswordResetToken(User user)
    {
        var key = GetJwtSigningKey();

        var tokenHandler = new JwtSecurityTokenHandler();
        var descriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim("purpose", "password_reset"),
            }),
            Expires = DateTime.UtcNow.AddMinutes(30),
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature),
        };

        var token = tokenHandler.CreateToken(descriptor);
        return tokenHandler.WriteToken(token);
    }

    private Guid? ValidatePasswordResetToken(string token)
    {
        var key = GetJwtSigningKey();
        var tokenHandler = new JwtSecurityTokenHandler();

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
            }, out _);

            var purpose = principal.FindFirst("purpose")?.Value;
            if (!string.Equals(purpose, "password_reset", StringComparison.Ordinal))
                return null;

            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
        }
        catch
        {
            return null;
        }
    }

    private static bool IsValidEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return false;
        try
        {
            _ = new MailAddress(email);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private byte[] GetJwtSigningKey()
    {
        var secret = _configuration["JwtSecret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            throw new InvalidOperationException("JwtSecret must be configured and at least 32 characters long.");

        return Encoding.ASCII.GetBytes(secret);
    }

    private string GetRequiredConfig(string key)
    {
        var value = _configuration[key];
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException($"{key} must be configured via environment variables.");

        return value;
    }
}

public record RegisterRequest(string Name, string Email, string Password, string? PreferredLanguage = null);
public record LoginRequest(string Email, string Password);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Token, string NewPassword);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record UpdateLanguagePreferenceRequest(string Language);
