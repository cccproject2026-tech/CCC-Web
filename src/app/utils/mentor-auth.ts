import { getCookie } from "@/app/utils/cookies";
import { getAccessToken } from "@/app/utils/auth-tokens";
export { normalizeUserCookieForClient } from "@/app/utils/user-cookie";

const PUBLIC_PATH_PREFIXES = ["/mentor/login"] as const;

export function isMentorPublicRoute(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return PUBLIC_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Mentor area stores the profile JSON in the `mentor` cookie; `userId` may also be set at login. */
export function getMentorUserId(): string | null {
  if (typeof document === "undefined") return null;
  const direct = getCookie("userId")?.trim();
  if (direct) return direct;
  const raw = getCookie("mentor");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as { id?: string; _id?: string };
    const id = u.id ?? u._id;
    return id != null && String(id).trim() !== "" ? String(id) : null;
  } catch {
    return null;
  }
}

export function hasMentorSession(): boolean {
  return !!getAccessToken() && !!getMentorUserId();
}
