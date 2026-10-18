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
    public DbSet<HeroSlide> HeroSlides => Set<HeroSlide>();
    public DbSet<OrderItemChangeRequest> OrderItemChangeRequests => Set<OrderItemChangeRequest>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<FaqTopic> FaqTopics => Set<FaqTopic>();
    public DbSet<City> Cities => Set<City>();

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

        modelBuilder.Entity<OrderItemChangeRequest>()
            .HasIndex(cr => new { cr.OrderItemId, cr.Status });

        modelBuilder.Entity<OrderItemChangeRequest>()
            .HasIndex(cr => new { cr.OrderId, cr.RequestedAt });

        modelBuilder.Entity<OrderItemChangeRequest>()
            .HasOne(cr => cr.OrderItem)
            .WithMany(i => i.ChangeRequests)
            .HasForeignKey(cr => cr.OrderItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<OrderItemChangeRequest>()
            .HasOne(cr => cr.Order)
            .WithMany()
            .HasForeignKey(cr => cr.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

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

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.Status);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.CreatedAt);

        modelBuilder.Entity<Order>()
            .HasIndex(o => o.UserId);

        modelBuilder.Entity<Order>()
            .HasIndex(o => new { o.UserId, o.CreatedAt });

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Filament>()
            .HasIndex(f => new { f.Material, f.Color });

        modelBuilder.Entity<OrderItem>()
            .HasIndex(i => i.OrderId);

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

        modelBuilder.Entity<HeroSlide>()
            .HasIndex(s => new { s.IsActive, s.SortOrder });

        modelBuilder.Entity<FaqItem>(entity =>
        {
            entity.HasIndex(e => new { e.IsActive, e.SortOrder });
            entity.Property(e => e.Question).HasJsonConversion();
            entity.Property(e => e.Answer).HasJsonConversion();
        });

        modelBuilder.Entity<FaqTopic>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => new { e.IsActive, e.SortOrder });
            entity.Property(e => e.Names).HasJsonConversion();
            entity.Property(e => e.Tagline).HasJsonConversion();
            entity.Property(e => e.Badge).HasJsonConversion();
            entity.Property(e => e.HeroTitle).HasJsonConversion();
            entity.Property(e => e.HeroSubtitle).HasJsonConversion();
            entity.Property(e => e.Description).HasJsonConversion();
            entity.Property(e => e.Benefits).HasJsonConversion();
            entity.Property(e => e.RecommendedMaterials).HasJsonConversion();
            entity.Property(e => e.MetaTitle).HasJsonConversion();
            entity.Property(e => e.MetaDescription).HasJsonConversion();
            entity.Property(e => e.MetaKeywords).HasJsonConversion();
            entity.Property(e => e.Faqs).HasJsonConversion();
        });

        modelBuilder.Entity<City>(entity =>
        {
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.HasIndex(e => new { e.IsActive, e.SortOrder });
            entity.Property(e => e.Names).HasJsonConversion();
        });

        EmailTemplateSeeder.Seed(modelBuilder);
        HeroSlideSeeder.Seed(modelBuilder);
        FilamentSeeder.Seed(modelBuilder);
    }
}