import { getCookie } from "@/app/utils/cookies";
import type { NotificationItem, NotificationModule } from "@/app/Services/types/home.types";
import type { NotificationPopupItem } from "@/app/Components/NotificationPopup";

/** Director / mentor / pastor — resolve logged-in user id from cookies. */
export function resolveSessionUserId(): string | null {
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

const MODULE_ALIASES: Record<string, NotificationModule> = {
  appointment: "appointments",
  appointments: "appointments",
  roadmap: "roadmaps",
  roadmaps: "roadmaps",
  assessment: "assessments",
  assessments: "assessments",
  microgrant: "microgrant",
  interest: "interests",
  interests: "interests",
  general: "general",
};

function normalizeModule(raw: unknown): NotificationModule {
  const key = String(raw ?? "general").toLowerCase().trim();
  return MODULE_ALIASES[key] ?? "general";
}

function normalizeNotificationItem(raw: unknown, index: number): NotificationItem {
  const n = raw as Record<string, unknown>;
  const id = String(n._id ?? n.id ?? `notification-${index}`);
  const explicitUnread =
    n.isRead === false ||
    n.read === false ||
    String(n.status ?? "").toLowerCase() === "unread";
  const explicitRead = n.isRead === true || n.read === true;
  /** When API omits `isRead`, treat as read so the badge is not inflated. */
  const isRead = explicitUnread ? false : explicitRead ? true : true;
  return {
    _id: id,
    name: String(n.name ?? n.title ?? "Notification"),
    details: String(n.details ?? n.message ?? n.body ?? ""),
    module: normalizeModule(n.module ?? n.type ?? n.category),
    isRead,
    createdAt: String(n.createdAt ?? n.created_at ?? n.updatedAt ?? new Date().toISOString()),
  };
}

/**
 * Unwrap GET /home/notifications responses (envelope shapes differ by client/version).
 */
export function unwrapNotificationsList(res: { data?: unknown }): NotificationItem[] {
  const root = res?.data as Record<string, unknown> | unknown[] | undefined | null;
  if (root == null) return [];

  let payload: Record<string, unknown> | null = null;
  if (Array.isArray(root)) {
    return root.map((item, i) => normalizeNotificationItem(item, i));
  }
  if (typeof root === "object" && !Array.isArray(root)) {
    const r = root as Record<string, unknown>;
    if (r.success === false) return [];
    payload = (r.data as Record<string, unknown>) ?? r;
  }

  if (!payload) return [];

  const candidates = [
    payload.notifications,
    payload.items,
    payload.records,
    payload.list,
    payload.data,
  ];

  for (const c of candidates) {
    if (Array.isArray(c)) {
      return c.map((item, i) => normalizeNotificationItem(item, i));
    }
    if (c && typeof c === "object" && Array.isArray((c as { notifications?: unknown[] }).notifications)) {
      const inner = (c as { notifications: unknown[] }).notifications;
      return inner.map((item, i) => normalizeNotificationItem(item, i));
    }
  }

  return [];
}

const MODULE_STYLE: Record<
  NotificationModule,
  { icon: string; iconColor: string }
> = {
  appointments: { icon: "fa-solid fa-calendar-check", iconColor: "text-amber-300" },
  roadmaps: { icon: "fa-solid fa-map", iconColor: "text-sky-300" },
  assessments: { icon: "fa-solid fa-clipboard-check", iconColor: "text-violet-300" },
  microgrant: { icon: "fa-solid fa-circle-check", iconColor: "text-emerald-300" },
  interests: { icon: "fa-solid fa-user-plus", iconColor: "text-blue-300" },
  general: { icon: "fa-solid fa-bell", iconColor: "text-[#cde2f2]" },
};

export function mapNotificationItemToPopup(n: NotificationItem): NotificationPopupItem {
  const st = MODULE_STYLE[n.module] ?? MODULE_STYLE.general;
  let time = "";
  try {
    time = n.createdAt ? new Date(n.createdAt).toLocaleString() : "";
  } catch {
    time = "";
  }
  return {
    id: n._id,
    icon: st.icon,
    iconColor: st.iconColor,
    title: n.name,
    subtitle: n.details,
    time,
    isStarred: !n.isRead,
  };
}
