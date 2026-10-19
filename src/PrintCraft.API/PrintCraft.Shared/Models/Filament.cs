namespace PrintCraft.Shared.Models;

public class Filament
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Material { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public decimal PricePerGram { get; set; }
    public int StockQuantity { get; set; }
    public string Description { get; set; } = string.Empty;
}