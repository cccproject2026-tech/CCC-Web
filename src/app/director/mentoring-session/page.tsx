"use client";

import { useEffect, useMemo, useState } from "react";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
} from "@/app/director/directorUi";
import { apiGetAllUsers } from "@/app/Services/api";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { apiGetMentorshipSessionsNormalized } from "@/app/Services/roadmaps.service";

type SessionStatus = "scheduled" | "completed" | "cancelled" | "missed";
type JourneyStatus = "scheduled" | "completed" | "missed" | "in-progress";
type TabKey = "sessions" | "mentors" | "pastors";

type DirectorMentor = {
  id: string;
  name: string;
  email: string;
  phone: string;
  region: string;
  assignedPastorIds: string[];
};

type DirectorPastor = {
  id: string;
  name: string;
  email: string;
  church: string;
  city: string;
  mentorId: string;
};

type DirectorSession = {
  id: string;
  sessionNumber: number;
  title: string;
  pastorId: string;
  mentorId: string;
  status: SessionStatus;
  meetingDate: string;
  platform: string;
  meetingLink?: string;
  summary: string;
  aiTranscript?: string;
};

type PastorJourney = {
  pastor: DirectorPastor;
  mentor: DirectorMentor | null;
  sessions: DirectorSession[];
  currentSessionNumber: number;
  currentSessionTitle: string;
  nextMeetingDate: string;
  status: JourneyStatus;
  completedCount: number;
  progressPercent: number;
};

const tabs: { key: TabKey; label: string }[] = [
  { key: "sessions", label: "Mentorship Sessions" },
  { key: "mentors", label: "Mentors" },
  { key: "pastors", label: "Pastors Mentoring Sessions" },
];

const statusFilters: ("all" | JourneyStatus)[] = ["all", "scheduled", "completed", "missed", "in-progress"];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function statusBadgeClass(status: SessionStatus) {
  if (status === "completed") return "border-emerald-300/25 bg-emerald-500/15 text-emerald-100";
  if (status === "scheduled") return "border-[#8ec5eb]/30 bg-[#8ec5eb]/15 text-[#d9ebf8]";
  if (status === "missed") return "border-amber-300/30 bg-amber-500/15 text-amber-100";
  return "border-rose-300/30 bg-rose-500/15 text-rose-100";
}

function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(status)}`}>
      {status}
    </span>
  );
}

function journeyStatusBadgeClass(status: JourneyStatus) {
  if (status === "completed") return "border-emerald-300/25 bg-emerald-500/15 text-emerald-100";
  if (status === "scheduled") return "border-[#8ec5eb]/30 bg-[#8ec5eb]/15 text-[#d9ebf8]";
  if (status === "missed") return "border-amber-300/30 bg-amber-500/15 text-amber-100";
  return "border-white/15 bg-white/10 text-white/75";
}

function journeyStatusLabel(status: JourneyStatus) {
  return status === "in-progress" ? "In Progress" : status.charAt(0).toUpperCase() + status.slice(1);
}

function JourneyStatusBadge({ status }: { status: JourneyStatus }) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${journeyStatusBadgeClass(status)}`}>
      {journeyStatusLabel(status)}
    </span>
  );
}

function getStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function getUserId(user: any): string {
  return getStringValue(user?._id, user?.id, user?.userId);
}

function getUserName(user: any, fallback: string): string {
  return getStringValue(
    user?.name,
    user?.fullName,
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim(),
    user?.email,
    fallback,
  );
}

function unwrapUsersList(response: any): any[] {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(response?.data?.users)) return response.data.users;
  return [];
}

function unwrapAppointmentsList(response: any): any[] {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.appointments)) return data.appointments;
  if (Array.isArray(response?.data?.appointments)) return response.data.appointments;
  return [];
}

function getRefId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return getStringValue((value as any)._id, (value as any).id);
  return "";
}

function normalizeStatus(value: unknown, dateValue?: string): SessionStatus {
  const status = String(value || "").toLowerCase();
  if (status.includes("complete")) return "completed";
  if (status.includes("cancel")) return "cancelled";
  if (status.includes("miss")) return "missed";
  if (dateValue && new Date(dateValue).getTime() < Date.now() && status === "scheduled") return "missed";
  return "scheduled";
}

function normalizeMentor(user: any): DirectorMentor {
  const id = getUserId(user);
  return {
    id,
    name: getUserName(user, "Mentor"),
    email: getStringValue(user?.email),
    phone: getStringValue(user?.phone, user?.phoneNumber, user?.mobile),
    region: getStringValue(user?.region, user?.state, user?.city, user?.location, "Region not added"),
    assignedPastorIds: [],
  };
}

