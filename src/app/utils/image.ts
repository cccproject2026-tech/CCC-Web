/** Absolute http(s) URLs — use with next/image `unoptimized` so the browser loads the asset (avoids Node TLS issues during optimization). */
export function isRemoteImageSrc(src: unknown): boolean {
  return typeof src === "string" && /^https?:\/\//i.test(src);
}
