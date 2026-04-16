"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import Logo from "../../Assets/CCCLogo.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssessmentById,
  apiGetSectionRecommendations,
  parseAssessmentDetailPayload,
} from "@/app/Services/assessment.service";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";
import { parseRecommendationSectionsForPastorView } from "@/app/utils/assessment-recommendation-view";

type DownloadSection = {
  sectionId: string;
  sectionTitle: string;
  message: string;
  sentAt?: string;
};

function readCurrentPastor() {
  const raw = getCookie("user");
  if (!raw) {
    return { id: "", name: "Pastor" };
  }
  try {
    const parsed = JSON.parse(raw) as {
      id?: string;
      _id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
    };
    const name = parsed.name || `${parsed.firstName || ""} ${parsed.lastName || ""}`.trim() || "Pastor";
    return {
      id: String(parsed.id || parsed._id || "").trim(),
      name,
    };
  } catch {
    return { id: "", name: "Pastor" };
  }
}

export default function SurveyRecommendationDownload() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId") || "";

  const pastor = useMemo(() => readCurrentPastor(), []);

  const [assessmentName, setAssessmentName] = useState("Assessment");
  const [sections, setSections] = useState<DownloadSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!assessmentId || !pastor.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const detailRes = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);

        let saved: DownloadSection[] = [];
        try {
          const recommendationsRes = await apiGetSectionRecommendations(assessmentId, pastor.id);
          saved = parseRecommendationSectionsForPastorView(
            recommendationsRes.data,
            Array.isArray(detail?.sections) ? detail.sections : [],
          );
        } catch {
          saved = [];
        }

        if (saved.length === 0) {
          const sectionTitleById = new Map<string, string>();
          (Array.isArray(detail?.sections) ? detail.sections : []).forEach((section, idx) => {
            sectionTitleById.set(String(section._id || `section_${idx}`), section.name || `Section ${idx + 1}`);
          });

          saved = getStoredRecommendationsForPastorAssessment(pastor.id, assessmentId)
            .filter((entry) => entry.sent)
            .map((entry) => ({
              sectionId: entry.sectionId,
              sectionTitle: sectionTitleById.get(entry.sectionId) || entry.sectionTitle,
              message: entry.message,
              sentAt: entry.sentAt,
            }));
        }

        if (!active) return;
        setAssessmentName(String(detail?.name || "Assessment"));
        setSections(saved);
      } catch {
        if (!active) return;
        setAssessmentName("Assessment");
        setSections([]);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [assessmentId, pastor.id]);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_18%,rgba(86,162,214,0.22),transparent_42%),linear-gradient(180deg,#0a2f4d_0%,#09233b_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <div className="flex items-center justify-between px-6 pt-8 md:px-16 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-medium text-[#cbe6f9] hover:text-white"
        >
          <i className="fa-solid fa-arrow-left" /> Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-xl bg-[#8ec5eb] px-5 py-2 text-sm font-semibold text-[#062946] shadow-[0_12px_30px_rgba(2,20,38,0.35)] transition hover:bg-[#a9d5f2]"
        >
          <i className="fa-solid fa-download mr-2" /> Download
        </button>
      </div>

      <main className="flex flex-1 justify-center py-10 print:py-0">
        <div className="w-[92%] max-w-[850px] rounded-lg border border-[#E5E7EB] bg-white px-6 py-8 text-[#0B1C58] shadow-md md:px-10 print:w-full print:max-w-none print:rounded-none print:border-0 print:shadow-none">
          <div className="mb-8 flex items-start justify-between">
            <Image src={Logo} alt="CCC Logo" width={240} height={60} className="object-contain" />
            <h3 className="text-[16px] font-semibold text-[#103C8C]">{pastor.name}</h3>
          </div>

          <div className="mb-6">
            <h2 className="text-[15px] font-semibold mb-1">
              Assessment Name: <span className="font-semibold text-[#103C8C]">{assessmentName}</span>
            </h2>
            <p className="text-[13px] text-[#6B7280]">
              Exported On: <span className="font-medium">{new Date().toLocaleDateString()}</span>
            </p>
          </div>

          {loading ? (
            <p className="text-[14px] text-[#6B7280]">Loading recommendation plans...</p>
          ) : sections.length === 0 ? (
            <p className="text-[14px] text-[#6B7280]">No recommendations available for download yet.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {sections.map((section, idx) => (
                <div key={section.sectionId} className="rounded-md border border-[#E5EAF1] bg-[#FAFBFF] p-6">
                  <h4 className="mb-3 text-[15px] font-semibold text-[#0B1C58]">
                    Section {idx + 1} - {section.sectionTitle}
                  </h4>
                  <h5 className="mb-2 text-[13px] font-medium text-[#0B1C58]">
                    Customized Development Plan:
                  </h5>
                  <p className="whitespace-pre-wrap text-[13px] text-[#374151]">{section.message}</p>
                  {section.sentAt && (
                    <p className="mt-3 text-[12px] text-[#6B7280]">
                      Sent on: {new Date(section.sentAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
