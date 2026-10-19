const API_ORIGIN =
  (import.meta.env.VITE_API_ORIGIN as string | undefined) || "";

function normalizeAssetPath(raw: string): string {
  const normalized = raw.trim().replace(/\\/g, "/");

  const uploadsIndex = normalized.toLowerCase().indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  if (/^[a-zA-Z]:\//.test(normalized)) {
    const fileName = normalized.split("/").pop();
    return fileName ? `/uploads/${fileName}` : "/uploads";
  }

  return normalized.startsWith("/") ? normalized : `/${normalized}`;
}

export function resolveAssetUrl(url?: string | null): string {
  if (!url) return "";

  const trimmed = url.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const normalizedPath = normalizeAssetPath(trimmed);

  return API_ORIGIN ? `${API_ORIGIN}${normalizedPath}` : normalizedPath;
}
