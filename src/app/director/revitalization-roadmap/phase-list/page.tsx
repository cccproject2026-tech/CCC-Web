"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  findNestedProgressForTask,
  normalizeRoadmapId,
  resolveNestedTemplateItemId,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorFilterSectionClass,
  directorFilterSectionRow,
  directorGlassCard,
  directorGlassCardHover,
  directorPageContainer,
  directorPageRoot,
  directorSearchBarWidth,
  directorSearchIconClass,
  directorSearchInputClass,
  directorSpinner,
} from "../../directorUi";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import { apiGetRoadmapById, apiUpdateRoadmap } from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type NestedItem = {
  _id?: string;
  name?: string;
  title?: string;
  roadMapDetails?: string;
  description?: string;
  duration?: string;
  imageUrl?: string;
  phase?: string;
};

type RoadmapDoc = {
  _id?: string;
  name?: string;
  imageUrl?: string;
  divisions?: string[];
  roadmaps?: NestedItem[];
  /** Library card metadata (hero subtitle). */
  type?: string;
  duration?: string;
};

function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = (r as any).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data as RoadmapDoc;
    return data as RoadmapDoc;
  }
  return r as RoadmapDoc;
}

function nestedRoadmapRows(rm: RoadmapDoc | null): NestedItem[] {
  if (!rm?.roadmaps) return [];
  const raw = rm.roadmaps as unknown;
  if (Array.isArray(raw)) return raw as NestedItem[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: NestedItem[] }).items)) {
    return (raw as { items: NestedItem[] }).items;
  }
  return [];
}

function formatAxiosError(e: unknown): string {
  const err = e as { response?: { data?: unknown }; message?: string };
  const data = err?.response?.data;
  if (data && typeof data === "object" && data !== null) {
    const m = (data as Record<string, unknown>).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) return m.map(String).join(" ");
    if (typeof (data as Record<string, unknown>).error === "string")
      return String((data as Record<string, unknown>).error);
  }
  if (typeof data === "string") return data;
  return err?.message || "Request failed.";
}

const cardActionPrimary = `${directorBtnPrimary} !px-4 !py-2.5 !text-sm`;
const cardActionSecondary = `${directorBtnSecondary} !px-4 !py-2.5 !text-sm`;
const cardActionDanger = `${directorBtnSecondary} !border-red-400/35 !px-4 !py-2.5 !text-sm !text-red-100 hover:!bg-red-500/15`;

export default function DirectorPhaseListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("roadmapId")?.trim() || "";
  const pastorView = searchParams.get("pastorView") === "true";
  const pastorId =
  searchParams.get("userId") ||
  searchParams.get("pastorId") ||
  "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapDoc | null>(null);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!roadmapId) {
      setError("Missing roadmapId.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetRoadmapById(roadmapId);
        const doc = unwrapRoadmap(res.data);
        if (!cancelled) setRoadmap(doc);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load phase roadmap.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);
