"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorBreadcrumbText,
  mentorContainer,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { mergeProgressOntoRoadmaps, unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { verifyMentorPastorAccess } from "@/app/utils/mentor-pastor-link";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

function formatStatus(status: string): "Not Started" | "In-progress" | "Completed" | "Over Due" {
  const s = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (s.includes("complete")) return "Completed";
  if (s.includes("progress") || s === "due" || s === "assigned") return "In-progress";
  if (s.includes("over") && s.includes("due")) return "Over Due";
  if (s.includes("not_started") || s === "notstarted" || s === "") return "Not Started";
  return "Not Started";
}

function taskCardStatus(task: Record<string, unknown>): "Not Started" | "In-progress" | "Completed" | "Over Due" {
  const p = task?.progress as { status?: string } | undefined;
  const raw = p?.status ?? (task.status as string | undefined) ?? "";
  return formatStatus(String(raw));
}

function taskCounts(task: Record<string, unknown>): { completed: number; total: number } {
  const p = task?.progress as { completedSteps?: number; totalSteps?: number } | undefined;
  const completed = Number(p?.completedSteps ?? 0);
  const total = Number(p?.totalSteps ?? (task as { totalSteps?: number }).totalSteps ?? 0);
  return { completed, total: Math.max(total, completed, 1) };
}

function PhasePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const roadmapId = searchParams.get("roadmapId");

  const [phase, setPhase] = useState<Record<string, unknown> | null>(null);
  const [tasks, setTasks] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setUser(null);
          return;
        }
        setAccessError(null);
        const res = await apiGetUserById(userId);
        const body = res.data as { data?: unknown };
        setUser((body?.data ?? res.data) as { firstName?: string; lastName?: string });
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    load();
  }, [userId]);

  useEffect(() => {
    if (!roadmapId) {
      setLoading(false);
      setPhase(null);
      setTasks([]);
      return;
    }

    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setPhase(null);
          setTasks([]);
          return;
        }
        setAccessError(null);
        const [roadmapRes, progressRes] = await Promise.all([
          apiGetRoadmapById(roadmapId),
          userId ? apiGetUserProgress(userId).catch(() => null) : Promise.resolve(null),
        ]);

        const raw = roadmapRes.data as { data?: unknown };
        const roadmap = (raw?.data ?? roadmapRes.data) as Record<string, unknown> | null;

        const progress = progressRes ? unwrapProgressData(progressRes) : null;
        const merged = roadmap ? mergeProgressOntoRoadmaps([roadmap as any], progress)[0] : null;

        setPhase((merged ?? roadmap) as Record<string, unknown> | null);
        const nested = (merged ?? roadmap)?.roadmaps;
        setTasks(Array.isArray(nested) ? (nested as Record<string, unknown>[]) : []);

        console.debug("[mentor/phase] loaded phase", {
          userId,
          roadmapId,
          tasks: Array.isArray(nested) ? (nested as unknown[]).length : 0,
          progressMerged: Boolean(progress),
        });
      } catch (err) {
        console.error("Failed to fetch roadmap:", err);
        setPhase(null);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId, userId]);

  const openTask = (taskId: string) => {
    if (!userId || !roadmapId) return;
    router.push(
      `/mentor/RevitalizationRoadmap/task?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(
        roadmapId,
      )}&taskId=${encodeURIComponent(taskId)}`,
    );
  };

  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Pastor"
    : userId
      ? "Loading…"
      : "Pastor";

  const phaseName = String(phase?.name ?? "Phase");

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => {
      const blob = `${t.name ?? ""} ${t.description ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [tasks, searchQuery]);

  if (loading) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader={true} />
        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className={mentorSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-end bg-cover bg-bottom px-6 pb-8 pt-8 text-white sm:min-h-[240px] sm:px-10 sm:pb-10 md:px-20 md:pb-12"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Link href="/mentor/RevitalizationRoadmap" className={mentorBreadcrumbText}>
              Revitalization Roadmap
            </Link>
            <span className="opacity-70">&gt;</span>
            {userId ? (
              <>
                <Link
                  href={`/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(userId)}`}
                  className={mentorBreadcrumbText}
                >
                  {userName}
                </Link>
                <span className="opacity-70">&gt;</span>
              </>
            ) : null}
            <span className="font-semibold text-white">{phaseName}</span>
          </nav>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl md:text-4xl">{phaseName}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#cde2f2] md:text-base">
            Open a task to review details and continue supporting this pastor along this phase.
          </p>
        </div>
      </section>

      <main className={mentorMainGradient}>
        <div className={mentorContainer}>
          {!roadmapId && (
            <p className={`${mentorWarningPanel} mb-6`}>
              Missing <code className="rounded bg-white/10 px-1">roadmapId</code> in the URL. Open a phase from the pastor&apos;s roadmap list.
            </p>
          )}

          {accessError && <p className={`${mentorWarningPanel} mb-6`}>{accessError}</p>}

          {roadmapId && !userId && (
            <p className={`${mentorWarningPanel} mb-6`}>
              Missing <code className="rounded bg-white/10 px-1">userId</code>. Task links need a pastor context — open this phase from{" "}
              <Link href="/mentor/RevitalizationRoadmap" className="font-semibold text-white underline-offset-2 hover:underline">
                Revitalization Roadmap
              </Link>
              .
            </p>
          )}

          <div className="mb-8 max-w-md">
            <MentorSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks…"
              aria-label="Search tasks"
              showClear={!!roadmapId}
              disabled={!roadmapId}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {roadmapId && tasks.length === 0 && (
              <p className="col-span-full text-center text-sm text-[#cde2f2]">
                No tasks found for this phase.
              </p>
            )}

            {roadmapId &&
              tasks.length > 0 &&
              filteredTasks.length === 0 && (
                <p className="col-span-full text-center text-sm text-[#cde2f2]">No tasks match your search.</p>
              )}

            {roadmapId &&
              filteredTasks.map((task) => {
                const tid = String(task._id ?? task.id ?? "");
                const img = isHttpUrl(task.imageUrl as string | undefined)
                  ? (task.imageUrl as string)
                  : HeroBg.src;
                const cardStatus = taskCardStatus(task);
                const { completed, total } = taskCounts(task);
                const duration = task.duration != null ? `Months ${task.duration}` : "—";

                return (
                  <RoadmapHomeCard
                    key={tid || String(task.name)}
                    variant="mentor"
                    img={img}
                    title={String(task.name ?? "Task")}
                    description={String(task.description ?? "")}
                    status={cardStatus}
                    completionTime={duration}
                    showDateSelector={false}
                    taskCompleted={{
                      completed,
                      total,
                    }}
                    onViewClick={() => tid && openTask(tid)}
                    onCardClick={() => tid && openTask(tid)}
                  />
                );
              })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PhasePage() {
  return (
    <Suspense
      fallback={
        <div className={`${mentorPageRoot} items-center justify-center text-[#cde2f2]`}>
          <div className={mentorSpinner} />
        </div>
      }
    >
      <PhasePageContent />
    </Suspense>
  );
}
