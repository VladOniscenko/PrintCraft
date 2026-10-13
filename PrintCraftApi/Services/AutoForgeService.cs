using System;
using System.Diagnostics;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Xml.Linq;

namespace PrintCraftApi.Services
{
    public class AutoForgeConfig
    {
        public string AutoForgeExecutable { get; set; } = "autoforge";
        public string ArgumentsTemplate { get; set; } = "--input_image \"{0}\" --json_file \"{1}\" --stl_output_size {2} --layer_height {3} --iterations 10 --processing_reduction_factor 16 --no-visualize --fast_pruning --no-pixel_height_refine --no-stack_search --no-plateau_refine";
    }

    public class AutoForgeResult
    {
        public string StlPath { get; set; } = string.Empty;
        public List<double> ZHeights { get; set; } = new List<double>();
    }

    /// <summary>
    /// Parsed STL mesh data: deduplicated vertices and triangle indices.
    /// </summary>
    public class StlMeshData
    {
        public List<(float X, float Y, float Z)> Vertices { get; set; } = new();
        public List<(int V1, int V2, int V3)> Triangles { get; set; } = new();

        // Bounding box
        public float MinX { get; set; } = float.MaxValue;
        public float MinY { get; set; } = float.MaxValue;
        public float MinZ { get; set; } = float.MaxValue;
        public float MaxX { get; set; } = float.MinValue;
        public float MaxY { get; set; } = float.MinValue;
        public float MaxZ { get; set; } = float.MinValue;

        public float CenterX => (MinX + MaxX) / 2f;
        public float CenterY => (MinY + MaxY) / 2f;

        public void UpdateBounds(float x, float y, float z)
        {
            if (x < MinX) MinX = x;
            if (y < MinY) MinY = y;
            if (z < MinZ) MinZ = z;
            if (x > MaxX) MaxX = x;
            if (y > MaxY) MaxY = y;
            if (z > MaxZ) MaxZ = z;
        }
    }

    public class AutoForgeService
    {
        private readonly AutoForgeConfig _config;

        public AutoForgeService(AutoForgeConfig config)
        {
            _config = config ?? new AutoForgeConfig();
        }

        public async Task<string> Generate3MfAsync(
            string imagePath,
            string[] colors,
            string size,
            string quality,
            string template3mfPath)
        {
            var tempDir = Path.Combine(Path.GetTempPath(), "AutoForge_" + Guid.NewGuid().ToString());
            Directory.CreateDirectory(tempDir);

            try
            {
                // 1. Run AutoForge → produces STL + z-heights text
                var result = await RunAutoForgeAsync(imagePath, colors, size, quality, tempDir);

                // 2. Extract template .3mf
                var templateUnzipPath = Path.Combine(tempDir, "template_unzipped");
                ZipFile.ExtractToDirectory(template3mfPath, templateUnzipPath);

                // 3. Convert STL → 3MF .model XML and update all metadata
                Replace3DModel(templateUnzipPath, result.StlPath);

                // 4. Update filament colors in project_settings.config
                UpdateFilamentColors(templateUnzipPath, colors);

                // 5. Zip back up
                var output3mfPath = Path.Combine(Path.GetTempPath(), $"AutoForgeOutput_{Guid.NewGuid()}.3mf");
                ZipFile.CreateFromDirectory(templateUnzipPath, output3mfPath);

                return output3mfPath;
            }
            finally
            {
                if (Directory.Exists(tempDir))
                {
                    Directory.Delete(tempDir, true);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // Color name → hex lookup (unchanged)
        // ─────────────────────────────────────────────────────────────
        private string GetHexForColor(string colorName)
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "red", "#FF0000" },
                { "blue", "#0000FF" },
                { "green", "#00FF00" },
                { "yellow", "#FFFF00" },
                { "black", "#000000" },
                { "white", "#FFFFFF" },
                { "dark gray", "#404040" },
                { "dark grey", "#404040" },
                { "light gray", "#C0C0C0" },
                { "light grey", "#C0C0C0" },
                { "orange", "#FFA500" },
                { "purple", "#800080" },
                { "cyan", "#00FFFF" },
                { "magenta", "#FF00FF" },
                { "grey", "#808080" },
                { "gray", "#808080" },
                { "brown", "#A52A2A" },
                { "pink", "#FFC0CB" },
                { "beige", "#F5F5DC" },
                { "navy", "#000080" },
                { "teal", "#008080" },
                { "maroon", "#800000" },
                { "olive", "#808000" },
                { "silver", "#C0C0C0" },
                { "gold", "#FFD700" },
            };

            var trimmed = colorName.Trim();

            // If it's already a hex code, return as-is (uppercased)
            if (trimmed.StartsWith("#") && (trimmed.Length == 7 || trimmed.Length == 4))
                return trimmed.ToUpperInvariant();

            return map.TryGetValue(trimmed, out string? hex) ? hex : "#FFFFFF";
        }

