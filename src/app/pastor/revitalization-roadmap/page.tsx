"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PhaseImg from "@/app/Assets/phase-img.png";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getCookie } from "@/app/utils/cookies";
import {
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
}

const TABS: TabKey[] = ["All", "Due", "In Progress", "Not Started", "Completed"];

function formatStatusDisplay(status: UiStatus): string {
  if (status === "In-progress") return "In Progress";
  return status;
}

export default function RevitalizationRoadmap() {
  const router = useRouter();
  const pathname = usePathname();
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
      const isValidImageUrl = (url?: string) =>
        !!url && (url.startsWith("http://") || url.startsWith("https://"));

      const mappedPhases: PhaseCard[] = data.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.desc || "No description",
        parentRoadmapName: item.parentRoadmapName || "Roadmap",
        parentRoadmapId: item.parentRoadmapId,
        months: item.months || "N/A",
        status: toUiStatus(item.status),
        sessionDate: item.meetings?.[0] || "",
        imageUrl: isValidImageUrl(item.imageUrl) ? item.imageUrl : PhaseImg.src,
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
      <div className="min-h-screen bg-[#062946] text-white">
        <PastorHeader showFullHeader={true} />
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
          <p className="text-sm text-[#cde2f2]">Loading your roadmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const showLogin =
      /sign in|log in|session|not found/i.test(error) && !/Unable to fetch/i.test(error);
    return (
      <div className="min-h-screen bg-[#062946] text-white">
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
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="
          relative bg-cover bg-bottom text-white 
          h-[180px] sm:h-[200px] md:h-[250px]
          flex items-end 
          pb-6 sm:pb-8 md:pb-10 
          px-6 sm:px-10 md:px-20
        "
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
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
      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 sm:px-8 md:px-16 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
            <div className="flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 shadow-sm backdrop-blur w-full lg:max-w-md">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[#cde2f2]"></i>
              <input
                type="text"
                placeholder="Search roadmaps..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none"
              />
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center rounded-xl border border-white/20 bg-white/10 px-2 py-1 overflow-x-auto shadow-sm backdrop-blur flex-1 lg:flex-none">
                {TABS.map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 lg:px-4 py-1.5 whitespace-nowrap text-xs lg:text-sm font-medium rounded-md transition-all ${
                        activeTab === tab
                          ? "bg-white text-[#0f4a76]"
                          : "text-[#d9ebf8] hover:bg-white/15"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchRoadmaps()}
                className="h-9 w-9 shrink-0 rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] shadow-sm transition hover:bg-white/20"
                aria-label="Refresh roadmap"
                title="Refresh roadmap"
              >
                <i className="fa-solid fa-rotate-right text-sm"></i>
              </button>
            </div>
          </div>

          {phases.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-[#cde2f2]">
              No roadmap assignments found. Please contact your administrator.
            </div>
          ) : filteredPhases.length === 0 ? (
            <div className="rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-[#cde2f2]">
              No roadmaps match this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              {filteredPhases.map((phase) => (
                <div
                  key={`${phase.parentRoadmapId || "parent"}-${phase.id}`}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
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
                      <p className="mb-3 text-sm text-[#cde2f2]">
                        {phase.description}
                      </p>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-[#d9ebf8]">
                          Status
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-[2px] rounded ${
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

                      <div>
                        <p className="text-[12px] text-[#d9ebf8]">
                          Completion Time
                        </p>
                        <p className="text-sm font-medium text-white">
                          {phase.months}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end mt-3 sm:mt-0">
                      <button
                        onClick={() => {
                          const hasParent =
                            phase.parentRoadmapId &&
                            phase.parentRoadmapId.trim() !== "" &&
                            phase.parentRoadmapId !== phase.id;
                          const href = hasParent
                            ? `/pastor/jumpstart?id=${phase.id}&parentId=${phase.parentRoadmapId}`
                            : `/pastor/jumpstart?id=${phase.id}`;
                          router.push(href);
                        }}
                        className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
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
