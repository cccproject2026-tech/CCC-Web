/** Cross-page signal after PATCH /progress/roadmap/update so list views refetch (same pattern as mobile invalidating queries). */
export const CCC_PROGRESS_UPDATED = "ccc:progress-updated";

export function emitProgressUpdated(userId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CCC_PROGRESS_UPDATED, { detail: { userId } }),
  );
}

export function subscribeProgressUpdated(handler: (userId: string) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const uid = (e as CustomEvent<{ userId?: string }>).detail?.userId;
    if (uid) handler(uid);
  };
  window.addEventListener(CCC_PROGRESS_UPDATED, fn);
  return () => window.removeEventListener(CCC_PROGRESS_UPDATED, fn);
}