        // ─────────────────────────────────────────────────────────────
        // RunAutoForgeAsync (unchanged logic)
        // ─────────────────────────────────────────────────────────────
        private async Task<AutoForgeResult> RunAutoForgeAsync(string imagePath, string[] colors, string size, string quality, string outputDir)
        {
            string layerHeightStr = Regex.Match(quality ?? "", @"\d+(\.\d+)?").Value;
            if (string.IsNullOrEmpty(layerHeightStr)) layerHeightStr = "0.16"; // Default fallback

            string stlSizeStr = Regex.Match(size ?? "", @"\d+").Value;
            if (string.IsNullOrEmpty(stlSizeStr)) stlSizeStr = "200"; // Default fallback

            var jsonBuilder = new StringBuilder();
            jsonBuilder.AppendLine("{");
            jsonBuilder.AppendLine("  \"Filaments\": [");
            var safeColors = colors ?? Array.Empty<string>();
            for (int i = 0; i < safeColors.Length; i++)
            {
                var color = safeColors[i];
                jsonBuilder.AppendLine("    {");
                jsonBuilder.AppendLine("      \"Brand\": \"Generic\",");
                jsonBuilder.AppendLine($"      \"Color\": \"{GetHexForColor(color)}\",");
                jsonBuilder.AppendLine($"      \"Name\": \"{color}\",");
                jsonBuilder.AppendLine("      \"Owned\": true,");
                jsonBuilder.AppendLine("      \"Transmissivity\": 3.0,");
                jsonBuilder.AppendLine("      \"Type\": \"PLA\",");
                jsonBuilder.AppendLine($"      \"uuid\": \"{Guid.NewGuid()}\"");
                if (i < safeColors.Length - 1)
                    jsonBuilder.AppendLine("    },");
                else
                    jsonBuilder.AppendLine("    }");
            }
            jsonBuilder.AppendLine("  ]");
            jsonBuilder.AppendLine("}");

            string jsonFilePath = Path.Combine(outputDir, $"filaments_{Guid.NewGuid()}.json");
            File.WriteAllText(jsonFilePath, jsonBuilder.ToString());

            try
            {
                var template = _config.ArgumentsTemplate;
                if (template.Contains("--image ") || template.StartsWith("--image") || template.Contains("--colors"))
                {
                    template = template.Replace("--image ", "--input_image ")
                                       .Replace("--image=", "--input_image=")
                                       .Replace("--colors ", "--json_file ")
                                       .Replace("--colors=", "--json_file=")
                                       .Replace("--size ", "--stl_output_size ")
                                       .Replace("--size=", "--stl_output_size=")
                                       .Replace("--quality ", "--layer_height ")
                                       .Replace("--quality=", "--layer_height=");
                }

                var arguments = string.Format(template, imagePath, jsonFilePath, stlSizeStr, layerHeightStr);

                double parsedLh = 0.16;
                double.TryParse(layerHeightStr, NumberStyles.Any, CultureInfo.InvariantCulture, out parsedLh);
                double bgHeight = Math.Round(parsedLh * 3.0, 2);

                arguments += $" --output_folder \"{outputDir}\" --background_height {bgHeight.ToString(CultureInfo.InvariantCulture)}";

                var processStartInfo = new ProcessStartInfo
                {
                    FileName = _config.AutoForgeExecutable,
                    Arguments = arguments,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WorkingDirectory = outputDir
                };

                using var process = new Process { StartInfo = processStartInfo };
                process.Start();

                string output = await process.StandardOutput.ReadToEndAsync();
                string error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode != 0)
                {
                    throw new Exception($"AutoForge failed: {error}");
                }

                var stlFiles = Directory.GetFiles(outputDir, "*.stl");
                if (stlFiles.Length == 0)
                {
                    throw new Exception("AutoForge did not produce an STL file.");
                }

                var result = new AutoForgeResult
                {
                    StlPath = stlFiles[0]
                };

                // Parse Z-heights from stdout or from a .txt file AutoForge may produce
                var txtFiles = Directory.GetFiles(outputDir, "*.txt");
                if (txtFiles.Length > 0)
                {
                    var content = File.ReadAllText(txtFiles[0]);
                    result.ZHeights = ParseZHeights(content);
                }
                else
                {
                    result.ZHeights = ParseZHeights(output);
                }

                return result;
            }
            finally
            {
                if (File.Exists(jsonFilePath))
                {
                    File.Delete(jsonFilePath);
                }
            }
        }

