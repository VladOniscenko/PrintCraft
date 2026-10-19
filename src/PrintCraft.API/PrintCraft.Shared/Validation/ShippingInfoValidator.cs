using System.Text.RegularExpressions;

namespace PrintCraft.Shared.Validation;

public sealed class ShippingInfoValidationResult
{
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string AddressLine1 { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public Dictionary<string, string> Errors { get; } = new();
    public bool IsValid => Errors.Count == 0;
}

public static class ShippingInfoValidator
{
    private static readonly Regex NameRegex = new(@"^[\p{L}][\p{L}\p{M}\s'\.-]*$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new(@"^\+?[0-9\s().-]+$", RegexOptions.Compiled);
    private static readonly Regex AddressRegex = new(@"^[\p{L}\p{M}0-9\s,'\.\-/#]+$", RegexOptions.Compiled);
    private static readonly Regex CityRegex = new(@"^[\p{L}\p{M}\s'\.-]+$", RegexOptions.Compiled);
    private static readonly Regex PostalRegex = new(@"^[A-Za-z0-9][A-Za-z0-9\s-]{1,11}$", RegexOptions.Compiled);

    public static ShippingInfoValidationResult Validate(
        string? fullName,
        string? phoneNumber,
        string? addressLine1,
        string? city,
        string? postalCode)
    {
        var result = new ShippingInfoValidationResult
        {
            FullName = NormalizeWhitespace(fullName),
            PhoneNumber = NormalizePhone(phoneNumber),
            AddressLine1 = NormalizeWhitespace(addressLine1),
            City = NormalizeWhitespace(city),
            PostalCode = NormalizeWhitespace(postalCode).ToUpperInvariant()
        };

        if (string.IsNullOrWhiteSpace(result.FullName))
        {
            result.Errors["fullName"] = "Full name is required.";
        }
        else if (result.FullName.Length < 2 || result.FullName.Length > 100)
        {
            result.Errors["fullName"] = "Full name must be between 2 and 100 characters.";
        }
        else if (!NameRegex.IsMatch(result.FullName))
        {
            result.Errors["fullName"] = "Full name contains unsupported characters.";
        }

        if (string.IsNullOrWhiteSpace(phoneNumber))
        {
            result.Errors["phoneNumber"] = "Phone number is required.";
        }
        else if (!PhoneRegex.IsMatch(phoneNumber.Trim()))
        {
            result.Errors["phoneNumber"] = "Phone number format is invalid.";
        }
        else
        {
            var digits = Regex.Replace(phoneNumber, @"\D", string.Empty);
            if (digits.Length < 7 || digits.Length > 15)
            {
                result.Errors["phoneNumber"] = "Phone number must contain 7 to 15 digits.";
            }
        }

        if (string.IsNullOrWhiteSpace(result.AddressLine1))
        {
            result.Errors["addressLine1"] = "Address is required.";
        }
        else if (result.AddressLine1.Length < 5 || result.AddressLine1.Length > 120)
        {
            result.Errors["addressLine1"] = "Address must be between 5 and 120 characters.";
        }
        else if (!AddressRegex.IsMatch(result.AddressLine1))
        {
            result.Errors["addressLine1"] = "Address contains unsupported characters.";
        }

        if (string.IsNullOrWhiteSpace(result.City))
        {
            result.Errors["city"] = "City is required.";
        }
        else if (result.City.Length < 2 || result.City.Length > 80)
        {
            result.Errors["city"] = "City must be between 2 and 80 characters.";
        }
        else if (!CityRegex.IsMatch(result.City))
        {
            result.Errors["city"] = "City contains unsupported characters.";
        }

        if (string.IsNullOrWhiteSpace(result.PostalCode))
        {
            result.Errors["postalCode"] = "Postal code is required.";
        }
        else if (result.PostalCode.Length < 3 || result.PostalCode.Length > 12)
        {
            result.Errors["postalCode"] = "Postal code must be between 3 and 12 characters.";
        }
        else if (!PostalRegex.IsMatch(result.PostalCode))
        {
            result.Errors["postalCode"] = "Postal code format is invalid.";
        }

        return result;
    }

    private static string NormalizeWhitespace(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        return Regex.Replace(value.Trim(), @"\s+", " ");
    }

    private static string NormalizePhone(string? phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber)) return string.Empty;

        var trimmed = phoneNumber.Trim();
        var digits = Regex.Replace(trimmed, @"\D", string.Empty);
        if (digits.Length == 0) return string.Empty;

        return trimmed.StartsWith('+') ? $"+{digits}" : digits;
    }
}
