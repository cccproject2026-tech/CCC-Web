"use client";
import { useState, useEffect, useCallback, useMemo, useLayoutEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorSearchBar from "@/app/Components/pastor/PastorSearchBar";
import PastorFilterTabGroup from "@/app/Components/pastor/PastorFilterTabGroup";
import {
  pastorContainer,
  pastorControlsRow,
  pastorEmptyPanel,
  pastorEyebrowDot,
  pastorEyebrowPill,
  pastorGlassCard,
  pastorHeroOverlay,
  pastorIconButton,
  pastorMainGradient,
  pastorPageRoot,
  pastorPrimaryCta,
  pastorRoadmapDescriptionPre,
  pastorSpinner,
} from "@/app/Components/pastor/pastor-theme";
import PhaseImg from "@/app/Assets/phase-img.png";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getCookie } from "@/app/utils/cookies";
import {
  collapseRoadmapAssignmentsToParents,
  fetchRoadmapAssignmentsForUser,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";

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
  /** Parent roadmap has nested tasks — View opens sub-phase list (SelfRevitalizationPhasePage). */
  hasNestedTasks?: boolean;
}

const TABS: TabKey[] = ["All", "Due", "In Progress", "Not Started", "Completed"];

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

function formatStatusDisplay(status: UiStatus): string {
  if (status === "In-progress") return "In Progress";
  return status;
}

