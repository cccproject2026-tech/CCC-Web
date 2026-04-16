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
  const raw = getCookie("mentor");
  if (raw) {
    try {
      const u = JSON.parse(raw) as { id?: string; _id?: string };
      const id = u.id ?? u._id;
      if (id != null && String(id).trim() !== "") return String(id);
    } catch {
      // Fall back to legacy cookie below.
    }
  }
  const direct = getCookie("userId")?.trim();
  return direct || null;
}

export function hasMentorSession(): boolean {
  return !!getAccessToken() && !!getMentorUserId();
}
