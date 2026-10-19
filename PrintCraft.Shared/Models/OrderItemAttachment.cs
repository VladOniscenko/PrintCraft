namespace PrintCraft.Shared.Models;

public class OrderItemAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderItemId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string Kind { get; set; } = "other"; // model|image|other
}
