"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import ConfirmModal from "@/app/Components/ui/ConfirmModal";
import { useToast } from "@/app/Components/ui/Toast";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { apiGenerateTranscriptSummary, apiGetTranscriptSummary } from "@/app/Services/appointments.service";
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
import { useMentorSessionActions, useMentorSessionDetailQuery } from "../hooks/useMentorshipQueries";

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

export default function MentorMentoringSessionDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const search = useSearchParams();
  const pastorIdFromQuery = search.get("pastorId") || "";
  const sessionNumberFromQuery = Number(search.get("sessionNumber") || "");
  const titleFromQuery = search.get("title") || "";
const statusFromQuery = search.get("status") || "";
const scheduledDateFromQuery = search.get("scheduledDate") || "";

  // const sessionId = decodeURIComponent(params.id);
  const sessionId = decodeURIComponent(params.id);
const isGeneratedSessionId = sessionId.startsWith("locked-");
  const queryClient = useQueryClient();

  const [confirm, setConfirm] = useState<{ kind: "complete" | "redo" } | null>(null);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const [tsTab, setTsTab] = useState<"transcript" | "summary">("transcript");
  // const detailQuery = useMentorSessionDetailQuery(sessionId, pastorIdFromQuery);
  const detailQuery = useMentorSessionDetailQuery(
  isGeneratedSessionId ? "" : sessionId,
  pastorIdFromQuery
);
  const { completeMutation, redoMutation, actionLoading } = useMentorSessionActions(sessionId);
  const loading = detailQuery.isLoading;
  // const session = detailQuery.data?.session ?? null;
 const rawSession = detailQuery.data?.session ?? null;

const fallbackSession =
  isGeneratedSessionId && sessionNumberFromQuery
    ? {
        id: sessionId,
        appointmentId: "",
        pastorId: pastorIdFromQuery,
        sessionNumber: sessionNumberFromQuery,
        title: titleFromQuery || `Session ${sessionNumberFromQuery}`,
        status: statusFromQuery || "LOCKED",
        scheduledDate: scheduledDateFromQuery,
      }
    : null;

const session =
  rawSession ||
  detailQuery.data?.sessionsForPastor?.find(
    (s) => Number(s.sessionNumber) === sessionNumberFromQuery
  ) ||
  fallbackSession ||
  null;
  const sessionsForPastor = detailQuery.data?.sessionsForPastor ?? [];
  const appointment = (detailQuery.data?.appointment ?? null) as AppointmentResponse | null;
  const pastorId = detailQuery.data?.pastorId ?? "";

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
    queryKey: ["transcript-summary", String(session?.appointmentId ?? "")],
    enabled: !!session?.appointmentId,
    staleTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const err = error as { response?: { status?: number } };
      if (err?.response?.status === 404) return false;
      if (err?.response?.status === 429) return false;
      return failureCount < 1;
    },
    queryFn: async () => {
      const appointmentId = String(session?.appointmentId ?? "").trim();
      if (!appointmentId) throw new Error("Missing appointment ID");
      const res = await apiGetTranscriptSummary(appointmentId);
      return (res.data?.data ?? res.data) as TranscriptSummaryResponseDto;
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
      if (!session?.appointmentId) throw new Error("Missing appointment ID");
      const res = await apiGenerateTranscriptSummary(String(session.appointmentId), refresh);
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
      void queryClient.setQueryData(["transcript-summary", String(session?.appointmentId ?? "")], data);
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
    if (!session?.appointmentId) {
      toast.show({ kind: "error", title: "Missing appointment ID" });
      return;
    }
    if (transcriptMutation.isPending) return;
    await transcriptMutation.mutateAsync(refresh);
  };

  const runAction = async (kind: "complete" | "redo") => {
    if (!session?.appointmentId) {
      toast.show({ kind: "error", title: "Missing appointment/pastor info" });
      return;
    }
    if (!pastorId) {
      toast.show({ kind: "error", title: "Mentor-only action blocked", subtitle: "Pastor context is required." });
      return;
    }
    try {
      if (kind === "complete") {
        await completeMutation.mutateAsync({ appointmentId: String(session.appointmentId) });
        toast.show({ kind: "success", title: "Session completed" });
      } else {
        await redoMutation.mutateAsync({ appointmentId: String(session.appointmentId) });
        toast.show({ kind: "success", title: "Redo scheduled" });
        router.push(`/mentor/mentoring-session?pastorId=${encodeURIComponent(pastorId)}`);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["mentorship-sessions"] });
      await queryClient.invalidateQueries({ queryKey: ["mentorship-session", sessionId] });
    } catch (e) {
      toast.show({ kind: "error", title: kind === "complete" ? "Cannot complete session" : "Cannot redo session", subtitle: extractApiErrorMessage(e) });
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

      <div className="mx-auto max-w-6xl px-4 md:px-8 py-10 space-y-6">
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
      onClick={() => setConfirm({ kind: "redo" })}
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

