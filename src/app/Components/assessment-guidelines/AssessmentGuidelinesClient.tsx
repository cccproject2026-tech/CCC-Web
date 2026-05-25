"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { isAxiosError } from "axios";
import {
  apiGetAssessmentById,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { appointmentEntityId, unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import { getCookie } from "@/app/utils/cookies";
import { resolveApiMediaUrl } from "@/app/utils/image";

export type AssessmentGuidelinesClientProps = {
  assessmentId: string;
  meetingId: string;
  meetingDate: string;
  mentorName: string;
  meetingPlatform: string;
  roadmapId?: string;
  taskId?: string;
  /** When set, load answers / CDP state for this user (mentor or director review). Otherwise use logged-in user from cookie. */
  answersUserId: string | null;
  /** Mentor/director viewing a pastor — different copy and no retake / pastor-only scheduling. */
  staffReview: boolean;
  listHref: string;
  listLabel: string;
  surveyUrl: string;
  surveyReadOnlyHref: string;
  surveyRetakeUrl: string;
  preSurveyUrl: string;
  preSurveyRetakeUrl: string;
  scheduleMeetingHref: string;
  cdpHref: string;
  renderHeader: () => ReactNode;
};

type GuidelinesMeeting = {
  id: string;
  meetingDate: string;
  platform: string;
};

function readAppointmentField(appt: Record<string, any>, key: string): string {
  const metadata = appt.metadata || appt.meta || appt.context || {};
  return String(appt[key] ?? metadata?.[key] ?? "").trim();
}

function notesContainToken(notes: string, key: string, value?: string | null): boolean {
  const target = String(value ?? "").trim();
  if (!target) return false;
  return notes.includes(`${key}:${target}`) || notes.includes(`${key}=${target}`);
}

function formatMeetingDateTime(iso?: string) {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: String(iso), time: "" };
  return {
    date: d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function formatMeetingPlatform(platform?: string) {
  const raw = String(platform ?? "").trim();
  if (!raw) return "";
  const normalized = raw.toLowerCase();
  if (normalized === "google-meet" || normalized === "gmeet") return "Google Meet";
  if (normalized === "zoom") return "Zoom";
  if (normalized === "teams") return "Microsoft Teams";
  if (normalized === "in-person") return "In person";
  if (normalized === "phone") return "Phone";
  return raw;
}

function findRoadmapAssessmentMeeting(
  appointments: Record<string, any>[],
  params: {
    assessmentId: string;
    roadmapId: string;
    taskId: string;
  },
): GuidelinesMeeting | null {
  const matches = appointments
    .map((appt) => {
      const status = String(appt?.status ?? "").toLowerCase();
      if (status.includes("cancel")) return { appt, score: -1 };

      const notes = String(appt?.notes ?? "");
      let score = 0;

      if (
        readAppointmentField(appt, "assessmentId") === params.assessmentId ||
        notesContainToken(notes, "assessmentId", params.assessmentId)
      ) {
        score += 10;
      }

      if (
        readAppointmentField(appt, "roadmapId") === params.roadmapId ||
        notesContainToken(notes, "roadmapId", params.roadmapId)
      ) {
        score += 4;
      }

      if (
        readAppointmentField(appt, "taskId") === params.taskId ||
        notesContainToken(notes, "taskId", params.taskId)
      ) {
        score += 4;
      }

      return { appt, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = new Date(String(a.appt?.meetingDate ?? "")).getTime();
      const bTime = new Date(String(b.appt?.meetingDate ?? "")).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

  const match = matches[0]?.appt;
  if (!match) return null;

  return {
    id: appointmentEntityId(match),
    meetingDate: String(match.meetingDate ?? ""),
    platform: String(match.platform ?? ""),
  };
}

const hasCdpInRecommendationsPayload = (body: unknown): boolean => {
  const walk = (node: unknown, parentSent = false): boolean => {
    if (!node) return false;
    if (Array.isArray(node)) return node.some((item) => walk(item, parentSent));
    if (typeof node !== "object") return false;

    const row = node as Record<string, unknown>;
    const sentRaw = row.sent ?? row.isSent ?? row.status;
    const isSent =
      parentSent ||
      sentRaw === true ||
      String(sentRaw ?? "")
        .trim()
        .toLowerCase() === "sent";

    const msg = String(row.message ?? row.text ?? row.cdp ?? row.mentorCdp ?? "").trim();
    const recItems = Array.isArray(row.recommendations)
      ? row.recommendations.filter((x) => String(x ?? "").trim() !== "")
      : [];
    const hasContent = msg.length > 0 || recItems.length > 0;
    if (isSent && hasContent) return true;

    return (
      walk(row.data, isSent) ||
      walk(row.sections, isSent) ||
      walk(row.recommendations, isSent) ||
      walk(row.layers, isSent)
    );
  };

  return walk(body, false);
};

const hasCdpInAnswerPayload = (body: unknown): boolean => {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return sections.some((section: any) => {
    const sectionRecs = Array.isArray(section?.recommendations)
      ? section.recommendations.some((x: unknown) => String(x ?? "").trim() !== "")
      : false;
    const layerRecs = Array.isArray(section?.layers)
      ? section.layers.some((layer: any) =>
          Array.isArray(layer?.recommendations)
            ? layer.recommendations.some((x: unknown) => String(x ?? "").trim() !== "")
            : false,
        )
      : false;
    return sectionRecs || layerRecs;
  });
};

function resolveAnswersUserId(explicit: string | null): string {
  const trimmed = (explicit || "").trim();
  if (trimmed) return trimmed;
  try {
    const userCookie = getCookie("user");
    if (!userCookie) return "";
    const user = JSON.parse(userCookie) as { id?: string; _id?: string };
    return String(user.id || user._id || "");
  } catch {
    return "";
  }
}

export function AssessmentGuidelinesClient({
  assessmentId,
  meetingId,
  meetingDate,
  mentorName,
  meetingPlatform,
  roadmapId = "",
  taskId = "",
  answersUserId,
  staffReview,
  listHref,
  listLabel,
  surveyUrl,
  surveyReadOnlyHref,
  surveyRetakeUrl,
  preSurveyUrl,
  preSurveyRetakeUrl,
  scheduleMeetingHref,
  cdpHref,
  renderHeader,
}: AssessmentGuidelinesClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const [answersSubmitted, setAnswersSubmitted] = useState(false);
  const [hasCdp, setHasCdp] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [roadmapMeeting, setRoadmapMeeting] = useState<GuidelinesMeeting | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(res.data);
        if (!cancelled) setAssessment(detail as Record<string, unknown> | null);

        const uid = resolveAnswersUserId(answersUserId);
        if (!uid) {
          if (!cancelled) setAnswersSubmitted(false);
          return;
        }

        const [answersRes, recommendationsRes] = await Promise.allSettled([
          apiGetUserAnswers(assessmentId, uid),
          apiGetSectionRecommendations(assessmentId, uid),
        ]);

        const submitted =
          answersRes.status === "fulfilled"
            ? (() => {
                const body = answersRes.value.data as Record<string, unknown>;
                const inner = (body?.data as Record<string, unknown>) || body;
                const sections = inner?.sections as unknown;
                return Array.isArray(sections) && sections.length > 0;
              })()
            : false;

        const hasCdpFromAnswers =
          answersRes.status === "fulfilled" ? hasCdpInAnswerPayload(answersRes.value.data) : false;
        const hasCdpFromRecommendations =
          recommendationsRes.status === "fulfilled"
            ? hasCdpInRecommendationsPayload(recommendationsRes.value.data)
            : false;

        if (!cancelled) {
          setAnswersSubmitted(submitted);
          setHasCdp(hasCdpFromAnswers || hasCdpFromRecommendations);
        }

        if (
          answersRes.status === "rejected" &&
          !(isAxiosError(answersRes.reason) && answersRes.reason.response?.status === 404)
        ) {
          console.error("guidelines: answers fetch", answersRes.reason);
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load this assessment.");
          setAssessment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, answersUserId]);

  useEffect(() => {
    if (staffReview || !assessmentId || !roadmapId || !taskId) {
      setRoadmapMeeting(null);
      return;
    }

    const userId = resolveAnswersUserId(null);
    if (!userId) {
      setRoadmapMeeting(null);
      return;
    }

    let cancelled = false;

    const loadRoadmapMeeting = async () => {
      try {
        const res = await apiGetAppointments({
          userId,
          futureOnly: false,
        });
        const appointments = unwrapAppointmentsAxiosData(res) as Record<string, any>[];
        const match = findRoadmapAssessmentMeeting(appointments, {
          assessmentId,
          roadmapId,
          taskId,
        });
        if (!cancelled) setRoadmapMeeting(match);
      } catch (err) {
        console.error("guidelines: meeting fetch", err);
        if (!cancelled) setRoadmapMeeting(null);
      }
    };

    void loadRoadmapMeeting();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, roadmapId, taskId, staffReview]);

  const title = String(assessment?.name ?? "Assessment");
  const instructions = (assessment?.instructions as string[] | undefined) || [];
  const typeRaw = String(assessment?.type ?? "CMA").toUpperCase();
  const cardContent = typeRaw.includes("PMP")
    ? { acronym: "PMP", line1: "PASTORAL MINISTRY", line2: "PROFILE" }
    : { acronym: "CMA", line1: "CHURCH ASSESSMENT", line2: "EVALUATION" };
const bannerUrl =
  resolveApiMediaUrl(String(assessment?.bannerImage || "")) ||
  String(assessment?.bannerImage || "");
  const preSurveyRaw =
    (assessment as { preSurvey?: unknown; preSurveyQuestions?: unknown })?.preSurvey ??
    (assessment as { preSurveyQuestions?: unknown })?.preSurveyQuestions;
  const hasPreSurvey = Array.isArray(preSurveyRaw) && preSurveyRaw.length > 0;
  const scheduledMeeting: GuidelinesMeeting | null =
    meetingId || meetingDate || meetingPlatform
      ? {
          id: meetingId,
          meetingDate,
          platform: meetingPlatform,
        }
      : roadmapMeeting;
  const scheduledMeetingParts = formatMeetingDateTime(scheduledMeeting?.meetingDate);
  const scheduledMeetingPlatform = formatMeetingPlatform(scheduledMeeting?.platform);

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        {renderHeader()}
        <p className="mt-8 text-[#cde2f2]">Missing assessment.</p>
        <Link href={listHref} className="mt-4 inline-block text-[#8ec5eb] underline">
          {listLabel}
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#062946] text-white">
        {renderHeader()}
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        {renderHeader()}
        <p className="mt-8 text-amber-200">{loadError || "Assessment not found."}</p>
        <Link href={listHref} className="mt-4 inline-block text-[#8ec5eb] underline">
          {listLabel}
        </Link>
      </div>
    );
  }

  if (answersSubmitted) {
    return (
      <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
        {renderHeader()}

        <section className="relative overflow-hidden border-b border-white/10 bg-[#041f35]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(142,197,235,0.24),transparent_32%),linear-gradient(135deg,rgba(6,41,70,0.96)_0%,rgba(4,31,53,0.96)_45%,rgba(9,49,80,0.92)_100%)]" />

          <div className="absolute inset-0 opacity-30">
            <div className="absolute right-[-8%] top-[-35%] h-[360px] w-[620px] rotate-[-18deg] rounded-full border border-[#8ec5eb]/20 bg-[#8ec5eb]/10 blur-sm" />
            <div className="absolute right-[10%] top-[20%] h-[160px] w-[420px] rotate-[-18deg] rounded-full border border-white/10 bg-white/5" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-16">
            <button
              type="button"
              onClick={() => router.push(listHref)}
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#cde2f2] transition hover:text-white"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              {listLabel}
            </button>

            <div className="grid min-h-[220px] grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                  Assessment completed
                </p>

                <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">{title}</h1>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d9ebf8]/80 sm:text-base">
                  {staffReview
                    ? "This survey has been submitted. Review responses and next steps below."
                    : "Your survey has been submitted. You can review your saved responses or retake the survey if needed."}
                </p>
              </div>

              {!staffReview && (
                <>
                  {scheduledMeeting ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (scheduledMeeting.id) {
                          router.push(`/pastor/appointments/${encodeURIComponent(scheduledMeeting.id)}`);
                        }
                      }}
                     className="rounded-2xl border border-yellow-300/60 bg-yellow-400/15 px-5 py-4 text-left shadow-[0_18px_45px_rgba(245,158,11,0.18)] backdrop-blur-md transition hover:bg-yellow-400/25"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/25 text-yellow-200">
                          <i className="fa-regular fa-calendar-check" />
                        </span>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ec5eb]">
                            Meeting scheduled
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {scheduledMeetingParts.date
                              ? `Meeting on ${scheduledMeetingParts.date}${scheduledMeetingParts.time ? ` at ${scheduledMeetingParts.time}` : ""}`
                              : "Meeting details recorded"}
                          </p>
                          {(mentorName || scheduledMeetingPlatform) && (
                            <p className="mt-1 text-xs text-[#cde2f2]/80">
                              {mentorName ? `Mentor: ${mentorName}` : ""}
                              {mentorName && scheduledMeetingPlatform ? " | " : ""}
                              {scheduledMeetingPlatform ? `Platform: ${scheduledMeetingPlatform}` : ""}
                            </p>
                          )}
                          {scheduledMeeting.id ? (
                          <p className="mt-2 text-xs font-medium text-[#8ec5eb] underline underline-offset-2">
                            Open appointment →
                          </p>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(scheduleMeetingHref)}
                     className="rounded-2xl border border-yellow-300/45 bg-[linear-gradient(135deg,rgba(250,204,21,0.18)_0%,rgba(245,158,11,0.12)_45%,rgba(15,74,118,0.28)_100%)] px-5 py-4 text-left shadow-[0_18px_45px_rgba(245,158,11,0.22)] backdrop-blur-md transition hover:border-yellow-300/65 hover:bg-yellow-400/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-regular fa-calendar-plus" />
                        </span>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-200">
                            Mentor meeting required
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">Schedule meeting</p>
                          <p className="mt-1 text-xs text-[#cde2f2]/80">
                            Book a time with your mentor to complete this step.
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </>
              )}

              {staffReview && scheduledMeeting ? (
                <button
                  type="button"
                  onClick={() => {
                    if (scheduledMeeting.id) {
                      router.push(`/pastor/appointments/${encodeURIComponent(scheduledMeeting.id)}`);
                    }
                  }}
                  className="rounded-2xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-5 py-4 text-left shadow-[0_18px_45px_rgba(2,20,38,0.35)] backdrop-blur-md transition hover:bg-[#8ec5eb]/15"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/25 text-yellow-100">
                      <i className="fa-regular fa-calendar-check" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ec5eb]">
                        Meeting scheduled
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {scheduledMeetingParts.date
                          ? `Meeting on ${scheduledMeetingParts.date}${scheduledMeetingParts.time ? ` at ${scheduledMeetingParts.time}` : ""}`
                          : "Meeting details recorded"}
                      </p>
                      {(mentorName || scheduledMeetingPlatform) && (
                        <p className="mt-1 text-xs text-[#cde2f2]/80">
                          {mentorName ? `Mentor: ${mentorName}` : ""}
                          {mentorName && scheduledMeetingPlatform ? " | " : ""}
                          {scheduledMeetingPlatform ? `Platform: ${scheduledMeetingPlatform}` : ""}
                        </p>
                      )}
                      {scheduledMeeting.id ? (
                      <p className="mt-2 text-xs font-medium text-[#8ec5eb] underline underline-offset-2">
                        Open appointment →
                      </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-16">
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4">
            {!hasCdp && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ec5eb]">
                Customized Development Plans Status
              </p>
            )}
            <button
              type="button"
              disabled={!hasCdp}
              onClick={() => {
                if (!assessmentId) return;
                router.push(cdpHref);
              }}
              className="mt-2 inline-flex items-center rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
            >
              {hasCdp ? "Customized Development Plans" : "Wait for response"}
            </button>
          </div>
          <div className={`grid grid-cols-1 gap-6 ${staffReview ? "" : "lg:grid-cols-[1fr_320px]"}`}>
            <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(2,20,38,0.32)] backdrop-blur-md sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">Survey result</p>

              <h2 className="mt-3 text-2xl font-semibold text-white">
                {staffReview ? "Submitted responses" : "View your submitted responses"}
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#cde2f2]/80">
                {staffReview
                  ? "Open the read-only result view for every section, selected answers, and mentor customized development plans."
                  : "Open the read-only survey result page to check every section, selected answer, and available customized development plan."}
              </p>

              <button
                type="button"
                onClick={() => router.push(surveyReadOnlyHref)}
                className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
              >
                {staffReview ? "View survey results" : "View your Survey Results"}
                <i className="fa-solid fa-arrow-right ml-2 text-xs" />
              </button>
            </section>

            {!staffReview ? (
              <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">Need changes?</p>

                <h3 className="mt-3 text-lg font-semibold text-white">Retake survey</h3>

                <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]/75">
                  Retake only if you want to replace your previous answers.
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (hasPreSurvey) router.push(preSurveyRetakeUrl);
                    else router.push(surveyRetakeUrl);
                  }}
                  className="mt-6 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Retake Survey
                </button>
              </aside>
            ) : null}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      {renderHeader()}

      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-[#cde2f2] hover:text-white"
        >
          ← Back
        </button>

        <h1 className="text-2xl font-semibold md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-[#cde2f2]">Assessment</p>
{/* 
        <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
          <p className="text-3xl font-bold text-white">{cardContent.acronym}</p>
          <div className="mx-auto my-4 h-px w-24 bg-white/30" />
          <p className="text-sm font-medium tracking-wide text-[#cde2f2]">{cardContent.line1}</p>
          <p className="text-sm font-medium tracking-wide text-[#cde2f2]">{cardContent.line2}</p>
        </div> */}
<div className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur">
  {bannerUrl ? (
    <div className="relative h-64 w-full">
      <Image
        src={bannerUrl}
        alt={title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 768px"
        unoptimized
      />
    </div>
  ) : (
    <div className="p-8 text-center">
      <p className="text-3xl font-bold text-white">{cardContent.acronym}</p>
      <div className="mx-auto my-4 h-px w-24 bg-white/30" />
      <p className="text-sm font-medium tracking-wide text-[#cde2f2]">
        {cardContent.line1}
      </p>
      <p className="text-sm font-medium tracking-wide text-[#cde2f2]">
        {cardContent.line2}
      </p>
    </div>
  )}
</div>
        {instructions.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Instructions</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-[#d9ebf8]">
              {instructions.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {answersSubmitted ? (
            <>
              <button
                type="button"
                onClick={() => router.push(surveyReadOnlyHref)}
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
              >
                {staffReview ? "View survey results" : "View your Survey Results"}
              </button>
              {!staffReview ? (
                <button
                  type="button"
                  onClick={() => {
                    if (hasPreSurvey) router.push(preSurveyRetakeUrl);
                    else router.push(surveyRetakeUrl);
                  }}
                  className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Repeat survey
                </button>
              ) : null}
            </>
          ) : staffReview ? (
            <p className="text-sm text-[#cde2f2]/80">No submitted responses for this user yet.</p>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (hasPreSurvey) router.push(preSurveyUrl);
                else router.push(surveyUrl);
              }}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
            >
              Start now
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
