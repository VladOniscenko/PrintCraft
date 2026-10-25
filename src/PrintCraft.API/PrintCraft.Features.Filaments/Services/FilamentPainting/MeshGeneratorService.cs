using System.Buffers.Binary;
using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Xml.Linq;

namespace PrintCraft.Features.Filaments.Services.FilamentPainting;

/// <summary>
/// Generates watertight 3D meshes (Binary STL and Vertex-Colored Binary GLTF/GLB)
/// from a HueForge topographic heightmap and blended color buffer.
/// </summary>
public static class MeshGeneratorService
{
    /// <summary>
    /// Generates a binary STL file (standard 3D printable topographic relief with a flat solid base).
    /// </summary>
    public static byte[] GenerateBinaryStl(
        float[] heightMap,
        int gridWidth,
        int gridHeight,
        double widthMm,
        double heightMm,
        double baseThicknessMm = 0.48)
    {
        if (gridWidth < 2 || gridHeight < 2)
            throw new ArgumentException("Grid resolution must be at least 2x2.");

        float dx = (float)(widthMm / (gridWidth - 1));
        float dy = (float)(heightMm / (gridHeight - 1));
        float halfW = (float)(widthMm / 2.0);
        float halfH = (float)(heightMm / 2.0);

        // Calculate triangle count:
        // Top surface: (gridWidth - 1) * (gridHeight - 1) * 2
        // Bottom base: (gridWidth - 1) * (gridHeight - 1) * 2
        // 4 side walls: 2 triangles per perimeter edge
        int quadsX = gridWidth - 1;
        int quadsY = gridHeight - 1;
        int topTriangles = quadsX * quadsY * 2;
        int bottomTriangles = quadsX * quadsY * 2;
        int perimeterEdges = (quadsX * 2) + (quadsY * 2);
        int wallTriangles = perimeterEdges * 2;
        int totalTriangles = topTriangles + bottomTriangles + wallTriangles;

        // Binary STL: 80 bytes header + 4 bytes uint32 count + 50 bytes per triangle
        int totalBytes = 84 + (totalTriangles * 50);
        byte[] buffer = new byte[totalBytes];

        // 1. Header (80 bytes)
        byte[] headerBytes = Encoding.ASCII.GetBytes("PrintCraft HueForge Binary STL");
        Array.Copy(headerBytes, buffer, Math.Min(headerBytes.Length, 80));

        // 2. Triangle count (uint32 little-endian)
        BinaryPrimitives.WriteUInt32LittleEndian(buffer.AsSpan(80, 4), (uint)totalTriangles);

        int offset = 84;

        // Helper to write a triangle
        void WriteTriangle(float x1, float y1, float z1,
                           float x2, float y2, float z2,
                           float x3, float y3, float z3)
        {
            // Compute normal: (v2 - v1) x (v3 - v1)
            float ax = x2 - x1, ay = y2 - y1, az = z2 - z1;
            float bx = x3 - x1, by = y3 - y1, bz = z3 - z1;
            float nx = ay * bz - az * by;
            float ny = az * bx - ax * bz;
            float nz = ax * by - ay * bx;
            float len = MathF.Sqrt(nx * nx + ny * ny + nz * nz);
            if (len > 1e-6f) { nx /= len; ny /= len; nz /= len; } else { nx = 0; ny = 0; nz = 1; }

            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset, 4), nx);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 4, 4), ny);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 8, 4), nz);

            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 12, 4), x1);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 16, 4), y1);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 20, 4), z1);

            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 24, 4), x2);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 28, 4), y2);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 32, 4), z2);

            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 36, 4), x3);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 40, 4), y3);
            BinaryPrimitives.WriteSingleLittleEndian(buffer.AsSpan(offset + 44, 4), z3);

            BinaryPrimitives.WriteUInt16LittleEndian(buffer.AsSpan(offset + 48, 2), 0); // attribute byte count
            offset += 50;
        }

        float effectiveBorderMm = MathF.Min(1.6f, (float)Math.Min(widthMm, heightMm) * 0.08f);

        float GetZ(int x, int y)
        {
            // Perimeter is guaranteed flat border at baseThicknessMm
            if (x == 0 || x == gridWidth - 1 || y == 0 || y == gridHeight - 1)
                return (float)baseThicknessMm;

            float distToEdgeX = MathF.Min(x * dx, (gridWidth - 1 - x) * dx);
            float distToEdgeY = MathF.Min(y * dy, (gridHeight - 1 - y) * dy);
            float distToEdge = MathF.Min(distToEdgeX, distToEdgeY);

            if (distToEdge < effectiveBorderMm)
                return (float)baseThicknessMm;

            return heightMap[y * gridWidth + x];
        }

        float GetX(int x) => -halfW + (x * dx);
        float GetY(int y) => halfH - (y * dy); // y=0 is top of image at +halfH (North), y=gridHeight-1 is bottom at -halfH (South)

        // 3. Top surface triangles (Z points up +Z)
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                float x0 = GetX(x), x1 = GetX(x + 1);
                float y0 = GetY(y), y1 = GetY(y + 1); // y0 > y1
                float z00 = GetZ(x, y);
                float z10 = GetZ(x + 1, y);
                float z01 = GetZ(x, y + 1);
                float z11 = GetZ(x + 1, y + 1);

                WriteTriangle(x0, y0, z00, x0, y1, z01, x1, y0, z10);
                WriteTriangle(x1, y0, z10, x0, y1, z01, x1, y1, z11);
            }
        }

        // 4. Bottom base triangles (Z = 0, pointing down -Z)
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                float x0 = GetX(x), x1 = GetX(x + 1);
                float y0 = GetY(y), y1 = GetY(y + 1);

                WriteTriangle(x0, y0, 0, x1, y0, 0, x0, y1, 0);
                WriteTriangle(x1, y0, 0, x1, y1, 0, x0, y1, 0);
            }
        }

        // 5. Side walls with strictly outward-pointing normals
        // South wall (y index = gridHeight - 1, coordinate is -halfH, normal points -Y)
        float ySouth = GetY(gridHeight - 1);
        for (int x = 0; x < quadsX; x++)
        {
            float x0 = GetX(x), x1 = GetX(x + 1);
            float z0 = GetZ(x, gridHeight - 1), z1 = GetZ(x + 1, gridHeight - 1);
            WriteTriangle(x0, ySouth, 0, x1, ySouth, z1, x0, ySouth, z0);
            WriteTriangle(x0, ySouth, 0, x1, ySouth, 0, x1, ySouth, z1);
        }

        // North wall (y index = 0, coordinate is +halfH, normal points +Y)
        float yNorth = GetY(0);
        for (int x = 0; x < quadsX; x++)
        {
            float x0 = GetX(x), x1 = GetX(x + 1);
            float z0 = GetZ(x, 0), z1 = GetZ(x + 1, 0);
            WriteTriangle(x0, yNorth, 0, x0, yNorth, z0, x1, yNorth, z1);
            WriteTriangle(x0, yNorth, 0, x1, yNorth, z1, x1, yNorth, 0);
        }

        // West wall (x index = 0, coordinate is -halfW, normal points -X)
        float xWest = GetX(0);
        for (int y = 0; y < quadsY; y++)
        {
            float y0 = GetY(y), y1 = GetY(y + 1);
            float z0 = GetZ(0, y), z1 = GetZ(0, y + 1);
            WriteTriangle(xWest, y0, 0, xWest, y1, z1, xWest, y0, z0);
            WriteTriangle(xWest, y0, 0, xWest, y1, 0, xWest, y1, z1);
        }

        // East wall (x index = gridWidth - 1, coordinate is +halfW, normal points +X)
        float xEast = GetX(gridWidth - 1);
        for (int y = 0; y < quadsY; y++)
        {
            float y0 = GetY(y), y1 = GetY(y + 1);
            float z0 = GetZ(gridWidth - 1, y), z1 = GetZ(gridWidth - 1, y + 1);
            WriteTriangle(xEast, y0, 0, xEast, y0, z0, xEast, y1, z1);
            WriteTriangle(xEast, y0, 0, xEast, y1, z1, xEast, y1, 0);
        }

        return buffer;
    }

    /// <summary>
    /// Generates a binary GLB (GLTF 2.0 Binary) file with per-vertex colors (COLOR_0 attribute).
    /// Compatible with Three.js GLTFLoader and Google model-viewer.
    /// </summary>
    public static byte[] GenerateBinaryGlb(
        float[] heightMap,
        byte[] rgbMap,
        int gridWidth,
        int gridHeight,
        double widthMm,
        double heightMm,
        double baseThicknessMm = 0.8,
        ColorRgb? baseBorderColor = null)
    {
        if (gridWidth < 2 || gridHeight < 2)
            throw new ArgumentException("Grid resolution must be at least 2x2.");

        int vertexCount = gridWidth * gridHeight;
        float dx = (float)(widthMm / (gridWidth - 1));
        float dy = (float)(heightMm / (gridHeight - 1));
        float halfW = (float)(widthMm / 2.0);
        float halfH = (float)(heightMm / 2.0);

        int quadsX = gridWidth - 1;
        int quadsY = gridHeight - 1;
        int indexCount = quadsX * quadsY * 6;

        // Position: float32[3] -> 12 bytes per vertex
        // Normal: float32[3] -> 12 bytes per vertex
        // Color: uint8 normalized [4] (RGBA) -> 4 bytes per vertex
        // Indices: uint32 -> 4 bytes per index (or uint16 if vertexCount < 65536)
        bool useUint16 = vertexCount < 65535;
        int indexByteSize = useUint16 ? 2 : 4;

        int posByteLength = vertexCount * 12;
        int normalByteLength = vertexCount * 12;
        int colorByteLength = vertexCount * 4;
        int indexByteLength = indexCount * indexByteSize;

        // Pad each buffer view to 4-byte alignment
        int Pad4(int len) => (len + 3) & ~3;

        int posOffset = 0;
        int normalOffset = posOffset + Pad4(posByteLength);
        int colorOffset = normalOffset + Pad4(normalByteLength);
        int indexOffset = colorOffset + Pad4(colorByteLength);
        int binTotalLength = Pad4(indexOffset + indexByteLength);

        byte[] binData = new byte[binTotalLength];

        // 1. Fill Position, Color, and Normal
        float minX = float.MaxValue, minY = float.MaxValue, minZ = float.MaxValue;
        float maxX = float.MinValue, maxY = float.MinValue, maxZ = float.MinValue;

        float effectiveBorderMm = MathF.Min(1.6f, (float)Math.Min(widthMm, heightMm) * 0.08f);
        float baseZ = (float)baseThicknessMm;
        var borderCol = baseBorderColor ?? new ColorRgb(17, 17, 17);

        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int vi = y * gridWidth + x;
                float px = -halfW + (x * dx);
                // Three.js convention: camera looks from (0, 80, 160) towards (0, 0, 0)
                // y=0 top of image is at -halfH (North), y=gridHeight-1 bottom is at +halfH (South)
                float pz = -halfH + (y * dy);

                float distToEdgeX = MathF.Min(x * dx, (gridWidth - 1 - x) * dx);
                float distToEdgeY = MathF.Min(y * dy, (gridHeight - 1 - y) * dy);
                float distToEdge = MathF.Min(distToEdgeX, distToEdgeY);
                bool isBorder = distToEdge < effectiveBorderMm || x == 0 || x == gridWidth - 1 || y == 0 || y == gridHeight - 1;

                float py = isBorder ? baseZ : heightMap[vi]; // height relief along +Y

                minX = MathF.Min(minX, px); maxX = MathF.Max(maxX, px);
                minY = MathF.Min(minY, py); maxY = MathF.Max(maxY, py);
                minZ = MathF.Min(minZ, pz); maxZ = MathF.Max(maxZ, pz);

                // Write Position
                int pOff = posOffset + (vi * 12);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(pOff, 4), px);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(pOff + 4, 4), py);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(pOff + 8, 4), pz);

                // Write Color (RGBA uint8)
                int cOff = colorOffset + (vi * 4);
                int rgbIdx = vi * 3;
                if (isBorder)
                {
                    // Clean frame border in base filament color
                    binData[cOff] = borderCol.R;
                    binData[cOff + 1] = borderCol.G;
                    binData[cOff + 2] = borderCol.B;
                }
                else
                {
                    binData[cOff] = rgbMap[rgbIdx];         // R
                    binData[cOff + 1] = rgbMap[rgbIdx + 1]; // G
                    binData[cOff + 2] = rgbMap[rgbIdx + 2]; // B
                }
                binData[cOff + 3] = 255;                // A

                // Compute smooth surface normal from heightmap gradient
                float hL = isBorder ? baseZ : heightMap[y * gridWidth + Math.Max(0, x - 1)];
                float hR = isBorder ? baseZ : heightMap[y * gridWidth + Math.Min(gridWidth - 1, x + 1)];
                float hU = isBorder ? baseZ : heightMap[Math.Max(0, y - 1) * gridWidth + x];
                float hD = isBorder ? baseZ : heightMap[Math.Min(gridHeight - 1, y + 1) * gridWidth + x];

                float dhdx = (hR - hL) / (2.0f * MathF.Max(0.001f, dx));
                float dhdz = (hD - hU) / (2.0f * MathF.Max(0.001f, dy));

                // Relief bump scaling so directional lighting highlights tactile photographic details
                float nx = isBorder ? 0.0f : -dhdx * 2.8f;
                float ny = 1.0f;
                float nz = isBorder ? 0.0f : -dhdz * 2.8f;
                float nLen = MathF.Sqrt(nx * nx + ny * ny + nz * nz);
                if (nLen > 1e-5f) { nx /= nLen; ny /= nLen; nz /= nLen; }
                else { nx = 0.0f; ny = 1.0f; nz = 0.0f; }

                int nOff = normalOffset + (vi * 12);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff, 4), nx);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff + 4, 4), ny);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff + 8, 4), nz);
            }
        }

        // 2. Fill Indices with counter-clockwise winding (normals facing +Y)
        int curIndexOffset = indexOffset;
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                int v0 = y * gridWidth + x;
                int v1 = y * gridWidth + (x + 1);
                int v2 = (y + 1) * gridWidth + x;
                int v3 = (y + 1) * gridWidth + (x + 1);

                // Quad as two triangles: (v0, v2, v1) and (v1, v2, v3) -> normal points +Y UP
                int[] quadIndices = [v0, v2, v1, v1, v2, v3];
                for (int k = 0; k < 6; k++)
                {
                    if (useUint16)
                    {
                        BinaryPrimitives.WriteUInt16LittleEndian(binData.AsSpan(curIndexOffset, 2), (ushort)quadIndices[k]);
                        curIndexOffset += 2;
                    }
                    else
                    {
                        BinaryPrimitives.WriteUInt32LittleEndian(binData.AsSpan(curIndexOffset, 4), (uint)quadIndices[k]);
                        curIndexOffset += 4;
                    }
                }
            }
        }

        // 3. Construct GLTF JSON
        var gltfObj = new
        {
            asset = new { version = "2.0", generator = "PrintCraft HueForge GLB Generator" },
            scene = 0,
            scenes = new[] { new { nodes = new[] { 0 } } },
            nodes = new[] { new { mesh = 0 } },
            materials = new[]
            {
                new
                {
                    name = "HueForgeMaterial",
                    pbrMetallicRoughness = new
                    {
                        baseColorFactor = new[] { 1.0, 1.0, 1.0, 1.0 },
                        metallicFactor = 0.05,
                        roughnessFactor = 0.40
                    },
                    doubleSided = true
                }
            },
            meshes = new[]
            {
                new
                {
                    primitives = new[]
                    {
                        new
                        {
                            attributes = new Dictionary<string, int>
                            {
                                ["POSITION"] = 0,
                                ["NORMAL"] = 1,
                                ["COLOR_0"] = 2
                            },
                            indices = 3,
                            material = 0
                        }
                    }
                }
            },
            accessors = new object[]
            {
                // 0: POSITION
                new
                {
                    bufferView = 0,
                    componentType = 5126, // FLOAT
                    count = vertexCount,
                    type = "VEC3",
                    min = new[] { minX, minY, minZ },
                    max = new[] { maxX, maxY, maxZ }
                },
                // 1: NORMAL
                new
                {
                    bufferView = 1,
                    componentType = 5126, // FLOAT
                    count = vertexCount,
                    type = "VEC3"
                },
                // 2: COLOR_0
                new
                {
                    bufferView = 2,
                    componentType = 5121, // UNSIGNED_BYTE
                    normalized = true,
                    count = vertexCount,
                    type = "VEC4"
                },
                // 3: INDICES
                new
                {
                    bufferView = 3,
                    componentType = useUint16 ? 5123 : 5125, // UNSIGNED_SHORT or UNSIGNED_INT
                    count = indexCount,
                    type = "SCALAR"
                }
            },
            bufferViews = new[]
            {
                new { buffer = 0, byteOffset = posOffset, byteLength = posByteLength, target = 34962 },
                new { buffer = 0, byteOffset = normalOffset, byteLength = normalByteLength, target = 34962 },
                new { buffer = 0, byteOffset = colorOffset, byteLength = colorByteLength, target = 34962 },
                new { buffer = 0, byteOffset = indexOffset, byteLength = indexByteLength, target = 34963 }
            },
            buffers = new[]
            {
                new { byteLength = binTotalLength }
            }
        };

        string jsonString = JsonSerializer.Serialize(gltfObj);
        byte[] jsonBytes = Encoding.UTF8.GetBytes(jsonString);
        int jsonPaddedLength = Pad4(jsonBytes.Length);

        // Build GLB container:
        // Header: 12 bytes
        // JSON Chunk: 8 bytes chunk header + jsonPaddedLength
        // BIN Chunk: 8 bytes chunk header + binTotalLength
        int glbTotalLength = 12 + (8 + jsonPaddedLength) + (8 + binTotalLength);
        byte[] glbBuffer = new byte[glbTotalLength];

        // 1. GLB Header (12 bytes)
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(0, 4), 0x46546C67); // "glTF"
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(4, 4), 2);          // version 2
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(8, 4), (uint)glbTotalLength);

        // 2. JSON Chunk (8 bytes + data)
        int off = 12;
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(off, 4), (uint)jsonPaddedLength);
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(off + 4, 4), 0x4E4F534A); // "JSON"
        Array.Copy(jsonBytes, 0, glbBuffer, off + 8, jsonBytes.Length);
        for (int i = jsonBytes.Length; i < jsonPaddedLength; i++) glbBuffer[off + 8 + i] = 0x20; // space padding
        off += 8 + jsonPaddedLength;

        // 3. BIN Chunk (8 bytes + data)
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(off, 4), (uint)binTotalLength);
        BinaryPrimitives.WriteUInt32LittleEndian(glbBuffer.AsSpan(off + 4, 4), 0x004E4942); // "BIN\0"
        Array.Copy(binData, 0, glbBuffer, off + 8, binTotalLength);

        return glbBuffer;
    }


    /// <summary>
    /// Generates a production ZIP archive containing:
    /// 1. High-resolution STL model ({stlFileName})
    /// 2. read-me.txt containing exact print settings, solid base, and layer swap color timeline for Bambu Studio / slicers.
    /// </summary>
    public static byte[] GenerateProductionZip(
        byte[] stlBytes,
        string stlFileName,
        double widthMm,
        double heightMm,
        double maxDepthMm,
        LayerStackConfig config,
        List<LayerSwapInstruction> swaps)
    {
        var sb = new StringBuilder();
        sb.AppendLine("================================================================================");
        sb.AppendLine("PRINTCRAFT HUEFORGE PRINT INSTRUCTIONS");
        sb.AppendLine("Compatible with: Bambu Studio, OrcaSlicer, PrusaSlicer, Creality Print, Cura");
        sb.AppendLine("================================================================================");
        sb.AppendLine();
        var inv = CultureInfo.InvariantCulture;
        sb.AppendLine("MODEL SPECIFICATIONS:");
        sb.AppendLine($"  File:                {stlFileName}");
        sb.AppendLine($"  Dimensions:          {widthMm.ToString("F1", inv)} mm (Width) x {heightMm.ToString("F1", inv)} mm (Height) x {maxDepthMm.ToString("F2", inv)} mm (Max Relief)");
        sb.AppendLine($"  Solid Base Height:   {config.MinBaseThicknessMm.ToString("F2", inv)} mm");
        sb.AppendLine($"  First Layer Height:  {config.BaseLayerHeightMm.ToString("F2", inv)} mm");
        sb.AppendLine($"  Detail Layer Height: {config.LayerHeightMm.ToString("F2", inv)} mm");
        sb.AppendLine("  Infill:              100% Solid Infill (Rectilinear)");
        sb.AppendLine("  Perimeters / Walls:  2 or 3");
        sb.AppendLine();
        sb.AppendLine("--------------------------------------------------------------------------------");
        sb.AppendLine("EXACT LAYER SWAP COLOR TIMELINE:");
        sb.AppendLine("--------------------------------------------------------------------------------");

        foreach (var swap in swaps)
        {
            var hStr = swap.HeightMm.ToString("F2", inv);
            if (swap.SwapNumber == 1)
            {
                sb.AppendLine($"Swap #1: Start print with {swap.ColorName} ({swap.ColorHex}) at Layer {swap.LayerNumber} ({hStr}mm)");
            }
            else
            {
                sb.AppendLine($"Swap #{swap.SwapNumber}: Swap to {swap.ColorName} ({swap.ColorHex}) at Layer {swap.LayerNumber} ({hStr}mm)");
            }
        }

        sb.AppendLine("--------------------------------------------------------------------------------");
        sb.AppendLine();
        sb.AppendLine("SLICER QUICK START (BAMBU STUDIO / ORCASLICER):");
        sb.AppendLine($"1. Drag and drop '{stlFileName}' into Bambu Studio.");
        sb.AppendLine($"2. Set Layer Height to {config.LayerHeightMm.ToString("F2", inv)} mm (First Layer Height: {config.BaseLayerHeightMm.ToString("F2", inv)} mm).");
        sb.AppendLine("3. Set Infill to 100% Rectilinear (mandatory for HueForge light transmission).");
        sb.AppendLine("4. Slice the model.");
        sb.AppendLine("5. In the vertical layer preview slider on the right:");
        foreach (var swap in swaps)
        {
            if (swap.SwapNumber > 1)
            {
                var hStr = swap.HeightMm.ToString("F2", inv);
                sb.AppendLine($"   - Go to Layer {swap.LayerNumber} ({hStr}mm) -> Right-click the '+' icon -> 'Add Pause' or 'Change Filament' -> Swap to {swap.ColorName} ({swap.ColorHex})");
            }
        }
        sb.AppendLine("6. Export G-code or print directly!");
        sb.AppendLine("================================================================================");

        var readmeText = sb.ToString();

        // The 'false' parameter explicitly disables the BOM
        var encoding = new UTF8Encoding(false);

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            // 1. High-resolution STL
            var stlEntry = archive.CreateEntry(stlFileName, CompressionLevel.Optimal);
            using (var stlStream = stlEntry.Open())
            {
                stlStream.Write(stlBytes, 0, stlBytes.Length);
            }

            // 2. read-me.txt
            var readmeEntry = archive.CreateEntry("read-me.txt", CompressionLevel.Optimal);
            using (var readmeStream = readmeEntry.Open())
            using (var writer = new StreamWriter(readmeStream, encoding))
            {
                writer.Write(readmeText);
            }
        }

        return memoryStream.ToArray();
    }
}


