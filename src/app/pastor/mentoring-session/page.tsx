"use client";
import { useEffect, useMemo, useState } from "react";
import { apiGetUserById } from "@/app/Services/users.service";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import SessionProgressHeader from "@/app/Components/mentorship-sessions/SessionProgressHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import { formatSessionTime, getNextSessionId } from "./utils/sessionFlow";
import { useRouter } from "next/navigation";
import { usePastorSessionsQuery } from "@/app/mentor/mentoring-session/hooks/useMentorshipQueries";

const SESSION_FLOW = [
    {
        phaseName: "Self Revitalization Phase",
        totalSessions: 1,
    },
    {
        phaseName: "Church Empowerment Phase",
        totalSessions: 5,
    },
    {
        phaseName: "Community Revitalization and Multiplication Phase",
        totalSessions: 4,
    }
];
const SESSION_TITLES = [
  "Building Trust, Self-Awareness & Resources",
  "Creating a Life of Prayer, Vision, & Family Balance",
  "Empowering Disciples & Addressing Resistance",
  "Fostering a Culture of Hospitality & Generosity",
  "Building Social Bridges",
  "Creating Community Engagement Frameworks",
  "Training & Equipping for Community Engagement",
  "Transforming Community through Active Presence",
  "Celebrating & Envisioning Growth",
  "Expanding Mentoring Networks",
];
function getStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function getPersonName(person: any): string {
  if (!person || typeof person !== "object") return "";
  return getStringValue(
    person.name,
    person.fullName,
    `${person.firstName || ""} ${person.lastName || ""}`.trim(),
    person.email,
  );
}

