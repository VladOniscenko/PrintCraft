using System.Buffers.Binary;
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
}

