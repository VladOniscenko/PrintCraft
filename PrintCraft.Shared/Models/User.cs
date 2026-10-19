namespace PrintCraft.Shared.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty; // Hashed password using bcrypt
    public string Role { get; set; } = "customer";
    public string PreferredLanguage { get; set; } = "en";

    public List<UserAddress> Addresses { get; set; } = new();
}