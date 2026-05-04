"use client";

import { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorGlassCard,
  directorIconButton,
  directorPageContainer,
  directorSpinner,
} from "@/app/director/directorUi";
import { DirectorFilterSection } from "@/app/director/ui";
import PhaseImg from "@/app/Assets/phase-img.png";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import {
  collapseRoadmapAssignmentsToParents,
  fetchRoadmapAssignmentsForUser,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "../pastor-roadmap-dashboard-shell";

type TabKey = "All" | "Due" | "In Progress" | "Not Started" | "Completed";
type UiStatus = "Not Started" | "In-progress" | "Due" | "Completed";

interface PhaseCard {
  id: string;
  parentRoadmapId?: string;
  parentRoadmapName: string;
  title: string;
  description: string;
  months: string;
  status: UiStatus;
  sessionDate?: string;
  imageUrl: string;
  hasNestedTasks?: boolean;
}

function phaseSequenceIndex(phase: PhaseCard): number {
  const text = `${phase.title} ${phase.parentRoadmapName}`.toLowerCase();
  if (text.includes("jump") && text.includes("start")) return 0;
  if (text.includes("self") && text.includes("revitalization")) return 1;
  if (text.includes("church") && text.includes("empowerment")) return 2;
  if (
    text.includes("community") &&
    text.includes("revitalization") &&
    text.includes("multiplication")
  ) {
    return 3;
  }
  return -1;
}

function roadmapDisplayName(phase: PhaseCard): string {
  const t = phase.title?.trim();
  if (t) return t;
  return phase.parentRoadmapName?.trim() || "this roadmap";
}

const TABS: TabKey[] = ["All", "Due", "In Progress", "Not Started", "Completed"];

/** Minimum gap between background refreshes (focus / visibility) to avoid API rate limits. */
const SILENT_REFRESH_MIN_MS = 45_000;

function roadmapFetchErrorMessage(err: unknown): string {
  const ax = err as {
    response?: { status?: number; data?: { message?: string } };
    message?: string;
  };
  const status = ax?.response?.status;
  const raw = String(ax?.response?.data?.message || ax?.message || "").trim();
  if (
    status === 429 ||
    /too many requests|throttlerexception|rate limit/i.test(raw)
  ) {
    return "Too many requests right now. Please wait a moment, then tap Retry.";
  }
  return raw || "Unable to fetch roadmap data from API.";
}

function tabKeyFromSearchParam(raw: string | null): TabKey | null {
  if (!raw) return null;
  const d = decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/\+/g, " ");
  const map: Record<string, TabKey> = {
    all: "All",
    due: "Due",
    "in progress": "In Progress",
    inprogress: "In Progress",
    "not started": "Not Started",
    completed: "Completed",
  };
  return map[d] ?? null;
}

function tabToQueryValue(tab: TabKey): string {
  if (tab === "In Progress") return "In Progress";
  return tab;
}

function formatStatusDisplay(status: UiStatus): string {
  if (status === "In-progress") return "In Progress";
  return status;
}

function statusBadgeClasses(status: UiStatus): string {
  switch (status) {
    case "Completed":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    case "In-progress":
      return "border-[#3498DB]/40 bg-[#3498DB]/15 text-[#aed6f1]";
    case "Due":
      return "border-red-400/45 bg-red-500/15 text-red-100";
    default:
      return "border-white/20 bg-white/10 text-white/85";
  }
}

const tabBtn = (isActive: boolean) =>
  isActive
    ? "border-[#3498DB]/40 bg-[#3498DB]/20 text-white ring-1 ring-[#3498DB]/35"
    : "border-white/15 bg-white/5 text-[#d9ebf8] hover:border-white/25 hover:bg-white/10";

