"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageContainer, directorPageRoot, directorSpinner } from "../../directorUi";
import { apiGetRoadmapById } from "@/app/Services/api";

type NestedItem = {
  _id?: string;
  name?: string;
  roadMapDetails?: string;
  description?: string;
  duration?: string;
  imageUrl?: string;
  phase?: string;
};

type RoadmapDoc = {
  _id?: string;
  name?: string;
  imageUrl?: string;
  divisions?: string[];
  roadmaps?: NestedItem[];
};

function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = (r as any).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data as RoadmapDoc;
    return data as RoadmapDoc;
  }
  return r as RoadmapDoc;
}

export default function DirectorPhaseListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("roadmapId")?.trim() || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapDoc | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!roadmapId) {
      setError("Missing roadmapId.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetRoadmapById(roadmapId);
        const doc = unwrapRoadmap(res.data);
        if (!cancelled) setRoadmap(doc);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load phase roadmap.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  const items = useMemo(() => {
    const list = (roadmap?.roadmaps || []).map((x) => ({
      id: String(x._id || ""),
      title: String(x.name || "Untitled phase"),
      desc: String(x.roadMapDetails || x.description || ""),
      duration: String(x.duration || ""),
      phase: String(x.phase || ""),
      imageUrl: typeof x.imageUrl === "string" ? x.imageUrl : "",
    }));
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((it) => it.title.toLowerCase().includes(query) || it.desc.toLowerCase().includes(query));
  }, [roadmap?.roadmaps, q]);

  const goToCreatePhaseTask = () => {
    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("type", "phase");
    qp.set("isEditMode", "false");
    router.push(`/director/revitalization-roadmap/roadmap-creation?${qp.toString()}`);
  };

  const openPhaseTaskEdit = (nestedRoadmapId: string) => {
    const phase = roadmap?.roadmaps?.find((r) => String(r._id) === nestedRoadmapId);
    if (!phase) return;
    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("nestedRoadmapId", nestedRoadmapId);
    qp.set("type", "phase");
    qp.set("isEditMode", "true");
    qp.set("name", String(phase.name || ""));
    qp.set("subheading", String(phase.roadMapDetails || phase.description || ""));
    qp.set("completionTime", String(phase.duration || ""));
    qp.set("selectedDivision", String(phase.phase || "All"));
    qp.set("bannerImage", String(phase.imageUrl || ""));
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Phase list"
          subtitle="Loading…"
          image={null as any}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: "Phase list" },
          ]}
        />
        <main className="flex flex-1 items-center justify-center px-4 pb-24">
          <div className={directorSpinner} />
        </main>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={roadmap?.name || "Phase roadmap"}
        subtitle="Revitalization Roadmap • Phase tasks"
        image={null as any}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "Phase list" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-4xl`}>
          <div className={`${directorGlassCard} mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <i className="fa-solid fa-arrow-left text-xs" /> Back
              </button>
              <button
                type="button"
                onClick={goToCreatePhaseTask}
                className="rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
              >
                <i className="fa-solid fa-plus text-xs" /> Task
              </button>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search phases…"
              className={`${directorInputClass} sm:max-w-[360px]`}
            />
          </div>

          {error ? (
            <div className={`${directorGlassCard} p-6 text-center text-white/80`}>{error}</div>
          ) : items.length === 0 ? (
            <div className={`${directorGlassCard} p-10 text-center text-white/70`}>
              No phases yet. Click <span className="text-white font-semibold">Task</span> to add one.
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => openPhaseTaskEdit(it.id)}
                  className={`w-full text-left ${directorGlassCard} p-5 transition hover:bg-white/10`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-white font-semibold">{it.title}</p>
                      {it.desc ? <p className="mt-1 text-sm text-white/70">{it.desc}</p> : null}
                    </div>
                    <div className="text-right text-xs text-white/60">
                      {it.duration ? <div>Duration: {it.duration}</div> : null}
                      {it.phase ? <div>Division: {it.phase}</div> : null}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

