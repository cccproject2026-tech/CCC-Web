"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import { directorBtnPrimary, directorGlassCard, directorSpinner } from "@/app/director/directorUi";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "@/app/pastor/pastor-roadmap-dashboard-shell";

export default function MentoringRoadmapPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/pastor/revitalization-roadmap");
  }, [router]);

  return (
    <div className={pastorRoadmapDashboardPageRoot}>
      <PastorHeader showFullHeader={true} />
      <PastorRoadmapDashboardBody>
        <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
          <div className={directorSpinner} />
          <div className={`${directorGlassCard} max-w-md px-6 py-5 text-center text-sm text-[#cde2f2]`}>
            <p className="font-semibold text-white">Mentoring Roadmap</p>
            <p className="mt-2 text-white/75">Redirecting to Revitalization Roadmap…</p>
            <button
              type="button"
              onClick={() => router.push("/pastor/revitalization-roadmap")}
              className={`${directorBtnPrimary} mt-5 min-w-[180px]`}
            >
              Open roadmap
            </button>
          </div>
        </div>
      </PastorRoadmapDashboardBody>
    </div>
  );
}
