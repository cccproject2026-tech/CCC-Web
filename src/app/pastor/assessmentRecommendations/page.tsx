"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroBg from "../../Assets/progress-bg.png";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssessmentById,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";
import axiosInstance from "@/app/Services/config/axios-instance";

type SectionRecommendationRow = {
  sectionId: string;
  sectionTitle: string;
  message: string;
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
          <p className="mt-1 text-sm text-white/70">
            View mentor recommendations and download your customized development plans.
          </p>
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
