"use client";
import { useState, useRef, useEffect, Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import { useSearchParams } from "next/navigation";
import {
  buildMentorRoadmapViewUrl,
  fetchMergedRoadmapsForAssignedUser,
} from "@/app/Services/roadmap-assignments";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";
import DirectorHero from "@/app/director/DirectorHero";
import { mentorPageRoot, mentorRoadmapHubMain, mentorSpinner } from "@/app/Components/mentor/mentor-theme";
import { verifyMentorPastorAccess } from "@/app/utils/mentor-pastor-link";
import { resolveRoadmapCardImageUrl } from "@/app/utils/image";

function RevitalizationRoadmapHomeContent() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpectedOutcomePopup, setShowExpectedOutcomePopup] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("4");
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [user, setUser] = useState<any>(null);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(true);
  const [roadmapsError, setRoadmapsError] = useState<string | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoadingRoadmaps(false);
      setRoadmaps([]);
      setRoadmapsError(null);
      return;
    }

    const fetchUserRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        setRoadmapsError(null);
        setAccessChecked(false);

        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setRoadmaps([]);
          setRoadmapsError(access.reason);
          return;
        }

        const data = await fetchMergedRoadmapsForAssignedUser(userId);
        setRoadmaps(data as any[]);
      } catch (err: unknown) {
        console.error("Failed to fetch user roadmaps", err);
        setRoadmaps([]);
        let msg: string | undefined;
        if (err && typeof err === "object") {
          const e = err as { message?: string; response?: { status?: number; data?: unknown } };
          const d = e.response?.data;
          if (d && typeof d === "object" && "message" in d) {
            msg = String((d as { message?: string }).message);
          }
          if (!msg && typeof e.message === "string" && !e.message.startsWith("Request failed with status")) {
            msg = e.message;
          }
          const st = e.response?.status;
          if (!msg && st === 401) msg = "Not signed in or session expired.";
          if (!msg && st === 403) msg = "You don’t have access to this user’s roadmaps.";
          if (!msg && st === 404) msg = "Roadmaps endpoint or user was not found.";
        }
        setRoadmapsError(msg || "Could not load roadmaps for this user.");
      } finally {
        setAccessChecked(true);
        setLoadingRoadmaps(false);
      }
    };

    fetchUserRoadmaps();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setUser(null);
          return;
        }
        const res = await apiGetUserById(userId);
        setUser(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, [userId]);

  const userName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  const formatStatus = (status: string) => {
    const s = String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/-/g, "_");
    if (s.includes("complete")) return "Completed";
    if (s.includes("progress") || s === "due" || s === "assigned") return "In-progress";
    if (s.includes("over") && s.includes("due")) return "Over Due";
    if (s.includes("not_started") || s === "notstarted" || s === "") return "Not Started";
    return "Not Started";
  };
const collectLeafTasks = (node: any): any[] => {
  const children = Array.isArray(node?.roadmaps) ? node.roadmaps : [];

  if (children.length === 0) {
    return [node];
  }

  return children.flatMap((child: any) => collectLeafTasks(child));
};

const isTaskCompleted = (task: any) => {
  const status = String(task?.progress?.status ?? task?.status ?? "").toLowerCase();
  return status.includes("complete");
};

