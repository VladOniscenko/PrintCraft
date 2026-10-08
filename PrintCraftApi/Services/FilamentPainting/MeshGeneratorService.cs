using System.Buffers.Binary;
using System.Globalization;
using System.IO.Compression;
using System.Text;
using System.Text.Json;

namespace PrintCraftApi.Services.FilamentPainting;

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

        float GetX(int x) => -halfW + (x * dx);
        float GetY(int y) => -halfH + (y * dy);
        float GetZ(int x, int y) => heightMap[y * gridWidth + x];

        // 3. Top surface triangles
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                float x0 = GetX(x), x1 = GetX(x + 1);
                float y0 = GetY(y), y1 = GetY(y + 1);
                float z00 = GetZ(x, y);
                float z10 = GetZ(x + 1, y);
                float z01 = GetZ(x, y + 1);
                float z11 = GetZ(x + 1, y + 1);

                WriteTriangle(x0, y0, z00, x1, y0, z10, x0, y1, z01);
                WriteTriangle(x1, y0, z10, x1, y1, z11, x0, y1, z01);
            }
        }

        // 4. Bottom base triangles (Z = 0, reverse winding)
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                float x0 = GetX(x), x1 = GetX(x + 1);
                float y0 = GetY(y), y1 = GetY(y + 1);

                WriteTriangle(x0, y0, 0, x0, y1, 0, x1, y0, 0);
                WriteTriangle(x1, y0, 0, x0, y1, 0, x1, y1, 0);
            }
        }

        // 5. Side walls
        // South wall (y = 0)
        for (int x = 0; x < quadsX; x++)
        {
            float x0 = GetX(x), x1 = GetX(x + 1);
            float y0 = GetY(0);
            float z0 = GetZ(x, 0), z1 = GetZ(x + 1, 0);
            WriteTriangle(x0, y0, 0, x1, y0, 0, x0, y0, z0);
            WriteTriangle(x1, y0, 0, x1, y0, z1, x0, y0, z0);
        }

        // North wall (y = gridHeight - 1)
        for (int x = 0; x < quadsX; x++)
        {
            float x0 = GetX(x), x1 = GetX(x + 1);
            float y1 = GetY(gridHeight - 1);
            float z0 = GetZ(x, gridHeight - 1), z1 = GetZ(x + 1, gridHeight - 1);
            WriteTriangle(x0, y1, 0, x0, y1, z0, x1, y1, 0);
            WriteTriangle(x1, y1, 0, x0, y1, z0, x1, y1, z1);
        }

        // West wall (x = 0)
        for (int y = 0; y < quadsY; y++)
        {
            float x0 = GetX(0);
            float y0 = GetY(y), y1 = GetY(y + 1);
            float z0 = GetZ(0, y), z1 = GetZ(0, y + 1);
            WriteTriangle(x0, y0, 0, x0, y0, z0, x0, y1, 0);
            WriteTriangle(x0, y1, 0, x0, y0, z0, x0, y1, z1);
        }

        // East wall (x = gridWidth - 1)
        for (int y = 0; y < quadsY; y++)
        {
            float x1 = GetX(gridWidth - 1);
            float y0 = GetY(y), y1 = GetY(y + 1);
            float z0 = GetZ(gridWidth - 1, y), z1 = GetZ(gridWidth - 1, y + 1);
            WriteTriangle(x1, y0, 0, x1, y1, 0, x1, y0, z0);
            WriteTriangle(x1, y1, 0, x1, y1, z1, x1, y0, z0);
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
        double heightMm)
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

        for (int y = 0; y < gridHeight; y++)
        {
            for (int x = 0; x < gridWidth; x++)
            {
                int vi = y * gridWidth + x;
                float px = -halfW + (x * dx);
                // Three.js convention: Y is up, Z is depth or Z is up depending on camera.
                // Standard: X = right, Y = height (Z relief), Z = forward/down
                float pz = -(-halfH + (y * dy)); // ground plane
                float py = heightMap[vi];         // height relief along +Y

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
                binData[cOff] = rgbMap[rgbIdx];         // R
                binData[cOff + 1] = rgbMap[rgbIdx + 1]; // G
                binData[cOff + 2] = rgbMap[rgbIdx + 2]; // B
                binData[cOff + 3] = 255;                // A

                // Default normal (approximate up vector)
                int nOff = normalOffset + (vi * 12);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff, 4), 0.0f);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff + 4, 4), 1.0f);
                BinaryPrimitives.WriteSingleLittleEndian(binData.AsSpan(nOff + 8, 4), 0.0f);
            }
        }

        // 2. Fill Indices
        int curIndexOffset = indexOffset;
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                int v0 = y * gridWidth + x;
                int v1 = y * gridWidth + (x + 1);
                int v2 = (y + 1) * gridWidth + x;
                int v3 = (y + 1) * gridWidth + (x + 1);

                // Quad as two triangles: (v0, v1, v2) and (v1, v3, v2)
                int[] quadIndices = [v0, v1, v2, v1, v3, v2];
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
    /// Generates a Bambu Studio / OrcaSlicer compatible .3mf ZIP package containing
    /// the watertight 3D relief mesh, color group resources, and print/layer swap instructions.
    /// </summary>
    public static byte[] GenerateBinary3mf(
        float[] heightMap,
        int gridWidth,
        int gridHeight,
        double widthMm,
        double heightMm,
        double baseThicknessMm = 0.48,
        LayerStackConfig? layerStackConfig = null,
        List<LayerSwapInstruction>? layerSwaps = null)
    {
        if (gridWidth < 2 || gridHeight < 2)
            throw new ArgumentException("Grid resolution must be at least 2x2.");

        float dx = (float)(widthMm / (gridWidth - 1));
        float dy = (float)(heightMm / (gridHeight - 1));
        float halfW = (float)(widthMm / 2.0);
        float halfH = (float)(heightMm / 2.0);

        int quadsX = gridWidth - 1;
        int quadsY = gridHeight - 1;
        int vertexGridCount = gridWidth * gridHeight;

        // Build 3dmodel.model XML
        var sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.AppendLine("<model unit=\"millimeter\" xml:lang=\"en-US\" xmlns=\"http://schemas.microsoft.com/3dmanufacturing/core/2015/02\" xmlns:m=\"http://schemas.microsoft.com/3dmanufacturing/material/2015/02\">");
        sb.AppendLine("  <metadata name=\"Title\">PrintCraft HueForge Filament Painting</metadata>");
        sb.AppendLine("  <metadata name=\"Designer\">PrintCraft</metadata>");
        sb.AppendLine("  <metadata name=\"Application\">PrintCraft HueForge Generator</metadata>");

        sb.AppendLine("  <resources>");

        // Palette color group if palette available
        var palette = layerStackConfig?.Palette ?? new List<FilamentPaletteItem>();
        if (palette.Count > 0)
        {
            sb.AppendLine("    <m:colorgroup id=\"1\">");
            foreach (var p in palette)
            {
                var hex = p.ColorHex.StartsWith("#") ? p.ColorHex : $"#{p.ColorHex}";
                sb.AppendLine(CultureInfo.InvariantCulture, $"      <m:color color=\"{hex}\" />");
            }
            sb.AppendLine("    </m:colorgroup>");
        }

        sb.AppendLine("    <object id=\"2\" type=\"model\">");
        sb.AppendLine("      <mesh>");

        // 1. Vertices: Top surface (indices 0 .. vertexGridCount - 1), then Bottom surface (indices vertexGridCount .. 2 * vertexGridCount - 1)
        sb.AppendLine("        <vertices>");
        for (int y = 0; y < gridHeight; y++)
        {
            float py = -halfH + (y * dy);
            for (int x = 0; x < gridWidth; x++)
            {
                float px = -halfW + (x * dx);
                float pz = heightMap[y * gridWidth + x];
                sb.AppendLine(CultureInfo.InvariantCulture, $"          <vertex x=\"{px:F3}\" y=\"{py:F3}\" z=\"{pz:F3}\" />");
            }
        }
        for (int y = 0; y < gridHeight; y++)
        {
            float py = -halfH + (y * dy);
            for (int x = 0; x < gridWidth; x++)
            {
                float px = -halfW + (x * dx);
                sb.AppendLine(CultureInfo.InvariantCulture, $"          <vertex x=\"{px:F3}\" y=\"{py:F3}\" z=\"0.000\" />");
            }
        }
        sb.AppendLine("        </vertices>");

        // 2. Triangles:
        sb.AppendLine("        <triangles>");

        // Top surface
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                int v0 = y * gridWidth + x;
                int v1 = y * gridWidth + (x + 1);
                int v2 = (y + 1) * gridWidth + x;
                int v3 = (y + 1) * gridWidth + (x + 1);

                sb.AppendLine($"          <triangle v1=\"{v0}\" v2=\"{v1}\" v3=\"{v2}\" />");
                sb.AppendLine($"          <triangle v1=\"{v1}\" v2=\"{v3}\" v3=\"{v2}\" />");
            }
        }

        // Bottom base (Z = 0, reverse winding)
        int bOff = vertexGridCount;
        for (int y = 0; y < quadsY; y++)
        {
            for (int x = 0; x < quadsX; x++)
            {
                int bv0 = bOff + (y * gridWidth + x);
                int bv1 = bOff + (y * gridWidth + (x + 1));
                int bv2 = bOff + ((y + 1) * gridWidth + x);
                int bv3 = bOff + ((y + 1) * gridWidth + (x + 1));

                sb.AppendLine($"          <triangle v1=\"{bv0}\" v2=\"{bv2}\" v3=\"{bv1}\" />");
                sb.AppendLine($"          <triangle v1=\"{bv1}\" v2=\"{bv2}\" v3=\"{bv3}\" />");
            }
        }

        // Side walls connecting Top border to Bottom border
        // South wall (y = 0)
        for (int x = 0; x < quadsX; x++)
        {
            int t0 = x, t1 = x + 1;
            int b0 = bOff + x, b1 = bOff + (x + 1);
            sb.AppendLine($"          <triangle v1=\"{b0}\" v2=\"{b1}\" v3=\"{t0}\" />");
            sb.AppendLine($"          <triangle v1=\"{b1}\" v2=\"{t1}\" v3=\"{t0}\" />");
        }

        // North wall (y = gridHeight - 1)
        for (int x = 0; x < quadsX; x++)
        {
            int t0 = (gridHeight - 1) * gridWidth + x;
            int t1 = (gridHeight - 1) * gridWidth + (x + 1);
            int b0 = bOff + t0, b1 = bOff + t1;
            sb.AppendLine($"          <triangle v1=\"{b0}\" v2=\"{t0}\" v3=\"{b1}\" />");
            sb.AppendLine($"          <triangle v1=\"{b1}\" v2=\"{t0}\" v3=\"{t1}\" />");
        }

        // West wall (x = 0)
        for (int y = 0; y < quadsY; y++)
        {
            int t0 = y * gridWidth;
            int t1 = (y + 1) * gridWidth;
            int b0 = bOff + t0, b1 = bOff + t1;
            sb.AppendLine($"          <triangle v1=\"{b0}\" v2=\"{t0}\" v3=\"{b1}\" />");
            sb.AppendLine($"          <triangle v1=\"{b1}\" v2=\"{t0}\" v3=\"{t1}\" />");
        }

        // East wall (x = gridWidth - 1)
        for (int y = 0; y < quadsY; y++)
        {
            int t0 = y * gridWidth + (gridWidth - 1);
            int t1 = (y + 1) * gridWidth + (gridWidth - 1);
            int b0 = bOff + t0, b1 = bOff + t1;
            sb.AppendLine($"          <triangle v1=\"{b0}\" v2=\"{b1}\" v3=\"{t0}\" />");
            sb.AppendLine($"          <triangle v1=\"{b1}\" v2=\"{t1}\" v3=\"{t0}\" />");
        }

        sb.AppendLine("        </triangles>");
        sb.AppendLine("      </mesh>");
        sb.AppendLine("    </object>");
        sb.AppendLine("  </resources>");
        sb.AppendLine("  <build>");
        sb.AppendLine("    <item objectid=\"2\" />");
        sb.AppendLine("  </build>");
        sb.AppendLine("</model>");

        var modelXmlBytes = Encoding.UTF8.GetBytes(sb.ToString());

        // Build instructions / README text
        var instructionsSb = new StringBuilder();
        instructionsSb.AppendLine("================================================================================");
        instructionsSb.AppendLine("PRINTCRAFT HUEFORGE PRINT INSTRUCTIONS & LAYER PAUSE GUIDE");
        instructionsSb.AppendLine("================================================================================");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"Dimensions: {widthMm:F1} mm (X) x {heightMm:F1} mm (Y) x {(layerStackConfig?.MaxDepthMm ?? 2.0):F2} mm (Z)");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"Base Layer Height: {(layerStackConfig?.BaseLayerHeightMm ?? 0.16):F2} mm");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"Detail Layer Height: {(layerStackConfig?.LayerHeightMm ?? 0.08):F2} mm");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"Solid Base Thickness: {baseThicknessMm:F2} mm");
        instructionsSb.AppendLine();
        instructionsSb.AppendLine("RECOMMENDED SLICER SETTINGS (Bambu Studio / OrcaSlicer / PrusaSlicer):");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"- Initial layer height: {(layerStackConfig?.BaseLayerHeightMm ?? 0.16):F2} mm");
        instructionsSb.AppendLine(CultureInfo.InvariantCulture, $"- Layer height: {(layerStackConfig?.LayerHeightMm ?? 0.08):F2} mm");
        instructionsSb.AppendLine("- Infill density: 100% (Rectilinear)");
        instructionsSb.AppendLine("- Bottom / Top shell layers: Ensure 100% solid infill");
        instructionsSb.AppendLine("- Seam position: Back or Nearest");
        instructionsSb.AppendLine();
        instructionsSb.AppendLine("FILAMENT PALETTE & LAYER SWAP INSTRUCTIONS:");
        instructionsSb.AppendLine("--------------------------------------------------------------------------------");

        if (layerSwaps != null && layerSwaps.Count > 0)
        {
            foreach (var swap in layerSwaps)
            {
                instructionsSb.AppendLine(CultureInfo.InvariantCulture,
                    $"Swap #{swap.SwapNumber,2} | Layer {swap.LayerNumber,3} ({swap.HeightMm:F2} mm) -> {swap.ColorName} ({swap.ColorHex}) [{swap.Material}]");
                instructionsSb.AppendLine($"  => {swap.Instruction}");
            }
        }
        else if (palette.Count > 0)
        {
            for (int i = 0; i < palette.Count; i++)
            {
                var p = palette[i];
                instructionsSb.AppendLine(CultureInfo.InvariantCulture,
                    $"Slot #{i + 1}: {p.Name} ({p.ColorHex}) - {p.Material} (TD: {p.TransmissionDistanceMm:F1}mm, Range: {p.StartHeightMm:F2}mm - {p.EndHeightMm:F2}mm)");
            }
        }

        instructionsSb.AppendLine("--------------------------------------------------------------------------------");
        instructionsSb.AppendLine("BAMBU AMS SETUP TIPS:");
        instructionsSb.AppendLine("1. Load your spool colors matching the palette order above into your AMS slots.");
        instructionsSb.AppendLine("2. In Bambu Studio Preview tab, move the right-hand layer slider to each layer listed above.");
        instructionsSb.AppendLine("3. Right-click the plus icon '+' on the slider and select 'Change Filament' or 'Add Pause'.");
        instructionsSb.AppendLine("================================================================================");

        var instructionsBytes = Encoding.UTF8.GetBytes(instructionsSb.ToString());

        const string contentTypesXml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml" />
          <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml" />
          <Default Extension="txt" ContentType="text/plain" />
        </Types>
        """;

        const string relsXml = """
        <?xml version="1.0" encoding="UTF-8"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" />
        </Relationships>
        """;

        using var memoryStream = new MemoryStream();
        using (var archive = new ZipArchive(memoryStream, ZipArchiveMode.Create, true))
        {
            void AddZipFile(string entryName, byte[] data)
            {
                var entry = archive.CreateEntry(entryName, CompressionLevel.Optimal);
                using var entryStream = entry.Open();
                entryStream.Write(data, 0, data.Length);
            }

            AddZipFile("[Content_Types].xml", Encoding.UTF8.GetBytes(contentTypesXml));
            AddZipFile("_rels/.rels", Encoding.UTF8.GetBytes(relsXml));
            AddZipFile("3D/3dmodel.model", modelXmlBytes);
            AddZipFile("Metadata/print_instructions.txt", instructionsBytes);
            AddZipFile("README.txt", instructionsBytes);
        }

        return memoryStream.ToArray();
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

        var readmeBytes = Encoding.UTF8.GetBytes(sb.ToString());

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
            {
                readmeStream.Write(readmeBytes, 0, readmeBytes.Length);
            }
        }

        return memoryStream.ToArray();
    }
}


