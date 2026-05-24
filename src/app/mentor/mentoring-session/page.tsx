"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import { mentorSelectDark } from "@/app/Components/mentor/mentor-theme";
import HeroBg from "../../Assets/progress-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import SessionProgressHeader from "@/app/Components/mentorship-sessions/SessionProgressHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import { formatSessionTime, getNextSessionId } from "./utils/sessionFlow";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiGetMentorMentoringSessionsGrouped,
  apiGetMentorRescheduleRequests,
  apiRescheduleMentoringSession,
} from "@/app/Services/mentoring-sessions.service";
import axiosInstance from "@/app/Services/config/axios-instance";
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

type MentorSession = {
  id: string;
  appointmentId?: string;
  pastorId: string;
  pastorName?: string;
  pastorEmail?: string;
  sessionNumber: number;
  title: string;
  status: string;
  scheduledDate: string;
  mentorNote?: string;
};

type MentorSessionGroup = {
  pastorId: string;
  pastorName: string;
  pastorEmail: string;
  sessions: MentorSession[];
};

type RescheduleFormState = {
  platform: string;
};

function getStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function parseStoredUserId(value: string) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return getStringValue(parsed?.id, parsed?._id, parsed?.userId);
  } catch {
    return "";
  }
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${name}=`))
      ?.split("=")[1] || ""
  );
}

function getBrowserMentorId() {
  if (typeof window === "undefined") return "";

  return (
    parseStoredUserId(getCookieValue("mentor")) ||
    parseStoredUserId(localStorage.getItem("mentor") || "") ||
    parseStoredUserId(getCookieValue("user")) ||
    parseStoredUserId(localStorage.getItem("user") || "") ||
    localStorage.getItem("mentorId") ||
    localStorage.getItem("userId") ||
    getCookieValue("mentorId") ||
    getCookieValue("userId") ||
    ""
  );
}

function unwrapGroupedSessionsResponse(res: any): any[] {
  const data = res?.data?.data ?? res?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.grouped)) return data.grouped;
  if (Array.isArray(data?.pastors)) return data.pastors;
  return [];
}

function getRealSessionId(session: any) {
  const id = getStringValue(session?._id, session?.sessionId, session?.id);
  if (!id || id.startsWith("locked-") || id.startsWith("unscheduled-")) return "";
  return id;
}

function convertTo24Hour(time12: string, period: string): string {
  let [hours, minutes] = time12.split(":").map(Number);
  if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (period.toUpperCase() === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function availabilitySlotToIso(dateValue: string, slot: any) {
  if (!dateValue || !slot?.startTime || !slot?.startPeriod) return "";
  return new Date(`${dateValue.slice(0, 10)}T${convertTo24Hour(slot.startTime, slot.startPeriod)}`).toISOString();
}

function normalizeBackendSession(session: any, group: any): MentorSession | null {
  const appointmentId = getStringValue(session?.appointmentId, session?.appointment?._id, session?.appointment?.id);
  const id = getStringValue(session?._id, session?.sessionId, session?.id);
  const sessionNumber = Number(session?.sessionNumber || session?.sessionNo || 0);

  const pastor = group?.pastor && typeof group.pastor === "object" ? group.pastor : null;
  const pastorId = getStringValue(
    session?.pastorId,
    session?.userId,
    group?.pastorId,
    group?.userId,
    pastor?._id,
    pastor?.id,
  );

  return {
    ...session,
    id,
    appointmentId,
    pastorId,
    pastorName: getStringValue(
      session?.pastorName,
      group?.pastorName,
      group?.name,
      `${pastor?.firstName || ""} ${pastor?.lastName || ""}`.trim(),
      pastor?.email,
    ),
    pastorEmail: getStringValue(session?.pastorEmail, group?.pastorEmail, group?.email, pastor?.email),
    sessionNumber,
    title: getStringValue(session?.title, SESSION_TITLES[sessionNumber - 1], `Session ${sessionNumber}`),
    mentorNote: getStringValue(session?.mentorNote, session?.title, `Session ${sessionNumber}`),
    status: getStringValue(session?.status, "LOCKED").toUpperCase(),
    scheduledDate: getStringValue(session?.scheduledDate, session?.meetingDate, session?.date),
  };
}

function normalizeGroupedSession(group: any): MentorSessionGroup | null {
  const pastor = group?.pastor && typeof group.pastor === "object" ? group.pastor : null;
  const pastorId = getStringValue(group?.pastorId, group?.userId, pastor?._id, pastor?.id);
  if (!pastorId) return null;

  const sessions = (Array.isArray(group?.sessions) ? group.sessions : [])
    .map((session: any) => normalizeBackendSession(session, group))
    .filter((session: MentorSession | null): session is MentorSession => Boolean(session && session.sessionNumber > 0));

  return {
    pastorId,
    pastorName: getStringValue(
      group?.pastorName,
      group?.name,
      `${pastor?.firstName || ""} ${pastor?.lastName || ""}`.trim(),
      pastor?.email,
      "Pastor",
    ),
    pastorEmail: getStringValue(group?.pastorEmail, group?.email, pastor?.email),
    sessions,
  };
}
export default function MentorMentoringSessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pastorIdFromQuery = searchParams.get("pastorId") || "";
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [rescheduleRequests, setRescheduleRequests] = useState<any[]>([]);
    const [selectedPastorId, setSelectedPastorId] = useState<string | null>(null);
    const [groupedSessions, setGroupedSessions] = useState<MentorSessionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupedError, setGroupedError] = useState<string | null>(null);
    const [rescheduleSession, setRescheduleSession] = useState<MentorSession | null>(null);
    const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>({
      platform: "zoom",
    });
    const [rescheduleSubmittingId, setRescheduleSubmittingId] = useState<string | null>(null);
    const today = new Date();
    const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
    const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
    const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState(today.getDate());
    const [rescheduleMonthlyAvailabilitySlots, setRescheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
    const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);
    const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");

    const fetchGroupedSessions = useCallback(async () => {
      const mentorId = getBrowserMentorId();
      if (!mentorId) {
        setGroupedSessions([]);
        setRescheduleRequests([]);
        return;
      }

      const [groupedRes, requestRes] = await Promise.all([
        apiGetMentorMentoringSessionsGrouped(mentorId),
        apiGetMentorRescheduleRequests(mentorId),
      ]);

      const groups = unwrapGroupedSessionsResponse(groupedRes)
        .map(normalizeGroupedSession)
        .filter(Boolean) as MentorSessionGroup[];
      const requestPayload = requestRes?.data as any;
      const requests = Array.isArray(requestPayload)
        ? requestPayload
        : Array.isArray(requestPayload?.data)
          ? requestPayload.data
          : [];

      setGroupedSessions(groups);
      setRescheduleRequests(requests);
    }, []);

    const openRescheduleDrawer = (session: MentorSession) => {
      const sessionId = getRealSessionId(session);
      if (!sessionId) {
        alert("This session is not available for reschedule yet.");
        return;
      }

      setRescheduleSession({ ...session, id: sessionId });
      setRescheduleForm({
        platform: getStringValue((session as any)?.platform, (session as any)?.meetingPlatform, "zoom"),
      });
      const now = new Date();
      setRescheduleMonth(now.getMonth());
      setRescheduleYear(now.getFullYear());
      setRescheduleSelectedDate(now.getDate());
      setRescheduleSelectedSlot("");
      setRescheduleMonthlyAvailabilitySlots([]);
    };

    useEffect(() => {
      if (!rescheduleSession) return;
      const mentorId = getBrowserMentorId();
      if (!mentorId) return;

      let cancelled = false;
      setRescheduleAvailabilityLoading(true);

      void axiosInstance
        .get(`/appointments/availability/${mentorId}/month`, {
          params: { year: rescheduleYear, month: rescheduleMonth + 1 },
        })
        .then((response) => {
          if (!cancelled) {
            const raw = response.data?.data ?? response.data;
            setRescheduleMonthlyAvailabilitySlots(Array.isArray(raw) ? raw : []);
          }
        })
        .catch(() => {
          if (!cancelled) setRescheduleMonthlyAvailabilitySlots([]);
        })
        .finally(() => {
          if (!cancelled) setRescheduleAvailabilityLoading(false);
        });

      return () => {
        cancelled = true;
      };
    }, [rescheduleSession, rescheduleMonth, rescheduleYear]);

    const handleReschedulePrevMonth = () => {
      setRescheduleSelectedSlot("");
      if (rescheduleMonth === 0) {
        setRescheduleMonth(11);
        setRescheduleYear((year) => year - 1);
      } else {
        setRescheduleMonth((month) => month - 1);
      }
    };

    const handleRescheduleNextMonth = () => {
      setRescheduleSelectedSlot("");
      if (rescheduleMonth === 11) {
        setRescheduleMonth(0);
        setRescheduleYear((year) => year + 1);
      } else {
        setRescheduleMonth((month) => month + 1);
      }
    };

    const submitReschedule = async () => {
      if (!rescheduleSession) return;

      const sessionId = getRealSessionId(rescheduleSession);
      if (!sessionId) {
        alert("This session is not available for reschedule yet.");
        return;
      }

      if (!rescheduleSelectedSlot) {
        alert("Please select an available time slot.");
        return;
      }

      try {
        setRescheduleSubmittingId(sessionId);
        await apiRescheduleMentoringSession(sessionId, {
          scheduledDate: rescheduleSelectedSlot,
          ...(rescheduleForm.platform ? { platform: rescheduleForm.platform } : {}),
        });
        alert("Session rescheduled successfully.");
        setRescheduleSession(null);
        await fetchGroupedSessions();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to reschedule session.");
      } finally {
        setRescheduleSubmittingId(null);
      }
    };

    useEffect(() => {
        if (!groupedSessions.length) return;

        // Mobile-like: if we navigated back after an action, preserve pastor context via query param.
        if (pastorIdFromQuery && groupedSessions.some((g) => g.pastorId === pastorIdFromQuery)) {
            setSelectedPastorId(pastorIdFromQuery);
            return;
        }

        // If nothing selected (first load), auto-select the first pastor with sessions.
        setSelectedPastorId((prev) => (prev && groupedSessions.some((g) => g.pastorId === prev) ? prev : groupedSessions[0].pastorId));
    }, [groupedSessions, pastorIdFromQuery]);

    useEffect(() => {
      let cancelled = false;

      const loadGroupedSessions = async () => {
        try {
          setLoading(true);
          setGroupedError(null);
          await fetchGroupedSessions();
        } catch (err) {
          if (!cancelled) {
            setGroupedSessions([]);
            setRescheduleRequests([]);
            setGroupedError(err instanceof Error ? err.message : "Failed to load mentoring sessions.");
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      };

      loadGroupedSessions();
      return () => {
        cancelled = true;
      };
    }, [fetchGroupedSessions]);

    // const handleViewDetails = (session: MentorSession) => {
    //     router.push(`/mentor/mentoring-session/${encodeURIComponent(session.id)}?pastorId=${encodeURIComponent(session.pastorId)}`);
    // };
 const handleViewDetails = (session: MentorSession) => {
  const sessionId = String(session.id || "");
  if (!sessionId || sessionId.startsWith("locked-") || sessionId.startsWith("unscheduled-")) {
    alert("This session is not available yet.");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[mentor mentoring-session] opening detail route", {
      routeSessionId: sessionId,
      appointmentId: session.appointmentId || "",
      usesAppointmentId: Boolean(session.appointmentId && sessionId === session.appointmentId),
    });
  }

  const params = new URLSearchParams({
    pastorId: session.pastorId,
    sessionNumber: String(session.sessionNumber),
    title: session.title || "",
    status: String(session.status || ""),
    scheduledDate: session.scheduledDate || "",
  });

  router.push(
    `/mentor/mentoring-session/${encodeURIComponent(sessionId)}?${params.toString()}`
  );
};
const buildAllSessions = (sessions: MentorSession[], pastorId: string) => {
  const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);

  const completedCount = sorted.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  const unlockedSessionNumber = Math.min(completedCount + 1, 10);

  if (sorted.length >= 10) {
    return sorted.map((session) => {
      const sessionNumber = Number(session?.sessionNumber || (session as any)?.sessionNo || 0);

      return {
        ...session,
        id: getStringValue((session as any)?._id, (session as any)?.sessionId, session?.id),
        appointmentId: getStringValue(
          session?.appointmentId,
          (session as any)?.appointment?._id,
          (session as any)?.appointment?.id,
        ),
        pastorId,
        sessionNumber,
        title: getStringValue(
          session?.title,
          SESSION_TITLES[sessionNumber - 1],
          `Session ${sessionNumber}`,
        ),
        mentorNote: getStringValue(session?.mentorNote, session?.title, `Session ${sessionNumber}`),
        status: getStringValue(session?.status, "LOCKED").toUpperCase(),
        scheduledDate: getStringValue(session?.scheduledDate, (session as any)?.meetingDate, (session as any)?.date),
      } as MentorSession & { status: string };
    });
  }

  return SESSION_TITLES.map((title, index) => {
    const sessionNumber = index + 1;

    const apiSession = sorted.find(
      (s) => s.sessionNumber === sessionNumber
    );

    const lastCompleted = [...sorted]
      .filter(
        (s) =>
          s.status === "COMPLETED" &&
          s.sessionNumber < sessionNumber
      )
      .sort((a, b) => b.sessionNumber - a.sessionNumber)[0];

    const fallbackDate = lastCompleted?.scheduledDate
      ? new Date(
          new Date(lastCompleted.scheduledDate).getTime() +
            30 * 24 * 60 * 60 * 1000
        )
      : null;

    const isCompleted = apiSession?.status === "COMPLETED";

    // const status = isCompleted
    //   ? "COMPLETED"
    //   : sessionNumber === unlockedSessionNumber
    //   ? "SCHEDULED"
    //   : "LOCKED";
    const isUnlocked = sessionNumber === unlockedSessionNumber;
const scheduledDate = apiSession?.scheduledDate || fallbackDate?.toISOString() || "";
const isPastDue =
  isUnlocked &&
  scheduledDate &&
  new Date(scheduledDate).getTime() < Date.now();

const status = isCompleted
  ? "COMPLETED"
  : isPastDue
    ? "MISSED"
    : isUnlocked
      ? "SCHEDULED"
      : "LOCKED";

    return {
      ...(apiSession || {}),
      id:
        apiSession?.id ||
        `locked-${pastorId}-${sessionNumber}`,
      appointmentId:
        apiSession?.appointmentId,
      pastorId,
      sessionNumber,
    //   title:
    //     apiSession?.title ||
    //     `Session ${sessionNumber}—${title}`,
    title: apiSession?.title || `Session ${sessionNumber}—${title}`,
      status,
    //   scheduledDate: isCompleted
    //     ? apiSession?.scheduledDate || ""
    //     : sessionNumber === unlockedSessionNumber
    //     ? fallbackDate?.toISOString() ||
    //       apiSession?.scheduledDate ||
    //       ""
    //     : "",
    scheduledDate: isCompleted
  ? apiSession?.scheduledDate || ""
  : isUnlocked
    ? scheduledDate
    : "",
    } as MentorSession & { status: string };
  });
};
    const selectedGroup = selectedPastorId ? groupedSessions.find(g => g.pastorId === selectedPastorId) : undefined;
    // const sessionsForPastor = selectedGroup?.sessions ?? [];
    // const sortedSessions = useMemo(() => [...sessionsForPastor].sort((a, b) => a.sessionNumber - b.sessionNumber), [sessionsForPastor]);
    const sessionsForPastor = selectedGroup?.sessions ?? [];

const allSessionsForPastor = useMemo(
  () => selectedGroup ? buildAllSessions(sessionsForPastor, selectedGroup.pastorId) : [],
  [sessionsForPastor, selectedGroup],
);

const sortedSessions = allSessionsForPastor;
    // const nextSessionId = getNextSessionId(
    //     sortedSessions.map((s) => ({ id: s.id, status: s.status, scheduledDate: s.scheduledDate })),
    // );
    const nextSessionId = getNextSessionId(
  sortedSessions.map((s) => ({
    id: s.id,
    status: s.status as any,
    scheduledDate: s.scheduledDate,
  })),
);

const getRescheduleRequestForSession = (session: any) =>
  rescheduleRequests.find(
    (req) =>
      req.sessionId === session.id ||
      req.sessionNumber === session.sessionNumber
  );

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
            <MentorHeader showFullHeader />

            {rescheduleSession ? (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
                  onClick={() => {
                    if (!rescheduleSubmittingId) setRescheduleSession(null);
                  }}
                  aria-hidden
                />
                <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:max-w-[480px] sm:w-[480px]">
                  <div className="flex h-full flex-col p-6">
                    <div className="mb-6 flex shrink-0 items-center justify-between">
                      <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold">
                          <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                          Reschedule session
                        </h2>
                        <p className="mt-1 pl-7 text-sm font-medium text-[#8ec5eb]">
                          Session {rescheduleSession.sessionNumber}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRescheduleSession(null)}
                        disabled={rescheduleSubmittingId != null}
                        className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="Close"
                      >
                        <i className="fa-solid fa-xmark text-xl" />
                      </button>
                    </div>

                    <div className="mb-6 flex-1 space-y-5 overflow-y-auto pr-3">
                      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
                        <p className="mb-3 text-sm text-[#cde2f2]">Mentor Availability</p>
                        {rescheduleAvailabilityLoading ? (
                          <div className="flex justify-center py-8">
                            <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                          </div>
                        ) : (
                          <AvailabilityCalendar
                            mentorId={getBrowserMentorId()}
                            currentMonth={rescheduleMonth}
                            currentYear={rescheduleYear}
                            selectedDate={rescheduleSelectedDate}
                            onDateSelect={(day) => {
                              setRescheduleSelectedDate(day);
                              setRescheduleSelectedSlot("");
                            }}
                            onPrevMonth={handleReschedulePrevMonth}
                            onNextMonth={handleRescheduleNextMonth}
                            availabilitySlots={rescheduleMonthlyAvailabilitySlots}
                            isLoading={rescheduleAvailabilityLoading}
                          />
                        )}
                      </div>

                      <div>
                        <label className="mb-3 block text-sm font-semibold text-[#cde2f2]">
                          Available times on {new Date(rescheduleYear, rescheduleMonth, rescheduleSelectedDate).toLocaleDateString()}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {(() => {
                            const selectedDateSlots = rescheduleMonthlyAvailabilitySlots.find(
                              (slot: any) => new Date(slot.date).getDate() === rescheduleSelectedDate,
                            );
                            const timeSlots = selectedDateSlots?.slots || [];
                            if (timeSlots.length === 0) {
                              return <p className="col-span-2 text-sm text-[#cde2f2]">No slots available on this date</p>;
                            }
                            return timeSlots.map((slot: any, index: number) => {
                              const isoString = availabilitySlotToIso(selectedDateSlots.date, slot);
                              const timeLabel = `${slot.startTime} ${slot.startPeriod}`;
                              return (
                                <button
                                  key={`${timeLabel}-${index}`}
                                  type="button"
                                  onClick={() => setRescheduleSelectedSlot(isoString)}
                                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                                    rescheduleSelectedSlot === isoString
                                      ? "border-blue-500 bg-blue-600 text-white"
                                      : "border-white/20 text-white hover:bg-white/10"
                                  }`}
                                >
                                  {timeLabel}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      <label className="block">
                        <span className="text-sm font-semibold text-[#cde2f2]">Platform</span>
                        <select
                          value={rescheduleForm.platform}
                          onChange={(event) => setRescheduleForm((prev) => ({ ...prev, platform: event.target.value }))}
                          className={`${mentorSelectDark} mt-2 w-full`}
                        >
                          <option className="bg-[#062946]" value="zoom">Zoom</option>
                          <option className="bg-[#062946]" value="google-meet">Google Meet</option>
                          <option className="bg-[#062946]" value="teams">Microsoft Teams</option>
                          <option className="bg-[#062946]" value="phone">Phone</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 pt-6">
                      <button
                        type="button"
                        onClick={() => setRescheduleSession(null)}
                        disabled={rescheduleSubmittingId != null}
                        className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={rescheduleSubmittingId === rescheduleSession.id}
                        onClick={submitReschedule}
                        className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {rescheduleSubmittingId === rescheduleSession.id ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {/* HERO SECTION */}
            <section
                className="relative overflow-hidden bg-cover bg-top px-0 pb-10 pt-4"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

                <div className="relative z-10 mx-auto w-full max-w-6xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
                            <p className="mt-2 text-sm text-[#cde2f2]">
                                Monitor your mentoring appointment history and session details.
                            </p>
                        </div>
                        <a
                            href="/mentor/mentoring-session/insights"
                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                        >
                            <i className="fas fa-chart-line" />
                            Insights
                        </a>
                    </div>
                </div>
            </section>

            {/* MAIN SECTION - TWO PANEL LAYOUT */}
            <main className="flex-1 px-6 py-10 lg:px-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="mb-4 inline-block">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
                            </div>
                            <p className="text-white/70">Loading mentoring sessions...</p>
                        </div>
                    </div>
                ) : groupedError ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                        <i className="fas fa-exclamation-circle mb-3 block text-2xl text-red-400" />
                        <p className="text-red-300">{groupedError}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT PANEL - PASTOR LIST */}
                        <div className="lg:col-span-1">
                            <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
                                <h2 className="text-lg font-semibold text-[#8ec5eb] mb-4">
                                    Assigned Pastors
                                </h2>
                                <div className="custom-scrollbar max-h-[600px] space-y-3 overflow-y-auto pr-2">
                                    {groupedSessions.length > 0 ? (
                                        // groupedSessions.map((group) => (
                                        //     <button
                                        //         key={group.pastorId}
                                        //         onClick={() => {
                                        //             setSelectedPastorId(group.pastorId);
                                        //         }}
                                        //         className={`w-full text-left px-4 py-3 rounded-lg transition border ${selectedPastorId === group.pastorId
                                        //             ? "bg-[#8ec5eb]/25 border-[#8ec5eb]/35 text-white"
                                        //             : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                        //             }`}
                                        //     >
                                        //         <div className="flex items-center justify-between">
                                        //             <div className="flex-1">
                                        //                 <p className="font-medium text-sm">{group.pastorName}</p>
                                        //                 <p className="text-xs text-white/50 mt-1 truncate">
                                        //                     {group.pastorEmail}
                                        //                 </p>
                                        //             </div>
                                        //             <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#8ec5eb]/30 text-xs font-semibold">
                                        //                 {group.sessions.length}
                                        //             </span>
                                        //         </div>
                                        //     </button>
                                        groupedSessions.map((group) => {
  const allSessions = buildAllSessions(group.sessions, group.pastorId);

  const completedCount = allSessions.filter(
    (s) => String(s.status) === "COMPLETED"
  ).length;

  const currentSession = allSessions.find(
    (s) => String(s.status) === "SCHEDULED"
  );

//   const missedSession = allSessions.find(
//     (s) => String(s.status) === "MISSED"
//   );
const missedSession =
  group.sessions.find((s) => String(s.status) === "MISSED") ||
  allSessions.find((s) => String(s.status) === "MISSED");

  const isDone = completedCount >= 10;

  const label = missedSession
    ? "Needs Action"
    : isDone
      ? "Completed"
      : currentSession
        ? "In Progress"
        : "Current";

  const initials =
    group.pastorName
      ?.split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "P";

  return (
    <button
      key={group.pastorId}
      onClick={() => setSelectedPastorId(group.pastorId)}
      className={`w-full rounded-xl border p-4 text-left transition ${
        selectedPastorId === group.pastorId
          ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/20 text-white"
          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#173653] text-sm font-bold text-white">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-semibold text-white">{group.pastorName}</p>

            {/* <span className="rounded-md border border-blue-400/30 bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-100"> */}
            <span
  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
    missedSession
      ? "border-red-400/30 bg-red-500/20 text-red-100"
      : isDone
        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
        : "border-blue-400/30 bg-blue-500/20 text-blue-100"
  }`}
>
              {label}
            </span>
          </div>

          <p className="mt-1 truncate text-xs text-white/50">{group.pastorEmail}</p>

          <p className="mt-3 text-xs font-semibold text-white/80">
            Session {isDone ? 10 : Math.min(completedCount + 1, 10)} of 10
          </p>

          <p className={`mt-1 text-xs ${missedSession ? "text-red-300" : "text-white/55"}`}>
            {missedSession
              ? `Missed Session ${missedSession.sessionNumber}`
              : isDone
                ? "All 10 sessions completed"
                : currentSession?.scheduledDate
                  ? `Next: ${new Date(currentSession.scheduledDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`
                  : "Next session pending"}
          </p>
        </div>
      </div>
    </button>
  );
})
                                        
                                    ) : (
                                        <p className="text-sm text-white/50 text-center py-6">
                                            No mentoring sessions yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - SESSION HISTORY */}
                        <div className="lg:col-span-2">
                            {selectedPastorId ? (
                                (() => {
                                    const selectedGroup = groupedSessions.find(g => g.pastorId === selectedPastorId);
                                    if (!selectedGroup) return null;

                                    // const filteredSessions = selectedGroup.sessions.filter((session) => {
                                    const allSessions = buildAllSessions(selectedGroup.sessions, selectedGroup.pastorId);

const filteredSessions = allSessions.filter((session) => {
                                        const statusMatch = filterStatus === "All" ||
                                            (filterStatus === "Scheduled" && session.status === "SCHEDULED") ||
                                            (filterStatus === "Completed" && session.status === "COMPLETED") ||
                                            (filterStatus === "Missed" && session.status === "MISSED") ||
                                            (filterStatus === "Cancelled" && session.status === "CANCELLED");

                                        const searchMatch = session.title.toLowerCase().includes(search.toLowerCase());
                                        return statusMatch && searchMatch;
                                    });

                                    return (
                                        <div>
                                            {/* HEADER WITH PASTOR INFO */}
                                            {/* <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
                                                <h2 className="text-xl font-semibold text-[#8ec5eb] mb-2">
                                                    {selectedGroup.pastorName}
                                                </h2>
                                                <p className="text-sm text-white/60 mb-1">{selectedGroup.pastorEmail}</p>
                                                <p className="text-xs text-white/50">
                                                    Session History ({filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''})
                                                </p>
                                            </div> */}
{(() => {
  const missedSession = allSessions.find((s) => String(s.status) === "MISSED");

  return (
    <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="mb-2 text-xl font-semibold text-[#8ec5eb]">
            {selectedGroup.pastorName}
          </h2>
          <p className="mb-1 text-sm text-white/60">{selectedGroup.pastorEmail}</p>
          <p className="text-xs text-white/50">
            Session History ({filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""})
          </p>
        </div>

        {/* {missedSession ? (
          <div className="w-full rounded-xl border border-red-400/30 bg-red-500/10 p-4 lg:max-w-[420px]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-300">
                <i className="fa-solid fa-triangle-exclamation text-sm" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-200">
                  Missed Session {missedSession.sessionNumber}
                </p>
                <p className="mt-1 text-xs text-red-100/75">
                  Was scheduled on{" "}
                  {missedSession.scheduledDate
                    ? new Date(missedSession.scheduledDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "the scheduled date"}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    // TODO: wire reschedule API/modal later
                  }}
                  className="mt-3 rounded-lg border border-red-300/30 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/30"
                >
                  Reschedule missed meeting
                </button>
              </div>
            </div>
          </div>
        ) : null} */}
        {missedSession ? (
  <div className="flex w-full flex-col items-start gap-2 lg:max-w-[300px]">
    <div className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
          <i className="fa-solid fa-clock text-xs" />
        </span>

        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/85">
            Missed Session {missedSession.sessionNumber}
          </p>
          <p className="mt-0.5 text-[11px] text-white/50">
            {missedSession.scheduledDate
              ? new Date(missedSession.scheduledDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "Scheduled date unavailable"}
          </p>
        </div>
      </div>
    </div>

    <button
      type="button"
      onClick={() => openRescheduleDrawer(missedSession as MentorSession)}
     className="self-end rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-100 hover:bg-green-500/30"
    >
      Reschedule meeting
    </button>
  </div>
) : null}
      </div>
    </div>
  );
})()}
                                            {/* PROGRESS HEADER (Mobile parity) */}
                                            <SessionProgressHeader sessions={sortedSessions as any} />

                                            {/* SEARCH BAR */}
                                            <div className="mb-6">
                                                <div className="relative">
                                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#8ec5eb]" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by session title..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/25"
                                                    />
                                                </div>
                                            </div>

                                            {/* FILTER TABS */}
                                            {/* <div className="mb-8 flex flex-wrap gap-2">
                                                {["All", "Scheduled", "Completed", "Missed", "Cancelled"].map((status) => (
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
                                            </div> */}
                                            {/* FILTER TABS */}
<div className="mb-8 flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap gap-2">
    {["All", "Scheduled", "Completed", "Missed", "Cancelled"].map((status) => (
      <button
        key={status}
        onClick={() => setFilterStatus(status)}
        className={`px-4 py-2 rounded-full text-sm font-medium transition ${
          filterStatus === status
            ? "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35"
            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
        }`}
      >
        {status}
      </button>
    ))}
  </div>

  <div className="flex items-center gap-2 rounded-xl border border-yellow-400/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-100">
    <i className="fa-solid fa-info text-yellow-300" />
    <span>Sessions are scheduled every 30 days.</span>
  </div>
</div>
                                            {/* SESSIONS LIST */}
                                            {filteredSessions.length > 0 ? (
                                                <div className="space-y-4">
             {filteredSessions.map((session, index) => {
              const sessionId = getStringValue((session as any)?._id, (session as any)?.sessionId, session.id);
              const sessionStatus = String(session.status || "").toUpperCase();
              const isLockedSession = sessionStatus === "LOCKED";
              const isUnavailable = isLockedSession || !sessionId;
              const rescheduleRequest = getRescheduleRequestForSession(session);

              return (
                                                        <div
                                                            key={sessionId || `session-${session.sessionNumber}-${index}`}
                                                            className="group rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
                                                        >
                                                            <button
                                                              type="button"
                                                              disabled={isUnavailable}
                                                              onClick={() => handleViewDetails({ ...session, id: sessionId })}
                                                              className={`w-full px-6 py-4 text-left ${isUnavailable ? "cursor-not-allowed opacity-75" : ""}`}
                                                            >
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="truncate font-semibold text-base">{session.title}</h3>
                                                                            {session.id === nextSessionId ? (
                                                                                <span className="shrink-0 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 border border-yellow-400/30">
                                                                                    Current
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <p className="mt-1 text-sm text-white/60">
                                                                            {/* {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                                                                weekday: "short",
                                                                                year: "numeric",
                                                                                month: "short",
                                                                                day: "numeric",
                                                                            })}{" "}
                                                                            · {formatSessionTime(session.scheduledDate) || "Time TBD"} */}
                                                                            {sessionStatus === "LOCKED" || !session.scheduledDate
  ? "Locked"
  : `${new Date(session.scheduledDate).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })} · ${formatSessionTime(session.scheduledDate) || "Time TBD"}`}
                                                                        </p>
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center gap-3">
                                                                        {/* <SessionStatusBadge status={session.status} compact /> */}
                                                                        {sessionStatus === "LOCKED" ? (
  <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-bold text-white/55">
    LOCKED
  </span>
) : (
  <>
  {rescheduleRequest ? (
    <span className="rounded-md border border-yellow-400/30 bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-100">
      RESCHEDULE REQUESTED
    </span>
  ) : null}

  <SessionStatusBadge status={session.status as any} compact />
</>
)}
                                                                        <i className="fas fa-chevron-right text-white/40" />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                            {rescheduleRequest && !isUnavailable ? (
                                                              <div className="border-t border-white/10 px-6 py-3 text-right">
                                                                <button
                                                                  type="button"
                                                                  onClick={() => openRescheduleDrawer({ ...session, id: sessionId })}
                                                                  className="rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-100 hover:bg-green-500/30"
                                                                >
                                                                  Reschedule
                                                                </button>
                                                              </div>
                                                            ) : null}
                                                        </div>
              );
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-white/10 bg-white/5 py-12 text-center">
                                                    <i className="fas fa-inbox mb-4 block text-3xl text-white/40" />
                                                    <p className="text-sm text-white/60">
                                                        No mentoring sessions found
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <i className="fas fa-arrow-left mb-4 block text-4xl text-white/40" />
                                    <p className="text-sm text-white/60">
                                        Select a pastor from the list to view their session history
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
