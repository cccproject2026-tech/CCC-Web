"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import { mentorSelectDark } from "@/app/Components/mentor/mentor-theme";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import ConfirmModal from "@/app/Components/ui/ConfirmModal";
import { useToast } from "@/app/Components/ui/Toast";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { apiGenerateTranscriptSummary } from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import {
  apiCompleteMentoringSession,
  apiGetMentoringSessionById,
  apiGetMentoringSessionTranscriptSummary,
  apiRescheduleMentoringSession,
} from "@/app/Services/mentoring-sessions.service";
import type { AppointmentResponse, TranscriptSummaryResponseDto } from "@/app/Services/types/appointments.types";
import {
  appointmentPlatformLabel,
  formatMeetingIdForDisplay,
  getAppointmentJoinUrl,
  parseGoogleMeetCodeFromUrl,
  parseZoomMeetingIdFromUrl,
  truncateMiddle,
  zoomUrlHasPasscodeQuery,
} from "@/app/utils/meetingLinkDetails";
import { formatSessionTime, getNextSessionId } from "../utils/sessionFlow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type TranscriptSummary = {
  appointmentId: string;
  transcript?: string;
  transcriptSavedAt?: Date;
  summary?: {
    sessionOverview: string;
    keyDiscussionPoints: string[];
    mentorGuidance: string[];
    actionItems: string[];
    followUp: string;
  };
  generatedAt?: Date;
  model?: string;
  cached?: boolean;
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

function unwrapMentoringSessionResponse(res: any) {
  const root = res?.data;
  const payload = root?.data ?? root;
  return payload?.session ?? payload?.mentoringSession ?? payload ?? null;
}

function getEmbeddedAppointment(session: any): AppointmentResponse | null {
  const appointment = session?.appointment || session?.appointmentDetails || null;
  return appointment && typeof appointment === "object" ? (appointment as AppointmentResponse) : null;
}

function getMentoringSessionId(session: any, fallback = "") {
  return getStringValue(session?.id, session?._id, session?.sessionId, fallback);
}

function getSessionAppointmentId(session: any, appointment: AppointmentResponse | null = null) {
  return getStringValue(
    session?.appointmentId,
    session?.appointment?._id,
    session?.appointment?.id,
    session?.appointmentDetails?._id,
    session?.appointmentDetails?.id,
    appointment?._id,
    appointment?.id,
  );
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

export default function MentorMentoringSessionDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const pastorIdFromQuery = search.get("pastorId") || "";

 
  const sessionId = decodeURIComponent(String(params.id || ""));
const isGeneratedSessionId =
  !sessionId || sessionId.startsWith("locked-") || sessionId.startsWith("unscheduled-");
  const queryClient = useQueryClient();

  const [confirm, setConfirm] = useState<{ kind: "complete" | "redo" } | null>(null);
  const [actionLoading, setActionLoading] = useState<"complete" | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState<RescheduleFormState>({
    platform: "zoom",
  });
  const today = new Date();
  const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
  const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState(today.getDate());
  const [rescheduleMonthlyAvailabilitySlots, setRescheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const [tsTab, setTsTab] = useState<"transcript" | "summary">("transcript");
  const detailQuery = useQuery({
    queryKey: ["mentoring-session", sessionId],
    enabled: Boolean(sessionId) && !isGeneratedSessionId,
    retry: false,
    queryFn: async () => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[mentor mentoring-session detail] fetching session", { sessionId });
      }

      const res = await apiGetMentoringSessionById(sessionId);
      const session = unwrapMentoringSessionResponse(res);
      if (!session) return null;
      const appointment = getEmbeddedAppointment(session);
      const sessionRecord = {
        ...session,
        id: getMentoringSessionId(session, sessionId),
        appointmentId: getSessionAppointmentId(session, appointment),
      };

      return {
        session: sessionRecord,
        sessionsForPastor: [sessionRecord],
        appointment,
        pastorId: getStringValue(sessionRecord?.pastorId, sessionRecord?.userId, pastorIdFromQuery),
      };
    },
  });
  const loading = detailQuery.isLoading;

 const rawSession = detailQuery.data?.session ?? null;

