import { apiGetComments, apiGetQueries } from "@/app/Services/roadmaps.service";
import type { DashboardFocusItem, DashboardFocusSection } from "./types";

const UPCOMING_MEETING_WINDOW_HOURS = 24;
const UPCOMING_DUE_WINDOW_DAYS = 7;
const MAX_ITEMS_PER_SECTION = 3;

type NestedTask = {
  _id?: string;
  id?: string;
  name?: string;
  status?: string;
  endDate?: string;
};

type RoadmapDoc = {
  _id?: string;
  id?: string;
  name?: string;
  roadmaps?: NestedTask[];
};

type MentorAuthor = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
};

type RoadmapComment = {
  _id?: string;
  text?: string;
  addedDate?: string;
  mentorId?: MentorAuthor | string;
};

type RoadmapQuery = {
  _id?: string;
  id?: string;
  status?: string;
  actualQueryText?: string;
  repliedAnswer?: string;
  repliedDate?: string;
  createdDate?: string;
  created_at?: string;
  repliedMentorId?: MentorAuthor | string;
};

const toTimestamp = (value?: string | null) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
};

const isWithinHours = (value: string | undefined, hours: number) => {
  const timestamp = toTimestamp(value);
  const now = Date.now();
  return timestamp >= now && timestamp <= now + hours * 60 * 60 * 1000;
};

const isUpcomingInCurrentMonth = (value: string | undefined) => {
  const timestamp = toTimestamp(value);
  if (!Number.isFinite(timestamp)) return false;
  const now = new Date();
  const target = new Date(timestamp);
  if (target.getTime() < now.getTime()) return false;
  return target.getFullYear() === now.getFullYear() && target.getMonth() === now.getMonth();
};

const isWithinDays = (value: string | undefined, days: number) => {
  const timestamp = toTimestamp(value);
  const now = Date.now();
  return timestamp >= now && timestamp <= now + days * 24 * 60 * 60 * 1000;
};

function normalizeNestedTaskStatus(status: string | undefined | null): string {
  const raw = String(status ?? "")
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (raw === "in-progress" || raw === "in progress") return "in-progress";
  if (raw === "not-started" || raw === "not started" || raw === "pending") return "not started";
  if (raw === "completed" || raw === "complete" || raw === "done") return "completed";
  if (raw === "blocked") return "blocked";
  return "not started";
}

const ROADMAP_FOCUS_STATUS_ORDER: Record<string, number> = {
  "in-progress": 0,
  blocked: 1,
  "not started": 2,
  completed: 3,
};

type TaskWithRoadmap = NestedTask & { roadmapId: string; roadmapName: string };

const compareRoadmapTasksForFocus = (a: TaskWithRoadmap, b: TaskWithRoadmap) => {
  const sa = normalizeNestedTaskStatus(a.status);
  const sb = normalizeNestedTaskStatus(b.status);
  const ra = ROADMAP_FOCUS_STATUS_ORDER[sa] ?? 99;
  const rb = ROADMAP_FOCUS_STATUS_ORDER[sb] ?? 99;
  if (ra !== rb) return ra - rb;
  return toTimestamp(a.endDate) - toTimestamp(b.endDate);
};

const isRoadmapTaskInFocus = (task: NestedTask) => normalizeNestedTaskStatus(task.status) !== "completed";

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

