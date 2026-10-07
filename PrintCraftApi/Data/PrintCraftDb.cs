using Microsoft.EntityFrameworkCore;
using PrintCraftApi.Models;

namespace PrintCraftApi.Data;

public class PrintCraftDb : DbContext
{
    public PrintCraftDb(DbContextOptions<PrintCraftDb> options) : base(options) { }

    // These represent the actual tables in your database
    public DbSet<User> Users => Set<User>();
    public DbSet<Filament> Filaments => Set<Filament>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<OrderCommunication> OrderCommunications => Set<OrderCommunication>();
    public DbSet<OrderNote> OrderNotes => Set<OrderNote>();
    public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderItemAttachment> OrderItemAttachments => Set<OrderItemAttachment>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<VisitEvent> VisitEvents => Set<VisitEvent>();
    public DbSet<ManualPaymentNotification> ManualPaymentNotifications => Set<ManualPaymentNotification>();
    public DbSet<QuoteDraft> QuoteDrafts => Set<QuoteDraft>();
    public DbSet<EmailTemplate> EmailTemplates => Set<EmailTemplate>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<OrderCommunication>()
            .HasIndex(c => new { c.OrderId, c.SentAt });

        modelBuilder.Entity<OrderCommunication>()
            .HasOne<Order>()
            .WithMany(o => o.Communications)
            .HasForeignKey(c => c.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderNote>()
            .HasIndex(n => new { n.OrderId, n.CreatedAt });

        modelBuilder.Entity<OrderNote>()
            .HasOne(n => n.Order)
            .WithMany(o => o.Notes)
            .HasForeignKey(n => n.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderStatusHistory>()
            .HasIndex(s => new { s.OrderId, s.ChangedAt });

        modelBuilder.Entity<OrderStatusHistory>()
            .HasOne<Order>()
            .WithMany(o => o.StatusHistory)
            .HasForeignKey(s => s.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItemAttachment>()
            .HasOne<OrderItem>()
            .WithMany(i => i.Attachments)
            .HasForeignKey(a => a.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItemAttachment>()
            .HasIndex(a => new { a.OrderItemId, a.Kind });

        modelBuilder.Entity<VisitEvent>()
            .HasIndex(v => v.VisitedAt);

        modelBuilder.Entity<VisitEvent>()
            .HasIndex(v => new { v.EventType, v.VisitedAt });

        modelBuilder.Entity<VisitEvent>()
            .HasIndex(v => new { v.VisitorKey, v.VisitedAt });

        modelBuilder.Entity<VisitEvent>()
            .HasIndex(v => new { v.CountryCode, v.VisitedAt });

        modelBuilder.Entity<Order>()
            .Property(o => o.PaymentFlow)
            .HasMaxLength(32)
            .HasDefaultValue("bank_transfer");

        modelBuilder.Entity<Order>()
            .Property(o => o.AgreementVersion)
            .HasMaxLength(32);

        modelBuilder.Entity<ManualPaymentNotification>()
            .HasIndex(n => new { n.OrderId, n.CreatedAt });

        modelBuilder.Entity<ManualPaymentNotification>()
            .HasOne<Order>()
            .WithMany()
            .HasForeignKey(n => n.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<QuoteDraft>().HasIndex(d => d.TokenHash).IsUnique();
        modelBuilder.Entity<QuoteDraft>().HasIndex(d => new { d.UserId, d.ExpiresAt });

        modelBuilder.Entity<Payment>()
            .HasIndex(p => new { p.OrderId, p.CreatedAt });

        modelBuilder.Entity<Payment>()
            .HasIndex(p => p.Reference)
            .IsUnique();

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Order)
            .WithMany(o => o.Payments)
            .HasForeignKey(p => p.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserAddress>()
            .HasOne(a => a.User)
            .WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<UserAddress>()
            .HasIndex(a => new { a.UserId, a.IsDefault });

        EmailTemplateSeeder.Seed(modelBuilder);
    }
}