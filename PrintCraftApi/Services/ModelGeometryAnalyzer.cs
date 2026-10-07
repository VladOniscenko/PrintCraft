using System.Globalization;
using System.IO.Compression;
using System.Text.RegularExpressions;
using System.Xml;

namespace PrintCraftApi.Services;

public record ModelGeometry(
    double VolumeMm3,
    double SurfaceAreaMm2,
    double SizeX,
    double SizeY,
    double SizeZ,
    bool IsExactMesh
);

public record SlicingEstimate(
    double FilamentUsedGrams,
    string EstimatedPrintTime,
    int TotalMinutes
);

public static class ModelGeometryAnalyzer
{
    public static ModelGeometry Analyze(string? filePath, string? sizeString = null)
    {
        if (!string.IsNullOrWhiteSpace(filePath) && File.Exists(filePath))
        {
            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            try
            {
                if (ext == ".stl")
                {
                    var geom = AnalyzeStl(filePath);
                    if (geom != null && geom.VolumeMm3 > 0.001) return geom;
                }
                else if (ext == ".3mf")
                {
                    var geom = Analyze3Mf(filePath);
                    if (geom != null && geom.VolumeMm3 > 0.001) return geom;
                }
                else if (ext == ".obj")
                {
                    var geom = AnalyzeObj(filePath);
                    if (geom != null && geom.VolumeMm3 > 0.001) return geom;
                }
            }
            catch
            {
                // Fall back to size parsing if mesh extraction fails
            }
        }

        if (!string.IsNullOrWhiteSpace(sizeString))
        {
            var dimGeom = ParseDimensions(sizeString);
            if (dimGeom != null) return dimGeom;
        }

        // Standard default bounding box (50 x 50 x 20 mm)
        double defX = 50.0, defY = 50.0, defZ = 20.0;
        double defBoxVol = defX * defY * defZ;
        return new ModelGeometry(
            VolumeMm3: defBoxVol * 0.40,
            SurfaceAreaMm2: 2.0 * (defX * defY + defY * defZ + defX * defZ),
            SizeX: defX,
            SizeY: defY,
            SizeZ: defZ,
            IsExactMesh: false
        );
    }

    public static ModelGeometry? ParseDimensions(string sizeString)
    {
        if (string.IsNullOrWhiteSpace(sizeString)) return null;

        var match = Regex.Match(sizeString, @"([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)\s*x\s*([0-9]+(?:\.[0-9]+)?)", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            if (double.TryParse(match.Groups[1].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var x) &&
                double.TryParse(match.Groups[2].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var y) &&
                double.TryParse(match.Groups[3].Value, NumberStyles.Any, CultureInfo.InvariantCulture, out var z) &&
                x > 0 && y > 0 && z > 0)
            {
                double bboxVol = x * y * z;
                double estMeshVol = bboxVol * 0.45; // Typical 3D model solidity ratio
                double estArea = 2.0 * (x * y + y * z + x * z) * 0.75;
                return new ModelGeometry(estMeshVol, estArea, x, y, z, false);
            }
        }

        if (sizeString.Equals("Small", StringComparison.OrdinalIgnoreCase))
        {
            return new ModelGeometry(25.0 * 25.0 * 15.0 * 0.45, 2.0 * (25 * 25 + 25 * 15 + 25 * 15) * 0.75, 25, 25, 15, false);
        }
        if (sizeString.Equals("Large", StringComparison.OrdinalIgnoreCase))
        {
            return new ModelGeometry(100.0 * 100.0 * 50.0 * 0.45, 2.0 * (100 * 100 + 100 * 50 + 100 * 50) * 0.75, 100, 100, 50, false);
        }

        return null;
    }

    public static ModelGeometry? AnalyzeStl(string filePath)
    {
        var fileInfo = new FileInfo(filePath);
        if (fileInfo.Length < 84) return null;

        using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read);
        using var reader = new BinaryReader(fs);

        byte[] header = reader.ReadBytes(80);
        uint triangleCount = reader.ReadUInt32();

        long expectedBinarySize = 84L + ((long)triangleCount * 50L);
        bool isBinary = triangleCount > 0 && Math.Abs(fileInfo.Length - expectedBinarySize) <= 4;

