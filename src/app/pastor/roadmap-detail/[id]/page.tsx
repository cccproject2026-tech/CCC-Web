"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import {
  directorBtnPrimary,
  directorGlassCard,
  directorSpinner,
} from "@/app/director/directorUi";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "@/app/pastor/pastor-roadmap-dashboard-shell";
import { apiGetRoadmapById } from "@/app/Services/api";

function unwrapRoadmapDoc(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const inner = row.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return row;
}

export default function RoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const roadmapId = String(params?.id ?? "").trim();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!roadmapId) {
      setError("Roadmap not found.");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetRoadmapById(roadmapId);
        const doc = unwrapRoadmapDoc(res.data);
        const hasNested = Array.isArray(doc?.roadmaps) && doc.roadmaps.length > 0;
        if (cancelled) return;
        if (hasNested) {
          router.replace(`/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(roadmapId)}`);
        } else {
          router.replace(`/pastor/jumpstart?id=${encodeURIComponent(roadmapId)}`);
        }
      } catch {
        if (!cancelled) setError("Could not open this roadmap.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, router]);

  if (error) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 items-center justify-center px-4">
            <div className={`${directorGlassCard} max-w-xl p-6 text-center`}>
              <p className="text-red-100">{error}</p>
              <Link
                href="/pastor/revitalization-roadmap"
                className={`${directorBtnPrimary} mt-6 inline-flex no-underline`}
              >
                Back to roadmap
              </Link>
            </div>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  return (
    <div className={pastorRoadmapDashboardPageRoot}>
      <PastorHeader showFullHeader={true} />
      <PastorRoadmapDashboardBody>
        <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className={directorSpinner} />
          <p className="text-sm text-white/75">Opening roadmap…</p>
        </div>
      </PastorRoadmapDashboardBody>
    </div>
  );
}
