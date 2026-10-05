namespace PrintCraftApi.Configuration;

public static class ApiEnvironment
{
    public static string ResolveName(string? environmentName) => environmentName?.Trim().ToLowerInvariant() switch
    {
        null or "" or "prod" or "production" => Environments.Production,
        "dev" or "development" => Environments.Development,
        "tst" or "test" => "Test",
        _ => throw new InvalidOperationException(
            "ASPNETCORE_ENVIRONMENT must be dev/Development, tst/Test, or prod/Production.")
    };
}