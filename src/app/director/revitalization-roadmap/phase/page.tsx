"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "../../DirectorHero";
import {
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { mergeProgressOntoRoadmaps, unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { verifyDirectorOrMentorPastorAccess } from "@/app/utils/mentor-pastor-link";

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

const warnPanel = `${directorGlassCard} border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100`;

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
        const access = await verifyDirectorOrMentorPastorAccess(userId);
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

    void load();
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
        const access = await verifyDirectorOrMentorPastorAccess(userId);
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
        const merged = roadmap ? mergeProgressOntoRoadmaps([roadmap as never], progress)[0] : null;

        setPhase((merged ?? roadmap) as Record<string, unknown> | null);
        const nested = (merged ?? roadmap)?.roadmaps;
        setTasks(Array.isArray(nested) ? (nested as Record<string, unknown>[]) : []);
      } catch (err) {
        console.error("Failed to fetch roadmap:", err);
        setPhase(null);
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchRoadmap();
  }, [roadmapId, userId]);

  const openTask = (taskId: string) => {
    if (!userId || !roadmapId) return;
    router.push(
      `/director/revitalization-roadmap/task?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(
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

  const pastorHubHref = userId
    ? `/director/pastor-assignments?assignUser=${encodeURIComponent(userId)}`
    : "/director/pastor-assignments";

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Phase"
          subtitle="Loading…"
          image={HeroBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: "Phase" },
          ]}
        />
        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className={directorSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={phaseName}
        subtitle="Review tasks for this pastor’s phase and open items for responses and comments."
        image={HeroBg}
        pill="Director · Revitalization Roadmap"
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          ...(userId ? [{ label: userName, href: pastorHubHref }] : []),
          { label: phaseName },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-7xl`}>
          {!roadmapId && (
            <p className={`${warnPanel} mb-6`}>
              Missing <code className="rounded bg-white/10 px-1">roadmapId</code> in the URL. Open a phase from a
              pastor&apos;s assignments or roadmap home.
            </p>
          )}

          {accessError && <p className={`${warnPanel} mb-6`}>{accessError}</p>}

          {roadmapId && !userId && (
            <p className={`${warnPanel} mb-6`}>
              Missing <code className="rounded bg-white/10 px-1">userId</code>. Open this phase from{" "}
              <Link href="/director/revitalization-roadmap" className="font-semibold text-white underline-offset-2 hover:underline">
                Revitalization Roadmap
              </Link>{" "}
              or{" "}
              <Link href="/director/pastor-assignments" className="font-semibold text-white underline-offset-2 hover:underline">
                Roadmap assignments
              </Link>
              .
            </p>
          )}

          <div className="mb-8 max-w-md">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search tasks…"
              variant="dark"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {roadmapId && tasks.length === 0 && (
              <p className="col-span-full text-center text-sm text-white/65">No tasks found for this phase.</p>
            )}

            {roadmapId && tasks.length > 0 && filteredTasks.length === 0 && (
              <p className="col-span-full text-center text-sm text-white/65">No tasks match your search.</p>
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

export default function DirectorPhasePage() {
  return (
    <Suspense
      fallback={
        <div className={`${directorPageRoot} items-center justify-center text-white/75`}>
          <div className={directorSpinner} />
        </div>
      }
    >
      <PhasePageContent />
    </Suspense>
  );
}
