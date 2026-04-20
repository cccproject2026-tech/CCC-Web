/**
 * Resolves last-login from user objects returned by different API versions / serializers.
 */
export function pickLastLoginRaw(user: unknown): unknown {
  if (user == null || typeof user !== "object") return undefined;
  const u = user as Record<string, unknown>;
  const keys = [
    "lastLogin",
    "lastLoginAt",
    "last_login",
    "lastLoginDate",
    "lastLoggedIn",
    "last_logged_in",
    "lastLoggedInAt",
    "lastSuccessfulLogin",
    "lastSuccessfulLoginAt",
    "lastSeen",
    "last_seen",
    "lastActiveAt",
    "last_active_at",
    "recentLoginAt",
    "recent_login_at",
  ];
  for (const k of keys) {
    const v = u[k];
    if (v != null && v !== "") return v;
  }
  return undefined;
}

/** Same keys, checked on nested objects (stats, metadata, etc.). */
const NESTED_KEYS = [
  "stats",
  "metadata",
  "meta",
  "account",
  "activity",
  "audit",
  "session",
  "security",
  "preferences",
] as const;

/**
 * List endpoints often omit `lastLogin`; detail views may nest it under `stats` / `metadata`.
 */
export function pickLastLoginDeep(user: unknown): unknown {
  const direct = pickLastLoginRaw(user);
  if (direct != null) return direct;
  if (user == null || typeof user !== "object") return undefined;
  const u = user as Record<string, unknown>;
  for (const nest of NESTED_KEYS) {
    const inner = u[nest];
    if (inner != null && typeof inner === "object") {
      const v = pickLastLoginRaw(inner);
      if (v != null) return v;
    }
  }
  return undefined;
}

function coerceToDate(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;
  if (raw instanceof Date) {
    return Number.isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === "number") {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return null;
    const d = new Date(t);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.$date === "string" || typeof o.$date === "number") {
      const d = new Date(o.$date as string | number);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof o.date === "string") {
      const d = new Date(o.date);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  }
  return null;
}

/**
 * Display string for Assign Mentor cards: formatted date or "Not Started yet".
 */
export function formatUserLastLoginDisplay(user: unknown): string {
  const raw = pickLastLoginDeep(user);
  if (raw == null) return "Not Started yet";
  const d = coerceToDate(raw);
  if (!d) return "Not Started yet";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
