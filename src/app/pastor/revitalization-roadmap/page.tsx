"use client";

import { useState, useEffect, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import SearchBar from "@/app/Components/SearchBar";
import { pastorMainGradient } from "@/app/Components/pastor/pastor-theme";
import { apiGetRoadmapById } from "@/app/Services/api";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  directorBtnPrimary,
  directorGlassCard,
  directorIconButton,
  directorPageContainer,
  directorSpinner,
} from "@/app/director/directorUi";
import { DirectorFilterSection } from "@/app/director/ui";
import MentorBannerBg from "@/app/Assets/mentor-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
// import {
//   collapseRoadmapAssignmentsToParents,
//   fetchRoadmapAssignmentsForUser,
//   type RoadmapAssignmentUi,
// } from "@/app/Services/roadmap-assignments";
import {
  collapseRoadmapAssignmentsToParents,
  fetchRoadmapAssignmentsForUser,
  unwrapNestedRoadmapsArray,
  mergeProgressOntoRoadmaps,
  deriveTaskStatusForList,
  resolveNestedTemplateItemId,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";

/** Same root + hero as `/pastor/Mymentors` (no `PastorRoadmapDashboardBody` #0A1128 backdrop). */
const PASTOR_MY_MENTORS_STYLE_ROOT =
  "relative flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white";

/** Hero overlay — matches My Mentors banner. */
const MY_MENTORS_HERO_OVERLAY =
  "absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_38%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]";

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
  imageUrl?: string;
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
//   const [recommendedTask, setRecommendedTask] = useState<{
//   phase: PhaseCard;
//   task: any;
//   taskId: string;
// } | null>(null);
const [recommendedTask, setRecommendedTask] = useState<{
  phase: PhaseCard;
  task: any;
  taskId: string;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
} | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Sequence gating removed: View should always open.

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

//   const loadRecommendedTask = useCallback(async (phaseList: PhaseCard[], userId: string) => {
//   try {
//     // const targetPhase =
//     //   phaseList.find((phase) => phase.hasNestedTasks && phase.status === "In-progress") ||
//     //   phaseList.find((phase) => phase.hasNestedTasks && phase.status !== "Completed");

//     // if (!targetPhase) {
//     //   setRecommendedTask(null);
//     //   return;
//     // }
//     const candidatePhases = [...phaseList]
//   .filter((phase) => phase.hasNestedTasks)
//   .sort((a, b) => phaseSequenceIndex(b) - phaseSequenceIndex(a));

//     const [rmRes, progRes] = await Promise.all([
//       apiGetRoadmapById(targetPhase.id),
//       apiGetUserProgress(userId),
//     ]);

//     const body = rmRes.data as { data?: unknown };
//     const rawRoadmap = body?.data ?? rmRes.data;
//     // const progressData = progRes?.data?.data ?? progRes?.data;
//     const progressData = (progRes?.data?.data ?? progRes?.data) as any;

//     const mergedRoadmaps =
//       rawRoadmap && progressData
//         ? mergeProgressOntoRoadmaps([rawRoadmap as never], progressData)
//         : [rawRoadmap];

//     const mergedRoadmap = mergedRoadmaps[0];
//     const tasks = unwrapNestedRoadmapsArray(mergedRoadmap);
// const taskStats = tasks.reduce(
//   (acc: { total: number; completed: number }, task: any) => {
//     const taskId = resolveNestedTemplateItemId(task);
//     if (!taskId) return acc;

//     const derivedStatus = deriveTaskStatusForList(progressData, {
//       parentRoadmapId: targetPhase.id,
//       taskId,
//       itemStatus: task.status != null ? String(task.status) : undefined,
//       endDate: typeof task.endDate === "string" ? task.endDate : undefined,
//     });

//     acc.total += 1;

//     if (String(derivedStatus).toLowerCase() === "completed") {
//       acc.completed += 1;
//     }

//     return acc;
//   },
//   { total: 0, completed: 0 }
// );

// const progressPercent =
//   taskStats.total > 0
//     ? Math.round((taskStats.completed / taskStats.total) * 100)
//     : 0;
//     const nextTask = tasks.find((task: any) => {
//       const taskId = resolveNestedTemplateItemId(task);
//       if (!taskId) return false;

//       const derivedStatus = deriveTaskStatusForList(progressData, {
//         parentRoadmapId: targetPhase.id,
//         taskId,
//         itemStatus: task.status != null ? String(task.status) : undefined,
//         endDate: typeof task.endDate === "string" ? task.endDate : undefined,
//       });

//       return String(derivedStatus).toLowerCase() !== "completed";
//     });

//     const taskId = nextTask ? resolveNestedTemplateItemId(nextTask) : "";

//     if (!nextTask || !taskId) {
//       setRecommendedTask(null);
//       return;
//     }

//     // setRecommendedTask({
//     //   phase: targetPhase,
//     //   task: nextTask,
//     //   taskId,
//     // });
//     setRecommendedTask({
//   phase: targetPhase,
//   task: nextTask,
//   taskId,
//   totalTasks: taskStats.total,
//   completedTasks: taskStats.completed,
//   progressPercent,
// });
//   } catch (err) {
//     console.error("Failed to load recommended task", err);
//     setRecommendedTask(null);
//   }
// }, []);
// const loadRecommendedTask = useCallback(async (phaseList: PhaseCard[], userId: string) => {
//   try {
//     const candidatePhases = [...phaseList]
//       .filter((phase) => phase.hasNestedTasks)
//       .sort((a, b) => phaseSequenceIndex(b) - phaseSequenceIndex(a));

//     for (const targetPhase of candidatePhases) {
//       const [rmRes, progRes] = await Promise.all([
//         apiGetRoadmapById(targetPhase.id),
//         apiGetUserProgress(userId),
//       ]);

//       const body = rmRes.data as { data?: unknown };
//       const rawRoadmap = body?.data ?? rmRes.data;
//       const progressData = (progRes?.data?.data ?? progRes?.data) as any;

//       const mergedRoadmaps =
//         rawRoadmap && progressData
//           ? mergeProgressOntoRoadmaps([rawRoadmap as never], progressData)
//           : [rawRoadmap];

//       const mergedRoadmap = mergedRoadmaps[0];
//       const tasks = unwrapNestedRoadmapsArray(mergedRoadmap);

//       const taskStats = tasks.reduce(
//         (acc: { total: number; completed: number }, task: any) => {
//           const taskId = resolveNestedTemplateItemId(task);
//           if (!taskId) return acc;

//           const derivedStatus = deriveTaskStatusForList(progressData, {
//             parentRoadmapId: targetPhase.id,
//             taskId,
//             itemStatus: task.status != null ? String(task.status) : undefined,
//             endDate: typeof task.endDate === "string" ? task.endDate : undefined,
//           });

//           acc.total += 1;

//           if (String(derivedStatus).toLowerCase() === "completed") {
//             acc.completed += 1;
//           }

//           return acc;
//         },
//         { total: 0, completed: 0 }
//       );

//       if (taskStats.completed === 0) {
//         continue;
//       }

//       const nextTask = tasks.find((task: any) => {
//         const taskId = resolveNestedTemplateItemId(task);
//         if (!taskId) return false;

//         const derivedStatus = deriveTaskStatusForList(progressData, {
//           parentRoadmapId: targetPhase.id,
//           taskId,
//           itemStatus: task.status != null ? String(task.status) : undefined,
//           endDate: typeof task.endDate === "string" ? task.endDate : undefined,
//         });

//         return String(derivedStatus).toLowerCase() !== "completed";
//       });

//       const taskId = nextTask ? resolveNestedTemplateItemId(nextTask) : "";

//       if (nextTask && taskId) {
//         setRecommendedTask({
//           phase: targetPhase,
//           task: nextTask,
//           taskId,
//           totalTasks: taskStats.total,
//           completedTasks: taskStats.completed,
//           progressPercent:
//             taskStats.total > 0
//               ? Math.round((taskStats.completed / taskStats.total) * 100)
//               : 0,
//         });
//         return;
//       }
//     }

//     setRecommendedTask(null);
//   } catch (err) {
//     console.error("Failed to load recommended task", err);
//     setRecommendedTask(null);
//   }
// }, []);
const loadRecommendedTask = useCallback(async (phaseList: PhaseCard[], userId: string) => {
  try {
    // const candidatePhases = [...phaseList]
    //   .filter((phase) => phase.hasNestedTasks)
    //   .sort((a, b) => phaseSequenceIndex(b) - phaseSequenceIndex(a));
    const candidatePhases = [...phaseList]
  .filter((phase) => phase.hasNestedTasks)
  .sort((a, b) => phaseSequenceIndex(a) - phaseSequenceIndex(b));

    for (const targetPhase of candidatePhases) {
      const [rmRes, progRes] = await Promise.all([
        apiGetRoadmapById(targetPhase.id),
        apiGetUserProgress(userId),
      ]);

      const body = rmRes.data as { data?: unknown };
      const rawRoadmap = body?.data ?? rmRes.data;
      const progressData = (progRes?.data?.data ?? progRes?.data) as any;

      const mergedRoadmaps =
        rawRoadmap && progressData
          ? mergeProgressOntoRoadmaps([rawRoadmap as never], progressData)
          : [rawRoadmap];

      const mergedRoadmap = mergedRoadmaps[0];
      const tasks = unwrapNestedRoadmapsArray(mergedRoadmap);

      const taskStats = tasks.reduce(
        (acc: { total: number; completed: number }, task: any) => {
          const taskId = resolveNestedTemplateItemId(task);
          if (!taskId) return acc;

          const derivedStatus = deriveTaskStatusForList(progressData, {
            parentRoadmapId: targetPhase.id,
            taskId,
            itemStatus: task.status != null ? String(task.status) : undefined,
            endDate: typeof task.endDate === "string" ? task.endDate : undefined,
          });

          acc.total += 1;

          if (String(derivedStatus).toLowerCase() === "completed") {
            acc.completed += 1;
          }

          return acc;
        },
        { total: 0, completed: 0 }
      );

      if (taskStats.completed === 0) {
        continue;
      }

      const nextTask = tasks.find((task: any) => {
        const taskId = resolveNestedTemplateItemId(task);
        if (!taskId) return false;

        const derivedStatus = deriveTaskStatusForList(progressData, {
          parentRoadmapId: targetPhase.id,
          taskId,
          itemStatus: task.status != null ? String(task.status) : undefined,
          endDate: typeof task.endDate === "string" ? task.endDate : undefined,
        });

        return String(derivedStatus).toLowerCase() !== "completed";
      });

      const taskId = nextTask ? resolveNestedTemplateItemId(nextTask) : "";

      if (nextTask && taskId) {
        setRecommendedTask({
          phase: targetPhase,
          task: nextTask,
          taskId,
          totalTasks: taskStats.total,
          completedTasks: taskStats.completed,
          progressPercent:
            taskStats.total > 0
              ? Math.round((taskStats.completed / taskStats.total) * 100)
              : 0,
        });
        return;
      }
    }

    setRecommendedTask(null);
  } catch (err) {
    console.error("Failed to load recommended task", err);
    setRecommendedTask(null);
  }
}, []);
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
      const mappedPhases: PhaseCard[] = parentCards.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.desc || "No description",
        parentRoadmapName: item.parentRoadmapName || "Roadmap",
        parentRoadmapId: item.parentRoadmapId,
        months: item.months || "N/A",
        status: toUiStatus(item.status),
        sessionDate: item.meetings?.[0] || "",
        imageUrl: resolveApiMediaUrl(item.imageUrl) || "",
        hasNestedTasks: item.hasNestedTasks === true,
      }));

      setPhases(mappedPhases);
      void loadRecommendedTask(mappedPhases, userId);
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
  // }, []);
  }, [loadRecommendedTask]);

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
      openPhaseRoute(phase);
    },
    [openPhaseRoute],
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
      <div className={PASTOR_MY_MENTORS_STYLE_ROOT}>
        <PastorHeader showFullHeader={true} />
        <main
          className={`${pastorMainGradient} flex min-h-[70vh] w-full flex-1 flex-col overflow-x-hidden px-6 py-10 md:px-16`}
        >
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className={directorSpinner} />
            <p className="text-sm text-white/75">Loading your roadmap…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    const showLogin =
      /sign in|log in|session|not found/i.test(error) && !/Unable to fetch/i.test(error);
    return (
      <div className={PASTOR_MY_MENTORS_STYLE_ROOT}>
        <PastorHeader showFullHeader={true} />
        <main
          className={`${pastorMainGradient} flex min-h-[70vh] w-full flex-1 flex-col overflow-x-hidden px-6 py-10 md:px-16`}
        >
          <div className="flex flex-1 items-center justify-center">
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
        </main>
      </div>
    );
  }

  return (
    <div className={PASTOR_MY_MENTORS_STYLE_ROOT}>
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex h-[260px] w-full flex-col bg-cover bg-center text-white md:h-[320px]"
        style={{ backgroundImage: `url(${MentorBannerBg.src})` }}
      >
        <div className={`${MY_MENTORS_HERO_OVERLAY} pointer-events-none`} aria-hidden />

        <div className="relative z-10 flex h-full min-h-0 w-full flex-1 flex-col px-6 pb-10 pt-6 md:px-16 md:pb-12 md:pt-8">
          <nav className="text-[13px] text-white/75">
            <Link href="/pastor/home" className="transition hover:text-white">
              Home
            </Link>
            <span className="mx-2 font-normal text-white/45">&gt;</span>
            <span className="font-semibold text-white">Revitalization Roadmap</span>
          </nav>

          <div className="flex min-h-0 flex-1 flex-col justify-end">
            <div className="max-w-3xl text-left">
              <h1 className="text-3xl font-semibold tracking-tight text-white drop-shadow-sm md:text-5xl">
                Revitalization Roadmap
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-snug text-[#d9ebf8] drop-shadow-sm md:mt-4 md:text-lg md:leading-normal">
                Follow your phase-by-phase roadmap and track active milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main
        className={`${pastorMainGradient} flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden px-6 pb-10 pt-10 md:px-16 sm:pb-12`}
      >
        <div className={`${directorPageContainer} w-full min-w-0`}>
              <DirectorFilterSection bare className="!mb-5 !p-3 sm:!mb-6 sm:!p-6">
                <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="min-w-0 w-full lg:max-w-[min(100%,28rem)] lg:flex-1">
                    <SearchBar
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search roadmaps…"
                      aria-label="Search roadmaps"
                      variant="dark"
                      className="w-full min-w-[260px] sm:min-w-[320px]"
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
{/* {recommendedTask ? (
  <section className={`${directorGlassCard} mb-6 overflow-hidden p-5 sm:p-6`}>
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f4d27a]">
          Recommended for today
        </p>

        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {recommendedTask.task?.name || recommendedTask.task?.title || "Continue your next task"}
        </h2>

        <p className="mt-2 text-sm text-[#cde2f2]">
          Continue the next step in {recommendedTask.phase.title}.
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          router.push(
            `/pastor/jumpstart?id=${encodeURIComponent(
              recommendedTask.taskId
            )}&parentId=${encodeURIComponent(recommendedTask.phase.id)}`
          );
        }}
        className={`${directorBtnPrimary} min-h-[44px] !px-5 !py-2.5 !text-sm`}
      >
        Continue Journey
      </button>
    </div>
  </section>
) : null} */}
{recommendedTask ? (
  <section className={`${directorGlassCard} mb-6 overflow-hidden p-5 sm:p-6`}>
    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 flex-1">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#f4d27a]">
          Recommended for today
        </p>

        <h2 className="text-xl font-bold text-white sm:text-2xl">
          {recommendedTask.phase.title}
        </h2>

        <p className="mt-1 text-sm text-[#cde2f2]">
          Next step:{" "}
          <span className="font-semibold text-white">
            {recommendedTask.task?.name || recommendedTask.task?.title || "Continue your next task"}
          </span>
        </p>

        <div className="mt-4 max-w-xl">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/75">
            <span>
              {recommendedTask.completedTasks}/{recommendedTask.totalTasks} tasks completed
            </span>
            <span>{recommendedTask.progressPercent}%</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#3498DB]"
              style={{ width: `${recommendedTask.progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          router.push(
            `/pastor/jumpstart?id=${encodeURIComponent(
              recommendedTask.taskId
            )}&parentId=${encodeURIComponent(recommendedTask.phase.id)}`
          );
        }}
        className={`${directorBtnPrimary} min-h-[44px] !px-5 !py-2.5 !text-sm`}
      >
        Continue Journey
      </button>
    </div>
  </section>
) : null}
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
                          {img ? (
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
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-white/5 text-xs font-semibold uppercase tracking-wide text-white/45">
                              No image
                            </div>
                          )}
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
                              {phase.status === "Not Started" ? "Start" : "View"}
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
    </div>
  );
}
