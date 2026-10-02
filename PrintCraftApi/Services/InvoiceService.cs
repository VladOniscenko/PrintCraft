using Microsoft.Extensions.Options;
using PrintCraftApi.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace PrintCraftApi.Services;

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
    byte[] Generate(Order order, User? customer);
}

public sealed class InvoiceService(IOptions<InvoiceOptions> options) : IInvoiceService
{
    private readonly InvoiceOptions _options = options.Value;

    public byte[] Generate(Order order, User? customer)
    {
        var currency = string.IsNullOrWhiteSpace(_options.CurrencyCode) ? "EUR" : _options.CurrencyCode;
        var invoiceNumber = $"INV-{order.Id.ToString("N")[..8].ToUpperInvariant()}";
        var customerName = string.IsNullOrWhiteSpace(customer?.Name) ? order.FullName : customer!.Name;
        var customerEmail = customer?.Email ?? string.Empty;
        var payment = order.Payments.OrderByDescending(item => item.CreatedAt).FirstOrDefault();
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(42);
            page.DefaultTextStyle(style => style.FontFamily("Lato").FontSize(9).FontColor("24352F"));
            page.Header().Element(container => ComposeHeader(container, invoiceNumber, order));
            page.Content().Element(container => ComposeContent(container, order, customerName, customerEmail, payment, currency));
            page.Footer().AlignCenter().Text(text =>
            {
                text.Span(_options.SellerName).SemiBold();
                text.Span("  |  ");
                text.Span("Page ");
                text.CurrentPageNumber();
            });
        })).GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string invoiceNumber, Order order)
    {
        container.PaddingBottom(18).BorderBottom(2).BorderColor("2B8A70").Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Row(brand =>
                {
                    brand.ConstantItem(28).Height(28).Background("176B57").AlignCenter().AlignMiddle()
                        .Text("P").FontSize(16).Bold().FontColor("F5C451");
                    brand.AutoItem().PaddingLeft(8).AlignMiddle().Text(_options.SellerName)
                        .FontSize(18).Bold().FontColor("176B57");
                });

                column.Item().PaddingTop(5).Text("Invoice").FontSize(22).Bold();
            });

            row.ConstantItem(190).AlignRight().Column(column =>
            {
                column.Item().Text(invoiceNumber).Bold();
                column.Item().Text($"Issued {order.CreatedAt:yyyy-MM-dd}");
                column.Item().Text(order.IsPaid ? "Paid" : "Payment pending").FontColor(order.IsPaid ? "176B57" : "A15C00");
            });
        });
    }

    private void ComposeContent(
        IContainer container,
        Order order,
        string customerName,
        string customerEmail,
        Payment? payment,
        string currency)
    {
        container.Column(column =>
        {
            column.Spacing(18);
            column.Item().Row(row =>
            {
                row.RelativeItem().Element(item => ComposeAddress(item, "From", new[]
                {
                    _options.SellerName,
                    _options.SellerAddress,
                    _options.SellerEmail,
                    _options.SellerPhone,
                    string.IsNullOrWhiteSpace(_options.VatNumber) ? string.Empty : $"VAT: {_options.VatNumber}"
                }));
                row.RelativeItem().Element(item => ComposeAddress(item, "Bill to", new[]
                {
                    customerName,
                    customerEmail,
                    order.AddressLine1,
                    order.AddressLine2 ?? string.Empty,
                    $"{order.PostalCode} {order.City}",
                    order.PhoneNumber
                }));
            });

            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(4);
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(80);
                    columns.ConstantColumn(85);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCell).Text("Description");
                    header.Cell().Element(HeaderCell).AlignRight().Text("Qty");
                    header.Cell().Element(HeaderCell).AlignRight().Text($"Unit ({currency})");
                    header.Cell().Element(HeaderCell).AlignRight().Text($"Amount ({currency})");
                });

                foreach (var item in order.Items)
                {
                    var quantity = item.Count <= 0 ? 1 : item.Count;
                    var name = string.IsNullOrWhiteSpace(item.fileName) ? item.FileUrl ?? "3D print item" : item.fileName;
                    table.Cell().Element(BodyCell).Text(name);
                    table.Cell().Element(BodyCell).AlignRight().Text(quantity.ToString());
                    table.Cell().Element(BodyCell).AlignRight().Text(item.Price.ToString("F2"));
                    table.Cell().Element(BodyCell).AlignRight().Text((item.Price * quantity).ToString("F2"));
                }
            });

            column.Item().AlignRight().Width(270).Column(totals =>
            {
                AddTotal(totals, "Subtotal", order.SubtotalAmount, currency);
                AddTotal(totals, "Service fee", Math.Max(order.ServiceFeePrice, 0m), currency);
                AddTotal(totals, "Delivery", Math.Max(order.DeliveryPrice, 0m), currency);
                AddTotal(totals, "Discount", -order.DiscountAmount, currency);
                totals.Item().PaddingTop(6).BorderTop(1).BorderColor("D6E3DE").Row(row =>
                {
                    row.RelativeItem().Text("Total").Bold().FontSize(12);
                    row.ConstantItem(100).AlignRight().Text($"{order.FinalTotalAmount:F2} {currency}").Bold().FontSize(12);
                });
            });

            column.Item().Row(row =>
            {
                row.RelativeItem().Element(item => ComposeAddress(item, "Payment", new[]
                {
                    $"Method: {FormatPaymentMethod(order.PaymentFlow)}",
                    string.IsNullOrWhiteSpace(payment?.Reference) ? string.Empty : $"Reference: {payment.Reference}",
                    _options.PaymentTerms,
                    _options.TaxLabel
                }));
                row.RelativeItem().Element(item => ComposeAddress(item, "Bank details", new[]
                {
                    _options.BankAccountName,
                    string.IsNullOrWhiteSpace(_options.BankIban) ? string.Empty : $"IBAN: {_options.BankIban}",
                    string.IsNullOrWhiteSpace(_options.BankBic) ? string.Empty : $"BIC: {_options.BankBic}"
                }));
            });
        });
    }

    private void ComposeAddress(IContainer container, string title, IEnumerable<string> lines)
    {
        container.Column(column =>
        {
            column.Item().Text(title).Bold().FontColor("176B57");
            foreach (var line in lines.Where(value => !string.IsNullOrWhiteSpace(value)))
                column.Item().Text(line.Trim());
        });
    }

    private static void AddTotal(ColumnDescriptor column, string label, decimal amount, string currency)
    {
        column.Item().Row(row =>
        {
            row.RelativeItem().Text(label);
            row.ConstantItem(100).AlignRight().Text($"{amount:F2} {currency}");
        });
    }

    private static IContainer HeaderCell(IContainer container)
        => container.Background("176B57").Padding(6).DefaultTextStyle(style => style.FontColor("FFFFFF").SemiBold());

    private static IContainer BodyCell(IContainer container)
        => container.BorderBottom(1).BorderColor("D6E3DE").PaddingVertical(7);

    private static string FormatPaymentMethod(string? paymentFlow)
        => string.Equals(paymentFlow, "bank_transfer", StringComparison.OrdinalIgnoreCase)
            ? "Bank transfer"
            : "Online payment";

}
