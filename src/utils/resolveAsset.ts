/**
 * Resolves an imported asset to a URL string.
 * In Vite: images import as strings.
 * In Next.js/Turbopack: images import as { src, width, height } objects.
 * This helper normalizes both to a plain string URL.
 */
export function resolveAsset(asset: unknown): string {
  if (typeof asset === "string") return asset;
  if (asset && typeof asset === "object" && "src" in asset) {
    return (asset as { src: string }).src;
  }
  if (asset && typeof asset === "object" && "default" in asset) {
    const def = (asset as { default: unknown }).default;
    if (typeof def === "string") return def;
    if (def && typeof def === "object" && "src" in def) {
      return (def as { src: string }).src;
    }
  }
  return String(asset ?? "");
}
