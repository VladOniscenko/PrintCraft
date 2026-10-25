using PrintCraft.Shared.Models;
using PrintCraft.Features.Orders.Models;
using PrintCraft.Shared.Orders;

namespace PrintCraft.Features.Orders.Services;

/// <summary>
/// Maps Order domain entities into unified, comprehensive OrderDetailsDto
/// for the Admin Order Details dashboard (Epic 10).
/// </summary>
public static class OrderDetailsMapper
{
    public static OrderDetailsDto MapToDetailsDto(Order order, string customerEmail, string? preferredLanguage = null)
    {
        var normalizedStatus = OrderStatus.Normalize(order.Status);
        var files = ExtractFiles(order);
        var items = (order.Items ?? new List<OrderItem>())
            .Select(item => MapItem(item))
            .ToList();
        var timeline = BuildTimeline(order);
        var allowedTransitions = GetAllowedTransitions(normalizedStatus, order.IsPaid);

        var subtotal = order.SubtotalAmount;
        var discount = order.DiscountAmount;
        var finalTotal = order.QuotedPrice ?? order.FinalTotalAmount;
        var resolvedLanguage = !string.IsNullOrWhiteSpace(preferredLanguage)
            ? preferredLanguage
            : (!string.IsNullOrWhiteSpace(order.Language) ? order.Language : "en");

        return new OrderDetailsDto
        {
            Id = order.Id,
            Language = !string.IsNullOrWhiteSpace(order.Language) ? order.Language : resolvedLanguage,
            Status = order.Status,
            NormalizedStatus = normalizedStatus,
            IsPaid = order.IsPaid,
            HoldReason = order.HoldReason,
            FlaggedForRefundReview = order.FlaggedForRefundReview,
            AllowedTransitions = allowedTransitions,

            Customer = new OrderCustomerDetailsDto
            {
                UserId = order.UserId,
                FullName = order.FullName,
                Email = customerEmail,
                PhoneNumber = order.PhoneNumber,
                AddressLine1 = order.AddressLine1,
                AddressLine2 = order.AddressLine2,
                City = order.City,
                PostalCode = order.PostalCode,
                PreferredLanguage = resolvedLanguage,
            },

            FullName = order.FullName,
            CustomerEmail = customerEmail,
            PhoneNumber = order.PhoneNumber,
            AddressLine1 = order.AddressLine1,
            AddressLine2 = order.AddressLine2,
            City = order.City,
            PostalCode = order.PostalCode,

            Items = items,
            Files = files,

            OrderType = order.OrderType,
            PaymentFlow = order.PaymentFlow,
            IsExpress = order.IsExpress,
            RequestType = order.RequestType ?? "StandardUpload",
            DeliveryPrice = order.DeliveryPrice,
            ServiceFeePrice = order.ServiceFeePrice,
            OrderDiscountAmount = order.OrderDiscountAmount,
            QuotedPrice = order.QuotedPrice,
            SubtotalAmount = subtotal,
            ExpressFeeAmount = order.ExpressFeeAmount,
            DiscountAmount = discount,
            FinalTotalAmount = finalTotal,
            QuoteMessage = order.QuoteMessage,
            QuoteConfirmedAt = order.QuoteConfirmedAt,
            QuoteExpiresAt = order.QuoteExpiresAt,
            InternalNotes = order.InternalNotes,
            CustomerNotes = order.CustomerNotes,

            TrackingCode = order.TrackingCode,
            TrackingUrl = order.TrackingUrl,

            Timeline = timeline,

            Payments = (order.Payments ?? new List<Payment>())
                .Select(p => new OrderPaymentDetailsDto
                {
                    Id = p.Id,
                    OrderId = p.OrderId,
                    Provider = p.Provider,
                    Reference = p.Reference,
                    Currency = p.Currency,
                    Amount = p.Amount,
                    Status = p.Status,
                    Method = p.Method,
                    PaidAt = p.PaidAt,
                    CreatedAt = p.CreatedAt,
                })
                .OrderByDescending(p => p.CreatedAt)
                .ToList(),

            Notes = (order.Notes ?? new List<OrderNote>())
                .Select(n => new AdminOrderNoteDto
                {
                    Id = n.Id,
                    OrderId = n.OrderId,
                    Content = n.Content,
                    Visibility = n.Visibility,
                    CreatedBy = n.CreatedBy,
                    CreatedAt = n.CreatedAt,
                })
                .OrderByDescending(n => n.CreatedAt)
                .ToList(),

            StatusHistory = (order.StatusHistory ?? new List<OrderStatusHistory>())
                .Select(sh => new AdminOrderStatusHistoryDto
                {
                    Id = sh.Id,
                    OrderId = sh.OrderId,
                    PreviousStatus = sh.PreviousStatus,
                    NewStatus = sh.NewStatus,
                    ChangedAt = sh.ChangedAt,
                    ChangedBy = sh.ChangedBy,
                    Note = sh.Note,
                })
                .OrderByDescending(sh => sh.ChangedAt)
                .ToList(),

            Communications = (order.Communications ?? new List<OrderCommunication>())
                .Select(c => new AdminOrderCommunicationDto
                {
                    Id = c.Id,
                    OrderId = c.OrderId,
                    Channel = c.Channel,
                    CommunicationType = c.CommunicationType,
                    Subject = c.Subject,
                    RecipientEmail = c.RecipientEmail,
                    SentAt = c.SentAt,
                })
                .OrderByDescending(c => c.SentAt)
                .ToList(),

            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
        };
    }

