using System.Buffers.Binary;
using System.IO.Compression;

namespace PrintCraft.Features.Filaments.Services.FilamentPainting;

public sealed class DecodedImage
{
    public int Width { get; init; }
    public int Height { get; init; }
    public byte[] RgbBytes { get; init; } = Array.Empty<byte>();

    /// <summary>
    /// Resamples the image to a target grid resolution (e.g., 150x100) using bilinear interpolation.
    /// </summary>
    public DecodedImage Resample(int targetWidth, int targetHeight)
    {
        if (targetWidth <= 0 || targetHeight <= 0)
            throw new ArgumentException("Target dimensions must be positive.");

        if (Width == targetWidth && Height == targetHeight)
            return this;

        byte[] outputRgb = new byte[targetWidth * targetHeight * 3];
        float scaleX = (float)Width / targetWidth;
        float scaleY = (float)Height / targetHeight;

        for (int ty = 0; ty < targetHeight; ty++)
        {
            float srcY = (ty + 0.5f) * scaleY - 0.5f;
            int y0 = Math.Clamp((int)MathF.Floor(srcY), 0, Height - 1);
            int y1 = Math.Clamp(y0 + 1, 0, Height - 1);
            float wy1 = srcY - y0;
            float wy0 = 1.0f - wy1;

            for (int tx = 0; tx < targetWidth; tx++)
            {
                float srcX = (tx + 0.5f) * scaleX - 0.5f;
                int x0 = Math.Clamp((int)MathF.Floor(srcX), 0, Width - 1);
                int x1 = Math.Clamp(x0 + 1, 0, Width - 1);
                float wx1 = srcX - x0;
                float wx0 = 1.0f - wx1;

                int i00 = (y0 * Width + x0) * 3;
                int i10 = (y0 * Width + x1) * 3;
                int i01 = (y1 * Width + x0) * 3;
                int i11 = (y1 * Width + x1) * 3;

                int outIdx = (ty * targetWidth + tx) * 3;

                for (int c = 0; c < 3; c++)
                {
                    float top = RgbBytes[i00 + c] * wx0 + RgbBytes[i10 + c] * wx1;
                    float bottom = RgbBytes[i01 + c] * wx0 + RgbBytes[i11 + c] * wx1;
                    float val = top * wy0 + bottom * wy1;
                    outputRgb[outIdx + c] = (byte)Math.Clamp(MathF.Round(val), 0, 255);
                }
            }
        }

        return new DecodedImage
        {
            Width = targetWidth,
            Height = targetHeight,
            RgbBytes = outputRgb
        };
    }
}

/// <summary>
/// Lightweight, dependency-free image reader supporting PNG (with ZLibStream decompressor)
/// and BMP formats, providing RGB pixel buffers for HueForge mesh generation.
/// </summary>
public static class SimpleImageReader
{
    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public static DecodedImage Decode(byte[] fileBytes)
    {
        ArgumentNullException.ThrowIfNull(fileBytes);

        if (fileBytes.Length >= 8 && fileBytes.AsSpan(0, 8).SequenceEqual(PngHeader))
        {
            return DecodePng(fileBytes);
        }

        if (fileBytes.Length >= 2 && fileBytes[0] == 0x42 && fileBytes[1] == 0x4D) // "BM"
        {
            return DecodeBmp(fileBytes);
        }

        throw new NotSupportedException("Image format is not recognized. Please provide a standard PNG or BMP file.");
    }

