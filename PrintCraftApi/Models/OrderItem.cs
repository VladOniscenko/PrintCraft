using System.ComponentModel.DataAnnotations;
public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }

    public string? FileUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string? fileName { get; set; }
    public string? Notes { get; set; }
    public string? Size { get; set; }
    public string Material { get; set; } = "PLA";
    public string Color { get; set; } = "Black";
    public int Count { get; set; }
    public double Price { get; set; } = 0;
    
    // Epic 4: 3D Slicer & Automated Pricing Engine fields
    public string? EstimatedPrintTime { get; set; }
    public double? FilamentUsedGrams { get; set; }
    public double ScaleFactor { get; set; } = 1.0;
    public int InfillPercent { get; set; } = 20;
    public string PrintQuality { get; set; } = "Standard (0.20mm)";
    public bool SupportsNeeded { get; set; } = false;
    public double PlateCost { get; set; } = 2.0;
    public double UnitPrice { get; set; } = 0;

    public List<OrderItemAttachment> Attachments { get; set; } = new();
}