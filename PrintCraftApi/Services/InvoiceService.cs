using Microsoft.Extensions.Options;
using PrintCraftApi.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

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
    byte[] Generate(Order order, User? customer, string? language = "en");
}

public sealed class InvoiceService(IOptions<InvoiceOptions> options) : IInvoiceService
{
    static InvoiceService()
    {
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
        QuestPDF.Settings.UseSystemFonts = true;
    }

    private readonly InvoiceOptions _options = options.Value;

    public byte[] Generate(Order order, User? customer, string? language = "en")
    {
        var currency = string.IsNullOrWhiteSpace(_options.CurrencyCode) ? "EUR" : _options.CurrencyCode;
        var labels = InvoiceLabels.For(language);
        var culture = labels.Culture;
        var invoiceNumber = $"INV-{order.Id.ToString("N")[..8].ToUpperInvariant()}";
        var customerName = string.IsNullOrWhiteSpace(customer?.Name) ? order.FullName : customer!.Name;
        var customerEmail = customer?.Email ?? string.Empty;
        var payment = order.Payments.OrderByDescending(item => item.CreatedAt).FirstOrDefault();
        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(42);
            page.DefaultTextStyle(style => style.FontFamily("Lato").FontSize(9).FontColor("24352F"));
            page.Header().Element(container => ComposeHeader(container, invoiceNumber, order, labels, culture));
            page.Content().Element(container => ComposeContent(container, order, customerName, customerEmail, payment, currency, labels, culture));
            page.Footer().AlignCenter().Text(text =>
            {
                text.Span(_options.SellerName).SemiBold();
                text.Span("  |  ");
                text.Span(labels.Page);
                text.CurrentPageNumber();
            });
        })).GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string invoiceNumber, Order order, InvoiceLabels labels, CultureInfo culture)
    {
        container.PaddingBottom(18).BorderBottom(2).BorderColor("2B8A70").Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                column.Item().Row(brand =>
                {
                    brand.ConstantItem(28).Height(28).Background("10B981").Padding(4).Column(mark =>
                    {
                        mark.Item().Row(cells =>
                        {
                            cells.RelativeItem().Background("FFFFFF").Height(8);
                            cells.RelativeItem().Background("FFFFFF").Height(8);
                        });
                        mark.Item().Row(cells =>
                        {
                            cells.RelativeItem().Background("FFFFFF").Height(8);
                            cells.RelativeItem().Background("047857").Height(8);
                        });
                    });
                    brand.AutoItem().PaddingLeft(8).AlignMiddle().Text(_options.SellerName)
                        .FontSize(18).Bold().FontColor("176B57");
                });

                column.Item().PaddingTop(5).Text(labels.Invoice).FontSize(22).Bold();
            });

            row.ConstantItem(190).AlignRight().Column(column =>
            {
                column.Item().Text(invoiceNumber).Bold();
                column.Item().Text($"{labels.Issued} {order.CreatedAt.ToString("d", culture)}");
                column.Item().Text(order.IsPaid ? labels.Paid : labels.PaymentPending).FontColor(order.IsPaid ? "176B57" : "A15C00");
            });
        });
    }

    private void ComposeContent(
        IContainer container,
        Order order,
        string customerName,
        string customerEmail,
        Payment? payment,
        string currency,
        InvoiceLabels labels,
        CultureInfo culture)
    {
        container.Column(column =>
        {
            column.Spacing(18);
            column.Item().Row(row =>
            {
                row.RelativeItem().Element(item => ComposeAddress(item, labels.From, new[]
                {
                    _options.SellerName,
                    _options.SellerAddress,
                    _options.SellerEmail,
                    _options.SellerPhone,
                    string.IsNullOrWhiteSpace(_options.VatNumber) ? string.Empty : $"VAT: {_options.VatNumber}"
                }));
                row.RelativeItem().Element(item => ComposeAddress(item, labels.BillTo, new[]
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
                    header.Cell().Element(HeaderCell).Text(labels.Description);
                    header.Cell().Element(HeaderCell).AlignRight().Text(labels.Quantity);
                    header.Cell().Element(HeaderCell).AlignRight().Text($"{labels.Unit} ({currency})");
                    header.Cell().Element(HeaderCell).AlignRight().Text($"{labels.Amount} ({currency})");
                });

                foreach (var item in order.Items)
                {
                    var quantity = item.Count <= 0 ? 1 : item.Count;
                    var name = string.IsNullOrWhiteSpace(item.fileName) ? item.FileUrl ?? "3D print item" : item.fileName;
                    table.Cell().Element(BodyCell).Text(name);
                    table.Cell().Element(BodyCell).AlignRight().Text(quantity.ToString());
                    table.Cell().Element(BodyCell).AlignRight().Text(item.Price.ToString("F2", culture));
                    table.Cell().Element(BodyCell).AlignRight().Text(((decimal)item.Price * quantity).ToString("F2", culture));

                    if (item.PlateCost > 0)
                    {
                        table.Cell().Element(BodyCell).Text($"  ↳ {name} (Plate Setup)");
                        table.Cell().Element(BodyCell).AlignRight().Text("1");
                        table.Cell().Element(BodyCell).AlignRight().Text(item.PlateCost.ToString("F2", culture));
                        table.Cell().Element(BodyCell).AlignRight().Text(item.PlateCost.ToString("F2", culture));
                    }
                }
            });

            column.Item().AlignRight().Width(270).Column(totals =>
            {
                AddTotal(totals, labels.Subtotal, order.SubtotalAmount, currency, culture);
                AddTotal(totals, labels.ServiceFee, Math.Max(order.ServiceFeePrice, 0m), currency, culture);
                AddTotal(totals, labels.Delivery, Math.Max(order.DeliveryPrice, 0m), currency, culture);
                AddTotal(totals, labels.Discount, -order.DiscountAmount, currency, culture);
                totals.Item().PaddingTop(6).BorderTop(1).BorderColor("D6E3DE").Row(row =>
                {
                    row.RelativeItem().Text(labels.Total).Bold().FontSize(12);
                    row.ConstantItem(100).AlignRight().Text($"{order.FinalTotalAmount.ToString("F2", culture)} {currency}").Bold().FontSize(12);
                });
            });

            column.Item().Row(row =>
            {
                row.RelativeItem().Element(item => ComposeAddress(item, labels.Payment, new[]
                {
                    $"{labels.Method}: {FormatPaymentMethod(order.PaymentFlow, labels)}",
                    string.IsNullOrWhiteSpace(payment?.Reference) ? string.Empty : $"{labels.Reference}: {payment.Reference}",
                    _options.PaymentTerms,
                    _options.TaxLabel
                }));
                row.RelativeItem().Element(item => ComposeAddress(item, labels.BankDetails, new[]
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

    private static void AddTotal(ColumnDescriptor column, string label, decimal amount, string currency, CultureInfo culture)
    {
        column.Item().Row(row =>
        {
            row.RelativeItem().Text(label);
            row.ConstantItem(100).AlignRight().Text($"{amount.ToString("F2", culture)} {currency}");
        });
    }

    private static IContainer HeaderCell(IContainer container)
        => container.Background("176B57").Padding(6).DefaultTextStyle(style => style.FontColor("FFFFFF").SemiBold());

    private static IContainer BodyCell(IContainer container)
        => container.BorderBottom(1).BorderColor("D6E3DE").PaddingVertical(7);

    private static string FormatPaymentMethod(string? paymentFlow, InvoiceLabels labels)
        => string.Equals(paymentFlow, "bank_transfer", StringComparison.OrdinalIgnoreCase)
            ? labels.BankTransfer
            : labels.OnlinePayment;

    private sealed record InvoiceLabels(
        CultureInfo Culture,
        string Invoice,
        string Issued,
        string Paid,
        string PaymentPending,
        string From,
        string BillTo,
        string Description,
        string Quantity,
        string Unit,
        string Amount,
        string Subtotal,
        string ServiceFee,
        string Delivery,
        string Discount,
        string Total,
        string Payment,
        string Method,
        string Reference,
        string BankDetails,
        string BankTransfer,
        string OnlinePayment,
        string Page)
    {
        public static InvoiceLabels For(string? language)
            => string.Equals(language, "nl", StringComparison.OrdinalIgnoreCase)
                ? new(CultureInfo.GetCultureInfo("nl-NL"), "Factuur", "Uitgegeven", "Betaald", "Betaling in behandeling", "Van", "Factuuradres", "Omschrijving", "Aantal", "Prijs", "Bedrag", "Subtotaal", "Servicekosten", "Bezorging", "Korting", "Totaal", "Betaling", "Methode", "Referentie", "Bankgegevens", "Overschrijving", "Online betaling", "Pagina")
                : new(CultureInfo.GetCultureInfo("en-US"), "Invoice", "Issued", "Paid", "Payment pending", "From", "Bill to", "Description", "Qty", "Unit", "Amount", "Subtotal", "Service fee", "Delivery", "Discount", "Total", "Payment", "Method", "Reference", "Bank details", "Bank transfer", "Online payment", "Page");
    }

}
