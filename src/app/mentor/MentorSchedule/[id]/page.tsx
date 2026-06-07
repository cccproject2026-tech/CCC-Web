"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import MentorHeader from "@/app/Components/MentorHeader";
import { useToast } from "@/app/Components/ui/Toast";
import {
  extractApiErrorMessage,
  appointmentEntityId,
  normalizeAppointmentStatus,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import {
  apiGetAppointmentById,
  // apiGetMentorSchedule,
    apiGetAppointments,
  apiGenerateTranscriptSummary,
  apiPostAppointmentJoin,
  apiUpdateAppointment,
} from "@/app/Services/appointments.service";
import type {
  AppointmentResponse,
  PersonInfo,
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

const JOIN_EARLY_MS = 5 * 60 * 1000;
const DEFAULT_DURATION_MS = 60 * 60 * 1000;

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

function unwrapPerson(populated?: PersonInfo, rawId?: string | PersonInfo): PersonInfo | undefined {
  if (populated && typeof populated === "object" && populated._id) return populated;
  if (rawId && typeof rawId === "object" && (rawId as PersonInfo)._id) return rawId as PersonInfo;
  return undefined;
}

function computeEndMs(appt: AppointmentResponse): number {
  const start = new Date(appt.meetingDate).getTime();
  if (appt.endTime != null && String(appt.endTime).trim() !== "") {
    const e = new Date(appt.endTime as string).getTime();
    if (!Number.isNaN(e)) return Math.max(e, start);
  }
  return start + DEFAULT_DURATION_MS;
}

function zoomJoinNumericId(joinUrl?: string): string {
  if (!joinUrl) return "";
  const m = joinUrl.match(/\/j\/(\d+)/);
  return m?.[1] ?? "";
}

function formatZoomMeetingIdDisplay(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  if (digits.length <= 3) return digits || "—";
  if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7, 11)}`.trim();
}

function zoomPasscodeFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const pwd = u.searchParams.get("pwd");
    return pwd ? decodeURIComponent(pwd) : "";
  } catch {
    return "";
  }
}

function formatDurationLabel(startMs: number, endMs: number): string {
  const mins = Math.max(1, Math.round((endMs - startMs) / 60_000));
  if (mins % 60 === 0 && mins <= 480) return `Duration: ${mins / 60} Hour${mins === 60 ? "" : "s"}`;
  return `Duration: ${mins} Minutes`;
}

function humanStatusLabel(normalized: string): string {
  if (normalized === "in-progress" || normalized === "in_progress" || normalized === "inprogress")
    return "In Progress";
  if (normalized === "scheduled") return "Scheduled";
  if (normalized === "completed") return "Completed";
  if (normalized === "missed") return "Missed";
  if (normalized === "postponed") return "Postponed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  if (normalized === "rescheduled") return "Rescheduled";
  return normalized ? normalized.replace(/-/g, " ") : "Unknown";
}

function StatusBadge({ status }: { status: string }) {
  const s = normalizeAppointmentStatus({ status });
  const label = humanStatusLabel(s);
  const styles: Record<string, string> = {
    completed: "bg-emerald-500/20 text-emerald-200 border-emerald-400/35",
    scheduled: "bg-emerald-500/20 text-emerald-200 border-emerald-400/35",
    "in-progress": "bg-sky-500/20 text-sky-200 border-sky-400/35",
    cancelled: "bg-red-500/20 text-red-300 border-red-400/30",
    rescheduled: "bg-yellow-500/20 text-yellow-300 border-yellow-400/30",
    missed: "bg-amber-600/25 text-amber-100 border-amber-400/35",
    postponed: "bg-violet-500/20 text-violet-100 border-violet-400/35",
  };
  const showCheck = s === "scheduled";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${
        styles[s] ?? "bg-white/10 text-white/80 border-white/20"
      }`}
    >
      {showCheck ? <i className="fa-solid fa-check text-[11px]" aria-hidden /> : null}
      {label}
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
  const [nowMs, setNowMs] = useState(() => Date.now());

  const [tsLoading, setTsLoading] = useState(false);
  const [tsData, setTsData] = useState<TranscriptSummary | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [passCopied, setPassCopied] = useState(false);
  const [joinSubmitting, setJoinSubmitting] = useState(false);

  // ── Fetch appointment (prefer by id; fallback mentor schedule from cookie) ──
  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        // let found: AppointmentResponse | null = null;

        // try {
        //   const res = await apiGetAppointmentById(apptId);
        //   const body = (res.data as { data?: AppointmentResponse })?.data ?? (res.data as unknown as AppointmentResponse);
        //   if (body && (body as AppointmentResponse).meetingDate) found = body as AppointmentResponse;
        // } catch {
        //   found = null;
        // }

        // if (!found) {