        if (isBinary)
        {
            return ParseBinaryStl(reader, triangleCount);
        }

        // Try parsing as ASCII STL
        fs.Position = 0;
        return ParseAsciiStl(fs);
    }

    private static ModelGeometry? ParseBinaryStl(BinaryReader reader, uint triangleCount)
    {
        if (triangleCount > 50_000_000) return null; // Sanity check

        double minX = double.MaxValue, maxX = double.MinValue;
        double minY = double.MaxValue, maxY = double.MinValue;
        double minZ = double.MaxValue, maxZ = double.MinValue;
        double totalVolume = 0.0;
        double totalArea = 0.0;

        for (uint i = 0; i < triangleCount; i++)
        {
            // Skip 12 bytes normal (3 x float)
            reader.BaseStream.Seek(12, SeekOrigin.Current);

            float x1 = reader.ReadSingle();
            float y1 = reader.ReadSingle();
            float z1 = reader.ReadSingle();

            float x2 = reader.ReadSingle();
            float y2 = reader.ReadSingle();
            float z2 = reader.ReadSingle();

            float x3 = reader.ReadSingle();
            float y3 = reader.ReadSingle();
            float z3 = reader.ReadSingle();

            // Skip 2 attribute bytes
            reader.BaseStream.Seek(2, SeekOrigin.Current);

            if (float.IsNaN(x1) || float.IsNaN(y1) || float.IsNaN(z1)) continue;

            minX = Math.Min(minX, Math.Min(x1, Math.Min(x2, x3)));
            maxX = Math.Max(maxX, Math.Max(x1, Math.Max(x2, x3)));
            minY = Math.Min(minY, Math.Min(y1, Math.Min(y2, y3)));
            maxY = Math.Max(maxY, Math.Max(y1, Math.Max(y2, y3)));
            minZ = Math.Min(minZ, Math.Min(z1, Math.Min(z2, z3)));
            maxZ = Math.Max(maxZ, Math.Max(z1, Math.Max(z2, z3)));

            // Signed volume of tetrahedron
            totalVolume += (x1 * (y2 * z3 - y3 * z2) + x2 * (y3 * z1 - y1 * z3) + x3 * (y1 * z2 - y2 * z1)) / 6.0;

            // Surface area of triangle
            double ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
            double vx = x3 - x1, vy = y3 - y1, vz = z3 - z1;
            double cx = uy * vz - uz * vy;
            double cy = uz * vx - ux * vz;
            double cz = ux * vy - uy * vx;
            totalArea += 0.5 * Math.Sqrt(cx * cx + cy * cy + cz * cz);
        }

        double sizeX = Math.Max(0.1, maxX - minX);
        double sizeY = Math.Max(0.1, maxY - minY);
        double sizeZ = Math.Max(0.1, maxZ - minZ);
        double finalVolume = Math.Abs(totalVolume);

        if (finalVolume < 0.001)
        {
            // Mesh may have had open boundaries; fallback to estimated volume from bounding box
            finalVolume = sizeX * sizeY * sizeZ * 0.45;
        }

        if (totalArea < 0.001)
        {
            totalArea = 2.0 * (sizeX * sizeY + sizeY * sizeZ + sizeX * sizeZ);
        }

        return new ModelGeometry(finalVolume, totalArea, sizeX, sizeY, sizeZ, true);
    }

    private static ModelGeometry? ParseAsciiStl(Stream stream)
    {
        using var reader = new StreamReader(stream);
        string? firstLine = reader.ReadLine();
        if (firstLine == null || !firstLine.TrimStart().StartsWith("solid", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        double minX = double.MaxValue, maxX = double.MinValue;
        double minY = double.MaxValue, maxY = double.MinValue;
        double minZ = double.MaxValue, maxZ = double.MinValue;
        double totalVolume = 0.0;
        double totalArea = 0.0;

        var vertices = new List<(float X, float Y, float Z)>(3);
        string? line;

        while ((line = reader.ReadLine()) != null)
        {
            line = line.Trim();
            if (line.StartsWith("vertex", StringComparison.OrdinalIgnoreCase))
            {
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 4 &&
                    float.TryParse(parts[1], NumberStyles.Any, CultureInfo.InvariantCulture, out var vx) &&
                    float.TryParse(parts[2], NumberStyles.Any, CultureInfo.InvariantCulture, out var vy) &&
                    float.TryParse(parts[3], NumberStyles.Any, CultureInfo.InvariantCulture, out var vz))
                {
                    vertices.Add((vx, vy, vz));
                    minX = Math.Min(minX, vx); maxX = Math.Max(maxX, vx);
                    minY = Math.Min(minY, vy); maxY = Math.Max(maxY, vy);
                    minZ = Math.Min(minZ, vz); maxZ = Math.Max(maxZ, vz);

                    if (vertices.Count == 3)
                    {
                        var (x1, y1, z1) = vertices[0];
                        var (x2, y2, z2) = vertices[1];
                        var (x3, y3, z3) = vertices[2];

                        totalVolume += (x1 * (y2 * z3 - y3 * z2) + x2 * (y3 * z1 - y1 * z3) + x3 * (y1 * z2 - y2 * z1)) / 6.0;

                        double ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
                        double vxv = x3 - x1, vyv = y3 - y1, vzv = z3 - z1;
                        double cx = uy * vzv - uz * vyv;
                        double cy = uz * vxv - ux * vzv;
                        double cz = ux * vyv - uy * vxv;
                        totalArea += 0.5 * Math.Sqrt(cx * cx + cy * cy + cz * cz);

                        vertices.Clear();
                    }
                }
            }
        }

        if (minX == double.MaxValue) return null;

        double sizeX = Math.Max(0.1, maxX - minX);
        double sizeY = Math.Max(0.1, maxY - minY);
        double sizeZ = Math.Max(0.1, maxZ - minZ);
        double finalVolume = Math.Abs(totalVolume);

        if (finalVolume < 0.001)
        {
            finalVolume = sizeX * sizeY * sizeZ * 0.45;
        }

        return new ModelGeometry(finalVolume, totalArea, sizeX, sizeY, sizeZ, true);
    }

    public static ModelGeometry? Analyze3Mf(string filePath)
    {
        using var archive = ZipFile.OpenRead(filePath);
        var modelEntry = archive.Entries.FirstOrDefault(e => e.FullName.EndsWith(".model", StringComparison.OrdinalIgnoreCase));
        if (modelEntry == null) return null;

        using var stream = modelEntry.Open();
        using var reader = XmlReader.Create(stream, new XmlReaderSettings { IgnoreWhitespace = true });

        var vertices = new List<(float X, float Y, float Z)>();
        double minX = double.MaxValue, maxX = double.MinValue;
        double minY = double.MaxValue, maxY = double.MinValue;
        double minZ = double.MaxValue, maxZ = double.MinValue;
        double totalVolume = 0.0;
        double totalArea = 0.0;

        while (reader.Read())
        {
            if (reader.NodeType == XmlNodeType.Element)
            {
                if (reader.LocalName == "vertex")
                {
                    string? xs = reader.GetAttribute("x");
                    string? ys = reader.GetAttribute("y");
                    string? zs = reader.GetAttribute("z");
                    if (float.TryParse(xs, NumberStyles.Any, CultureInfo.InvariantCulture, out var vx) &&
                        float.TryParse(ys, NumberStyles.Any, CultureInfo.InvariantCulture, out var vy) &&
                        float.TryParse(zs, NumberStyles.Any, CultureInfo.InvariantCulture, out var vz))
                    {
                        vertices.Add((vx, vy, vz));
                        minX = Math.Min(minX, vx); maxX = Math.Max(maxX, vx);
                        minY = Math.Min(minY, vy); maxY = Math.Max(maxY, vy);
                        minZ = Math.Min(minZ, vz); maxZ = Math.Max(maxZ, vz);
                    }
                }
                else if (reader.LocalName == "triangle")
                {
                    string? v1s = reader.GetAttribute("v1");
                    string? v2s = reader.GetAttribute("v2");
                    string? v3s = reader.GetAttribute("v3");
                    if (int.TryParse(v1s, out var i1) && int.TryParse(v2s, out var i2) && int.TryParse(v3s, out var i3))
                    {
                        if (i1 < vertices.Count && i2 < vertices.Count && i3 < vertices.Count)
                        {
                            var (x1, y1, z1) = vertices[i1];
                            var (x2, y2, z2) = vertices[i2];
                            var (x3, y3, z3) = vertices[i3];

                            totalVolume += (x1 * (y2 * z3 - y3 * z2) + x2 * (y3 * z1 - y1 * z3) + x3 * (y1 * z2 - y2 * z1)) / 6.0;

                            double ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
                            double vxv = x3 - x1, vyv = y3 - y1, vzv = z3 - z1;
                            double cx = uy * vzv - uz * vyv;
                            double cy = uz * vxv - ux * vzv;
                            double cz = ux * vyv - uy * vxv;
                            totalArea += 0.5 * Math.Sqrt(cx * cx + cy * cy + cz * cz);
                        }
                    }
                }
            }
        }

        if (vertices.Count == 0 || minX == double.MaxValue) return null;

        double sizeX = Math.Max(0.1, maxX - minX);
        double sizeY = Math.Max(0.1, maxY - minY);
        double sizeZ = Math.Max(0.1, maxZ - minZ);
        double finalVolume = Math.Abs(totalVolume);

        if (finalVolume < 0.001) finalVolume = sizeX * sizeY * sizeZ * 0.45;
        if (totalArea < 0.001) totalArea = 2.0 * (sizeX * sizeY + sizeY * sizeZ + sizeX * sizeZ);

        return new ModelGeometry(finalVolume, totalArea, sizeX, sizeY, sizeZ, true);
    }

    public static ModelGeometry? AnalyzeObj(string filePath)
    {
        var vertices = new List<(float X, float Y, float Z)>();
        double minX = double.MaxValue, maxX = double.MinValue;
        double minY = double.MaxValue, maxY = double.MinValue;
        double minZ = double.MaxValue, maxZ = double.MinValue;
        double totalVolume = 0.0;
        double totalArea = 0.0;

        foreach (var rawLine in File.ReadLines(filePath))
        {
            var line = rawLine.Trim();
            if (line.StartsWith("v "))
            {
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 4 &&
                    float.TryParse(parts[1], NumberStyles.Any, CultureInfo.InvariantCulture, out var vx) &&
                    float.TryParse(parts[2], NumberStyles.Any, CultureInfo.InvariantCulture, out var vy) &&
                    float.TryParse(parts[3], NumberStyles.Any, CultureInfo.InvariantCulture, out var vz))
                {
                    vertices.Add((vx, vy, vz));
                    minX = Math.Min(minX, vx); maxX = Math.Max(maxX, vx);
                    minY = Math.Min(minY, vy); maxY = Math.Max(maxY, vy);
                    minZ = Math.Min(minZ, vz); maxZ = Math.Max(maxZ, vz);
                }
            }
            else if (line.StartsWith("f "))
            {
                var parts = line.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length >= 4)
                {
                    int ParseObjIndex(string token)
                    {
                        var slash = token.IndexOf('/');
                        var sub = slash >= 0 ? token.Substring(0, slash) : token;
                        if (int.TryParse(sub, out var idx))
                        {
                            return idx > 0 ? idx - 1 : vertices.Count + idx;
                        }
                        return -1;
                    }

                    int i1 = ParseObjIndex(parts[1]);
                    int i2 = ParseObjIndex(parts[2]);
                    int i3 = ParseObjIndex(parts[3]);

                    if (i1 >= 0 && i1 < vertices.Count &&
                        i2 >= 0 && i2 < vertices.Count &&
                        i3 >= 0 && i3 < vertices.Count)
                    {
                        var (x1, y1, z1) = vertices[i1];
                        var (x2, y2, z2) = vertices[i2];
                        var (x3, y3, z3) = vertices[i3];

                        totalVolume += (x1 * (y2 * z3 - y3 * z2) + x2 * (y3 * z1 - y1 * z3) + x3 * (y1 * z2 - y2 * z1)) / 6.0;

                        double ux = x2 - x1, uy = y2 - y1, uz = z2 - z1;
                        double vxv = x3 - x1, vyv = y3 - y1, vzv = z3 - z1;
                        double cx = uy * vzv - uz * vyv;
                        double cy = uz * vxv - ux * vzv;
                        double cz = ux * vyv - uy * vxv;
                        totalArea += 0.5 * Math.Sqrt(cx * cx + cy * cy + cz * cz);
                    }
                }
            }
        }

        if (vertices.Count == 0 || minX == double.MaxValue) return null;

        double sizeX = Math.Max(0.1, maxX - minX);
        double sizeY = Math.Max(0.1, maxY - minY);
        double sizeZ = Math.Max(0.1, maxZ - minZ);
        double finalVolume = Math.Abs(totalVolume);

        if (finalVolume < 0.001) finalVolume = sizeX * sizeY * sizeZ * 0.45;
        if (totalArea < 0.001) totalArea = 2.0 * (sizeX * sizeY + sizeY * sizeZ + sizeX * sizeZ);

        return new ModelGeometry(finalVolume, totalArea, sizeX, sizeY, sizeZ, true);
    }

    public static double GetMaterialDensity(string? material)
    {
        if (string.IsNullOrWhiteSpace(material)) return 1.24; // Default PLA
        var mat = material.Trim().ToUpperInvariant();
        if (mat.Contains("PLA")) return 1.24;
        if (mat.Contains("PETG")) return 1.27;
        if (mat.Contains("ABS")) return 1.04;
        if (mat.Contains("ASA")) return 1.07;
        if (mat.Contains("TPU")) return 1.21;
        if (mat.Contains("PC")) return 1.20;
        if (mat.Contains("NYLON") || mat.Contains("PA")) return 1.14;
        return 1.24;
    }

    public static SlicingEstimate EstimatePrint(
        ModelGeometry geometry,
        double scaleFactor,
        int infillPercent,
        string? quality,
        bool supportsNeeded,
        string? material,
        int count = 1)
    {
        double scale = scaleFactor > 0 ? scaleFactor : 1.0;
        int infill = Math.Clamp(infillPercent, 5, 100);

        double scaledVolume = geometry.VolumeMm3 * Math.Pow(scale, 3);
        double scaledArea = geometry.SurfaceAreaMm2 * Math.Pow(scale, 2);
        double scaledZ = geometry.SizeZ * scale;

        double density = GetMaterialDensity(material);

        // Standard FDM perimeter shells: ~0.8mm wall thickness
        double estShellVolume = scaledArea * 0.8 * 0.5;
        double shellVolume = Math.Min(scaledVolume, estShellVolume);
        double infillVolume = Math.Max(0.0, scaledVolume - shellVolume) * (infill / 100.0);
        double supportVolume = supportsNeeded ? (scaledVolume * 0.12) : 0.0;

        double totalPrintedVolume = (shellVolume + infillVolume + supportVolume) * count;
        double filamentGrams = (totalPrintedVolume / 1000.0) * density;
        filamentGrams = Math.Round(Math.Max(0.05 * count, filamentGrams), 2);

        // Layer height resolution
        var q = quality?.ToLowerInvariant() ?? "";
        double layerHeightMm = q.Contains("0.12") || q.Contains("detail") || q.Contains("fine")
            ? 0.12
            : (q.Contains("0.28") || q.Contains("draft") ? 0.28 : 0.20);

        int layerCount = Math.Max(1, (int)Math.Ceiling(scaledZ / layerHeightMm));

        // Machine prep and warmup time (bed leveling, heating, nozzle wipe)
        double prepMinutes = 4.0; // Paid once per build plate

        // Volumetric extrusion flow rate (grams per hour)
        double gramsPerHour = layerHeightMm switch
        {
            <= 0.14 => 28.0,
            >= 0.25 => 52.0,
            _ => 40.0
        };

        double extrusionMinutes = (filamentGrams / gramsPerHour) * 60.0;

        // Kinematic layer transitions and minimum cooling time per layer
        double layerOverheadMinutes = layerCount * 0.10 * count; // 6 seconds per layer per item

        double totalMins = prepMinutes + extrusionMinutes + layerOverheadMinutes;
        if (supportsNeeded) totalMins *= 1.15;

        int totalMinutes = (int)Math.Max(5, Math.Round(totalMins));
        int hours = totalMinutes / 60;
        int mins = totalMinutes % 60;

        string timeString = hours > 0 ? $"{hours}h {mins}m" : $"{mins}m";

        return new SlicingEstimate(filamentGrams, timeString, totalMinutes);
    }
}

