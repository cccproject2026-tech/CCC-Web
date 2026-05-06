"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import PastorHeader from "@/app/Components/PastorHeader";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { getCookie } from "@/app/utils/cookies";

/**
 * Pastor assessment entry — mirrors CCC-Mobile `assessments/survey-guidelines`
 * before `answer-questions` / CMA survey.
 */
function GuidelinesInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId")?.trim() || "";

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const [answersSubmitted, setAnswersSubmitted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

        const userCookie = getCookie("user");
        if (!userCookie) {
          if (!cancelled) setAnswersSubmitted(false);
          return;
        }
        const user = JSON.parse(userCookie) as { id?: string; _id?: string };
        const uid = String(user.id || user._id || "");
        if (!uid) return;

        try {
          const answersRes = await apiGetUserAnswers(assessmentId, uid);
          const body = answersRes.data as Record<string, unknown>;
          const inner = (body?.data as Record<string, unknown>) || body;
          const sections = inner?.sections as unknown;
          if (!cancelled) {
            setAnswersSubmitted(Array.isArray(sections) && sections.length > 0);
          }
        } catch (err) {
          if (isAxiosError(err) && err.response?.status === 404) {
            if (!cancelled) setAnswersSubmitted(false);
          } else {
            console.error("guidelines: answers fetch", err);
          }
        }
      } catch (e) {
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
  }, [assessmentId]);

  const title = String(assessment?.name ?? "Assessment");
  const instructions = (assessment?.instructions as string[] | undefined) || [];
  const typeRaw = String(assessment?.type ?? "CMA").toUpperCase();
  const cardContent =
    typeRaw.includes("PMP")
      ? { acronym: "PMP", line1: "PASTORAL MINISTRY", line2: "PROFILE" }
      : { acronym: "CMA", line1: "CHURCH ASSESSMENT", line2: "EVALUATION" };

  const preSurveyRaw =
    (assessment as { preSurvey?: unknown; preSurveyQuestions?: unknown })?.preSurvey ??
    (assessment as { preSurveyQuestions?: unknown })?.preSurveyQuestions;
  const hasPreSurvey = Array.isArray(preSurveyRaw) && preSurveyRaw.length > 0;

  const surveyUrl = `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(assessmentId)}`;
  const preSurveyUrl = `/pastor/Assessments/pre-survey?assessmentId=${encodeURIComponent(assessmentId)}`;

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        <PastorHeader showFullHeader={true} />
        <p className="mt-8 text-[#cde2f2]">Missing assessment.</p>
        <Link href="/pastor/Assessments" className="mt-4 inline-block text-[#8ec5eb] underline">
          Back to Assessments
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#062946] text-white">
        <PastorHeader showFullHeader={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      </div>
    );
  }

  if (loadError || !assessment) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        <PastorHeader showFullHeader={true} />
        <p className="mt-8 text-amber-200">{loadError || "Assessment not found."}</p>
        <Link href="/pastor/Assessments" className="mt-4 inline-block text-[#8ec5eb] underline">
          Back to Assessments
        </Link>
      </div>
    );
  }
if (answersSubmitted) {
  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader={true} />

      <section className="relative overflow-hidden border-b border-white/10 bg-[#041f35]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(142,197,235,0.24),transparent_32%),linear-gradient(135deg,rgba(6,41,70,0.96)_0%,rgba(4,31,53,0.96)_45%,rgba(9,49,80,0.92)_100%)]" />

        <div className="absolute inset-0 opacity-30">
          <div className="absolute right-[-8%] top-[-35%] h-[360px] w-[620px] rotate-[-18deg] rounded-full border border-[#8ec5eb]/20 bg-[#8ec5eb]/10 blur-sm" />
          <div className="absolute right-[10%] top-[20%] h-[160px] w-[420px] rotate-[-18deg] rounded-full border border-white/10 bg-white/5" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-16">
          <button
            type="button"
            onClick={() => router.push("/pastor/Assessments")}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-[#cde2f2] transition hover:text-white"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to Assessments
          </button>

          <div className="grid min-h-[220px] grid-cols-1 gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                Assessment completed
              </p>

              <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl">
                {title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#d9ebf8]/80 sm:text-base">
                Your survey has been submitted. You can review your saved responses or retake the survey if needed.
              </p>
            </div>

            <div className="rounded-2xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-5 py-4 shadow-[0_18px_45px_rgba(2,20,38,0.35)] backdrop-blur-md">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8ec5eb]/20 text-[#8ec5eb]">
                  <i className="fa-regular fa-calendar-check" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8ec5eb]">
                    Meeting status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Meeting scheduled
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-16">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_20px_60px_rgba(2,20,38,0.32)] backdrop-blur-md sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
              Survey result
            </p>

            <h2 className="mt-3 text-2xl font-semibold text-white">
              View your submitted responses
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#cde2f2]/80">
              Open the read-only survey result page to check every section, selected answer, and available customized development plan.
            </p>

            <button
              type="button"
              onClick={() => router.push(`${surveyUrl}&readOnly=1`)}
              className="mt-8 inline-flex items-center justify-center rounded-xl bg-white px-7 py-3 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
            >
              View your Survey Results
              <i className="fa-solid fa-arrow-right ml-2 text-xs" />
            </button>
          </section>

          <aside className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
              Need changes?
            </p>

            <h3 className="mt-3 text-lg font-semibold text-white">
              Retake survey
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]/75">
              Retake only if you want to replace your previous answers.
            </p>

            <button
              type="button"
              onClick={() => {
                if (hasPreSurvey) router.push(preSurveyUrl);
                else router.push(surveyUrl);
              }}
              className="mt-6 w-full rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Retake Survey
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader={true} />

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

        <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-8 text-center backdrop-blur">
          <p className="text-3xl font-bold text-white">{cardContent.acronym}</p>
          <div className="mx-auto my-4 h-px w-24 bg-white/30" />
          <p className="text-sm font-medium tracking-wide text-[#cde2f2]">{cardContent.line1}</p>
          <p className="text-sm font-medium tracking-wide text-[#cde2f2]">{cardContent.line2}</p>
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
                onClick={() =>
                  /* Do not use viewOnly=1 here — that mode is for mentors reviewing a pastor and requires userId. */
                  router.push(`${surveyUrl}&readOnly=1`)
                }
                className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
              >
               View your Survey Results
              </button>
              {/* <button
                type="button"
                onClick={() => {
                  if (hasPreSurvey) router.push(preSurveyUrl);
                  else router.push(`${surveyUrl}&scheduleMeeting=1`);
                }}
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Repeat survey
              </button> */}
              <button
  type="button"
  onClick={() => {
    if (hasPreSurvey) router.push(preSurveyUrl);
    else router.push(surveyUrl);
  }}
  className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
>
  Repeat survey
</button>
            </>
          ) : (
            // <button
            //   type="button"
            //   onClick={() => {
            //     if (hasPreSurvey) router.push(preSurveyUrl);
            //     else router.push(`${surveyUrl}&scheduleMeeting=1`);
            //   }}
            //   className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
            // >
            //   Start now
            // </button>
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

        {/* <p className="mt-8 text-xs text-[#cde2f2]/80">
          Same flow as the mobile app: guidelines → optional pre-survey → survey → optional scheduling.
        </p> */}
      </main>
    </div>
  );
}

export default function AssessmentGuidelinesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#062946] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      }
    >
      <GuidelinesInner />
    </Suspense>
  );
}