//         let found: AppointmentResponse | null = null;



// try {
//   const cached = sessionStorage.getItem("mentorSelectedAppointment");
//   if (cached) {
//     const parsed = JSON.parse(cached) as AppointmentResponse;
//     if (appointmentEntityId(parsed) === apptId) {
//       found = parsed;
//     }
//   }
// } catch {
//   found = null;
// }

// if (!found) {
//   // keep your API fetch fallback here
// }
        
// const mentorCookie = Cookies.get("mentor");
// if (!mentorCookie) throw new Error("Mentor information not found");

// const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
// const mentorId = String(mentorData?.id ?? mentorData?._id ?? "").trim();
// if (!mentorId) throw new Error("Mentor ID not found");

// try {
//   const res = await apiGetAppointments({
//     userId: mentorId,
//     mentorId,
//     futureOnly: false,
//   });

//   const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];

//   found =
//     list.find((a) => appointmentEntityId(a) === apptId) ??
//     list.find((a) => String((a as any)._id ?? (a as any).id) === apptId) ??
//     null;
// } catch {
//   found = null;
// }

// if (!found) {
//           const mentorCookie = Cookies.get("mentor");
//           if (!mentorCookie) throw new Error("Mentor information not found");
//           const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
//           const mentorId = String(mentorData?.id ?? mentorData?._id ?? "").trim();
//           if (!mentorId) throw new Error("Mentor ID not found");

//           // const res = await apiGetMentorSchedule(mentorId);
//           // const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];
//           const res = await apiGetAppointments({
//   userId: mentorId,
//   mentorId,
//   futureOnly: false,
// });

// const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];
//           found =
//             list.find((a) => appointmentEntityId(a) === apptId) ??
//             list.find((a) => String((a as { _id?: string; id?: string })._id ?? (a as { id?: string }).id) === apptId) ??
//             null;
//         }
let found: AppointmentResponse | null = null;

try {
  const cached = sessionStorage.getItem("mentorSelectedAppointment");
  if (cached) {
    const parsed = JSON.parse(cached) as AppointmentResponse;
    if (appointmentEntityId(parsed) === apptId) {
      found = parsed;
    }
  }
} catch {
  found = null;
}

