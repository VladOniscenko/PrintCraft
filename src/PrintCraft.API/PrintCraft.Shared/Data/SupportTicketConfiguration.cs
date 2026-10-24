using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PrintCraft.Shared.Models;

namespace PrintCraft.Shared.Data;

public class SupportTicketConfiguration : IEntityTypeConfiguration<SupportTicket>
{
    public void Configure(EntityTypeBuilder<SupportTicket> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.UserEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.Subject)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.Description)
            .IsRequired();

        builder.Property(t => t.Category)
            .HasConversion<string>()
            .HasMaxLength(64);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(64);

        builder.Property(t => t.AttachmentUrls)
            .HasJsonConversion();

        builder.HasIndex(t => t.Status);
        builder.HasIndex(t => t.CreatedAt);
        builder.HasIndex(t => t.UserId);
        builder.HasIndex(t => t.OrderId);

        builder.HasOne(t => t.User)
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(t => t.Order)
            .WithMany()
            .HasForeignKey(t => t.OrderId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