useEffect(() => {
  if (!pastorView || !pastorId || !roadmapId || !roadmap) {
    setCompletedTaskIds(new Set());
    return;
  }

  let cancelled = false;

  const loadProgress = async () => {
    try {
      const res = await apiGetUserProgress(pastorId);
      const progress = unwrapProgressData(res);

      const parentRid = normalizeRoadmapId(
        roadmap._id ?? roadmapId,
      );

      const ids = new Set<string>();

      nestedRoadmapRows(roadmap).forEach((task) => {
        const taskId = resolveNestedTemplateItemId(task as any);
        if (!taskId || !parentRid) return;

        const np = findNestedProgressForTask(progress, parentRid, taskId);
        if (!np) return;

        const completed = Number(np.completedSteps ?? 0);
        const total = Number(np.totalSteps ?? 0);
        const status = String(np.status ?? "").toLowerCase();

        if (
          status.includes("complete") ||
          (total > 0 && completed >= total)
        ) {
          ids.add(String(task._id ?? taskId));
        }
      });

      if (!cancelled) setCompletedTaskIds(ids);
    } catch (err) {
      console.error("Failed to load pastor task progress", err);
      if (!cancelled) setCompletedTaskIds(new Set());
    }
  };

  void loadProgress();

  return () => {
    cancelled = true;
  };
}, [pastorView, pastorId, roadmapId, roadmap]);
  const items = useMemo(() => {
    const list = nestedRoadmapRows(roadmap).map((x) => ({
      id: String(x._id || ""),
      title: String(x.name || x.title || "Untitled phase"),
      desc: String(x.roadMapDetails || x.description || ""),
      duration: String(x.duration || ""),
      phase: String(x.phase || ""),
      imageUrl: typeof x.imageUrl === "string" ? x.imageUrl : "",
    }));
    const query = q.trim().toLowerCase();
    if (!query) return list;
    return list.filter((it) => it.title.toLowerCase().includes(query) || it.desc.toLowerCase().includes(query));
  }, [roadmap, q]);

  const goToCreatePhaseTask = () => {
    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("type", "phase");
    qp.set("isEditMode", "false");
    qp.set("name", String(roadmap?.name || ""));
    qp.set("completionTime", String(roadmap?.duration || ""));
    qp.set("selectedDivision", "All");
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  };

  const handleConfirmDeleteTask = async () => {
    if (!confirmDelete?.id || !roadmapId || !roadmap) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      /** Backend aligns with roadmap-form: nested phases are removed by PATCH parent `roadmaps` (no DELETE /nested). */
      const before = nestedRoadmapRows(roadmap);
      const remaining = before.filter((r) => String(r?._id ?? "") !== String(confirmDelete.id));
      if (remaining.length === before.length) {
        setDeleteError("Could not find this task. Try refreshing the page.");
        return;
      }
      await apiUpdateRoadmap(roadmapId, {
        name: String(roadmap.name || "").trim() || "Roadmap",
        roadmaps: remaining,
        ...(Array.isArray(roadmap.divisions) ? { divisions: roadmap.divisions } : {}),
      } as any);
      setConfirmDelete(null);
      const res = await apiGetRoadmapById(roadmapId);
      const doc = unwrapRoadmap(res.data);
      setRoadmap(doc);
    } catch (e) {
      console.error(e);
      setDeleteError(formatAxiosError(e) || "Could not delete this task.");
    } finally {
      setDeleting(false);
    }
  };

  // const openPhaseTaskPage = (nestedRoadmapId: string, opts?: { viewOnly?: boolean }) => {
  //   const phase = nestedRoadmapRows(roadmap).find((r) => String(r._id) === nestedRoadmapId);
  //   if (!phase) return;
  //   const sub = String(phase.roadMapDetails || phase.description || "");
  //   const longDesc = String(phase.description || phase.roadMapDetails || "");
  //   const qp = new URLSearchParams();
  //   qp.set("roadmapId", roadmapId);
  //   qp.set("nestedRoadmapId", nestedRoadmapId);
  //   qp.set("type", "phase");
  //   qp.set("isEditMode", "true");
  //   if (opts?.viewOnly) qp.set("viewOnly", "true");
  //   qp.set("name", String(phase.name || phase.title || ""));
  //   qp.set("subheading", sub);
  //   qp.set("longDescription", longDesc);
  //   qp.set("completionTime", String(phase.duration || ""));
  //   qp.set("selectedDivision", String(phase.phase || "All"));
  //   qp.set("bannerImage", String(phase.imageUrl || ""));
  //   router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  // };
  const openPhaseTaskPage = (
  nestedRoadmapId: string,
  opts?: { viewOnly?: boolean }
) => {
  const phase = nestedRoadmapRows(roadmap).find(
    (r) => String(r._id) === nestedRoadmapId
  );

  if (!phase) return;

  // pastor view → open existing task page
  if (pastorView && pastorId) {
    const qp = new URLSearchParams();

    qp.set("roadmapId", roadmapId);
    qp.set("taskId", nestedRoadmapId);
    qp.set("userId", pastorId);

    router.push(
      `/director/revitalization-roadmap/task?${qp.toString()}`
    );

    return;
  }

  // normal director edit flow
  const sub = String(phase.roadMapDetails || phase.description || "");
  const longDesc = String(phase.description || phase.roadMapDetails || "");

  const qp = new URLSearchParams();

  qp.set("roadmapId", roadmapId);
  qp.set("nestedRoadmapId", nestedRoadmapId);
  qp.set("type", "phase");
  qp.set("isEditMode", "true");

  if (opts?.viewOnly) qp.set("viewOnly", "true");

  qp.set("name", String(phase.name || phase.title || ""));
  qp.set("subheading", sub);
  qp.set("longDescription", longDesc);
  qp.set("completionTime", String(phase.duration || ""));
  qp.set("selectedDivision", String(phase.phase || "All"));
  qp.set("bannerImage", String(phase.imageUrl || ""));

  router.push(
    `/director/revitalization-roadmap/roadmap-form?${qp.toString()}`
  );
};

  const heroTitle = roadmap?.name || "Phase roadmap";

  const heroSubtitle = useMemo(() => {
    if (!roadmap) return undefined;
    const t = String(roadmap.type ?? "").toLowerCase();
    const isPhase = t === "phase" || t.includes("phase");
    const kind = isPhase ? "Phase roadmap" : "Single roadmap";
    const n = nestedRoadmapRows(roadmap).length;
    const duration =
      (typeof roadmap.duration === "string" && roadmap.duration.trim()) ||
      (n > 0 ? items[0]?.duration?.trim() : "") ||
      "";
    if (isPhase && n > 0) {
      return `${n} phase${n === 1 ? "" : "es"} · ${kind}`;
    }
    if (duration) return `${duration} · ${kind}`;
    return kind;
  }, [roadmap, items]);

  const breadcrumbItems = [
    { label: "Home", href: "/director/home" },
    { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
    { label: "Phase list" },
  ];

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Phase list"
          subtitle="Loading…"
          image={JumpStartBg}
          titleAlign="start"
          breadcrumbAlign="start"
          breadcrumbItems={breadcrumbItems}
        />
        <div className="flex flex-1 items-center justify-center px-4 pb-16">
          <div className={directorSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={heroTitle}
        subtitle="Revitalization Roadmap — phases and tasks"
        image={JumpStartBg}
        titleAlign="start"
        breadcrumbAlign="start"
        breadcrumbItems={breadcrumbItems}
      />

      <div className={`${directorPageContainer} max-w-4xl pb-10`}>
        {/* Toolbar: same glass + button language as roadmap-creation / mentees */}
        <div className={directorFilterSectionClass}>
          <div className={directorFilterSectionRow}>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => router.back()} className={`${directorBtnSecondary} !px-4 !py-2.5 !text-sm`}>
                <i className="fa-solid fa-arrow-left text-xs" /> Back
              </button>
              {/* <button type="button" onClick={goToCreatePhaseTask} className={`${directorBtnPrimary} !px-4 !py-2.5 !text-sm`}>
                <i className="fa-solid fa-plus text-xs" /> Task
              </button> */}
              {!pastorView ? (
  <button
    type="button"
    onClick={goToCreatePhaseTask}
    className={`${directorBtnPrimary} !px-4 !py-2.5 !text-sm`}
  >
    <i className="fa-solid fa-plus text-xs" /> Task
  </button>
) : null}
            </div>
            <div className={`relative ${directorSearchBarWidth}`}>
              <i className={directorSearchIconClass} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search phases…"
                className={directorSearchInputClass}
                aria-label="Search phases"
              />
            </div>
          </div>
        </div>

        {error ? (
          <div className={`${directorGlassCard} p-6 text-center text-white/85`}>{error}</div>
        ) : items.length === 0 ? (
          <div className={`${directorGlassCard} p-10 text-center text-white/75`}>
            No phases yet. Click <span className="font-semibold text-white">Task</span> to add one.
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => {
              const isCompleted = completedTaskIds.has(String(it.id));
              const imgSrc = resolveApiMediaUrl(it.imageUrl) || JumpStartBg.src;
              const imgUnopt = isRemoteImageSrc(imgSrc) || imgSrc.startsWith("blob:");
              return (
                <div
                  key={it.id}
                  className={`flex overflow-hidden rounded-2xl ${directorGlassCard} ${directorGlassCardHover} p-0`}
                >
                  <div className="relative w-[38%] min-w-[140px] shrink-0 sm:w-[42%]">
                    <div className="relative h-full min-h-[200px] sm:min-h-[220px]">
                      <Image
                        src={imgSrc}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={imgUnopt}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-transparent sm:from-black/20" />
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col px-4 py-4 sm:px-6 sm:py-5">
                    <h3 className="text-[17px] font-semibold leading-tight text-white sm:text-[18px]">
                      {it.title}
                    </h3>
                    {it.desc ? (
                      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-white/70 sm:text-[14px]">
                        {it.desc}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[13px] font-semibold text-white/80">Status</span>
                      <div className="h-3.5 w-px bg-white/25" />
                      <span
  className={`inline-block rounded-lg border px-3 py-1 text-[12px] font-semibold ${
    isCompleted
      ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
      : "border-[#8ec5eb]/35 bg-[#8ec5eb]/15 text-[#8ec5eb]"
  }`}
>
  {isCompleted ? "Completed" : "Not Started"}
</span>
                    </div>
                    <div className="mt-3 text-[13px] text-white/85 sm:text-[14px]">
                      <p>
                        <span className="font-semibold text-white/90">Completion time</span>{" "}
                        <span className="text-white/80">{it.duration || "—"}</span>
                      </p>
                      {it.phase ? (
                        <p className="mt-1.5 text-white/65">
                          <span className="font-semibold text-white/80">Division:</span> {it.phase}
                        </p>
                      ) : null}
                    </div>
                    <div className="mt-auto flex flex-wrap gap-3 pt-4">
                      {/* <button
                        type="button"
                        onClick={() => openPhaseTaskPage(it.id, { viewOnly: true })}
                        className={cardActionSecondary}
                      >
                        <i className="fa-regular fa-eye text-sm" aria-hidden />
                        View
                      </button> */}
                      {/* <button
                        type="button"
                        onClick={() => openPhaseTaskPage(it.id)}
                        className={cardActionPrimary}
                      >
                        <i className="fa-solid fa-list-check text-sm" />
                        Edit tasks
                      </button> */}
                      {/* {!pastorView ? (
  <button
    type="button"
    onClick={() => openPhaseTaskPage(it.id)}
    className={cardActionPrimary}
  >
    <i className="fa-solid fa-list-check" /> View/Edit tasks
  </button>
) : null} */}
{!pastorView ? (
  <button
    type="button"
    onClick={() => openPhaseTaskPage(it.id)}
    className={cardActionPrimary}
  >
    <i className="fa-solid fa-list-check" /> View/Edit tasks
  </button>
) : (
  <button
    type="button"
    onClick={() => {
      const qp = new URLSearchParams();

      qp.set("roadmapId", roadmapId);
      qp.set("taskId", it.id);

      if (pastorId) {
        qp.set("userId", pastorId);
      }

      router.push(
        `/director/revitalization-roadmap/task?${qp.toString()}`
      );
    }}
    className={cardActionSecondary}
  >
    <i className="fa-regular fa-eye text-sm" />
    View Response
  </button>
)}
                      <button
                        type="button"
                        disabled={!it.id}
                        onClick={() => {
                          setDeleteError(null);
                          setConfirmDelete({ id: it.id, title: it.title });
                        }}
                        className={cardActionDanger}
                      >
                        <i className="fa-solid fa-trash text-sm" aria-hidden />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          onClick={() => !deleting && setConfirmDelete(null)}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-phase-task-title"
            className="relative z-[1] w-full max-w-md rounded-2xl border border-white/15 bg-[#041f35]/98 px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="delete-phase-task-title" className="text-lg font-semibold text-white">
              Delete this task?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80">
              <span className="font-semibold text-white/95">{confirmDelete.title}</span> will be removed from this phase
              roadmap. This cannot be undone.
            </p>
            {deleteError ? (
              <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDelete(null)}
                className={`${directorBtnSecondary} !px-5 !py-2.5 !text-sm`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleConfirmDeleteTask()}
                className={`${directorBtnSecondary} !border-red-400/40 !px-5 !py-2.5 !text-sm !text-red-100 hover:!bg-red-500/20 disabled:opacity-60`}
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
