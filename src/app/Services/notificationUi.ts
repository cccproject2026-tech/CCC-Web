import { getCookie } from "@/app/utils/cookies";
import type {
  NotificationItem,
  NotificationModule,
  NotificationResponse,
} from "@/app/Services/types/home.types";

/** List row shape for `NotificationPopup` (kept here to avoid Services → Components imports) */
export type NotificationPopupItem = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  link?: string;
  linkText?: string;
  time: string;
  isStarred?: boolean;
  avatarGroup?: boolean;
  count?: string;
};

type NotificationsApiEnvelope = {
  data?: {
    data?: NotificationResponse;
  };
};

export function resolveSessionUserId(): string | null {
  if (typeof document === "undefined") return null;
  const raw = getCookie("user");
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as { id?: string };
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function unwrapNotificationsList(res: NotificationsApiEnvelope): NotificationItem[] {
  const notifications = res.data?.data?.notifications;
  return Array.isArray(notifications) ? notifications : [];
}

function moduleToIcon(module: NotificationModule): { icon: string; iconColor: string } {
  switch (module) {
    case "appointments":
      return { icon: "fa-solid fa-calendar-days", iconColor: "text-blue-500" };
    case "roadmaps":
      return { icon: "fa-solid fa-route", iconColor: "text-cyan-500" };
    case "assessments":
      return { icon: "fa-regular fa-clipboard", iconColor: "text-yellow-600" };
    case "microgrant":
      return { icon: "fa-solid fa-hand-holding-dollar", iconColor: "text-emerald-500" };
    case "interests":
      return { icon: "fa-solid fa-user-plus", iconColor: "text-blue-500" };
    case "general":
    default:
      return { icon: "fa-solid fa-bell", iconColor: "text-gray-500" };
  }
}

function formatNotificationTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "";
  }
}

export function mapNotificationItemToPopup(item: NotificationItem): NotificationPopupItem {
  const { icon, iconColor } = moduleToIcon(item.module);
  return {
    id: item._id,
    icon,
    iconColor,
    title: item.name,
    subtitle: item.details,
    time: formatNotificationTime(item.createdAt),
  };
}
