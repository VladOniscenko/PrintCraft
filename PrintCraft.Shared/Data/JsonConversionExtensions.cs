using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace PrintCraft.Shared.Data;

public static class JsonConversionExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public static PropertyBuilder<T> HasJsonConversion<T>(this PropertyBuilder<T> builder) where T : class, new()
    {
        var converter = new ValueConverter<T, string>(
            v => JsonSerializer.Serialize(v, JsonOptions),
            v => string.IsNullOrWhiteSpace(v) ? new T() : JsonSerializer.Deserialize<T>(v, JsonOptions) ?? new T()
        );

        var comparer = new ValueComparer<T>(
            (c1, c2) => JsonSerializer.Serialize(c1, JsonOptions) == JsonSerializer.Serialize(c2, JsonOptions),
            c => c == null ? 0 : JsonSerializer.Serialize(c, JsonOptions).GetHashCode(),
            c => c == null ? new T() : JsonSerializer.Deserialize<T>(JsonSerializer.Serialize(c, JsonOptions), JsonOptions)!
        );

        builder.HasConversion(converter);
        builder.Metadata.SetValueConverter(converter);
        builder.Metadata.SetValueComparer(comparer);
        return builder;
    }
}
