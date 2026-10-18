using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class EmailTemplateSeeder
{
    private enum CtaButtonStyle
    {
        Primary,
        Ghost,
        MassiveSecurity
    }

    public static List<EmailTemplate> GetDefaultTemplates() => new()
    {
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            TemplateName = "ResetPassword",
            Language = "en",
            Subject = "Reset your PrintCraft password",
            Body = BuildCardHtmlTemplate(
                badgeText: "Security &bull; Account",
                heading: "Reset Your Password",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we received a request to reset your password. Click the button below to choose a new password. If you did not request this, you can safely ignore this email.",
                ctaText: "Reset My Password &rarr;",
                ctaUrlPlaceholder: "{{ResetLink}}",
                badgeBg: "#f8fafc",
                badgeBorder: "#e2e8f0",
                badgeTextColor: "#334155",
                ctaStyle: CtaButtonStyle.MassiveSecurity,
                showDirectLink: false,
                ctaSubtitle: "This password reset link expires in 2 hours. If you did not request this, you can safely ignore this email."
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            TemplateName = "QuoteRequested",
            Language = "en",
            Subject = "We received your quote request (Order #{{ShortOrderId}})",
            Body = BuildCardHtmlTemplate(
                badgeText: "Quote Received &bull; #{{ShortOrderId}}",
                heading: "Your 3D Files Are In Review",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we received your quote request for order #<strong>{{ShortOrderId}}</strong>. Our engineering team is reviewing your files, analyzing print geometry, and preparing your custom quote.",
                ctaText: "Check Order Status &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#f1f5f9",
                badgeBorder: "#cbd5e1",
                badgeTextColor: "#475569",
                ctaStyle: CtaButtonStyle.Ghost
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            TemplateName = "QuoteConfirmation",
            Language = "en",
            Subject = "Your quote for order #{{ShortOrderId}} is ready",
            Body = BuildCardHtmlTemplate(
                badgeText: "Quote Ready &bull; #{{ShortOrderId}}",
                heading: "Your Quote is Ready",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Please log in to your portal to review the specifications and securely complete payment.",
                ctaText: "Review Quote &amp; Pay &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#ecfdf5",
                badgeBorder: "#a7f3d0",
                badgeTextColor: "#047857",
                detailBoxHtml: "{{QuoteMessage}}"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            TemplateName = "QuoteConfirmationBankTransfer",
            Language = "en",
            Subject = "Your quote for order #{{ShortOrderId}} is ready for review",
            Body = BuildCardHtmlTemplate(
                badgeText: "Bank Transfer &bull; #{{ShortOrderId}}",
                heading: "Your Quote is Ready for Review",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Payment Reference: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Please review the quote and bank transfer instructions in your customer portal.",
                ctaText: "View Transfer Instructions &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#fffbeb",
                badgeBorder: "#fde68a",
                badgeTextColor: "#b45309",
                highlightBoxHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border-radius: 10px; border: 2px solid #059669; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          Payment Reference (Include with Transfer)
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #133827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{PaymentReference}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """,
                detailBoxHtml: "{{QuoteMessage}}"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
            TemplateName = "OrderSentTracking",
            Language = "en",
            Subject = "Your order #{{ShortOrderId}} has shipped",
            Body = BuildCardHtmlTemplate(
                badgeText: "Shipped &bull; #{{ShortOrderId}}",
                heading: "Your 3D Part Has Shipped!",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, your order #<strong>{{ShortOrderId}}</strong> has been dispatched via PostNL! Tracking Number: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ctaText: "Track Your Shipment &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#eff6ff",
                badgeBorder: "#bfdbfe",
                badgeTextColor: "#1d4ed8",
                highlightBoxHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; border: 1.5px dashed #cbd5e1; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          PostNL Tracking Number
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{TrackingCode}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000006"),
            TemplateName = "OrderPaid",
            Language = "en",
            Subject = "Payment confirmed for order #{{ShortOrderId}}",
            Body = BuildCardHtmlTemplate(
                badgeText: "Payment Received &bull; #{{ShortOrderId}}",
                heading: "Payment Received — Print Queued!",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we successfully received your payment for order #<strong>{{ShortOrderId}}</strong>. Your 3D models have been scheduled for printing.",
                ctaText: "View Order Progress &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#ecfdf5",
                badgeBorder: "#a7f3d0",
                badgeTextColor: "#047857",
                heroIconHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                    <tr>
                      <td align="center" style="width: 56px; height: 56px; background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 50%; text-align: center; vertical-align: middle;">
                        <span style="font-size: 28px; line-height: 56px; color: #059669; font-weight: bold; display: block;">&#10003;</span>
                      </td>
                    </tr>
                  </table>
                """
            )
        },

        // Dutch (NL) Translations
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000011"),
            TemplateName = "ResetPassword",
            Language = "nl",
            Subject = "Stel je PrintCraft wachtwoord opnieuw in",
            Body = BuildCardHtmlTemplate(
                badgeText: "Beveiliging &bull; Account",
                heading: "Wachtwoord Opnieuw Instellen",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, we hebben een verzoek ontvangen om je wachtwoord opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord te kiezen. Als je dit niet hebt aangevraagd, kun je deze e-mail veilig negeren.",
                ctaText: "Wachtwoord Opnieuw Instellen &rarr;",
                ctaUrlPlaceholder: "{{ResetLink}}",
                badgeBg: "#f8fafc",
                badgeBorder: "#e2e8f0",
                badgeTextColor: "#334155",
                ctaStyle: CtaButtonStyle.MassiveSecurity,
                showDirectLink: false,
                ctaSubtitle: "Deze link voor het opnieuw instellen van je wachtwoord verloopt over 2 uur. Als je dit niet hebt aangevraagd, is er geen actie vereist.",
                footerQuestions: "Vragen over je account of wachtwoord?",
                footerContact: "Neem contact op met ons team via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000012"),
            TemplateName = "QuoteRequested",
            Language = "nl",
            Subject = "We hebben je offerteaanvraag ontvangen (Bestelling #{{ShortOrderId}})",
            Body = BuildCardHtmlTemplate(
                badgeText: "Offerte Ontvangen &bull; #{{ShortOrderId}}",
                heading: "Je 3D-bestanden worden beoordeeld",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, we hebben je offerteaanvraag ontvangen voor bestelling #<strong>{{ShortOrderId}}</strong>. Ons engineeringteam beoordeelt je bestanden, analyseert de printgeometrie en stelt je offerte op maat samen.",
                ctaText: "Bestelstatus Bekijken &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#f1f5f9",
                badgeBorder: "#cbd5e1",
                badgeTextColor: "#475569",
                ctaStyle: CtaButtonStyle.Ghost,
                directLinkText: "Directe link:",
                footerQuestions: "Vragen over je 3D-print of bestelspecificaties?",
                footerContact: "Neem contact op met ons engineeringteam via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000013"),
            TemplateName = "QuoteConfirmation",
            Language = "nl",
            Subject = "Je offerte voor bestelling #{{ShortOrderId}} is gereed",
            Body = BuildCardHtmlTemplate(
                badgeText: "Offerte Gereed &bull; #{{ShortOrderId}}",
                heading: "Je Offerte is Gereed",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, goed nieuws! Je offerte voor bestelling #<strong>{{ShortOrderId}}</strong> is gereed. Log in op je portaal om de specificaties te bekijken en de betaling veilig te voltooien.",
                ctaText: "Offerte Bekijken &amp; Betalen &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#ecfdf5",
                badgeBorder: "#a7f3d0",
                badgeTextColor: "#047857",
                detailBoxTitle: "Opmerking van het engineeringteam",
                detailBoxHtml: "{{QuoteMessage}}",
                directLinkText: "Directe link:",
                footerQuestions: "Vragen over je 3D-print of bestelspecificaties?",
                footerContact: "Neem contact op met ons engineeringteam via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000014"),
            TemplateName = "QuoteConfirmationBankTransfer",
            Language = "nl",
            Subject = "Je offerte voor bestelling #{{ShortOrderId}} is gereed voor beoordeling",
            Body = BuildCardHtmlTemplate(
                badgeText: "Bankoverschrijving &bull; #{{ShortOrderId}}",
                heading: "Je Offerte is Gereed voor Beoordeling",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, goed nieuws! Je offerte voor bestelling #<strong>{{ShortOrderId}}</strong> is gereed. Betalingskenmerk: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Bekijk de offerte en overschrijvingsinstructies in je klantportaal.",
                ctaText: "Overschrijvingsinstructies Bekijken &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#fffbeb",
                badgeBorder: "#fde68a",
                badgeTextColor: "#b45309",
                highlightBoxHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ecfdf5; border-radius: 10px; border: 2px solid #059669; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #065f46; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          Betalingskenmerk (Vermelden bij overschrijving)
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #133827; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{PaymentReference}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """,
                detailBoxTitle: "Opmerking van het engineeringteam",
                detailBoxHtml: "{{QuoteMessage}}",
                directLinkText: "Directe link:",
                footerQuestions: "Vragen over je 3D-print of bestelspecificaties?",
                footerContact: "Neem contact op met ons engineeringteam via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000015"),
            TemplateName = "OrderSentTracking",
            Language = "nl",
            Subject = "Je bestelling #{{ShortOrderId}} is verzonden",
            Body = BuildCardHtmlTemplate(
                badgeText: "Verzonden &bull; #{{ShortOrderId}}",
                heading: "Je 3D-print is Verzonden!",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, je bestelling #<strong>{{ShortOrderId}}</strong> is verzonden via PostNL! Track & Trace code: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ctaText: "Volg Je Zending &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#eff6ff",
                badgeBorder: "#bfdbfe",
                badgeTextColor: "#1d4ed8",
                highlightBoxHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 10px; border: 1.5px dashed #cbd5e1; text-align: center; padding: 18px 20px;">
                    <tr>
                      <td align="center">
                        <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 6px;">
                          PostNL Track & Trace Nummer
                        </div>
                        <div style="font-size: 22px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; letter-spacing: 2px;">
                          {{TrackingCode}}
                        </div>
                      </td>
                    </tr>
                  </table>
                """,
                directLinkText: "Directe link:",
                footerQuestions: "Vragen over je 3D-print of bestelspecificaties?",
                footerContact: "Neem contact op met ons engineeringteam via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000016"),
            TemplateName = "OrderPaid",
            Language = "nl",
            Subject = "Betaling bevestigd voor bestelling #{{ShortOrderId}}",
            Body = BuildCardHtmlTemplate(
                badgeText: "Betaling Ontvangen &bull; #{{ShortOrderId}}",
                heading: "Betaling Ontvangen — Print Ingewilligd!",
                introParagraph: "Hallo <strong>{{CustomerName}}</strong>, we hebben je betaling voor bestelling #<strong>{{ShortOrderId}}</strong> succesvol ontvangen. Je 3D-modellen zijn ingepland voor productie.",
                ctaText: "Voortgang Bekijken &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                badgeBg: "#ecfdf5",
                badgeBorder: "#a7f3d0",
                badgeTextColor: "#047857",
                heroIconHtml: """
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 12px auto;">
                    <tr>
                      <td align="center" style="width: 56px; height: 56px; background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 50%; text-align: center; vertical-align: middle;">
                        <span style="font-size: 28px; line-height: 56px; color: #059669; font-weight: bold; display: block;">&#10003;</span>
                      </td>
                    </tr>
                  </table>
                """,
                directLinkText: "Directe link:",
                footerQuestions: "Vragen over je 3D-print of bestelspecificaties?",
                footerContact: "Neem contact op met ons engineeringteam via",
                footerCompany: "&copy; Print My 3D &bull; Precisie Additive Manufacturing &bull; Rotterdam, NL"
            )
        }
    };

    public static void Seed(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<EmailTemplate>().HasData(GetDefaultTemplates());
    }

    /// <summary>
    /// Ensures database has default email templates if the table is empty or missing templates.
    /// </summary>
    public static async Task<SeederResult> EnsureDatabaseSeededAsync(PrintCraftDb db, bool forceReload = false)
    {
        var defaults = GetDefaultTemplates();
        var existing = await db.EmailTemplates.ToListAsync();
        var result = new SeederResult { TotalBefore = existing.Count };

        if (existing.Count == 0)
        {
            await db.EmailTemplates.AddRangeAsync(defaults);
            await db.SaveChangesAsync();
            result.Inserted = defaults.Count;
            result.TotalAfter = defaults.Count;
            return result;
        }

        foreach (var def in defaults)
        {
            var matches = existing
                .Where(t => t.Id == def.Id || (string.Equals(t.TemplateName.Trim(), def.TemplateName.Trim(), StringComparison.OrdinalIgnoreCase) && string.Equals(t.Language?.Trim() ?? "en", def.Language.Trim(), StringComparison.OrdinalIgnoreCase)))
                .ToList();

            if (matches.Count == 0)
            {
                await db.EmailTemplates.AddAsync(def);
                result.Inserted++;
            }
            else
            {
                foreach (var match in matches)
                {
                    if (forceReload
                        || !string.Equals(match.Subject, def.Subject, StringComparison.Ordinal)
                        || !string.Equals(match.Body, def.Body, StringComparison.Ordinal)
                        || !string.Equals(match.Language, def.Language, StringComparison.OrdinalIgnoreCase)
                        || match.Body.Contains("3D CAD / Slicing Preview")
                        || match.Body.Contains("RenderedImageUrl")
                        || match.Body.Contains("3D Render")
                        || match.Body.Contains("3D viewer")
                        || match.Body.Contains("&euro;{{Price}}")
                        || match.Body.Contains("&euro;{{Amount}}")
                        || match.Body.Contains("precision pricing"))
                    {
                        match.TemplateName = def.TemplateName;
                        match.Language = def.Language;
                        match.Subject = def.Subject;
                        match.Body = def.Body;
                        db.Entry(match).State = EntityState.Modified;
                        result.Updated++;
                    }
                }
            }
        }

        if (result.Inserted > 0 || result.Updated > 0)
        {
            await db.SaveChangesAsync();
        }

        result.TotalAfter = await db.EmailTemplates.CountAsync();
        return result;
    }

    private static string BuildCardHtmlTemplate(
        string badgeText,
        string heading,
        string introParagraph,
        string ctaText,
        string ctaUrlPlaceholder = "{{OrderUrl}}",
        string? badgeBg = null,
        string? badgeBorder = null,
        string? badgeTextColor = null,
        string? heroIconHtml = null,
        string? highlightBoxHtml = null,
        string? detailBoxHtml = null,
        CtaButtonStyle ctaStyle = CtaButtonStyle.Primary,
        bool showDirectLink = true,
        string? ctaSubtitle = null,
        string? detailBoxTitle = null,
        string? directLinkText = null,
        string? footerQuestions = null,
        string? footerContact = null,
        string? footerCompany = null)
    {
        badgeBg ??= "#ecfdf5";
        badgeBorder ??= "#a7f3d0";
        badgeTextColor ??= "#047857";
        detailBoxTitle ??= "Engineering Team Note";
        directLinkText ??= "Direct link:";
        footerQuestions ??= "Questions about your 3D print or order specifications?";
        footerContact ??= "Reach out to our engineering team at";
        footerCompany ??= "&copy; Print My 3D &bull; Precision Additive Manufacturing &bull; Rotterdam, NL";

        var iconBlock = !string.IsNullOrWhiteSpace(heroIconHtml) ? $$$"""
          <!-- Hero Icon Section -->
          <tr>
            <td align="center" style="padding-bottom: 8px;">
              {{{heroIconHtml}}}
            </td>
          </tr>
        """ : "";

        var highlightBlock = !string.IsNullOrWhiteSpace(highlightBoxHtml) ? $$$"""
          <!-- Highlight Callout Box -->
          <tr>
            <td class="mobile-p-20" style="padding: 4px 40px 20px 40px;">
              {{{highlightBoxHtml}}}
            </td>
          </tr>
        """ : "";

        var detailBlock = !string.IsNullOrWhiteSpace(detailBoxHtml) ? $$$"""
          <!-- Extra Details / Engineering Note Box -->
          <tr>
            <td class="mobile-p-20" style="padding: 0 40px 20px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #133827; padding: 14px 18px;">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px;">
                      {{{detailBoxTitle}}}
                    </div>
                    <div style="font-size: 14px; line-height: 22px; color: #334155; font-style: italic;">
                      {{{detailBoxHtml}}}
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        """ : "";

        string ctaButtonMarkup = ctaStyle switch
        {
            CtaButtonStyle.Ghost => $$$"""
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #ffffff; border: 1.5px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);">
                    <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #334155; text-decoration: none; border-radius: 10px; letter-spacing: 0.2px;">
                      {{{ctaText}}}
                    </a>
                  </td>
                </tr>
              </table>
            """,
            CtaButtonStyle.MassiveSecurity => $$$"""
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 440px; margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #133827; box-shadow: 0 4px 14px rgba(19, 56, 39, 0.35);">
                    <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="display: block; padding: 18px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px; border: 1px solid #1c4f37; text-align: center;">
                      {{{ctaText}}}
                    </a>
                  </td>
                </tr>
              </table>
            """,
            _ => $$$"""
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 10px; background-color: #133827; box-shadow: 0 4px 14px rgba(19, 56, 39, 0.35);">
                    <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px; border: 1px solid #1c4f37;">
                      {{{ctaText}}}
                    </a>
                  </td>
                </tr>
              </table>
            """
        };

        string ctaFooterMarkup;
        if (!string.IsNullOrWhiteSpace(ctaSubtitle))
        {
            ctaFooterMarkup = $$$"""
              <p style="margin: 14px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8; text-align: center;">
                {{{ctaSubtitle}}}
              </p>
            """;
        }
        else if (showDirectLink)
        {
            ctaFooterMarkup = $$$"""
              <p style="margin: 14px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                {{{directLinkText}}} <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="color: #0f766e; text-decoration: underline; word-break: break-all;">{{{ctaUrlPlaceholder}}}</a>
              </p>
            """;
        }
        else
        {
            ctaFooterMarkup = "";
        }

        return $$$"""
        <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
        <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
        <head>
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="x-apple-disable-message-reformatting" />
          <title>{{{heading}}}</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
          <style type="text/css">
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
            body { margin: 0; padding: 0; width: 100% !important; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            @media only screen and (max-width: 620px) {
              .email-container { width: 100% !important; max-width: 100% !important; }
              .mobile-p-20 { padding-left: 20px !important; padding-right: 20px !important; }
              .mobile-pt-24 { padding-top: 24px !important; }
              .meta-column { display: block !important; width: 100% !important; padding-bottom: 12px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f1f5f9; color: #1e293b;">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; table-layout: fixed;">
            <tr>
              <td align="center" style="padding: 40px 16px 40px 16px;">
                <table role="presentation" class="email-container" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04); overflow: hidden;">
                  
                  <!-- Brand Header with Logo -->
                  <tr>
                    <td align="center" style="padding: 32px 32px 20px 32px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-bottom: 1px solid #f1f5f9;">
                      <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="text-decoration: none; display: inline-block;">
                        <img src="{{LogoUrl}}" alt="Print My 3D" width="160" height="42" style="display: block; max-width: 180px; height: auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #133827; letter-spacing: -0.5px;" />
                      </a>
                    </td>
                  </tr>

                  <!-- Status Badge & Greeting Section -->
                  <tr>
                    <td class="mobile-p-20 mobile-pt-24" style="padding: 32px 40px 16px 40px; text-align: center;">
                      {{{iconBlock}}}
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                        <tr>
                          <td style="background-color: {{{badgeBg}}}; border: 1px solid {{{badgeBorder}}}; border-radius: 9999px; padding: 6px 16px; text-align: center;">
                            <span style="font-size: 12px; font-weight: 700; color: {{{badgeTextColor}}}; text-transform: uppercase; letter-spacing: 0.8px;">
                              {{{badgeText}}}
                            </span>
                          </td>
                        </tr>
                      </table>
                      <h1 style="margin: 0 0 12px 0; font-size: 24px; line-height: 32px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">
                        {{{heading}}}
                      </h1>
                      <p style="margin: 0; font-size: 15px; line-height: 24px; color: #475569;">
                        {{{introParagraph}}}
                      </p>
                    </td>
                  </tr>

                  {{{highlightBlock}}}

                  {{{detailBlock}}}

                  <!-- Action Area (CTA) -->
                  <tr>
                    <td class="mobile-p-20" style="padding: 12px 40px 32px 40px; text-align: center;">
                      {{{ctaButtonMarkup}}}
                      {{{ctaFooterMarkup}}}
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #475569;">
                        {{{footerQuestions}}}
                      </p>
                      <p style="margin: 0 0 14px 0; font-size: 12px; color: #64748b; line-height: 18px;">
                        {{{footerContact}}} <a href="mailto:info@printmy3d.work" style="color: #0f766e; text-decoration: none; font-weight: 600;">info@printmy3d.work</a>.
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                        {{{footerCompany}}}
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """;
    }
}
