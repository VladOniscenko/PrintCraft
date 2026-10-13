using System;

namespace PrintCraftApi.Models
{
    public class AutoForgeJob
    {
        public Guid Id { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Processing, Complete, Failed
        public string? FilePath { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}

