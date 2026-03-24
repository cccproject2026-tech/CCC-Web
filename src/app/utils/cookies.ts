/**
 * Cookie utility — drop-in replacement for localStorage.
 * All cookies are scoped to path=/ and default to 7-day expiry.
 */

const DEFAULT_EXPIRES_DAYS = 7;

function expiresDate(days: number): string {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toUTCString();
}

export function setCookie(name: string, value: string, days = DEFAULT_EXPIRES_DAYS): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};expires=${expiresDate(days)};path=/;SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const key = encodeURIComponent(name) + "=";
  for (const part of document.cookie.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(key)) {
      return decodeURIComponent(trimmed.substring(key.length));
    }
  }
  return null;
}

export function removeCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}

/** Remove all app session cookies — call this on logout */
export function clearAllCookies(): void {
  const appCookies = [
    "accessToken",
    "refreshToken",
    "user",
    "mentor",
    "userId",
    "interestEmail",
  ];
  appCookies.forEach(removeCookie);
}
