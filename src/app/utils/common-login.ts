import { apiGetUserById, unwrapUserResponse } from "@/app/Services/users.service";
import { clearAllCookies, removeCookie, setCookie } from "@/app/utils/cookies";
import { normalizeRoleForAuth, isMentorPortalRole, normalizeUserCookieForClient } from "@/app/utils/mentor-auth";

export type PortalRole = "pastor" | "mentor";

export interface CommonLoginSessionInput {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
}

const ROLE_KEYS = ["role", "userType", "accountType", "type", "portalRole"] as const;

function readRoleCandidate(user: unknown): string {
  if (!user || typeof user !== "object") return "";
  const row = user as Record<string, unknown>;
  for (const key of ROLE_KEYS) {
    const value = row[key];
    if (value != null && String(value).trim()) {
      return normalizeRoleForAuth(value);
    }
  }
  return "";
}

export function detectPortalRole(user: unknown): PortalRole | "director" | null {
  const row = user && typeof user === "object" ? (user as Record<string, unknown>) : {};
  const role = readRoleCandidate(user);

  if (role === "director") return "director";
  if (isMentorPortalRole({ ...row, role })) return "mentor";
  if (role === "pastor") return "pastor";
  return null;
}

export function normalizeLoginUser(user: unknown): Record<string, unknown> | null {
  if (!user || typeof user !== "object") return null;
  return normalizeUserCookieForClient(user as Record<string, unknown>);
}

export function storePortalSession(role: PortalRole, input: CommonLoginSessionInput): {
  normalizedUser: Record<string, unknown> | null;
  userId: string | null;
} {
  const normalizedUser = normalizeLoginUser(input.user);
  const userId = normalizedUser ? String(normalizedUser.id ?? normalizedUser._id ?? "").trim() : "";

  if (input.accessToken) setCookie("accessToken", input.accessToken);
  if (input.refreshToken) setCookie("refreshToken", input.refreshToken);

  if (role === "mentor") {
    removeCookie("user");
    if (normalizedUser) setCookie("mentor", JSON.stringify(normalizedUser));
  } else {
    removeCookie("mentor");
    if (normalizedUser) setCookie("user", JSON.stringify(normalizedUser));
  }

  if (userId) setCookie("userId", userId);
  else removeCookie("userId");

  return { normalizedUser, userId: userId || null };
}

export function hasProfilePicture(user: Record<string, unknown> | null | undefined): boolean {
  return Boolean(
    user &&
      typeof user.profilePicture === "string" &&
      user.profilePicture.trim(),
  );
}

function isSafeReturnUrl(url: string | null, role: PortalRole): boolean {
  if (!url || !url.startsWith("/")) return false;
  const prefix = role === "mentor" ? "/mentor/" : "/pastor/";
  const loginPath = role === "mentor" ? "/mentor/login" : "/pastor/login";
  return url.startsWith(prefix) && !url.startsWith(loginPath);
}

export function getPostLoginDestination(
  role: PortalRole,
  returnUrl: string | null,
  user: Record<string, unknown> | null,
): string {
  if (isSafeReturnUrl(returnUrl, role)) return returnUrl as string;
  const home = role === "mentor" ? "/mentor/home" : "/pastor/home";
  const incomplete = role === "mentor" ? "/mentor/profile-incomplete" : "/pastor/profile-incomplete";
  return hasProfilePicture(user) ? home : incomplete;
}

export async function resolvePortalRoleAfterLogin(
  user: unknown,
): Promise<PortalRole | "director" | null> {
  const initial = detectPortalRole(user);
  if (initial === "mentor" || initial === "pastor" || initial === "director") {
    return initial;
  }

  const normalized = normalizeLoginUser(user);
  const userId = normalized ? String(normalized.id ?? normalized._id ?? "").trim() : "";
  if (!userId) return null;

  try {
    const res = await apiGetUserById(userId);
    const profile = unwrapUserResponse(res);
    return detectPortalRole(profile ?? null);
  } catch {
    return null;
  }
}

export function clearCommonLoginSession(): void {
  clearAllCookies();
}
