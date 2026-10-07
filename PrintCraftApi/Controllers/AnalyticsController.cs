using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using PrintCraftApi.Models;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly PrintCraftDb _db;

    public AnalyticsController(PrintCraftDb db)
    {
        _db = db;
    }

    [AllowAnonymous]
    [HttpPost("visit")]
    public async Task<IActionResult> TrackVisit([FromBody] TrackVisitRequest? request)
    {
        var eventType = NormalizeEventType(request?.EventType);
        var pagePath = NormalizePagePath(request?.Path);

        var userIdClaim = User?.Identity?.IsAuthenticated == true
            ? User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            : null;

        Guid? parsedUserId = null;
        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
            parsedUserId = userId;

        // 1. Try get Visitor ID from cookie
        var cookieVisitorId = Request.Cookies["pc_vid"];
        string visitorKey;

        if (!string.IsNullOrWhiteSpace(cookieVisitorId))
        {
            visitorKey = cookieVisitorId.Length > 100 ? cookieVisitorId[..100] : cookieVisitorId;
        }
        else
        {
            // 2. Fallback to IP + UserAgent hash, and issue cookie
            var visitorSource = ResolveVisitorSource(userIdClaim, Request.Headers["X-Visitor-Id"].FirstOrDefault(), HttpContext);
            var userAgent = Request.Headers["User-Agent"].ToString();
            visitorKey = HashValue($"{visitorSource}|{userAgent}");

            Response.Cookies.Append("pc_vid", visitorKey, new CookieOptions
            {
                Expires = DateTimeOffset.UtcNow.AddYears(1),
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Lax
            });
        }

        // Avoid database bloat: Find existing daily session for this visitor/page
        var today = DateTime.UtcNow.Date;
        var existingVisit = await _db.VisitEvents
            .FirstOrDefaultAsync(v => v.VisitorKey == visitorKey
                && v.PagePath == pagePath
                && v.EventType == eventType
                && v.VisitedAt.Date == today);

        if (existingVisit != null)
        {
            // Just increment the counter, don't insert a new row
            // We can debounce rapid refreshes if we want, but it's just an integer update now
            
            // For heartbeat events, we might want to avoid spamming the DB with +1s,
            // but let's debounce slightly:
            if (eventType == "heartbeat" && (DateTime.UtcNow - existingVisit.VisitedAt).TotalSeconds < 20)
            {
                return Ok(new { tracked = false });
            }

            if (eventType != "heartbeat" && (DateTime.UtcNow - existingVisit.VisitedAt).TotalSeconds < 45)
            {
                // Debounce rapid page refreshes
                return Ok(new { tracked = false });
            }

            existingVisit.Views++;
            existingVisit.VisitedAt = DateTime.UtcNow; // Update last visited time
            
            if (parsedUserId != null)
            {
                 existingVisit.UserId = parsedUserId;
            }

            await _db.SaveChangesAsync();
            return Ok(new { tracked = true, updated = true });
        }

        var countryCode = Request.Headers["CF-IPCountry"].FirstOrDefault()?.Trim().ToUpperInvariant();
        var city = Request.Headers["CF-IPCity"].FirstOrDefault()?.Trim();

        _db.VisitEvents.Add(new VisitEvent
        {
            UserId = parsedUserId,
            VisitorKey = visitorKey,
            EventType = eventType,
            PagePath = pagePath,
            CountryCode = string.IsNullOrWhiteSpace(countryCode) ? "UN" : countryCode,
            City = string.IsNullOrWhiteSpace(city) ? null : city,
            UserAgent = Request.Headers["User-Agent"].ToString(),
            VisitedAt = DateTime.UtcNow,
            Views = 1
        });

        await _db.SaveChangesAsync();
        return Ok(new { tracked = true, new_session = true });
    }

    private static string NormalizeEventType(string? eventType)
    {
        var normalized = string.IsNullOrWhiteSpace(eventType)
            ? "pageview"
            : eventType.Trim().ToLowerInvariant();

        return normalized is "pageview" or "heartbeat" ? normalized : "pageview";
    }

    private static string NormalizePagePath(string? path)
    {
        var candidate = string.IsNullOrWhiteSpace(path) ? "/" : path.Trim();

        if (!candidate.StartsWith('/'))
            candidate = "/" + candidate;

        if (candidate.Length > 180)
            candidate = candidate[..180];

        return candidate;
    }

    private static string ResolveVisitorSource(string? userId, string? visitorId, HttpContext context)
    {
        if (!string.IsNullOrWhiteSpace(userId))
            return $"user:{userId}";

        if (!string.IsNullOrWhiteSpace(visitorId))
            return $"anon:{visitorId.Trim()}";

        var forwarded = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        var ip = !string.IsNullOrWhiteSpace(forwarded)
            ? forwarded.Split(',')[0].Trim()
            : context.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        return $"ip:{ip}";
    }

    private static string HashValue(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes);
    }
}

public sealed record TrackVisitRequest(string? Path, string? EventType);
