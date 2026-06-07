"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import UserProfile from "@/app/Assets/user-profile.png";
import {
  apiGetAssignedUsers,
  apiGetMentorAppointments,
  apiGetRoadmapSubmissionActivity,
} from "@/app/Services/api";
import {
  apiGetComments,
  apiGetQueries,
  type RoadmapSubmissionActivity,
} from "@/app/Services/roadmaps.service";
import {
  apiGetAssessments,
  apiGetAssignedAssessments,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import {
  apiGetPastorMentoringSessions,
  type MentoringSession,
} from "@/app/Services/mentoring-sessions.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  collapseRoadmapAssignmentsToParents,
  fetchMergedRoadmapsForAssignedUser,
  fetchRoadmapAssignmentsForUser,
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";
import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import {
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";

type Pastor = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
};

type WeeklyAssessmentSubmission = {
  assessmentId: string;
  assessmentName: string;
  submittedAt: string;
};

type QueryCommentFilter = "all" | "queries" | "comments";

type QueryCommentRow = {
  id: string;
  type: "query" | "comment";
  roadmapId: string;
  taskId?: string;
  roadmapName: string;
  taskName?: string;
  message: string;
  author?: string;
  createdAt?: string;
  status?: string;
  hasAnswer?: boolean;
};

type AssessmentStatusRow = {
  id: string;
  name: string;
  status: "completed" | "submitted" | "not_started";
};

type RoadmapProgressCardRow = {
  id: string;
  title: string;
  value: string;
  valueClassName: string;
};

type MentorshipSessionCardStatus =
  | "Completed"
  | "On Track"
  | "Missed"
  | "In Progress";

type MentorshipSessionCardData = {
  lastSession: string;
  nextSession: string;
  sessionsCompleted: string;
  status: MentorshipSessionCardStatus;
};

const defaultMentorshipSessionCard: MentorshipSessionCardData = {
  lastSession: "N/A",
  nextSession: "N/A",
  sessionsCompleted: "0/0",
  status: "In Progress",
};

const MENTORSHIP_SESSION_TOTAL = 10;

const isWithinCurrentWeek = (value?: string) => {
  if (!value) return false;

  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return false;

  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfNextWeek = new Date(startOfWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  return submittedAt >= startOfWeek && submittedAt < startOfNextWeek;
};

const attentionItems = [
  {
    icon: "fa-regular fa-calendar-xmark",
    title: "Missed Meetings",
    count: 12,
    description: "Sessions requiring follow-up",
    tone: "border-red-300/30 bg-red-400/15 text-red-200",
  },
  {
    icon: "fa-solid fa-calendar-days",
    title: "Rescheduled Meetings",
    count: 8,
    description: "Updated meeting schedules",
    tone: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  },
  {
    icon: "fa-solid fa-rotate",
    title: "Pastor Resubmitted Tasks",
    count: 0,
    description: "Tasks ready for another review",
    tone: "border-orange-300/30 bg-orange-400/15 text-orange-100",
  },
  {
    icon: "fa-solid fa-road",
    title: "New Roadmap Submissions",
    count: 0,
    description: "Roadmap items awaiting review",
    tone: "border-sky-300/30 bg-sky-400/15 text-sky-100",
  },
  {
    icon: "fa-regular fa-file-lines",
    title: "New Assessment Submissions",
    count: 17,
    description: "Assessment updates received",
    tone: "border-violet-300/30 bg-violet-400/15 text-violet-100",
  },
  {
    icon: "fa-regular fa-clock",
    title: "Today's Meetings",
    count: 42,
    description: "Sessions scheduled for today",
    tone: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  },
];

const getMentorFromCookie = () => {
  const cookie = Cookies.get("mentor");
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
};

const getDisplayName = (user: Pastor | null) =>
  user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.name ||
      "Pastor"
    : "Pastor";

function normalizeAssessmentStatus(raw: unknown): AssessmentStatusRow["status"] {
  const status = String(raw ?? "").toLowerCase().replace(/\s+/g, "_").trim();
  if (status === "completed" || status === "reviewed") return "completed";
  if (status === "submitted") return "submitted";
  return "not_started";
}

function assessmentStatusDisplay(status: AssessmentStatusRow["status"]) {
  if (status === "completed") {
    return { label: "Completed", className: "text-emerald-200" };
  }
  if (status === "submitted") {
    return { label: "Submitted / Waiting Review", className: "text-amber-100" };
  }
  return { label: "Pending / Not Started", className: "text-red-200" };
}

function extractAssessmentIdFromProgressRow(row: any): string {
  const direct = row?.assessmentId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (direct && typeof direct === "object") {
    const nested = String(direct?._id ?? direct?.id ?? "").trim();
    if (nested) return nested;
  }
  return String(row?._id ?? row?.id ?? "").trim();
}

function assignedUserId(value: any): string {
  if (value && typeof value === "object") {
    return String(value?._id ?? value?.id ?? "").trim();
  }
  return String(value ?? "").trim();
}

function unwrapAssessmentsFromResponse(res: { data?: unknown }): any[] {
  const body = res.data as any;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
}

function hasSentRecommendations(data: any): boolean {
  if (Array.isArray(data)) {
    return data.some((rec: any) => rec?.sent === true || rec?.status === "sent");
  }
  if (Array.isArray(data?.sections)) {
    return data.sections.some((section: any) =>
      Array.isArray(section?.recommendations) &&
      section.recommendations.some(
        (rec: any) =>
          typeof rec === "object" &&
          (rec?.sent === true || rec?.status === "sent"),
      ),
    );
  }
  return false;
}

function normalizeRoadmapStatusLabel(status: unknown): string {
  const raw = String(status ?? "").trim();
  if (!raw) return "Not Started";
  const normalized = raw.replace(/[_-]+/g, " ").toLowerCase();
  if (normalized.includes("complete")) return "Completed";
  if (normalized.includes("progress")) return "In Progress";
  if (normalized.includes("due")) return "Due";
  if (normalized.includes("not started")) return "Not Started";
  return raw;
}

function roadmapValueClass(value: string, status: unknown): string {
  const normalizedStatus = String(status ?? "").toLowerCase();
  const pctMatch = value.match(/^(\d+)%$/);
  if (pctMatch) {
    const pct = Number(pctMatch[1]);
    if (pct >= 100) return "text-emerald-200";
    if (pct > 0) return "text-amber-100";
    return "text-[#cde2f2]/70";
  }
  if (normalizedStatus.includes("complete")) return "text-emerald-200";
  if (normalizedStatus.includes("progress") || normalizedStatus.includes("due")) return "text-amber-100";
  return "text-[#cde2f2]/70";
}

function roadmapProgressValue(roadmap: any, progressRow: any): string {
  const rawPercent =
    progressRow?.progressPercentage ??
    roadmap?.progressPercentage ??
    roadmap?.progressPercent ??
    roadmap?.percent ??
    roadmap?.progress?.progressPercentage;
  if (rawPercent !== undefined && rawPercent !== null && rawPercent !== "") {
    const pct = Math.min(100, Math.max(0, Math.round(Number(rawPercent) || 0)));
    return `${pct}%`;
  }

  const rawCompleted =
    progressRow?.completedSteps ??
    roadmap?.completedSteps ??
    roadmap?.progress?.completedSteps;
  const rawTotal =
    progressRow?.totalSteps ??
    roadmap?.totalSteps ??
    roadmap?.progress?.totalSteps;
  const total = Number(rawTotal);
  if (Number.isFinite(total) && total > 0) {
    const completed = Math.min(total, Math.max(0, Number(rawCompleted) || 0));
    return `${completed}/${total}`;
  }

  return normalizeRoadmapStatusLabel(roadmap?.status);
}

function getSessionStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function unwrapPastorMentoringSessions(res: { data?: unknown }): MentoringSession[] {
  const body = (res.data as { data?: unknown } | undefined)?.data ?? res.data;
  if (Array.isArray(body)) return body as MentoringSession[];
  if (body && typeof body === "object") {
    const data = body as { sessions?: unknown; mentoringSessions?: unknown };
    if (Array.isArray(data.sessions)) return data.sessions as MentoringSession[];
    if (Array.isArray(data.mentoringSessions)) return data.mentoringSessions as MentoringSession[];
  }
  return [];
}

function normalizeMentorshipSessionStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
}

function getMentorshipSessionDate(session?: MentoringSession | null): string {
  if (!session) return "";
  const row = session as any;
  return getSessionStringValue(
    session.scheduledDate,
    row?.meetingDate,
    row?.date,
    row?.appointment?.meetingDate,
    row?.appointmentDetails?.meetingDate,
  );
}

function formatMentorshipSessionDateTime(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getMentorshipSessionNumber(session: MentoringSession, fallback: number): number {
  const row = session as any;
  const sessionNumber = Number(session.sessionNumber ?? row?.sessionNo ?? row?.session ?? fallback);
  return Number.isFinite(sessionNumber) && sessionNumber > 0 ? sessionNumber : fallback;
}

function buildReviewMentorshipSessions(
  sessions: MentoringSession[],
  pastorId: string,
): MentoringSession[] {
  const normalized = sessions
    .map((session, index) => {
      const sessionNumber = getMentorshipSessionNumber(session, index + 1);
      return {
        ...session,
        id: getSessionStringValue((session as any)?._id, (session as any)?.sessionId, session.id),
        pastorId,
        sessionNumber,
        status: getSessionStringValue(session.status, "LOCKED").toUpperCase(),
        scheduledDate: getMentorshipSessionDate(session),
      };
    })
    .filter((session) => Number(session.sessionNumber) > 0)
    .sort((a, b) => Number(a.sessionNumber) - Number(b.sessionNumber));

  if (normalized.length >= MENTORSHIP_SESSION_TOTAL) {
    return normalized.slice(0, MENTORSHIP_SESSION_TOTAL);
  }

  const completedCount = normalized.filter(
    (session) => normalizeMentorshipSessionStatus(session.status) === "COMPLETED",
  ).length;
  const unlockedSessionNumber = Math.min(completedCount + 1, MENTORSHIP_SESSION_TOTAL);

  return Array.from({ length: MENTORSHIP_SESSION_TOTAL }, (_, index) => {
    const sessionNumber = index + 1;
    const apiSession = normalized.find((session) => Number(session.sessionNumber) === sessionNumber);
    const lastCompleted = [...normalized]
      .filter(
        (session) =>
          normalizeMentorshipSessionStatus(session.status) === "COMPLETED" &&
          Number(session.sessionNumber) < sessionNumber,
      )
      .sort((a, b) => Number(b.sessionNumber) - Number(a.sessionNumber))[0];
    const fallbackDate = lastCompleted?.scheduledDate
      ? new Date(new Date(lastCompleted.scheduledDate).getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
    const scheduledDate = apiSession?.scheduledDate || fallbackDate?.toISOString() || "";
    const isCompleted = normalizeMentorshipSessionStatus(apiSession?.status) === "COMPLETED";
    const isUnlocked = sessionNumber === unlockedSessionNumber;
    const isPastDue =
      isUnlocked &&
      scheduledDate &&
      !Number.isNaN(new Date(scheduledDate).getTime()) &&
      new Date(scheduledDate).getTime() < Date.now();
    const status = isCompleted ? "COMPLETED" : isPastDue ? "MISSED" : isUnlocked ? "SCHEDULED" : "LOCKED";

    return {
      ...(apiSession || {}),
      id:
        getSessionStringValue((apiSession as any)?._id, (apiSession as any)?.sessionId, apiSession?.id) ||
        `locked-${pastorId}-${sessionNumber}`,
      pastorId,
      sessionNumber,
      title: getSessionStringValue(apiSession?.title, `Session ${sessionNumber}`),
      status,
      scheduledDate: isCompleted ? apiSession?.scheduledDate || "" : isUnlocked ? scheduledDate : "",
    };
  });
}

function buildMentorshipSessionCardData(sessions: MentoringSession[], pastorId: string): MentorshipSessionCardData {
  const allSessions = buildReviewMentorshipSessions(sessions, pastorId);
  const completedSessions = allSessions.filter(
    (session) => normalizeMentorshipSessionStatus(session.status) === "COMPLETED",
  );
  const total = allSessions.length;
  const lastCompleted = completedSessions
    .filter((session) => !Number.isNaN(new Date(getMentorshipSessionDate(session)).getTime()))
    .sort(
      (a, b) =>
        new Date(getMentorshipSessionDate(b)).getTime() -
        new Date(getMentorshipSessionDate(a)).getTime(),
    )[0];
  const upcoming = allSessions
    .filter((session) => {
      const status = normalizeMentorshipSessionStatus(session.status);
      const scheduledTime = new Date(getMentorshipSessionDate(session)).getTime();
      return status === "SCHEDULED" && !Number.isNaN(scheduledTime) && scheduledTime >= Date.now();
    })
    .sort(
      (a, b) =>
        new Date(getMentorshipSessionDate(a)).getTime() -
        new Date(getMentorshipSessionDate(b)).getTime(),
    )[0];
  const currentUncompleted =
    allSessions.find((session) => normalizeMentorshipSessionStatus(session.status) !== "COMPLETED") ||
    null;

  const status: MentorshipSessionCardStatus =
    total > 0 && completedSessions.length >= total
      ? "Completed"
      : upcoming
        ? "On Track"
        : currentUncompleted &&
            normalizeMentorshipSessionStatus(currentUncompleted.status) === "MISSED"
          ? "Missed"
          : "In Progress";

  return {
    lastSession: formatMentorshipSessionDateTime(getMentorshipSessionDate(lastCompleted)),
    nextSession: formatMentorshipSessionDateTime(getMentorshipSessionDate(upcoming)),
    sessionsCompleted: `${completedSessions.length}/${total}`,
    status,
  };
}

function mentorshipSessionStatusClass(status: MentorshipSessionCardStatus): string {
  if (status === "Completed" || status === "On Track") return "text-emerald-200";
  if (status === "Missed") return "text-red-200";
  return "text-amber-100";
}

const formatLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

function unwrapCommentsFromResponse(res: { data?: unknown }): any[] {
  const body = (res.data as { data?: unknown } | undefined)?.data ?? res.data;
  if (body && typeof body === "object" && !Array.isArray(body) && "comments" in body) {
    const comments = (body as { comments?: unknown }).comments;
    return Array.isArray(comments) ? comments : [];
  }
  return Array.isArray(body) ? body : [];
}

function unwrapQueriesFromResponse(res: { data?: unknown }): any[] {
  const body = (res.data as { data?: unknown } | undefined)?.data ?? res.data;
  const threads = Array.isArray(body) ? body : body ? [body] : [];
  return threads.flatMap((thread) => {
    if (!thread || typeof thread !== "object") return [];
    const queries = (thread as { queries?: unknown }).queries;
    return Array.isArray(queries) ? queries : [];
  });
}

function personLabel(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const person = value as {
    firstName?: unknown;
    lastName?: unknown;
    name?: unknown;
    email?: unknown;
  };
  const fullName = `${String(person.firstName ?? "").trim()} ${String(person.lastName ?? "").trim()}`.trim();
  return fullName || String(person.name ?? person.email ?? "").trim() || undefined;
}

function getNestedTaskId(item: any): string {
  return String(
    item?.nestedRoadMapItemId ??
      item?.nestedItemId ??
      item?.taskId ??
      item?.roadmapItemId ??
      "",
  ).trim();
}

function hasQueryAnswerText(query: any): boolean {
  return [
    query?.answer,
    query?.reply,
    query?.response,
    query?.resolution,
    query?.resolvedAnswer,
    query?.repliedAnswer,
    query?.mentorReply,
  ].some((value) => String(value ?? "").trim() !== "");
}

function formatQueryCommentDate(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function queryCommentHref(row: QueryCommentRow, pastorId: string): string {
  const params = new URLSearchParams({
    roadmapId: row.roadmapId,
    userId: pastorId,
  });
  if (row.taskId) params.set("taskId", row.taskId);
  return `/mentor/RevitalizationRoadmap/task?${params.toString()}`;
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className={`flex h-full flex-col p-3.5 ${mentorGlassCardFrost}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
          <i className={`${icon} text-xs text-[#8ec5eb]`} />
        </div>
        <h2 className="text-sm font-extrabold text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/10 py-2 last:border-0">
      <span className="text-[11px] text-[#cde2f2]/70">{label}</span>
      <span className={`text-right text-[11px] font-bold ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export default function MentorReviewCenterDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const pastorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [mentorName, setMentorName] = useState("Mentor");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showTodayMeetings, setShowTodayMeetings] = useState(false);
  const [showMissedMeetings, setShowMissedMeetings] = useState(false);
  const [showRescheduledMeetings, setShowRescheduledMeetings] = useState(false);
  const [showWeeklyAssessments, setShowWeeklyAssessments] = useState(false);
const [showWeeklyRoadmaps, setShowWeeklyRoadmaps] = useState<
  "new" | "resubmitted" | null
>(null);
const [meetingSort, setMeetingSort] = useState<"newest" | "oldest">("newest");
const [weeklyAssessmentSubmissions, setWeeklyAssessmentSubmissions] = useState<
  WeeklyAssessmentSubmission[]
>([]);
const [weeklyRoadmaps, setWeeklyRoadmaps] = useState<RoadmapSubmissionActivity[]>([]);
const [showQueriesCommentsModal, setShowQueriesCommentsModal] = useState(false);
const [queryCommentFilter, setQueryCommentFilter] = useState<QueryCommentFilter>("all");
const [queryCommentRows, setQueryCommentRows] = useState<QueryCommentRow[]>([]);
const [queryCommentLoading, setQueryCommentLoading] = useState(false);
const [assessmentStatusRows, setAssessmentStatusRows] = useState<AssessmentStatusRow[]>([]);
const [roadmapProgressRows, setRoadmapProgressRows] = useState<RoadmapProgressCardRow[]>([]);
const [mentorshipSessionCard, setMentorshipSessionCard] = useState<MentorshipSessionCardData>(
  defaultMentorshipSessionCard,
);
  const [assessmentStats, setAssessmentStats] = useState({
  completed: 0,
  total: 0,
  pendingReview: 0,
});
const [roadmapPercent, setRoadmapPercent] = useState(0);

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;
    const loadAppointments = async () => {
  try {
    const res = await apiGetMentorAppointments(String(mentorId), false);
    const list = unwrapAppointmentsAxiosData(res);
    setAppointments(Array.isArray(list) ? list : []);
  } catch (error) {
    console.error("Failed to load mentor appointments", error);
    setAppointments([]);
  }
};

const loadProgressStats = async () => {
  try {
    const [assignedRes, allAssessmentsRes, progressRes, appointmentsRes] = await Promise.all([
      apiGetAssignedAssessments(String(pastorId)),
      apiGetAssessments(),
      apiGetUserProgress(String(pastorId)),
      apiGetAppointments({ userId: String(pastorId), futureOnly: false } as any),
    ]);

    let assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
    const allAssessments = unwrapAssessmentsFromResponse(allAssessmentsRes);
    const assignmentList = allAssessments
      .map((assessment: any) => {
        const assignment = Array.isArray(assessment?.assignments)
          ? assessment.assignments.find(
              (row: any) => assignedUserId(row?.userId) === String(pastorId),
            )
          : null;

        if (!assignment) return null;

        return {
          assessment,
          assessmentId: assessment?._id || assessment?.id,
          assignmentId: assignment?._id,
          dueDate: assignment?.dueDate,
          assignedDueDate: assignment?.dueDate,
          updatedAt: assignment?.assignedAt || assessment?.updatedAt,
        };
      })
      .filter(Boolean);

    const existingIds = new Set(
      assignedRows
        .map((item: any) => flattenAssignedAssessmentRow(item)?.assessmentId)
        .filter(Boolean),
    );

    const missingFromAssignedApi = assignmentList.filter((item: any) => {
      const id = String(item?.assessmentId || "");
      return id && !existingIds.has(id);
    });

    assignedRows = [...assignedRows, ...missingFromAssignedApi];
    const progress = unwrapProgressData(progressRes);
    const assessmentProgress = Array.isArray(progress?.assessments)
      ? progress.assessments
      : [];
    const statusByAssessmentId = new Map(
      assessmentProgress
        .map((row: any) => ({
          assessmentId: extractAssessmentIdFromProgressRow(row),
          status: normalizeAssessmentStatus(row?.status),
          assignmentId: row?.assignmentId ? String(row.assignmentId) : undefined,
        }))
        .filter((row: { assessmentId: string }) => row.assessmentId !== "")
        .map((row: any) => [row.assessmentId, row]),
    );

    const appointmentsList = unwrapAppointmentsAxiosData(appointmentsRes);
    const appointmentById = new Map<string, any>();
    const appointmentsByAssessmentId = new Map<string, any[]>();

    appointmentsList.forEach((appt: any) => {
      const id = String(appt?._id ?? appt?.id ?? "").trim();
      if (id) appointmentById.set(id, appt);

      const notes = String(appt?.notes ?? "");
      const metadata = appt?.metadata || appt?.meta || {};
      const fromMetadata = String(metadata?.assessmentId ?? "").trim();
      const fromNotes =
        notes.match(/assessmentId\s*[:=]\s*([^|\s,]+)/i)?.[1]?.trim() || "";
      const linkedAssessmentId = fromMetadata || fromNotes;

      if (linkedAssessmentId) {
        const prev = appointmentsByAssessmentId.get(linkedAssessmentId) || [];
        prev.push(appt);
        appointmentsByAssessmentId.set(linkedAssessmentId, prev);
      }
    });

    const enrichedAssessmentRows = await Promise.all(
      assignedRows.map(async (item: any, index: number) => {
        const flat: any = flattenAssignedAssessmentRow(item);
        if (!flat) return null;
        const assessment = flat.assessment as any;
        const assessmentId = String(
          assessment?._id ?? assessment?.id ?? flat.assessmentId ?? item?.assessmentId ?? "",
        ).trim();
        if (!assessmentId) return null;

        const fullAssessment = allAssessments.find(
          (row: any) => String(row?._id ?? row?.id ?? "") === assessmentId,
        );
        const progressRow = statusByAssessmentId.get(assessmentId) as
          | { status?: AssessmentStatusRow["status"]; assignmentId?: string }
          | undefined;
        const appointmentId = String(
          item?.appointmentId ?? assessment?.appointmentId ?? "",
        ).trim();
        const apptFromId = appointmentId ? appointmentById.get(appointmentId) : null;
        const apptFromAssessment = (appointmentsByAssessmentId.get(assessmentId) || [])
          .slice()
          .sort((a, b) => {
            const ta = new Date(String(a?.meetingDate ?? 0)).getTime();
            const tb = new Date(String(b?.meetingDate ?? 0)).getTime();
            return tb - ta;
          })[0];
        const appt = apptFromId || apptFromAssessment || null;
        const resolvedAppointmentId = String(
          appt?._id ?? appt?.id ?? appointmentId ?? "",
        ).trim();
        const hasMeetingDetails = Boolean(resolvedAppointmentId || appt?.meetingDate);

        const storedCdp = getStoredRecommendationsForPastorAssessment(
          String(pastorId),
          assessmentId,
        );
        const hasStoredCdp = storedCdp.some((rec) => rec.sent === true);

        let hasBackendCdp = false;
        try {
          const recRes = await apiGetSectionRecommendations(assessmentId, String(pastorId));
          const body: any = recRes.data;
          hasBackendCdp = hasSentRecommendations(body?.data ?? body);
        } catch {
          hasBackendCdp = false;
        }

        let hasSubmittedAnswers = false;
        try {
          const answersRes = await apiGetUserAnswers(assessmentId, String(pastorId));
          hasSubmittedAnswers = Boolean((answersRes?.data as any)?.data?._id);
        } catch {
          hasSubmittedAnswers = false;
        }

        const progressStatus = progressRow?.status || "not_started";
        const status =
          hasMeetingDetails && (hasStoredCdp || hasBackendCdp)
            ? "completed"
            : hasSubmittedAnswers ||
                progressStatus === "submitted" ||
                progressStatus === "completed"
              ? "submitted"
              : "not_started";

        const rawStatus =
          flat.status ?? flat.progressStatus ?? item?.status ?? item?.progressStatus ?? "";

        return {
          id: String(flat.assignmentId ?? flat.assessmentId ?? item?._id ?? item?.id ?? index),
          name: String(
            flat.assessment?.name ??
              flat.assessment?.title ??
              flat.name ??
              flat.title ??
              fullAssessment?.name ??
              fullAssessment?.title ??
              item?.assessment?.name ??
              item?.assessment?.title ??
              item?.name ??
              item?.title ??
              "Assessment",
          ),
          status: status || normalizeAssessmentStatus(rawStatus),
        };
      }),
    );

    const validAssessmentRows = enrichedAssessmentRows.filter(
      (row): row is AssessmentStatusRow => Boolean(row),
    );
    const completed = validAssessmentRows.filter((row) => row.status === "completed").length;
    const pendingReview = validAssessmentRows.filter((row) => row.status === "submitted").length;

    setAssessmentStatusRows(validAssessmentRows.slice(0, 4));

    setAssessmentStats({
      completed,
      total: validAssessmentRows.length,
      pendingReview,
    });

    const weeklySubmissions = await Promise.all(
      assignedRows.map(async (item) => {
        const flat: any = flattenAssignedAssessmentRow(item);
        if (!flat) return null;

        try {
          const answersRes = await apiGetUserAnswers(
            flat.assessmentId,
            String(pastorId),
          );
          const answerData = (answersRes.data as any)?.data;
          if (!answerData?._id) return null;

          const submittedAt =
            answerData.submittedAt ||
            answerData.createdAt ||
            answerData.updatedAt;

          if (!isWithinCurrentWeek(submittedAt)) return null;

          return {
            assessmentId: flat.assessmentId,
            assessmentName: String(
              flat.assessment?.name ??
                flat.assessment?.title ??
                flat.name ??
                "Assessment",
            ),
            submittedAt: String(submittedAt),
          };
        } catch {
          return null;
        }
      }),
    );

    setWeeklyAssessmentSubmissions(
      weeklySubmissions
        .filter((item): item is WeeklyAssessmentSubmission => Boolean(item))
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        ),
    );

    setRoadmapPercent(
      Math.min(100, Math.max(0, Number(progress?.overallRoadmapProgress ?? 0))),
    );
  } catch (error) {
    console.error("Failed to load pastor progress stats", error);
    setAssessmentStatusRows([]);
    setAssessmentStats({
      completed: 0,
      total: 0,
      pendingReview: 0,
    });
    setWeeklyAssessmentSubmissions([]);
    setRoadmapPercent(0);
  }
};

const loadRoadmapActivity = async () => {
  try {
    const today = formatLocalDate(new Date());
    const res = await apiGetRoadmapSubmissionActivity(
      String(pastorId),
      today,
      today,
    );
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    console.log("ROADMAP ACTIVITY RESPONSE", rows);
    setWeeklyRoadmaps(rows);
  } catch (error) {
    console.warn("Failed to load roadmap submission activity", error);
    setWeeklyRoadmaps([]);
  }
};

const loadRoadmapProgressRows = async () => {
  try {
    const [assignments, progressRes] = await Promise.all([
      fetchRoadmapAssignmentsForUser(String(pastorId)),
      apiGetUserProgress(String(pastorId)),
    ]);
    const parentRoadmaps = collapseRoadmapAssignmentsToParents(assignments);
    const progress = unwrapProgressData(progressRes);
    const progressRows = Array.isArray(progress?.roadmaps) ? progress.roadmaps : [];

    setRoadmapProgressRows(
      parentRoadmaps.slice(0, 4).map((roadmap: any, index: number) => {
        const roadmapId = String(roadmap?.parentRoadmapId ?? roadmap?.id ?? "").trim();
        const progressRow = progressRows.find(
          (row: any) => String(row?.roadMapId ?? row?.roadmapId ?? row?._id ?? row?.id ?? "").trim() === roadmapId,
        );
        const value = roadmapProgressValue(roadmap, progressRow);
        return {
          id: roadmapId || String(roadmap?.id ?? roadmap?.title ?? `roadmap-${index}`),
          title: String(roadmap?.title ?? roadmap?.parentRoadmapName ?? "Roadmap"),
          value,
          valueClassName: roadmapValueClass(value, roadmap?.status),
        };
      }),
    );
  } catch (error) {
    console.warn("Failed to load roadmap progress rows", error);
    setRoadmapProgressRows([]);
  }
};

const loadMentorshipSessionCard = async () => {
  try {
    const res = await apiGetPastorMentoringSessions(String(pastorId));
    const sessions = unwrapPastorMentoringSessions(res);
    setMentorshipSessionCard(buildMentorshipSessionCardData(sessions, String(pastorId)));
  } catch (error) {
    console.warn("Failed to load mentorship session card", error);
    setMentorshipSessionCard(defaultMentorshipSessionCard);
  }
};

const loadQueriesAndComments = async () => {
  try {
    setQueryCommentLoading(true);
    const roadmaps = await fetchMergedRoadmapsForAssignedUser(String(pastorId));
    const groups = await Promise.all(
      roadmaps.map(async (roadmap: any) => {
        const roadmapId = String(roadmap?._id ?? roadmap?.id ?? "").trim();
        if (!roadmapId) return [];
        const roadmapName = String(roadmap?.name ?? roadmap?.title ?? "Roadmap");
        const tasks = unwrapNestedRoadmapsArray(roadmap);
        const taskNameById = new Map<string, string>();
        tasks.forEach((task: any) => {
          const taskId = resolveNestedTemplateItemId(task);
          if (!taskId) return;
          taskNameById.set(taskId, String(task?.name ?? task?.title ?? "Roadmap Task"));
        });

        const [commentsRes, queriesRes] = await Promise.allSettled([
          apiGetComments(roadmapId, String(pastorId)),
          apiGetQueries(roadmapId, String(pastorId), undefined, undefined, "pastor"),
        ]);

        const comments =
          commentsRes.status === "fulfilled" ? unwrapCommentsFromResponse(commentsRes.value) : [];
        const queries =
          queriesRes.status === "fulfilled" ? unwrapQueriesFromResponse(queriesRes.value) : [];

        const commentRows: QueryCommentRow[] = comments.flatMap((comment: any, index: number) => {
            const taskId = getNestedTaskId(comment);
            const message = String(comment?.text ?? comment?.message ?? comment?.comment ?? "").trim();
            if (!message) return [];
            const createdAt = String(comment?.addedDate ?? comment?.createdAt ?? comment?.createdDate ?? "");
            return [{
              id: `comment-${roadmapId}-${String(comment?._id ?? comment?.id ?? index)}`,
              type: "comment" as const,
              roadmapId,
              taskId: taskId || undefined,
              roadmapName,
              taskName: taskId ? taskNameById.get(taskId) : undefined,
              message,
              author: personLabel(comment?.mentorId ?? comment?.author ?? comment?.createdBy),
              createdAt,
            }];
          });

        const queryRows: QueryCommentRow[] = queries.flatMap((query: any, index: number) => {
            const taskId = getNestedTaskId(query);
            const message = String(query?.actualQueryText ?? query?.text ?? query?.message ?? "").trim();
            if (!message) return [];
            const createdAt = String(query?.createdDate ?? query?.created_at ?? query?.createdAt ?? "");
            return [{
              id: `query-${roadmapId}-${String(query?._id ?? query?.id ?? index)}`,
              type: "query" as const,
              roadmapId,
              taskId: taskId || undefined,
              roadmapName,
              taskName: taskId ? taskNameById.get(taskId) : undefined,
              message,
              author: personLabel(query?.userId ?? query?.author ?? query?.createdBy) || "Pastor",
              createdAt,
              status: String(query?.status ?? ""),
              hasAnswer: hasQueryAnswerText(query),
            }];
          });

        return [...queryRows, ...commentRows];
      }),
    );

    setQueryCommentRows(
      groups
        .flat()
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        ),
    );
  } catch (error) {
    console.error("Failed to load roadmap queries and comments", error);
    setQueryCommentRows([]);
  } finally {
    setQueryCommentLoading(false);
  }
};

    setMentorName(getDisplayName(mentor));
//     if (mentorId) {
//   void loadAppointments();
// }
if (mentorId) {
  void loadAppointments();
}

if (pastorId) {
  void loadProgressStats();
  void loadRoadmapActivity();
  void loadRoadmapProgressRows();
  void loadMentorshipSessionCard();
  void loadQueriesAndComments();
}
    if (!mentorId || !pastorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void apiGetAssignedUsers(String(mentorId))
      .then((res) => {
        if (cancelled) return;
        const assigned: Pastor[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const selected =
          assigned.find(
            (user) =>
              String(user._id ?? user.id ?? "") === String(pastorId),
          ) ?? null;
        setPastor(selected);
      })
      .catch((error) => {
        console.error("Failed to load selected pastor", error);
        if (!cancelled) setPastor(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pastorId]);

  if (loading) {
    return (
      <div className={`${mentorPageRoot} items-center justify-center`}>
        <div className="text-center">
          <div className={`mx-auto mb-4 ${mentorSpinner}`} />
          <p className="text-sm text-[#cde2f2]">
            Loading pastor dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!pastor) {
    return (
      <div className={mentorPageRoot}>
        <main className="relative z-10 mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 sm:px-6">
          <Link
            href="/mentor/review-center"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#8ec5eb] transition hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
            Back to Review Center
          </Link>
          <div className={`p-8 text-center ${mentorGlassCardFrost}`}>
            <i className="fa-regular fa-user mb-3 text-3xl text-white/25" />
            <p className="text-sm font-semibold text-white">Pastor not found</p>
            <p className="mt-1 text-xs text-[#cde2f2]/60">
              This pastor is not currently assigned to you.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const pastorName = getDisplayName(pastor);
  const assessmentCompleted = assessmentStats.completed;
const assessmentTotal = assessmentStats.total;
const assessmentPendingReview = assessmentStats.pendingReview;

const assessmentPercent = assessmentTotal
  ? Math.round((assessmentCompleted / assessmentTotal) * 100)
  : 0;

const assessmentCircleStyle = {
  background: `conic-gradient(#9b7cff ${assessmentPercent}%, rgba(255,255,255,0.12) 0)`,
};
const queryRows = queryCommentRows.filter((row) => row.type === "query");
const commentRows = queryCommentRows.filter((row) => row.type === "comment");
const answeredQueryStatuses = new Set(["answered", "resolved", "closed", "completed"]);
const unansweredQueryCount = queryRows.filter((row) => {
  const status = String(row.status ?? "").trim().toLowerCase();
  return !answeredQueryStatuses.has(status) && !row.hasAnswer;
}).length;
const filteredQueryCommentRows = queryCommentRows.filter((row) => {
  if (queryCommentFilter === "queries") return row.type === "query";
  if (queryCommentFilter === "comments") return row.type === "comment";
  return true;
});
  const mentor = getMentorFromCookie();
const mentorId = String(mentor?.id ?? mentor?._id ?? "");

const now = Date.now();

const getStatus = (appointment: any) =>
  String(appointment.status ?? "").toLowerCase();

const getStartTime = (appointment: any) =>
  new Date(appointment.meetingDate ?? "").getTime();

const getEndTime = (appointment: any) =>
  new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();

const pastorAppointments = appointments.filter((appointment) => {
  const appointmentPastorId = String(
    appointment.userId ??
      appointment.user?._id ??
      appointment.user?.id ??
      "",
  );

  const appointmentMentorId = String(
    appointment.mentorId ??
      appointment.mentor?._id ??
      appointment.mentor?.id ??
      "",
  );

  return appointmentPastorId === String(pastorId) && appointmentMentorId === mentorId;
});

const isSameDay = (value?: string) => {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const todayMeetings = pastorAppointments
  .filter((appointment) => isSameDay(appointment.meetingDate))
  .sort((a, b) => getStartTime(a) - getStartTime(b));

const missedMeetings = pastorAppointments
  .filter((appointment) => getStatus(appointment) === "missed")
  .sort((a, b) => getStartTime(b) - getStartTime(a));

const rescheduledMeetings = pastorAppointments
  .filter((appointment) => getStatus(appointment) === "rescheduled")
  .sort((a, b) => getStartTime(b) - getStartTime(a));

const newRoadmapSubmissions = weeklyRoadmaps.filter(
  (activity) => activity.isResubmission === false,
);
const pastorResubmittedTasks = weeklyRoadmaps.filter(
  (activity) => activity.isResubmission === true,
);
const newSubmissionCount = newRoadmapSubmissions.length;
const resubmittedCount = pastorResubmittedTasks.length;

if (
  pastorAppointments.length > 0 &&
  missedMeetings.length === 0 &&
  rescheduledMeetings.length === 0
) {
  console.log(
    "Review Center appointment statuses:",
    [...new Set(pastorAppointments.map((appointment) => String(appointment.status)))],
  );
}



const isPastOrFinished = (appointment: any) => {
  const status = getStatus(appointment);
  const end = getEndTime(appointment);

  return (
    status === "completed" ||
    status === "missed" ||
    status === "cancelled" ||
    (Number.isFinite(end) && end < now)
  );
};

const endedAppointments = pastorAppointments
  .filter(isPastOrFinished)
  .sort((a, b) => getEndTime(b) - getEndTime(a));

const ongoingAppointment =
  pastorAppointments.find((appointment) => {
    const status = getStatus(appointment);
    const start = getStartTime(appointment);
    const end = getEndTime(appointment);

    if (["completed", "missed", "cancelled"].includes(status)) return false;

    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      now < end
    );
  }) ?? null;

const futureAppointments = pastorAppointments
  .filter((appointment) => {
    const status = getStatus(appointment);
    const start = getStartTime(appointment);

    if (["completed", "missed", "cancelled"].includes(status)) return false;

    return Number.isFinite(start) && start > now;
  })
  .sort((a, b) => getStartTime(a) - getStartTime(b));

const lastMeeting = endedAppointments[0] ?? null;
const nextMeeting = ongoingAppointment ?? futureAppointments[0] ?? null;
const isNextMeetingOngoing = Boolean(ongoingAppointment);


const formatMeetingDate = (value?: string) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNextMeetingMain = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) return "Today";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMeetingTime = (value?: string) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
const formatRelativeDays = (value?: string) => {
  if (!value) return "N/A";
  const diff = now - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};


const daysUntil = (value?: string) => {
  if (!value) return "N/A";

  const target = new Date(value);
  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const days = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (days === 0) return "Today";
  if (days === 1) return "In 1 day";

  return `In ${days} days`;
};

const renderMeetingModal = ({
  title,
  description,
  meetings,
  emptyText,
  onClose,
}: {
  title: string;
  description: string;
  meetings: any[];
  emptyText: string;
  onClose: () => void;
}) => {
  const sortedMeetings = [...meetings].sort((a, b) => {
    const diff = getStartTime(a) - getStartTime(b);
    return meetingSort === "oldest" ? diff : -diff;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-white">{title}</h3>
            <p className="text-xs text-[#cde2f2]/65">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={meetingSort}
              onChange={(e) =>
                setMeetingSort(e.target.value as "newest" | "oldest")
              }
              className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white outline-none [&>option]:bg-[#061f35]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
          {sortedMeetings.length > 0 ? (
            sortedMeetings.map((meeting) => (
              <Link
                key={meeting._id ?? meeting.id}
                href={`/mentor/MentorSchedule/${meeting._id ?? meeting.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {pastorName}
                    </p>
                    <p className="text-xs text-[#cde2f2]/65">Pastor</p>
                  </div>

                  <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                    {String(meeting.status ?? "Scheduled")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-[#cde2f2]/55">Date</p>
                    <p className="text-xs font-bold text-white">
                      {formatMeetingDate(meeting.meetingDate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-[#cde2f2]/55">Time</p>
                    <p className="text-xs font-bold text-white">
                      {formatMeetingTime(meeting.meetingDate)} -{" "}
                      {formatMeetingTime(meeting.endTime)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-[#8ec5eb]">
                  Mode: {meeting.mode ?? meeting.platform ?? "N/A"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="text-sm font-semibold text-white">{emptyText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const roadmapModalItems =
  showWeeklyRoadmaps === "resubmitted"
    ? pastorResubmittedTasks
    : newRoadmapSubmissions;

const roadmapModalTitle =
  showWeeklyRoadmaps === "resubmitted"
    ? "Pastor Resubmitted Tasks"
    : "New Roadmap Submissions";




  return (
    <div className={mentorPageRoot}>
      <main className="relative z-10 mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/mentor/review-center"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">
              Review Center
            </h1>
            <p className="mt-0.5 text-xs text-[#cde2f2]/65">
              Key activities and updates for this pastor
            </p>
          </div>
        </header>

        <section className={`mb-5 overflow-hidden ${mentorGlassCardFrost}`}>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex min-w-0 items-center gap-3 p-4 lg:w-[235px] lg:shrink-0">
              <Image
                src={pastor.profilePicture || UserProfile}
                alt={pastorName}
                width={62}
                height={62}
                unoptimized={Boolean(pastor.profilePicture)}
                className="h-[62px] w-[62px] rounded-full border-2 border-white/20 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-white">
                  {pastorName}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8ec5eb]">
                  Pastor
                </p>
                {/* <p className="mt-1.5 text-[11px] text-[#cde2f2]/65">
                  Current Mentor:{" "}
                  <span className="font-semibold text-white/90">
                    {mentorName}
                  </span>
                </p> */}
                <p className="mt-1.5 text-[11px] text-[#cde2f2]/65">
  Current Mentor:{" "}
  <Link
    href="/mentor/profile"
    className="font-semibold text-white/90 underline-offset-2 transition hover:text-[#8ec5eb] hover:underline"
  >
    {mentorName}
  </Link>
</p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 border-t border-white/10 sm:grid-cols-5 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2 border-b border-r border-white/10 p-3 sm:border-b-0">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#3498DB ${roadmapPercent}%, rgba(255,255,255,0.12) 0)`,
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a2945] text-[11px] font-black text-white">
                    {Math.round(roadmapPercent)}%
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-[#cde2f2]/65">
                    Roadmap Progress
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-200">
                    On Track
                  </p>
                </div>
              </div>
              {/* <div className="border-b border-r border-white/10 p-3 sm:border-b-0">
                <p className="text-[11px] text-[#cde2f2]/65">
                  Assessments Completed
                </p>
                <p className="mt-2 text-lg font-black text-white">4/6</p>
                <p className="text-xs font-bold text-amber-100">
                  2 Pending Review
                </p>
              </div> */}
              <Link
  href={`/mentor/MentorAssessments?menteeId=${encodeURIComponent(String(pastorId))}`}
  className="flex flex-col items-center justify-center border-b border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05] sm:border-b-0"
>
  <p className="text-[11px] text-[#cde2f2]/65">
    Assessments Completed
  </p>

  <span
    className="mt-2 flex h-12 w-12 items-center justify-center rounded-full"
    style={assessmentCircleStyle}
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a2945] text-[11px] font-black text-white">
      {assessmentCompleted}/{assessmentTotal || 0}
    </span>
  </span>

  <p className="mt-2 text-xs font-bold text-amber-100">
    {assessmentPendingReview} Pending Review
  </p>
</Link>
              {/* <div className="border-b border-r border-white/10 p-3 sm:border-b-0">
                <p className="text-[11px] text-[#cde2f2]/65">Last Meeting</p>
                <p className="mt-2 text-sm font-black text-white">12 days ago</p>
                <p className="text-xs font-bold text-red-200">Overdue</p>
              </div> */}
              <Link
  href={
  lastMeeting
    ? `/mentor/MentorSchedule/${lastMeeting._id ?? lastMeeting.id}`
    : "#"
}
  className="flex flex-col items-center justify-center border-b border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05] sm:border-b-0"
>
  <p className="text-[11px] text-[#cde2f2]/65">Last Meeting</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-400/15 text-[#8ec5eb]">
    <i className="fa-regular fa-calendar-check text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">
    {lastMeeting ? formatNextMeetingMain(lastMeeting.meetingDate) : "N/A"}
  </p>
  <p className="text-xs font-bold text-red-200">
    {lastMeeting
  ? `${formatMeetingTime(lastMeeting.meetingDate)} · Finished`
  : "No finished meeting"}
  </p>
</Link>
              {/* <div className="border-r border-white/10 p-3">
                <p className="text-[11px] text-[#cde2f2]/65">Next Meeting</p>
                <p className="mt-2 text-sm font-black text-white">
                  May 31, 2026
                </p>
                <p className="text-xs font-bold text-sky-100">In 3 days</p>
              </div> */}
              <Link
  href={
  nextMeeting
    ? `/mentor/MentorSchedule/${nextMeeting._id ?? nextMeeting.id}`
    : "#"
}
  className="flex flex-col items-center justify-center border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05]"
>
  <p className="text-[11px] text-[#cde2f2]/65">Next Meeting</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
    <i className="fa-regular fa-calendar-plus text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">
    {nextMeeting
  ? isNextMeetingOngoing
    ? "Ongoing now"
    : formatNextMeetingMain(nextMeeting.meetingDate)
  : "N/A"}
  </p>
  <p className="text-xs font-bold text-sky-100">
   {/* {nextMeeting
  ? `${daysUntil(nextMeeting.meetingDate)} · ${formatMeetingTime(nextMeeting.meetingDate)}`
  : "No upcoming meeting"} */}
  {nextMeeting
  ? isNextMeetingOngoing
    ? `${formatMeetingTime(nextMeeting.meetingDate)} – ${formatMeetingTime(nextMeeting.endTime)}`
    : `${daysUntil(nextMeeting.meetingDate)} · ${formatMeetingTime(nextMeeting.meetingDate)}`
  : "No upcoming meeting"}
  </p>
</Link>
             <div className="flex flex-col items-center justify-center p-3 text-center">
  <p className="text-[11px] text-[#cde2f2]/65">Last Login</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
    <i className="fa-regular fa-user text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">N/A</p>
  <p className="text-xs font-bold text-[#cde2f2]/70">No login data</p>
</div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.16em] text-[#cde2f2]/75">
            Attention Required
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {attentionItems.map((item) => (
              // <button
              //   key={item.title}
              //   type="button"
              //   className={`relative flex min-h-[132px] flex-col items-start p-3 text-left ${mentorGlassCardFrost}`}
              // >
              <button
  key={item.title}
  type="button"
  onClick={() => {
    if (item.title === "Missed Meetings") setShowMissedMeetings(true);
    if (item.title === "Rescheduled Meetings") {
      setShowRescheduledMeetings(true);
    }
    if (item.title === "Pastor Resubmitted Tasks") {
      setShowWeeklyRoadmaps("resubmitted");
    }
    if (item.title === "New Roadmap Submissions") {
      setShowWeeklyRoadmaps("new");
    }
    if (item.title === "Today's Meetings") setShowTodayMeetings(true);
    if (item.title === "New Assessment Submissions") {
      setShowWeeklyAssessments(true);
    }
  }}
  className={`relative flex min-h-[132px] flex-col items-start p-3 text-left ${mentorGlassCardFrost}`}
>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.tone}`}
                >
                  <i className={`${item.icon} text-base`} />
                </span>
                <span className="mt-2 min-w-0 pr-3">
                  <span className="block text-xl font-black leading-none text-white">
                    {/* {item.count} */}
                    {item.title === "Missed Meetings"
                      ? missedMeetings.length
                      : item.title === "Rescheduled Meetings"
                        ? rescheduledMeetings.length
                        : item.title === "Pastor Resubmitted Tasks"
                          ? resubmittedCount
                          : item.title === "New Roadmap Submissions"
                            ? newSubmissionCount
                            : item.title === "Today's Meetings"
                              ? todayMeetings.length
                              : item.title === "New Assessment Submissions"
                                ? weeklyAssessmentSubmissions.length
                                : item.count}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-bold leading-tight text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[10px] leading-tight text-[#cde2f2]/60">
                    {item.description}
                  </span>
                </span>
                <i className="fa-solid fa-chevron-right absolute bottom-3 right-3 text-[10px] text-[#cde2f2]/45" />
              </button>
            ))}
          </div>
        </section>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Panel title="Mentorship Sessions" icon="fa-regular fa-calendar">
  <div className="flex-1">
  <DetailRow label="Last Session" value={mentorshipSessionCard.lastSession} />
  <DetailRow label="Next Session" value={mentorshipSessionCard.nextSession} />
  <DetailRow label="Sessions Completed" value={mentorshipSessionCard.sessionsCompleted} />
  <DetailRow
    label="Status"
    value={mentorshipSessionCard.status}
    valueClassName={mentorshipSessionStatusClass(mentorshipSessionCard.status)}
  />
  </div>

  <button
    type="button"
    onClick={() =>
      router.push(`/mentor/mentoring-session?pastorId=${encodeURIComponent(String(pastorId))}`)
    }
    className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
  >
    View sessions
    <i className="fa-solid fa-arrow-right text-[10px]" />
  </button>
</Panel>
          <Panel title="Roadmap Progress" icon="fa-solid fa-road">
            <div className="flex-1">
            {roadmapProgressRows.length > 0 ? (
              roadmapProgressRows.map((roadmap) => (
                <DetailRow
                  key={roadmap.id}
                  label={roadmap.title}
                  value={roadmap.value}
                  valueClassName={roadmap.valueClassName}
                />
              ))
            ) : (
              <DetailRow
                label="Roadmaps"
                value="Not Assigned"
                valueClassName="text-[#cde2f2]/70"
              />
            )}
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(`/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(String(pastorId))}`)
              }
              className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
            >
              View roadmap
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </Panel>
          <Panel title="Assessment Status" icon="fa-regular fa-file-lines">
  <div className="flex-1">
  {assessmentStatusRows.length > 0 ? (
    assessmentStatusRows.map((assessment) => {
      const status = assessmentStatusDisplay(assessment.status);
      return (
        <DetailRow
          key={assessment.id}
          label={assessment.name}
          value={status.label}
          valueClassName={status.className}
        />
      );
    })
  ) : (
    <DetailRow
      label="Assessments"
      value="Pending / Not Started"
      valueClassName="text-red-200"
    />
  )}
  </div>

  <button
    type="button"
    onClick={() =>
      router.push(`/mentor/MentorAssessments?menteeId=${encodeURIComponent(String(pastorId))}`)
    }
    className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
  >
    View assessments
    <i className="fa-solid fa-arrow-right text-[10px]" />
  </button>
</Panel>
          <Panel
            title="Queries and Comments"
            icon="fa-regular fa-comments"
          >
            <div className="flex-1">
            <DetailRow
              label="Unanswered Queries"
              value={String(unansweredQueryCount)}
            />
            <DetailRow label="Total Queries" value={String(queryRows.length)} />
            <DetailRow label="Total Comments" value={String(commentRows.length)} />
            <DetailRow label="Total Messages" value={String(queryCommentRows.length)} />
            </div>
            <button
              type="button"
              onClick={() => setShowQueriesCommentsModal(true)}
              className="mt-auto inline-flex items-center gap-2 pt-4 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
            >
              View all messages
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </Panel>
        </div>

{showQueriesCommentsModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className={`w-full max-w-3xl p-5 ${mentorGlassCardFrost}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">
            Queries and Comments
          </h3>
          <p className="mt-1 text-xs text-[#cde2f2]/65">
            Roadmap messages for {pastorName}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowQueriesCommentsModal(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
          aria-label="Close queries and comments"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["all", "All"],
          ["queries", "Queries"],
          ["comments", "Comments"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setQueryCommentFilter(value as QueryCommentFilter)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
              queryCommentFilter === value
                ? "border-[#8ec5eb]/55 bg-[#8ec5eb]/20 text-white"
                : "border-white/15 bg-white/5 text-[#cde2f2] hover:bg-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
        {queryCommentLoading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-[#cde2f2]">
            <div className={mentorSpinner} />
            Loading messages...
          </div>
        ) : filteredQueryCommentRows.length > 0 ? (
          filteredQueryCommentRows.map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={() => router.push(queryCommentHref(row, String(pastorId)))}
              className="block w-full rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.08]"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-lg border px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
                    row.type === "query"
                      ? "border-amber-300/40 bg-amber-400/15 text-amber-100"
                      : "border-sky-300/40 bg-sky-400/15 text-sky-100"
                  }`}
                >
                  {row.type === "query" ? "Query" : "Comment"}
                </span>
                <span className="text-xs font-bold text-white">
                  {row.taskName || row.roadmapName}
                </span>
                {row.taskName ? (
                  <span className="text-[11px] text-[#cde2f2]/60">
                    {row.roadmapName}
                  </span>
                ) : null}
              </div>

              <p className="text-sm leading-relaxed text-[#d9ebf8]">
                {row.message}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-[#cde2f2]/60">
                {row.author ? <span>Author: {row.author}</span> : null}
                {row.createdAt ? <span>{formatQueryCommentDate(row.createdAt)}</span> : null}
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-sm font-semibold text-white">
              No queries or comments found.
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
{showTodayMeetings && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">
            Today’s Meetings
          </h3>
          <p className="text-xs text-[#cde2f2]/65">
            {todayMeetings.length} meeting(s) scheduled today
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTodayMeetings(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {todayMeetings.length > 0 ? (
          todayMeetings.map((meeting) => (
            <Link
              key={meeting._id ?? meeting.id}
              href={`/mentor/MentorSchedule/${meeting._id ?? meeting.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {pastorName}
                  </p>
                  <p className="text-xs text-[#cde2f2]/65">Pastor</p>
                </div>

                <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                  {String(meeting.status ?? "Scheduled")}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-[#cde2f2]/55">Date</p>
                  <p className="text-xs font-bold text-white">
                    {formatMeetingDate(meeting.meetingDate)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-[#cde2f2]/55">Time</p>
                  <p className="text-xs font-bold text-white">
                    {formatMeetingTime(meeting.meetingDate)} –{" "}
                    {formatMeetingTime(meeting.endTime)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[#8ec5eb]">
                Mode: {meeting.mode ?? meeting.platform ?? "N/A"}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-sm font-semibold text-white">
              No meetings today
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
        {showMissedMeetings &&
          renderMeetingModal({
            title: "Missed Meetings",
            description: `${missedMeetings.length} missed meeting(s)`,
            meetings: missedMeetings,
            emptyText: "No missed meetings",
            onClose: () => setShowMissedMeetings(false),
          })}
        {showRescheduledMeetings &&
          renderMeetingModal({
            title: "Rescheduled Meetings",
            description: `${rescheduledMeetings.length} rescheduled meeting(s)`,
            meetings: rescheduledMeetings,
            emptyText: "No rescheduled meetings",
            onClose: () => setShowRescheduledMeetings(false),
          })}
        {showWeeklyRoadmaps && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {roadmapModalTitle}
                  </h3>
                  <p className="text-xs text-[#cde2f2]/65">
                    {roadmapModalItems.length} submission(s) today
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWeeklyRoadmaps(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
                {roadmapModalItems.length > 0 ? (
                  roadmapModalItems.map((activity, index) => (
                  
                    <Link
  key={`${activity.submissionId ?? activity.roadMapId}-${index}`}
  href={`/mentor/RevitalizationRoadmap/task?userId=${encodeURIComponent(
    String(pastorId),
  )}&roadmapId=${encodeURIComponent(
    activity.roadMapId,
  )}${
    activity.nestedRoadMapItemId
      ? `&taskId=${encodeURIComponent(activity.nestedRoadMapItemId)}`
      : ""
  }`}
  className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {/* <p className="text-sm font-extrabold text-white">
                            {activity.taskName || "Roadmap Task"}
                          </p>
                          <p className="mt-1 text-xs text-[#cde2f2]/65">
                            {activity.parentRoadmapName || "Roadmap"}
                          </p> */}
                          <p className="text-sm font-extrabold text-white">
  {activity.taskName || "Roadmap Task"}
</p>
<p className="mt-1 text-xs text-[#cde2f2]/65">
  Parent roadmap: {activity.parentRoadmapName || "Roadmap"}
</p>
{activity.nestedRoadMapItemId ? (
  <p className="mt-1 text-[11px] font-semibold text-[#8ec5eb]">
    Nested task
  </p>
) : null}
                        </div>
                        <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                          {activity.status || "Submitted"}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-[#cde2f2]/75">
                        <p>Submission #{activity.submissionNumber ?? "N/A"}</p>
                        <p className="mt-1">
                          Submitted:{" "}
                          {activity.submittedAt
                            ? new Date(activity.submittedAt).toLocaleString()
                            : "N/A"}
                        </p>
                        {activity.resubmittedAt ? (
                          <p className="mt-1">
                            Resubmitted:{" "}
                            {new Date(activity.resubmittedAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      No roadmap submissions today
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {showWeeklyAssessments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    New Assessment Submissions
                  </h3>
                  <p className="text-xs text-[#cde2f2]/65">
                    {weeklyAssessmentSubmissions.length} submission(s) this week
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWeeklyAssessments(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
                {weeklyAssessmentSubmissions.length > 0 ? (
                  weeklyAssessmentSubmissions.map((submission) => (
                    <div
                      key={submission.assessmentId}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                    >
                      <p className="text-sm font-extrabold text-white">
                        {submission.assessmentName}
                      </p>
                      <p className="mt-1 text-xs text-[#cde2f2]/65">
                        Submitted{" "}
                        {new Date(submission.submittedAt).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                      <Link
                        href={`/mentor/MentorAssessments/result?assessmentId=${encodeURIComponent(
                          submission.assessmentId,
                        )}&userId=${encodeURIComponent(String(pastorId))}`}
                        className="mt-3 inline-flex text-xs font-bold text-[#8ec5eb] transition hover:text-white"
                      >
                        View Result
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      No assessment submissions this week
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
