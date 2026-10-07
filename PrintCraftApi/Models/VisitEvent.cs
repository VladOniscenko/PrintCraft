namespace PrintCraftApi.Models;

public class VisitEvent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string VisitorKey { get; set; } = string.Empty;
    public string EventType { get; set; } = "pageview";
    public string PagePath { get; set; } = "/";
    public string? CountryCode { get; set; }
    public string? City { get; set; }
    public string? UserAgent { get; set; }
    public DateTime VisitedAt { get; set; } = DateTime.UtcNow;
    public int Views { get; set; } = 1;
}