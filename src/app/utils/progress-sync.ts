/** Cross-page signal after PATCH /progress/roadmap/update so list views refetch (same pattern as mobile invalidating queries). */
export const CCC_PROGRESS_UPDATED = "ccc:progress-updated";

const PASTOR_ASSIGN_BROADCAST = "ccc-pastor-assignments";

export function emitProgressUpdated(userId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CCC_PROGRESS_UPDATED, { detail: { userId } }),
  );
}

/**
 * Call after director assigns roadmap(s) or assessment(s) via progress APIs so the pastor UI
 * refetches in the same tab (CustomEvent) and in other tabs (BroadcastChannel).
 */
export function emitPastorAssignmentsChanged(userIds: string[]): void {
  const ids = [...new Set(userIds.map(String).filter(Boolean))];
  if (!ids.length) return;
  ids.forEach((userId) => emitProgressUpdated(userId));
  if (typeof BroadcastChannel === "undefined") return;
  try {
    const bc = new BroadcastChannel(PASTOR_ASSIGN_BROADCAST);
    bc.postMessage({ userIds: ids });
    bc.close();
  } catch {
    // ignore
  }
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

/** Same as progress events but works across browser tabs (director assigns, pastor dashboard open). */
export function subscribePastorAssignmentsBroadcast(handler: (userIds: string[]) => void): () => void {
  if (typeof BroadcastChannel === "undefined") return () => {};
  const bc = new BroadcastChannel(PASTOR_ASSIGN_BROADCAST);
  bc.onmessage = (ev: MessageEvent) => {
    const ids = ev.data?.userIds;
    if (Array.isArray(ids)) handler(ids.map(String));
  };
  return () => bc.close();
}
