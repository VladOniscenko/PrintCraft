using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public static class EmailTemplateSeeder
{
  public static List<EmailTemplate> GetDefaultTemplates() => new()
    {
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            TemplateName = "ResetPassword",
            Subject = "Reset your PrintCraft password",
            Body = BuildCardHtmlTemplate(
                badgeText: "Security &bull; Account",
                heading: "Reset Your Password",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we received a request to reset your password. Click the button below to choose a new password. If you did not request this, you can safely ignore this email.",
                ctaText: "Reset My Password &rarr;",
                ctaUrlPlaceholder: "{{ResetLink}}",
                show3dRender: false
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            TemplateName = "QuoteRequested",
            Subject = "We received your quote request (Order #{{ShortOrderId}})",
            Body = BuildCardHtmlTemplate(
                badgeText: "Quote Received &bull; #{{ShortOrderId}}",
                heading: "Your 3D Files Are In Review",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we received your quote request for order #<strong>{{ShortOrderId}}</strong>. Our engineering team is reviewing your files, analyzing print geometry, and preparing your custom quote.",
                ctaText: "Check Order Status &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                show3dRender: true
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            TemplateName = "QuoteConfirmation",
            Subject = "Your quote for order #{{ShortOrderId}} is ready",
            Body = BuildCardHtmlTemplate(
                badgeText: "Quote Ready &bull; #{{ShortOrderId}}",
                heading: "Your Quote is Ready",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Please log in to your portal to review the specifications and securely complete payment.",
                ctaText: "Review Quote &amp; Pay &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                show3dRender: true,
                detailBoxHtml: "{{QuoteMessage}}"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000004"),
            TemplateName = "QuoteConfirmationBankTransfer",
            Subject = "Your quote for order #{{ShortOrderId}} is ready for review",
            Body = BuildCardHtmlTemplate(
                badgeText: "Bank Transfer &bull; #{{ShortOrderId}}",
                heading: "Your Quote is Ready for Review",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, good news! Your quote for order #<strong>{{ShortOrderId}}</strong> is ready. Payment Reference: <strong style=\"color: #133827; font-family: monospace;\">{{PaymentReference}}</strong>. Please review the quote and bank transfer instructions in your customer portal.",
                ctaText: "View Transfer Instructions &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                show3dRender: true,
                detailBoxHtml: "{{QuoteMessage}}"
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000005"),
            TemplateName = "OrderSentTracking",
            Subject = "Your order #{{ShortOrderId}} has shipped",
            Body = BuildCardHtmlTemplate(
                badgeText: "Shipped &bull; #{{ShortOrderId}}",
                heading: "Your 3D Part Has Shipped!",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, your order #<strong>{{ShortOrderId}}</strong> has been dispatched via PostNL! Tracking Number: <strong style=\"color: #133827; font-family: monospace;\">{{TrackingCode}}</strong>.",
                ctaText: "Track Your Shipment &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                show3dRender: true
            )
        },
        new EmailTemplate
        {
            Id = Guid.Parse("00000000-0000-0000-0000-000000000006"),
            TemplateName = "OrderPaid",
            Subject = "Payment confirmed for order #{{ShortOrderId}}",
            Body = BuildCardHtmlTemplate(
                badgeText: "Payment Received &bull; #{{ShortOrderId}}",
                heading: "Payment Received — Print Queued!",
                introParagraph: "Hi <strong>{{CustomerName}}</strong>, we successfully received your payment for order #<strong>{{ShortOrderId}}</strong>. Your 3D models have been scheduled for printing.",
                ctaText: "View Order Progress &rarr;",
                ctaUrlPlaceholder: "{{OrderUrl}}",
                show3dRender: true
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
          .Where(t => t.Id == def.Id || string.Equals(t.TemplateName.Trim(), def.TemplateName.Trim(), StringComparison.OrdinalIgnoreCase))
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
              || match.Body.Contains("3D CAD / Slicing Preview")
              || match.Body.Contains("&euro;{{Price}}")
              || match.Body.Contains("&euro;{{Amount}}")
              || match.Body.Contains("precision pricing"))
          {
            match.TemplateName = def.TemplateName;
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
      bool show3dRender = true,
      string? detailBoxHtml = null)
  {
    var renderBlock = show3dRender ? $$$"""
          <!-- 3D Render Viewport Container -->
          <tr>
            <td class="mobile-p-20" style="padding: 16px 40px 24px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background: radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%); border-radius: 12px; border: 1px solid #334155; box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 12px 24px -6px rgba(15, 23, 42, 0.3); overflow: hidden;">
                <tr>
                  <td align="center" style="padding: 28px 20px 28px 20px;">
                    <a href="{{OrderUrl}}" target="_blank" style="text-decoration: none; display: block;">
                      <img class="hero-image" src="{{RenderedImageUrl}}" alt="3D Render Preview for order #{{ShortOrderId}}" width="440" style="display: block; max-width: 100%; height: auto; max-height: 280px; object-fit: contain; margin: 0 auto; filter: drop-shadow(0 15px 25px rgba(0, 0, 0, 0.45));" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: rgba(15, 23, 42, 0.7); padding: 10px 16px; border-top: 1px solid rgba(255, 255, 255, 0.06); text-align: center;">
                    <span style="font-size: 12px; color: #94a3b8;">
                      Order Ref: <strong style="color: #f8fafc; font-family: monospace;">#{{ShortOrderId}}</strong> &bull; Click to inspect in 3D viewer
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        """ : "";


    var detailBlock = !string.IsNullOrWhiteSpace(detailBoxHtml) ? $$$"""
          <!-- Extra Details Box -->
          <tr>
            <td class="mobile-p-20" style="padding: 0 40px 16px 40px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; border-left: 4px solid #133827; padding: 14px 18px;">
                <tr>
                  <td style="font-size: 14px; line-height: 22px; color: #334155;">
                    {{{detailBoxHtml}}}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        """ : "";

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
              .hero-image { max-height: 220px !important; }
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
                    <td class="mobile-p-20 mobile-pt-24" style="padding: 32px 40px 12px 40px; text-align: center;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 16px auto;">
                        <tr>
                          <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 6px 16px; text-align: center;">
                            <span style="font-size: 12px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.8px;">
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

                  {{{renderBlock}}}

                  {{{detailBlock}}}

                  <!-- Primary Call to Action Button -->
                  <tr>
                    <td class="mobile-p-20" style="padding: 12px 40px 28px 40px; text-align: center;">
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                        <tr>
                          <td align="center" style="border-radius: 10px; background-color: #133827; box-shadow: 0 4px 14px rgba(19, 56, 39, 0.35);">
                            <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="display: inline-block; padding: 16px 36px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.3px; border: 1px solid #1c4f37;">
                              {{{ctaText}}}
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 14px 0 0 0; font-size: 12px; line-height: 18px; color: #94a3b8;">
                        Direct link: <a href="{{{ctaUrlPlaceholder}}}" target="_blank" style="color: #0f766e; text-decoration: underline; word-break: break-all;">{{{ctaUrlPlaceholder}}}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                      <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #475569;">
                        Questions about your 3D print or order specifications?
                      </p>
                      <p style="margin: 0 0 14px 0; font-size: 12px; color: #64748b; line-height: 18px;">
                        Reach out to our engineering team at <a href="mailto:info@printmy3d.work" style="color: #0f766e; text-decoration: none; font-weight: 600;">info@printmy3d.work</a>.
                      </p>
                      <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 16px;">
                        &copy; Print My 3D &bull; Precision Additive Manufacturing &bull; Rotterdam, NL
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