function normalizePastor(user: any): DirectorPastor {
  const id = getUserId(user);
  const mentorId = getRefId(user?.mentorId) || getRefId(user?.assignedMentor) || getRefId(user?.mentor);
  return {
    id,
    name: getUserName(user, "Pastor"),
    email: getStringValue(user?.email),
    church: getStringValue(user?.churchName, user?.church, user?.organization, "Church not added"),
    city: getStringValue(user?.city, user?.location, user?.state, "Location not added"),
    mentorId,
  };
}

function normalizeAppointmentSession(appt: any, index: number): DirectorSession {
  const meetingDate = getStringValue(appt?.meetingDate, appt?.date, appt?.scheduledAt, appt?.startTime, new Date().toISOString());
  const pastorId = getRefId(appt?.userId) || getRefId(appt?.user) || getRefId(appt?.pastorId) || getRefId(appt?.pastor);
  const mentorId = getRefId(appt?.mentorId) || getRefId(appt?.mentor);
  return {
    id: getStringValue(appt?._id, appt?.id, `appointment-${index + 1}`),
    sessionNumber: Number(appt?.sessionNumber || appt?.sessionNo || index + 1),
    title: getStringValue(appt?.title, appt?.notes, `Mentoring Session ${index + 1}`),
    pastorId,
    mentorId,
    status: normalizeStatus(appt?.status, meetingDate),
    meetingDate,
    platform: getStringValue(appt?.platform, appt?.meetingPlatform, "Platform not added"),
    meetingLink: getStringValue(appt?.meetingLink, appt?.joinUrl, appt?.link, appt?.zoomJoinUrl),
    summary: getStringValue(appt?.summary, appt?.notes, "Appointment session loaded from existing appointments API."),
    aiTranscript: getStringValue(appt?.aiTranscript, appt?.transcriptSummary),
  };
}

function normalizeMentorshipSession(session: any, pastor: DirectorPastor, index: number): DirectorSession {
  const meetingDate = getStringValue(session?.scheduledDate, session?.meetingDate, session?.date, session?.createdAt, new Date().toISOString());
  return {
    id: getStringValue(session?.id, session?._id, `session-${pastor.id}-${index + 1}`),
    sessionNumber: Number(session?.sessionNumber || session?.sessionNo || index + 1),
    title: getStringValue(session?.title, session?.mentorNote, `Mentoring Session ${index + 1}`),
    pastorId: pastor.id,
    mentorId: getRefId(session?.mentorId) || pastor.mentorId,
    status: normalizeStatus(session?.status, meetingDate),
    meetingDate,
    platform: getStringValue(session?.platform, session?.meetingPlatform, session?.appointment?.platform, "Platform not added"),
    meetingLink: getStringValue(session?.meetingLink, session?.joinUrl, session?.appointment?.meetingLink, session?.appointment?.zoomJoinUrl),
    summary: getStringValue(session?.summary, session?.mentorNote, session?.pastorNote, "Mentorship session loaded from existing roadmap sessions API."),
    aiTranscript: getStringValue(session?.aiTranscript, session?.transcriptSummary, session?.mentorshipInsights),
  };
}

function buildTemporarySessionsFromRealPeople(pastorRows: DirectorPastor[], mentorRows: DirectorMentor[]): DirectorSession[] {
  // TODO: Replace this fallback when backend provides a director/all mentorship sessions endpoint.
  return pastorRows.slice(0, 8).map((pastor, index) => {
    const mentor = mentorRows.find((item) => item.id === pastor.mentorId) || mentorRows[index % Math.max(mentorRows.length, 1)];
    return {
      id: `temporary-session-${pastor.id || index}`,
      sessionNumber: (index % 4) + 1,
      title: `Mentoring Session ${(index % 4) + 1}`,
      pastorId: pastor.id,
      mentorId: mentor?.id || pastor.mentorId,
      status: index % 3 === 0 ? "completed" : "scheduled",
      meetingDate: new Date(Date.now() + (index + 1) * 86_400_000).toISOString(),
      platform: "Platform not added",
      summary: "Temporary frontend-only session row using real pastor and mentor names.",
    };
  });
}