    private static AdminOrderItemDto MapItem(OrderItem item)
    {
        var itemFiles = new List<OrderFileAssetDto>();
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var attachments = (item.Attachments ?? new List<OrderItemAttachment>())
            .Select(a =>
            {
                var url = a.Url.Trim();
                if (seenUrls.Add(url))
                {
                    var ext = Path.GetExtension(a.FileName)?.ToLowerInvariant() ?? "";
                    var is3D = ext is ".stl" or ".step" or ".stp" or ".obj" or ".3mf" or ".glb" or ".gltf";
                    var kind = !string.IsNullOrWhiteSpace(a.Kind) && a.Kind != "other"
                        ? a.Kind
                        : (is3D ? "model" : (ext is ".png" or ".jpg" or ".jpeg" or ".webp" or ".gif" ? "image" : "other"));

                    var (role, label) = ClassifyFileRole(a.FileName, url, kind, ext);

                    itemFiles.Add(new OrderFileAssetDto
                    {
                        Id = a.Id.ToString(),
                        ItemId = item.Id,
                        FileName = string.IsNullOrWhiteSpace(a.FileName) ? "attachment" : a.FileName,
                        FileUrl = url,
                        DownloadUrl = url,
                        Kind = kind,
                        Role = role,
                        Label = label,
                        Extension = ext,
                        Is3DModel = is3D,
                        Size = item.Size,
                        Material = item.Material,
                        Color = item.Color,
                    });
                }

                return new OrderItemAttachmentDto
                {
                    Id = a.Id,
                    OrderItemId = a.OrderItemId,
                    Url = a.Url,
                    FileName = a.FileName,
                    Kind = a.Kind,
                };
            })
            .ToList();

        if (!string.IsNullOrWhiteSpace(item.FileUrl))
        {
            var url = item.FileUrl.Trim();
            if (seenUrls.Add(url))
            {
                var fName = string.IsNullOrWhiteSpace(item.fileName) ? "model" : item.fileName.Trim();
                var cleanUrl = url.Split('?', '#')[0];
                var ext = Path.GetExtension(fName)?.ToLowerInvariant() ?? Path.GetExtension(cleanUrl)?.ToLowerInvariant() ?? "";
                if (string.IsNullOrWhiteSpace(ext)) ext = Path.GetExtension(cleanUrl)?.ToLowerInvariant() ?? "";
                var is3D = ext is ".stl" or ".step" or ".stp" or ".obj" or ".3mf" or ".glb" or ".gltf";
                var kind = is3D ? "model" : "other";
                var (role, label) = ClassifyFileRole(fName, url, kind, ext);

                itemFiles.Add(new OrderFileAssetDto
                {
                    Id = $"item_file_{item.Id}",
                    ItemId = item.Id,
                    FileName = fName,
                    FileUrl = url,
                    DownloadUrl = url,
                    Kind = kind,
                    Role = role,
                    Label = label,
                    Extension = ext,
                    Is3DModel = is3D,
                    Size = item.Size,
                    Material = item.Material,
                    Color = item.Color,
                });
            }
        }

        if (!string.IsNullOrWhiteSpace(item.ImageUrl))
        {
            var url = item.ImageUrl.Trim();
            if (seenUrls.Add(url))
            {
                var ext = Path.GetExtension(url)?.ToLowerInvariant() ?? "";
                var (role, label) = ClassifyFileRole("Source Image", url, "image", ext);
                itemFiles.Add(new OrderFileAssetDto
                {
                    Id = $"item_img_{item.Id}",
                    ItemId = item.Id,
                    FileName = "preview",
                    FileUrl = url,
                    DownloadUrl = url,
                    Kind = "image",
                    Role = role,
                    Label = label,
                    Extension = ext,
                    Is3DModel = false,
                    Size = item.Size,
                    Material = item.Material,
                    Color = item.Color,
                });
            }
        }

        return new AdminOrderItemDto
        {
            Id = item.Id,
            OrderId = item.OrderId,
            FileUrl = item.FileUrl,
            ImageUrl = item.ImageUrl,
            FileName = item.fileName,
            Notes = item.Notes,
            Size = item.Size,
            Material = item.Material,
            Color = item.Color,
            Count = item.Count <= 0 ? 1 : item.Count,
            Price = item.Price,
            UnitPrice = item.UnitPrice > 0 ? item.UnitPrice : item.Price,
            PlateCost = item.PlateCost,
            EstimatedPrintTime = item.EstimatedPrintTime,
            FilamentUsedGrams = item.FilamentUsedGrams,
            ScaleFactor = item.ScaleFactor <= 0 ? 1.0 : item.ScaleFactor,
            InfillPercent = item.InfillPercent <= 0 ? 20 : item.InfillPercent,
            PrintQuality = string.IsNullOrWhiteSpace(item.PrintQuality) ? "Standard (0.20mm)" : item.PrintQuality,
            SupportsNeeded = item.SupportsNeeded,
            Attachments = attachments,
            Files = itemFiles,
            ActiveChangeRequest = (item.ChangeRequests ?? new List<OrderItemChangeRequest>())
                .Where(cr => cr.Status == "pending_customer" || cr.Status == "revision_submitted")
                .OrderByDescending(cr => cr.RequestedAt)
                .Select(cr => MapChangeRequest(cr))
                .FirstOrDefault(),
            ChangeRequests = (item.ChangeRequests ?? new List<OrderItemChangeRequest>())
                .OrderByDescending(cr => cr.RequestedAt)
                .Select(cr => MapChangeRequest(cr))
                .ToList(),
        };
    }


