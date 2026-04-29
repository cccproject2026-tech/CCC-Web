"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { usePastorSessionDetailQuery } from "@/app/mentor/mentoring-session/hooks/useMentorshipQueries";

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

export default function PastorMentoringSessionDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const sessionId = decodeURIComponent(params.id);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const detailQuery = usePastorSessionDetailQuery(sessionId);
  const loading = detailQuery.isLoading;
  const session = detailQuery.data?.session ?? null;
  const sessions = detailQuery.data?.sessions ?? [];
  const appointment = (detailQuery.data?.appointment ?? null) as AppointmentResponse | null;

  useEffect(() => {
    if (!detailQuery.error) return;
    toast.show({ kind: "error", title: "Failed to load session", subtitle: extractApiErrorMessage(detailQuery.error) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.error]);

  const nextSessionId = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
    return getNextSessionId(sorted.map((s) => ({ id: s.id, status: s.status as any, scheduledDate: s.scheduledDate })));
  }, [sessions]);

  const meetingLink = useMemo(() => getAppointmentJoinUrl(appointment), [appointment]);
  const platformRaw = String(appointment?.platform ?? "zoom");
  const platformLabel = appointmentPlatformLabel(platformRaw);
  const zoomId = meetingLink ? parseZoomMeetingIdFromUrl(meetingLink) : undefined;
  const meetCode = meetingLink ? parseGoogleMeetCodeFromUrl(meetingLink) : undefined;
  const hasZoomPasscode = meetingLink ? zoomUrlHasPasscodeQuery(meetingLink) : false;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcriptQuery.data]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
        <PastorHeader showFullHeader />
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10 text-white/70">Loading…</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans]">
        <PastorHeader showFullHeader />
        <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Session not found</div>
            <button
              className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
              onClick={() => router.push("/pastor/mentoring-session")}
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
      <PastorHeader showFullHeader />

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

        {/* Transcript & AI Summary */}
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-[#8ec5eb]">Transcript & AI Summary</div>
                {tsData?.model ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70">
                    Model: {tsData.model}
                  </span>
                ) : null}
                {tsData?.cached ? (
                  <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                    Cached
                  </span>
                ) : null}
                {tsData?.generatedAt ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/60">
                    Updated {new Date(tsData.generatedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>
              <div className="mt-1 text-xs text-white/60">
                We automatically load any existing transcript/summary. Use Generate/Refresh if you need to create or update it.
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => void fetchTranscript(false)}
                disabled={transcriptMutation.isPending}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-white/90 disabled:opacity-60"
              >
                {transcriptMutation.isPending ? "Working…" : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => void fetchTranscript(true)}
                disabled={transcriptMutation.isPending}
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10 disabled:opacity-60"
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#041f35]/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
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

              <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-white/5 p-3">
                {transcriptQuery.isLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-[12px] leading-relaxed text-white/75">
                    {tsData?.transcript?.trim()
                      ? tsData.transcript
                      : "No transcript available yet. If the session is completed, try Generate."}
                  </pre>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#041f35]/40 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
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

              <div className="max-h-[420px] overflow-auto rounded-xl border border-white/10 bg-white/5 p-4">
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
                  <div className="space-y-5 text-sm leading-relaxed text-white/75">
                    {tsData.summary.sessionOverview ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Session overview</div>
                        <div className="mt-1">{tsData.summary.sessionOverview}</div>
                      </div>
                    ) : null}

                    {tsData.summary.keyDiscussionPoints?.length ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Key discussion points</div>
                        <ul className="mt-2 space-y-1.5">
                          {tsData.summary.keyDiscussionPoints.map((x) => (
                            <li key={x} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8ec5eb]" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {tsData.summary.mentorGuidance?.length ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Mentor guidance</div>
                        <ul className="mt-2 space-y-1.5">
                          {tsData.summary.mentorGuidance.map((x) => (
                            <li key={x} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {tsData.summary.actionItems?.length ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Action items</div>
                        <ul className="mt-2 space-y-1.5">
                          {tsData.summary.actionItems.map((x) => (
                            <li key={x} className="flex gap-2">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300/80" />
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {tsData.summary.followUp ? (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-white/60">Follow-up</div>
                        <div className="mt-1">{tsData.summary.followUp}</div>
                      </div>
                    ) : null}

                    {!tsData.summary.sessionOverview &&
                    !tsData.summary.keyDiscussionPoints?.length &&
                    !tsData.summary.mentorGuidance?.length &&
                    !tsData.summary.actionItems?.length &&
                    !tsData.summary.followUp ? (
                      <div className="text-sm text-white/60">
                        Summary is being generated or temporarily unavailable. Try Refresh.
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="text-sm text-white/60">
                    No summary yet. If the session is completed, click Generate.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <button
          className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
          onClick={() => router.push("/pastor/mentoring-session")}
        >
          Back
        </button>
      </div>
    </div>
  );
}

