"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Cookies from "js-cookie";
import MentorHeader from "@/app/Components/MentorHeader";
import { useToast } from "@/app/Components/ui/Toast";
import {
  extractApiErrorMessage,
  appointmentEntityId,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import {
  apiGetMentorSchedule,
  apiGenerateTranscriptSummary,
} from "@/app/Services/appointments.service";
import type {
  AppointmentResponse,
  TranscriptSummaryResponseDto,
} from "@/app/Services/types/appointments.types";
import UserProfile from "../../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

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

function getPlatformIcon(platform: string) {
  switch (String(platform).toLowerCase()) {
    case "zoom":
      return "fa-brands fa-zoom";
    case "google-meet":
    case "gmeet":
      return "fa-brands fa-google";
    case "teams":
      return "fa-brands fa-microsoft";
    case "phone":
      return "fa-solid fa-phone";
    case "in-person":
      return "fa-solid fa-location-dot";
    default:
      return "fa-solid fa-video";
  }
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status).toLowerCase();
  const styles: Record<string, string> = {
    completed: "bg-green-500/20 text-green-300 border-green-400/30",
    scheduled: "bg-blue-500/20 text-blue-300 border-blue-400/30",
    cancelled: "bg-red-500/20 text-red-300 border-red-400/30",
    rescheduled: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
  };
  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-[11px] font-semibold capitalize ${
        styles[s] ?? "bg-white/10 text-white/70 border-white/20"
      }`}
    >
      {status}
    </span>
  );
}

export default function MentorAppointmentDetailPage() {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const apptId = decodeURIComponent(params.id);

  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState<AppointmentResponse | null>(null);

  const [tsLoading, setTsLoading] = useState(false);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  // ── Fetch appointment ─────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);

        const mentorCookie = Cookies.get("mentor");
        if (!mentorCookie) throw new Error("Mentor information not found");
        const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
        const mentorId = String(mentorData?.id ?? mentorData?._id ?? "").trim();
        if (!mentorId) throw new Error("Mentor ID not found");

        const res = await apiGetMentorSchedule(mentorId);
        const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];

        const found =
          list.find((a) => appointmentEntityId(a) === apptId) ??
          list.find((a) => String((a as any)._id ?? (a as any).id) === apptId) ??
          null;

        setAppt(found);
      } catch (e) {
        toast.show({
          kind: "error",
          title: "Failed to load appointment",
          subtitle: extractApiErrorMessage(e),
        });
        setAppt(null);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptId]);

  // ── Transcript / AI Summary ───────────────────────────────────────────────
  const fetchTranscript = async (refresh: boolean) => {
    setTsLoading(true);
    try {
      const res = await apiGenerateTranscriptSummary(apptId, refresh);
      const data = (res.data?.data ?? res.data) as TranscriptSummaryResponseDto;
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
        title: data.cached ? "Summary loaded from cache" : "Summary generated",
        subtitle: `Model: ${data.model}`,
      });
    } catch (e) {
      toast.show({
        kind: "error",
        title: "Failed to generate summary",
        subtitle: extractApiErrorMessage(e),
      });
    } finally {
      setTsLoading(false);
    }
  };

  // ── Loading / not found states ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-white/50">Loading…</div>
      </div>
    );
  }

  if (!appt) {
    return (
      <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-base font-semibold">Appointment not found</p>
            <button
              onClick={() => router.push("/mentor/MentorSchedule")}
              className="mt-4 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10"
            >
              Back to Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  const person: any = appt.user ?? appt.userId ?? {};
  const meetingDate = new Date(appt.meetingDate);
  const meetLink = appt.meetingLink || appt.zoomJoinUrl || "";
  const isCompleted = String(appt.status).toLowerCase() === "completed";

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader />

      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 md:px-8">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/mentor/MentorSchedule")}
          className="flex items-center gap-2 text-sm text-[#8ec5eb] hover:text-white"
        >
          <i className="fa-solid fa-arrow-left" />
          Back to Schedule
        </button>

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <Image
                src={person.profilePicture || UserProfile}
                alt="pastor"
                width={52}
                height={52}
                className="rounded-full border border-white/20"
              />
              <div>
                <p className="text-base font-bold text-white">
                  {person.firstName} {person.lastName}
                </p>
                <p className="text-[12px] capitalize text-[#8ec5eb]">
                  {String(person.role ?? "Pastor")}
                </p>
              </div>
            </div>
            <StatusBadge status={appt.status} />
          </div>
        </div>

        {/* ── Meeting details ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="mb-4 text-sm font-semibold text-[#8ec5eb]">Meeting details</p>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <i className="fa-regular fa-calendar text-[#8ec5eb] w-4 text-center" />
              <div>
                <p className="text-[11px] text-white/50">Date</p>
                <p className="text-white">
                  {meetingDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <i className="fa-regular fa-clock text-[#8ec5eb] w-4 text-center" />
              <div>
                <p className="text-[11px] text-white/50">Time</p>
                <p className="text-white">
                  {meetingDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <i className={`${getPlatformIcon(appt.platform)} text-[#8ec5eb] w-4 text-center`} />
              <div>
                <p className="text-[11px] text-white/50">Platform</p>
                <p className="capitalize text-white">{appt.platform}</p>
              </div>
            </div>

            {appt.endTime ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <i className="fa-regular fa-hourglass text-[#8ec5eb] w-4 text-center" />
                <div>
                  <p className="text-[11px] text-white/50">End Time</p>
                  <p className="text-white">
                    {(() => { const d = new Date(appt.endTime as string); return isNaN(d.getTime()) ? String(appt.endTime) : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }); })()}
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Meeting link */}
          {meetLink ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 px-4 py-2.5">
              <i className="fa-solid fa-link shrink-0 text-[#8ec5eb]" />
              <a
                href={meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-medium text-[#8ec5eb] hover:underline"
              >
                {meetLink}
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(meetLink).then(() => {
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  });
                }}
                className="ml-1 shrink-0 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-white/20"
              >
                {linkCopied ? (
                  <span className="flex items-center gap-1 text-green-300"><i className="fa-solid fa-check" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1"><i className="fa-regular fa-copy" /> Copy</span>
                )}
              </button>
            </div>
          ) : (
            <p className="mt-4 text-[12px] text-white/40">No meeting link available.</p>
          )}
        </div>

        {/* ── Notes ──────────────────────────────────────────────────────── */}
        {appt.notes ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="mb-3 text-sm font-semibold text-[#8ec5eb]">Notes</p>
            {/* <p className="text-sm text-white/80">{appt.notes}</p> */}
            <p className="text-sm text-white/80">
  {String(appt.notes || "").includes("assessmentId:")
    ? "Roadmap assessment meeting"
    : appt.notes}
</p>
          </div>
        ) : null}

        {/* ── Transcript & AI Summary (completed only) ────────────────────── */}
        {isCompleted ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#8ec5eb]">Transcript &amp; AI Summary</p>
                <p className="mt-1 text-xs text-white/50">
                  Generate or refresh the AI summary for this session.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void fetchTranscript(false)}
                  disabled={tsLoading}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  {tsLoading ? "Loading…" : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={() => void fetchTranscript(true)}
                  disabled={tsLoading}
                  className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Transcript */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-semibold text-white">Transcript</p>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs text-white/70">
                  {tsData?.transcript?.trim() ? tsData.transcript : "No transcript available yet."}
                </pre>
              </div>

              {/* AI Summary */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-semibold text-white">AI Summary</p>
                {tsData?.summary ? (
                  <div className="space-y-4 text-sm text-white/70">
                    {tsData.summary.sessionOverview ? (
                      <div>
                        <p className="font-semibold text-white/85">Session Overview</p>
                        <p>{tsData.summary.sessionOverview}</p>
                      </div>
                    ) : null}
                    {tsData.summary.keyDiscussionPoints?.length ? (
                      <div>
                        <p className="font-semibold text-white/85">Key Discussion Points</p>
                        <ul className="list-inside list-disc space-y-0.5">
                          {tsData.summary.keyDiscussionPoints.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {tsData.summary.mentorGuidance?.length ? (
                      <div>
                        <p className="font-semibold text-white/85">Mentor Guidance</p>
                        <ul className="list-inside list-disc space-y-0.5">
                          {tsData.summary.mentorGuidance.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {tsData.summary.actionItems?.length ? (
                      <div>
                        <p className="font-semibold text-white/85">Action Items</p>
                        <ul className="list-inside list-disc space-y-0.5">
                          {tsData.summary.actionItems.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {tsData.summary.followUp ? (
                      <div>
                        <p className="font-semibold text-white/85">Follow-up</p>
                        <p>{tsData.summary.followUp}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-sm text-white/50">No summary yet. Hit "Generate" above.</p>
                )}
              </div>
            </div>

            {tsData?.generatedAt ? (
              <p className="mt-3 text-[11px] text-white/30">
                Generated {new Date(tsData.generatedAt).toLocaleString()} · model: {tsData.model}{" "}
                {tsData.cached ? "· cached" : ""}
              </p>
            ) : null}
          </div>
        ) : null}

      </div>
    </div>
  );
}