    public static List<OrderFileAssetDto> ExtractFiles(Order order)
    {
        var files = new List<OrderFileAssetDto>();
        var seenUrls = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        if (order.Items == null) return files;

        foreach (var item in order.Items)
        {
            if (item.Attachments != null)
            {
                foreach (var att in item.Attachments)
                {
                    if (string.IsNullOrWhiteSpace(att.Url)) continue;
                    var url = att.Url.Trim();
                    if (!seenUrls.Add(url)) continue;

                    var ext = Path.GetExtension(att.FileName)?.ToLowerInvariant() ?? "";
                    var is3D = ext is ".stl" or ".step" or ".stp" or ".obj" or ".3mf" or ".glb" or ".gltf";
                    var kind = !string.IsNullOrWhiteSpace(att.Kind) && att.Kind != "other"
                        ? att.Kind
                        : (is3D ? "model" : (ext is ".png" or ".jpg" or ".jpeg" or ".webp" or ".gif" ? "image" : "other"));

                    var (role, label) = ClassifyFileRole(att.FileName, url, kind, ext);

                    files.Add(new OrderFileAssetDto
                    {
                        Id = att.Id.ToString(),
                        ItemId = item.Id,
                        FileName = string.IsNullOrWhiteSpace(att.FileName) ? "Attachment" : att.FileName,
                        FileUrl = url,
                        DownloadUrl = url,
                        Kind = kind,
                        Role = role,
                        Label = label,
                        Extension = ext,
                        Is3DModel = is3D,
                        Size = item.Size,
                        Material = item.Material,
                        Color = item.Color,
                    });
                }
            }

            if (!string.IsNullOrWhiteSpace(item.FileUrl))
            {
                var url = item.FileUrl.Trim();
                if (seenUrls.Add(url))
                {
                    var fName = string.IsNullOrWhiteSpace(item.fileName) ? "Model File" : item.fileName.Trim();
                    var cleanUrl = url.Split('?', '#')[0];
                    var ext = Path.GetExtension(fName)?.ToLowerInvariant() ?? Path.GetExtension(cleanUrl)?.ToLowerInvariant() ?? "";
                    if (string.IsNullOrWhiteSpace(ext)) ext = Path.GetExtension(cleanUrl)?.ToLowerInvariant() ?? "";
                    var is3D = ext is ".stl" or ".step" or ".stp" or ".obj" or ".3mf" or ".glb" or ".gltf";
                    var kind = is3D ? "model" : "other";
                    var (role, label) = ClassifyFileRole(fName, url, kind, ext);

                    files.Add(new OrderFileAssetDto
                    {
                        Id = $"item_file_{item.Id}",
                        ItemId = item.Id,
                        FileName = fName,
                        FileUrl = url,
                        DownloadUrl = url,
                        Kind = kind,
                        Role = role,
                        Label = label,
                        Extension = ext,
                        Is3DModel = is3D,
                        Size = item.Size,
                        Material = item.Material,
                        Color = item.Color,
                    });
                }
            }

            if (!string.IsNullOrWhiteSpace(item.ImageUrl))
            {
                var url = item.ImageUrl.Trim();
                if (seenUrls.Add(url))
                {
                    var ext = Path.GetExtension(url)?.ToLowerInvariant() ?? "";
                    var (role, label) = ClassifyFileRole("Source Image", url, "image", ext);
                    files.Add(new OrderFileAssetDto
                    {
                        Id = $"item_img_{item.Id}",
                        ItemId = item.Id,
                        FileName = "Preview Image",
                        FileUrl = url,
                        DownloadUrl = url,
                        Kind = "image",
                        Role = role,
                        Label = label,
                        Extension = ext,
                        Is3DModel = false,
                        Size = item.Size,
                        Material = item.Material,
                        Color = item.Color,
                    });
                }
            }
        }

        return files;
    }

