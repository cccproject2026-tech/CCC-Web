"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "@/app/director/DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "@/app/director/directorUi";
import AssignRoadmapModal from "@/app/Components/AssignRoadmapModal";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Card1 from "@/app/Assets/card1.png";
import {
  apiAddNestedRoadmapItem,
  apiDeleteRoadmap,
  apiGetRoadmapById,
  apiGetRoadmaps,
  apiUpdateRoadmap,
} from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type RoadmapDoc = {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  type?: string;
  imageUrl?: string;
  phase?: string;
  totalSteps?: number;
  startDate?: string;
  endDate?: string;
  roadmaps?: { _id?: string; name?: string; description?: string; duration?: string }[];
};

function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data as RoadmapDoc;
    return data as RoadmapDoc;
  }
  if ("_id" in r || "name" in r) return r as RoadmapDoc;
  return null;
}

export default function DirectorRoadmapDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = typeof params.id === "string" ? decodeURIComponent(params.id).trim() : "";
  const assignUserId = searchParams.get("assignUser");
  const editParam = searchParams.get("edit");
  const isEditMode = editParam === "1" || editParam === "true";

  const [roadmap, setRoadmap] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editType, setEditType] = useState("");
  const [editPhase, setEditPhase] = useState("");
  const [editTotalSteps, setEditTotalSteps] = useState<string>("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDuration, setTaskDuration] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");

  const isPhaseRoadmap = useMemo(() => {
    const t = String(roadmap?.type ?? "").toLowerCase();
    return t === "phase" || t.includes("phase");
  }, [roadmap?.type]);

  const load = useCallback(async () => {
    if (!id) {
      setError("Missing roadmap id.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetRoadmapById(id);
      const doc = unwrapRoadmap(res.data);
      if (!doc?._id && !(doc as RoadmapDoc)?.name) {
        setRoadmap(null);
        setError("Roadmap not found.");
        return;
      }
      setRoadmap(doc);
    } catch (e) {
      const err = e as {
        response?: { status?: number; data?: { message?: string | string[] } };
        message?: string;
      };
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      const msgText = Array.isArray(msg) ? msg.join(", ") : msg;

      // If this was linked with a non-_id field, attempt a quick lookup and retry.
      if (status === 404) {
        try {
          const listRes = await apiGetRoadmaps("all", "");
          const raw = (listRes as any)?.data?.data ?? (listRes as any)?.data ?? [];
          const list: any[] = Array.isArray(raw) ? raw : [];
          const hit = list.find((r) => String(r?._id ?? "").trim() === id || String(r?.id ?? "").trim() === id);
          const nextId = hit?._id ? String(hit._id).trim() : "";
          if (nextId && nextId !== id) {
            const retry = await apiGetRoadmapById(nextId);
            const doc2 = unwrapRoadmap(retry.data);
            if (doc2) {
              setRoadmap(doc2);
              setError(null);
              return;
            }
          }
        } catch {
          // ignore fallback failure; surface original error
        }
      }

      console.error(e);
      setRoadmap(null);
      setError(
        msgText?.trim()
          ? msgText.trim()
          : status === 404
            ? "Roadmap not found (or you may not have access)."
            : err?.message || "Could not load this roadmap.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!roadmap || !isEditMode) return;
    setEditName(roadmap.name?.trim() ?? "");
    setEditDescription(
      (roadmap.description ?? roadmap.roadMapDetails ?? "").trim()
    );
    setEditDuration(roadmap.duration?.trim() ?? "");
    setEditType((roadmap.type ?? "").trim());
    setEditPhase((roadmap.phase ?? "").trim());
    setEditTotalSteps(roadmap.totalSteps != null ? String(roadmap.totalSteps) : "");
    setEditStartDate(typeof roadmap.startDate === "string" ? roadmap.startDate.slice(0, 10) : "");
    setEditEndDate(typeof roadmap.endDate === "string" ? roadmap.endDate.slice(0, 10) : "");
    setBannerFile(null);
    setBannerPreview(null);
    setSaveError("");
  }, [roadmap, isEditMode]);

  const title = roadmap?.name?.trim() || "Roadmap";
  const body =
    roadmap?.description?.trim() ||
    roadmap?.roadMapDetails?.trim() ||
    "No description.";
  const rawImg = roadmap?.imageUrl;
  const imageSrc = resolveApiMediaUrl(rawImg) || (typeof rawImg === "string" ? rawImg : null) || Card1;

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const exitEditMode = () => {
    router.replace(`/director/pastor-assignments/roadmap/${id}`);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveError("");
    if (!editName.trim()) {
      setSaveError("Name is required.");
      return;
    }
    if (!editDuration.trim()) {
      setSaveError("Duration is required.");
      return;
    }
    try {
      setSaving(true);
      const stepsNum = Number(editTotalSteps);
      await apiUpdateRoadmap(
        id,
        {
          name: editName.trim(),
          description: editDescription.trim(),
          duration: editDuration.trim(),
          ...(editType.trim() ? { type: editType.trim() } : roadmap?.type ? { type: roadmap.type } : {}),
          ...(editPhase.trim() ? { phase: editPhase.trim() } : {}),
          ...(Number.isFinite(stepsNum) && stepsNum > 0 ? { totalSteps: stepsNum } : {}),
          ...(editStartDate ? { startDate: editStartDate } : {}),
          ...(editEndDate ? { endDate: editEndDate } : {}),
        },
        bannerFile ?? undefined
      );
      exitEditMode();
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      setSaveError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Could not save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  const closeAddTaskModal = () => {
    setShowAddTaskModal(false);
    setTaskError("");
    setTaskName("");
    setTaskDuration("");
    setTaskDescription("");
  };

  const handleAddPhaseTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setTaskError("");
    if (!taskName.trim()) {
      setTaskError("Task name is required.");
      return;
    }
    if (!taskDuration.trim()) {
      setTaskError("Task duration is required.");
      return;
    }
    try {
      setTaskSaving(true);
      await apiAddNestedRoadmapItem(id, {
        name: taskName.trim(),
        duration: taskDuration.trim(),
        description: taskDescription.trim() || undefined,
        roadMapDetails: taskDescription.trim() || undefined,
      });
      closeAddTaskModal();
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      setTaskError(Array.isArray(msg) ? msg.join(", ") : msg || "Could not add task.");
    } finally {
      setTaskSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero title="Roadmap" subtitle="Loading…" image={MentorBg} />
        <section className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </section>
      </div>
    );
  }

  if (error || !roadmap) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero title="Roadmap" subtitle={error ?? "Not found"} image={MentorBg} />
        <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
          <p className="text-center text-white/80">{error ?? "Roadmap not found."}</p>
          <Link
            href="/director/pastor-assignments"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back to roadmaps
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={title}
        subtitle={
          isEditMode
            ? "Update name, description, duration, or banner — then save."
            : "Review this revitalization roadmap and assign it to pastors."
        }
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Roadmap", href: "/director/pastor-assignments" },
          { label: title },
        ]}
      />

      <section className="relative pb-12 pt-4">
        <div className="mx-auto flex max-w-[900px] flex-col gap-6 px-4 sm:px-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => router.push("/director/pastor-assignments")}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <i className="fa-solid fa-arrow-left text-xs" />
              Back
            </button>
            {!isEditMode ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    router.push(`/director/pastor-assignments/roadmap/${id}?edit=1`)
                  }
                  className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <i className="fa-solid fa-pen text-xs" />
                  Edit details
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!id) return;
                    const ok = window.confirm("Delete this roadmap? This cannot be undone.");
                    if (!ok) return;
                    try {
                      await apiDeleteRoadmap(id);
                      router.push("/director/pastor-assignments");
                    } catch (e) {
                      console.error(e);
                      setError("Could not delete this roadmap.");
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/25"
                >
                  <i className="fa-solid fa-trash text-xs" />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                >
                  <i className="fa-solid fa-user-plus text-xs" />
                  Assign to pastors
                </button>
                {isPhaseRoadmap ? (
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-diagram-project text-xs" />
                    Add phase task
                  </button>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                onClick={exitEditMode}
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <i className="fa-solid fa-xmark text-xs" />
                Cancel edit
              </button>
            )}
          </div>

          {isEditMode ? (
            <form
              onSubmit={handleSaveEdit}
              className={`overflow-hidden ${directorGlassCard}`}
            >
              <div className="relative aspect-[21/9] w-full bg-white/5 sm:aspect-[24/9]">
                <Image
                  src={bannerPreview || imageSrc}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={
                    !!bannerPreview ||
                    (typeof imageSrc === "string" && isRemoteImageSrc(imageSrc))
                  }
                />
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Banner image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerChange}
                    className="text-sm text-white/80 file:mr-3 file:rounded-lg file:border-0 file:bg-[#8ec5eb]/20 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-[#8ec5eb]/30"
                  />
                </div>
                {roadmap.type ? (
                  <span className="inline-block rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-[#8ec5eb]">
                    {roadmap.type}
                  </span>
                ) : null}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Type
                  </label>
                  <input
                    type="text"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className={directorInputClass}
                    placeholder="Phase / Single Roadmap"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={directorInputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="e.g. 12 Months"
                    className={directorInputClass}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={6}
                    className={`${directorInputClass} min-h-[120px] resize-y`}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Phase label (optional)
                  </label>
                  <input
                    type="text"
                    value={editPhase}
                    onChange={(e) => setEditPhase(e.target.value)}
                    className={directorInputClass}
                    placeholder="e.g. Jump Start"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">
                    Total steps (optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editTotalSteps}
                    onChange={(e) => setEditTotalSteps(e.target.value)}
                    className={directorInputClass}
                    placeholder="e.g. 10"
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/70">
                      Start date (optional)
                    </label>
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className={directorInputClass}
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-white/70">
                      End date (optional)
                    </label>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className={directorInputClass}
                      style={{ colorScheme: "dark" }}
                    />
                  </div>
                </div>
                {saveError ? (
                  <p className="text-sm text-red-300">{saveError}</p>
                ) : null}
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      <i className="fa-solid fa-check text-xs" />
                    )}
                    Save changes
                  </button>
                  <button
                    type="button"
                    onClick={exitEditMode}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className={`overflow-hidden ${directorGlassCard}`}>
              <div className="relative aspect-[21/9] w-full bg-white/5 sm:aspect-[24/9]">
                <Image
                  src={imageSrc}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={typeof imageSrc === "string" && isRemoteImageSrc(imageSrc)}
                />
              </div>
              <div className="space-y-3 p-5 sm:p-6">
                {roadmap.type ? (
                  <span className="inline-block rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-[#8ec5eb]">
                    {roadmap.type}
                  </span>
                ) : null}
                {roadmap.duration ? (
                  <p className="text-sm text-white/65">
                    <span className="font-medium text-white/85">Duration:</span>{" "}
                    {roadmap.duration}
                  </p>
                ) : null}
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
                  {body}
                </p>
              </div>
            </div>
          )}

          {Array.isArray(roadmap.roadmaps) && roadmap.roadmaps.length > 0 ? (
            <div className={`${directorGlassCard} p-5 sm:p-6`}>
              <h2 className="mb-4 text-lg font-semibold text-white">Phases / nested roadmaps</h2>
              <ul className="space-y-3">
                {roadmap.roadmaps.map((sub) => (
                  <li
                    key={String(sub._id ?? sub.name)}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3"
                  >
                    <p className="font-medium text-white">{sub.name ?? "Untitled"}</p>
                    {sub.duration ? (
                      <p className="mt-0.5 text-xs text-white/55">Duration: {sub.duration}</p>
                    ) : null}
                    {sub.description ? (
                      <p className="mt-1 text-sm text-white/65">{sub.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      {showAddTaskModal ? (
        <>
          <div
            className="fixed inset-0 z-[80] bg-black/50"
            onClick={closeAddTaskModal}
          />
          <div className="fixed left-1/2 top-1/2 z-[81] w-[92vw] max-w-[560px] -translate-x-1/2 -translate-y-1/2">
            <form onSubmit={handleAddPhaseTask} className={`${directorGlassCard} p-5 sm:p-6`}>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Add phase task</h3>
                  <p className="mt-1 text-xs text-white/60">
                    Adds a nested task to this phase roadmap via the API.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeAddTaskModal}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              </div>

              {taskError ? (
                <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
                  {taskError}
                </p>
              ) : null}

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Task name</label>
                  <input
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className={directorInputClass}
                    placeholder="Enter task name"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Duration</label>
                  <input
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(e.target.value)}
                    className={directorInputClass}
                    placeholder="e.g. 2 Weeks / 1 Month"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-white/70">Description (optional)</label>
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    rows={4}
                    className={`${directorInputClass} min-h-[110px] resize-y`}
                    placeholder="Brief task description"
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddTaskModal}
                  className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={taskSaving}
                  className="rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:opacity-60"
                >
                  {taskSaving ? "Adding…" : "Add task"}
                </button>
              </div>
            </form>
          </div>
        </>
      ) : null}

      <AssignRoadmapModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roadmapIds={id ? [id] : []}
        roadmapName={title}
        initialUserId={assignUserId || undefined}
        onSuccess={() => setShowAssignModal(false)}
      />
    </div>
  );
}
