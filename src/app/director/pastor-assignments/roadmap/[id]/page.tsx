"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "@/app/director/DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "@/app/director/directorUi";
import AssignRoadmapModal from "@/app/Components/AssignRoadmapModal";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Card1 from "@/app/Assets/card1.png";
import { apiGetRoadmapById, apiUpdateRoadmap } from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type RoadmapDoc = {
  _id?: string;
  name?: string;
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  type?: string;
  imageUrl?: string;
  roadmaps?: { _id?: string; name?: string; description?: string }[];
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
  const id = typeof params.id === "string" ? params.id : "";
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
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

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
      console.error(e);
      setRoadmap(null);
      setError("Could not load this roadmap.");
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
      await apiUpdateRoadmap(
        id,
        {
          name: editName.trim(),
          description: editDescription.trim(),
          duration: editDuration.trim(),
          ...(roadmap?.type ? { type: roadmap.type } : {}),
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
                  onClick={() => setShowAssignModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                >
                  <i className="fa-solid fa-user-plus text-xs" />
                  Assign to pastors
                </button>
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