export default function RevitalizationRoadmap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [phases, setPhases] = useState<PhaseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sequenceGate, setSequenceGate] = useState<{
    previousName: string;
    currentName: string;
  } | null>(null);

  const lastSilentFetchAtRef = useRef(0);
  const progressRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toUiStatus = (rawStatus: unknown): UiStatus => {
    const t = String(rawStatus ?? "").trim();
    if (t === "Not Started" || t === "In-progress" || t === "Due" || t === "Completed") {
      return t as UiStatus;
    }
    const s = t.toLowerCase().replace(/_/g, " ");
    if (!s || s === "not started") return "Not Started";
    if (s.includes("complete")) return "Completed";
    if (s.includes("progress")) return "In-progress";
    if (s.includes("due") || s.includes("overdue") || s.includes("blocked")) return "Due";
    return "Not Started";
  };

  const normalizeStatus = (raw: string): string =>
    raw.trim().toLowerCase().replace(/[_\s]+/g, "-");

  const getSessionUserId = (): string => getPastorUserId()?.trim() || "";

  const fetchRoadmaps = useCallback(async (showLoader = true, bypassSilentThrottle = false) => {
    const now = Date.now();
    if (!showLoader && !bypassSilentThrottle) {
      if (now - lastSilentFetchAtRef.current < SILENT_REFRESH_MIN_MS) return;
      lastSilentFetchAtRef.current = now;
    }

    try {
      if (showLoader) setLoading(true);
      const userId = getSessionUserId();
      if (!userId) {
        setPhases([]);
        setError("User session not found. Please sign in again.");
        return;
      }

      const data: RoadmapAssignmentUi[] = await fetchRoadmapAssignmentsForUser(userId);
      const parentCards = collapseRoadmapAssignmentsToParents(data);
      const isValidImageUrl = (url?: string) =>
        !!url && (url.startsWith("http://") || url.startsWith("https://"));

      const mappedPhases: PhaseCard[] = parentCards.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.desc || "No description",
        parentRoadmapName: item.parentRoadmapName || "Roadmap",
        parentRoadmapId: item.parentRoadmapId,
        months: item.months || "N/A",
        status: toUiStatus(item.status),
        sessionDate: item.meetings?.[0] || "",
        imageUrl: (() => {
          const resolved = resolveApiMediaUrl(item.imageUrl) || "";
          return isValidImageUrl(resolved) ? resolved : PhaseImg.src;
        })(),
        hasNestedTasks: item.hasNestedTasks === true,
      }));

      setPhases(mappedPhases);
      setError("");
      lastSilentFetchAtRef.current = Date.now();
    } catch (err: unknown) {
      console.error(err);
      if (showLoader) {
        setPhases([]);
        setError(roadmapFetchErrorMessage(err));
      }
      /* Silent refresh failures: keep existing roadmap list to avoid flashing errors from rate limits. */
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    const t = tabKeyFromSearchParam(searchParams.get("tab"));
    if (t) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    fetchRoadmaps(true);

    const onFocus = () => fetchRoadmaps(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRoadmaps(false);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubProgress = subscribeProgressUpdated((uid) => {
      if (uid !== getSessionUserId()) return;
      if (progressRefreshTimerRef.current) clearTimeout(progressRefreshTimerRef.current);
      progressRefreshTimerRef.current = setTimeout(() => {
        progressRefreshTimerRef.current = null;
        fetchRoadmaps(false, true);
      }, 1500);
    });
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      if (progressRefreshTimerRef.current) clearTimeout(progressRefreshTimerRef.current);
      unsubProgress();
    };
  }, [fetchRoadmaps, pathname]);

  const setTab = useCallback(
    (tab: TabKey) => {
      setActiveTab(tab);
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tabToQueryValue(tab));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const phasesSortedForSequence = useMemo(() => {
    const known = phases.filter((p) => phaseSequenceIndex(p) >= 0);
    return [...known].sort((a, b) => phaseSequenceIndex(a) - phaseSequenceIndex(b));
  }, [phases]);

  const openPhaseRoute = useCallback(
    (phase: PhaseCard) => {
      if (phase.hasNestedTasks) {
        router.push(`/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(phase.id)}`);
        return;
      }
      const hasParent =
        phase.parentRoadmapId &&
        phase.parentRoadmapId.trim() !== "" &&
        phase.parentRoadmapId !== phase.id;
      const href = hasParent
        ? `/pastor/jumpstart?id=${encodeURIComponent(phase.id)}&parentId=${encodeURIComponent(phase.parentRoadmapId!)}`
        : `/pastor/jumpstart?id=${encodeURIComponent(phase.id)}`;
      router.push(href);
    },
    [router],
  );

  const handleViewPhase = useCallback(
    (phase: PhaseCard) => {
      const idx = phaseSequenceIndex(phase);
      if (idx <= 0) {
        openPhaseRoute(phase);
        return;
      }
      const prevPhase = phasesSortedForSequence.find((p) => phaseSequenceIndex(p) === idx - 1);
      if (prevPhase && prevPhase.status !== "Completed") {
        setSequenceGate({
          previousName: roadmapDisplayName(prevPhase),
          currentName: roadmapDisplayName(phase),
        });
        return;
      }
      openPhaseRoute(phase);
    },
    [openPhaseRoute, phasesSortedForSequence],
  );

  const filteredPhases = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return phases.filter((phase) => {
      const matchesSearch =
        !q ||
        phase.title.toLowerCase().includes(q) ||
        phase.description.toLowerCase().includes(q) ||
        phase.parentRoadmapName.toLowerCase().includes(q);

      const matchesTab =
        activeTab === "All" || normalizeStatus(phase.status) === normalizeStatus(activeTab);
      return matchesSearch && matchesTab;
    });
  }, [phases, searchTerm, activeTab]);

  if (loading) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 flex-col items-center justify-center">
            <div className={directorSpinner} />
            <p className="text-sm text-white/75">Loading your roadmap…</p>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  if (error) {
    const showLogin =
      /sign in|log in|session|not found/i.test(error) && !/Unable to fetch/i.test(error);
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 items-center justify-center px-4">
            <div className={`${directorGlassCard} max-w-xl p-6 text-center`}>
              <p className="text-red-100">{error}</p>
              {showLogin && (
                <p className="mt-3 text-sm text-white/75">
                  <Link
                    href="/pastor/login"
                    className="font-semibold text-[#aed6f1] underline underline-offset-2 hover:text-white"
                  >
                    Go to pastor login
                  </Link>
                </p>
              )}
              <button type="button" onClick={() => fetchRoadmaps()} className={`${directorBtnPrimary} mt-6`}>
                Retry
              </button>
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
        <DirectorHero
          title="Revitalization Roadmap"
          subtitle="Follow your phase-by-phase roadmap and track active milestones."
          image={HeroBg}
          titleAlign="start"
          tightenMobileLayout
          pill="Leadership Support Network"
          breadcrumbItems={[{ label: "Home", href: "/pastor/home" }, { label: "Revitalization Roadmap" }]}
          className="!rounded-2xl md:!rounded-3xl"
        />

        <main className="flex min-h-0 w-full min-w-0 flex-1 overflow-x-hidden pb-8 sm:pb-12">
          <div className={`${directorPageContainer} w-full min-w-0 max-w-7xl px-3 sm:px-6 lg:px-8`}>
              <DirectorFilterSection bare className="!mb-5 !p-3 sm:!mb-6 sm:!p-6">
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="min-w-0 w-full lg:max-w-[min(100%,28rem)] lg:flex-1">
                    <SearchBar
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search roadmaps…"
                      aria-label="Search roadmaps"
                      variant="dark"
                      className="w-full"
                    />
                  </div>

                  <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:flex-nowrap md:justify-end md:gap-2 md:overflow-x-auto md:pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {TABS.map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setTab(tab)}
                        className={`min-h-[44px] shrink-0 rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all sm:px-4 sm:text-[13px] md:py-2.5 ${tabBtn(activeTab === tab)}`}
                      >
                        {tab}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => fetchRoadmaps(false)}
                      className={`${directorIconButton} min-h-[44px] min-w-[44px] shrink-0`}
                      aria-label="Refresh roadmap"
                      title="Refresh roadmap"
                    >
                      <i className="fa-solid fa-rotate-right text-sm" />
                    </button>
                  </div>
                </div>
              </DirectorFilterSection>

              {phases.length === 0 ? (
                <div className={`${directorGlassCard} px-5 py-12 text-center text-sm text-white/65`}>
                  No roadmap assignments found. Please contact your administrator.
                </div>
              ) : filteredPhases.length === 0 ? (
                <div className={`${directorGlassCard} px-5 py-12 text-center text-sm text-white/65`}>
                  No roadmaps match this filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6">
                  {filteredPhases.map((phase) => {
                    const img =
                      typeof phase.imageUrl === "string"
                        ? resolveApiMediaUrl(phase.imageUrl) || phase.imageUrl
                        : phase.imageUrl;
                    return (
                      <div
                        key={`${phase.parentRoadmapId || "parent"}-${phase.id}`}
                        className={`${directorGlassCard} flex flex-col overflow-hidden sm:flex-row`}
                      >
                        <div className="relative aspect-[16/10] max-h-52 w-full shrink-0 sm:aspect-auto sm:h-auto sm:max-h-none sm:min-h-[200px] sm:w-[42%] sm:max-w-[220px]">
                          <Image
                            src={img}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 220px"
                            unoptimized={
                              typeof img === "string" &&
                              (img.startsWith("blob:") || isRemoteImageSrc(img))
                            }
                          />
                          <div className="absolute left-3 top-3">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusBadgeClasses(phase.status)}`}
                            >
                              {formatStatusDisplay(phase.status)}
                            </span>
                          </div>
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:gap-4 sm:p-5">
                          <div className="min-w-0 space-y-2">
                            <p className="break-words text-[10px] font-semibold uppercase tracking-wide text-[#3498DB]/90">
                              {phase.parentRoadmapName}
                            </p>
                            <h3 className="break-words text-base font-bold leading-snug text-white sm:text-lg">
                              {phase.title}
                            </h3>
                            <p className="line-clamp-4 text-sm leading-relaxed text-white/65 sm:line-clamp-3">
                              {phase.description}
                            </p>

                            {phase.sessionDate ? (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <i className="fa-regular fa-calendar text-[#8ec5eb] text-sm" aria-hidden />
                                <span className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-[#d9ebf8]">
                                  {phase.sessionDate}
                                </span>
                              </div>
                            ) : null}

                            <p className="text-sm text-white/75">
                              Completion time{" "}
                              <span className="font-semibold text-white">{phase.months}</span>
                            </p>
                          </div>

                          <div className="flex border-t border-white/10 pt-3 sm:justify-end sm:border-0 sm:pt-0">
                            <button
                              type="button"
                              onClick={() => handleViewPhase(phase)}
                              className={`${directorBtnPrimary} min-h-[44px] w-full !px-5 !py-2.5 !text-sm sm:min-h-0 sm:w-auto`}
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

      {sequenceGate && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="roadmap-sequence-title"
          onClick={() => setSequenceGate(null)}
        >
          <div
            className={`${directorGlassCard} w-full max-w-md p-6 text-center shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="roadmap-sequence-title" className="text-lg font-semibold text-white">
              Complete the previous roadmap first
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75">
              Complete{" "}
              <span className="font-semibold text-white">{sequenceGate.previousName}</span> to begin{" "}
              <span className="font-semibold text-white">{sequenceGate.currentName}</span>.
            </p>
            <button
              type="button"
              onClick={() => setSequenceGate(null)}
              className={`${directorBtnPrimary} mt-6 min-w-[120px]`}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
