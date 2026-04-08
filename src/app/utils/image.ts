/** Absolute http(s) URLs — use with next/image `unoptimized` so the browser loads the asset (avoids Node TLS issues during optimization). */
export function isRemoteImageSrc(src: unknown): boolean {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}

const DEFAULT_API_PUBLIC_ORIGIN = "https://app.wisdomtooth.tech";

/**
 * Turns API banner/media strings into an absolute URL the browser can load.
 * Handles full http(s) URLs, protocol-relative `//`, `data:`, and server-relative paths
 * (`/uploads/...`) by prefixing the API public origin.
 */
export function resolveApiMediaUrl(url: unknown): string | null {
  if (url == null || typeof url !== "string") return null;
  const s = url.trim();
  if (!s) return null;
  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("//")) return `https:${s}`;

  const fromEnv =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_API_PUBLIC_ORIGIN?.replace(/\/+$/, "")
      : undefined;
  const origin = fromEnv || DEFAULT_API_PUBLIC_ORIGIN;

  if (s.startsWith("/")) return `${origin}${s}`;
  return `${origin}/${s}`;
}
