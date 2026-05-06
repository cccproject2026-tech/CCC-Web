"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroBg from "../../Assets/progress-bg.png";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";
import axiosInstance from "@/app/Services/config/axios-instance";

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

function readCurrentPastorId(): string {
  const fallbackId = String(getCookie("userId") || "").trim();
  const raw = getCookie("user");
  if (!raw) return fallbackId;
  try {
    const parsed = JSON.parse(raw) as { id?: string; _id?: string };
    return String(parsed.id || parsed._id || fallbackId || "").trim();
  } catch {
    return fallbackId;
  }
}

export default function PastorAssessmentRecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sectionRecommendations, setSectionRecommendations] = useState<SectionRecommendationRow[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const pastorId = useMemo(() => readCurrentPastorId(), []);
  const requestedAssessmentId = (searchParams.get("assessmentId") || "").trim();

  useEffect(() => {
    let active = true;

    const loadSelectedAssessmentDetails = async () => {
      if (!pastorId || !requestedAssessmentId) {
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
          const recommendationsRes = await axiosInstance.get(
            `/assessment/${requestedAssessmentId}/recommendations/${pastorId}`,
          );
          const sentIds = collectSentSectionIds(recommendationsRes.data);
          mapped = parseRecommendationSectionsForPastorView(
            recommendationsRes.data,
            Array.isArray(detail?.sections) ? detail.sections : [],
          );
          
          // Fetch user answers to get section scores
          let answersBySection: Record<string, number> = {};
          try {
            const answersRes = await apiGetUserAnswers(requestedAssessmentId, pastorId);
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
            // If answer fetch fails, continue without scores
          }
          
          // Extract level from scores or recommendations
          const enrichLevelInfo = (rows: SectionRecommendationRow[]): SectionRecommendationRow[] => {
            const responseData = recommendationsRes.data as Record<string, unknown>;
            const sections = Array.isArray(responseData?.sections) ? responseData.sections : [];
            
            return rows.map((row, rowIndex) => {
              // Get section number from the position in the recommendations sections array
              let sectionNumber = rowIndex + 1;
              const matchingSectionInResponse = sections.findIndex((s: any) => String(s?.sectionId || s?._id) === row.sectionId);
              if (matchingSectionInResponse >= 0) {
                sectionNumber = matchingSectionInResponse + 1;
              }
              
              // First priority: get score from answers
              const scoreFromAnswers = answersBySection[row.sectionId];
              if (scoreFromAnswers != null) {
                return {
                  ...row,
                  sectionNumber,
                  level: scoreFromAnswers
                };
              }
              
              // Fallback: get level from recommendations
              const matchingSection = sections.find((s: any) => String(s?.sectionId || s?._id) === row.sectionId);
              if (matchingSection && Array.isArray(matchingSection?.recommendations)) {
                const rec = matchingSection.recommendations[0];
                if (rec && typeof rec === 'object') {
                  return {
                    ...row,
                    sectionNumber,
                    level: (rec as { level?: number }).level || undefined
                  };
                }
              }
              return {
                ...row,
                sectionNumber
              };
            });
          };
          
          mapped = enrichLevelInfo(mapped);
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
  }, [pastorId, requestedAssessmentId]);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] text-white">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative bg-cover px-4 pb-10 pt-4 md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold">My Recommendations</h1>
          {/* <p className="mt-1 text-sm text-white/70">
            View mentor recommendations and download your customized development plans.
          </p> */}
        </div>
      </section>

      <main className="flex-1 px-4 py-10 md:px-20">
        <div className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-white/5 p-5">
          {!requestedAssessmentId ? (
            <Empty text="Missing assessment id. Please open recommendations from a specific assessment result." />
          ) : loadingDetails ? (
              <Empty text="Loading recommendations..." />
            ) : (
              <div>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{assessmentTitle}</h2>
                  {sectionRecommendations.length > 0 ? (
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/pastor/SurveyRecommendationDownload?assessmentId=${requestedAssessmentId}`)
                      }
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
                          <h3 className="font-semibold text-base text-[#8ec5eb]">
                            Section {section.sectionNumber} - {section.sectionTitle}
                          </h3>
                          {section.level != null && (
                            <p className="mt-2 text-sm text-white/70">
                              <span className="font-semibold text-white">Level:</span> {section.level}
                            </p>
                          )}
                        </div>
                        
                        <div className="border-t border-white/10 pt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-white/60 mb-2">
                            Customized Development Plan:
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-white/85 leading-relaxed">
                            {section.message}
                          </p>
                        </div>
                        
                        {section.sentAt && (
                          <p className="mt-3 text-xs text-white/50">
                            Sent on {new Date(section.sentAt).toLocaleString()}
                          </p>
                        )}
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
