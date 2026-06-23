import { getCookie } from "@/app/utils/cookies";
import { getAccessToken } from "@/app/utils/auth-tokens";
export { normalizeUserCookieForClient } from "@/app/utils/user-cookie";

const PUBLIC_PATH_PREFIXES = ["/mentor/login"] as const;

export function isMentorPublicRoute(pathname: string): boolean {
  const p = pathname.split("?")[0] || "";
  return PUBLIC_PATH_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

export function normalizeRoleForAuth(role: unknown): string {
  return String(role || "")
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[_\s]+/g, "-")
    .toLowerCase();
}

export function isMentorPortalRole(user: unknown): boolean {
  const row =
    user && typeof user === "object" ? (user as Record<string, unknown>) : {};
  const normalizedRole = normalizeRoleForAuth(row.role);

  return (
    normalizedRole === "mentor" ||
    normalizedRole === "field-mentor" ||
    row.isFieldMentor === true
  );
}

/** Mentor area stores the profile JSON in the `mentor` cookie. */
export function getMentorUserId(): string | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie("mentor");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as { id?: string; _id?: string };
    const id = u.id ?? u._id;
    if (id != null && String(id).trim() !== "") return String(id);
  } catch {
    return null;
  }
  return null;
}

/** Session = token + `mentor` cookie with role `mentor` (do not use shared `userId` alone). */
export function hasMentorSession(): boolean {
  if (!getAccessToken()) return false;
  const raw = getCookie("mentor");
  if (!raw) return false;
  try {
    const u = JSON.parse(raw) as { role?: unknown; id?: string; _id?: string; isFieldMentor?: unknown };
    const id = u.id ?? u._id;
    if (id == null || String(id).trim() === "") return false;
    return isMentorPortalRole(u);
  } catch {
    return false;
  }
}