export default function DirectorMentoringSessionPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("sessions");
  const [sessionSearch, setSessionSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | JourneyStatus>("all");
  const [mentorSearch, setMentorSearch] = useState("");
  const [assignedPastorSearch, setAssignedPastorSearch] = useState("");
  const [pastorSearch, setPastorSearch] = useState("");
  const [pastorSessionSearch, setPastorSessionSearch] = useState("");
  const [mentors, setMentors] = useState<DirectorMentor[]>([]);
  const [pastors, setPastors] = useState<DirectorPastor[]>([]);
  const [sessions, setSessions] = useState<DirectorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usedSessionFallback, setUsedSessionFallback] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState("");
  const [selectedPastorId, setSelectedPastorId] = useState("");
  const [modalSession, setModalSession] = useState<DirectorSession | null>(null);
  const [modalJourney, setModalJourney] = useState<PastorJourney | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError(null);
      setUsedSessionFallback(false);

      try {
        const [mentorRes, pastorRes, appointmentsRes] = await Promise.all([
          apiGetAllUsers({ role: "mentor", roleMatch: "mixed", limit: 9999 }),
          apiGetAllUsers({ role: "pastor", roleMatch: "mixed", limit: 9999 }),
          apiGetAppointments({ futureOnly: false }),
        ]);

        const mentorRows = unwrapUsersList(mentorRes).map(normalizeMentor).filter((mentor) => mentor.id);
        let pastorRows = unwrapUsersList(pastorRes).map(normalizePastor).filter((pastor) => pastor.id);

        const assignedPairs = await Promise.allSettled(
          mentorRows.map(async (mentor) => {
            const assignedRes = await apiGetAssignedUsers(mentor.id);
            const assignedIds = unwrapUsersList(assignedRes)
              .map((user) => getUserId(user))
              .filter(Boolean);
            return { mentorId: mentor.id, assignedPastorIds: assignedIds };
          }),
        );

        const mentorRowsWithAssignments = mentorRows.map((mentor) => {
          const match = assignedPairs.find((result) => {
            return result.status === "fulfilled" && result.value.mentorId === mentor.id;
          });
          const assignedPastorIds =
            match && match.status === "fulfilled" ? match.value.assignedPastorIds : [];
          return { ...mentor, assignedPastorIds };
        });

        pastorRows = pastorRows.map((pastor) => {
          if (pastor.mentorId) return pastor;
          const assignedMentor = mentorRowsWithAssignments.find((mentor) => mentor.assignedPastorIds.includes(pastor.id));
          return assignedMentor ? { ...pastor, mentorId: assignedMentor.id } : pastor;
        });

        let sessionRows: DirectorSession[] = [];
        try {
          // TODO: Replace this fan-out when backend provides GET mentoring sessions by director/all.
          const perPastorResults = await Promise.allSettled(
            pastorRows.map(async (pastor) => {
              const rows = await apiGetMentorshipSessionsNormalized(pastor.id);
              return rows.map((row, index) => normalizeMentorshipSession(row, pastor, index));
            }),
          );
          sessionRows = perPastorResults.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
        } catch {
          sessionRows = [];
        }

        if (sessionRows.length === 0) {
          const appointmentRows = unwrapAppointmentsList(appointmentsRes).map(normalizeAppointmentSession);
          sessionRows = appointmentRows.filter((session) => session.pastorId || session.mentorId);
        }

        if (cancelled) return;
        if (sessionRows.length === 0) {
          setUsedSessionFallback(true);
          sessionRows = buildTemporarySessionsFromRealPeople(pastorRows, mentorRowsWithAssignments);
        }
        setMentors(mentorRowsWithAssignments);
        setPastors(pastorRows);
        setSessions(sessionRows);
        setSelectedMentorId((prev) => prev || mentorRowsWithAssignments[0]?.id || "");
        setSelectedPastorId((prev) => prev || pastorRows[0]?.id || "");
      } catch (error) {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Failed to load director mentoring session data.");
        setMentors([]);
        setPastors([]);
        setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mentorById = useMemo(() => new Map(mentors.map((mentor) => [mentor.id, mentor])), [mentors]);
  const pastorById = useMemo(() => new Map(pastors.map((pastor) => [pastor.id, pastor])), [pastors]);

  const journeys = useMemo<PastorJourney[]>(() => {
    const sessionsByPastorId = sessions.reduce((groups, session) => {
      if (!session.pastorId) return groups;
      const pastorSessions = groups.get(session.pastorId) || [];
      pastorSessions.push(session);
      groups.set(session.pastorId, pastorSessions);
      return groups;
    }, new Map<string, DirectorSession[]>());
    const journeyPastors = pastors.filter((pastor) => sessionsByPastorId.has(pastor.id));

    return journeyPastors.map((pastor) => {
      const pastorSessions = (sessionsByPastorId.get(pastor.id) || [])
        .sort((a, b) => {
          if (a.sessionNumber !== b.sessionNumber) return a.sessionNumber - b.sessionNumber;
          return new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime();
        });
    //   const completedCount = pastorSessions.filter((session) => session.status === "completed").length;
    //   const currentSessionNumber = Math.min(completedCount + 1, 10);
    //   const currentSession =
    //     pastorSessions.find((session) => session.sessionNumber === currentSessionNumber && session.status !== "completed") ||
    //     pastorSessions.find((session) => session.status !== "completed");
    //   const latestSession = pastorSessions[pastorSessions.length - 1];
    //   const displaySession = currentSession || (completedCount >= 10 ? latestSession : undefined);
    //   const mentor = mentorById.get(pastor.mentorId) || mentorById.get(displaySession?.mentorId || "") || null;
    const normalizeJourneyStatus = (value: unknown) =>
  String(value || "").toLowerCase();

const completedCount = pastorSessions.filter(
  (session) => normalizeJourneyStatus(session.status) === "completed"
).length;

const sortedSessions = [...pastorSessions].sort(
  (a, b) => (a.sessionNumber || 0) - (b.sessionNumber || 0)
);
console.log(
  "PASTOR SESSIONS RAW",
  pastor.name,
  sortedSessions
);
const activeJourneySession =
  sortedSessions.find(
    (session) =>
      normalizeJourneyStatus(session.status) !== "completed"
  ) || sortedSessions[sortedSessions.length - 1];

// const currentSessionNumber =
//   activeJourneySession?.sessionNumber || 1;

// const currentSession = activeJourneySession;
const currentSession =
  sortedSessions.find((session) => {
    const status = normalizeJourneyStatus(session.status);
    return status === "missed" || status === "scheduled";
  }) ||
  sortedSessions.find(
    (session) =>
      normalizeJourneyStatus(session.status) !== "completed"
  ) ||
  sortedSessions[sortedSessions.length - 1];

const currentSessionNumber =
  currentSession?.sessionNumber || 1;
  console.log(
  "Journey Debug",
  pastor.name,
  sortedSessions.map((s) => ({
    session: s.sessionNumber,
    status: s.status,
  })),
  "CURRENT:",
  currentSession?.sessionNumber,
  currentSession?.status
);

const latestSession =
  sortedSessions[sortedSessions.length - 1];

const displaySession =
  currentSession ||
  (completedCount >= 10 ? latestSession : undefined);

const mentor =
  mentorById.get(pastor.mentorId) ||
  mentorById.get(displaySession?.mentorId || "") ||
  null;
    //   const status: JourneyStatus =
    //     completedCount >= 10
    //       ? "completed"
    //       : pastorSessions.some((session) => session.status !== "completed" && session.status === "missed")
    //         ? "missed"
    //         : currentSession?.status === "scheduled"
    //           ? "scheduled"
    //           : "in-progress";
//     const normalizeStatus = (value: unknown) =>
//   String(value || "").toLowerCase();

// const currentStatus = normalizeStatus(currentSession?.status);
// const latestStatus = normalizeStatus(latestSession?.status);

// const status: JourneyStatus =
//   completedCount >= 10
//     ? "completed"
//     : currentStatus === "missed" || latestStatus === "missed"
//       ? "missed"
//       : currentStatus === "scheduled"
//         ? "scheduled"
//         : "in-progress";
const activeStatus = normalizeJourneyStatus(
  activeJourneySession?.status
);

const status: JourneyStatus =
  completedCount >= 10
    ? "completed"
    : activeStatus === "missed"
      ? "missed"
      : activeStatus === "scheduled"
        ? "scheduled"
        : "in-progress";

      return {
        pastor,
        mentor,
        sessions: pastorSessions,
        currentSessionNumber,
        currentSessionTitle: displaySession?.title || `Session ${currentSessionNumber}`,
        nextMeetingDate: currentSession?.meetingDate || (completedCount >= 10 ? latestSession?.meetingDate || "" : ""),
        status,
        completedCount,
        progressPercent: Math.min(Math.round((completedCount / 10) * 100), 100),
      };
    });
  }, [mentorById, pastors, sessions]);

  const filteredJourneys = useMemo(() => {
    const q = sessionSearch.trim().toLowerCase();
    return journeys.filter((journey) => {
      const matchesStatus = statusFilter === "all" || journey.status === statusFilter;
      const matchesSearch =
        !q ||
        journey.pastor.name.toLowerCase().includes(q) ||
        Boolean(journey.mentor?.name.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [journeys, sessionSearch, statusFilter]);

  const filteredMentors = useMemo(() => {
    const q = mentorSearch.trim().toLowerCase();
    return mentors.filter((mentor) => !q || mentor.name.toLowerCase().includes(q));
  }, [mentorSearch, mentors]);

  const filteredPastors = useMemo(() => {
    const q = pastorSearch.trim().toLowerCase();
    return pastors.filter((pastor) => !q || pastor.name.toLowerCase().includes(q));
  }, [pastorSearch, pastors]);

  const selectedMentor = mentorById.get(selectedMentorId) || mentors[0] || null;
  const selectedPastor = pastorById.get(selectedPastorId) || pastors[0] || null;
  const selectedMentorPastors = pastors.filter(
    (pastor) =>
      Boolean(selectedMentor) &&
      (selectedMentor.assignedPastorIds.includes(pastor.id) || pastor.mentorId === selectedMentor.id),
  );
  const selectedMentorJourneys = selectedMentorPastors.map((pastor) => {
    const journey = journeys.find((item) => item.pastor.id === pastor.id);
    if (journey) return journey;
    return {
      pastor,
      mentor: selectedMentor,
      sessions: [],
      currentSessionNumber: 1,
      currentSessionTitle: "Session 1",
      nextMeetingDate: "",
      status: "in-progress" as JourneyStatus,
      completedCount: 0,
      progressPercent: 0,
    };
  });
  const filteredSelectedMentorJourneys = selectedMentorJourneys.filter((journey) => {
  const q = assignedPastorSearch.trim().toLowerCase();
  return (
    !q ||
    journey.pastor.name.toLowerCase().includes(q) ||
    journey.pastor.church.toLowerCase().includes(q) ||
    journey.pastor.email.toLowerCase().includes(q)
  );
});
  const selectedPastorSessions = sessions.filter((session) => session.pastorId === selectedPastor?.id);
const filteredSelectedPastorSessions = selectedPastorSessions.filter((session) => {
  const q = pastorSessionSearch.trim().toLowerCase();
  return !q || session.title.toLowerCase().includes(q);
});
  const analytics = [
    { label: "Total Journeys", value: journeys.length, note: usedSessionFallback ? "Temporary session rows" : "Real frontend API data" },
    { label: "Scheduled", value: journeys.filter((journey) => journey.status === "scheduled").length, note: "Current/next session scheduled" },
    { label: "Completed", value: journeys.filter((journey) => journey.status === "completed").length, note: "10 sessions completed" },
    { label: "Missed", value: journeys.filter((journey) => journey.status === "missed").length, note: "Needs follow-up" },
  ];

  const completionRate = journeys.length
    ? Math.round((journeys.filter((journey) => journey.status === "completed").length / journeys.length) * 100)
    : 0;
  const busiestMentor = useMemo(() => {
    return mentors
      .map((mentor) => ({
        mentor,
        count: sessions.filter((session) => session.mentorId === mentor.id).length,
      }))
      .sort((a, b) => b.count - a.count)[0];
  }, [mentors, sessions]);

  const renderSessionList = (items: DirectorSession[]) => (
    <div className="space-y-3">
      {items.length ? (
        items.map((session) => {
          const mentor = mentorById.get(session.mentorId);
          const pastor = pastorById.get(session.pastorId);
          return (
            <button
              key={`${session.id}-${session.pastorId}-${session.mentorId}-${session.sessionNumber}`}
              type="button"
              onClick={() => setModalSession(session)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-[#8ec5eb]/35 hover:bg-white/[0.07]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white">{session.title}</p>
                  <p className="mt-1 text-xs text-white/55">
                    {pastor?.name || "Pastor"} with {mentor?.name || "Mentor"}
                  </p>
                  <p className="mt-2 text-xs text-white/45">{formatDateTime(session.meetingDate)}</p>
                </div>
                <StatusBadge status={session.status} />
              </div>
            </button>
          );
        })
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
          No sessions found.
        </div>
      )}
    </div>
  );

  const handleMentorSelect = (mentor: DirectorMentor) => {
    setSelectedMentorId(mentor.id);
    if (mentor.assignedPastorIds.length) setSelectedPastorId(mentor.assignedPastorIds[0]);
  };

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentoring Sessions"
        subtitle="Read-only director view for mentor-pastor session activity."
      />

      <main className={`${directorPageContainer} space-y-6 px-4 pb-10 sm:px-6 lg:px-10`}>
        {loading ? (
          <section className={`${directorGlassCard} p-6 text-sm text-white/65`}>
            Loading mentors, pastors, assignments, appointments, and available mentorship sessions...
          </section>
        ) : null}

        {loadError ? (
          <section className={`${directorGlassCard} border-red-400/25 bg-red-500/10 p-6 text-sm text-red-100`}>
            {loadError}
          </section>
        ) : null}

        {usedSessionFallback ? (
          <section className={`${directorGlassCard} border-amber-300/25 bg-amber-500/10 p-4 text-sm text-amber-100`}>
            TODO: Backend needs a director/all mentoring sessions API. Temporary rows below use real mentor and pastor names.
          </section>
        ) : null}

        <section className={`${directorGlassCard} p-2`}>
          <div className="grid gap-2 md:grid-cols-3">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab.key
                    ? "border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 text-white"
                    : "border border-transparent text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "sessions" ? (
          <>
            {/* <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {analytics.map((card) => (
                <div key={card.label} className={`${directorGlassCard} p-5`}>
                  <p className="text-sm text-white/60">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                  <p className="mt-1 text-xs text-white/45">{card.note}</p>
                </div>
              ))}
            </section> */}

           <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px]">
              <div className={`${directorGlassCard} overflow-hidden`}>
                <div className="border-b border-white/10 p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-white">Pastor Mentorship Journeys</h2>
                      <p className="mt-1 text-sm text-white/55">One row per pastor journey with read-only session history.</p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative">
                        <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/75" />
                        <input
                          value={sessionSearch}
                          onChange={(event) => setSessionSearch(event.target.value)}
                          placeholder="Search pastor or mentor"
                          className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50 sm:w-72"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as "all" | JourneyStatus)}
                        className="rounded-lg border border-white/20 bg-[#0b3658] px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ec5eb]/50"
                      >
                        {statusFilters.map((status) => (
                          <option key={status} value={status}>
                            {status === "all" ? "All statuses" : journeyStatusLabel(status)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="custom-scrollbar overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead className="border-b border-white/10 bg-white/[0.04] text-xs uppercase text-white/50">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Pastor</th>
                        <th className="px-5 py-4 font-semibold">Mentor</th>
                        <th className="px-5 py-4 font-semibold">Current Session</th>
                        <th className="px-5 py-4 font-semibold">Next Date</th>
                        <th className="px-5 py-4 font-semibold">Journey Status</th>
                        <th className="px-5 py-4 font-semibold">Progress</th>
                        {/* <th className="px-5 py-4 font-semibold">View</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {filteredJourneys.map((journey) => (
                        <tr
  key={journey.pastor.id}
  onClick={() => setModalJourney(journey)}
  className="cursor-pointer transition hover:bg-white/[0.04]"
>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{journey.pastor.name}</p>
                            <p className="mt-1 text-xs text-white/45">{journey.pastor.church}</p>
                          </td>
                          <td className="px-5 py-4 text-white/75">
                            {journey.mentor?.name || "Assigned mentor not found"}
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">Session {journey.currentSessionNumber} of 10</p>
                            <p className="mt-1 text-xs text-white/45">{journey.currentSessionTitle}</p>
                          </td>
                          <td className="px-5 py-4 text-white/65">
                            {journey.nextMeetingDate ? formatDateTime(journey.nextMeetingDate) : "Not scheduled"}
                          </td>
                          <td className="px-5 py-4"><JourneyStatusBadge status={journey.status} /></td>
                          <td className="px-5 py-4">
                            <p className="text-xs font-semibold text-white">{journey.completedCount}/10 completed</p>
                            <div className="mt-2 h-2 w-28 rounded-full bg-white/10">
                              <div
                                className="h-2 rounded-full bg-[#8ec5eb]"
                                style={{ width: `${journey.progressPercent}%` }}
                              />
                            </div>
                          </td>
                          {/* <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => setModalJourney(journey)}
                              className="rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-[#d9ebf8] hover:bg-white/15"
                            >
                              Read-only
                            </button>
                          </td> */}
                        </tr>
                      ))}
                      {filteredJourneys.length === 0 ? (
                        <tr>
                          <td className="px-5 py-8 text-center text-sm text-white/55" colSpan={6}>
                            No pastor mentorship journeys found.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className={`${directorGlassCard} p-3`}>
                <h2 className="text-lg font-semibold text-white">Insights</h2>
                <div className="mt-4 space-y-3">
                  {/* <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm text-white/55">Completion Rate</p>
                    <p className="mt-2 text-3xl font-bold text-white">{completionRate}%</p>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-[#8ec5eb]" style={{ width: `${completionRate}%` }} />
                    </div>
                  </div> */}
                  <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-3">
                    <p className="text-sm font-semibold text-amber-100">Follow-up needed</p>
                    <p className="mt-1 text-sm text-white/60">Missed and cancelled sessions should be rescheduled by mentors.</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                    <p className="text-sm font-semibold text-white">Busiest mentor</p>
                    <p className="mt-1 text-sm text-white/60">
                      {busiestMentor?.mentor.name
                        ? `${busiestMentor.mentor.name} has ${busiestMentor.count} current session records.`
                        : "No mentor session records loaded yet."}
                    </p>
                  </div>
                </div>
              </aside>
            </section>
          </>
        ) : null}

        {activeTab === "mentors" ? (
          <section className="space-y-6">
            <div className={`${directorGlassCard} p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Mentors</h2>
                  <p className="mt-1 text-sm text-white/55">Select a mentor to view assigned pastors.</p>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/75" />
                  <input
                    value={mentorSearch}
                    onChange={(event) => setMentorSearch(event.target.value)}
                    placeholder="Search mentor name"
                    className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50 sm:w-72"
                  />
                </div>
              </div>
              <div className="custom-scrollbar mt-5 max-h-[420px] overflow-y-auto pr-2">
  <div className="grid gap-4 md:grid-cols-2">
    {filteredMentors.map((mentor) => (
                  <button
                    key={mentor.id}
                    type="button"
                    onClick={() => handleMentorSelect(mentor)}
                    className={`rounded-2xl border p-5 text-left transition ${
                      selectedMentorId === mentor.id
                        ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/15"
                        : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#8ec5eb]/30 bg-[#8ec5eb]/15 font-bold text-[#d9ebf8]">
                        {initials(mentor.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{mentor.name}</p>
                        <p className="truncate text-xs text-white/55">{mentor.email}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{mentor.region}</span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        {mentor.assignedPastorIds.length} pastors
                      </span>
                    </div>
                  </button>
                    ))}
  </div>
</div>
            </div>

            <div className={`${directorGlassCard} p-5`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Assigned Pastors</h2>
                  <p className="mt-1 text-sm text-white/55">
                    {selectedMentor?.name ? `${selectedMentor.name}'s assigned pastor journeys` : "Select a mentor"}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
  <p className="text-sm text-white/45">
    {filteredSelectedMentorJourneys.length} of {selectedMentorJourneys.length} pastors
  </p>

  <div className="relative w-full sm:w-80">
    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/75" />
    <input
      value={assignedPastorSearch}
      onChange={(event) => setAssignedPastorSearch(event.target.value)}
      placeholder="Search assigned pastor"
      className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50"
    />
  </div>
</div>
              </div>

              {filteredSelectedMentorJourneys.length ? (
  <div className="custom-scrollbar mt-5 max-h-[520px] overflow-y-auto pr-2">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredSelectedMentorJourneys.map((journey) => (
                    <button
                      key={journey.pastor.id}
                      type="button"
                      onClick={() => {
                        setSelectedPastorId(journey.pastor.id);
                        setModalJourney(journey);
                      }}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-[#8ec5eb]/35 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{journey.pastor.name}</p>
                          <p className="mt-1 truncate text-xs text-white/55">{journey.pastor.email}</p>
                        </div>
                        <JourneyStatusBadge status={journey.status} />
                      </div>
                      <p className="mt-4 text-sm text-white/65">{journey.pastor.church}</p>
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                        <p className="text-xs text-white/45">Current Session</p>
                        <p className="mt-1 text-sm font-semibold text-white">
                          Session {journey.currentSessionNumber} of 10
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-white">{journey.completedCount}/10 completed</p>
                          <p className="text-xs text-white/45">{journey.progressPercent}%</p>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/10">
                          <div className="h-2 rounded-full bg-[#8ec5eb]" style={{ width: `${journey.progressPercent}%` }} />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              ) : (
                <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/55">
                  No assigned pastors found for this mentor.
                </div>
              )}
            </div>
          </section>
        ) : null}

        {activeTab === "pastors" ? (
          <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
            <div className={`${directorGlassCard} p-5`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Pastors Mentoring Sessions</h2>
                  <p className="mt-1 text-sm text-white/55">Select a pastor to view their read-only sessions.</p>
                </div>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/75" />
                  <input
                    value={pastorSearch}
                    onChange={(event) => setPastorSearch(event.target.value)}
                    placeholder="Search pastor name"
                    className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50 sm:w-72"
                  />
                </div>
              </div>
              <div className="custom-scrollbar mt-5 max-h-[620px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#8ec5eb]/30">
  <div className="grid gap-4 md:grid-cols-2">
    {filteredPastors.map((pastor) => {
                  const mentor = mentorById.get(pastor.mentorId);
                  return (
                    <button
                      key={pastor.id}
                      type="button"
                      onClick={() => setSelectedPastorId(pastor.id)}
                      className={`rounded-2xl border p-5 text-left transition ${
                        selectedPastorId === pastor.id
                          ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/15"
                          : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 font-bold text-white">
                          {initials(pastor.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{pastor.name}</p>
                          <p className="truncate text-xs text-white/55">{pastor.email}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-white/65">{pastor.church}</p>
                      <p className="mt-1 text-xs text-white/45">{pastor.city}</p>
                      <p className="mt-3 text-xs text-[#d9ebf8]">Mentor: {mentor?.name}</p>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>

            <aside className={`${directorGlassCard} p-5`}>
              <h2 className="text-lg font-semibold text-white">{selectedPastor?.name || "Select a pastor"}</h2>
              <p className="mt-1 text-sm text-white/55">{selectedPastor?.church || "Church not available"}</p>
              <p className="mt-1 text-sm text-white/45">{selectedPastor?.city || "Location not available"}</p>
              <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/45">Assigned Mentor</p>
                <p className="mt-1 font-semibold text-white">
                  {mentorById.get(selectedPastor?.mentorId || "")?.name || "Assigned mentor not found"}
                </p>
              </div>
              <div className="mt-5 border-t border-white/10 pt-5">
                <div className="mb-3 flex flex-col gap-3">
  <p className="text-sm font-semibold text-[#8ec5eb]">Pastor Session List</p>

  <div className="relative">
    <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/75" />
    <input
      value={pastorSessionSearch}
      onChange={(event) => setPastorSessionSearch(event.target.value)}
      placeholder="Search session name"
      className="w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#8ec5eb]/50"
    />
  </div>
</div>

{renderSessionList(filteredSelectedPastorSessions)}
              </div>
            </aside>
          </section>
        ) : null}
      </main>

      {modalJourney ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className={`${directorGlassCard} custom-scrollbar max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#8ec5eb]">Read-only Pastor Journey</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{modalJourney.pastor.name}</h2>
                <p className="mt-1 text-sm text-white/55">
                  {modalJourney.mentor?.name || "Assigned mentor not found"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalJourney(null)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Current Session" value={`Session ${modalJourney.currentSessionNumber} of 10`} />
              <DetailItem label="Session Title" value={modalJourney.currentSessionTitle} />
              <DetailItem
                label="Next Date"
                value={modalJourney.nextMeetingDate ? formatDateTime(modalJourney.nextMeetingDate) : "Not scheduled"}
              />
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs text-white/45">Journey Status</p>
                <div className="mt-2"><JourneyStatusBadge status={modalJourney.status} /></div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[#8ec5eb]">{modalJourney.completedCount}/10 completed</p>
                <p className="text-xs text-white/45">{modalJourney.progressPercent}%</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-[#8ec5eb]" style={{ width: `${modalJourney.progressPercent}%` }} />
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="mb-3 text-sm font-semibold text-[#8ec5eb]">All Sessions For This Pastor</p>
              {renderSessionList(modalJourney.sessions)}
            </div>
          </div>
        </div>
      ) : null}

      {modalSession ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className={`${directorGlassCard} custom-scrollbar max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#8ec5eb]">Read-only Session Detail</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{modalSession.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setModalSession(null)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <DetailItem label="Pastor" value={pastorById.get(modalSession.pastorId)?.name || "Pastor"} />
              <DetailItem label="Mentor" value={mentorById.get(modalSession.mentorId)?.name || "Mentor"} />
              <DetailItem label="Date & Time" value={formatDateTime(modalSession.meetingDate)} />
              <DetailItem label="Platform" value={modalSession.platform} />
            </div>

            {/* <div className="mt-5">
              <p className="text-sm text-white/45">Status</p>
              <div className="mt-2"><StatusBadge status={modalSession.status} /></div>
            </div> */}
            <div className="mt-5">
  <p className="text-sm text-white/45">Status</p>

  <div className="mt-2 flex flex-wrap items-center gap-3">
    <StatusBadge status={modalSession.status} />

    {modalSession.status === "missed" ? (
      <p className="text-xs text-amber-100/75">
        This session can be requested by the pastor to the mentor for rescheduling.
      </p>
    ) : null}
  </div>
</div>

            <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-[#8ec5eb]">Session Summary</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{modalSession.summary}</p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-[#8ec5eb]">AI Transcript</p>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {modalSession.aiTranscript || "AI transcript not available yet."}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-semibold text-[#8ec5eb]">Meeting Link</p>
              {modalSession.meetingLink ? (
                <a
                  href={modalSession.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                  Open link
                </a>
              ) : (
                <p className="mt-2 text-sm text-white/55">No meeting link added yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-semibold text-white">{value}</p>
    </div>
  );
}
