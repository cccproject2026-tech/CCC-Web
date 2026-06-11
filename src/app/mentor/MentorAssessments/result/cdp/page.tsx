"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import HeroBg from "@/app/Assets/progress-bg.png";
import MentorHeader from "@/app/Components/MentorHeader";
import {
  apiGetAssessmentById,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";

type SectionRecommendationRow = {
  sectionId: string;
  sectionNumber?: number;
  sectionTitle: string;
  message: string;
  level?: number;
  sentAt?: string;
};

function collectSentSectionIds(payload: unknown): Set<string> {
  const sentIds = new Set<string>();

  const walk = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node !== "object") return;

    const row = node as Record<string, unknown>;
    const id = row.sectionId ?? row._id ?? row.id;
    const sentRaw = row.sent ?? row.isSent ?? row.status;
    const isSent =
      sentRaw === true ||
      String(sentRaw ?? "")
        .trim()
        .toLowerCase() === "sent";

    if (isSent && id != null) {
      sentIds.add(String(id));
    }

    if (row.data != null) walk(row.data);
    if (row.sections != null) walk(row.sections);
    if (row.recommendations != null) walk(row.recommendations);
    if (row.layers != null) walk(row.layers);
  };

  walk(payload);
  return sentIds;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function MentorAssessmentCdpPage() {
  const searchParams = useSearchParams();
  const [sectionRecommendations, setSectionRecommendations] = useState<SectionRecommendationRow[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const requestedAssessmentId = (searchParams.get("assessmentId") || "").trim();
  const userId = (searchParams.get("userId") || "").trim();

  useEffect(() => {
    let active = true;

    const loadSelectedAssessmentDetails = async () => {
      if (!userId || !requestedAssessmentId) {
        setSectionRecommendations([]);
        setAssessmentTitle("");
        return;
      }

      try {
        setLoadingDetails(true);
        const detailRes = await apiGetAssessmentById(requestedAssessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);

        let mapped: SectionRecommendationRow[] = [];
        try {
          const recommendationsRes = await apiGetSectionRecommendations(requestedAssessmentId, userId);
          const sentIds = collectSentSectionIds(recommendationsRes.data);
          let answersBySection: Record<string, number> = {};
          try {
            const answersRes = await apiGetUserAnswers(requestedAssessmentId, userId);
            const answerData = answersRes.data as Record<string, unknown>;
            const answersInner = (answerData?.data as Record<string, unknown>) || answerData;
            const answerSections = answersInner?.sections as unknown;

            if (Array.isArray(answerSections)) {
              answerSections.forEach((section: any) => {
                const sectionId = String(section?.sectionId || section?._id || "");
                const score = section?.sectionScore ?? section?.score;
                if (sectionId && score != null) {
                  answersBySection[sectionId] = Number(score);
                }
              });
            }
          } catch {
            // Keep the page useful even if answer scores are unavailable.
          }
          mapped = parseRecommendationSectionsForPastorView(
            recommendationsRes.data,
            Array.isArray(detail?.sections) ? detail.sections : [],
            answersBySection,
          );

          const responseData = recommendationsRes.data as Record<string, unknown>;
          const sections = Array.isArray(responseData?.sections) ? responseData.sections : [];

          mapped = mapped.map((row, rowIndex) => {
            let sectionNumber = rowIndex + 1;
            const matchingSectionInResponse = sections.findIndex(
              (section: any) => String(section?.sectionId || section?._id) === row.sectionId,
            );
            if (matchingSectionInResponse >= 0) {
              sectionNumber = matchingSectionInResponse + 1;
            }

            const scoreFromAnswers = answersBySection[row.sectionId];
            if (scoreFromAnswers != null) {
              return {
                ...row,
                sectionNumber,
                level: scoreFromAnswers,
              };
            }

            const matchingSection = sections.find(
              (section: any) => String(section?.sectionId || section?._id) === row.sectionId,
            );
            if (matchingSection && Array.isArray(matchingSection?.recommendations)) {
              const rec = matchingSection.recommendations[0];
              if (rec && typeof rec === "object") {
                return {
                  ...row,
                  sectionNumber,
                  level: (rec as { level?: number }).level || undefined,
                };
              }
            }

            return {
              ...row,
              sectionNumber,
            };
          });

          mapped = mapped.filter((row) => row.message.trim() !== "");
          if (sentIds.size > 0) {
            mapped = mapped.filter((row) => sentIds.has(row.sectionId));
          }
        } catch {
          mapped = [];
        }

        if (!active) return;
        setAssessmentTitle(String(detail?.name || "Assessment"));
        setSectionRecommendations(mapped);
      } catch {
        if (!active) return;
        setSectionRecommendations([]);
        setAssessmentTitle("Assessment");
      } finally {
        if (!active) return;
        setLoadingDetails(false);
      }
    };

    void loadSelectedAssessmentDetails();
    return () => {
      active = false;
    };
  }, [userId, requestedAssessmentId]);

  const handleDownloadPlans = () => {
    const rows = sectionRecommendations.filter((row) => row.message.trim());
    if (rows.length === 0) return;

    const html = `
      <html>
        <head>
          <title>CDP - ${escapeHtml(assessmentTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 24px; }
            .level { display: inline-block; font-size: 12px; font-weight: bold; color: #92400e; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 999px; padding: 5px 10px; margin-bottom: 10px; }
            .box { border: 1px solid #ddd; padding: 14px; border-radius: 8px; white-space: pre-line; }
          </style>
        </head>
        <body>
          <h1>Customized Development Plan</h1>
          <p>${escapeHtml(assessmentTitle)}</p>
          ${rows
            .map(
              (row) => `
                <h2>Section ${row.sectionNumber ?? ""} - ${escapeHtml(row.sectionTitle)}</h2>
                ${typeof row.level === "number" ? `<div class="level">Level: ${row.level}</div>` : ""}
                <div class="box">${escapeHtml(row.message).replaceAll("\n", "<br />")}</div>
              `,
            )
            .join("")}
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative bg-cover px-4 pb-10 pt-4 md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold">Customized Development Plan</h1>
        </div>
      </section>

      <main className="flex-1 px-4 py-10 md:px-20">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-5">
          {!requestedAssessmentId || !userId ? (
            <Empty text="Missing assessment or user id. Please open the plan from a specific assessment result." />
          ) : loadingDetails ? (
            <Empty text="Loading recommendations..." />
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">{assessmentTitle}</h2>
                {sectionRecommendations.length > 0 ? (
                  <button
                    type="button"
                    onClick={handleDownloadPlans}
                    className="rounded-lg bg-[#8ec5eb]/25 px-4 py-2 text-sm font-semibold hover:bg-[#8ec5eb]/35"
                  >
                    <i className="fa-solid fa-download mr-2" />
                    Download Plans
                  </button>
                ) : null}
              </div>

              {sectionRecommendations.length === 0 ? (
                <Empty text="No recommendations have been sent for this assessment yet." />
              ) : (
                <div className="space-y-5">
                  {sectionRecommendations.map((section) => (
                    <div
                      key={section.sectionId}
                      className="rounded-xl border border-white/15 bg-white/5 p-5"
                    >
                      <div className="mb-4">
                        <h3 className="text-base font-semibold text-[#8ec5eb]">
                          Section {section.sectionNumber} - {section.sectionTitle}
                        </h3>
                        {section.level != null ? (
                          <p className="mt-2 text-sm text-white/70">
                            <span className="font-semibold text-white">Level:</span> {section.level}
                          </p>
                        ) : null}
                      </div>

                      <div className="border-t border-white/10 pt-3">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                          Customized Development Plan:
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
                          {section.message}
                        </p>
                      </div>

                      {section.sentAt ? (
                        <p className="mt-3 text-xs text-white/50">
                          Sent on {new Date(section.sentAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
      <p className="text-sm text-white/55">{text}</p>
    </div>
  );
}