    public static (string Role, string Label) ClassifyFileRole(string? fileName, string url, string kind, string ext)
    {
        var cleanExt = (ext ?? "").ToLowerInvariant();
        var cleanName = (fileName ?? "").ToLowerInvariant();

        if (cleanExt is ".glb" or ".gltf" || cleanName.Contains("preview"))
        {
            return ("preview", "Web Preview (.glb)");
        }

        if (cleanExt is ".3mf" or ".stl" or ".obj" or ".step" or ".stp" or ".zip" || cleanName.Contains("production"))
        {
            var extLabel = string.IsNullOrWhiteSpace(cleanExt) ? "" : $" ({cleanExt.TrimStart('.')})";
            return ("production", $"Production File{extLabel}");
        }

        if (kind == "image" || cleanExt is ".png" or ".jpg" or ".jpeg" or ".webp" or ".gif" || cleanName.Contains("source"))
        {
            return ("source", "Source File (2D Image)");
        }

        return ("other", "Attachment");
    }

    public static List<OrderTimelineEventDto> BuildTimeline(Order order)
    {
        var events = new List<OrderTimelineEventDto>();

        if (order.StatusHistory != null)
        {
            foreach (var sh in order.StatusHistory)
            {
                var newStatusLabel = FormatStatusLabel(sh.NewStatus);
                events.Add(new OrderTimelineEventDto
                {
                    Id = $"sh_{sh.Id}",
                    Type = "status_change",
                    Timestamp = sh.ChangedAt,
                    Title = $"Status changed to {newStatusLabel}",
                    Content = sh.Note,
                    Author = sh.ChangedBy ?? "System",
                    Visibility = "system",
                    Metadata = new Dictionary<string, string?>
                    {
                        ["previousStatus"] = sh.PreviousStatus,
                        ["newStatus"] = sh.NewStatus,
                        ["changedBy"] = sh.ChangedBy,
                    }
                });
            }
        }

        if (order.Communications != null)
        {
            foreach (var c in order.Communications)
            {
                events.Add(new OrderTimelineEventDto
                {
                    Id = $"comm_{c.Id}",
                    Type = "email",
                    Timestamp = c.SentAt,
                    Title = $"Email Sent: {c.Subject}",
                    Content = $"Recipient: {c.RecipientEmail} ({c.CommunicationType})",
                    Author = c.Channel,
                    Visibility = "customer",
                    Metadata = new Dictionary<string, string?>
                    {
                        ["subject"] = c.Subject,
                        ["recipientEmail"] = c.RecipientEmail,
                        ["channel"] = c.Channel,
                        ["communicationType"] = c.CommunicationType,
                    }
                });
            }
        }

        if (order.Notes != null)
        {
            foreach (var n in order.Notes)
            {
                var isCustomer = string.Equals(n.Visibility, "customer", StringComparison.OrdinalIgnoreCase);
                events.Add(new OrderTimelineEventDto
                {
                    Id = $"note_{n.Id}",
                    Type = "note",
                    Timestamp = n.CreatedAt,
                    Title = isCustomer ? "Customer Note" : "Internal Admin Note",
                    Content = n.Content,
                    Author = n.CreatedBy ?? (isCustomer ? "Customer" : "Admin"),
                    Visibility = n.Visibility,
                    Metadata = new Dictionary<string, string?>
                    {
                        ["noteId"] = n.Id.ToString(),
                        ["visibility"] = n.Visibility,
                    }
                });
            }
        }

        // Legacy CustomerNotes fallback
        if (!string.IsNullOrWhiteSpace(order.CustomerNotes) &&
            !(order.Notes?.Any(n => string.Equals(n.Visibility, "customer", StringComparison.OrdinalIgnoreCase) && n.Content == order.CustomerNotes) ?? false))
        {
            events.Add(new OrderTimelineEventDto
            {
                Id = "legacy_customer_note",
                Type = "note",
                Timestamp = order.CreatedAt,
                Title = "Customer Order Submission Note",
                Content = order.CustomerNotes,
                Author = order.FullName,
                Visibility = "customer",
                Metadata = new Dictionary<string, string?>
                {
                    ["visibility"] = "customer",
                    ["legacy"] = "true",
                }
            });
        }

        // Legacy InternalNotes fallback
        if (!string.IsNullOrWhiteSpace(order.InternalNotes) &&
            !(order.Notes?.Any(n => string.Equals(n.Visibility, "internal", StringComparison.OrdinalIgnoreCase) && n.Content == order.InternalNotes) ?? false))
        {
            events.Add(new OrderTimelineEventDto
            {
                Id = "legacy_internal_note",
                Type = "note",
                Timestamp = order.CreatedAt,
                Title = "Internal Note",
                Content = order.InternalNotes,
                Author = "Admin",
                Visibility = "internal",
                Metadata = new Dictionary<string, string?>
                {
                    ["visibility"] = "internal",
                    ["legacy"] = "true",
                }
            });
        }

        if (order.Items != null)
        {
            foreach (var item in order.Items)
            {
                if (item.ChangeRequests == null) continue;
                foreach (var cr in item.ChangeRequests)
                {
                    events.Add(new OrderTimelineEventDto
                    {
                        Id = $"cr_req_{cr.Id}",
                        Type = "change_request",
                        Timestamp = cr.RequestedAt,
                        Title = $"Changes Requested: {item.fileName ?? "3D Model"}",
                        Content = $"[{FormatReasonCategory(cr.ReasonCategory)}] {cr.AdminNotes}",
                        Author = cr.RequestedBy ?? "Admin",
                        Visibility = "customer",
                        Metadata = new Dictionary<string, string?>
                        {
                            ["changeRequestId"] = cr.Id.ToString(),
                            ["orderItemId"] = item.Id.ToString(),
                            ["reasonCategory"] = cr.ReasonCategory,
                            ["requiresNewFile"] = cr.RequiresNewFile.ToString(),
                        }
                    });

                    if (cr.SubmittedAt.HasValue)
                    {
                        events.Add(new OrderTimelineEventDto
                        {
                            Id = $"cr_sub_{cr.Id}",
                            Type = "revision_submitted",
                            Timestamp = cr.SubmittedAt.Value,
                            Title = $"Revision Submitted: {item.fileName ?? "3D Model"}",
                            Content = !string.IsNullOrWhiteSpace(cr.CustomerNotes) ? cr.CustomerNotes : $"Updated file uploaded: {cr.SubmittedFileName ?? "file"}",
                            Author = "Customer",
                            Visibility = "customer",
                            Metadata = new Dictionary<string, string?>
                            {
                                ["changeRequestId"] = cr.Id.ToString(),
                                ["orderItemId"] = item.Id.ToString(),
                                ["submittedFileUrl"] = cr.SubmittedFileUrl,
                                ["submittedFileName"] = cr.SubmittedFileName,
                            }
                        });
                    }

                    if (cr.ResolvedAt.HasValue && cr.Status == "resolved")
                    {
                        events.Add(new OrderTimelineEventDto
                        {
                            Id = $"cr_res_{cr.Id}",
                            Type = "change_resolved",
                            Timestamp = cr.ResolvedAt.Value,
                            Title = $"Revision Accepted: {item.fileName ?? "3D Model"}",
                            Content = cr.ResolutionNotes ?? "Model changes accepted by admin.",
                            Author = cr.ResolvedBy ?? "Admin",
                            Visibility = "customer",
                            Metadata = new Dictionary<string, string?>
                            {
                                ["changeRequestId"] = cr.Id.ToString(),
                                ["orderItemId"] = item.Id.ToString(),
                            }
                        });
                    }
                }
            }
        }

        return events.OrderByDescending(e => e.Timestamp).ToList();
    }