if (!found) {
  const mentorCookie = Cookies.get("mentor");
  if (!mentorCookie) throw new Error("Mentor information not found");

  const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
  const mentorId = String(mentorData?.id ?? mentorData?._id ?? "").trim();
  if (!mentorId) throw new Error("Mentor ID not found");

  const res = await apiGetAppointments({
    userId: mentorId,
    mentorId,
    futureOnly: false,
  });

  const list = unwrapAppointmentsAxiosData(res) as AppointmentResponse[];

  found =
    list.find((a) => appointmentEntityId(a) === apptId) ??
    list.find((a) => String((a as any)._id ?? (a as any).id) === apptId) ??
    null;
}

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
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apptId]);

  // Re-evaluate join window periodically
  useEffect(() => {
    const tick = window.setInterval(() => setNowMs(Date.now()), 10_000);
    return () => window.clearInterval(tick);
  }, []);

  const meetingWindow = useMemo(() => {
    if (!appt) return null;
    const startMs = new Date(appt.meetingDate).getTime();
    const endMs = computeEndMs(appt);
    const st = normalizeAppointmentStatus(appt);
    const terminal = ["completed", "cancelled", "canceled", "missed"].includes(st);
    const linkActiveWindow = !terminal && nowMs >= startMs - JOIN_EARLY_MS && nowMs <= endMs;
    const joinEnabled = linkActiveWindow && !!String(appt.meetingLink || appt.zoomJoinUrl || "").trim();
    return { startMs, endMs, joinEnabled, linkActiveWindow, terminal };
  }, [appt, nowMs]);

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

  const copyText = useCallback((text: string, which: "link" | "id" | "pass") => {
    if (!text) return;
    void navigator.clipboard.writeText(text).then(() => {
      if (which === "link") {
        setLinkCopied(true);
        window.setTimeout(() => setLinkCopied(false), 2000);
      }
      if (which === "id") {
        setIdCopied(true);
        window.setTimeout(() => setIdCopied(false), 2000);
      }
      if (which === "pass") {
        setPassCopied(true);
        window.setTimeout(() => setPassCopied(false), 2000);
      }
    });
  }, []);

  const shareLink = useCallback(async (url: string) => {
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Meeting link", url });
        return;
      }
    } catch {
      /* user cancelled share */
    }
    copyText(url, "link");
    toast.show({ kind: "success", title: "Link copied", subtitle: "Share isn’t available on this device." });
  }, [copyText, toast]);

  const handleJoinMeeting = useCallback(async () => {
    if (!appt || !meetingWindow?.joinEnabled) return;
    const url = String(appt.meetingLink || appt.zoomJoinUrl || "").trim();
    if (!url) return;

    setJoinSubmitting(true);
    try {
      const st = normalizeAppointmentStatus(appt);
      if (st === "scheduled") {
        let nextAppt: AppointmentResponse | undefined;

        let hostUserId = "";
        try {
          const mentorCookie = Cookies.get("mentor");
          if (mentorCookie) {
            const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
            hostUserId = String(mentorData?.id ?? mentorData?._id ?? "").trim();
          }
        } catch {
          hostUserId = "";
        }

        if (hostUserId) {
          try {
            const joinRes = await apiPostAppointmentJoin(apptId, { userId: hostUserId, kind: "host" });
            nextAppt = (joinRes.data as { data?: AppointmentResponse })?.data;
          } catch {
            /* PATCH fallback below */
          }
        }

        if (!nextAppt?.meetingDate) {
          try {
            const res = await apiUpdateAppointment(apptId, { status: "in-progress" });
            const patchBody = (res.data as { data?: AppointmentResponse })?.data;
            if (patchBody?.meetingDate) nextAppt = patchBody;
          } catch (e) {
            toast.show({
              kind: "error",
              title: "Could not update meeting status",
              subtitle: extractApiErrorMessage(e),
            });
          }
        }

        if (nextAppt?.meetingDate) setAppt(nextAppt);
        else setAppt((prev) => (prev ? { ...prev, status: "in-progress" } : prev));
      }

      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setJoinSubmitting(false);
    }
  }, [appt, apptId, meetingWindow?.joinEnabled, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-white/50">Loading…</div>
      </div>
    );
  }

  if (!appt || !meetingWindow) {
    return (
      <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
        <MentorHeader showFullHeader />
        <div className="mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-base font-semibold">Appointment not found</p>
            <button
              type="button"
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

  // const mentorPerson = unwrapPerson(appt.mentor, appt.mentorId);
  // const menteePerson = unwrapPerson(appt.user, appt.userId);
const mentorCookie = Cookies.get("mentor");
const currentMentorData = mentorCookie
  ? JSON.parse(decodeURIComponent(mentorCookie))
  : null;

const currentMentorId = String(
  currentMentorData?.id ?? currentMentorData?._id ?? ""
).trim();

const userPerson = unwrapPerson(appt.user, appt.userId);
const appointmentMentorPerson = unwrapPerson(appt.mentor, appt.mentorId);

const mentorPerson =
  userPerson &&
  (String(userPerson._id) === currentMentorId || String((userPerson as any).id) === currentMentorId)
    ? userPerson
    : appointmentMentorPerson;

const otherPerson =
  userPerson &&
  (String(userPerson._id) === currentMentorId || String((userPerson as any).id) === currentMentorId)
    ? appointmentMentorPerson
    : userPerson;
  const mentorName =
    `${mentorPerson?.firstName ?? ""} ${mentorPerson?.lastName ?? ""}`.trim() ||
    mentorPerson?.email ||
    "Mentor";
  const menteeName =
    `${otherPerson?.firstName ?? ""} ${otherPerson?.lastName ?? ""}`.trim() ||
    otherPerson?.email ||
    "Mentee";
    const menteeRole = String(otherPerson?.role || "User");
const menteeRoleLabel =
  menteeRole.charAt(0).toUpperCase() + menteeRole.slice(1).toLowerCase();

  const mentorPic = String(mentorPerson?.profilePicture || "").trim() || UserProfile.src;
  const menteePic = String(otherPerson?.profilePicture || "").trim() || UserProfile.src;

  const meetingDate = new Date(appt.meetingDate);
  const startMs = meetingWindow.startMs;
  const endMs = meetingWindow.endMs;
  const meetLink = String(appt.meetingLink || appt.zoomJoinUrl || "").trim();
  const st = normalizeAppointmentStatus(appt);
  const isCompleted = st === "completed";

  const zoomMeetingTopic =
  (appt as any).zoomMeeting && typeof (appt as any).zoomMeeting.topic === "string"
    ? (appt as any).zoomMeeting.topic.trim()
    : "";

const meetingTitle =
  String((appt as any).title || "").trim() ||
  zoomMeetingTopic ||
  String(appt.notes || "").trim();

const meetingDescription = String((appt as any).description || "").trim();

  const meetingNumericId = String(appt.zoomMeetingId || "").replace(/\D/g, "") || zoomJoinNumericId(meetLink);
  const meetingIdDisplay = formatZoomMeetingIdDisplay(meetingNumericId);
  const zmPwd =
    appt.zoomMeeting && typeof appt.zoomMeeting === "object" && typeof appt.zoomMeeting.password === "string"
      ? appt.zoomMeeting.password.trim()
      : "";
  const payloadPasscode = String(appt.zoomPasscode ?? "").trim();
  const passcode = zoomPasscodeFromUrl(meetLink) || payloadPasscode || zmPwd || "—";

  const timeStart = meetingDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const timeEnd = new Date(endMs).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  const durationLabel = formatDurationLabel(startMs, endMs);

  const linkActionsDisabled = !meetingWindow.linkActiveWindow || !meetLink || meetingWindow.terminal;

  const joinHint = (() => {
    if (meetingWindow.terminal) return "This meeting is no longer active.";
    if (nowMs > endMs) return "The meeting has ended. The join link is no longer available here.";
    if (nowMs < startMs - JOIN_EARLY_MS)
      return `Join opens 5 minutes before start (${new Date(startMs - JOIN_EARLY_MS).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}).`;
    return null;
  })();

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader />

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-10 md:px-8">
        <button
          type="button"
          onClick={() => router.push("/mentor/MentorSchedule")}
          className="flex items-center gap-2 text-sm text-[#8ec5eb] hover:text-white"
        >
          <i className="fa-solid fa-arrow-left" />
          Back to Schedule
        </button>

        {/* Participants + status */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.55)_0%,rgba(6,41,70,0.55)_100%)] p-6 shadow-lg">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-6 sm:gap-10">
              <div className="flex items-center gap-3">
                <img
                  src={mentorPic}
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full border border-white/20 object-cover"
                />
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">Mentor</p>
                  <p className="text-base font-semibold text-white">{mentorName}</p>
                  {mentorPerson?.role ? (
                    <p className="text-[12px] capitalize text-[#cde2f2]/85">{String(mentorPerson.role)}</p>
                  ) : null}
                </div>
              </div>
              <div className="hidden h-10 w-px bg-white/15 sm:block" aria-hidden />
              <div className="flex items-center gap-3">
                <img
                  src={menteePic}
                  alt=""
                  width={52}
                  height={52}
                  className="h-[52px] w-[52px] rounded-full border border-white/20 object-cover"
                />
                <div>
                  {/* <p className="text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
                    Mentee (Pastor)
                  </p>
                  <p className="text-base font-semibold text-white">{menteeName}</p>
                  {menteePerson?.role ? (
                    <p className="text-[12px] capitalize text-[#cde2f2]/85">{String(menteePerson.role)}</p>
                  ) : null} */}
                  <p className="text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
  {menteeRoleLabel}
