import { getCookie } from "@/app/utils/cookies";
import { getAccessToken } from "@/app/utils/auth-tokens";
export { normalizeUserCookieForClient } from "@/app/utils/user-cookie";

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

/** Session = bearer token + resolvable user id (API calls need both). */
export function hasPastorSession(): boolean {
  return !!getAccessToken() && !!getPastorUserId();
}

