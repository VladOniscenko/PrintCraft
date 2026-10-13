using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace AutoForgeTest
{
    class Program
    {
        static void Main(string[] args)
        {
            var config = new { ArgumentsTemplate = "--input_image \"{0}\" --json_file \"{1}\" --stl_output_size {2} --layer_height {3}" };
            string imagePath = "img.png";
            string[] colors = new[] { "Red", "Blue" };
            string size = "200";
            string quality = "0.16mm";
            string outputDir = "/tmp";

            string layerHeightStr = Regex.Match(quality ?? "", @"\d+(\.\d+)?").Value;
            if (string.IsNullOrEmpty(layerHeightStr)) layerHeightStr = "0.16"; 

            var filamentsList = new List<object>();
            foreach (var color in colors ?? Array.Empty<string>())
            {
                filamentsList.Add(new
                {
                    Brand = "Generic",
                    Color = GetHexForColor(color),
                    Name = color,
                    Owned = true,
                    Transmissivity = 3.0,
                    Type = "PLA",
                    uuid = Guid.NewGuid().ToString()
                });
            }

            var jsonObj = new { Filaments = filamentsList };
            var jsonOptions = new JsonSerializerOptions { WriteIndented = true };
            string jsonFilePath = Path.Combine(outputDir, $"filaments_{Guid.NewGuid()}.json");
            File.WriteAllText(jsonFilePath, JsonSerializer.Serialize(jsonObj, jsonOptions));

            Console.WriteLine("JSON Output:");
            Console.WriteLine(File.ReadAllText(jsonFilePath));

            var template = config.ArgumentsTemplate;
            if (template.Contains("--image"))
            {
                template = "--input_image \"{0}\" --json_file \"{1}\" --stl_output_size {2} --layer_height {3}";
            }

            var arguments = string.Format(template, imagePath, jsonFilePath, size, layerHeightStr);
            arguments += $" --output_folder \"{outputDir}\"";

            Console.WriteLine("CLI Arguments:");
            Console.WriteLine(arguments);
        }

        private static string GetHexForColor(string colorName)
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "red", "#ff0000" },
                { "blue", "#0000ff" },
            };
            return map.TryGetValue(colorName.Trim(), out string hex) ? hex : "#ffffff";
        }
    }
}