    private static DecodedImage DecodePng(byte[] pngBytes)
    {
        int offset = 8;
        int width = 0;
        int height = 0;
        byte bitDepth = 0;
        byte colorType = 0;
        byte compressionMethod = 0;
        byte filterMethod = 0;
        byte interlaceMethod = 0;
        int exifOrientation = 1;

        byte[]? palette = null;
        using var idatStream = new MemoryStream();

        while (offset + 8 <= pngBytes.Length)
        {
            uint chunkLength = BinaryPrimitives.ReadUInt32BigEndian(pngBytes.AsSpan(offset, 4));
            offset += 4;

            string chunkType = System.Text.Encoding.ASCII.GetString(pngBytes, offset, 4);
            offset += 4;

            if (offset + chunkLength > pngBytes.Length)
                break;

            var chunkData = pngBytes.AsSpan(offset, (int)chunkLength);

            if (chunkType == "IHDR")
            {
                width = BinaryPrimitives.ReadInt32BigEndian(chunkData[..4]);
                height = BinaryPrimitives.ReadInt32BigEndian(chunkData.Slice(4, 4));
                bitDepth = chunkData[8];
                colorType = chunkData[9];
                compressionMethod = chunkData[10];
                filterMethod = chunkData[11];
                interlaceMethod = chunkData[12];
            }
            else if (chunkType == "PLTE")
            {
                palette = chunkData.ToArray();
            }
            else if (chunkType == "IDAT")
            {
                idatStream.Write(chunkData);
            }
            else if (chunkType == "eXIf" && chunkData.Length >= 8)
            {
                // Optional EXIF orientation chunk in PNG
                exifOrientation = ParseExifOrientation(chunkData);
            }
            else if (chunkType == "IEND")
            {
                break;
            }

            offset += (int)chunkLength + 4; // Skip CRC (4 bytes)
        }

        if (width <= 0 || height <= 0)
            throw new InvalidOperationException("Invalid PNG image dimensions.");

        if (interlaceMethod != 0)
            throw new NotSupportedException("Interlaced PNG is not supported.");

        int bytesPerPixel = colorType switch
        {
            0 => 1, // Grayscale (8-bit)
            2 => 3, // RGB (8-bit)
            3 => 1, // Indexed (8-bit)
            4 => 2, // Grayscale + Alpha (8-bit)
            6 => 4, // RGBA (8-bit)
            _ => throw new NotSupportedException($"Unsupported PNG color type {colorType}.")
        };

        if (bitDepth != 8)
            throw new NotSupportedException($"Only 8-bit PNG images are currently supported. Provided: {bitDepth}-bit.");

        idatStream.Position = 0;
        using var zlib = new ZLibStream(idatStream, CompressionMode.Decompress);
        using var decompressed = new MemoryStream();
        zlib.CopyTo(decompressed);

        byte[] raw = decompressed.ToArray();
        int bytesPerRow = width * bytesPerPixel;
        int expectedDecompressedSize = height * (1 + bytesPerRow);

        if (raw.Length < expectedDecompressedSize)
            throw new InvalidOperationException("Incomplete PNG image data.");

        byte[] outputRgb = new byte[width * height * 3];
        byte[] currentScanline = new byte[bytesPerRow];
        byte[] priorScanline = new byte[bytesPerRow];

        int rawPos = 0;

        for (int y = 0; y < height; y++)
        {
            byte filterType = raw[rawPos++];

            // Un-filter scanline
            for (int x = 0; x < bytesPerRow; x++)
            {
                byte rawByte = raw[rawPos++];
                byte left = x >= bytesPerPixel ? currentScanline[x - bytesPerPixel] : (byte)0;
                byte up = priorScanline[x];
                byte upLeft = x >= bytesPerPixel ? priorScanline[x - bytesPerPixel] : (byte)0;

                byte recon = filterType switch
                {
                    0 => rawByte, // None
                    1 => (byte)(rawByte + left), // Sub
                    2 => (byte)(rawByte + up), // Up
                    3 => (byte)(rawByte + ((left + up) >> 1)), // Average
                    4 => (byte)(rawByte + PaethPredictor(left, up, upLeft)), // Paeth
                    _ => rawByte
                };

                currentScanline[x] = recon;
            }

            // Copy to output RGB buffer
            int rowPixelStart = y * width * 3;
            for (int x = 0; x < width; x++)
            {
                int outIdx = rowPixelStart + (x * 3);
                int srcIdx = x * bytesPerPixel;

                switch (colorType)
                {
                    case 2: // RGB
                        outputRgb[outIdx] = currentScanline[srcIdx];
                        outputRgb[outIdx + 1] = currentScanline[srcIdx + 1];
                        outputRgb[outIdx + 2] = currentScanline[srcIdx + 2];
                        break;
                    case 6: // RGBA (composite over #FFFFFF background)
                        byte r6 = currentScanline[srcIdx];
                        byte g6 = currentScanline[srcIdx + 1];
                        byte b6 = currentScanline[srcIdx + 2];
                        byte a6 = currentScanline[srcIdx + 3];
                        if (a6 == 255)
                        {
                            outputRgb[outIdx] = r6;
                            outputRgb[outIdx + 1] = g6;
                            outputRgb[outIdx + 2] = b6;
                        }
                        else
                        {
                            float alpha = a6 / 255.0f;
                            outputRgb[outIdx] = (byte)Math.Clamp(MathF.Round(r6 * alpha + 255f * (1.0f - alpha)), 0, 255);
                            outputRgb[outIdx + 1] = (byte)Math.Clamp(MathF.Round(g6 * alpha + 255f * (1.0f - alpha)), 0, 255);
                            outputRgb[outIdx + 2] = (byte)Math.Clamp(MathF.Round(b6 * alpha + 255f * (1.0f - alpha)), 0, 255);
                        }
                        break;
                    case 0: // Grayscale
                        outputRgb[outIdx] = currentScanline[srcIdx];
                        outputRgb[outIdx + 1] = currentScanline[srcIdx];
                        outputRgb[outIdx + 2] = currentScanline[srcIdx];
                        break;
                    case 4: // Grayscale + Alpha (composite over #FFFFFF background)
                        byte gray4 = currentScanline[srcIdx];
                        byte a4 = currentScanline[srcIdx + 1];
                        if (a4 == 255)
                        {
                            outputRgb[outIdx] = gray4;
                            outputRgb[outIdx + 1] = gray4;
                            outputRgb[outIdx + 2] = gray4;
                        }
                        else
                        {
                            float alpha = a4 / 255.0f;
                            byte comp = (byte)Math.Clamp(MathF.Round(gray4 * alpha + 255f * (1.0f - alpha)), 0, 255);
                            outputRgb[outIdx] = comp;
                            outputRgb[outIdx + 1] = comp;
                            outputRgb[outIdx + 2] = comp;
                        }
                        break;
                    case 3: // Indexed
                        if (palette != null)
                        {
                            int palIdx = currentScanline[srcIdx] * 3;
                            if (palIdx + 2 < palette.Length)
                            {
                                outputRgb[outIdx] = palette[palIdx];
                                outputRgb[outIdx + 1] = palette[palIdx + 1];
                                outputRgb[outIdx + 2] = palette[palIdx + 2];
                            }
                        }
                        break;
                }
            }

            // Swap scanlines
            Array.Copy(currentScanline, priorScanline, bytesPerRow);
        }

        var decoded = new DecodedImage
        {
            Width = width,
            Height = height,
            RgbBytes = outputRgb
        };

        return exifOrientation > 1 ? ApplyExifOrientation(decoded, exifOrientation) : decoded;
    }

