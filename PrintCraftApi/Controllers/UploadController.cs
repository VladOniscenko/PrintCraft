using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Data;
using System.Text;
using System.Text.Json;
using PrintCraftApi.Validation;

namespace PrintCraftApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly PrintCraftDb _db;
    private const string VisitorHeaderName = "X-Visitor-Id";
    private const string UploadMetadataSuffix = ".upload-meta.json";

    private const long MaxUploadBytes = 50 * 1024 * 1024; // 50 MB
    private const int HeaderReadSize = 512;
    private static readonly HashSet<string> ModelExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".stl", ".obj", ".3mf", ".step", ".stp", ".glb", ".gltf"
    };

    private static readonly HashSet<string> DoneOrderStatuses = new(StringComparer.OrdinalIgnoreCase)
    {
        "completed", "delivered", "cancelled", "failed"
    };

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".stl", ".obj", ".3mf", ".step", ".stp", ".glb", ".gltf",
        ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"
    };

    private static readonly Dictionary<string, HashSet<string>> AllowedContentTypesByExtension =
        new(StringComparer.OrdinalIgnoreCase)
        {
            [".glb"] = new(StringComparer.OrdinalIgnoreCase) { "model/gltf-binary", "application/octet-stream" },
            [".gltf"] = new(StringComparer.OrdinalIgnoreCase) { "model/gltf+json", "application/json", "text/plain" },
            [".png"] = new(StringComparer.OrdinalIgnoreCase) { "image/png" },
            [".jpg"] = new(StringComparer.OrdinalIgnoreCase) { "image/jpeg" },
            [".jpeg"] = new(StringComparer.OrdinalIgnoreCase) { "image/jpeg" },
            [".gif"] = new(StringComparer.OrdinalIgnoreCase) { "image/gif" },
            [".webp"] = new(StringComparer.OrdinalIgnoreCase) { "image/webp" },
            [".svg"] = new(StringComparer.OrdinalIgnoreCase) { "image/svg+xml", "application/xml", "text/xml", "image/svg" },
            [".3mf"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "model/3mf",
                "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
                "application/zip",
                "application/octet-stream",
            },
            [".stl"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "model/stl",
                "application/sla",
                "application/vnd.ms-pki.stl",
                "application/octet-stream",
                "text/plain",
            },
            [".obj"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "model/obj",
                "text/plain",
                "application/octet-stream",
            },
            [".step"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "model/step",
                "application/step",
                "text/plain",
                "application/octet-stream",
            },
            [".stp"] = new(StringComparer.OrdinalIgnoreCase)
            {
                "model/step",
                "application/step",
                "text/plain",
                "application/octet-stream",
            },
        };

    public UploadController(PrintCraftDb db)
    {
        _db = db;
    }

    [HttpPost]
    [DisableRequestSizeLimit]
    [AllowAnonymous]
    [EnableRateLimiting("UploadLimit")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "No file uploaded." });

        if (file.Length > MaxUploadBytes)
            return BadRequest(new { message = "File is too large. Maximum size is 50 MB." });

        var extension = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(extension))
            return BadRequest(new { message = "Unsupported file type." });

        // Allow both model files and reference images for all quote flows.
        var validExtensions = AllowedExtensions;

        if (!validExtensions.Contains(extension))
            return BadRequest(new { message = "Unsupported file type." });

        if (!IsAllowedContentType(extension, file.ContentType))
            return BadRequest(new { message = "Unsupported content type for this file extension." });

        var header = await ReadHeaderAsync(file, HeaderReadSize);
        if (LooksLikeExecutable(header))
            return BadRequest(new { message = "Executable files are not allowed." });

        if (!PassesSignatureValidation(extension, header))
            return BadRequest(new { message = "File content does not match the selected file type." });

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var ownerKey = ResolveUploadOwnerKey();
        if (ownerKey == null)
            return BadRequest(new { message = "Missing upload visitor identifier." });

        var safeFileName = Guid.NewGuid().ToString() + extension.ToLowerInvariant();
        var filePath = Path.Combine(uploadsFolder, safeFileName);

        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream);

        await WriteUploadMetadataAsync(filePath, ownerKey);

        return Ok(new { url = $"/uploads/{safeFileName}" });
    }

    [HttpGet("models")]
    [Authorize(Roles = "admin")]
    [EnableRateLimiting("AuthBurst")]
    public IActionResult GetUploadedModels()
    {
        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder))
            return Ok(Array.Empty<object>());

        var activeOrderFileNames = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .AsEnumerable()
            .Where(order => !IsOrderDone(order.Status))
            .SelectMany(order => order.Items.SelectMany(item => new[]
            {
                ExtractFileNameFromAssetUrl(item.FileUrl),
                ExtractFileNameFromAssetUrl(item.ImageUrl),
            }.Concat(item.Attachments.Select(a => ExtractFileNameFromAssetUrl(a.Url)))))
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Cast<string>()
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var linkedOrderFileNames = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .AsEnumerable()
            .SelectMany(order => order.Items.SelectMany(item => new[]
            {
                ExtractFileNameFromAssetUrl(item.FileUrl),
                ExtractFileNameFromAssetUrl(item.ImageUrl),
            }.Concat(item.Attachments.Select(a => ExtractFileNameFromAssetUrl(a.Url)))))
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Cast<string>()
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var orderLinksByFileName = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .OrderByDescending(o => o.CreatedAt)
            .AsEnumerable()
            .SelectMany(order => order.Items.SelectMany((item, index) => new[]
                {
                    ExtractFileNameFromAssetUrl(item.FileUrl),
                    ExtractFileNameFromAssetUrl(item.ImageUrl),
                }.Concat(item.Attachments.Select(a => ExtractFileNameFromAssetUrl(a.Url)))
                .Where(name => !string.IsNullOrWhiteSpace(name))
                .Select(name => new
                {
                    orderId = order.Id,
                    itemIndex = index,
                    fileName = name,
                })))
            .Where(x => !string.IsNullOrWhiteSpace(x.fileName))
            .GroupBy(x => x.fileName!, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(
                g => g.Key,
                g => g.First(),
                StringComparer.OrdinalIgnoreCase);

        var heroSlideMediaUrls = _db.HeroSlides
            .AsNoTracking()
            .Select(s => s.MediaUrl)
            .Where(m => !string.IsNullOrWhiteSpace(m))
            .AsEnumerable()
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var files = Directory
            .EnumerateFiles(uploadsFolder, "*", SearchOption.AllDirectories)
            .Select(path => new FileInfo(path))
            .Where(info => AllowedExtensions.Contains(info.Extension) && !info.Name.EndsWith(UploadMetadataSuffix, StringComparison.OrdinalIgnoreCase))
            .OrderByDescending(info => info.LastWriteTimeUtc)
            .Select(info =>
            {
                var relPath = Path.GetRelativePath(uploadsFolder, info.FullName).Replace('\\', '/');
                var url = $"/uploads/{relPath}";
                orderLinksByFileName.TryGetValue(info.Name, out var link);
                var linkedToActiveOrder = activeOrderFileNames.Contains(info.Name);
                var linkedToOrder = linkedOrderFileNames.Contains(info.Name);
                var linkedToHeroSlide = heroSlideMediaUrls.Contains(url) || heroSlideMediaUrls.Any(m => m.EndsWith("/" + info.Name, StringComparison.OrdinalIgnoreCase));

                return new
                {
                    fileName = info.Name,
                    relativePath = relPath,
                    extension = info.Extension.ToLowerInvariant(),
                    sizeBytes = info.Length,
                    lastModifiedUtc = info.LastWriteTimeUtc,
                    url,
                    orderId = link?.orderId,
                    itemIndex = link?.itemIndex,
                    linkedToOrder,
                    linkedToActiveOrder,
                    linkedToHeroSlide,
                    canDelete = !linkedToOrder && !linkedToHeroSlide,
                };
            })
            .ToArray();

        return Ok(files);
    }

    [HttpDelete("models")]
    [Authorize(Roles = "admin")]
    [EnableRateLimiting("AuthBurst")]
    public IActionResult DeleteUploadedModel([FromQuery] string? fileName)
    {
        var trimmed = (fileName ?? string.Empty).Trim().Replace('\\', '/');
        if (string.IsNullOrWhiteSpace(trimmed))
            return BadRequest(new { message = "File name is required." });

        if (InputSanitizer.ContainsDirectoryTraversal(trimmed))
            return BadRequest(new { message = "Invalid file path." });

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var resolvedFullPath = Path.GetFullPath(Path.Combine(uploadsFolder, trimmed));
        if (!resolvedFullPath.StartsWith(Path.GetFullPath(uploadsFolder), StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid path traversal attempt." });

        var normalizedFileName = Path.GetFileName(resolvedFullPath);
        var extension = Path.GetExtension(normalizedFileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Only uploaded model or image files can be deleted from this endpoint." });

        var linkedToAnyOrder = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .AsEnumerable()
            .SelectMany(order => order.Items)
            .Any(item => string.Equals(
                ExtractFileNameFromAssetUrl(item.FileUrl),
                normalizedFileName,
                StringComparison.OrdinalIgnoreCase)
                || string.Equals(
                    ExtractFileNameFromAssetUrl(item.ImageUrl),
                    normalizedFileName,
                    StringComparison.OrdinalIgnoreCase)
                || item.Attachments.Any(a => string.Equals(
                    ExtractFileNameFromAssetUrl(a.Url),
                    normalizedFileName,
                    StringComparison.OrdinalIgnoreCase)));

        if (linkedToAnyOrder)
            return Conflict(new { message = "File is linked to an order and cannot be deleted." });

        var linkedToAnyHeroSlide = _db.HeroSlides
            .AsNoTracking()
            .Any(s => s.MediaUrl.EndsWith("/" + normalizedFileName) || s.MediaUrl.EndsWith(normalizedFileName));

        if (linkedToAnyHeroSlide)
            return Conflict(new { message = "File is in use by a promotional hero slide and cannot be deleted." });

        if (!System.IO.File.Exists(resolvedFullPath))
            return NotFound(new { message = "File not found." });

        System.IO.File.Delete(resolvedFullPath);
        DeleteUploadMetadataIfExists(resolvedFullPath);
        return Ok(new { message = "File deleted." });
    }

    [HttpDelete("temp")]
    [AllowAnonymous]
    [EnableRateLimiting("UploadLimit")]
    public IActionResult DeleteTempUpload([FromQuery] string? fileUrl)
    {
        if (InputSanitizer.ContainsDirectoryTraversal(fileUrl))
            return BadRequest(new { message = "Invalid file path." });

        var fileName = ExtractFileNameFromAssetUrl(fileUrl);
        if (string.IsNullOrWhiteSpace(fileName))
            return BadRequest(new { message = "Valid file URL is required." });

        var extension = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(extension) || !AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Only uploaded files can be deleted from this endpoint." });

        var visitorId = Request.Headers[VisitorHeaderName].FirstOrDefault()?.Trim();
        var ownerKey = ResolveUploadOwnerKey();

        if (!IsOwnedTempUpload(fileName, ownerKey, visitorId))
            return Forbid();

        var linkedToAnyOrder = _db.Orders
            .AsNoTracking()
            .Include(o => o.Items)
            .ThenInclude(i => i.Attachments)
            .AsEnumerable()
            .SelectMany(order => order.Items)
            .Any(item => string.Equals(
                ExtractFileNameFromAssetUrl(item.FileUrl),
                fileName,
                StringComparison.OrdinalIgnoreCase)
                || string.Equals(
                    ExtractFileNameFromAssetUrl(item.ImageUrl),
                    fileName,
                    StringComparison.OrdinalIgnoreCase)
                || item.Attachments.Any(a => string.Equals(
                    ExtractFileNameFromAssetUrl(a.Url),
                    fileName,
                    StringComparison.OrdinalIgnoreCase)));

        if (linkedToAnyOrder)
            return Conflict(new { message = "File is linked to an order and cannot be deleted." });

        var candidateDirs = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads")
        };

        var deletedAny = false;
        foreach (var dir in candidateDirs)
        {
            var filePath = Path.Combine(dir, fileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                DeleteUploadMetadataIfExists(filePath);
                deletedAny = true;
            }
        }

        return Ok(new { message = deletedAny ? "Temporary file deleted." : "File already removed." });
    }

    private static string? ExtractFileNameFromAssetUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl)) return null;

        var normalized = rawUrl.Replace('\\', '/').Trim();
        var withoutQuery = normalized.Split('?', 2)[0];
        if (string.IsNullOrWhiteSpace(withoutQuery)) return null;

        return Path.GetFileName(withoutQuery);
    }

    private static bool IsOrderDone(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return false;
        return DoneOrderStatuses.Contains(status.Trim());
    }

    private static bool IsAllowedContentType(string extension, string? contentType)
    {
        if (!AllowedContentTypesByExtension.TryGetValue(extension, out var allowedContentTypes))
            return false;

        var normalized = (contentType ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(normalized))
            return true;

        var withoutCharset = normalized.Split(';', 2, StringSplitOptions.TrimEntries)[0];
        return allowedContentTypes.Contains(withoutCharset);
    }

    private static async Task<byte[]> ReadHeaderAsync(IFormFile file, int count)
    {
        await using var stream = file.OpenReadStream();
        var buffer = new byte[count];
        var bytesRead = await stream.ReadAsync(buffer.AsMemory(0, count));
        return buffer[..bytesRead];
    }

    private static bool PassesSignatureValidation(string extension, byte[] header)
    {
        if (header.Length == 0) return false;

        return extension.ToLowerInvariant() switch
        {
            ".png" => HasPrefix(header, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A),
            ".jpg" or ".jpeg" => HasPrefix(header, 0xFF, 0xD8, 0xFF),
            ".gif" => StartsWithAscii(header, "GIF87a") || StartsWithAscii(header, "GIF89a"),
            ".webp" => StartsWithAscii(header, "RIFF") && HasAsciiAt(header, "WEBP", 8),
            ".3mf" => HasPrefix(header, 0x50, 0x4B, 0x03, 0x04),
            ".stl" => IsLikelyStl(header),
            ".obj" => IsLikelyObj(header),
            ".step" or ".stp" => IsLikelyStep(header),
            ".svg" => IsLikelySvg(header),
            _ => false,
        };
    }

    private static bool IsLikelySvg(byte[] header)
    {
        var content = Encoding.UTF8.GetString(header).TrimStart('\uFEFF', ' ', '\t', '\r', '\n');
        return content.StartsWith("<svg", StringComparison.OrdinalIgnoreCase)
            || content.StartsWith("<?xml", StringComparison.OrdinalIgnoreCase)
            || content.IndexOf("<svg", StringComparison.OrdinalIgnoreCase) >= 0;
    }

    private static bool LooksLikeExecutable(byte[] header)
    {
        if (HasPrefix(header, 0x4D, 0x5A)) return true; // PE/EXE
        if (HasPrefix(header, 0x7F, 0x45, 0x4C, 0x46)) return true; // ELF

        // Mach-O (32/64-bit and universal)
        if (HasPrefix(header, 0xFE, 0xED, 0xFA, 0xCE)
            || HasPrefix(header, 0xFE, 0xED, 0xFA, 0xCF)
            || HasPrefix(header, 0xCE, 0xFA, 0xED, 0xFE)
            || HasPrefix(header, 0xCF, 0xFA, 0xED, 0xFE)
            || HasPrefix(header, 0xCA, 0xFE, 0xBA, 0xBE))
        {
            return true;
        }

        return false;
    }

    private static bool IsLikelyStl(byte[] header)
    {
        var ascii = Encoding.ASCII.GetString(header).TrimStart('\u0000', ' ', '\t', '\r', '\n');
        if (ascii.StartsWith("solid", StringComparison.OrdinalIgnoreCase))
            return true;

        // Binary STL has 80-byte header + 4-byte triangle count at minimum.
        return header.Length >= 84;
    }

    private static bool IsLikelyObj(byte[] header)
    {
        var ascii = Encoding.ASCII.GetString(header);
        var trimmed = ascii.TrimStart('\u0000', ' ', '\t', '\r', '\n');

        return trimmed.StartsWith("#", StringComparison.Ordinal)
            || trimmed.StartsWith("v ", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("o ", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("g ", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("f ", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("mtllib ", StringComparison.OrdinalIgnoreCase)
            || trimmed.StartsWith("usemtl ", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLikelyStep(byte[] header)
    {
        var ascii = Encoding.ASCII.GetString(header);
        return ascii.IndexOf("ISO-10303-21", StringComparison.OrdinalIgnoreCase) >= 0;
    }

    private static bool HasPrefix(byte[] data, params byte[] prefix)
    {
        if (data.Length < prefix.Length) return false;
        for (var i = 0; i < prefix.Length; i++)
        {
            if (data[i] != prefix[i]) return false;
        }

        return true;
    }

    private static bool StartsWithAscii(byte[] data, string value)
    {
        if (data.Length < value.Length) return false;
        var expected = Encoding.ASCII.GetBytes(value);
        for (var i = 0; i < expected.Length; i++)
        {
            if (data[i] != expected[i]) return false;
        }

        return true;
    }

    private static bool HasAsciiAt(byte[] data, string value, int offset)
    {
        if (offset < 0) return false;
        if (data.Length < offset + value.Length) return false;

        var expected = Encoding.ASCII.GetBytes(value);
        for (var i = 0; i < expected.Length; i++)
        {
            if (data[offset + i] != expected[i]) return false;
        }

        return true;
    }

    private string? ResolveUploadOwnerKey()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userId))
            return $"user:{userId}";

        var visitorId = Request.Headers[VisitorHeaderName].FirstOrDefault()?.Trim();
        if (string.IsNullOrWhiteSpace(visitorId))
            return null;

        return $"anon:{visitorId}";
    }

    private static string GetUploadMetadataPath(string filePath)
        => filePath + UploadMetadataSuffix;

    private static async Task WriteUploadMetadataAsync(string filePath, string ownerKey)
    {
        var metadata = new UploadMetadata(ownerKey, DateTime.UtcNow);
        var metadataJson = JsonSerializer.Serialize(metadata);
        await System.IO.File.WriteAllTextAsync(GetUploadMetadataPath(filePath), metadataJson);
    }

    private static void DeleteUploadMetadataIfExists(string filePath)
    {
        var metadataPath = GetUploadMetadataPath(filePath);
        if (System.IO.File.Exists(metadataPath))
        {
            System.IO.File.Delete(metadataPath);
        }
    }

    private bool IsOwnedTempUpload(string fileName, string? ownerKey, string? visitorId)
    {
        if (User.IsInRole("admin"))
            return true;

        var candidateDirs = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"),
            Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads")
        };

        string? foundMetaPath = null;
        foreach (var dir in candidateDirs)
        {
            var metaPath = GetUploadMetadataPath(Path.Combine(dir, fileName));
            if (System.IO.File.Exists(metaPath))
            {
                foundMetaPath = metaPath;
                break;
            }
        }

        // If no metadata file exists (e.g. dynamically generated 3D relief or temp file),
        // allow client cleanup as long as it's not linked to any order/slide
        if (foundMetaPath == null)
            return true;

        try
        {
            var metadataJson = System.IO.File.ReadAllText(foundMetaPath);
            var metadata = JsonSerializer.Deserialize<UploadMetadata>(metadataJson);
            if (metadata == null) return true;

            // Direct ownerKey match
            if (!string.IsNullOrWhiteSpace(ownerKey) &&
                string.Equals(metadata.OwnerKey, ownerKey, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Visitor header match for anonymous uploads
            if (!string.IsNullOrWhiteSpace(visitorId) &&
                string.Equals(metadata.OwnerKey, $"anon:{visitorId}", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            // Authenticated user deleting file from their session
            if (User.Identity?.IsAuthenticated == true)
            {
                return true;
            }

            return false;
        }
        catch
        {
            return true;
        }
    }

    private sealed record UploadMetadata(string OwnerKey, DateTime UploadedAtUtc);

    public sealed record TempUploadCleanupRequest(string[]? FileUrls);
}
