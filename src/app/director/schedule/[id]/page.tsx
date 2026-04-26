"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";
import {
  apiGetAppointments,
  apiGenerateTranscriptSummary,
} from "@/app/Services/appointments.service";
import {
  appointmentEntityId,
  extractApiErrorMessage,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import { isRemoteImageSrc } from "@/app/utils/image";
import UserProfile from "../../../Assets/user-profile.png";
import type { AppointmentResponse, TranscriptSummaryResponseDto } from "@/app/Services/types";
import "@fortawesome/fontawesome-free/css/all.min.css";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelPerson(p: any, fallback: string): string {
  if (!p || typeof p === "string") return fallback;
  const n = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return n || p.email || fallback;
}

function getPlatformIcon(platform: string) {
  switch (String(platform).toLowerCase()) {
    case "zoom": return "fa-brands fa-zoom";
    case "google-meet":
    case "gmeet": return "fa-brands fa-google";
    case "teams": return "fa-brands fa-microsoft";
    case "phone": return "fa-solid fa-phone";
    case "in-person": return "fa-solid fa-location-dot";
    default: return "fa-solid fa-video";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DirectorAppointmentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const apptId = decodeURIComponent(params.id);

  const [loading, setLoading] = useState(true);
  const [appt, setAppt] = useState<AppointmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [tsLoading, setTsLoading] = useState(false);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const [tsError, setTsError] = useState<string | null>(null);

  // ── Fetch appointment ─────────────────────────────────────────────────────
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // Directors see all appointments — fetch without futureOnly filter
        const res = await apiGetAppointments({ futureOnly: false });
        const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];

        const found =
          list.find((a) => appointmentEntityId(a) === apptId) ??
          list.find((a) => String((a as any)._id ?? (a as any).id) === apptId) ??
          null;

        setAppt(found);
        if (!found) setError("Appointment not found.");
      } catch (e) {
        setError(extractApiErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptId]);

  // ── Generate / refresh transcript summary ────────────────────────────────
  const fetchTranscript = async (refresh: boolean) => {
    setTsLoading(true);
    setTsError(null);
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
    } catch (e) {
      setTsError(extractApiErrorMessage(e));
    } finally {
      setTsLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={directorPageRoot}>
        <div className="flex flex-1 items-center justify-center py-20">
          <div className={directorSpinner} />
        </div>
      </div>
    );
  }

  // ── Error / not found ─────────────────────────────────────────────────────
  if (error || !appt) {
    return (
      <div className={directorPageRoot}>
        <div className="mx-auto w-full max-w-4xl space-y-4 py-8">
          <div className={`${directorGlassCard} p-6`}>
            <p className="text-sm text-white/70">{error ?? "Appointment not found."}</p>
            <button
              type="button"
              onClick={() => router.push("/director/schedule?tab=appointment-history")}
              className={`${directorBtnSecondary} mt-4 px-4 py-2 text-sm`}
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const mentor: any = appt.mentor ?? (typeof appt.mentorId === "object" ? appt.mentorId : null);
  const mentee: any = appt.user ?? (typeof appt.userId === "object" ? appt.userId : null);
  const mentorName = labelPerson(mentor, "Mentor");
  const menteeName = labelPerson(mentee, "Mentee");
  const mentorProfileId = typeof appt.mentorId === "string" ? appt.mentorId : mentor?._id;
  const menteeProfileId = typeof appt.userId === "string" ? appt.userId : mentee?._id;
  const meetingDate = new Date(appt.meetingDate);
  const meetLink = appt.meetingLink || appt.zoomJoinUrl || "";
  const isCompleted = String(appt.status).toLowerCase() === "completed";

  return (
    <div className={directorPageRoot}>
      <div className="mx-auto w-full max-w-4xl space-y-5 py-6">

        {/* Back */}
        <button
          type="button"
          onClick={() => router.push("/director/schedule?tab=appointment-history")}
          className="flex items-center gap-2 text-sm text-[#8ec5eb] hover:text-white"
        >
          <i className="fa-solid fa-arrow-left" />
          Back to Appointment History
        </button>

        {/* ── Header card ───────────────────────────────────────────────── */}
        <div className={`${directorGlassCard} p-6`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            {/* Mentor */}
            <div className="flex items-center gap-4">
              <Image
                src={mentor?.profilePicture || UserProfile}
                alt={mentorName}
                width={52}
                height={52}
                unoptimized={mentor?.profilePicture ? isRemoteImageSrc(mentor.profilePicture) : false}
                className="rounded-full border border-white/20"
              />
              <div>
                <p className="text-base font-bold text-white">
                  {mentorProfileId ? (
                    <Link href={`/director/mentors/profile/${encodeURIComponent(mentorProfileId)}`} className="hover:text-[#8ec5eb]">
                      {mentorName}
                    </Link>
                  ) : mentorName}
                </p>
                <p className="text-[12px] capitalize text-[#8ec5eb]">Mentor</p>
              </div>
            </div>

            <StatusBadge status={appt.status} />
          </div>

          {/* Mentee row */}
          {menteeName && (
            <div className="mt-4 flex items-center gap-3">
              <Image
                src={mentee?.profilePicture || UserProfile}
                alt={menteeName}
                width={36}
                height={36}
                unoptimized={mentee?.profilePicture ? isRemoteImageSrc(mentee.profilePicture) : false}
                className="rounded-full border border-white/20"
              />
              <div>
                <p className="text-sm font-semibold text-white">
                  {menteeProfileId ? (
                    <Link href={`/director/mentees/profile/${encodeURIComponent(menteeProfileId)}`} className="hover:text-[#8ec5eb]">
                      {menteeName}
                    </Link>
                  ) : menteeName}
                </p>
                <p className="text-[12px] capitalize text-[#8ec5eb]">Mentee (Pastor)</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Meeting details ────────────────────────────────────────────── */}
        <div className={`${directorGlassCard} p-6`}>
          <p className="mb-4 text-sm font-semibold text-[#8ec5eb]">Meeting details</p>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <i className="fa-regular fa-calendar w-4 text-center text-[#8ec5eb]" />
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
              <i className="fa-regular fa-clock w-4 text-center text-[#8ec5eb]" />
              <div>
                <p className="text-[11px] text-white/50">Time</p>
                <p className="text-white">
                  {meetingDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
              <i className={`${getPlatformIcon(appt.platform)} w-4 text-center text-[#8ec5eb]`} />
              <div>
                <p className="text-[11px] text-white/50">Platform</p>
                <p className="capitalize text-white">{appt.platform}</p>
              </div>
            </div>

            {appt.endTime ? (
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <i className="fa-regular fa-hourglass w-4 text-center text-[#8ec5eb]" />
                <div>
                  <p className="text-[11px] text-white/50">End Time</p>
                  <p className="text-white">{appt.endTime}</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* Meeting link */}
          {meetLink ? (
            <a
              href={meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-2 truncate rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 px-4 py-2.5 text-sm font-medium text-[#8ec5eb] hover:bg-[#8ec5eb]/20"
            >
              <i className="fa-solid fa-link shrink-0" />
              <span className="truncate">{meetLink}</span>
            </a>
          ) : (
            <p className="mt-4 text-[12px] text-white/40">No meeting link recorded.</p>
          )}
        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        {appt.notes ? (
          <div className={`${directorGlassCard} p-6`}>
            <p className="mb-3 text-sm font-semibold text-[#8ec5eb]">Notes</p>
            <p className="text-sm text-white/80">{appt.notes}</p>
          </div>
        ) : null}

        {/* ── Transcript & AI Summary (completed only) ─────────────────── */}
        {isCompleted ? (
          <div className={`${directorGlassCard} p-6`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#8ec5eb]">Transcript &amp; AI Summary</p>
                <p className="mt-1 text-xs text-white/50">
                  Generate or refresh the AI summary for this completed session.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void fetchTranscript(false)}
                  disabled={tsLoading}
                  className={`${directorBtnPrimary} px-4 py-2 text-sm`}
                >
                  {tsLoading ? "Loading…" : "Generate"}
                </button>
                <button
                  type="button"
                  onClick={() => void fetchTranscript(true)}
                  disabled={tsLoading}
                  className={`${directorBtnSecondary} px-4 py-2 text-sm`}
                >
                  Refresh
                </button>
              </div>
            </div>

            {tsError ? (
              <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {tsError}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Transcript */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-semibold text-white">Transcript</p>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs text-white/70">
                  {tsData?.transcript?.trim()
                    ? tsData.transcript
                    : "No transcript available yet. Click Generate above."}
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
                  <p className="text-sm text-white/50">No summary yet. Click Generate above.</p>
                )}
              </div>
            </div>

            {tsData?.generatedAt ? (
              <p className="mt-3 text-[11px] text-white/30">
                Generated {new Date(tsData.generatedAt).toLocaleString()} · model: {tsData.model}
                {tsData.cached ? " · cached" : ""}
              </p>
            ) : null}
          </div>
        ) : (
          <div className={`${directorGlassCard} p-6`}>
            <p className="text-sm font-semibold text-[#8ec5eb]">Transcript &amp; AI Summary</p>
            <p className="mt-2 text-sm text-white/50">
              Transcript and AI summary are available once the appointment is completed.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
