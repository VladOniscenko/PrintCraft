namespace PrintCraftApi.Models;

public class EmailTemplate
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TemplateName { get; set; } = string.Empty;
    public string Language { get; set; } = "en";
    public string Subject { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
}
