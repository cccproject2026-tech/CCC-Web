"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import MentorHeader from "@/app/Components/MentorHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import ConfirmModal from "@/app/Components/ui/ConfirmModal";
import { useToast } from "@/app/Components/ui/Toast";
import { extractApiErrorMessage, appointmentEntityId, unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import {
  apiCompleteMentorshipSession,
  apiRedoMentorshipSession,
  apiGetMentorshipSessionsNormalized,
  type MentorshipSession,
} from "@/app/Services/roadmaps.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetMentorSchedule, apiGetUserSchedule, apiGenerateTranscriptSummary } from "@/app/Services/appointments.service";
import type { AppointmentResponse } from "@/app/Services/types/appointments.types";
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

type TranscriptSummary = {
  transcript?: string;
  summary?: {
    overview?: string;
    keyPoints?: string[];
    advice?: string[];
    actionItems?: string[];
    nextFocus?: string[];
  };
};

export default function MentorMentoringSessionDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const pastorIdFromQuery = search.get("pastorId") || "";

  const sessionId = decodeURIComponent(params.id);

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<(MentorshipSession & { pastorId?: string; pastorName?: string }) | null>(null);
  const [sessionsForPastor, setSessionsForPastor] = useState<MentorshipSession[]>([]);
  const [appointment, setAppointment] = useState<AppointmentResponse | null>(null);

  const [confirm, setConfirm] = useState<{ kind: "complete" | "redo" } | null>(null);
  const [actionLoading, setActionLoading] = useState<"complete" | "redo" | null>(null);

  const [tsLoading, setTsLoading] = useState(false);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);

  const nextSessionId = useMemo(() => {
    const sorted = [...sessionsForPastor].sort((a, b) => a.sessionNumber - b.sessionNumber);
    return getNextSessionId(sorted.map((s) => ({ id: s.id, status: s.status as any, scheduledDate: s.scheduledDate })));
  }, [sessionsForPastor]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        // mentorId from cookie
        const mentorCookie = Cookies.get("mentor");
        if (!mentorCookie) throw new Error("Mentor information not found");
        const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
        const mentorId = String(mentorData?.id ?? "").trim();
        if (!mentorId) throw new Error("Mentor ID not found");

        // Find pastorId: prefer query param, else search all assigned pastors.
        let pastorId = pastorIdFromQuery;
        let sessions: MentorshipSession[] = [];

        if (pastorId) {
          sessions = await apiGetMentorshipSessionsNormalized(pastorId);
        } else {
          const assignedUsersResponse = await apiGetAssignedUsers(mentorId);
          const assignedPastors = assignedUsersResponse.data?.data || [];
          for (const p of assignedPastors) {
            const pid = String(p?._id ?? "").trim();
            if (!pid) continue;
            const list = await apiGetMentorshipSessionsNormalized(pid);
            const found = list.find((s) => s.id === sessionId);
            if (found) {
              pastorId = pid;
              sessions = list;
              break;
            }
          }
        }

        setSessionsForPastor(sessions);
        const found = sessions.find((s) => s.id === sessionId) ?? null;
        if (!found) {
          setSession(null);
          return;
        }
        setSession({ ...found, pastorId });

        // Appointment enrichment (mobile-like): fetch both mentor + pastor schedules and find appointmentId.
        const apptId = found.appointmentId ? String(found.appointmentId) : "";
        if (!apptId) {
          setAppointment(null);
          return;
        }

        const [mentorSched, pastorSched] = await Promise.all([
          apiGetMentorSchedule(mentorId),
          pastorId ? apiGetUserSchedule(pastorId) : Promise.resolve({ data: [] } as any),
        ]);

        const merged = [
          ...unwrapAppointmentsAxiosData(mentorSched),
          ...unwrapAppointmentsAxiosData(pastorSched),
        ] as AppointmentResponse[];

        const match =
          merged.find((a) => appointmentEntityId(a) === apptId) ??
          merged.find((a) => String((a as any)?._id ?? (a as any)?.id) === apptId) ??
          null;

        setAppointment(match);
      } catch (e) {
        toast.show({ kind: "error", title: "Failed to load session", subtitle: extractApiErrorMessage(e) });
        setSession(null);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, pastorIdFromQuery]);

  const meetingLink = useMemo(() => getAppointmentJoinUrl(appointment), [appointment]);
  const platformRaw = String(appointment?.platform ?? "zoom");
  const platformLabel = appointmentPlatformLabel(platformRaw);
  const zoomId = meetingLink ? parseZoomMeetingIdFromUrl(meetingLink) : undefined;
  const meetCode = meetingLink ? parseGoogleMeetCodeFromUrl(meetingLink) : undefined;
  const hasZoomPasscode = meetingLink ? zoomUrlHasPasscodeQuery(meetingLink) : false;

  const fetchTranscript = async (refresh: boolean) => {
    if (!session?.appointmentId) {
      toast.show({ kind: "error", title: "Missing appointment ID" });
      return;
    }
    setTsLoading(true);
    try {
      const res = await apiGenerateTranscriptSummary(String(session.appointmentId), refresh);
      const data = res.data?.data ?? res.data;
      setTsData({
        transcript: data?.transcript,
        summary: data?.summary,
      });
    } catch (e) {
      // Mobile behavior: summary failures shouldn't block transcript.
      toast.show({ kind: "error", title: "Failed to generate summary", subtitle: extractApiErrorMessage(e) });
      setTsData(null);
    } finally {
      setTsLoading(false);
    }
  };

  const runAction = async (kind: "complete" | "redo") => {
    if (!session?.appointmentId || !session.pastorId) {
      toast.show({ kind: "error", title: "Missing appointment/pastor info" });
      return;
    }
    setActionLoading(kind);
    try {
      if (kind === "complete") {
        await apiCompleteMentorshipSession(String(session.appointmentId));
        toast.show({ kind: "success", title: "Session completed" });
        setSession((prev) => (prev ? { ...prev, status: "COMPLETED" as any } : prev));
      } else {
        await apiRedoMentorshipSession(String(session.appointmentId));
        toast.show({ kind: "success", title: "Redo scheduled" });
        // mobile: navigate away because session list may change after redo
        router.push(`/mentor/mentoring-session?pastorId=${encodeURIComponent(session.pastorId)}`);
        return;
      }
      // Refresh this pastor’s sessions without page reload.
      const updated = await apiGetMentorshipSessionsNormalized(session.pastorId);
      setSessionsForPastor(updated);
    } catch (e) {
      toast.show({ kind: "error", title: kind === "complete" ? "Cannot complete session" : "Cannot redo session", subtitle: extractApiErrorMessage(e) });
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

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 space-y-6">
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
              disabled={session.status === "COMPLETED" || actionLoading != null}
              className={`rounded-xl px-4 py-2 text-sm font-semibold border ${
                session.status === "COMPLETED"
                  ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                  : "bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/25"
              } ${actionLoading != null ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {actionLoading === "complete" ? "Completing…" : session.status === "COMPLETED" ? "Completed" : "Mark as Completed"}
            </button>

            <button
              type="button"
              onClick={() => setConfirm({ kind: "redo" })}
              disabled={actionLoading != null}
              className={`rounded-xl px-4 py-2 text-sm font-semibold border bg-white/5 text-white/80 border-white/15 hover:bg-white/10 ${
                actionLoading != null ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {actionLoading === "redo" ? "Scheduling…" : "Schedule Repeat Session"}
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
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-[#8ec5eb]">Transcript & AI Summary</div>
              <div className="mt-1 text-xs text-white/60">Generates or refreshes summary using the transcript-summary API.</div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void fetchTranscript(false)}
                disabled={tsLoading}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
              >
                {tsLoading ? "Loading…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => void fetchTranscript(true)}
                disabled={tsLoading}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold mb-2">Transcript</div>
              <pre className="whitespace-pre-wrap text-xs text-white/70 max-h-[360px] overflow-auto">
                {tsData?.transcript?.trim() ? tsData.transcript : "No transcript available yet."}
              </pre>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold mb-2">AI Summary</div>
              {tsData?.summary ? (
                <div className="space-y-4 text-sm text-white/70">
                  {tsData.summary.overview ? (
                    <div>
                      <div className="font-semibold text-white/80">Overview</div>
                      <div>{tsData.summary.overview}</div>
                    </div>
                  ) : null}
                  {tsData.summary.keyPoints?.length ? (
                    <div>
                      <div className="font-semibold text-white/80">Key points</div>
                      <ul className="list-disc list-inside">
                        {tsData.summary.keyPoints.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {tsData.summary.advice?.length ? (
                    <div>
                      <div className="font-semibold text-white/80">Advice</div>
                      <ul className="list-disc list-inside">
                        {tsData.summary.advice.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {tsData.summary.actionItems?.length ? (
                    <div>
                      <div className="font-semibold text-white/80">Action items</div>
                      <ul className="list-disc list-inside">
                        {tsData.summary.actionItems.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {tsData.summary.nextFocus?.length ? (
                    <div>
                      <div className="font-semibold text-white/80">Next focus</div>
                      <ul className="list-disc list-inside">
                        {tsData.summary.nextFocus.map((x) => (
                          <li key={x}>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {!tsData.summary.overview &&
                  !tsData.summary.keyPoints?.length &&
                  !tsData.summary.advice?.length &&
                  !tsData.summary.actionItems?.length &&
                  !tsData.summary.nextFocus?.length ? (
                    <div>Summary is being generated or temporarily unavailable.</div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-white/60">No summary yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

