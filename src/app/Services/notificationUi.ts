import type { AxiosResponse } from "axios";
import { getCookie } from "@/app/utils/cookies";
import type { NotificationItem, NotificationModule, NotificationResponse } from "./types/home.types";

/** Director / shared header: Mongo user id for `/home/notifications?userId=`. */
export function resolveSessionUserId(): string | null {
  const explicit = getCookie("userId")?.trim();
  if (explicit) return explicit;
  const raw = getCookie("user");
  if (!raw) return null;
  try {
    const u = JSON.parse(raw) as Record<string, unknown>;
    const id = u._id ?? u.id;
    if (typeof id === "string" && id.trim()) return id.trim();
  } catch {
    return null;
  }
  return null;
}

export function unwrapNotificationsList(
  res: AxiosResponse<{ success?: boolean; data?: NotificationResponse | NotificationResponse[] }>,
): NotificationItem[] {
  const data = res.data?.data;
  if (data == null) return [];
  if (Array.isArray(data)) {
    return data.flatMap((d) => (Array.isArray(d.notifications) ? d.notifications : []));
  }
  if (Array.isArray(data.notifications)) return data.notifications;
  return [];
}

const moduleIcon: Record<NotificationModule, { icon: string; iconColor: string }> = {
  appointments: { icon: "fa-regular fa-calendar", iconColor: "text-cyan-500" },
  roadmaps: { icon: "fa-regular fa-map", iconColor: "text-blue-500" },
  assessments: { icon: "fa-regular fa-clipboard", iconColor: "text-cyan-500" },
  microgrant: { icon: "fa-solid fa-trophy", iconColor: "text-yellow-600" },
  interests: { icon: "fa-regular fa-user-plus", iconColor: "text-blue-500" },
  general: { icon: "fa-regular fa-bell", iconColor: "text-gray-600" },
};

export type NotificationPopupItem = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  time: string;
  link?: string;
  linkText?: string;
  isStarred?: boolean;
  avatarGroup?: boolean;
  count?: string;
};

export function mapNotificationItemToPopup(n: NotificationItem): NotificationPopupItem {
  const { icon, iconColor } = moduleIcon[n.module] ?? moduleIcon.general;
  let time: string;
  try {
    time = new Date(n.createdAt).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    time = n.createdAt;
  }
  return {
    id: n._id,
    icon,
    iconColor,
    title: n.name || "Notification",
    subtitle: n.details,
    time,
    isStarred: !n.isRead,
  };
}