const roadmapCardStatus = (roadmap: any) => {
  const children = Array.isArray(roadmap?.roadmaps) ? roadmap.roadmaps : [];

  if (children.length > 0) {
    const leafTasks = collectLeafTasks(roadmap).filter((item: any) => item !== roadmap);
    const total = leafTasks.length;
    const completed = leafTasks.filter(isTaskCompleted).length;

    if (total > 0) {
      if (completed === 0) return "Not Started";
      if (completed < total) return "In-progress";
      return "Completed";
    }
  }

  const p = roadmap?.progress;
  const raw = p?.status ?? roadmap?.status ?? "";
  return formatStatus(raw);
};
  const roadmapTaskCounts = (roadmap: any) => {
  const children = Array.isArray(roadmap?.roadmaps) ? roadmap.roadmaps : [];

  if (children.length > 0) {
    const leafTasks = collectLeafTasks(roadmap).filter((item: any) => item !== roadmap);
    const total = leafTasks.length;
    const completed = leafTasks.filter(isTaskCompleted).length;

    return {
      completed,
      total: Math.max(total, completed, 1),
    };
  }

  const p = roadmap?.progress;
  const completed = Number(p?.completedSteps ?? 0);
  const total = Number(p?.totalSteps ?? roadmap?.totalSteps ?? 0);

  return {
    completed,
    total: Math.max(total, completed, 1),
  };
};


  const filteredRoadmaps = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return roadmaps;
    return roadmaps.filter((r) => {
      const blob = `${r.name || ""} ${r.roadMapDetails || r.description || ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [roadmaps, searchQuery]);

  const handleViewClick = (roadmap: any) => {
    const uid = userId as string;
    if (!uid) return;
    const url = buildMentorRoadmapViewUrl(uid, roadmap);
    if (url) router.push(url);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowExpectedOutcomePopup(false);
      }
    };

    if (showExpectedOutcomePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExpectedOutcomePopup]);

  const expectedOutcomes = [
    { id: "4", label: "Expected Outcome - 4 Months", period: "4-months" },
    { id: "6", label: "Expected Outcome - 6 Months", period: "6-months" },
    { id: "9", label: "Expected Outcome - 9 Months", period: "9-months" },
    { id: "end", label: "Expected Outcome - End of Year", period: "end-of-year" },
  ];

  const handleOutcomeClick = (outcomeId: string) => {
    setSelectedOutcome(outcomeId);
    const outcome = expectedOutcomes.find((o) => o.id === outcomeId);
    if (outcome) {
      router.push(`/mentor/RevitalizationRoadmap/home/expected-outcome/${outcome.period}`);
      setShowExpectedOutcomePopup(false);
    }
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <DirectorHero
        title="Pastor roadmaps"
        subtitle="Review assigned roadmaps and open jump-start or phase flows for this pastor."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Revitalization Roadmap", href: "/mentor/RevitalizationRoadmap" },
          { label: userName },
        ]}
        className="mb-6"
      />

      <main className={`${mentorRoadmapHubMain} pb-12`}>
        <div className="w-full">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex w-full max-w-md items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 shadow-sm backdrop-blur">
              <i className="fa-solid fa-magnifying-glass mr-3 shrink-0 text-[#8ec5eb]" />
              <input
                type="search"
                placeholder="Search roadmaps…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none"
                aria-label="Search roadmaps"
              />
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-white/60 hover:text-white"
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              ) : null}
            </div>

            
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {loadingRoadmaps && (
              <div className="col-span-full flex justify-center py-16">
                <div className={mentorSpinner} />
              </div>
            )}

            {!userId && !loadingRoadmaps && (
              <p className="col-span-full text-center text-sm text-[#cde2f2]">
                Missing <code className="rounded bg-white/10 px-1">userId</code> in the URL. Open a pastor from the Revitalization Roadmap hub first.
              </p>
            )}

            {roadmapsError && (
              <p className="col-span-full rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
                {roadmapsError}
              </p>
            )}

            {!loadingRoadmaps && userId && !roadmapsError && roadmaps.length === 0 && (
              <p className="col-span-full text-center text-sm text-[#cde2f2]">
                No roadmaps are assigned to this user yet.
              </p>
            )}

            {!loadingRoadmaps && accessChecked && userId && !roadmapsError && !user && (
              <p className="col-span-full text-center text-sm text-[#cde2f2]">
                Pastor details could not be loaded for this mentor relationship.
              </p>
            )}

            {!loadingRoadmaps &&
              filteredRoadmaps.map((roadmap) => {
                const rid = String(roadmap._id ?? roadmap.id ?? "");
                const { completed, total } = roadmapTaskCounts(roadmap);
                const cardStatus = roadmapCardStatus(roadmap);
                const img = resolveRoadmapCardImageUrl(roadmap.imageUrl);
                return (
                  <RoadmapHomeCard
                    key={rid || roadmap.name}
                    variant="mentor"
                    img={img}
                    title={roadmap.name || "Roadmap"}
                    description={roadmap.roadMapDetails || roadmap.description || ""}
                    status={cardStatus}
                    completionTime={roadmap.duration ? `Months ${roadmap.duration}` : "—"}
                    showDateSelector={false}
                    taskCompleted={{
                      completed,
                      total,
                    }}
                    onViewClick={() => handleViewClick(roadmap)}
                    onCardClick={() => handleViewClick(roadmap)}
                  />
                );
              })}

            {!loadingRoadmaps && roadmaps.length > 0 && filteredRoadmaps.length === 0 && (
              <p className="col-span-full text-center text-sm text-[#cde2f2]">No roadmaps match your search.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function RevitalizationRoadmapHome() {
  return (
    <Suspense
      fallback={
        <div className={`${mentorPageRoot} flex flex-1 items-center justify-center py-24 text-[#cde2f2]`}>
          <div className={mentorSpinner} />
        </div>
      }
    >
      <RevitalizationRoadmapHomeContent />
    </Suspense>
  );
}