    public static List<string> GetAllowedTransitions(string currentStatus, bool isPaid)
    {
        var allowed = new List<string>();
        var norm = OrderStatus.Normalize(currentStatus);

        // OnHold
        if (norm != OrderStatus.Shipped && norm != OrderStatus.Cancelled && norm != OrderStatus.Returned && norm != OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.OnHold);
        }

        // Cancelled
        if (norm == OrderStatus.QuoteRequested || norm == OrderStatus.AwaitingPayment || norm == OrderStatus.ReadyToPrint || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.Cancelled);
        }

        // Returned
        if (norm == OrderStatus.Shipped)
        {
            allowed.Add(OrderStatus.Returned);
        }

        // AwaitingPayment
        if (norm == OrderStatus.QuoteRequested || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.AwaitingPayment);
        }

        // ReadyToPrint
        if ((norm == OrderStatus.AwaitingPayment && isPaid) || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.ReadyToPrint);
        }

        // Printing
        if (norm == OrderStatus.ReadyToPrint || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.Printing);
        }

        // PostProcessing
        if (norm == OrderStatus.Printing || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.PostProcessing);
        }

        // Shipped
        if (norm == OrderStatus.PostProcessing || norm == OrderStatus.OnHold)
        {
            allowed.Add(OrderStatus.Shipped);
        }

        return allowed;
    }

    private static string FormatStatusLabel(string? status)
    {
        var norm = OrderStatus.Normalize(status);
        return norm switch
        {
            OrderStatus.QuoteRequested => "Quote Requested",
            OrderStatus.AwaitingPayment => "Awaiting Payment",
            OrderStatus.ReadyToPrint => "Ready to Print",
            OrderStatus.Printing => "Printing",
            OrderStatus.PostProcessing => "Post-Processing",
            OrderStatus.Shipped => "Shipped",
            OrderStatus.OnHold => "On Hold",
            OrderStatus.Cancelled => "Cancelled",
            OrderStatus.Returned => "Returned",
            _ => string.IsNullOrWhiteSpace(status) ? "Unknown" : status,
        };
    }

    private static string FormatReasonCategory(string? reason)
    {
        return (reason ?? "").ToLowerInvariant() switch
        {
            "broken_geometry" => "Broken Geometry / Non-Manifold",
            "wall_thickness" => "Wall Thickness Issue",
            "scale_or_size" => "Scale / Dimensions Issue",
            "unsupported_format" => "Unsupported Format",
            "orientation" => "Orientation / Support Issue",
            _ => "Changes Requested",
        };
    }

    private static OrderItemChangeRequestDto MapChangeRequest(OrderItemChangeRequest cr)
    {
        return new OrderItemChangeRequestDto
        {
            Id = cr.Id,
            OrderItemId = cr.OrderItemId,
            OrderId = cr.OrderId,
            Status = cr.Status,
            ReasonCategory = cr.ReasonCategory,
            AdminNotes = cr.AdminNotes,
            RequiresNewFile = cr.RequiresNewFile,
            RequestedBy = cr.RequestedBy,
            RequestedAt = cr.RequestedAt,
            PreviousFileUrl = cr.PreviousFileUrl,
            PreviousFileName = cr.PreviousFileName,
            SubmittedFileUrl = cr.SubmittedFileUrl,
            SubmittedFileName = cr.SubmittedFileName,
            CustomerNotes = cr.CustomerNotes,
            SubmittedAt = cr.SubmittedAt,
            ResolvedBy = cr.ResolvedBy,
            ResolutionNotes = cr.ResolutionNotes,
            ResolvedAt = cr.ResolvedAt,
        };
    }
}


