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
export function resolveSessionRole(): string {
  if (typeof document === "undefined") return "mentor";

  const raw = getCookie("user");
  if (!raw) return "mentor";

  try {
    const u = JSON.parse(raw) as { role?: string };
    return String(u.role || "mentor").toLowerCase();
  } catch {
    return "mentor";
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

  assignment: "general",
  assignments: "general",
  assigned: "general",

  general: "general",
};

function normalizeModule(raw: unknown): NotificationModule {
  const key = String(raw ?? "general").toLowerCase().trim();
  return MODULE_ALIASES[key] ?? "general";
}

function formatNotificationTitle(value: string): string {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatIsoDatesInMessage(value: string): string {
  return value.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z/g,
    (iso) => {
      const date = new Date(iso);

      if (Number.isNaN(date.getTime())) return iso;

      return date.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  );
}

function formatAssignmentNotification(title: string, details: string) {
  const lowerTitle = title.toLowerCase();
  const lowerDetails = details.toLowerCase();

  // Mentor received a new assigned mentee
  if (lowerDetails.includes("you have been assigned to")) {
    const match = details.match(/you have been assigned to\s+(.+?)\.?$/i);
    const assignedName = match?.[1]?.trim();

    return {
      title: "New Mentee Assigned",
      details: assignedName
        ? `${assignedName} has been assigned to you as a mentee.`
        : details,
    };
  }

  // Pastor/director assignment-completed style notifications
  if (
    lowerTitle.includes("assignment completed") ||
    lowerDetails.includes("you assigned:")
  ) {
  
    return {
  title: "Mentor Assigned",
  details: details.replace(/^You assigned:\s*/i, "Mentor: "),
};
  }

  return {
    title,
    details,
  };
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

  const rawTitle = String(n.name ?? n.title ?? "Notification");
  const rawDetails = String(n.details ?? n.message ?? n.body ?? "");

 
  const cleanTitle = formatNotificationTitle(rawTitle);
const cleanDetails = formatIsoDatesInMessage(rawDetails);
const assignmentText = formatAssignmentNotification(cleanTitle, cleanDetails);

return {
  _id: id,
  name: assignmentText.title,
  details: assignmentText.details,
    module: normalizeModule(n.module ?? n.type ?? n.category),
    isRead,

createdAt: String(
  n.createdAt ??
  n.created_at ??
  n.notificationCreatedAt ??
  n.sentAt ??
  n.updatedAt ??
  ""
),
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



export function getNotificationHref(n: NotificationItem): string {
  const role = resolveSessionRole();

  const module = String(n.module || "general").toLowerCase();
  const title = String(n.name || "").toLowerCase();
  const details = String(n.details || "").toLowerCase();
  const text = `${module} ${title} ${details}`;

  if (text.includes("appointment") || module === "appointments") {
    if (role === "pastor") return "/pastor/appointments";
    if (role === "director") return "/director/schedule";
    return "/mentor/MentorSchedule";
  }

  if (text.includes("roadmap") || module === "roadmaps") {
    if (role === "pastor") return "/pastor/revitalization-roadmap";
    if (role === "director") return "/director/revitalization-roadmap";
    return "/mentor/revitalization-roadmap";
  }

  if (text.includes("assessment") || module === "assessments") {
    if (role === "pastor") return "/pastor/assessments";
    if (role === "director") return "/director/assessments";
    return "/mentor/Assessments";
  }

  if (text.includes("microgrant") || module === "microgrant") {
    if (role === "director") return "/director/micro-grant";
    return "/pastor/MicroGrantApplication";
  }

  if (
  text.includes("mentee") ||
  text.includes("mentor assigned") ||
  text.includes("assigned")
) {
  if (role === "pastor") return "/pastor/Mymentors";
  if (role === "director") return "/director/pastor-assignments";
  return "/mentor/MenteesDetailed";
}

  if (module === "interests") {

     return "/director/interest-list";
  }

  if (role === "pastor") return "/pastor/notifications";
  if (role === "director") return "/director/notifications";
  return "/mentor/notifications";
}
export function mapNotificationItemToPopup(n: NotificationItem): NotificationPopupItem {
  const st = MODULE_STYLE[n.module] ?? MODULE_STYLE.general;

  let time = "";
try {
  time = n.createdAt ? formatDateTime(n.createdAt) : "";
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
  // href: getNotificationHref(n),
  link: getNotificationHref(n),
linkText: "Open",
};
}
