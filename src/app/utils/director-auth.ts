import { getCookie } from "@/app/utils/cookies";
import { getAccessToken } from "@/app/utils/auth-tokens";
export { normalizeUserCookieForClient } from "@/app/utils/user-cookie";

const PUBLIC_PATH_PREFIXES = ["/director/login"] as const;

export function isDirectorPublicRoute(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return PUBLIC_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Director uses the same `user` + `userId` cookies as pastor login flow. */
export function getDirectorUserId(): string | null {
  if (typeof document === "undefined") return null;
  const direct = getCookie("userId")?.trim();
  if (direct) return direct;
  const raw = getCookie("user");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as { id?: string; _id?: string };
    const id = u.id ?? u._id;
    return id != null && String(id).trim() !== "" ? String(id) : null;
  } catch {
    return null;
  }
}

export function hasDirectorSession(): boolean {
  if (!getAccessToken() || !getDirectorUserId()) return false;
  const raw = getCookie("user");
  if (!raw) return false;
  try {
    const u = JSON.parse(raw) as { role?: unknown };
    const r = u.role != null ? String(u.role).toLowerCase().trim() : "";
    return r === "director";
  } catch {
    return false;
  }
}
