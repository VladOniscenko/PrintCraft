using Microsoft.Extensions.DependencyInjection;

namespace PrintCraft.Features.Users;

public static class UsersModule
{
    public static IServiceCollection AddUsersFeature(this IServiceCollection services)
    {
        return services;
    }
}

