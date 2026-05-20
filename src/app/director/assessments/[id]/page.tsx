"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
import { resolveApiMediaUrl } from "@/app/utils/image";
import AssessmentBg from "../../../Assets/assessment-bg.png";
import DirectorHero from "../../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function getChoiceLabel(choice: unknown, index: number): string {
  if (choice == null) return `Option ${index + 1}`;
  if (typeof choice === "string") return choice;
  if (typeof choice === "object") {
    const row = choice as Record<string, unknown>;
    const text = row.label ?? row.text ?? row.value ?? row.name ?? row.title;
    if (text != null && String(text).trim()) return String(text).trim();
  }
  return `Option ${index + 1}`;
}

function getQuestionText(layer: unknown, fallback: string): string {
  if (!layer || typeof layer !== "object") return fallback;
  const row = layer as Record<string, unknown>;
  const text = row.question ?? row.title ?? row.name;
  return text != null && String(text).trim() ? String(text).trim() : fallback;
}

function getSectionTitle(section: unknown, fallback: string): string {
  if (!section || typeof section !== "object") return fallback;
  const row = section as Record<string, unknown>;
  const text = row.name ?? row.title;
  return text != null && String(text).trim() ? String(text).trim() : fallback;
}

function getSectionRecommendations(section: unknown): string[] {
  if (!section || typeof section !== "object") return [];
  const recs = (section as { recommendations?: unknown[] }).recommendations;
  if (!Array.isArray(recs)) return [];

  return recs.flatMap((rec, idx) => {
    if (typeof rec === "string") return rec.trim() ? [rec.trim()] : [];
    if (!rec || typeof rec !== "object") return [];
    const row = rec as Record<string, unknown>;
    const items = Array.isArray(row.items)
      ? row.items.map((item) => String(item || "").trim()).filter(Boolean)
      : [];
    if (items.length > 0) {
      const level = row.level != null ? `Level ${row.level}` : `Level ${idx + 1}`;
      return [`${level}: ${items.join(", ")}`];
    }
    const message = row.message ?? row.description ?? row.label;
    return message != null && String(message).trim() ? [String(message).trim()] : [];
  });
}

