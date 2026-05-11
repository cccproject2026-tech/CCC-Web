"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorContainer,
  mentorPageRoot,
  mentorRoadmapHubMain,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";
import DirectorHero from "@/app/director/DirectorHero";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  findNestedProgressForTask,
  mergeProgressOntoRoadmaps,
  normalizeRoadmapId,
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";
import { verifyMentorPastorAccess } from "@/app/utils/mentor-pastor-link";
import { resolveRoadmapCardImageUrl } from "@/app/utils/image";

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

        const phaseDoc = (merged ?? roadmap) as Record<string, unknown> | null;
        setPhase(phaseDoc);

        const parentRid = normalizeRoadmapId(
          phaseDoc?._id ?? phaseDoc?.id ?? roadmap?._id ?? roadmap?.id ?? roadmapId,
        );
        let nestedList: Record<string, unknown>[] = phaseDoc
          ? (unwrapNestedRoadmapsArray(phaseDoc as { roadmaps?: unknown }) as Record<string, unknown>[])
          : [];

        if (progress && parentRid && nestedList.length > 0) {
          nestedList = nestedList.map((task) => {
            const taskId = resolveNestedTemplateItemId(task);
            if (!taskId) return task;
            const np = findNestedProgressForTask(progress, parentRid, taskId);
            if (!np) return task;
            const completed = Number(np.completedSteps ?? 0);
            const total = Number(np.totalSteps ?? 0);
            let computedStatus = String(np.status ?? "not_started");
            if (total > 0) {
              if (completed >= total) computedStatus = "completed";
              else if (completed > 0) computedStatus = "in_progress";
              else computedStatus = "not_started";
            }
            return {
              ...task,
              progress: {
                status: computedStatus,
                completedSteps: completed,
                totalSteps: total,
              },
            };
          });
        }

        setTasks(nestedList);

        console.debug("[mentor/phase] loaded phase", {
          userId,
          roadmapId,
          tasks: nestedList.length,
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
      const blob =
        `${t.name ?? ""} ${t.description ?? ""} ${(t as { roadMapDetails?: unknown }).roadMapDetails ?? ""}`.toLowerCase();
      return blob.includes(q);
    });
  }, [tasks, searchQuery]);

  if (loading) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader={true} />
        <DirectorHero
          title="Phase"
          subtitle="Loading…"
          image={HeroBg}
          breadcrumbItems={[
            { label: "Revitalization Roadmap", href: "/mentor/RevitalizationRoadmap" },
            { label: "Phase" },
          ]}
          className="mb-6"
        />
        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className={mentorSpinner} />
        </div>
      </div>
    );
  }

  const pastorHomeHref = userId
    ? `/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(userId)}`
    : "/mentor/RevitalizationRoadmap";

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <DirectorHero
        title={phaseName}
        subtitle="Open a task to review details and continue supporting this pastor along this phase."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Revitalization Roadmap", href: "/mentor/RevitalizationRoadmap" },
          ...(userId ? [{ label: userName, href: pastorHomeHref }] : []),
          { label: phaseName },
        ]}
        className="mb-6"
      />

      <main className={`${mentorRoadmapHubMain} pb-12`}>
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
              <a href="/mentor/RevitalizationRoadmap" className="font-semibold text-white underline-offset-2 hover:underline">
                Revitalization Roadmap
              </a>
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
              filteredTasks.map((task, idx) => {
                const tid = resolveNestedTemplateItemId(task);
                const img = resolveRoadmapCardImageUrl(task.imageUrl);
                const cardStatus = taskCardStatus(task);
                const { completed, total } = taskCounts(task);
                const duration = task.duration != null ? `Months ${task.duration}` : "—";
                const blurb =
                  String(task.description ?? "").trim() ||
                  String((task as { roadMapDetails?: unknown }).roadMapDetails ?? "").trim();

                return (
                  <RoadmapHomeCard
                    key={tid || `task-${idx}`}
                    variant="mentor"
                    img={img}
                    title={String(task.name ?? "Task")}
                    description={blurb}
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
        <div className={`${mentorPageRoot} flex flex-1 items-center justify-center py-24 text-[#cde2f2]`}>
          <div className={mentorSpinner} />
        </div>
      }
    >
      <PhasePageContent />
    </Suspense>
  );
}
