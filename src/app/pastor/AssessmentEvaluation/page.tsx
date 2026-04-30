"use client";

import { useEffect, useMemo, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import { useRouter, useSearchParams } from "next/navigation";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssessmentById,
  apiGetSectionRecommendations,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";

function readPastorIdFromCookie(): string {
  const raw = getCookie("user");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { id?: string; _id?: string };
    return String(parsed.id || parsed._id || "").trim();
  } catch {
    return "";
  }
}

export default function PastorAssessmentDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = (searchParams.get("assessmentId") || "").trim();

  const pastorId = useMemo(() => readPastorIdFromCookie(), []);
  const [assessmentTitle, setAssessmentTitle] = useState("Church Assessment Evaluation (CMA)");
  const [hasMentorRecommendations, setHasMentorRecommendations] = useState(false);

  useEffect(() => {
    let active = true;

    const loadState = async () => {
      if (!assessmentId || !pastorId) {
        if (!active) return;
        setHasMentorRecommendations(false);
        return;
      }

      try {
        const detailRes = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);
        if (!active) return;
        setAssessmentTitle(String(detail?.name || "Church Assessment Evaluation (CMA)"));

        try {
          const recRes = await apiGetSectionRecommendations(assessmentId, pastorId);
          const mapped = parseRecommendationSectionsForPastorView(
            recRes.data,
            Array.isArray(detail?.sections) ? detail.sections : [],
          );
          if (!active) return;
          setHasMentorRecommendations(mapped.length > 0);
        } catch {
          if (!active) return;
          setHasMentorRecommendations(false);
        }
      } catch {
        if (!active) return;
        setHasMentorRecommendations(false);
      }
    };

    void loadState();
    return () => {
      active = false;
    };
  }, [assessmentId, pastorId]);

  const toSurveyResults = () => {
    if (!assessmentId) {
      router.push("/pastor/Assessments");
      return;
    }
    router.push(`/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(assessmentId)}&readOnly=1`);
  };

  const toRetakeSurvey = () => {
    if (!assessmentId) {
      router.push("/pastor/Assessments");
      return;
    }
    router.push(`/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(assessmentId)}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative bg-cover bg-center flex flex-col justify-end h-[340px] md:h-[300px] sm:h-[260px] max-sm:h-[240px]"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/70"></div>

        <div className="absolute top-6 left-16 text-sm text-white/70 z-10 max-md:left-6 max-sm:text-xs max-sm:top-4 max-sm:w-[90%]">
          Assessments &gt; <span className="text-white font-medium">{assessmentTitle}</span>
        </div>

        <div className="relative z-10 px-16 pb-10 max-lg:px-10 max-md:pb-6 max-sm:px-6">
          <h1 className="text-3xl font-semibold text-white tracking-wide max-md:text-2xl max-sm:text-xl">
            {assessmentTitle}
          </h1>
        </div>
      </section>

      <main className="flex-1 bg-gradient-to-b from-[#1C4F96] to-[#0C3470] px-20 py-20 max-lg:px-14 max-lg:py-16 max-md:px-8 max-md:py-10 max-sm:px-6 max-sm:py-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={toSurveyResults}
              className="bg-white text-[#103C8C] text-sm font-semibold px-6 py-2.5 rounded-md shadow-sm hover:bg-[#F3F5FF] transition max-sm:w-full"
            >
              View Your Survey Submission
            </button>

            <button
              onClick={toRetakeSurvey}
              className="border border-white/40 text-white text-sm font-medium px-6 py-2.5 rounded-md hover:bg-white/10 transition max-sm:w-full"
            >
              Retake Survey
            </button>
          </div>

          {hasMentorRecommendations && assessmentId ? (
            <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/20 bg-white/5 p-4">
              <p className="text-sm text-[#d9ebf8]">
                Customized Development Plans (CDP) are available for this assessment.
              </p>
              <button
                type="button"
                onClick={() =>
                  router.push(`/pastor/assessmentRecommendations?assessmentId=${encodeURIComponent(assessmentId)}`)
                }
                className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Customized Development Plans (CDP)
              </button>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