function formatDateTime(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function DirectorAssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const viewUserId = (searchParams.get("viewUser") || "").trim();

  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pastorMeta, setPastorMeta] = useState<{
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
            const flat = assignedRows.map((row) => flattenAssignedAssessmentRow(row)).find((row) => {
              if (!row) return false;
              const assessmentId = String(
                row.assessmentId ?? (row.assessment as any)?._id ?? (row.assessment as any)?.id ?? "",
              );
              return assessmentId === id;
            });

            const progressRows = Array.isArray(unwrapProgressData(progressRes)?.assessments)
              ? unwrapProgressData(progressRes)?.assessments
              : [];
            const progress = progressRows?.find(
              (row: any) => String(row?.assessmentId ?? row?.assessment?._id ?? row?.assessment?.id ?? "") === id,
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
              ? appointmentsList.find((appointment: any) => String(appointment?._id ?? appointment?.id ?? "") === appointmentId)
              : null;

            if (!cancelled) {
              setPastorMeta({
                status: String(progress?.status ?? "not_started"),
                dueDate: (flat as any)?.dueDate,
                appointmentId: appointmentId || undefined,
                meetingDate: appt?.meetingDate,
                meetingStatus: String(appt?.status ?? ""),
              });
            }
          } catch {
            if (!cancelled) setPastorMeta(null);
          }
        } else if (!cancelled) {
          setPastorMeta(null);
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            err && typeof err === "object" && "response" in err
              ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
              : undefined;
          setError(message || "Could not load assessment");
          setAssessment(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, viewUserId]);

  const bannerUrl = resolveApiMediaUrl(assessment?.bannerImage) || assessment?.bannerImage || "";
  const hasBanner = Boolean(bannerUrl);
  const sectionCount = Array.isArray(assessment?.sections) ? assessment.sections.length : 0;
  const questionCount = Array.isArray(assessment?.sections)
    ? assessment.sections.reduce((sum, section) => sum + (Array.isArray(section.layers) ? section.layers.length : 0), 0)
    : 0;

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Assessment"
        subtitle="Review structure and instructions."
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments", href: "/director/assessments" },
          { label: assessment?.name || "Assessment" },
        ]}
      />

      <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className={`${directorPageContainer} max-w-4xl space-y-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.push("/director/assessments")}
              className={directorBtnSecondary}
            >
              <i className="fa-solid fa-arrow-left" aria-hidden />
              Back to assessments
            </button>

            {id ? (
              <button
                type="button"
                onClick={() => router.push(`/director/assessments/${id}/edit`)}
                className={directorBtnPrimary}
              >
                <i className="fa-regular fa-pen-to-square" aria-hidden />
                Edit Assessment
              </button>
            ) : null}
          </div>

          {loading ? (
            <div className={`flex items-center justify-center gap-3 p-8 text-[#cde2f2] ${glassPanel}`}>
              <div className={directorSpinner} />
              Loading...
            </div>
          ) : null}

          {!loading && error ? (
            <div className={`p-8 text-center text-red-200 ${glassPanel}`}>{error}</div>
          ) : null}

          {!loading && assessment ? (
            <>
              <div className={`overflow-hidden p-6 sm:p-8 ${glassPanel}`}>
                <div className="flex flex-col gap-6 sm:flex-row">
                  <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl border border-white/20 sm:h-36 sm:w-52">
                    {hasBanner ? (
                      <Image
                        src={bannerUrl}
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
                        <span className="text-white/70">Sections:</span>{" "}
                        <span className="font-semibold text-white">{sectionCount}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-white/70">Questions:</span>{" "}
                        <span className="font-semibold text-white">{questionCount}</span>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                        <span className="text-white/70">Status:</span>{" "}
                        <span className="font-semibold text-white">{pastorMeta?.status || "Draft"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {viewUserId ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Pastor Assignment Details</h3>
                  <div className="grid grid-cols-1 gap-3 text-sm text-[#cde2f2] sm:grid-cols-2">
                    <p>
                      <span className="font-medium text-white">Due date:</span>{" "}
                      {pastorMeta?.dueDate ? new Date(pastorMeta.dueDate).toLocaleDateString() : "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-white">Meeting:</span>{" "}
                      {pastorMeta?.meetingDate ? formatDateTime(pastorMeta.meetingDate) : "Not scheduled"}
                    </p>
                    <p>
                      <span className="font-medium text-white">Meeting status:</span>{" "}
                      {pastorMeta?.meetingStatus || "N/A"}
                    </p>
                    <p>
                      <span className="font-medium text-white">Assessment status:</span>{" "}
                      {pastorMeta?.status || "N/A"}
                    </p>
                  </div>
                </div>
              ) : null}

              {assessment.instructions && assessment.instructions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Instructions</h3>
                  <ul className="list-inside list-disc space-y-2 text-sm text-[#cde2f2]">
                    {assessment.instructions.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {assessment.preSurveyQuestions && assessment.preSurveyQuestions.length > 0 ? (
                <div className={`p-6 sm:p-8 ${glassPanel}`}>
                  <h3 className="mb-4 text-lg font-semibold text-white">Pre-survey</h3>
                  <ul className="space-y-4">
                    {assessment.preSurveyQuestions.map((question, index) => (
                      <li key={question._id ?? index} className="text-sm text-[#cde2f2]">
                        <span className="font-medium text-white">{question.question}</span>
                        {question.choices?.length ? (
                          <ul className="ml-4 mt-2 list-disc text-white/80">
                            {question.choices.map((choice, choiceIndex) => (
                              <li key={choiceIndex}>{getChoiceLabel(choice, choiceIndex)}</li>
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
                    {assessment.sections.map((section, sectionIndex) => {
                      const sectionRecommendations = getSectionRecommendations(section);

                      return (
                        <li
                          key={section._id ?? sectionIndex}
                          className="rounded-xl border border-white/10 bg-white/5 p-4"
                        >
                          <p className="font-semibold text-white">
                            {sectionIndex + 1}. {getSectionTitle(section, "Section")}
                          </p>
                          {section.description ? (
                            <p className="mt-2 text-sm text-[#cde2f2]">{section.description}</p>
                          ) : null}

                          {section.layers?.length ? (
                            <ul className="mt-4 space-y-4">
                              {section.layers.map((layer, layerIndex) => (
                                <li
                                  key={layer._id ?? layerIndex}
                                  className="rounded-lg border border-white/10 bg-[#041f35]/40 p-4"
                                >
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                    Question {layerIndex + 1}
                                  </p>
                                  <p className="mt-1 text-sm font-medium text-white">
                                    {getQuestionText(layer, "Untitled question")}
                                  </p>
                                  {layer.choices?.length ? (
                                    <div className="mt-3">
                                      <p className="mb-2 text-xs uppercase tracking-wide text-white/65">Options</p>
                                      <ul className="space-y-1.5">
                                        {layer.choices.map((choice, choiceIndex) => (
                                          <li
                                            key={`${layer._id ?? layerIndex}-choice-${choiceIndex}`}
                                            className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-[#d9ebf8]"
                                          >
                                            {getChoiceLabel(choice, choiceIndex)}
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
                                        {(layer as { recommendations: unknown[] }).recommendations.map((rec, recIndex) => (
                                          <li
                                            key={`${layer._id ?? layerIndex}-rec-${recIndex}`}
                                            className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-2 text-sm text-[#cde2f2]"
                                          >
                                            {String(rec || "").trim() || `Level ${recIndex + 1}`}
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

                          {sectionRecommendations.length > 0 ? (
                            <div className="mt-4 rounded-lg border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                Section Recommendations
                              </p>
                              <ul className="space-y-1.5">
                                {sectionRecommendations.map((recommendation, recommendationIndex) => (
                                  <li
                                    key={`${section._id ?? sectionIndex}-section-rec-${recommendationIndex}`}
                                    className="text-sm text-[#cde2f2]"
                                  >
                                    {recommendation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <p className="text-sm text-[#cde2f2]">No sections defined.</p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
