using Microsoft.Extensions.Configuration;
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

public sealed class InvoiceService : IInvoiceService
{
    static InvoiceService()
    {
        QuestPDF.Settings.License = LicenseType.Community;
        QuestPDF.Settings.ThrowOnMissingFontFamilies = false;
        QuestPDF.Settings.ThrowOnMissingTextGlyphs = false;
        QuestPDF.Settings.UseSystemFonts = true;
    }

    private readonly InvoiceOptions _options;
    private readonly IConfiguration? _configuration;

    public InvoiceService(IOptions<InvoiceOptions> options, IConfiguration? configuration = null)
    {
        _options = options.Value;
        _configuration = configuration;
    }

    public byte[] Generate(Order order, User? customer, string? language = "en")
    {
        var currency = string.IsNullOrWhiteSpace(_options.CurrencyCode) ? "EUR" : _options.CurrencyCode.Trim().ToUpperInvariant();
        var labels = InvoiceLabels.For(language);
        var culture = labels.Culture;
        var invoiceNumber = $"INV-{order.Id.ToString("N")[..8].ToUpperInvariant()}";
        var customerName = string.IsNullOrWhiteSpace(customer?.Name) ? order.FullName : customer!.Name;
        var customerEmail = customer?.Email ?? string.Empty;
        var payment = order.Payments.OrderByDescending(item => item.CreatedAt).FirstOrDefault();

        var sellerName = !string.IsNullOrWhiteSpace(_options.SellerName) && _options.SellerName != "PrintCraft"
            ? _options.SellerName
            : "Print My 3D";

        var bankAccountName = !string.IsNullOrWhiteSpace(_options.BankAccountName)
            ? _options.BankAccountName
            : _configuration?["BankTransfer:AccountName"] ?? string.Empty;

        var bankIban = !string.IsNullOrWhiteSpace(_options.BankIban)
            ? _options.BankIban
            : _configuration?["BankTransfer:Iban"] ?? string.Empty;

        var bankBic = !string.IsNullOrWhiteSpace(_options.BankBic)
            ? _options.BankBic
            : _configuration?["BankTransfer:Bic"] ?? string.Empty;

        return Document.Create(document => document.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(36);
            page.DefaultTextStyle(style => style.FontFamily("Lato").FontSize(8.5f).FontColor("0F172A"));

            // ── Slim Header (Website Branding) ───────────────────────────────
            page.Header().Element(container => ComposeHeader(container, invoiceNumber, order, sellerName, labels, culture));

            // ── Body Content ────────────────────────────────────────────────
            page.Content().Element(container => ComposeContent(
                container,
                order,
                customerName,
                customerEmail,
                sellerName,
                payment,
                currency,
                bankAccountName,
                bankIban,
                bankBic,
                labels,
                culture));

            // ── Slim Footer ─────────────────────────────────────────────────
            page.Footer().Element(container => ComposeFooter(container, sellerName, labels));
        })).GeneratePdf();
    }

    private void ComposeHeader(IContainer container, string invoiceNumber, Order order, string sellerName, InvoiceLabels labels, CultureInfo culture)
    {
        container.PaddingBottom(14).BorderBottom(1.5f).BorderColor("133827").Row(row =>
        {
            // Left: Website Brand Logo & Identity
            row.RelativeItem().Row(brand =>
            {
                // 2x2 Logo Grid Icon matching the frontend Logo.tsx
                brand.ConstantItem(26).Height(26).Background("10B981").Padding(3).Column(grid =>
                {
                    grid.Item().Row(cells =>
                    {
                        cells.RelativeItem().Height(8).Background("FFFFFF");
                        cells.ConstantItem(2);
                        cells.RelativeItem().Height(8).Background("FFFFFF");
                    });
                    grid.Item().Height(2);
                    grid.Item().Row(cells =>
                    {
                        cells.RelativeItem().Height(8).Background("FFFFFF");
                        cells.ConstantItem(2);
                        cells.RelativeItem().Height(8).Background("047857");
                    });
                });

                // Brand Titles
                brand.AutoItem().PaddingLeft(9).Column(titleCol =>
                {
                    titleCol.Item().Text(sellerName).FontSize(13).Bold().FontColor("133827");
                    titleCol.Item().Text("Custom 3D Printing & Manufacturing").FontSize(7.5f).SemiBold().FontColor("0F766E");
                    titleCol.Item().Text("printmy3d.work").FontSize(7f).FontColor("64748B");
                });
            });

            // Right: Clean Invoice Meta & Status Pill
            row.ConstantItem(220).AlignRight().Column(metaCol =>
            {
                metaCol.Item().Row(titleRow =>
                {
                    titleRow.RelativeItem().AlignRight().Text(labels.Invoice.ToUpperInvariant()).FontSize(16).Bold().FontColor("133827");
                });

                metaCol.Item().PaddingTop(2).Row(numRow =>
                {
                    numRow.RelativeItem().AlignRight().Background("F1F5F9").PaddingHorizontal(6).PaddingVertical(2).Text(invoiceNumber).FontSize(8f).Bold().FontColor("1E293B");
                });

                metaCol.Item().PaddingTop(3).Row(dateRow =>
                {
                    dateRow.RelativeItem().AlignRight().Text($"{labels.Issued}: {order.CreatedAt.ToString("dd MMM yyyy", culture)}").FontSize(7.5f).FontColor("64748B");
                });

                // Status Badge Pill
                metaCol.Item().PaddingTop(3).Row(badgeRow =>
                {
                    if (order.IsPaid)
                    {
                        badgeRow.RelativeItem().AlignRight().Background("ECFDF5").Border(1).BorderColor("A7F3D0")
                            .PaddingHorizontal(7).PaddingVertical(2)
                            .Text(labels.Paid.ToUpperInvariant()).FontSize(7f).Bold().FontColor("065F46");
                    }
                    else
                    {
                        badgeRow.RelativeItem().AlignRight().Background("FFFBEB").Border(1).BorderColor("FDE68A")
                            .PaddingHorizontal(7).PaddingVertical(2)
                            .Text(labels.PaymentPending.ToUpperInvariant()).FontSize(7f).Bold().FontColor("92400E");
                    }
                });
            });
        });
    }

    private void ComposeContent(
        IContainer container,
        Order order,
        string customerName,
        string customerEmail,
        string sellerName,
        Payment? payment,
        string currency,
        string bankAccountName,
        string bankIban,
        string bankBic,
        InvoiceLabels labels,
        CultureInfo culture)
    {
        container.Column(column =>
        {
            column.Spacing(12);

            // ── 1. Slim Address Cards ───────────────────────────────────────
            column.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Element(card => ComposeAddressCard(card, labels.From, new[]
                {
                    sellerName,
                    string.IsNullOrWhiteSpace(_options.SellerAddress) ? "Rotterdam, Netherlands" : _options.SellerAddress,
                    string.IsNullOrWhiteSpace(_options.SellerEmail) ? "info@printmy3d.work" : _options.SellerEmail,
                    _options.SellerPhone,
                    string.IsNullOrWhiteSpace(_options.VatNumber) ? string.Empty : $"VAT: {_options.VatNumber}"
                }));

                row.ConstantItem(12);

                row.RelativeItem().Element(card => ComposeAddressCard(card, labels.BillTo, new[]
                {
                    customerName,
                    customerEmail,
                    order.AddressLine1,
                    order.AddressLine2 ?? string.Empty,
                    $"{order.PostalCode} {order.City}".Trim(),
                    order.PhoneNumber
                }));
            });

            // ── 2. Slim Line Items Table ───────────────────────────────────
            column.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(5); // Description & details
                    columns.RelativeColumn(3); // Specs / Material
                    columns.ConstantColumn(40); // Qty
                    columns.ConstantColumn(65); // Unit
                    columns.ConstantColumn(70); // Amount
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCell).Text(labels.Description);
                    header.Cell().Element(HeaderCell).Text(labels.Specifications);
                    header.Cell().Element(HeaderCell).AlignRight().Text(labels.Quantity);
                    header.Cell().Element(HeaderCell).AlignRight().Text($"{labels.Unit} ({currency})");
                    header.Cell().Element(HeaderCell).AlignRight().Text($"{labels.Amount} ({currency})");
                });

                foreach (var item in order.Items)
                {
                    var quantity = item.Count <= 0 ? 1 : item.Count;
                    var name = string.IsNullOrWhiteSpace(item.fileName) ? item.FileUrl ?? "3D Print Model" : item.fileName;
                    var unitPrice = (decimal)(item.UnitPrice > 0 ? item.UnitPrice : item.Price);
                    var itemTotal = unitPrice * quantity;

                    // Specs summary
                    var specs = $"{item.Material} • {item.Color}";
                    if (!string.IsNullOrWhiteSpace(item.PrintQuality))
                    {
                        specs += $" • {item.PrintQuality}";
                    }

                    // Main Model Print Row
                    table.Cell().Element(BodyCell).Column(descCol =>
                    {
                        descCol.Item().Text(name).Bold().FontSize(8f).FontColor("0F172A");
                        if (!string.IsNullOrWhiteSpace(item.Size))
                        {
                            descCol.Item().Text(item.Size).FontSize(7f).FontColor("64748B");
                        }
                    });

                    table.Cell().Element(BodyCell).Text(specs).FontSize(7.5f).FontColor("334155");
                    table.Cell().Element(BodyCell).AlignRight().Text(quantity.ToString()).FontSize(8f).FontColor("0F172A");
                    table.Cell().Element(BodyCell).AlignRight().Text(unitPrice.ToString("F2", culture)).FontSize(8f).FontColor("0F172A");
                    table.Cell().Element(BodyCell).AlignRight().Text(itemTotal.ToString("F2", culture)).FontSize(8f).Bold().FontColor("0F172A");

                    // Plate Setup Row (Standardized ASCII bullet, strictly no missing glyphs)
                    if (item.PlateCost > 0)
                    {
                        var plateCost = (decimal)item.PlateCost;

                        table.Cell().Element(SubBodyCell).PaddingLeft(6).Column(plateCol =>
                        {
                            plateCol.Item().Text($"• {labels.PlateSetup}").SemiBold().FontSize(7.5f).FontColor("0F766E");
                            plateCol.Item().Text($"({name})").FontSize(7f).FontColor("64748B");
                        });

                        table.Cell().Element(SubBodyCell).Text("Calibration / Prep").FontSize(7.5f).FontColor("64748B");
                        table.Cell().Element(SubBodyCell).AlignRight().Text("1").FontSize(7.5f).FontColor("64748B");
                        table.Cell().Element(SubBodyCell).AlignRight().Text(plateCost.ToString("F2", culture)).FontSize(7.5f).FontColor("64748B");
                        table.Cell().Element(SubBodyCell).AlignRight().Text(plateCost.ToString("F2", culture)).FontSize(7.5f).FontColor("0F766E");
                    }
                }
            });

            // ── 3. Slim Financial Totals Block ─────────────────────────────
            column.Item().AlignRight().Width(240).Background("F7FBF9").Border(1).BorderColor("DCE7E2").Padding(8).Column(totals =>
            {
                AddTotalRow(totals, labels.Subtotal, order.SubtotalAmount, currency, culture, false);

                if (order.ServiceFeePrice > 0)
                    AddTotalRow(totals, labels.ServiceFee, order.ServiceFeePrice, currency, culture, false);

                if (order.DeliveryPrice > 0)
                    AddTotalRow(totals, labels.Delivery, order.DeliveryPrice, currency, culture, false);

                if (order.DiscountAmount > 0)
                    AddTotalRow(totals, labels.Discount, -order.DiscountAmount, currency, culture, true);

                totals.Item().PaddingTop(4).BorderTop(1.5f).BorderColor("133827").PaddingTop(4).Row(row =>
                {
                    row.RelativeItem().Text(labels.Total.ToUpperInvariant()).Bold().FontSize(10.5f).FontColor("133827");
                    row.ConstantItem(100).AlignRight().Text($"{order.FinalTotalAmount.ToString("F2", culture)} {currency}").Bold().FontSize(10.5f).FontColor("133827");
                });

                if (!string.IsNullOrWhiteSpace(_options.TaxLabel))
                {
                    totals.Item().PaddingTop(3).AlignRight().Text(_options.TaxLabel).FontSize(6.5f).FontColor("64748B");
                }
            });

            // ── 4. Payment & Bank Information (Slim Dual Cards) ────────────
            column.Item().Row(row =>
            {
                row.RelativeItem().Element(card => ComposePaymentCard(card, labels, order, payment));

                var hasBank = !string.IsNullOrWhiteSpace(bankIban) || !string.IsNullOrWhiteSpace(bankAccountName);
                if (hasBank)
                {
                    row.ConstantItem(12);
                    row.RelativeItem().Element(card => ComposeBankCard(
                        card,
                        labels,
                        bankAccountName,
                        bankIban,
                        bankBic,
                        payment?.Reference ?? $"PC-{order.Id.ToString("N")[..8].ToUpperInvariant()}"));
                }
            });
        });
    }

    private static void ComposeAddressCard(IContainer container, string title, IEnumerable<string> lines)
    {
        container.Background("F7FBF9").Border(1).BorderColor("DCE7E2").Padding(8).Column(col =>
        {
            col.Item().Text(title.ToUpperInvariant()).FontSize(7f).Bold().FontColor("0F766E");
            col.Item().PaddingTop(2);
            var activeLines = lines.Where(l => !string.IsNullOrWhiteSpace(l)).ToList();
            for (var i = 0; i < activeLines.Count; i++)
            {
                var line = activeLines[i].Trim();
                if (i == 0)
                {
                    col.Item().Text(line).FontSize(9f).Bold().FontColor("133827");
                }
                else
                {
                    col.Item().Text(line).FontSize(7.5f).FontColor("334155");
                }
            }
        });
    }

    private void ComposePaymentCard(IContainer container, InvoiceLabels labels, Order order, Payment? payment)
    {
        container.Background("F8FAFC").Border(1).BorderColor("E2E8F0").Padding(8).Column(col =>
        {
            col.Item().Text(labels.Payment.ToUpperInvariant()).FontSize(7f).Bold().FontColor("0F766E");
            col.Item().PaddingTop(3);

            col.Item().Row(r =>
            {
                r.RelativeItem().Text(labels.Method).FontSize(7.5f).FontColor("64748B");
                r.ConstantItem(110).AlignRight().Text(FormatPaymentMethod(order.PaymentFlow, labels)).FontSize(7.5f).Bold().FontColor("1E293B");
            });

            if (!string.IsNullOrWhiteSpace(payment?.Reference))
            {
                col.Item().Row(r =>
                {
                    r.RelativeItem().Text(labels.Reference).FontSize(7.5f).FontColor("64748B");
                    r.ConstantItem(110).AlignRight().Text(payment.Reference).FontSize(7.5f).Bold().FontColor("1E293B");
                });
            }

            col.Item().Row(r =>
            {
                r.RelativeItem().Text("Status").FontSize(7.5f).FontColor("64748B");
                r.ConstantItem(110).AlignRight().Text(order.IsPaid ? labels.Paid : labels.PaymentPending).FontSize(7.5f).Bold().FontColor(order.IsPaid ? "065F46" : "92400E");
            });

            if (!string.IsNullOrWhiteSpace(_options.PaymentTerms))
            {
                col.Item().PaddingTop(2).Text(_options.PaymentTerms).FontSize(6.5f).FontColor("64748B");
            }
        });
    }

    private static void ComposeBankCard(IContainer container, InvoiceLabels labels, string accountName, string iban, string bic, string reference)
    {
        container.Background("F0FDF4").Border(1).BorderColor("BBF7D0").Padding(8).Column(col =>
        {
            col.Item().Text(labels.BankDetails.ToUpperInvariant()).FontSize(7f).Bold().FontColor("047857");
            col.Item().PaddingTop(3);

            if (!string.IsNullOrWhiteSpace(accountName))
            {
                col.Item().Row(r =>
                {
                    r.AutoItem().Text(labels.AccountName).FontSize(7.5f).FontColor("475569");
                    r.RelativeItem().AlignRight().Text(accountName).FontSize(7.5f).Bold().FontColor("0F172A");
                });
            }

            if (!string.IsNullOrWhiteSpace(iban))
            {
                col.Item().Row(r =>
                {
                    r.AutoItem().Text(labels.Iban).FontSize(7.5f).FontColor("475569");
                    r.RelativeItem().AlignRight().Text(iban).FontSize(7.5f).Bold().FontColor("0F172A");
                });
            }

            if (!string.IsNullOrWhiteSpace(bic))
            {
                col.Item().Row(r =>
                {
                    r.AutoItem().Text(labels.Bic).FontSize(7.5f).FontColor("475569");
                    r.RelativeItem().AlignRight().Text(bic).FontSize(7.5f).FontColor("0F172A");
                });
            }

            if (!string.IsNullOrWhiteSpace(reference))
            {
                col.Item().PaddingTop(2).Row(r =>
                {
                    r.AutoItem().Text(labels.PaymentReferenceNote).FontSize(7f).FontColor("047857");
                    r.RelativeItem().AlignRight().Text(reference).FontSize(7.5f).Bold().FontColor("047857");
                });
            }
        });
    }

    private static void AddTotalRow(ColumnDescriptor column, string label, decimal amount, string currency, CultureInfo culture, bool isDiscount)
    {
        column.Item().Row(row =>
        {
            row.RelativeItem().Text(label).FontSize(7.5f).FontColor("475569");
            var formatted = isDiscount
                ? $"-{Math.Abs(amount).ToString("F2", culture)} {currency}"
                : $"{amount.ToString("F2", culture)} {currency}";

            row.ConstantItem(100).AlignRight().Text(formatted).FontSize(7.5f).SemiBold().FontColor(isDiscount ? "059669" : "1E293B");
        });
    }

    private static void ComposeFooter(IContainer container, string sellerName, InvoiceLabels labels)
    {
        container.BorderTop(1).BorderColor("E2ECE7").PaddingTop(6).Row(row =>
        {
            row.RelativeItem().Text(t =>
            {
                t.Span(sellerName).SemiBold().FontSize(7.5f).FontColor("133827");
                t.Span("  •  printmy3d.work  •  info@printmy3d.work").FontSize(7.5f).FontColor("64748B");
            });

            row.AutoItem().AlignRight().Text(t =>
            {
                t.Span($"{labels.Page} ").FontSize(7.5f).FontColor("64748B");
                t.CurrentPageNumber().FontSize(7.5f).FontColor("133827");
                t.Span(" / ").FontSize(7.5f).FontColor("64748B");
                t.TotalPages().FontSize(7.5f).FontColor("133827");
            });
        });
    }

    private static IContainer HeaderCell(IContainer container)
        => container.Background("133827").PaddingVertical(5).PaddingHorizontal(6)
            .DefaultTextStyle(style => style.FontColor("FFFFFF").FontSize(7.5f).Bold());

    private static IContainer BodyCell(IContainer container)
        => container.BorderBottom(1).BorderColor("EDF2EF").PaddingVertical(5).PaddingHorizontal(6);

    private static IContainer SubBodyCell(IContainer container)
        => container.BorderBottom(1).BorderColor("EDF2EF").Background("FBFDFD").PaddingVertical(4).PaddingHorizontal(6);

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
        string Specifications,
        string Quantity,
        string Unit,
        string Amount,
        string PlateSetup,
        string Subtotal,
        string ServiceFee,
        string Delivery,
        string Discount,
        string Total,
        string Payment,
        string Method,
        string Reference,
        string BankDetails,
        string AccountName,
        string Iban,
        string Bic,
        string PaymentReferenceNote,
        string BankTransfer,
        string OnlinePayment,
        string Page,
        string ThankYou)
    {
        public static InvoiceLabels For(string? language)
            => string.Equals(language, "nl", StringComparison.OrdinalIgnoreCase)
                ? new(
                    CultureInfo.GetCultureInfo("nl-NL"),
                    "Factuur",
                    "Datum",
                    "Betaald",
                    "Betaling in behandeling",
                    "Van",
                    "Factuuradres",
                    "Omschrijving",
                    "Specificaties",
                    "Aantal",
                    "Prijs",
                    "Bedrag",
                    "Plaat setup",
                    "Subtotaal",
                    "Servicekosten",
                    "Verzending",
                    "Korting",
                    "Totaal",
                    "Betaling",
                    "Betaalmethode",
                    "Referentie",
                    "Bankgegevens",
                    "Rekeninghouder",
                    "IBAN",
                    "BIC",
                    "Vermeld ref:",
                    "Bankoverschrijving",
                    "Online betaling",
                    "Pagina",
                    "Bedankt voor uw bestelling!")
                : new(
                    CultureInfo.GetCultureInfo("en-US"),
                    "Invoice",
                    "Date",
                    "Paid",
                    "Payment pending",
                    "From",
                    "Bill to",
                    "Description",
                    "Specifications",
                    "Qty",
                    "Unit Price",
                    "Total",
                    "Plate setup",
                    "Subtotal",
                    "Service fee",
                    "Delivery",
                    "Discount",
                    "Total Due",
                    "Payment",
                    "Method",
                    "Reference",
                    "Bank details",
                    "Account Name",
                    "IBAN",
                    "BIC",
                    "Include ref:",
                    "Bank transfer",
                    "Online payment",
                    "Page",
                    "Thank you for your business!");
    }
}
