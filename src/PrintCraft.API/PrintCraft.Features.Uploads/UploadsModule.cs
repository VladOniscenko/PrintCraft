using Microsoft.Extensions.DependencyInjection;
using PrintCraft.Features.Uploads.Services;

namespace PrintCraft.Features.Uploads;

public static class UploadsModule
{
    public static IServiceCollection AddUploadsFeature(this IServiceCollection services, bool isSeedOnly = false)
    {
        if (!isSeedOnly)
        {
            services.AddHostedService<UploadCleanupBackgroundService>();
        }

        return services;
    }
}

