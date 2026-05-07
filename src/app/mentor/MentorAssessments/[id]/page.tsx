"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "@/app/Assets/assignments-bg.png";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import {
  apiGetAssessmentById,
  apiGetAssignedAssessments,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import type { AssessmentResponse } from "@/app/Services/types/assessment.types";

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

function getChoiceLabel(choice: unknown, index: number): string {
  if (choice == null) return `Option ${index + 1}`;
  if (typeof choice === "string") return choice;
  if (typeof choice === "object") {
    const row = choice as Record<string, unknown>;
    const text =
      row.label ??
      row.text ??
      row.value ??
      row.name ??
      row.title;
    if (text != null && String(text).trim()) return String(text).trim();
  }
  return `Option ${index + 1}`;
}

export default function MentorAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const viewUserId = (searchParams.get("viewUser") || "").trim();

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menteeMeta, setMenteeMeta] = useState<{
    status: string;
    dueDate?: string;
    appointmentId?: string;
    meetingDate?: string;
    meetingStatus?: string;
  } | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError("Missing assessment id");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await apiGetAssessmentById(id);
        const data = parseAssessmentDetailPayload(res.data);
        if (!cancelled) {
          setAssessment(data);
          if (!data) setError("Assessment not found");
        }

        if (viewUserId) {
          try {
            const [assignedRes, progressRes, appointmentsRes] = await Promise.all([
              apiGetAssignedAssessments(viewUserId),
              apiGetUserProgress(viewUserId),
              apiGetAppointments({ userId: viewUserId, futureOnly: false } as any),
            ]);
            const assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
            const flat = assignedRows.map((r) => flattenAssignedAssessmentRow(r)).find((r) => {
              if (!r) return false;
              const aid = String(r.assessmentId ?? (r.assessment as any)?._id ?? (r.assessment as any)?.id ?? "");
              return aid === id;
            });

            const progressRows = Array.isArray(unwrapProgressData(progressRes)?.assessments)
              ? unwrapProgressData(progressRes)?.assessments
              : [];
            const progress = progressRows?.find(
              (p: any) => String(p?.assessmentId ?? p?.assessment?._id ?? p?.assessment?.id ?? "") === id,
            );

            const appointmentId = String(
              (flat as any)?.appointmentId ?? ((flat as any)?.assessment as any)?.appointmentId ?? "",
            ).trim();
            const appointmentsBody: any = appointmentsRes?.data;
            const appointmentsList: any[] = Array.isArray(appointmentsBody)
              ? appointmentsBody
              : Array.isArray(appointmentsBody?.data)
                ? appointmentsBody.data
                : Array.isArray(appointmentsBody?.data?.data)
                  ? appointmentsBody.data.data
                  : [];
            const appt = appointmentId
              ? appointmentsList.find((a: any) => String(a?._id ?? a?.id ?? "") === appointmentId)
              : null;

            if (!cancelled) {
              setMenteeMeta({
                status: String(progress?.status ?? "not_started"),
                dueDate: (flat as any)?.dueDate,
                appointmentId: appointmentId || undefined,
                meetingDate: appt?.meetingDate,
                meetingStatus: String(appt?.status ?? ""),
              });
            }
          } catch {
            if (!cancelled) setMenteeMeta(null);
          }
        } else if (!cancelled) {
          setMenteeMeta(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const msg =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
          setError(msg || "Could not load assessment");
          setAssessment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const bannerUrl = assessment?.bannerImage;
  const hasBanner = isHttpUrl(bannerUrl);
  const sectionCount = Array.isArray(assessment?.sections) ? assessment.sections.length : 0;
  const layerCount = Array.isArray(assessment?.sections)
    ? assessment.sections.reduce((sum, sec) => sum + (Array.isArray(sec.layers) ? sec.layers.length : 0), 0)
    : 0;

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-center px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-4xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/mentor/MentorAssessments")}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-[#cde2f2] transition hover:bg-white/15"
            >
              <i className="fa-solid fa-arrow-left" aria-hidden />
              Back to assessments
            </button>

            <button
              type="button"
              onClick={() => router.push(`/mentor/MentorAssessments/${id}/edit`)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
            >
              <i className="fa-regular fa-pen-to-square" aria-hidden />
              Edit Assessment
            </button>
          </div>

          <h1 className="text-2xl font-semibold sm:text-3xl">Assessment</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Review structure and instructions.</p>
        </div>
      </section>

      <main className="flex-1 px-4 pb-16 sm:px-8 lg:px-20">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          {loading && (
            <div className={`p-8 text-center text-[#cde2f2] ${glassPanel}`}>Loading…</div>
          )}

          {!loading && error && (
            <div className={`p-8 text-center text-red-200 ${glassPanel}`}>{error}</div>
          )}

          {!loading && assessment && (
            <>
              <div className={`overflow-hidden p-6 sm:p-8 ${glassPanel}`}>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 sm:h-36 sm:w-52">
                    {hasBanner ? (
                      <Image
                        src={bannerUrl!}
                        alt={assessment.name || "Assessment"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 208px"
                        unoptimized
                      />
                    ) : (
                      <ApiImagePlaceholder className="absolute inset-0 rounded-xl" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-semibold text-white">{assessment.name}</h2>
                    {assessment.description ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]">{assessment.description}</p>
                    ) : null}
                    {assessment.type ? (
                      <p className="mt-3 text-xs uppercase tracking-wide text-[#8ec5eb]">Type: {assessment.type}</p>
                    ) : null}
                    <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-[#d9ebf8] sm:grid-cols-3">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-white/70">Sections:</span> <span className="font-semibold text-white">{sectionCount}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-white/70">Questions:</span> <span className="font-semibold text-white">{layerCount}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-white/70">Status:</span>{" "}
                        <span className="font-semibold text-white">{menteeMeta?.status || "Draft"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {viewUserId && (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Mentee Assignment Details</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm text-[#cde2f2] sm:grid-cols-2">
                    <p><span className="font-medium text-white">Due date:</span> {menteeMeta?.dueDate ? new Date(menteeMeta.dueDate).toLocaleDateString() : "N/A"}</p>
                    <p><span className="font-medium text-white">Meeting:</span> {menteeMeta?.meetingDate ? new Date(menteeMeta.meetingDate).toLocaleString() : "Not scheduled"}</p>
                    <p><span className="font-medium text-white">Meeting status:</span> {menteeMeta?.meetingStatus || "N/A"}</p>
                    <p><span className="font-medium text-white">Assessment status:</span> {menteeMeta?.status || "N/A"}</p>
                  </div>
                </div>
              )}

              {assessment.instructions && assessment.instructions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Instructions</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-[#cde2f2]">
                    {assessment.instructions.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {assessment.preSurveyQuestions && assessment.preSurveyQuestions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Pre-survey</h3>
                  <ul className="space-y-4">
                    {assessment.preSurveyQuestions.map((q, i) => (
                      <li key={q._id ?? i} className="text-sm text-[#cde2f2]">
                        <span className="font-medium text-white">{q.question}</span>
                        {q.choices?.length ? (
                          <ul className="mt-2 ml-4 list-disc text-white/80">
                            {q.choices.map((c, j) => (
                              <li key={j}>{c.label ?? (c as { text?: string }).text}</li>
                            ))}
                          </ul>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className={`p-6 sm:p-8 ${glassPanel}`}>
                <h3 className="mb-4 text-lg font-semibold text-white">Sections</h3>
                {assessment.sections?.length ? (
                  <ol className="space-y-6">
                    {assessment.sections.map((sec, si) => (
                      <li
                        key={sec._id ?? si}
                        className="rounded-xl border border-white/10 bg-white/5 p-4"
                      >
                        <p className="font-semibold text-white">
                          {si + 1}. {(sec as { name?: string; title?: string }).name ?? (sec as { title?: string }).title ?? "Section"}
                        </p>
                        {sec.description ? (
                          <p className="mt-2 text-sm text-[#cde2f2]">{sec.description}</p>
                        ) : null}
                        {sec.layers?.length ? (
                          <ul className="mt-4 space-y-4">
                            {sec.layers.map((layer, li) => (
                              <li key={layer._id ?? li} className="rounded-lg border border-white/10 bg-[#041f35]/40 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                  Question {li + 1}
                                </p>
                                <p className="mt-1 text-sm font-medium text-white">
                                  {(layer as { question?: string; title?: string }).question ??
                                    (layer as { title?: string }).title ??
                                    "Untitled question"}
                                </p>
                                {layer.choices?.length ? (
                                  <div className="mt-3">
                                    <p className="mb-2 text-xs uppercase tracking-wide text-white/65">Options</p>
                                    <ul className="space-y-1.5">
                                      {layer.choices.map((choice, ci) => (
                                        <li
                                          key={`${layer._id ?? li}-choice-${ci}`}
                                          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#d9ebf8]"
                                        >
                                          {getChoiceLabel(choice, ci)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <p className="mt-3 text-sm text-white/55">No options defined for this question.</p>
                                )}
                                {Array.isArray((layer as { recommendations?: unknown[] }).recommendations) &&
                                (layer as { recommendations?: unknown[] }).recommendations!.length > 0 ? (
                                  <div className="mt-3">
                                    <p className="mb-2 text-xs uppercase tracking-wide text-white/65">
                                      Customized Development Plan
                                    </p>
                                    <ul className="space-y-1.5">
                                      {(layer as { recommendations: unknown[] }).recommendations.map((rec, ri) => (
                                        <li
                                          key={`${layer._id ?? li}-rec-${ri}`}
                                          className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-2 text-sm text-[#cde2f2]"
                                        >
                                          {String(rec || "").trim() || `Level ${ri + 1}`}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-white/50">No layers</p>
                        )}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-[#cde2f2]">No sections defined.</p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