    private static byte PaethPredictor(int a, int b, int c)
    {
        int p = a + b - c;
        int pa = Math.Abs(p - a);
        int pb = Math.Abs(p - b);
        int pc = Math.Abs(p - c);

        if (pa <= pb && pa <= pc) return (byte)a;
        if (pb <= pc) return (byte)b;
        return (byte)c;
    }

    private static DecodedImage DecodeBmp(byte[] bmpBytes)
    {
        if (bmpBytes.Length < 54)
            throw new InvalidOperationException("Invalid BMP header.");

        int pixelOffset = BinaryPrimitives.ReadInt32LittleEndian(bmpBytes.AsSpan(10, 4));
        int width = BinaryPrimitives.ReadInt32LittleEndian(bmpBytes.AsSpan(18, 4));
        int height = BinaryPrimitives.ReadInt32LittleEndian(bmpBytes.AsSpan(22, 4));
        ushort bpp = BinaryPrimitives.ReadUInt16LittleEndian(bmpBytes.AsSpan(28, 2));

        if (width <= 0 || height == 0)
            throw new InvalidOperationException("Invalid BMP dimensions.");

        bool topDown = height < 0;
        int absHeight = Math.Abs(height);

        if (bpp != 24 && bpp != 32)
            throw new NotSupportedException($"Only 24-bit and 32-bit BMP images are supported (received {bpp}-bit).");

        int bytesPerPixel = bpp / 8;
        int rowStride = ((width * bytesPerPixel) + 3) & ~3; // 4-byte aligned
        byte[] outputRgb = new byte[width * absHeight * 3];

        for (int y = 0; y < absHeight; y++)
        {
            int srcY = topDown ? y : (absHeight - 1 - y);
            int rowOffset = pixelOffset + (srcY * rowStride);

            for (int x = 0; x < width; x++)
            {
                int srcIdx = rowOffset + (x * bytesPerPixel);
                int outIdx = (y * width + x) * 3;

                if (srcIdx + 2 < bmpBytes.Length)
                {
                    byte b = bmpBytes[srcIdx];
                    byte g = bmpBytes[srcIdx + 1];
                    byte r = bmpBytes[srcIdx + 2];

                    if (bpp == 32 && srcIdx + 3 < bmpBytes.Length)
                    {
                        byte a = bmpBytes[srcIdx + 3];
                        if (a < 255)
                        {
                            float alpha = a / 255.0f;
                            r = (byte)Math.Clamp(MathF.Round(r * alpha + 255f * (1.0f - alpha)), 0, 255);
                            g = (byte)Math.Clamp(MathF.Round(g * alpha + 255f * (1.0f - alpha)), 0, 255);
                            b = (byte)Math.Clamp(MathF.Round(b * alpha + 255f * (1.0f - alpha)), 0, 255);
                        }
                    }

                    outputRgb[outIdx] = r;     // R
                    outputRgb[outIdx + 1] = g; // G
                    outputRgb[outIdx + 2] = b; // B
                }
            }
        }

        return new DecodedImage
        {
            Width = width,
            Height = absHeight,
            RgbBytes = outputRgb
        };
    }

