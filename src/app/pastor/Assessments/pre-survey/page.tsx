"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import PastorHeader from "@/app/Components/PastorHeader";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  apiSubmitPreSurvey,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { getCookie } from "@/app/utils/cookies";

type NormalizedQ = {
  id: string;
  text: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
};

function normalizePreSurveyQuestions(raw: unknown): NormalizedQ[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q: Record<string, unknown>, i: number) => ({
    id: String(q.id ?? q._id ?? `q_${i}`),
    text: String(q.text ?? q.question ?? ""),
    required: Boolean(q.required),
    placeholder: typeof q.placeholder === "string" ? q.placeholder : undefined,
    type: typeof q.type === "string" ? q.type : undefined,
  }));
}

function readSessionUserId(): string | null {
  try {
    const userCookie = getCookie("user");
    if (!userCookie) return null;
    const user = JSON.parse(userCookie) as { id?: string; _id?: string };
    const uid = String(user.id || user._id || "");
    return uid || null;
  } catch {
    return null;
  }
}

function extractPreSurveyAnswers(body: unknown): unknown[] {
  if (!body || typeof body !== "object") return [];
  const root = body as Record<string, unknown>;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const rows = data.preSurveyAnswers ?? root.preSurveyAnswers;
  return Array.isArray(rows) ? rows : [];
}

function PreSurveyInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId")?.trim() || "";
  const retake = searchParams.get("retake") === "1";

  const toCmaSurveyHref = () => {
    const q = new URLSearchParams({ assessmentId });
    if (retake) q.set("retake", "1");
    return `/pastor/PastorSurveyCMA?${q.toString()}`;
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [hasSubmittedPreSurvey, setHasSubmittedPreSurvey] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(res.data);
        if (!cancelled) setAssessment(detail as Record<string, unknown> | null);
      } catch {
        if (!cancelled) setAssessment(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const questions = useMemo(() => {
    const raw =
      (assessment as { preSurvey?: unknown; preSurveyQuestions?: unknown })?.preSurvey ??
      (assessment as { preSurveyQuestions?: unknown })?.preSurveyQuestions;
    return normalizePreSurveyQuestions(raw);
  }, [assessment]);

  const title = String(assessment?.name ?? "Assessment");

  useEffect(() => {
    if (!assessmentId || questions.length === 0) {
      setHasSubmittedPreSurvey(false);
      return;
    }

    const uid = readSessionUserId();
    if (!uid) {
      setHasSubmittedPreSurvey(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await apiGetUserAnswers(assessmentId, uid);
        const savedRows = extractPreSurveyAnswers(res.data);
        if (savedRows.length === 0) {
          if (!cancelled) setHasSubmittedPreSurvey(false);
          return;
        }

        const mapped: Record<string, string> = {};
        for (const row of savedRows) {
          if (!row || typeof row !== "object") continue;
          const item = row as Record<string, unknown>;
          const questionId = String(item.questionId ?? item.id ?? "").trim();
          const questionText = String(item.questionText ?? item.question ?? item.text ?? "").trim();
          const matched = questions.find(
            (q) => (questionId && q.id === questionId) || (questionText && q.text === questionText),
          );
          if (!matched) continue;
          mapped[matched.id] = String(item.answer ?? item.value ?? "");
        }

        if (!cancelled) {
          setAnswers((prev) => ({ ...prev, ...mapped }));
          setHasSubmittedPreSurvey(Object.keys(mapped).length > 0);
        }
      } catch {
        if (!cancelled) setHasSubmittedPreSurvey(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, questions]);

  const handleSubmit = async () => {
    if (hasSubmittedPreSurvey && !retake) {
      router.push(toCmaSurveyHref());
      return;
    }

    const uid = readSessionUserId();
    if (!uid || !assessmentId) {
      setError("Please sign in again.");
      return;
    }

    const required = questions.filter((q) => q.required);
    const missing = required.some((q) => !String(answers[q.id] ?? "").trim());
    if (missing) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiSubmitPreSurvey(assessmentId, {
        userId: uid,
        preSurveyAnswers: questions.map((q) => ({
          questionText: q.text,
          answer: answers[q.id] ?? "",
        })),
      });
      router.push(toCmaSurveyHref());
    } catch (e) {
      console.error(e);
      let msg = "Could not submit pre-survey. Try again.";
      if (isAxiosError(e)) {
        const st = e.response?.status;
        const body = e.response?.data as { message?: string | string[] } | undefined;
        const m = body?.message;
        if (typeof m === "string" && m.trim()) msg = m.trim();
        else if (Array.isArray(m) && m[0]) msg = String(m[0]);
        else if (st === 404)
          msg =
            "Pre-survey submit is not available on the server for this assessment. Contact support or skip to the main survey if your app allows it.";
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!assessmentId) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        <PastorHeader showFullHeader={true} />
        <p className="mt-8">Missing assessment id.</p>
        <Link href="/pastor/Assessments" className="mt-4 inline-block text-[#8ec5eb] underline">
          Assessments
        </Link>
      </div>
    );
  }

  // if (loading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-[#062946] text-white">
  //       <PastorHeader showFullHeader={true} />
  //       <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
  //     </div>
  //   );
  // }
  if (loading) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#062946] text-white">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
      <p className="text-sm text-[#cde2f2]">Loading pre-survey…</p>
    </div>
  );
}

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#062946] px-6 py-16 text-center text-white">
        <PastorHeader showFullHeader={true} />
        <p className="mt-8 text-[#cde2f2]">No pre-survey questions for this assessment.</p>
        <button
          type="button"
          onClick={() => router.push(toCmaSurveyHref())}
          className="mt-6 rounded-lg bg-white px-6 py-2 text-sm font-semibold text-[#0f4a76]"
        >
          Continue to survey
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader={true} />
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 text-sm text-[#cde2f2] hover:text-white"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-[#cde2f2]">Pre-survey</p>

        <p className="mt-6 text-sm text-[#d9ebf8]">Please answer these questions:</p>

        <div className="mt-6 space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="rounded-xl border border-white/15 bg-white/5 p-4">
              <label className="mb-2 block text-sm font-medium text-white">
                {index + 1}. {q.text}
                {q.required ? <span className="text-rose-300"> *</span> : null}
              </label>
              <input
                type={q.type === "number" ? "number" : "text"}
                placeholder={q.placeholder || ""}
                value={answers[q.id] ?? ""}
                readOnly={hasSubmittedPreSurvey && !retake}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]"
              />
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-amber-200">{error}</p>}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-white/30 px-6 py-2 text-sm font-semibold text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmit}
            className="rounded-lg bg-white px-6 py-2 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] disabled:opacity-60"
          >
            {hasSubmittedPreSurvey && !retake
              ? "Continue to survey"
              : submitting
                ? "Submitting..."
                : "Submit & continue"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default function PreSurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#062946] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      }
    >
      <PreSurveyInner />
    </Suspense>
  );
}
