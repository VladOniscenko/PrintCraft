using System.Text.RegularExpressions;

namespace PrintCraftApi.Validation;

public static class InputSanitizer
{
    // Strip HTML tags to prevent XSS in stored strings
    private static readonly Regex HtmlTagRegex = new(
        @"<[^>]*>",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Detect directory traversal attempts
    private static readonly Regex DirectoryTraversalRegex = new(
        @"(\.\.[/\\]|%2e%2e|%2f|%5c|\.\.%2f|\.\.%5c)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    // Common SQL injection attack patterns
    private static readonly Regex SqlInjectionRegex = new(
        @"((\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b\s+[^;]*(\b(FROM|INTO|TABLE|WHERE|JOIN|ALL)\b|--|\/\*))|(\b(OR|AND)\b\s+['\d\w]+\s*=\s*['\d\w]+)|(--|\/\*|\*\/|;--)|(\bUNION\s+SELECT\b)|\b(SLEEP|BENCHMARK|WAITFOR\s+DELAY)\b)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    /// <summary>
    /// Sanitizes a user-supplied text input by stripping HTML tags and trimming.
    /// Returns null if input is null/empty.
    /// </summary>
    public static string? SanitizeText(string? input, int maxLength = 2000)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        var trimmed = input.Trim();
        if (trimmed.Length == 0)
            return null;

        // Remove HTML tags
        var stripped = HtmlTagRegex.Replace(trimmed, string.Empty).Trim();

        // Truncate to max length
        if (stripped.Length > maxLength)
            stripped = stripped[..maxLength];

        return stripped.Length == 0 ? null : stripped;
    }

    /// <summary>
    /// Returns true if the input contains directory traversal sequences.
    /// </summary>
    public static bool ContainsDirectoryTraversal(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;
        return input.Contains("..") ||
               input.Contains("%2e%2e", StringComparison.OrdinalIgnoreCase) ||
               DirectoryTraversalRegex.IsMatch(input);
    }

    /// <summary>
    /// Returns true if the input contains common SQL injection patterns.
    /// </summary>
    public static bool ContainsSqlInjection(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return false;
        return SqlInjectionRegex.IsMatch(input);
    }

    /// <summary>
    /// Validates and sanitizes a file name: strips path components and HTML.
    /// Returns null if the result is empty or invalid.
    /// </summary>
    public static string? SanitizeFileName(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return null;

        // Extract only the file name, stripping any path component
        var fileNameOnly = Path.GetFileName(input.Trim());

        // Remove HTML tags
        var stripped = HtmlTagRegex.Replace(fileNameOnly, string.Empty).Trim();

        // Remove invalid filename characters
        var invalidChars = Path.GetInvalidFileNameChars();
        var cleaned = new string(stripped.Where(c => !invalidChars.Contains(c)).ToArray());

        return string.IsNullOrWhiteSpace(cleaned) ? null : cleaned[..Math.Min(cleaned.Length, 255)];
    }
}