function getMentorName(mentor?: MentorAuthor | string) {
  if (!mentor || typeof mentor === "string") return "Mentor";
  return `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor";
}

function isCommentMentorFeedbackForPastor(comment: RoadmapComment, pastorUserId?: string | null) {
  const author = comment.mentorId;
  if (author == null) return false;
  if (typeof author === "string") {
    const id = author.trim();
    if (!id) return false;
    if (pastorUserId && id === pastorUserId) return false;
    return true;
  }
  if (typeof author !== "object") return false;
  const r = String(author.role ?? "")
    .toLowerCase()
    .trim();
  if (r === "pastor" || r === "director") return false;
  const isMentorRole =
    r === "mentor" || r === "field mentor" || (r.length > 0 && /\bmentor\b/.test(r));
  if (isMentorRole) return true;
  const aid = String(author._id ?? "").trim();
  if (pastorUserId && aid === pastorUserId) return false;
  return true;
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function appointmentMeetingDate(a: unknown): string {
  if (!a || typeof a !== "object") return "";
  const o = a as Record<string, unknown>;
  const v = o.meetingDate ?? o.date ?? o.startTime ?? o.scheduledAt;
  return v != null ? String(v) : "";
}

function getSchedulerLabel(
  appointment: Record<string, unknown>,
  userId?: string,
  mentorNameById?: Map<string, string>,
): string {
  const mentorId = String(appointment.mentorId ?? "");
  const roleRaw =
    appointment.scheduledByRole ??
    appointment.createdByRole ??
    (typeof appointment.scheduledBy === "object" && appointment.scheduledBy
      ? (appointment.scheduledBy as { role?: string }).role
      : "") ??
    "";
  const src = appointment.scheduledBy as Record<string, unknown> | undefined;
  const nameRaw =
    appointment.scheduledByName ??
    appointment.createdByName ??
    (src
      ? String(src.name ?? `${src.firstName ?? ""} ${src.lastName ?? ""}`.trim())
      : "");
  const role = String(roleRaw || "").trim();
  const name = String(nameRaw || "").trim();
  if (!role && !name) {
    if (userId && String(appointment.userId) === userId) return "Scheduled by Pastor (You)";
    const mentorName = mentorNameById?.get(mentorId);
    if (mentorName) return `Scheduled by Mentor ${mentorName}`;
    return "Scheduled by Mentor";
  }
  if (role && name) return `Scheduled by ${toTitleCase(role)} ${name}`;
  if (role) return `Scheduled by ${toTitleCase(role)}`;
  return `Scheduled by ${name}`;
}

function getWithWhomLabel(appointment: Record<string, unknown>, mentorNameById?: Map<string, string>): string {
  const mentorId = String(appointment.mentorId ?? "");
  const mentorName = mentorNameById?.get(mentorId);
  if (mentorName) return `With Mentor ${mentorName}`;
  return "With Mentor";
}

function unwrapCommentsFromThread(res: { data?: unknown }): RoadmapComment[] {
  const axiosBody = res.data as { data?: unknown } | undefined;
  const thread = axiosBody?.data ?? axiosBody;
  if (thread && typeof thread === "object" && !Array.isArray(thread) && "comments" in thread) {
    const list = (thread as { comments?: unknown }).comments;
    return Array.isArray(list) ? (list as RoadmapComment[]) : [];
  }
  if (Array.isArray(thread)) return thread as RoadmapComment[];
  return [];
}

function unwrapQueriesFromThreads(res: { data?: unknown }): RoadmapQuery[] {
  const axiosBody = res.data as { data?: unknown } | undefined;
  const body = axiosBody?.data ?? axiosBody;
  const threads = Array.isArray(body) ? body : body ? [body] : [];
  return threads.flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const q = (t as { queries?: unknown[] }).queries;
    return Array.isArray(q) ? (q as RoadmapQuery[]) : [];
  });
}

export type PastorFocusInput = {
  pastorUserId: string;
  appointments: unknown[];
  mentorNameById: Map<string, string>;
  roadmaps: RoadmapDoc[];
  assessments: {
    id: string;
    title: string;
    description: string;
    dueDate?: string;
    status?: string;
  }[];
};

export async function loadPastorFocusSections(input: PastorFocusInput): Promise<DashboardFocusSection[]> {
  const { pastorUserId, appointments, mentorNameById, roadmaps, assessments } = input;

  const apptRecords = (appointments || []).map((a) =>
    typeof a === "object" && a ? (a as Record<string, unknown>) : {},
  );

  const flattenedTasks: TaskWithRoadmap[] = roadmaps.flatMap((roadmap) =>
    (roadmap.roadmaps || []).map((task) => ({
      ...task,
      roadmapId: String(roadmap._id ?? roadmap.id ?? ""),
      roadmapName: String(roadmap.name ?? "Roadmap"),
    })),
  );

  const roadmapItems: DashboardFocusItem[] = flattenedTasks
    .filter((task) => isRoadmapTaskInFocus(task))
    .sort(compareRoadmapTasksForFocus)
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((task) => {
      const st = normalizeNestedTaskStatus(task.status);
      const meta =
        st === "in-progress"
          ? "In progress"
          : st === "blocked"
            ? "Blocked"
            : isWithinDays(task.endDate, UPCOMING_DUE_WINDOW_DAYS)
              ? "Due soon"
              : "Upcoming";
      const tid = String(task._id ?? task.id ?? "");
      const href =
        tid && task.roadmapId
          ? `/pastor/jumpstart?id=${encodeURIComponent(tid)}&parentId=${encodeURIComponent(task.roadmapId)}`
          : `/pastor/revitalization-roadmap?tab=${encodeURIComponent("In Progress")}`;
      return {
        id: `roadmap-${task.roadmapId}-${tid}`,
        title: String(task.name ?? "Roadmap task"),
        description: `${task.roadmapName} needs attention${task.endDate ? ` by ${formatDateTime(task.endDate)}` : ""}.`,
        meta,
        href,
      };
    });

  const meetingItems: DashboardFocusItem[] = apptRecords
    .filter((appointment) => {
      const md = appointmentMeetingDate(appointment);
      return md && isWithinHours(md, UPCOMING_MEETING_WINDOW_HOURS);
    })
    .sort((a, b) => toTimestamp(appointmentMeetingDate(a)) - toTimestamp(appointmentMeetingDate(b)))
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((appointment) => {
      const md = appointmentMeetingDate(appointment);
      const scheduler = getSchedulerLabel(appointment, pastorUserId, mentorNameById);
      const withWhom = getWithWhomLabel(appointment, mentorNameById);
      return {
        id: `meeting-${String(appointment.id ?? appointment._id ?? md)}`,
        title: "Upcoming meeting",
        description: `Meeting starts ${formatDateTime(md)}.`,
        meta: `${scheduler} • ${withWhom} • Within ${UPCOMING_MEETING_WINDOW_HOURS} hours`,
        href: "/pastor/Appointments",
      };
    });

  const monthlyMeetingItems: DashboardFocusItem[] = apptRecords
    .filter((appointment) => {
      const md = appointmentMeetingDate(appointment);
      if (!md) return false;
      const in24 = isWithinHours(md, UPCOMING_MEETING_WINDOW_HOURS);
      return !in24 && isUpcomingInCurrentMonth(md);
    })
    .sort((a, b) => toTimestamp(appointmentMeetingDate(a)) - toTimestamp(appointmentMeetingDate(b)))
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((appointment) => {
      const md = appointmentMeetingDate(appointment);
      const scheduler = getSchedulerLabel(appointment, pastorUserId, mentorNameById);
      const withWhom = getWithWhomLabel(appointment, mentorNameById);
      return {
        id: `meeting-month-${String(appointment.id ?? appointment._id ?? md)}`,
        title: "Upcoming meeting this month",
        description: `Meeting starts ${formatDateTime(md)}.`,
        meta: `${scheduler} • ${withWhom} • This month`,
        href: "/pastor/Appointments",
      };
    });

  const assessmentItems: DashboardFocusItem[] = assessments
    .filter(
      (assessment) =>
        String(assessment.status || "").toLowerCase() !== "completed" &&
        (!assessment.dueDate || isWithinDays(assessment.dueDate, UPCOMING_DUE_WINDOW_DAYS)),
    )
    .sort((a, b) => toTimestamp(a.dueDate) - toTimestamp(b.dueDate))
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((assessment) => ({
      id: `assessment-${assessment.id}`,
      title: assessment.title,
      description: assessment.description,
      meta: assessment.dueDate ? `Due ${formatDateTime(assessment.dueDate)}` : "Assessment pending",
      href: `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(assessment.id)}`,
    }));

  const feedbackEntries = await Promise.all(
    roadmaps.map(async (roadmap) => {
      const rid = String(roadmap._id ?? roadmap.id ?? "");
      const name = String(roadmap.name ?? "Roadmap");
      if (!rid || !pastorUserId) {
        return { roadmapId: rid, roadmapName: name, comments: [] as RoadmapComment[], queries: [] as RoadmapQuery[] };
      }
      try {
        const [commentsRes, queriesRes] = await Promise.all([
          apiGetComments(rid, pastorUserId),
          apiGetQueries(rid, pastorUserId),
        ]);
        const comments = unwrapCommentsFromThread(commentsRes);
        const queries = unwrapQueriesFromThreads(queriesRes);
        return { roadmapId: rid, roadmapName: name, comments, queries };
      } catch {
        return { roadmapId: rid, roadmapName: name, comments: [] as RoadmapComment[], queries: [] as RoadmapQuery[] };
      }
    }),
  );

  type FeedbackRow = DashboardFocusItem & { sortKey?: string };
  const mentorFeedbackRows: FeedbackRow[] = feedbackEntries.flatMap((entry) => {
    const commentItems: FeedbackRow[] = (entry.comments || [])
      .filter((comment) => isCommentMentorFeedbackForPastor(comment, pastorUserId))
      .map((comment) => {
        const author = comment.mentorId;
        const title =
          typeof author === "object" && author
            ? `${String(author.firstName ?? "").trim() || "Mentor"} commented`
            : "Mentor commented";
        const cid = String(comment._id ?? "");
        return {
          id: `comment-${cid}`,
          title,
          description: String(comment.text ?? ""),
          meta: `${entry.roadmapName} • ${formatDateTime(comment.addedDate)}`,
          sortKey: comment.addedDate,
          href: `/pastor/roadmap-detail/${encodeURIComponent(entry.roadmapId)}`,
        };
      });

    const replyItems: FeedbackRow[] = (entry.queries || [])
      .filter((query) => query.status === "answered" && !!query.repliedAnswer)
      .map((query) => {
        const qid = String(query._id ?? query.id ?? "");
        return {
          id: `query-${qid}`,
          title: `${getMentorName(query.repliedMentorId)} replied`,
          description: String(query.repliedAnswer || query.actualQueryText || ""),
          meta: `${entry.roadmapName} • ${formatDateTime(query.repliedDate || query.createdDate || query.created_at)}`,
          sortKey: query.repliedDate || query.createdDate || query.created_at,
          href: `/pastor/roadmap-detail/${encodeURIComponent(entry.roadmapId)}`,
        };
      });

    return [...commentItems, ...replyItems];
  });

  mentorFeedbackRows.sort((a, b) => toTimestamp(b.sortKey) - toTimestamp(a.sortKey));
  const mentorFeedbackItems: DashboardFocusItem[] = mentorFeedbackRows.slice(0, MAX_ITEMS_PER_SECTION).map((row) => {
    const { sortKey: _sk, ...item } = row;
    return item;
  });

  return [
    {
      id: "roadmaps",
      title: "Incomplete roadmap tasks",
      emptyMessage: "No roadmap tasks in progress right now.",
      items: roadmapItems,
    },
    {
      id: "meetings",
      title: `Upcoming meetings within ${UPCOMING_MEETING_WINDOW_HOURS} hours`,
      emptyMessage: "No meetings are coming up in the next 24 hours.",
      items: meetingItems,
    },
    {
      id: "meetings-month",
      title: "Upcoming meetings this month",
      emptyMessage: "No more meetings are scheduled for this month.",
      items: monthlyMeetingItems,
    },
    {
      id: "assessments",
      title: "Upcoming assessment submission",
      emptyMessage: "No assessments are currently near due.",
      items: assessmentItems,
    },
    {
      id: "mentor-feedback",
      title: "Comments and query replies from Mentor",
      emptyMessage:
        "No mentor comments yet. This list shows your mentor's roadmap comments (not your own). When your mentor comments, it will appear here.",
      items: mentorFeedbackItems,
    },
  ];
}
