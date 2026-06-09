"use client";

import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";


import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";
import UserProfile from "@/app/Assets/user-profile.png";
import { apiGetAssignedUsers, apiGetRoadmapSubmissionActivity } from "@/app/Services/api";
import {
  apiGetAssessments,
  apiGetAssignedAssessments,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import {
  apiGetPastorMentoringSessions,
  type MentoringSession,
} from "@/app/Services/mentoring-sessions.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  fetchMergedRoadmapsForAssignedUser,
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";
import {
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

type ReviewCenterCounts = {
  resubmittedTaskCount: number;
  todaysMeetingCount: number;
  totalRoadmapCount: number;
  assessmentWaitingCount: number;
  notStartedRoadmapCount: number;
  badgeCount: number;
};

const emptyCounts: ReviewCenterCounts = {
  resubmittedTaskCount: 0,
  todaysMeetingCount: 0,
  totalRoadmapCount: 0,
  assessmentWaitingCount: 0,
  notStartedRoadmapCount: 0,
  badgeCount: 0,
};

const getMentorFromCookie = () => {
  const cookie = Cookies.get("mentor");
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
};

function normalizeStatus(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function assignedUserId(value: unknown): string {
  if (value && typeof value === "object") {
    const row = value as { _id?: unknown; id?: unknown };
    return String(row._id ?? row.id ?? "").trim();
  }
  return String(value ?? "").trim();
}

function unwrapAssessmentsFromResponse(res: { data?: unknown }): any[] {
  const body = res.data as any;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body)) return body;
  return [];
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

function normalizeAssessmentStatus(raw: unknown): "completed" | "submitted" | "not_started" {
  const status = normalizeStatus(raw);
  if (status === "completed" || status === "reviewed") return "completed";
  if (status === "submitted" || status === "waiting_review" || status === "pending_review") {
    return "submitted";
  }
  return "not_started";
}

function hasSentRecommendations(data: any): boolean {
  if (Array.isArray(data)) {
    return data.some((rec: any) => rec?.sent === true || rec?.status === "sent");
  }
  if (Array.isArray(data?.sections)) {
    return data.sections.some(
      (section: any) =>
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

function taskKey(parentId: string, id: string) {
  return `${parentId || "roadmap"}:${id || parentId || "task"}`;
}

function roadmapTaskRows(roadmaps: any[]) {
  return roadmaps.flatMap((roadmap: any) => {
    const parentId = String(roadmap?._id ?? roadmap?.id ?? "").trim();
    const children = unwrapNestedRoadmapsArray(roadmap);
    if (children.length === 0) {
      return [{ key: taskKey(parentId, parentId), row: roadmap }];
    }
    return children.map((child: any) => ({
      key: taskKey(parentId, resolveNestedTemplateItemId(child)),
      row: child,
    }));
  });
}

function isRoadmapResubmitted(row: any): boolean {
  const status = normalizeStatus(row?.status ?? row?.submissionStatus ?? row?.reviewStatus);
  return (
    row?.isResubmitted === true ||
    row?.isResubmission === true ||
    Boolean(row?.resubmittedAt ?? row?.resubmissionAt) ||
    status === "resubmitted" ||
    status === "resubmitted_for_review" ||
    status.includes("resubmit")
  );
}

function countUnique(rows: Array<{ key: string; row: any }>, predicate: (row: any) => boolean): number {
  const keys = new Set<string>();
  rows.forEach(({ key, row }) => {
    if (key && predicate(row)) keys.add(key);
  });
  return keys.size;
}

function isToday(value?: unknown): boolean {
  if (!value) return false;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function meetingStatusAllowsTodayCount(status: unknown): boolean {
  const normalized = normalizeStatus(status);
  return normalized !== "cancelled" && normalized !== "canceled";
}

function getMentoringSessionDate(session: MentoringSession): string {
  const row = session as any;
  return String(
    session.scheduledDate ??
      row?.meetingDate ??
      row?.date ??
      row?.appointment?.meetingDate ??
      row?.appointmentDetails?.meetingDate ??
      "",
  ).trim();
}

function getMentoringSessionAppointmentId(session: MentoringSession): string {
  const row = session as any;
  return String(
    session.appointmentId ??
      row?.appointment?._id ??
      row?.appointment?.id ??
      row?.appointmentDetails?._id ??
      row?.appointmentDetails?.id ??
      "",
  ).trim();
}

async function getAssignedAssessmentRows(pastorId: string) {
  const [assignedRes, allAssessmentsRes] = await Promise.all([
    apiGetAssignedAssessments(pastorId),
    apiGetAssessments(),
  ]);

  let assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
  const allAssessments = unwrapAssessmentsFromResponse(allAssessmentsRes);
  const fallbackRows = allAssessments
    .map((assessment: any) => {
      const assignment = Array.isArray(assessment?.assignments)
        ? assessment.assignments.find((row: any) => assignedUserId(row?.userId) === pastorId)
        : null;
      if (!assignment) return null;
      return {
        assessment,
        assessmentId: assessment?._id || assessment?.id,
        assignmentId: assignment?._id,
        status: assignment?.status,
        dueDate: assignment?.dueDate,
        updatedAt: assignment?.assignedAt || assessment?.updatedAt,
      };
    })
    .filter(Boolean);

  const existingIds = new Set(
    assignedRows
      .map((item: any) => flattenAssignedAssessmentRow(item)?.assessmentId)
      .filter(Boolean),
  );
  assignedRows = [
    ...assignedRows,
    ...fallbackRows.filter((item: any) => {
      const id = String(item?.assessmentId || "");
      return id && !existingIds.has(id);
    }),
  ];

  return { assignedRows, allAssessments };
}

async function loadAssessmentCounts(pastorId: string) {
  const [{ assignedRows, allAssessments }, progressRes, appointmentsRes] = await Promise.all([
    getAssignedAssessmentRows(pastorId),
    apiGetUserProgress(pastorId),
    apiGetAppointments({ userId: pastorId, futureOnly: false } as any),
  ]);
  const progress = unwrapProgressData(progressRes);
  const progressRows = Array.isArray(progress?.assessments) ? progress.assessments : [];
  const progressByAssessmentId = new Map(
    progressRows
      .map((row: any) => ({
        assessmentId: extractAssessmentIdFromProgressRow(row),
        status: normalizeAssessmentStatus(row?.status),
      }))
      .filter((row: { assessmentId: string }) => row.assessmentId)
      .map((row: any) => [row.assessmentId, row]),
  );
  const appointmentsList = unwrapAppointmentsAxiosData(appointmentsRes);
  const appointmentById = new Map<string, any>();
  const appointmentsByAssessmentId = new Map<string, any[]>();
  appointmentsList.forEach((appt: any) => {
    const id = String(appt?._id ?? appt?.id ?? "").trim();
    if (id) appointmentById.set(id, appt);
    const metadata = appt?.metadata || appt?.meta || {};
    const linkedAssessmentId =
      String(metadata?.assessmentId ?? "").trim() ||
      String(appt?.notes ?? "").match(/assessmentId\s*[:=]\s*([^|\s,]+)/i)?.[1]?.trim() ||
      "";
    if (linkedAssessmentId) {
      const prev = appointmentsByAssessmentId.get(linkedAssessmentId) || [];
      prev.push(appt);
      appointmentsByAssessmentId.set(linkedAssessmentId, prev);
    }
  });

  const statuses = await Promise.all(
    assignedRows.map(async (item: any) => {
      const flat: any = flattenAssignedAssessmentRow(item);
      if (!flat) return null;
      const assessmentId = String(
        flat.assessment?._id ?? flat.assessment?.id ?? flat.assessmentId ?? item?.assessmentId ?? "",
      ).trim();
      if (!assessmentId) return null;
      const fullAssessment = allAssessments.find(
        (row: any) => String(row?._id ?? row?.id ?? "") === assessmentId,
      );
      const appointmentId = String(item?.appointmentId ?? flat.assessment?.appointmentId ?? "").trim();
      const apptFromId = appointmentId ? appointmentById.get(appointmentId) : null;
      const apptFromAssessment = (appointmentsByAssessmentId.get(assessmentId) || [])
        .slice()
        .sort(
          (a, b) =>
            new Date(String(b?.meetingDate ?? 0)).getTime() -
            new Date(String(a?.meetingDate ?? 0)).getTime(),
        )[0];
      const appt = apptFromId || apptFromAssessment || null;
      const hasMeetingDetails = Boolean(appt?._id ?? appt?.id ?? appointmentId ?? appt?.meetingDate);

      const storedCdp = getStoredRecommendationsForPastorAssessment(pastorId, assessmentId);
      let hasBackendCdp = false;
      try {
        const recRes = await apiGetSectionRecommendations(assessmentId, pastorId);
        const body: any = recRes.data;
        hasBackendCdp = hasSentRecommendations(body?.data ?? body);
      } catch {
        hasBackendCdp = false;
      }

      let hasSubmittedAnswers = false;
      try {
        const answersRes = await apiGetUserAnswers(assessmentId, pastorId);
        hasSubmittedAnswers = Boolean((answersRes?.data as any)?.data?._id);
      } catch {
        hasSubmittedAnswers = false;
      }

      const progressStatus =
        (progressByAssessmentId.get(assessmentId) as { status?: "completed" | "submitted" | "not_started" } | undefined)
          ?.status || normalizeAssessmentStatus(item?.status ?? flat.assessment?.status ?? fullAssessment?.status);

      if (hasMeetingDetails && (storedCdp.some((rec) => rec.sent === true) || hasBackendCdp)) {
        return "completed";
      }
      if (hasSubmittedAnswers || progressStatus === "submitted" || progressStatus === "completed") {
        return "submitted";
      }
      return "not_started";
    }),
  );

  return {
    assessmentWaitingCount: statuses.filter((status) => status === "submitted").length,
  };
}

// async function loadRoadmapCounts(pastorId: string) {
//   const roadmaps = await fetchMergedRoadmapsForAssignedUser(pastorId);
//   const rows = roadmapTaskRows(roadmaps);
//   return {
//     resubmittedTaskCount: countUnique(rows, isRoadmapResubmitted),
//   };
// }
const formatLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
  async function loadResubmittedActivityCount(pastorId: string) {
  const today = formatLocalDate(new Date());

  const res = await apiGetRoadmapSubmissionActivity(
    pastorId,
    today,
    today,
  );

  const rows = Array.isArray(res.data?.data) ? res.data.data : [];

  return rows.filter((activity: any) => activity?.isResubmission === true).length;
}
async function loadRoadmapCounts(pastorId: string) {
  const roadmaps = await fetchMergedRoadmapsForAssignedUser(pastorId);
  const rows = roadmapTaskRows(roadmaps);

  // return {
  //   resubmittedTaskCount: countUnique(rows, isRoadmapResubmitted),
  //   notStartedRoadmapCount: countUnique(rows, (row) => {
  //     const status = normalizeStatus(row?.status ?? row?.submissionStatus ?? row?.reviewStatus);
  //     return status === "not_started" || status === "notstarted" || status === "";
  //   }),
  // };
  return {
  resubmittedTaskCount: await loadResubmittedActivityCount(pastorId),
  totalRoadmapCount: rows.length,
  notStartedRoadmapCount: countUnique(rows, (row) => {
    const status = normalizeStatus(row?.status ?? row?.submissionStatus ?? row?.reviewStatus);
    return status === "not_started" || status === "notstarted" || status === "";
  }),
};
}

async function loadTodaysMeetingCount(pastorId: string) {
  const [appointmentsRes, sessionsRes] = await Promise.all([
    apiGetAppointments({ userId: pastorId, futureOnly: false } as any),
    apiGetPastorMentoringSessions(pastorId),
  ]);
  const seen = new Set<string>();

  unwrapAppointmentsAxiosData(appointmentsRes).forEach((appointment: any, index: number) => {
    if (!isToday(appointment?.meetingDate) || !meetingStatusAllowsTodayCount(appointment?.status)) return;
    const id = String(appointment?._id ?? appointment?.id ?? "").trim();
    seen.add(id ? `appointment:${id}` : `appointment-date:${appointment?.meetingDate ?? index}`);
  });

  const sessionBody: any = sessionsRes.data as any;
  const sessions: MentoringSession[] = Array.isArray(sessionBody?.data)
    ? sessionBody.data
    : Array.isArray(sessionBody)
      ? sessionBody
      : [];

  sessions.forEach((session, index) => {
    if (!isToday(getMentoringSessionDate(session))) return;
    const status = normalizeStatus(session.status);
    if (status && status !== "scheduled" && status !== "in_progress") return;

    const appointmentId = getMentoringSessionAppointmentId(session);
    if (appointmentId && seen.has(`appointment:${appointmentId}`)) return;
    const sessionId = String((session as any)?._id ?? (session as any)?.sessionId ?? session.id ?? "").trim();
    seen.add(
      sessionId
        ? `session:${sessionId}`
        : `session-date:${getMentoringSessionDate(session)}:${index}`,
    );
  });

  return seen.size;
}

async function loadPastorReviewCounts(pastorId: string): Promise<ReviewCenterCounts> {
  try {
    const [assessmentCounts, roadmapCounts, todaysMeetingCount] = await Promise.all([
      loadAssessmentCounts(pastorId),
      loadRoadmapCounts(pastorId),
      loadTodaysMeetingCount(pastorId),
    ]);
    // const badgeCount =
    //   roadmapCounts.resubmittedTaskCount +
    //   todaysMeetingCount +
    //   assessmentCounts.assessmentWaitingCount;
    const badgeCount =
  roadmapCounts.resubmittedTaskCount +
  roadmapCounts.notStartedRoadmapCount;
    // return {
    //   resubmittedTaskCount: roadmapCounts.resubmittedTaskCount,
    //   todaysMeetingCount,
    //   assessmentWaitingCount: assessmentCounts.assessmentWaitingCount,
    //   badgeCount,
    // };
    return {
  resubmittedTaskCount: roadmapCounts.resubmittedTaskCount,
  notStartedRoadmapCount: roadmapCounts.notStartedRoadmapCount,
  todaysMeetingCount,
  assessmentWaitingCount: assessmentCounts.assessmentWaitingCount,
  totalRoadmapCount: roadmapCounts.totalRoadmapCount,
  badgeCount,
};
  } catch (error) {
    console.warn("Failed to load review center counts", { pastorId, error });
    return emptyCounts;
  }
}

export default function MentorReviewCenterPage() {
  const [mentees, setMentees] = useState<any[]>([]);
  const [countsByPastorId, setCountsByPastorId] = useState<Record<string, ReviewCenterCounts>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;

    if (!mentorId) {
      setMentees([]);
      setCountsByPastorId({});
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        const res = await apiGetAssignedUsers(String(mentorId));
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : [];
        if (cancelled) return;
        setMentees(list);
        setLoading(false);
        const countEntries = await Promise.all(
          list.map(async (mentee: any) => {
            const id = String(mentee?._id ?? mentee?.id ?? "").trim();
            if (!id) return null;
            const counts = await loadPastorReviewCounts(id);
            return [id, counts] as const;
          }),
        );
        if (cancelled) return;
        const nextCounts: Record<string, ReviewCenterCounts> = {};
        countEntries.forEach((entry) => {
          if (entry) nextCounts[entry[0]] = entry[1];
        });
        setCountsByPastorId(nextCounts);
      } catch (error) {
        console.error("Failed to load assigned mentees", error);
        if (!cancelled) {
          setMentees([]);
          setCountsByPastorId({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, []);
const filteredMentees = useMemo(() => {
  const query = search.trim().toLowerCase();

  if (!query) return mentees;

  return mentees.filter((mentee) => {
    const name =
      `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
      mentee.name ||
      "";

    return name.toLowerCase().includes(query);
  });
}, [mentees, search]);
  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/mentor/home"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </Link>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <i className="fa-regular fa-clipboard text-sm text-[#8ec5eb]" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white">
              Review Center
            </h1>
            <p className="mt-0.5 text-xs text-[#cde2f2]/65">
              {loading ? "Loading..." : `${mentees.length} pastor${mentees.length === 1 ? "" : "s"} assigned to you`}
            </p>
          </div>
        </div>

        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#cde2f2]/65">
          Your Pastors
        </p>
<div className="relative mb-4">
  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8ec5eb]" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search pastor by name..."
    className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-9 pr-3 text-sm font-medium text-white outline-none placeholder:text-[#cde2f2]/45 focus:border-[#8ec5eb]/50 focus:bg-white/[0.08]"
  />
</div>
        {loading ? (
          <div className="flex justify-center py-14">
            <div className={mentorSpinner} />
          </div>
        ) : filteredMentees.length === 0 ? (
          <div className={`p-6 text-center ${mentorGlassCardFrost}`}>
            <i className="fa-regular fa-user mb-3 text-3xl text-white/25" />
            <p className="text-sm font-semibold text-white">No assigned pastors</p>
            <p className="mt-1 text-xs text-[#cde2f2]/60">
              Assigned pastors will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMentees.map((mentee) => {
              const id = String(mentee._id ?? mentee.id ?? "");
              const counts = countsByPastorId[id] ?? emptyCounts;
              const name =
                `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
                mentee.name ||
                "Pastor";

              return (
                <Link
                  key={id || name}
                  href={`/mentor/review-center/${encodeURIComponent(id)}`}
                  // className={`flex min-h[76px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1] ${mentorGlassCardFrost}`}
                  className={`flex min-h-[76px] items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1] ${mentorGlassCardFrost}`}
                >
                  <Image
                    src={mentee.profilePicture || UserProfile}
                    alt={name}
                    width={44}
                    height={44}
                    unoptimized={Boolean(mentee.profilePicture)}
                    className="h-11 w-11 rounded-full border border-white/20 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">
                        {name}
                      </p>

                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                        {counts.badgeCount}
                      </span>
                    </div>

                    {/* <p className="mt-0.5 truncate text-xs text-[#cde2f2]/65">
{counts.resubmittedTaskCount} resubmitted roadmap · {counts.totalRoadmapCount} roadmaps assigned · {counts.notStartedRoadmapCount} not started
                    </p> */}
                    <p className="mt-0.5 line-clamp-2 pr-4 text-[11px] leading-snug text-[#cde2f2]/65 sm:text-xs">
  {counts.resubmittedTaskCount} resubmitted roadmap · {counts.totalRoadmapCount} roadmaps assigned · {counts.notStartedRoadmapCount} not started
</p>
                  </div>

                  <i className="fa-solid fa-chevron-right text-xs text-[#cde2f2]/55" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
