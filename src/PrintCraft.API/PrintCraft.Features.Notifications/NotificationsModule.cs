using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Notifications.Data;
using PrintCraft.Features.Notifications.Services;
using PrintCraft.Shared.Data;
using PrintCraft.Shared.Services;

namespace PrintCraft.Features.Notifications;

public static class NotificationsModule
{
    public static IServiceCollection AddNotificationsFeature(this IServiceCollection services, IConfiguration configuration, bool isSeedOnly = false)
    {
        PrintCraftDb.RegisterModelCustomizer(EmailTemplateSeeder.Seed);

        services.Configure<EmailOptions>(configuration.GetSection("Email"));
        services.AddSingleton<DiscordWebhookService>();

        if (!isSeedOnly)
        {
            services.AddSingleton<IBackgroundWebhookQueue, BackgroundWebhookQueue>();
            services.AddHostedService<BackgroundWebhookWorker>();
            services.AddSingleton<IDiscordWebhookService, QueuedDiscordWebhookService>();

            services.AddTransient<GmailSmtpEmailService>();
            services.AddSingleton<IBackgroundEmailQueue, BackgroundEmailQueue>();
            services.AddHostedService<BackgroundEmailWorker>();
            services.AddSingleton<IEmailService, QueuedEmailService>();
        }
        else
        {
            services.AddSingleton<IDiscordWebhookService, DiscordWebhookService>();
            services.AddTransient<IEmailService, GmailSmtpEmailService>();
        }

        return services;
    }
}

