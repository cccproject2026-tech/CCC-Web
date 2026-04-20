import { getCookie } from "@/app/utils/cookies";

/**
 * After login, backend may only set `_id`. Persist `id` alias so older screens work.
 */
export function normalizeUserCookieForClient(
  user: Record<string, unknown>,
): Record<string, unknown> {
  const id = user.id ?? user._id;
  if (id == null) return user;
  return { ...user, id: String(id) };
}

/** Lowercased role from the shared `user` cookie (pastor/director login), or null. */
export function getRoleFromUserCookie(): string | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie("user");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as { role?: unknown };
    const r = u.role;
    if (r == null || String(r).trim() === "") return null;
    return String(r).toLowerCase().trim();
  } catch {
    return null;
  }
}
