"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
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

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white">
      <PastorHeader showFullHeader={true} />
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        <p className="max-w-md text-white/80">
          {error || "Opening roadmap..."}
        </p>
      </div>
    </div>
  );
}