export default function RevitalizationRoadmap() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [phases, setPhases] = useState<PhaseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const getSessionUserId = (): string => {
    const direct = getCookie("userId")?.trim();
    if (direct) return direct;
    try {
      const user = JSON.parse(getCookie("user") || "{}") as { id?: string; _id?: string };
      return String(user?.id || user?._id || "");
    } catch {
      return "";
    }
  };

  const fetchRoadmaps = useCallback(async (showLoader = true) => {
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
        imageUrl: isValidImageUrl(item.imageUrl) ? item.imageUrl : PhaseImg.src,
        hasNestedTasks: item.hasNestedTasks === true,
      }));

      setPhases(mappedPhases);
      setError("");
    } catch (err: any) {
      console.error(err);
      setPhases([]);
      setError(err?.response?.data?.message || "Unable to fetch roadmap data from API.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    const t = tabKeyFromSearchParam(searchParams.get("tab"));
    if (t) setActiveTab(t);
  }, [searchParams]);

  useEffect(() => {
    fetchRoadmaps();

    const onFocus = () => fetchRoadmaps(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRoadmaps(false);
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    const unsubProgress = subscribeProgressUpdated((uid) => {
      if (uid === getSessionUserId()) fetchRoadmaps(false);
    });
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubProgress();
    };
  }, [fetchRoadmaps, pathname]);

  const filteredPhases = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return phases.filter((phase) => {
      const matchesSearch =
        !q ||
        phase.title.toLowerCase().includes(q) ||
        phase.description.toLowerCase().includes(q) ||
        phase.parentRoadmapName.toLowerCase().includes(q);

      const matchesTab =
        activeTab === "All" ||
        normalizeStatus(phase.status) === normalizeStatus(activeTab);
      return matchesSearch && matchesTab;
    });
  }, [phases, searchTerm, activeTab]);

  if (loading) {
    return (
      <div className={pastorPageRoot}>
        <PastorHeader showFullHeader={true} />
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <div className={pastorSpinner} />
          <p className="text-sm text-[#cde2f2]">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const showLogin =
      /sign in|log in|session|not found/i.test(error) && !/Unable to fetch/i.test(error);
    return (
      <div className={pastorPageRoot}>
        <PastorHeader showFullHeader={true} />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <div className="max-w-xl rounded-2xl border border-red-400/25 bg-red-500/10 p-5 text-center">
            <p className="text-red-100">{error}</p>
            {showLogin && (
              <p className="mt-3 text-sm text-[#cde2f2]">
                <Link href="/pastor/login" className="font-semibold text-white underline underline-offset-2 hover:text-[#8ec5eb]">
                  Go to pastor login
                </Link>
              </p>
            )}
            <button
              type="button"
              onClick={() => fetchRoadmaps()}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={pastorPageRoot}>
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="
          relative flex h-[180px] items-end bg-cover bg-bottom
          px-6 pb-6 text-white
          sm:h-[200px] sm:px-10 sm:pb-8
          md:h-[250px] md:px-20 md:pb-10
        "
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={pastorHeroOverlay} />
        <div className="relative z-10">
          <p className={pastorEyebrowPill}>
            <span className={pastorEyebrowDot} />
            Leadership Support Network
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Revitalization Roadmap
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Follow your phase-by-phase roadmap and track active milestones.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className={pastorMainGradient}>
        <div className={pastorContainer}>
          {/* Top Controls */}
          <div className={pastorControlsRow}>
            <PastorSearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search"
              aria-label="Search roadmaps"
            />

            <div className="flex w-full items-center gap-3 lg:w-auto">
              <PastorFilterTabGroup tabs={TABS} active={activeTab} onChange={setActiveTab} className="flex-1" />

              <button
                type="button"
                onClick={() => fetchRoadmaps()}
                className={pastorIconButton}
                aria-label="Refresh roadmap"
                title="Refresh roadmap"
              >
                <i className="fa-solid fa-rotate-right text-sm" />
              </button>
            </div>
          </div>

          {phases.length === 0 ? (
            <div className={pastorEmptyPanel}>
              No roadmap assignments found. Please contact your administrator.
            </div>
          ) : filteredPhases.length === 0 ? (
            <div className={pastorEmptyPanel}>No roadmaps match this filter.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {filteredPhases.map((phase) => (
                <div
                  key={`${phase.parentRoadmapId || "parent"}-${phase.id}`}
                  className={pastorGlassCard}
                >
                  <div className="relative w-full sm:w-[180px] md:w-[200px] h-[180px] md:h-[200px] flex-shrink-0 m-4">
                    <Image
                      src={phase.imageUrl}
                      alt={phase.title}
                      width={200}
                      height={200}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-1 p-4 md:p-5">
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
                        {phase.parentRoadmapName}
                      </p>
                      <h3 className="mb-1 text-[16px] font-semibold text-white md:text-[17px]">
                        {phase.title}
                      </h3>
                      <p className={`mb-3 ${pastorRoadmapDescriptionPre}`}>{phase.description}</p>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-[#d9ebf8]">
                          Status
                        </span>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                            phase.status === "Completed"
                              ? "bg-[#d8fff2] text-[#00A878]"
                              : phase.status === "In-progress"
                              ? "bg-[#fff6d8] text-[#d38a00]"
                              : phase.status === "Due"
                              ? "bg-[#ffe4e6] text-[#be123c]"
                              : "bg-[#e6edff] text-[#1e40af]"
                          }`}
                        >
                          {formatStatusDisplay(phase.status)}
                        </span>
                      </div>

                      {phase.sessionDate && (
                        <div className="flex items-center gap-2 mb-3">
                          <i className="fa-regular fa-calendar text-[#8ec5eb] text-sm"></i>
                          <input
                            type="text"
                            value={phase.sessionDate}
                            readOnly
                            className="w-[140px] rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-[#d9ebf8] focus:outline-none sm:w-[150px]"
                          />
                        </div>
                      )}

                      <p className="text-sm text-[#d9ebf8]">
                        Completion Time{" "}
                        <span className="font-semibold text-white">{phase.months}</span>
                      </p>
                    </div>

                    <div className="flex justify-end mt-3 sm:mt-0">
                      <button
                        onClick={() => {
                          if (phase.hasNestedTasks) {
                            router.push(
                              `/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(phase.id)}`,
                            );
                            return;
                          }
                          const hasParent =
                            phase.parentRoadmapId &&
                            phase.parentRoadmapId.trim() !== "" &&
                            phase.parentRoadmapId !== phase.id;
                          const href = hasParent
                            ? `/pastor/jumpstart?id=${phase.id}&parentId=${phase.parentRoadmapId}`
                            : `/pastor/jumpstart?id=${phase.id}`;
                          router.push(href);
                        }}
                        className={pastorPrimaryCta}
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