function getInitials(name: string, fallback = "M"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts.map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function getTranscriptText(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(getTranscriptText).filter(Boolean).join("\n");

  if (typeof value === "object") {
    const item = value as Record<string, unknown>;
    return getStringValue(
      item.summary,
      item.transcriptSummary,
      item.sessionOverview,
      item.overview,
      item.text,
      item.content,
      item.notes,
      item.aiSummary,
    );
  }

  return "";
}
function isSessionMissed(session: any) {
  if (!session?.scheduledDate || session.status !== "SCHEDULED") return false;
  return new Date(session.scheduledDate).getTime() < Date.now();
}
export default function PastorMentoringSessionPage() {
    const router = useRouter();
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedSessionNumber, setSelectedSessionNumber] = useState<number | null>(null);
    const { data: sessions = [], isLoading: loading, error } = usePastorSessionsQuery();
    const [assignedMentor, setAssignedMentor] = useState<any>(null);
    const sessionsError = error instanceof Error ? error.message : null;

    useEffect(() => {
  const getCookieValue = (name: string) => {
    if (typeof document === "undefined") return "";
    return (
      document.cookie
        .split("; ")
        .find((row) => row.startsWith(`${name}=`))
        ?.split("=")[1] || ""
    );
  };

  const getCurrentUserId = () => {
    if (typeof window === "undefined") return "";

    const userId = localStorage.getItem("userId") || getCookieValue("userId");
    if (userId) return userId;

    const userValue =
      localStorage.getItem("user") || decodeURIComponent(getCookieValue("user") || "");

    try {
      const parsed = JSON.parse(userValue);
      return parsed?.id || parsed?._id || "";
    } catch {
      return "";
    }
  };
// const unwrapUser = (res: any) => res?.data?.user || res?.data || res?.user || res;
  const unwrapUser = (res: any) => {
  if (res?.data?.user) return res.data.user;
  if (res?.data?.data) return res.data.data;
  if (res?.data) return res.data;
  if (res?.user) return res.user;
  return res;
};

  const loadAssignedMentor = async () => {
    try {
      const pastorId = getCurrentUserId();
      if (!pastorId) return;

      const pastorRes = await apiGetUserById(pastorId);
      const pastor = unwrapUser(pastorRes);

      // const mentorId = Array.isArray(pastor?.assignedId)
      //   ? pastor.assignedId[0]
      //   : pastor?.assignedId || pastor?.mentorId || pastor?.assignedMentorId;
const mentorIds = [
  ...(Array.isArray(pastor?.assignedId) ? pastor.assignedId : [pastor?.assignedId]),
  pastor?.mentorId,
  pastor?.assignedMentorId,
  pastor?.assignedMentor?._id,
  pastor?.assignedMentor?.id,
  pastor?.mentor?._id,
  pastor?.mentor?.id,
].filter(Boolean);

for (const mentorId of mentorIds) {
  try {
    const mentorRes = await apiGetUserById(mentorId);
    const mentor = unwrapUser(mentorRes);

    if (mentor?.role === "mentor" || mentor?.firstName || mentor?.email) {
      setAssignedMentor(mentor);
      break;
    }
  } catch {
    continue;
  }
}
    } catch (err) {
      console.error("Failed to load assigned mentor", err);
    }
  };

  loadAssignedMentor();
}, []);

    // const filteredSessions = sessions.filter((session) => {
    // const filteredSessions = allSessions.filter((session) => {
        // if (filterStatus === "Completed") return session.status === "COMPLETED";
        // if (filterStatus === "Cancelled") return session.status === "CANCELLED";
        // if (filterStatus === "Scheduled") return session.status === "SCHEDULED";
        // return true;
//         if (filterStatus === "Completed") return session.status === "COMPLETED";
// if (filterStatus === "Cancelled") return session.status === "CANCELLED";
// if (filterStatus === "Scheduled") return session.status === "SCHEDULED";
// return true;
//     });

    // const visible = filteredSessions.filter((s) =>
    //     String(s.mentorNote ?? s.title ?? "").toLowerCase().includes(search.toLowerCase())
    // );

    const getPhaseInfo = (sessionNumber: number) => {
        let currentSession = 0;
        for (const phase of SESSION_FLOW) {
            currentSession += phase.totalSessions;
            if (sessionNumber <= currentSession) {
                return phase.phaseName;
            }
        }
        return "Unknown Phase";
    };

    // const sortedSessions = useMemo(() => [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber), [sessions]);
    // const nextSessionId = getNextSessionId(
    //     sortedSessions.map((s) => ({ id: s.id, status: s.status as any, scheduledDate: s.scheduledDate })),
    // );
    const sortedSessions = useMemo(
  () => [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber),
  [sessions],
);

const completedCount = sortedSessions.filter((s) => s.status === "COMPLETED").length;
const unlockedSessionNumber = Math.min(completedCount + 1, 10);

const allSessions = useMemo(() => {
  return SESSION_TITLES.map((title, index) => {
    const sessionNumber = index + 1;
    const apiSession = sortedSessions.find((s) => s.sessionNumber === sessionNumber);


    const previousCompletedSession = [...sortedSessions]
      .filter((s) => s.status === "COMPLETED" && s.sessionNumber < sessionNumber)
      .sort((a, b) => b.sessionNumber - a.sessionNumber)[0];

    const baseDate = previousCompletedSession?.scheduledDate
      ? new Date(previousCompletedSession.scheduledDate)
      : null;

    const fallbackDate = baseDate
      ? new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;

    // const status =
    //   apiSession?.status ||
    //   (sessionNumber === unlockedSessionNumber ? "SCHEDULED" : "LOCKED");
    const isCompleted = apiSession?.status === "COMPLETED";

const status = isCompleted
  ? "COMPLETED"
  : sessionNumber === unlockedSessionNumber
    ? "SCHEDULED"
    : "LOCKED";

    return {
      id: apiSession?.id || `locked-session-${sessionNumber}`,
      sessionNumber,
      title,
      mentorNote: apiSession?.mentorNote || `Session ${sessionNumber}—${title}`,
      status,
    //   scheduledDate: apiSession?.scheduledDate || fallbackDate?.toISOString() || "",
//     scheduledDate:
//   apiSession?.status === "COMPLETED"
//     ? apiSession?.scheduledDate || ""
//     : fallbackDate?.toISOString() || apiSession?.scheduledDate || "",
// scheduledDate: isCompleted
//   ? apiSession?.scheduledDate || ""
//   : sessionNumber === unlockedSessionNumber
//     ? fallbackDate?.toISOString() || apiSession?.scheduledDate || ""
//     : "",
scheduledDate:
  apiSession?.scheduledDate ||
  (sessionNumber === unlockedSessionNumber
    ? fallbackDate?.toISOString() || ""
    : ""),
      raw: apiSession,
    };
  });
}, [sortedSessions, unlockedSessionNumber]);
const filteredSessions = allSessions.filter((session) => {
  if (filterStatus === "Completed") return session.status === "COMPLETED";
  if (filterStatus === "Cancelled") return session.status === "CANCELLED";
  if (filterStatus === "Scheduled") return session.status === "SCHEDULED";
  return true;
});

// const visible = filteredSessions.filter((s) =>
//   String(s.mentorNote ?? s.title ?? "").toLowerCase().includes(search.toLowerCase())
// );
const visible = filteredSessions.filter((s) =>
  String(s.title ?? "").toLowerCase().includes(search.toLowerCase())
);
// const selectedSession =
//   allSessions.find((s) => s.sessionNumber === selectedSessionNumber) ||
//   allSessions[0];
const selectedSession =
  selectedSessionNumber == null
    ? null
    : allSessions.find((s) => s.sessionNumber === selectedSessionNumber) || null;
    const selectedSessionMissed = isSessionMissed(selectedSession);

    const selectedRaw = (selectedSession?.raw || {}) as any;
const selectedAppointment = selectedRaw?.appointment || selectedRaw?.appointmentDetails || {};
// const selectedMentor =
//   selectedRaw?.mentor ||
//   selectedRaw?.mentorId ||
//   selectedAppointment?.mentor ||
//   selectedAppointment?.mentorId ||
//   {};
const selectedMentor =
  assignedMentor ||
  selectedRaw?.mentor ||
  selectedRaw?.mentorId ||
  selectedAppointment?.mentor ||
  selectedAppointment?.mentorId ||
  {};

const selectedMentorName = getPersonName(selectedMentor);
const selectedMentorEmail = getStringValue(selectedMentor?.email);
const selectedMentorPhone = getStringValue(
  selectedMentor?.phone,
  selectedMentor?.phoneNumber,
  selectedMentor?.mobile,
);

const selectedMeetingPlatform = getStringValue(
  selectedRaw?.platform,
  selectedRaw?.meetingPlatform,
  selectedAppointment?.platform,
  selectedAppointment?.meetingPlatform,
);

const selectedMeetingLink = getStringValue(
  selectedRaw?.meetingLink,
  selectedRaw?.joinUrl,
  selectedRaw?.joinURL,
  selectedRaw?.link,
  selectedRaw?.zoomJoinUrl,
  selectedAppointment?.meetingLink,
  selectedAppointment?.joinUrl,
  selectedAppointment?.joinURL,
  selectedAppointment?.link,
  selectedAppointment?.zoomJoinUrl,
);

const selectedTranscriptText = getTranscriptText(
  selectedRaw?.transcriptSummary ||
    selectedRaw?.summary ||
    selectedRaw?.aiTranscript ||
    selectedRaw?.transcript ||
    selectedRaw?.mentorshipInsights ||
    selectedAppointment?.transcriptSummary ||
    selectedAppointment?.summary,
);

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
            <PastorHeader showFullHeader />

            {/* HERO SECTION */}
            <section
                className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

                <div className="relative z-10 mx-auto w-full max-w-6xl">
                    <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
                    <p className="mt-2 text-sm text-[#cde2f2]">
                        Monitor your mentoring appointment history and session details.
                    </p>
                </div>
            </section>

            {/* MAIN SECTION */}
            <main className="flex-1 px-4 md:px-20 py-10">
                {/* SEARCH BAR */}
                <div className="mb-6">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#8ec5eb]" />
                        <input
                            type="text"
                            placeholder="Search by session name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/25"
                        />
                    </div>
                </div>

                {/* FILTER TABS */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap gap-2">
                    {["All", "Scheduled", "Completed", "Cancelled"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === status
                                ? "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35"
                                : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                      

<div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
  <i className="fa-solid fa-info text-yellow-300" />
  <span>Sessions are held every 30 days.</span>
</div>
</div>
                </div>
                
{/* <div className="mb-6 rounded-2xl border border-[#2f80ed]/25 bg-[#2f80ed]/10 px-5 py-4">
  <div className="flex gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2f80ed]/30 text-[#8ec5eb]">
      <i className="fa-solid fa-info text-xs" />
    </div>

    <div>
      <p className="text-sm font-semibold text-[#d9ebf8]">
        Sessions are held every 30 days.
      </p>
      <p className="mt-1 text-xs text-[#cde2f2]/75">
        If a session is rescheduled, all upcoming sessions will automatically adjust.
      </p>
    </div>
  </div>
</div> */}
                {/* SESSIONS LIST */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="mb-4 inline-block">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
                            </div>
                            <p className="text-white/70">Loading mentoring sessions...</p>
                        </div>
                    </div>
                ) : sessionsError ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                        <i className="fas fa-exclamation-circle mb-3 block text-2xl text-red-400" />
                        <p className="text-red-300">{sessionsError}</p>
                    </div>
                ) : visible.length > 0 ? (
                    // <div className="space-y-4">
                   <div
  className={`grid gap-6 ${
    selectedSession ? "lg:grid-cols-[1.5fr_0.9fr]" : "lg:grid-cols-1"
  }`}
>
  <div
  className={`space-y-4 pr-2 ${
    selectedSession ? "max-h-[720px] overflow-y-auto" : ""
  }`}
>
    <SessionProgressHeader sessions={allSessions as any} />

    {visible.map((session) => (
      <div
        key={session.id}
        className="group rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
      >
        <button
          onClick={() => setSelectedSessionNumber(session.sessionNumber)}
          className="w-full px-6 py-4 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <h3 className="font-semibold text-base">
                    {session.mentorNote}
                  </h3>

                  <span className="text-xs text-white/40">
                    Session {session.sessionNumber}
                  </span>

                  {session.sessionNumber === unlockedSessionNumber ? (
                    <span className="rounded-md border border-yellow-400/30 bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="mb-2 text-xs text-white/50">
                  {getPhaseInfo(session.sessionNumber)}
                </p>

                <p className="text-sm text-white/60">
                  {session.status === "LOCKED" || !session.scheduledDate
                    ? "Locked"
                    : `${new Date(session.scheduledDate).toLocaleDateString("en-US", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })} · ${formatSessionTime(session.scheduledDate) || "Time TBD"}`}
                </p>
              </div>

              {session.status === "LOCKED" ? (
                <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-white/55">
                  LOCKED
                </span>
              ) : (
                <SessionStatusBadge
  status={(isSessionMissed(session) ? "MISSED" : session.status) as any}
  compact
/>
              )}
            </div>

            <i className="fas fa-chevron-right ml-4 text-white/40" />
          </div>
        </button>
      </div>
    ))}
  </div>

  {selectedSession ? (
    <aside className="rounded-2xl border border-white/15 bg-white/5 p-6">
      {/* <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">
          Session {selectedSession.sessionNumber} Details
        </h2>

        {selectedSession.status === "LOCKED" ? (
          <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-white/55">
            LOCKED
          </span>
        ) : (
          <SessionStatusBadge status={selectedSession.status as any} compact />
        )}
      </div> */}
      <div className="mb-4 flex items-center justify-between gap-3">
  <h2 className="text-lg font-bold text-white">
    Session {selectedSession.sessionNumber} Details
  </h2>

  <div className="flex items-center gap-2">
    {selectedSession.status === "LOCKED" ? (
      <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-white/55">
        LOCKED
      </span>
    ) : (
      <SessionStatusBadge
  status={(selectedSessionMissed ? "MISSED" : selectedSession.status) as any}
  compact
/>
    )}

    <button
      type="button"
      onClick={() => setSelectedSessionNumber(null)}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
      aria-label="Close details"
    >
      <i className="fa-solid fa-xmark text-sm" />
    </button>
  </div>
</div>

      <div className="space-y-5 text-sm">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
    Mentor Profile
  </p>

  <div className="flex items-center gap-3">
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#8ec5eb]/30 bg-[#8ec5eb]/15 text-sm font-bold text-[#d9ebf8]">
      {getInitials(selectedMentorName || selectedMentorEmail || "Mentor")}
    </div>

    <div className="min-w-0">
      <p className="truncate font-semibold text-white">
        {selectedMentorName || "Mentor details not available yet"}
      </p>
      <p className="mt-0.5 truncate text-xs text-white/55">
        {selectedMentorEmail || "Mentor email not available"}
      </p>
      {selectedMentorPhone ? (
        <p className="mt-0.5 truncate text-xs text-white/55">{selectedMentorPhone}</p>
      ) : null}
    </div>
  </div>
</div>
        <div>
          <p className="text-white/45">Title</p>
          <p className="mt-1 font-semibold text-white">{selectedSession.title}</p>
        </div>

        <div>
          <p className="text-white/45">Phase</p>
          <p className="mt-1 font-semibold text-white">
            {getPhaseInfo(selectedSession.sessionNumber)}
          </p>
        </div>

        <div className="border-t border-white/10 pt-5">
  <p className="text-white/45">Meeting Details</p>

  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
    <div className="flex items-start justify-between gap-4">
      <span className="text-white/45">Date & Time</span>
      <span className="text-right font-semibold text-white">
        {selectedSession.status === "LOCKED" || !selectedSession.scheduledDate
          ? "Locked"
          : `${new Date(selectedSession.scheduledDate).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })} · ${formatSessionTime(selectedSession.scheduledDate) || "Time TBD"}`}
      </span>
    </div>

    <div className="flex items-start justify-between gap-4">
      <span className="text-white/45">Platform</span>
      <span className="text-right font-semibold text-white">
        {selectedMeetingPlatform || "Meeting platform not added yet"}
      </span>
    </div>

    {selectedMeetingLink ? (
      <a
        href={selectedMeetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-[#062946] transition hover:bg-white/90"
      >
        <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
        Open meeting link
      </a>
    ) : (
      <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-white/60">
        No meeting link added yet
      </p>
    )}
  </div>
</div>

        <div>
          <p className="text-white/45">Status</p>
          <p className="mt-1 font-semibold text-white">
            {selectedSession.status === "LOCKED"
  ? "Locked"
  : selectedSessionMissed
    ? "MISSED"
    : selectedSession.status}
          </p>
          
        </div>
<div className="border-t border-white/10 pt-5">
  <p className="text-white/45">AI Transcript</p>
  <p className="mt-2 whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.03] p-4 leading-relaxed text-white/70">
    {selectedTranscriptText || "AI transcript not available yet"}
  </p>
</div>
        <div className="border-t border-white/10 pt-5">
          <p className="text-white/45">Session Summary</p>
          <p className="mt-2 leading-relaxed text-white/70">
           {selectedSession.status === "COMPLETED"
  ? "This session has been completed."
  : selectedSessionMissed
    ? "This session was missed. Please reschedule it."
    : selectedSession.status === "SCHEDULED"
      ? "This is your current mentoring session."
      : "Complete the previous session to unlock this session."}
          </p>
          {selectedSessionMissed ? (
  <button
    type="button"
    onClick={() => {
      const requests = JSON.parse(localStorage.getItem("missedSessionRescheduleRequests") || "[]");

const newRequest = {
  sessionId: selectedSession.id,
  sessionNumber: selectedSession.sessionNumber,
  pastorId: selectedRaw?.pastorId || selectedRaw?.userId || "",
  mentorId: selectedMentor?.id || selectedMentor?._id || "",
  title: selectedSession.title,
  scheduledDate: selectedSession.scheduledDate,
  status: "REQUESTED",
  requestedAt: new Date().toISOString(),
};

localStorage.setItem(
  "missedSessionRescheduleRequests",
  JSON.stringify([
    ...requests.filter((req: any) => req.sessionId !== selectedSession.id),
    newRequest,
  ])
);

alert("Reschedule request sent to your mentor.");
    }}
    className="mt-4 w-full rounded-xl bg-[#8ec5eb] px-4 py-3 text-sm font-bold text-[#062946] transition hover:bg-[#b7def6]"
  >
   Request Reschedule Missed Session
  </button>
) : null}
        </div>
      </div>
    </aside>
  ) : null}
</div>
                ) : (
                    <div className="rounded-lg border border-white/10 bg-white/5 py-12 text-center">
                        <i className="fas fa-inbox mb-4 block text-3xl text-white/40" />
                        <p className="text-sm text-white/60">
                            No mentoring sessions found
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
