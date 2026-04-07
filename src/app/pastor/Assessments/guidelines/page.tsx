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
                View response
              </button>
              <button
                type="button"
                onClick={() => {
                  if (hasPreSurvey) router.push(preSurveyUrl);
                  else router.push(`${surveyUrl}&scheduleMeeting=1`);
                }}
                className="rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/15"
              >
                Repeat survey
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (hasPreSurvey) router.push(preSurveyUrl);
                else router.push(`${surveyUrl}&scheduleMeeting=1`);
              }}
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
            >
              Start now
            </button>
          )}
        </div>

        <p className="mt-8 text-xs text-[#cde2f2]/80">
          Same flow as the mobile app: guidelines → optional pre-survey → survey → optional scheduling.
        </p>
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
