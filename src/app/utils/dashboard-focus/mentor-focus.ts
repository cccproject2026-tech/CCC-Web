import {
  apiGetMentorshipSessions,
  apiGetQueries,
  apiGetRoadmapsByUser,
} from "@/app/Services/roadmaps.service";
import {
  apiGetAssignedAssessments,
  apiGetUserAnswers,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { normalizeComparableId } from "@/app/utils/roadmap-id-utils";
import type { DashboardFocusItem, DashboardFocusSection } from "./types";

const MAX_ITEMS_PER_SECTION = 10;
const MAX_MENTEES = 5;
const MAX_ROADMAPS_PER_MENTEE = 3;

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

const toEpochMs = (value?: string | null) => {
  if (!value) return 0;
  const t = Date.parse(value);
  return Number.isNaN(t) ? 0 : t;
};

const addDaysToDateOnlyISO = (dateOnlyISO: string, days: number) => {
  const [year, month, day] = dateOnlyISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

const getDateOnlyFromDateTime = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
};

function appointmentMeetingDate(a: unknown): string {
  if (!a || typeof a !== "object") return "";
  const o = a as Record<string, unknown>;
  const v = o.meetingDate ?? o.date ?? o.startTime ?? o.scheduledAt;
  return v != null ? String(v) : "";
}

function sessionTopicLine(sessionNumber: number): string {
  if (sessionNumber === 1) return "Introduction & Orientation";
  return `Mentorship session ${sessionNumber}`;
}

function sessionOrdinalLabel(sessionNumber: number): string {
  const n = Number(sessionNumber);
  if (n === 1) return "First session";
  if (n === 2) return "Second session";
  if (n === 3) return "Third session";
  return `Session ${n}`;
}

function formatSessionDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export type MentorFocusMentee = {
  id: string;
  firstName?: string;
  lastName?: string;
};

export type MentorFocusInput = {
  mentorId: string;
  mentees: MentorFocusMentee[];
  /** Other calendar meetings (mentor schedule) */
  otherAppointments: unknown[];
  todayDateOnlyISO: string;
};

export async function loadMentorFocusSections(input: MentorFocusInput): Promise<DashboardFocusSection[]> {
  const { mentees, otherAppointments } = input;
  const limitedMentees = mentees.slice(0, MAX_MENTEES);
  const menteeNameById = new Map(
    limitedMentees.map((m) => {
      const name = `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();
      return [m.id, name || "Pastor"] as const;
    }),
  );

  const startOfTodayLocal = new Date();
  startOfTodayLocal.setHours(0, 0, 0, 0);
  const dayEnd = startOfTodayLocal.getTime() + 24 * 60 * 60 * 1000;
  
  const allProgramSessions: {
    session: Record<string, unknown>;
    pastorName: string;
    sid: string;
  }[] = [];

  await Promise.all(
    limitedMentees.map(async (m) => {
      try {
        const res = await apiGetMentorshipSessions(m.id);
        const raw = res.data;
        const list = Array.isArray(raw) ? raw : Array.isArray((raw as { data?: unknown })?.data) ? (raw as { data: unknown[] }).data : [];
        const pastorName = menteeNameById.get(m.id) ?? "Pastor";
        for (const s of list) {
          if (!s || typeof s !== "object") continue;
          const o = s as Record<string, unknown>;
          const sid = String(o.id ?? o._id ?? "");
          if (!sid) continue;
          allProgramSessions.push({ session: o, pastorName, sid });
        }
      } catch {
        /* ignore */
      }
    }),
  );

  const mentorshipProgramTodayItems: DashboardFocusItem[] = allProgramSessions
    .filter(({ session }) => {
      const sd = String(session.scheduledDate ?? "");
      const date = new Date(sd);
      if (Number.isNaN(date.getTime())) return false;
      return date.toDateString() === startOfTodayLocal.toDateString();
    })
    .sort(
      (a, b) =>
        new Date(String(a.session.scheduledDate)).getTime() -
        new Date(String(b.session.scheduledDate)).getTime(),
    )
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map(({ session, pastorName, sid }) => {
      const num = Number(session.sessionNumber ?? 0) || 0;
      const st = String(session.status ?? "");
      const sd = String(session.scheduledDate ?? "");
      return {
        id: `mentorship-program-today-${sid}`,
        title: sessionTopicLine(num),
        description: `${sessionOrdinalLabel(num)} · ${formatSessionDate(sd)} • ${st}`,
        meta: pastorName,
        href: "/mentor/mentoring-session",
      };
    });

  const mentorshipProgramUpcomingItems: DashboardFocusItem[] = allProgramSessions
    .filter(({ session }) => {
      const sd = String(session.scheduledDate ?? "");
      const date = new Date(sd);
      if (Number.isNaN(date.getTime())) return false;
      return date.getTime() > dayEnd;
    })
    .sort(
      (a, b) =>
        new Date(String(a.session.scheduledDate)).getTime() -
        new Date(String(b.session.scheduledDate)).getTime(),
    )
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map(({ session, pastorName, sid }) => {
      const num = Number(session.sessionNumber ?? 0) || 0;
      const st = String(session.status ?? "");
      const sd = String(session.scheduledDate ?? "");
      return {
        id: `mentorship-program-upcoming-${sid}`,
        title: sessionTopicLine(num),
        description: `${sessionOrdinalLabel(num)} · ${formatSessionDate(sd)} • ${st}`,
        meta: pastorName,
        href: "/mentor/mentoring-session",
      };
    });

  const apptRecords = (otherAppointments || []).map((a) =>
    typeof a === "object" && a ? (a as Record<string, unknown>) : {},
  );
 

  const otherMeetings: DashboardFocusItem[] = apptRecords
 
    .filter((apt) => {
  const md = appointmentMeetingDate(apt);
  if (!md) return false;

  return toEpochMs(md) >= Date.now();
})

    .sort((a, b) => toEpochMs(appointmentMeetingDate(a)) - toEpochMs(appointmentMeetingDate(b)))
    .slice(0, MAX_ITEMS_PER_SECTION)
    .map((apt) => {
      const md = appointmentMeetingDate(apt);

      const uid = String(
  apt.userId ??
    apt.pastorId ??
    apt.menteeId ??
    apt.assignedUserId ??
    (apt.user && typeof apt.user === "object" ? (apt.user as Record<string, unknown>)._id : "") ??
    (apt.pastor && typeof apt.pastor === "object" ? (apt.pastor as Record<string, unknown>)._id : "") ??
    ""
);

const directName =
  apt.user && typeof apt.user === "object"
    ? `${String((apt.user as Record<string, unknown>).firstName ?? "")} ${String(
        (apt.user as Record<string, unknown>).lastName ?? ""
      )}`.trim()
    : apt.pastor && typeof apt.pastor === "object"
      ? `${String((apt.pastor as Record<string, unknown>).firstName ?? "")} ${String(
          (apt.pastor as Record<string, unknown>).lastName ?? ""
        )}`.trim()
      : "";


const pastorName = directName || menteeNameById.get(uid) || "Pastor";
const appointmentId = String(apt.id ?? apt._id ?? "");

return {
  id: `mentor-other-meeting-${String(apt.id ?? apt._id ?? md)}`,
  title: "Upcoming meeting",
  description: `Meeting starts ${formatDateTime(md)}.`,
  meta: `${pastorName} • ${String(apt.platform ?? "")}`,
  href: appointmentId
    ? `/mentor/MentorSchedule/${encodeURIComponent(appointmentId)}`
    : "/mentor/MentorSchedule",
};
    });

  function unwrapQueriesFromResponse(res: { data?: unknown }): Record<string, unknown>[] {
    const axiosBody = res.data as { data?: unknown } | undefined;
    const body = axiosBody?.data ?? axiosBody;
    const threads = Array.isArray(body) ? body : body ? [body] : [];
    return threads.flatMap((t) => {
      if (!t || typeof t !== "object") return [];
      const q = (t as { queries?: unknown[] }).queries;
      return Array.isArray(q) ? q : [];
    }) as Record<string, unknown>[];
  }

  function resolveQueryTaskId(q: Record<string, unknown>): string {
    return String(
      q.nestedRoadMapItemId ??
        q.nestedItemId ??
        q.taskId ??
        q.roadmapItemId ??
        q.roadmapId ??
        q.roadMapId ??
        "",
    ).trim() || normalizeComparableId(q.roadmapId ?? q.roadMapId);
  }

  type QRow = DashboardFocusItem & { sortAtMs: number };
  const pastorQueryTemp: QRow[] = [];
  const seenQueryIds = new Set<string>();

  for (const m of limitedMentees) {
    const pastorId = m.id;
    const pastorName = menteeNameById.get(pastorId) ?? "Pastor";
    try {
      const rr = await apiGetRoadmapsByUser(pastorId);
      const data = Array.isArray(rr.data) ? rr.data : (rr.data as { data?: unknown })?.data;
      const roadmaps = Array.isArray(data) ? data : [];
      const slice = roadmaps.slice(0, MAX_ROADMAPS_PER_MENTEE) as { _id?: string; id?: string; name?: string }[];

      for (const rdoc of slice) {
        const rid = String(rdoc._id ?? rdoc.id ?? "");
        if (!rid) continue;
        const roadmapName = String(rdoc.name ?? "Roadmap");
        try {
          const res = await apiGetQueries(rid, pastorId, "pending", undefined, "pastor");
          const flat = unwrapQueriesFromResponse(res);

          for (const q of flat) {
            if (String(q.status) !== "pending") continue;
            const qid = String(q._id ?? q.id ?? "");
            if (!qid || seenQueryIds.has(qid)) continue;
            seenQueryIds.add(qid);
            const createdAt = String(q.createdDate ?? q.created_at ?? "");
            const taskId = resolveQueryTaskId(q);
           
            pastorQueryTemp.push({
              id: `pastor-query-${qid}`,
              title: "Pastor query",
              description: (String(q.actualQueryText ?? "").slice(0, 140) || "Query needs response.") as string,
              meta: `${roadmapName} • ${pastorName} • ${formatDateTime(createdAt)}`,
              sortAtMs: toEpochMs(createdAt),
              href: taskId
                ? `/mentor/RevitalizationRoadmap/task?userId=${encodeURIComponent(pastorId)}&roadmapId=${encodeURIComponent(rid)}&taskId=${encodeURIComponent(taskId)}`
                : "/mentor/MenteesDetailed?focus=queries",
            });
          }
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  pastorQueryTemp.sort((a, b) => b.sortAtMs - a.sortAtMs);
  const pastorQueries: DashboardFocusItem[] = pastorQueryTemp.slice(0, MAX_ITEMS_PER_SECTION).map((row) => {
    const { sortAtMs: _x, ...rest } = row;
    return rest;
  });

  type SRow = DashboardFocusItem & { sortAtMs: number };
  const surveySubmissionTemp: SRow[] = [];

  for (const m of limitedMentees) {
    const pastorId = m.id;
    const pastorName = menteeNameById.get(pastorId) ?? "Pastor";
    try {
      const res = await apiGetAssignedAssessments(pastorId);
      const list = parseAssignedAssessmentsListBody(res.data);
      for (const item of list) {
        const flat = flattenAssignedAssessmentRow(item);
        if (!flat) continue;
        const aid = flat.assessmentId;
        try {
          const ansRes = await apiGetUserAnswers(aid, pastorId);
          const raw = ansRes.data as Record<string, unknown>;
          const answers = (raw?.data ?? raw) as Record<string, unknown>;
          if (!answers || typeof answers !== "object") continue;
          const hasSections = Array.isArray(answers.sections) && answers.sections.length > 0;
          const hasPreSurvey = !!answers.preSurveySubmittedAt;
          if (!hasSections && !hasPreSurvey) continue;
          if (answers.recommendationsSentByMentor === true) continue;
          const submittedAt = String(answers.preSurveySubmittedAt ?? answers.createdAt ?? "");
          const assessmentTitle = String(
            (flat.assessment.name as string) ?? (flat.assessment.title as string) ?? "Survey submission",
          );
          surveySubmissionTemp.push({
            id: `survey-${aid}-${pastorId}`,
            title: assessmentTitle,
            description: "Survey submitted and awaiting your recommendation.",
            meta: `${pastorName} • ${formatDateTime(submittedAt)}`,
            sortAtMs: toEpochMs(submittedAt),
            href: `/mentor/MentorAssessments/${encodeURIComponent(aid)}`,
          });
        } catch {
          continue;
        }
      }
    } catch {
      continue;
    }
  }

  surveySubmissionTemp.sort((a, b) => a.sortAtMs - b.sortAtMs);
  const surveySubmissions: DashboardFocusItem[] = surveySubmissionTemp.slice(0, MAX_ITEMS_PER_SECTION).map((row) => {
    const { sortAtMs: _x, ...rest } = row;
    return rest;
  });

  return [
    {
      id: "mentorship-sessions-today",
      title: "Today",
      emptyMessage: "No mentorship sessions scheduled for today.",
      items: mentorshipProgramTodayItems,
    },
    {
      id: "mentorship-program-upcoming",
      title: "Upcoming",
      emptyMessage: "No upcoming mentorship sessions.",
      items: mentorshipProgramUpcomingItems,
    },
    {
      id: "other-meetings",
      title: "Other Meetings",
      emptyMessage: "No other meetings coming up.",
      items: otherMeetings,
    },
    {
      id: "pastor-queries",
      title: "Pastor Queries",
      emptyMessage: "No pending pastor queries right now.",
      items: pastorQueries,
    },
    {
      id: "survey-submissions",
      title: "Survey Submissions",
      emptyMessage: "No survey submissions pending review.",
      items: surveySubmissions,
    },
  ];
}