    private static int ParseExifOrientation(ReadOnlySpan<byte> exifData)
    {
        try
        {
            if (exifData.Length < 14) return 1;

            bool littleEndian = exifData[0] == 0x49 && exifData[1] == 0x49; // "II"
            bool bigEndian = exifData[0] == 0x4D && exifData[1] == 0x4D;    // "MM"
            if (!littleEndian && !bigEndian) return 1;

            static int ReadU16(ReadOnlySpan<byte> span, int offset, bool le)
            {
                if (offset + 2 > span.Length) return 0;
                return le
                    ? BinaryPrimitives.ReadUInt16LittleEndian(span.Slice(offset, 2))
                    : BinaryPrimitives.ReadUInt16BigEndian(span.Slice(offset, 2));
            }

            static int ReadU32(ReadOnlySpan<byte> span, int offset, bool le)
            {
                if (offset + 4 > span.Length) return 0;
                return (int)(le
                    ? BinaryPrimitives.ReadUInt32LittleEndian(span.Slice(offset, 4))
                    : BinaryPrimitives.ReadUInt32BigEndian(span.Slice(offset, 4)));
            }

            int firstIfdOffset = ReadU32(exifData, 4, littleEndian);
            if (firstIfdOffset < 8 || firstIfdOffset + 2 > exifData.Length) return 1;

            int tagCount = ReadU16(exifData, firstIfdOffset, littleEndian);
            int cur = firstIfdOffset + 2;

            for (int i = 0; i < tagCount && cur + 12 <= exifData.Length; i++, cur += 12)
            {
                int tag = ReadU16(exifData, cur, littleEndian);
                if (tag == 0x0112) // Orientation tag
                {
                    int val = ReadU16(exifData, cur + 8, littleEndian);
                    if (val >= 1 && val <= 8) return val;
                }
            }
        }
        catch
        {
            // Ignore corrupted EXIF
        }

        return 1;
    }

    private static DecodedImage ApplyExifOrientation(DecodedImage image, int orientation)
    {
        int w = image.Width;
        int h = image.Height;
        byte[] src = image.RgbBytes;

        switch (orientation)
        {
            case 3: // 180 rotate
            {
                byte[] dst = new byte[w * h * 3];
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int srcIdx = (y * w + x) * 3;
                        int dstIdx = ((h - 1 - y) * w + (w - 1 - x)) * 3;
                        dst[dstIdx] = src[srcIdx];
                        dst[dstIdx + 1] = src[srcIdx + 1];
                        dst[dstIdx + 2] = src[srcIdx + 2];
                    }
                }
                return new DecodedImage { Width = w, Height = h, RgbBytes = dst };
            }
            case 6: // Rotate 90 CW (w and h swapped)
            {
                byte[] dst = new byte[w * h * 3];
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int srcIdx = (y * w + x) * 3;
                        int dstX = h - 1 - y;
                        int dstY = x;
                        int dstIdx = (dstY * h + dstX) * 3;
                        dst[dstIdx] = src[srcIdx];
                        dst[dstIdx + 1] = src[srcIdx + 1];
                        dst[dstIdx + 2] = src[srcIdx + 2];
                    }
                }
                return new DecodedImage { Width = h, Height = w, RgbBytes = dst };
            }
            case 8: // Rotate 270 CW (90 CCW, w and h swapped)
            {
                byte[] dst = new byte[w * h * 3];
                for (int y = 0; y < h; y++)
                {
                    for (int x = 0; x < w; x++)
                    {
                        int srcIdx = (y * w + x) * 3;
                        int dstX = y;
                        int dstY = w - 1 - x;
                        int dstIdx = (dstY * h + dstX) * 3;
                        dst[dstIdx] = src[srcIdx];
                        dst[dstIdx + 1] = src[srcIdx + 1];
                        dst[dstIdx + 2] = src[srcIdx + 2];
                    }
                }
                return new DecodedImage { Width = h, Height = w, RgbBytes = dst };
            }
            default:
                return image;
        }
    }
}