        private List<double> ParseZHeights(string text)
        {
            var heights = new List<double>();
            var regex = new Regex(@"(?:z(?:-height)?[^\d]*?|swap[^\d]*?|layer[^\d]*?)(\d+\.\d+)", RegexOptions.IgnoreCase);
            var matches = regex.Matches(text);
            foreach (Match match in matches)
            {
                if (double.TryParse(match.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out double height))
                {
                    heights.Add(height);
                }
            }
            return heights.Distinct().OrderBy(h => h).ToList();
        }

        // ─────────────────────────────────────────────────────────────
        // STL PARSING (ASCII + Binary)
        // ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Parse an STL file (ASCII or binary) into deduplicated vertices and triangle indices.
        /// </summary>
        private StlMeshData ParseStl(string stlPath)
        {
            var bytes = File.ReadAllBytes(stlPath);

            // Quick heuristic: ASCII STL starts with "solid"
            bool isAscii = bytes.Length > 5 &&
                           bytes[0] == 's' && bytes[1] == 'o' && bytes[2] == 'l' &&
                           bytes[3] == 'i' && bytes[4] == 'd';

            // Some binary STLs also start with "solid" in the header,
            // so double-check by looking for "facet" in the first ~1000 bytes
            if (isAscii)
            {
                var header = Encoding.ASCII.GetString(bytes, 0, Math.Min(bytes.Length, 1000));
                if (!header.Contains("facet"))
                    isAscii = false;
            }

            return isAscii ? ParseAsciiStl(stlPath) : ParseBinaryStl(bytes);
        }

