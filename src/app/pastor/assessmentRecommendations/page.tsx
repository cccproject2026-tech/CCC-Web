"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroBg from "../../Assets/progress-bg.png";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssessmentById,
  apiGetAssignedAssessments,
  apiGetSectionRecommendations,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";

type AssessmentRow = {
  id: string;
  name: string;
};

type SectionRecommendationRow = {
  sectionId: string;
  sectionTitle: string;
  message: string;
  sentAt?: string;
};

function readCurrentPastorId(): string {
  const raw = getCookie("user");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { id?: string; _id?: string };
    return String(parsed.id || parsed._id || "").trim();
  } catch {
    return "";
  }
}

export default function PastorAssessmentRecommendationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [sectionRecommendations, setSectionRecommendations] = useState<SectionRecommendationRow[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState("");
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const pastorId = useMemo(() => readCurrentPastorId(), []);
  const requestedAssessmentId = (searchParams.get("assessmentId") || "").trim();

  useEffect(() => {
    let active = true;

    const loadAssessments = async () => {
      if (!pastorId) {
        setLoadingAssessments(false);
        return;
      }
      try {
        setLoadingAssessments(true);
        const res = await apiGetAssignedAssessments(pastorId);
        const list = parseAssignedAssessmentsListBody(res.data)
          .map(flattenAssignedAssessmentRow)
          .filter((row): row is NonNullable<ReturnType<typeof flattenAssignedAssessmentRow>> => row !== null)
          .map((row) => ({
            id: row.assessmentId,
            name: String(row.assessment.name ?? "Untitled Assessment"),
          }));

        const uniq = list.filter((item, idx) => list.findIndex((x) => x.id === item.id) === idx);

        if (!active) return;
        setAssessments(uniq);
        setSelectedAssessmentId((current) => {
          if (current) return current;
          if (requestedAssessmentId && uniq.some((item) => item.id === requestedAssessmentId)) {
            return requestedAssessmentId;
          }
          return uniq[0]?.id || "";
        });
      } catch {
        if (!active) return;
        setAssessments([]);
      } finally {
        if (!active) return;
        setLoadingAssessments(false);
      }
    };

    void loadAssessments();
    return () => {
      active = false;
    };
  }, [pastorId, requestedAssessmentId]);

  useEffect(() => {
    let active = true;

    const loadSelectedAssessmentDetails = async () => {
      if (!pastorId || !selectedAssessmentId) {
        setSectionRecommendations([]);
        setAssessmentTitle("");
        return;
      }

      try {
        setLoadingDetails(true);
        const detailRes = await apiGetAssessmentById(selectedAssessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);

        let mapped: SectionRecommendationRow[] = [];
        try {
          const recommendationsRes = await apiGetSectionRecommendations(selectedAssessmentId, pastorId);
          mapped = parseRecommendationSectionsForPastorView(
            recommendationsRes.data,
            Array.isArray(detail?.sections) ? detail.sections : [],
          );
        } catch {
          mapped = [];
        }

        if (mapped.length === 0) {
          const sectionTitleById = new Map<string, string>();
          (Array.isArray(detail?.sections) ? detail.sections : []).forEach((section, idx) => {
            sectionTitleById.set(String(section._id || `section_${idx}`), section.name || `Section ${idx + 1}`);
          });

          const stored = getStoredRecommendationsForPastorAssessment(pastorId, selectedAssessmentId).filter(
            (entry) => entry.sent,
          );

          mapped = stored.map((entry) => ({
            sectionId: entry.sectionId,
            sectionTitle: sectionTitleById.get(entry.sectionId) || entry.sectionTitle,
            message: entry.message,
            sentAt: entry.sentAt,
          }));
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
  }, [pastorId, selectedAssessmentId]);

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
          <p className="mt-1 text-sm text-white/70">
            View mentor recommendations and download your customized development plans.
          </p>
        </div>
      </section>

      <main className="flex-1 px-4 py-10 md:px-20">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-4">
            <h2 className="mb-4 font-semibold text-[#8ec5eb]">Assessments</h2>

            {loadingAssessments ? (
              <p className="text-sm text-white/60">Loading assessments...</p>
            ) : assessments.length === 0 ? (
              <p className="text-sm text-white/60">No assessments found.</p>
            ) : (
              <div className="space-y-2">
                {assessments.map((assessment) => (
                  <button
                    key={assessment.id}
                    type="button"
                    onClick={() => setSelectedAssessmentId(assessment.id)}
                    className={`w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                      selectedAssessmentId === assessment.id
                        ? "bg-[#8ec5eb]/25 text-white"
                        : "bg-white/5 text-white/85 hover:bg-white/10"
                    }`}
                  >
                    {assessment.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-8">
            {!selectedAssessmentId ? (
              <Empty text="Select an assessment to view recommendations." />
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
                        router.push(`/pastor/SurveyRecommendationDownload?assessmentId=${selectedAssessmentId}`)
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
                  <div className="space-y-4">
                    {sectionRecommendations.map((section) => (
                      <div
                        key={section.sectionId}
                        className="rounded-xl border border-white/15 bg-white/5 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="font-semibold text-[#8ec5eb]">{section.sectionTitle}</h3>
                          <span className="text-xs text-white/60">
                            {section.sentAt
                              ? `Sent on ${new Date(section.sentAt).toLocaleString()}`
                              : "Sent"}
                          </span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">
                          {section.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
