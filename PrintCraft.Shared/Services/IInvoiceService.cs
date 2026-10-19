using PrintCraft.Shared.Models;

namespace PrintCraft.Shared.Services;

public sealed class InvoiceOptions
{
    public string SellerName { get; set; } = "PrintCraft";
    public string SellerAddress { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public string SellerPhone { get; set; } = string.Empty;
    public string VatNumber { get; set; } = string.Empty;
    public string TaxLabel { get; set; } = "Tax included where applicable";
    public string CurrencyCode { get; set; } = "EUR";
    public string PaymentTerms { get; set; } = "Payable upon receipt";
    public string BankAccountName { get; set; } = string.Empty;
    public string BankIban { get; set; } = string.Empty;
    public string BankBic { get; set; } = string.Empty;
}

public interface IInvoiceService
{
    byte[] Generate(Order order, User? customer, string? language = "en");
    void Generate(Order order, User? customer, Stream outputStream, string? language = "en");
}