        private StlMeshData ParseAsciiStl(string stlPath)
        {
            var mesh = new StlMeshData();
            var vertexMap = new Dictionary<(float, float, float), int>();
            var lines = File.ReadAllLines(stlPath);
            var vertexRegex = new Regex(@"vertex\s+([\-\d.eE+]+)\s+([\-\d.eE+]+)\s+([\-\d.eE+]+)", RegexOptions.IgnoreCase);
            var triVerts = new List<int>();

            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                var match = vertexRegex.Match(trimmed);
                if (match.Success)
                {
                    float x = float.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
                    float y = float.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture);
                    float z = float.Parse(match.Groups[3].Value, CultureInfo.InvariantCulture);

                    var key = (x, y, z);
                    if (!vertexMap.TryGetValue(key, out int idx))
                    {
                        idx = mesh.Vertices.Count;
                        vertexMap[key] = idx;
                        mesh.Vertices.Add((x, y, z));
                    }
                    mesh.UpdateBounds(x, y, z);
                    triVerts.Add(idx);

                    if (triVerts.Count == 3)
                    {
                        mesh.Triangles.Add((triVerts[0], triVerts[1], triVerts[2]));
                        triVerts.Clear();
                    }
                }
            }

            return mesh;
        }

        private StlMeshData ParseBinaryStl(byte[] bytes)
        {
            var mesh = new StlMeshData();
            var vertexMap = new Dictionary<(float, float, float), int>();

            // Binary STL: 80-byte header, then uint32 triangle count, then triangles
            if (bytes.Length < 84) throw new Exception("Invalid binary STL file.");

            uint triCount = BitConverter.ToUInt32(bytes, 80);
            int offset = 84;

            for (uint t = 0; t < triCount; t++)
            {
                // Skip normal (12 bytes)
                offset += 12;

                var triIndices = new int[3];
                for (int v = 0; v < 3; v++)
                {
                    float x = BitConverter.ToSingle(bytes, offset); offset += 4;
                    float y = BitConverter.ToSingle(bytes, offset); offset += 4;
                    float z = BitConverter.ToSingle(bytes, offset); offset += 4;

                    var key = (x, y, z);
                    if (!vertexMap.TryGetValue(key, out int idx))
                    {
                        idx = mesh.Vertices.Count;
                        vertexMap[key] = idx;
                        mesh.Vertices.Add((x, y, z));
                    }
                    mesh.UpdateBounds(x, y, z);
                    triIndices[v] = idx;
                }

                mesh.Triangles.Add((triIndices[0], triIndices[1], triIndices[2]));

                // Skip attribute byte count (2 bytes)
                offset += 2;
            }

            return mesh;
        }

        // ─────────────────────────────────────────────────────────────
        // REPLACE 3D MODEL: STL → .model XML + metadata updates
        // ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Converts the AutoForge STL into a proper BambuLab .model XML file,
        /// updates the root 3dmodel.model assembly, and fixes model_settings.config.
        /// </summary>
        private void Replace3DModel(string templateUnzipPath, string newStlPath)
        {
            var mesh = ParseStl(newStlPath);
            var stlFileName = Path.GetFileName(newStlPath);

            // Keep the same UUID from the template so all cross-references stay valid
            const string objectPartUuid = "00010000-81cb-4c03-9d28-80fed5dfa1dc";

            // 1. Write the object_1.model file with inline mesh
            var objectModelPath = Path.Combine(templateUnzipPath, "3D", "Objects", "object_1.model");
            WriteModelXml(objectModelPath, mesh, objectPartUuid);

            // 2. Update root 3dmodel.model (center model on 128,128 build plate)
            UpdateRootModel(templateUnzipPath, mesh);

            // 3. Update model_settings.config
            UpdateModelSettings(templateUnzipPath, mesh, stlFileName);
        }

        /// <summary>
        /// Write a BambuLab-compatible .model XML file with the mesh vertices and triangles inline.
        /// </summary>
        private void WriteModelXml(string outputPath, StlMeshData mesh, string uuid)
        {
            var sb = new StringBuilder();
            sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            sb.AppendLine("<model unit=\"millimeter\" xml:lang=\"en-US\" xmlns=\"http://schemas.microsoft.com/3dmanufacturing/core/2015/02\" xmlns:BambuStudio=\"http://schemas.bambulab.com/package/2021\" xmlns:p=\"http://schemas.microsoft.com/3dmanufacturing/production/2015/06\" requiredextensions=\"p\">");
            sb.AppendLine(" <metadata name=\"BambuStudio:3mfVersion\">1</metadata>");
            sb.AppendLine(" <resources>");
            sb.AppendLine($"  <object id=\"1\" p:UUID=\"{uuid}\" type=\"model\">");
            sb.AppendLine("   <mesh>");
            sb.AppendLine("    <vertices>");

            foreach (var v in mesh.Vertices)
            {
                sb.AppendLine($"     <vertex x=\"{v.X.ToString(CultureInfo.InvariantCulture)}\" y=\"{v.Y.ToString(CultureInfo.InvariantCulture)}\" z=\"{v.Z.ToString(CultureInfo.InvariantCulture)}\"/>");
            }

            sb.AppendLine("    </vertices>");
            sb.AppendLine("    <triangles>");

            foreach (var t in mesh.Triangles)
            {
                sb.AppendLine($"     <triangle v1=\"{t.V1}\" v2=\"{t.V2}\" v3=\"{t.V3}\"/>");
            }

            sb.AppendLine("    </triangles>");
            sb.AppendLine("   </mesh>");
            sb.AppendLine("  </object>");
            sb.AppendLine(" </resources>");
            sb.AppendLine("</model>");

            // Ensure directory exists
            Directory.CreateDirectory(Path.GetDirectoryName(outputPath)!);
            File.WriteAllText(outputPath, sb.ToString(), Encoding.UTF8);
        }

        /// <summary>
        /// Update the root 3D/3dmodel.model to position the model centered on the build plate.
        /// BambuLab P2S bed is 256×256, so center at (128, 128).
        /// </summary>
        private void UpdateRootModel(string templateUnzipPath, StlMeshData mesh)
        {
            var rootModelPath = Path.Combine(templateUnzipPath, "3D", "3dmodel.model");
            if (!File.Exists(rootModelPath)) return;

            var content = File.ReadAllText(rootModelPath);

            // Calculate center offset: we want the model centered on the build plate
            // The build plate center is (128, 128) for a 256×256 bed
            float offsetX = 128f - mesh.CenterX;
            float offsetY = 128f - mesh.CenterY;
            float offsetZ = mesh.MinZ;

            // The transform in the <item> tag positions the assembled object on the plate.
            // Format: "1 0 0 0 1 0 0 0 1 tx ty tz" (identity rotation + translation)
            string newTransform = $"1 0 0 0 1 0 0 0 1 {F(128f)} {F(128f)} {F(offsetZ)}";

            // Replace the transform in the <item> build element
            var itemTransformRegex = new Regex(@"(<item\s+objectid=""2""[^>]*transform="")([^""]+)("")", RegexOptions.Singleline);
            if (itemTransformRegex.IsMatch(content))
            {
                content = itemTransformRegex.Replace(content, $"${{1}}{newTransform}${{3}}");
            }

            // Also update the component transform (the identity + offset in the root assembly)
            var compTransformRegex = new Regex(@"(<component[^>]*transform="")([^""]+)("")", RegexOptions.Singleline);
            if (compTransformRegex.IsMatch(content))
            {
                // Component transform is relative; keep identity for the component
                content = compTransformRegex.Replace(content, "${1}1 0 0 0 1 0 0 0 1 0 0 0${3}");
            }

            File.WriteAllText(rootModelPath, content, Encoding.UTF8);
        }

        /// <summary>
        /// Update Metadata/model_settings.config to reflect the new mesh:
        /// name, source_file, face_count, source_offset_z, and assemble transform.
        /// </summary>
        private void UpdateModelSettings(string templateUnzipPath, StlMeshData mesh, string stlFileName)
        {
            var settingsPath = Path.Combine(templateUnzipPath, "Metadata", "model_settings.config");
            if (!File.Exists(settingsPath)) return;

            var content = File.ReadAllText(settingsPath);
            int faceCount = mesh.Triangles.Count;
            string offsetZ = F(mesh.MinZ);

            // Update object-level metadata
            // <metadata key="name" value="..."/>
            content = Regex.Replace(content,
                @"(<metadata\s+key=""name""\s+value="")[^""]*(""\s*/>)",
                $"${{1}}{stlFileName}${{2}}");

            // <metadata face_count="..."/>
            content = Regex.Replace(content,
                @"(<metadata\s+face_count="")[^""]*(""\s*/>)",
                $"${{1}}{faceCount}${{2}}");

            // <metadata key="source_file" value="..."/>
            content = Regex.Replace(content,
                @"(<metadata\s+key=""source_file""\s+value="")[^""]*(""\s*/>)",
                $"${{1}}{stlFileName}${{2}}");

            // <metadata key="source_offset_z" value="..."/>
            content = Regex.Replace(content,
                @"(<metadata\s+key=""source_offset_z""\s+value="")[^""]*(""\s*/>)",
                $"${{1}}{offsetZ}${{2}}");

            // <mesh_stat face_count="..." .../>
            content = Regex.Replace(content,
                @"(<mesh_stat\s+face_count="")[^""]*("")",
                $"${{1}}{faceCount}${{2}}");

            // <assemble_item ... transform="1 0 0 0 1 0 0 0 1 tx ty tz" ... />
            var assembleRegex = new Regex(@"(<assemble_item[^>]*transform="")[^""]*("")", RegexOptions.Singleline);
            if (assembleRegex.IsMatch(content))
            {
                string assembleTransform = $"1 0 0 0 1 0 0 0 1 0 0 {offsetZ}";
                content = assembleRegex.Replace(content, $"${{1}}{assembleTransform}${{2}}");
            }

            File.WriteAllText(settingsPath, content, Encoding.UTF8);
        }

        // ─────────────────────────────────────────────────────────────
        // UPDATE FILAMENT COLORS in project_settings.config
        // ─────────────────────────────────────────────────────────────

        /// <summary>
        /// Update the filament_colour and filament_multi_colour arrays in
        /// project_settings.config to match the user's requested colors.
        /// This is how BambuLab Studio knows which colors are loaded in the AMS.
        /// </summary>
        private void UpdateFilamentColors(string templateUnzipPath, string[] colors)
        {
            var metadataDir = Path.Combine(templateUnzipPath, "Metadata");
            if (!Directory.Exists(metadataDir)) return;

            var projectSettingsPath = Path.Combine(metadataDir, "project_settings.config");
            if (!File.Exists(projectSettingsPath)) return;

            var content = File.ReadAllText(projectSettingsPath);
            if (!content.TrimStart().StartsWith("{")) return;

            var safeColors = colors ?? Array.Empty<string>();
            // Ensure exactly 4 color hex values (pad with white if needed)
            var hexColors = new List<string>();
            for (int i = 0; i < 4; i++)
            {
                if (i < safeColors.Length)
                    hexColors.Add(GetHexForColor(safeColors[i]));
                else
                    hexColors.Add("#FFFFFF");
            }

            // Replace "filament_colour": ["#...", "#...", "#...", "#..."]
            content = ReplaceJsonStringArray(content, "filament_colour", hexColors);

            // Replace "filament_multi_colour": ["#...", "#...", "#...", "#..."]
            content = ReplaceJsonStringArray(content, "filament_multi_colour", hexColors);

            File.WriteAllText(projectSettingsPath, content, Encoding.UTF8);
        }

        /// <summary>
        /// Replace a JSON array of strings by key name.
        /// Handles the pattern: "key": ["val1", "val2", ...]
        /// </summary>
        private string ReplaceJsonStringArray(string json, string key, List<string> values)
        {
            // Match: "key": [ ... ] (including newlines within the brackets)
            var pattern = $@"""{Regex.Escape(key)}""\s*:\s*\[[^\]]*\]";
            var replacement = $"\"{key}\": [\n" +
                string.Join(",\n", values.Select(v => $"        \"{v}\"")) +
                "\n    ]";

            var regex = new Regex(pattern, RegexOptions.Singleline);
            if (regex.IsMatch(json))
            {
                return regex.Replace(json, replacement);
            }

            return json;
        }

        /// <summary>
        /// Format a float for XML/JSON output using invariant culture.
        /// </summary>
        private static string F(float value)
        {
            return value.ToString(CultureInfo.InvariantCulture);
        }
    }
}
