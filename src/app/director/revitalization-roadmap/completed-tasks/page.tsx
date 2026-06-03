"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGetRoadmaps } from "@/app/Services/api";
import {
  apiGetUserProgress,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import { unwrapRoadmapsList } from "@/app/Services/roadmap-assignments";
import {
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";

function stringifyId(raw: any): string {
  if (!raw) return "";
  if (typeof raw === "object") {
    if (raw.$oid) return String(raw.$oid);
    if (raw._id) return stringifyId(raw._id);
    if (raw.id) return stringifyId(raw.id);
  }
  return String(raw);
}

function nestedList(rm: any): any[] {
  const raw = rm?.nestedRoadmaps ?? rm?.roadmaps;
  if (Array.isArray(raw)) return raw;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

function isCompleted(row: any): boolean {
  const status = String(row?.status || "").toLowerCase();
  const completedSteps = Number(row?.completedSteps || 0);
  const totalSteps = Number(row?.totalSteps || 0);
  const progress = Number(row?.progressPercentage || 0);

  return (
    status.includes("complete") ||
    progress >= 100 ||
    (totalSteps > 0 && completedSteps >= totalSteps)
  );
}

function findNestedTemplateName(roadmap: any, nestedId: string): string {
  const stack = Array.isArray(roadmap?.roadmaps) ? [...roadmap.roadmaps] : [];

  while (stack.length) {
    const item = stack.shift();
    const id = stringifyId(item?._id ?? item?.id);

    if (id === nestedId) {
      return (
        item?.name ||
        item?.title ||
        item?.roadMapDetails ||
        item?.description ||
        "Completed task"
      );
    }

    const children = Array.isArray(item?.children)
      ? item.children
      : Array.isArray(item?.tasks)
        ? item.tasks
        : Array.isArray(item?.roadmaps)
          ? item.roadmaps
          : [];

    stack.push(...children);
  }

  return "Completed task";
}

function CompletedTasksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [selectedRoadmapFilter, setSelectedRoadmapFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [progressRoadmaps, setProgressRoadmaps] = useState<any[]>([]);
  const [roadmapLibrary, setRoadmapLibrary] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const [progressRes, roadmapsRes] = await Promise.all([
          apiGetUserProgress(userId as string),
          apiGetRoadmaps("all", ""),
        ]);

        if (cancelled) return;

        const progress = unwrapUserProgressDetail(progressRes);
        setProgressRoadmaps(Array.isArray(progress?.roadmaps) ? progress.roadmaps : []);
        setRoadmapLibrary(unwrapRoadmapsList(roadmapsRes));
      } catch (err) {
        console.error("Failed to load completed roadmap tasks", err);
        setProgressRoadmaps([]);
        setRoadmapLibrary([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const completedTasks = useMemo(() => {
    const rows: any[] = [];

    for (const progressRoadmap of progressRoadmaps) {
      const roadmapId = stringifyId(
        progressRoadmap?.roadMapId ??
          progressRoadmap?.roadmapId ??
          progressRoadmap?._id,
      );

      const roadmapTemplate = roadmapLibrary.find(
        (rm) => stringifyId(rm?._id ?? rm?.id) === roadmapId,
      );

      const roadmapName =
        roadmapTemplate?.name ||
        roadmapTemplate?.title ||
        progressRoadmap?.name ||
        progressRoadmap?.title ||
        "Roadmap";

      const tasks = nestedList(progressRoadmap);

      for (const task of tasks) {
        if (!isCompleted(task)) continue;

        const nestedId = stringifyId(
          task?.nestedRoadmapId ??
            task?.nestedRoadMapId ??
            task?.nestedItemId ??
            task?._id ??
            task?.id,
        );

        rows.push({
          roadmapId,
          nestedId,
          roadmapName,
          taskName:
            task?.taskName ||
            task?.name ||
            task?.title ||
            findNestedTemplateName(roadmapTemplate, nestedId),
          completedSteps: task?.completedSteps,
          totalSteps: task?.totalSteps,
          status: task?.status || "Completed",
        });
      }
    }

    return rows;
  }, [progressRoadmaps, roadmapLibrary]);

  const roadmapFilterOptions = useMemo(() => {
  const names = completedTasks
    .map((task) => String(task.roadmapName || "").trim())
    .filter(Boolean);

  return Array.from(new Set(names));
}, [completedTasks]);

const filteredCompletedTasks = useMemo(() => {
  if (selectedRoadmapFilter === "all") return completedTasks;

  return completedTasks.filter(
    (task) => String(task.roadmapName || "") === selectedRoadmapFilter
  );
}, [completedTasks, selectedRoadmapFilter]);

  return (
    <div className={directorPageRoot}>
      <main className={`${directorPageContainer} max-w-[1200px] py-10`}>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          ← Back
        </button>

        <div className={`${directorGlassCard} p-6`}>
          <h1 className="text-2xl font-bold text-white">Completed Roadmap Tasks</h1>
          <p className="mt-1 text-sm text-[#cde2f2]/70">
            Completed tasks from all assigned roadmaps for this pastor.
          </p>
        </div>
<div className="mt-6 flex justify-end">
  <select
    value={selectedRoadmapFilter}
    onChange={(e) => setSelectedRoadmapFilter(e.target.value)}
    className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white outline-none"
  >
    <option value="all" className="bg-[#061f35]">
      All Roadmaps
    </option>

    {roadmapFilterOptions.map((name) => (
      <option key={name} value={name} className="bg-[#061f35]">
        {name}
      </option>
    ))}
  </select>
</div>
        <div className="mt-6 space-y-4">
          {loading ? (
            <div className={`${directorGlassCard} flex justify-center p-10`}>
              <div className={directorSpinner} />
            </div>
          ) : filteredCompletedTasks.length === 0 ? (
            <div className={`${directorGlassCard} p-6 text-sm text-[#cde2f2]/70`}>
              No completed tasks found.
            </div>
          ) : (
            filteredCompletedTasks.map((task, index) => (
              <div
                key={`${task.roadmapId}-${task.nestedId}-${index}`}
                className={`${directorGlassCard} p-5`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                      {task.roadmapName}
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-white">
                      {task.taskName}
                    </h2>

                    <p className="mt-2 text-sm text-[#cde2f2]/70">
                      Status:{" "}
                      <span className="font-semibold text-emerald-300">
                        Completed
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      // router.push(
                      //   `/director/revitalization-roadmap/phase-list?roadmapId=${task.roadmapId}&pastorView=true&userId=${userId}&pastorId=${userId}`,
                      // )
                      router.push(
  `/director/revitalization-roadmap/task?roadmapId=${encodeURIComponent(
    task.roadmapId
  )}&taskId=${encodeURIComponent(
    task.nestedId
  )}&userId=${encodeURIComponent(
    String(userId || "")
  )}`
)
                    }
                    className="rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white hover:bg-[#8ec5eb]/25"
                  >
                    View Task Response
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default function CompletedTasksPage() {
  return (
    <Suspense fallback={null}>
      <CompletedTasksContent />
    </Suspense>
  );
}