const session =
  rawSession ||
  null;
  const sessionsForPastor = detailQuery.data?.sessionsForPastor ?? [];
  const appointment = (detailQuery.data?.appointment ?? null) as AppointmentResponse | null;
  const pastorId = detailQuery.data?.pastorId ?? "";
  const appointmentId = getSessionAppointmentId(session, appointment);

  const rescheduleMentorId = useMemo(() => {
    const mentor = getMentorFromCookie();
    return getStringValue(
      session?.mentorId,
      session?.mentor?._id,
      session?.mentor?.id,
      mentor?.id,
      mentor?._id,
    );
  }, [session]);

  useEffect(() => {
    if (!rescheduleOpen || !rescheduleMentorId) return;

    let cancelled = false;
    setRescheduleAvailabilityLoading(true);

    void axiosInstance
      .get(`/appointments/availability/${rescheduleMentorId}/month`, {
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
  }, [rescheduleOpen, rescheduleMentorId, rescheduleMonth, rescheduleYear]);

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

  useEffect(() => {
    if (!detailQuery.error) return;
    toast.show({ kind: "error", title: "Failed to load session", subtitle: extractApiErrorMessage(detailQuery.error) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.error]);

  const nextSessionId = useMemo(() => {
    const sorted = [...sessionsForPastor].sort((a, b) => a.sessionNumber - b.sessionNumber);
    return getNextSessionId(sorted.map((s) => ({ id: s.id, status: s.status as any, scheduledDate: s.scheduledDate })));
  }, [sessionsForPastor]);

  const meetingLink = useMemo(() => getAppointmentJoinUrl(appointment), [appointment]);
  const platformRaw = String(appointment?.platform ?? "zoom");
  const platformLabel = appointmentPlatformLabel(platformRaw);
  const zoomId = meetingLink ? parseZoomMeetingIdFromUrl(meetingLink) : undefined;
  const meetCode = meetingLink ? parseGoogleMeetCodeFromUrl(meetingLink) : undefined;
  const hasZoomPasscode = meetingLink ? zoomUrlHasPasscodeQuery(meetingLink) : false;

  const chatMessages = useMemo(() => {
    const raw = String(tsData?.transcript ?? "").trim();
    if (!raw) return [] as { speaker: string; text: string; side: "left" | "right" }[];

    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    const parsed = lines.map((line, idx) => {
      const m = line.match(/^([^:]{1,40}):\s*(.+)$/);
      if (m) return { speaker: m[1].trim(), text: m[2].trim(), idx };
      return { speaker: "", text: line, idx };
    });

    const speakers = Array.from(new Set(parsed.map((p) => p.speaker).filter(Boolean))).slice(0, 2);
    const left = speakers[0] || "";
    const right = speakers[1] || "";

    return parsed.map((p) => {
      const side: "left" | "right" =
        p.speaker && right && p.speaker === right ? "right" : "left";
      return { speaker: p.speaker || "Transcript", text: p.text, side };
    });
  }, [tsData?.transcript]);

  const transcriptQuery = useQuery({
    queryKey: ["transcript-summary", appointmentId],
    enabled: !!appointmentId,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) return false;
      if (err?.response?.status === 429) return false;
      return failureCount < 1;
    },
    queryFn: async () => {
      if (!appointmentId) throw new Error("Missing appointment ID");
      const res = await apiGetMentoringSessionTranscriptSummary(appointmentId);
      const data = res.data as TranscriptSummaryResponseDto | { data?: TranscriptSummaryResponseDto };
      return ("data" in data && data.data ? data.data : data) as TranscriptSummaryResponseDto;
    },
  });

  useEffect(() => {
    if (!transcriptQuery.data) return;
    setTsData({
      appointmentId: transcriptQuery.data.appointmentId,
      transcript: transcriptQuery.data.transcript,
      transcriptSavedAt: transcriptQuery.data.transcriptSavedAt,
      summary: transcriptQuery.data.summary,
      generatedAt: transcriptQuery.data.generatedAt,
      model: transcriptQuery.data.model,
      cached: transcriptQuery.data.cached,
    });
    setTsTab((prev) => (prev === "transcript" || prev === "summary" ? prev : "transcript"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptQuery.data]);

  useEffect(() => {
    if (!tsData) return;
    if (tsData.summary && !tsData.transcript?.trim()) {
      setTsTab("summary");
      return;
    }
    if (tsData.transcript?.trim() && !tsData.summary) {
      setTsTab("transcript");
      return;
    }
  }, [tsData]);

  const transcriptMutation = useMutation({
    mutationFn: async (refresh: boolean) => {
      if (!appointmentId) throw new Error("Missing appointment ID");
      const res = await apiGenerateTranscriptSummary(appointmentId, refresh);
      return (res.data?.data ?? res.data) as TranscriptSummaryResponseDto;
    },
    onSuccess: (data) => {
      setTsData({
        appointmentId: data.appointmentId,
        transcript: data.transcript,
        transcriptSavedAt: data.transcriptSavedAt,
        summary: data.summary,
        generatedAt: data.generatedAt,
        model: data.model,
        cached: data.cached,
      });
      void queryClient.setQueryData(["transcript-summary", appointmentId], data);
      toast.show({
        kind: "success",
        title: data.cached ? "Summary loaded from cache" : "Summary generated successfully",
        subtitle: `Model: ${data.model}`,
      });
    },
    onError: (e) => {
      toast.show({ kind: "error", title: "Failed to generate summary", subtitle: extractApiErrorMessage(e) });
      setTsData(null);
    },
  });

  const fetchTranscript = async (refresh: boolean) => {
    if (!appointmentId) {
      toast.show({ kind: "error", title: "Missing appointment ID" });
      return;
    }
    if (transcriptMutation.isPending) return;
    await transcriptMutation.mutateAsync(refresh);
  };

  const openRescheduleDrawer = () => {
    const mentoringSessionId = getMentoringSessionId(session, sessionId);
    if (!mentoringSessionId || mentoringSessionId.startsWith("locked-") || mentoringSessionId.startsWith("unscheduled-")) {
      toast.show({ kind: "error", title: "Missing session info" });
      return;
    }

    setRescheduleForm({
      platform: getStringValue(session?.platform, session?.meetingPlatform, appointment?.platform, "zoom"),
    });
    const now = new Date();
    setRescheduleMonth(now.getMonth());
    setRescheduleYear(now.getFullYear());
    setRescheduleSelectedDate(now.getDate());
    setRescheduleSelectedSlot("");
    setRescheduleMonthlyAvailabilitySlots([]);
    setRescheduleOpen(true);
  };

  const submitReschedule = async () => {
    const mentoringSessionId = getMentoringSessionId(session, sessionId);
    if (!mentoringSessionId || mentoringSessionId.startsWith("locked-") || mentoringSessionId.startsWith("unscheduled-")) {
      toast.show({ kind: "error", title: "Missing session info" });
      return;
    }

    if (!rescheduleSelectedSlot) {
      toast.show({ kind: "error", title: "Choose an available time slot" });
      return;
    }

    try {
      setRescheduleSubmitting(true);
      await apiRescheduleMentoringSession(mentoringSessionId, {
        scheduledDate: rescheduleSelectedSlot,
        ...(rescheduleForm.platform ? { platform: rescheduleForm.platform } : {}),
      });
      toast.show({ kind: "success", title: "Session rescheduled" });
      setRescheduleOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["mentoring-session", sessionId] });
      await detailQuery.refetch();
    } catch (e) {
      toast.show({ kind: "error", title: "Cannot reschedule session", subtitle: extractApiErrorMessage(e) });
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const runAction = async (kind: "complete" | "redo") => {
    if (kind === "redo") {
      openRescheduleDrawer();
      return;
    }

    const mentoringSessionId = getMentoringSessionId(session, sessionId);
    if (!mentoringSessionId || mentoringSessionId.startsWith("locked-") || mentoringSessionId.startsWith("unscheduled-")) {
      toast.show({ kind: "error", title: "Missing session info" });
      return;
    }
    if (!pastorId) {
      toast.show({ kind: "error", title: "Mentor-only action blocked", subtitle: "Pastor context is required." });
      return;
    }
    try {
      setActionLoading("complete");
      await apiCompleteMentoringSession(mentoringSessionId);
      toast.show({ kind: "success", title: "Session completed" });
      await queryClient.invalidateQueries({ queryKey: ["mentoring-session", sessionId] });
    } catch (e) {
      toast.show({ kind: "error", title: "Cannot complete session", subtitle: extractApiErrorMessage(e) });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 text-white/70">Loading…</div>
      </div>
    );
  }

  if (isGeneratedSessionId) {
    return (
      <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">This session is locked/not available yet</div>
            <p className="mt-2 text-sm text-white/60">
              Complete the earlier sessions before opening this session.
            </p>
            <button
              className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              onClick={() => router.push("/mentor/mentoring-session")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Session not found</div>
            <button
              className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              onClick={() => router.push("/mentor/mentoring-session")}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isCurrent = session.id === nextSessionId;
  const isMissedSession = String(session.status).toUpperCase() === "MISSED";
  const isLockedSession = String(session.status).toUpperCase() === "LOCKED";

  return (
    <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
      <MentorHeader showFullHeader />

      <ConfirmModal
        open={confirm != null}
        kind={confirm?.kind ?? "complete"}
        title={confirm?.kind === "redo" ? "Redo this session?" : "Complete this session?"}
        body={
          confirm?.kind === "redo"
            ? "This marks the session for redo. You can continue when ready."
            : "Mark this session as completed? This cannot be undone from here."
        }
        confirmText={confirm?.kind === "redo" ? "Redo" : "Complete"}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const kind = confirm?.kind;
          setConfirm(null);
          if (kind) void runAction(kind);
        }}
        busy={actionLoading != null}
      />

      {rescheduleOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => {
              if (!rescheduleSubmitting) setRescheduleOpen(false);
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
                    Session {session.sessionNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(false)}
                  disabled={rescheduleSubmitting}
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
                      mentorId={rescheduleMentorId}
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
                  onClick={() => setRescheduleOpen(false)}
                  disabled={rescheduleSubmitting}
                  className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={rescheduleSubmitting}
                  onClick={submitReschedule}
                  className="rounded-lg bg-blue-600 px-6 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {rescheduleSubmitting ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-6"> */}
        {/* Header */}
        {/* <div className="flex items-start justify-between gap-3"> */}
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-6">
  <button
    type="button"
    onClick={() => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push("/mentor/mentoring-session");
  }
}}
    className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10 hover:text-white"
  >
    <i className="fa-solid fa-arrow-left" />
    Back
  </button>

  {/* Header */}
  <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm text-white/50">Session {session.sessionNumber}</div>
            <div className="mt-1 text-2xl font-semibold">{session.title}</div>
            <div className="mt-2 text-sm text-white/60">
              {new Date(session.scheduledDate).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" })}{" "}
              · {formatSessionTime(session.scheduledDate) || "Time TBD"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isCurrent ? (
              <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 border border-yellow-400/30">
                Current
              </span>
            ) : null}
            <SessionStatusBadge status={session.status} />
          </div>
        </div>

        {/* Meeting details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-[#8ec5eb] mb-4">Meeting details</div>
          {isMissedSession ? (
  <div className="mb-4 rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-3">
    <p className="text-sm font-semibold text-yellow-100">
      This meeting was missed.
    </p>
    <p className="mt-1 text-xs text-yellow-100/70">
      Reschedule this session before marking it as completed.
    </p>

    <button
      type="button"
      onClick={openRescheduleDrawer}
      disabled={actionLoading != null}
      className="mt-3 rounded-lg border border-green-400/30 bg-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-100 hover:bg-green-500/30"
    >
      Reschedule meeting
    </button>
  </div>
) : null}
          {meetingLink ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-white/60">Platform</span>
                <span className="text-white/90">{platformLabel}</span>
              </div>
              {zoomId ? (
                <div className="flex justify-between gap-3">
                  <span className="text-white/60">Meeting ID</span>
                  <span className="text-white/90 font-mono">{formatMeetingIdForDisplay(zoomId)}</span>
                </div>
              ) : null}
              {meetCode ? (
                <div className="flex justify-between gap-3">
                  <span className="text-white/60">Meet code</span>
                  <span className="text-white/90 font-mono">{meetCode}</span>
                </div>
              ) : null}
              {hasZoomPasscode ? (
                <div className="text-xs text-white/50">Passcode included — will be applied automatically</div>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <span className="text-white/60">Link</span>
                <span className="text-white/80 break-all text-right">{truncateMiddle(meetingLink, 60)}</span>
              </div>
              <button
                type="button"
                onClick={() => window.open(meetingLink, "_blank", "noopener,noreferrer")}
                className="mt-3 w-full rounded-xl bg-white text-[#062946] py-2 font-semibold hover:bg-white/90"
              >
                Join meeting
              </button>
            </div>
          ) : (
            <div className="text-sm text-white/60">Meeting link will appear once added to the appointment.</div>
          )}
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="text-sm font-semibold text-[#8ec5eb] mb-4">Actions</div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setConfirm({ kind: "complete" })}
            disabled={session.status === "COMPLETED" || isMissedSession || isLockedSession || actionLoading != null}
              // className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
              //   session.status === "COMPLETED"
              //     ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
              //     : "bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/25"
              // } ${actionLoading != null ? "opacity-60 cursor-not-allowed" : ""}`}
              className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
  session.status === "COMPLETED" || isMissedSession || isLockedSession
    ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
    : "bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/25"
} ${actionLoading != null ? "opacity-60 cursor-not-allowed" : ""}`}
            >
           {actionLoading === "complete"
  ? "Completing…"
  : session.status === "COMPLETED"
    ? "Completed"
    : "Mark as Completed"}
            </button>

            <button
              type="button"
              onClick={openRescheduleDrawer}
              disabled={actionLoading != null}
              className={`rounded-xl px-4 py-2 text-sm font-semibold border bg-white/5 text-white/80 border-white/15 hover:bg-white/10 ${
                actionLoading != null ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
       Schedule Repeat Session
            </button>

            <a
              href="/mentor/mentoring-session/insights"
              className="rounded-xl px-4 py-2 text-sm font-semibold border bg-white/5 text-white/80 border-white/15 hover:bg-white/10"
            >
              Insights
            </a>
          </div>
        </div>

        {/* Transcript & AI Summary */}
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[#8ec5eb]">Transcript & AI Summary</div>
                
              </div>
              
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#041f35]/40 p-2">
              <button
                type="button"
                onClick={() => setTsTab("transcript")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tsTab === "transcript"
                    ? "bg-white text-[#062946]"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                Transcript
              </button>
              <button
                type="button"
                onClick={() => setTsTab("summary")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tsTab === "summary"
                    ? "bg-white text-[#062946]"
                    : "bg-white/5 text-white/80 hover:bg-white/10"
                }`}
              >
                AI Summary
              </button>
            </div>

            {tsTab === "transcript" ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#041f35]/40 p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white/90">Transcript</div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = String(tsData?.transcript ?? "").trim();
                      if (!text) {
                        toast.show({ kind: "info", title: "Nothing to copy" });
                        return;
                      }
                      void navigator.clipboard.writeText(text);
                      toast.show({ kind: "success", title: "Transcript copied" });
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>

                <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4">
                  {transcriptQuery.isLoading ? (
                    <div className="space-y-2">
                      <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {chatMessages.length ? (
                        chatMessages.map((m, i) => (
                          <div
                            key={`${m.speaker}-${i}`}
                            className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[92%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed shadow-sm border ${
                                m.side === "right"
                                  ? "bg-emerald-500/15 border-emerald-400/20 text-emerald-50"
                                  : "bg-white/8 border-white/10 text-white/85"
                              }`}
                            >
                              {m.speaker ? (
                                <div
                                  className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                                    m.side === "right" ? "text-emerald-200/80" : "text-white/55"
                                  }`}
                                >
                                  {m.speaker}
                                </div>
                              ) : null}
                              <div className="whitespace-pre-wrap">{m.text}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-white/60">
                          No transcript available yet.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#041f35]/40 p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-white/90">AI Summary</div>
                  <button
                    type="button"
                    onClick={() => {
                      const s = tsData?.summary;
                      if (!s) {
                        toast.show({ kind: "info", title: "Nothing to copy" });
                        return;
                      }
                      const lines = [
                        s.sessionOverview ? `Session Overview:\n${s.sessionOverview}` : "",
                        s.keyDiscussionPoints?.length ? `\nKey Discussion Points:\n- ${s.keyDiscussionPoints.join("\n- ")}` : "",
                        s.mentorGuidance?.length ? `\nMentor Guidance:\n- ${s.mentorGuidance.join("\n- ")}` : "",
                        s.actionItems?.length ? `\nAction Items:\n- ${s.actionItems.join("\n- ")}` : "",
                        s.followUp ? `\nFollow-up:\n${s.followUp}` : "",
                      ]
                        .filter(Boolean)
                        .join("\n");
                      void navigator.clipboard.writeText(lines.trim());
                      toast.show({ kind: "success", title: "Summary copied" });
                    }}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
                  >
                    Copy
                  </button>
                </div>

                <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4">
                  {transcriptQuery.isLoading ? (
                    <div className="space-y-3">
                      <div className="h-4 w-7/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-6/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
                      <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
                    </div>
                  ) : tsData?.summary ? (
                    <div className="space-y-4 text-sm leading-relaxed text-white/80">
                      {tsData.summary.sessionOverview ? (
                        <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">Session overview</div>
                          <div className="mt-2 text-white/85">{tsData.summary.sessionOverview}</div>
                        </div>
                      ) : null}

                      {tsData.summary.keyDiscussionPoints?.length ? (
                        <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">Key discussion points</div>
                          <ul className="mt-2 space-y-2">
                            {tsData.summary.keyDiscussionPoints.map((x) => (
                              <li key={x} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-200/80" />
                                <span className="text-white/85">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {tsData.summary.mentorGuidance?.length ? (
                        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">Mentor guidance</div>
                          <ul className="mt-2 space-y-2">
                            {tsData.summary.mentorGuidance.map((x) => (
                              <li key={x} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                                <span className="text-white/85">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {tsData.summary.actionItems?.length ? (
                        <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">Action items</div>
                          <ul className="mt-2 space-y-2">
                            {tsData.summary.actionItems.map((x) => (
                              <li key={x} className="flex gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300/80" />
                                <span className="text-white/85">{x}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {tsData.summary.followUp ? (
                        <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/10 p-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200/80">Follow-up</div>
                          <div className="mt-2 text-white/85">{tsData.summary.followUp}</div>
                        </div>
                      ) : null}

                      {!tsData.summary.sessionOverview &&
                      !tsData.summary.keyDiscussionPoints?.length &&
                      !tsData.summary.mentorGuidance?.length &&
                      !tsData.summary.actionItems?.length &&
                      !tsData.summary.followUp ? (
                        <div className="text-sm text-white/60">Summary is being generated or temporarily unavailable.</div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="text-sm text-white/60">No summary yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

