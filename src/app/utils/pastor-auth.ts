import { getCookie } from "@/app/utils/cookies";
import { getAccessToken } from "@/app/utils/auth-tokens";
import { isPastorSideRole } from "@/app/utils/common-login";
export { normalizeUserCookieForClient, getRoleFromUserCookie } from "@/app/utils/user-cookie";

/** Routes under /pastor that do not require a session (onboarding / auth). */
const PUBLIC_PATH_PREFIXES = [
  "/pastor/login",
  "/pastor/InterestForm",
  "/pastor/setpassword",
  "/pastor/Processing",
  "/pastor/waitingforapproval",
  "/pastor/resetpassword",
  "/pastor/splash",
  "/pastor/Thankyou",
] as const;

export function isPastorPublicRoute(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return PUBLIC_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

/** Normalize user id from API (Mongo `id` / `_id`) or dedicated cookie. */
export function getPastorUserId(): string | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie("user");
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

/**
 * Session = bearer token + resolvable user id + `user` cookie role is `pastor`.
 * (Same cookies were previously shared across portals, which caused wrong auto-redirects.)
 */
export function hasPastorSession(): boolean {
  if (!getAccessToken() || !getPastorUserId()) return false;
  const raw = getCookie("user");
  if (!raw) return false;
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    return isPastorSideRole(u);
  } catch {
    return false;
  }
}

