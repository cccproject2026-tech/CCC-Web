"use client";
import Image from "next/image";
import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorSpinner,
} from "@/app/director/directorUi";
import { DirectorFilterSection } from "@/app/director/ui";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "@/app/pastor/pastor-roadmap-dashboard-shell";
import HeroBg from "@/app/Assets/self-revitalization-hero.png";
import PhaseImg from "@/app/Assets/phase-img.png";
import { apiGetRoadmapById } from "@/app/Services/api";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  deriveTaskStatusForList,
  unwrapProgressData,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";
import { pastorRoadmapDescriptionLineClamp3 } from "@/app/Components/pastor/pastor-theme";
import { resolveApiMediaUrl, isRemoteImageSrc } from "@/app/utils/image";

const tabBtn = (isActive: boolean) =>
  isActive
    ? "border-[#3498DB]/40 bg-[#3498DB]/20 text-white ring-1 ring-[#3498DB]/35"
    : "border-white/15 bg-white/5 text-[#d9ebf8] hover:border-white/25 hover:bg-white/10";

function getSessionUserId(): string {
  return getPastorUserId() || "";
}

function SelfRevitalizationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("id")?.trim() || null;
  const completedTaskIdParam = searchParams.get("completedTaskId")?.trim() || "";
  const sessionUserId = getSessionUserId();

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});

  const overridesStorageKey = useMemo(() => {
    const uid = String(sessionUserId || "").trim();
    const pid = String(roadmapId || "").trim();
    return uid && pid ? `ccc:phase-completed:${uid}:${pid}` : "";
  }, [sessionUserId, roadmapId]);

  const readPersistedOverrides = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    if (!overridesStorageKey) return {};
    try {
      const raw = window.localStorage.getItem(overridesStorageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as string[] | Record<string, unknown>;
      const ids = Array.isArray(parsed)
        ? parsed
        : Object.keys(parsed || {});
      const out: Record<string, string> = {};
      ids.map(String).map((s) => s.trim()).filter(Boolean).forEach((id) => {
        out[id] = "Completed";
      });
      return out;
    } catch {
      return {};
    }
  }, [overridesStorageKey]);

  const persistOverrides = useCallback((next: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (!overridesStorageKey) return;
    try {
      const ids = Object.entries(next)
        .filter(([, v]) => v === "Completed")
        .map(([k]) => k);
      window.localStorage.setItem(overridesStorageKey, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [overridesStorageKey]);

  const normalizeStatus = (status: unknown) =>
    String(status ?? "").trim().toLowerCase().replace(/[_\s]+/g, " ");

  const isCompletedStatus = (status: unknown) => {
    const s = String(status ?? "").trim().toLowerCase();
    return s === "completed" || s === "complete";
  };

  const statusLabel = (status: unknown) => {
    const s = normalizeStatus(status);
    if (!s || s === "not started") return "Not Started";
    if (s.includes("complete")) return "Completed";
    if (s.includes("progress")) return "In-progress";
    if (s.includes("due") || s.includes("overdue")) return "Due";
    return "Not Started";
  };

  /** Align cards with `/pastor/revitalization-roadmap` + jumpstart (GET /progress merge). */
  const taskStatusFromProgress = (
    item: { _id?: string; id?: string; status?: unknown; endDate?: string },
  ): string => {
    const tid = String(item._id ?? item.id ?? "").trim();
    const ov = tid ? statusOverrides[tid] : undefined;
    if (ov) return ov;
    if (!roadmapId || !tid) return statusLabel(item.status);
    const derived: RoadmapAssignmentUi["status"] = deriveTaskStatusForList(progressData, {
      parentRoadmapId: roadmapId,
      taskId: tid,
      itemStatus: item.status != null && String(item.status).trim() !== "" ? String(item.status) : undefined,
      endDate: typeof item.endDate === "string" ? item.endDate : undefined,
    });

    // If derived says "Not Started", check raw progress data — API sometimes returns
    // completedSteps > 0 with totalSteps: 0 and pct: 0 and status: "not_started" which
    // mapNestedStatus cannot detect. Compute directly from completedSteps in that case.
    if (derived === "Not Started" && progressData) {
      const parentPr = (progressData.roadmaps ?? []).find(
        (rp) => String(rp.roadMapId ?? "").trim() === roadmapId,
      );
      if (parentPr) {
        const nestedPr = (parentPr.nestedRoadmaps ?? []).find(
          (np) => String(np.nestedRoadmapId ?? "").trim() === tid,
        );
        if (nestedPr) {
          const completed = Number(nestedPr.completedSteps) || 0;
          const total = Number(nestedPr.totalSteps) || 0;
          // Only compute from steps when totalSteps > 0; otherwise keep "Not Started"
          if (total > 0) {
            if (completed >= total) return "Completed";
            if (completed > 0) return "In-progress";
          }
        }
      }
    }

    if (derived === "In-progress") return "In-progress";
    return derived;
  };

  const loadRoadmapAndProgress = useCallback(async () => {
    if (!roadmapId) {
      setError("Missing roadmap link. Open this phase from Revitalization Roadmap.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const userId = getSessionUserId();
      const rmRes = await apiGetRoadmapById(roadmapId);
      const body = rmRes.data as { data?: unknown };
      const doc = body?.data ?? rmRes.data;
      setRoadmap(doc);
      if (userId) {
        try {
          const progRes = await apiGetUserProgress(userId);
          setProgressData(unwrapProgressData(progRes));
        } catch {
          setProgressData(null);
        }
      } else {
        setProgressData(null);
        setError("User session not found. Please sign in again.");
      }
    } catch (err) {
      console.error("Failed to fetch roadmap", err);
      setRoadmap(null);
      setProgressData(null);
      setError("Could not load this roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    void loadRoadmapAndProgress();
  }, [loadRoadmapAndProgress, pathname]);

  // Hydrate persisted "Completed" overrides for this phase (prevents flip-flopping between tasks).
  useEffect(() => {
    if (!overridesStorageKey) return;
    setStatusOverrides((prev) => ({ ...readPersistedOverrides(), ...prev }));
  }, [overridesStorageKey, readPersistedOverrides]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && roadmapId) void loadRoadmapAndProgress();
    };
    document.addEventListener("visibilitychange", onVis);
    const unsub = subscribeProgressUpdated((uid) => {
      if (uid === getSessionUserId() && roadmapId) void loadRoadmapAndProgress();
    });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      unsub();
    };
  }, [roadmapId, loadRoadmapAndProgress]);

  useEffect(() => {
    if (!completedTaskIdParam) return;
    setStatusOverrides((prev) => {
      const next = { ...prev, [completedTaskIdParam]: "Completed" };
      persistOverrides(next);
      return next;
    });
  }, [completedTaskIdParam, persistOverrides]);

  // When progress API confirms completion, keep overrides persisted (optional),
  // but also ensures we re-persist after a refetch.
  useEffect(() => {
    if (!overridesStorageKey) return;
    if (!progressData) return;
    if (!roadmapId) return;
    const current = readPersistedOverrides();
    if (!Object.keys(current).length) return;
    // If API already confirms completed, leave as-is; we just re-persist to be safe.
    persistOverrides({ ...current });
  }, [progressData, overridesStorageKey, roadmapId, readPersistedOverrides, persistOverrides]);

  const title = roadmap?.name || "Self Revitalization Phase";
  const phase = roadmap?.phase || "";
  const subtitle = String(roadmap?.roadMapDetails || roadmap?.description || "").trim();
  const nestedRoadmaps: any[] = roadmap?.roadmaps || [];
  const divisions = useMemo(() => {
    const raw = Array.isArray(roadmap?.divisions) ? roadmap.divisions : [];
    const cleaned = raw.map((d: unknown) => String(d ?? "").trim()).filter(Boolean);
    return cleaned
      .filter((d: string, idx: number) => cleaned.findIndex((x: string) => x.toLowerCase() === d.toLowerCase()) === idx)
      .filter((d: string) => d.toLowerCase() !== "all");
  }, [roadmap?.divisions]);
  const filterTabs = useMemo(() => {
    if (divisions.length > 0) {
      return ["All", ...divisions, "Due", "Not Started", "Completed"];
    }
    return ["All", "Due", "Not Started", "Completed"];
  }, [divisions]);

  const isValidImageUrl = (url: string) =>
    url && (url.startsWith("http://") || url.startsWith("https://"));
  const phaseBadgeText = useMemo(() => {
    const raw = String(phase || "").trim();
    if (!raw) return "";
    const num = raw.match(/\d+/)?.[0];
    return num ? `Phase ${num}` : raw;
  }, [phase]);

  const filteredCards = nestedRoadmaps.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.roadMapDetails?.toLowerCase().includes(q);
    const mergedStatus = taskStatusFromProgress(item);
    const itemDivision = String(item.phase || "").trim();
    const hasDivisionTabs = divisions.length > 0;
    const matchesFilter =
      filter === "All" ||
      normalizeStatus(mergedStatus) === normalizeStatus(filter) ||
      (hasDivisionTabs && normalizeStatus(itemDivision) === normalizeStatus(filter));
    return matchesSearch && matchesFilter;
  });

  const cardStatusBadge = (status: string) => {
    if (isCompletedStatus(status)) return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    if (status === "In-progress") return "border-[#3498DB]/40 bg-[#3498DB]/15 text-[#aed6f1]";
    if (status === "Due") return "border-red-400/45 bg-red-500/15 text-red-100";
    return "border-white/20 bg-white/10 text-white/85";
  };

  if (loading) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-white/80">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => void loadRoadmapAndProgress()} className={directorBtnPrimary}>
                Retry
              </button>
              <button
                type="button"
                onClick={() => router.push("/pastor/revitalization-roadmap")}
                className={directorBtnSecondary}
              >
                Back
              </button>
            </div>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  const heroSubtitle =
    subtitle ||
    (roadmap?.duration ? `Completion time ${roadmap.duration}` : "Browse tasks and continue your revitalization journey.");
  const heroPill = phaseBadgeText || "Leadership Support Network";

  return (
    <div className={pastorRoadmapDashboardPageRoot}>
      <PastorHeader showFullHeader={true} />

      <PastorRoadmapDashboardBody>
        <DirectorHero
          title={title}
          subtitle={heroSubtitle}
          image={HeroBg}
          pill={heroPill}
          breadcrumbItems={[
            { label: "Home", href: "/pastor/home" },
            { label: "Revitalization Roadmap", href: "/pastor/revitalization-roadmap" },
            { label: title },
          ]}
        />

        <main className="flex-1 pb-12">
          <div className={`${directorPageContainer} max-w-7xl px-4 sm:px-6 lg:px-8`}>
            <DirectorFilterSection bare className="!mb-6 !p-4 sm:!p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="min-w-0 w-full lg:max-w-[min(100%,28rem)] lg:flex-1">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search tasks…"
                    variant="dark"
                    className="w-full"
                  />
                </div>
                <div className="flex min-w-0 w-full flex-nowrap items-stretch gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:ml-auto lg:w-auto lg:justify-end [&::-webkit-scrollbar]:hidden">
                  {filterTabs.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`shrink-0 rounded-lg border px-3 py-2.5 text-[12px] font-semibold transition-all sm:px-4 sm:text-[13px] ${tabBtn(filter === tab)}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </DirectorFilterSection>

            {filteredCards.length === 0 ? (
              <div className={`${directorGlassCard} px-5 py-16 text-center text-sm text-white/65`}>
                {nestedRoadmaps.length === 0 ? "No phases found for this roadmap." : "No results match your filter."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                {filteredCards.map((item, index) => {
                  const resolvedImage = resolveApiMediaUrl(item.imageUrl) || "";
                  const imgSrc = isValidImageUrl(resolvedImage) ? resolvedImage : PhaseImg;
                  const status = taskStatusFromProgress(item);

                  return (
                    <div
                      key={item._id || index}
                      className={`${directorGlassCard} flex flex-col overflow-hidden sm:flex-row`}
                    >
                      <div className="relative h-44 w-full shrink-0 sm:h-auto sm:min-h-[200px] sm:w-[42%] sm:max-w-[220px]">
                        <Image
                          src={imgSrc}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 220px"
                          unoptimized={
                            typeof imgSrc === "string" && (imgSrc.startsWith("blob:") || isRemoteImageSrc(imgSrc))
                          }
                        />
                        <div className="absolute left-3 top-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cardStatusBadge(status)}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0 space-y-2">
                          <h3 className="text-base font-bold leading-snug text-white sm:text-lg">{item.name}</h3>
                          <p className={pastorRoadmapDescriptionLineClamp3}>
                            {item.description || item.roadMapDetails || ""}
                          </p>

                          {item.phase ? (
                            <p className="text-xs text-[#3498DB]/90">
                              Division <span className="font-semibold text-white">{item.phase}</span>
                            </p>
                          ) : null}

                          {item.duration ? (
                            <p className="text-sm text-white/75">
                              Completion time <span className="font-semibold text-white">{item.duration}</span>
                            </p>
                          ) : null}
                        </div>

                        <div className="flex justify-end border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/pastor/jumpstart?id=${item._id}&parentId=${roadmapId}`)
                            }
                            className={`${directorBtnPrimary} !px-5 !py-2.5 !text-sm`}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PastorRoadmapDashboardBody>
    </div>
  );
}

export default function SelfRevitalizationPhasePage() {
  return (
    <Suspense
      fallback={
        <div className={pastorRoadmapDashboardPageRoot}>
          <div className="flex min-h-screen flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </div>
      }
    >
      <SelfRevitalizationContent />
    </Suspense>
  );
}