</p>
<p className="text-base font-semibold text-white">{menteeName}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <StatusBadge status={appt.status} />
              <p className="flex items-center gap-1.5 text-[12px] text-[#cde2f2]/80">
                Meeting Status
                <i
                  className="fa-regular fa-circle-question cursor-help text-[#8ec5eb]/80"
                  title="Scheduled: not started · In Progress: someone joined via CCC · Completed / Missed / Cancelled follow your organization’s backend rules."
                />
              </p>
            </div>
          </div>
        </div>

        {/* Meeting details */}
        <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(10,53,88,0.92)_0%,rgba(6,41,70,0.95)_100%)] p-6 shadow-xl">
          <p className="mb-5 text-[15px] font-semibold text-white">Meeting details</p>

          <div className="grid grid-cols-1 gap-3 text-sm lg:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
              <i className="fa-regular fa-calendar w-5 text-center text-[#8ec5eb]" />
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

            <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
              <i className="fa-regular fa-clock w-5 text-center text-[#8ec5eb]" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-white/50">Time</p>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-white">
                    {timeStart} – {timeEnd}
                  </p>
                  <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium text-[#cde2f2]">
                    {durationLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
              <i className={`${getPlatformIcon(appt.platform)} w-5 text-center text-[#8ec5eb]`} />
              <div>
                <p className="text-[11px] text-white/50">Platform</p>
                <p className="capitalize text-white">{appt.platform}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-3">
              <i className="fa-regular fa-hourglass w-5 text-center text-[#8ec5eb]" />
              <div>
                <p className="text-[11px] text-white/50">End Time</p>
                <p className="text-white">{timeEnd}</p>
              </div>
            </div>
          </div>

          {/* Link + actions */}
          <div className="mt-5 rounded-xl border border-[#8ec5eb]/35 bg-[#8ec5eb]/[0.08] p-4">
            <p className="mb-2 text-[11px] font-medium text-[#cde2f2]/80">Meeting link</p>
            {meetLink ? (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <a
                    href={linkActionsDisabled ? undefined : meetLink}
                    target={linkActionsDisabled ? undefined : "_blank"}
                    rel="noreferrer"
                    className={`min-w-0 flex-1 truncate text-sm font-medium ${
                      linkActionsDisabled ? "cursor-not-allowed text-white/35" : "text-[#8ec5eb] hover:underline"
                    }`}
                    onClick={(e) => {
                      if (linkActionsDisabled) e.preventDefault();
                    }}
                  >
                    {meetLink}
                  </a>
                  <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={linkActionsDisabled}
                      onClick={() => void shareLink(meetLink)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className="fa-solid fa-arrow-up-from-bracket text-[11px]" />
                      Share
                    </button>
                    <button
                      type="button"
                      disabled={linkActionsDisabled}
                      onClick={() => copyText(meetLink, "link")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {linkCopied ? (
                        <>
                          <i className="fa-solid fa-check text-[11px] text-emerald-300" />
                          Copied
                        </>
                      ) : (
                        <>
                          <i className="fa-regular fa-copy text-[11px]" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={!meetingWindow.joinEnabled || joinSubmitting}
                      onClick={() => void handleJoinMeeting()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2b8fd9] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#3a9fe8] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                    >
                      <i className="fa-solid fa-video" />
                      {joinSubmitting ? "Opening…" : "Join Meeting"}
                    </button>
                  </div>
                </div>
                {joinHint ? <p className="mt-2 text-[11px] text-amber-200/90">{joinHint}</p> : null}
              </>
            ) : (
              <p className="text-[13px] text-white/45">No meeting link available.</p>
            )}
          </div>

          {/* Credentials */}
          {meetLink && appt.platform?.toLowerCase().includes("zoom") ? (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3">
                <p className="text-[11px] text-white/50">Meeting ID</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm text-white">{meetingNumericId ? meetingIdDisplay : "—"}</p>
                  <button
                    type="button"
                    disabled={!meetingNumericId || linkActionsDisabled}
                    onClick={() => meetingNumericId && copyText(meetingNumericId.replace(/\D/g, ""), "id")}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/10 p-2 text-[#cde2f2] transition hover:bg-white/15 disabled:opacity-35"
                  >
                    {idCopied ? <i className="fa-solid fa-check text-emerald-300" /> : <i className="fa-regular fa-copy" />}
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3">
                <p className="text-[11px] text-white/50">Passcode</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm text-white">{passcode !== "—" ? passcode : "—"}</p>
                  <button
                    type="button"
                    disabled={passcode === "—" || linkActionsDisabled}
                    onClick={() => passcode !== "—" && copyText(passcode, "pass")}
                    className="shrink-0 rounded-lg border border-white/15 bg-white/10 p-2 text-[#cde2f2] transition hover:bg-white/15 disabled:opacity-35"
                  >
                    {passCopied ? <i className="fa-solid fa-check text-emerald-300" /> : <i className="fa-regular fa-copy" />}
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-5 flex gap-3 rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/[0.09] px-4 py-3 text-[12px] leading-relaxed text-[#d9ebf8]">
            <i className="fa-solid fa-circle-info mt-0.5 shrink-0 text-[#8ec5eb]" />
            <p>
              The meeting will be automatically completed when the end time is reached. The meeting link should be treated as
              inactive after the end time; join opens 5 minutes before the scheduled start through the scheduled end time.
              <span className="block pt-2 text-[11px] text-white/50">
                “In Progress” appears when CCC records a transition to In Progress after you tap Join Meeting (requires backend
                to accept PATCH <code className="rounded bg-black/25 px-1">status</code>).
              </span>
            </p>
          </div>
        </div>
{meetingTitle || meetingDescription ? (
  <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
    {meetingTitle ? (
      <>
        <p className="mb-2 text-sm font-semibold text-[#8ec5eb]">
          Meeting Title
        </p>
        <p className="text-sm text-white/90">{meetingTitle}</p>
      </>
    ) : null}

    {meetingDescription ? (
      <>
        <p className="mb-2 mt-4 text-sm font-semibold text-[#8ec5eb]">
          Meeting Description
        </p>
        <p className="whitespace-pre-wrap text-sm text-white/80">
          {meetingDescription}
        </p>
      </>
    ) : null}
  </div>
) : null}
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

        {isCompleted ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#8ec5eb]">Transcript &amp; AI Summary</p>
                <p className="mt-1 text-xs text-white/50">Generate or refresh the AI summary for this session.</p>
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
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="mb-2 text-sm font-semibold text-white">Transcript</p>
                <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap text-xs text-white/70">
                  {tsData?.transcript?.trim() ? tsData.transcript : "No transcript available yet."}
                </pre>
              </div>
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
                  <p className="text-sm text-white/50">No summary yet. Hit &quot;Generate&quot; above.</p>
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
