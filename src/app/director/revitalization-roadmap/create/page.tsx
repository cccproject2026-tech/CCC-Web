"use client";

import { useState, useCallback, useEffect, useRef, useId, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import axiosInstance from "@/app/Services/config/axios-instance";
import { apiGetRoadmapById, apiUpdateRoadmap } from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot, directorSpinner } from "../../directorUi";
import HeroBg from "../../../Assets/roadmap-bg.png";

/** Matches CreateRoadmapModal / backend expectations. */
const ROADMAP_TYPES = ["Phase", "Single Roadmap"] as const;

type RoadmapDoc = {
  _id?: string;
  name?: string;
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  type?: string;
  imageUrl?: string;
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

function mapApiTypeToSelect(apiType: string | undefined): string {
  const t = String(apiType ?? "").toLowerCase();
  if (t === "phase" || t.includes("phase")) return "Phase";
  return "Single Roadmap";
}

/** Axios response body: { data: roadmap } or { success, data } */
function extractCreatedRoadmapId(apiBody: unknown): string | null {
  const doc = unwrapRoadmap(apiBody);
  const id = doc?._id;
  if (id && typeof id === "string") return id;
  if (!apiBody || typeof apiBody !== "object") return null;
  const r = apiBody as Record<string, unknown>;
  const raw = r.data ?? r;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>;
    const inner = o.data;
    if (inner && typeof inner === "object") {
      const id2 = (inner as { _id?: string })._id ?? (inner as { id?: string }).id;
      if (typeof id2 === "string") return id2;
    }
    const id3 = o._id ?? o.id;
    if (typeof id3 === "string") return id3;
  }
  return null;
}

function CreateRoadmapStepOnePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapIdParam = searchParams.get("roadmapId") ?? searchParams.get("id");
  const isEditMode = Boolean(roadmapIdParam);

  const [type, setType] = useState<string>("Single Roadmap");
  const [name, setName] = useState("");
  const [roadmapSubheading, setRoadmapSubheading] = useState("");
  const [duration, setDuration] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerDragOver, setBannerDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const bannerBlobUrlRef = useRef<string | null>(null);
  const bannerInputId = useId();

  useEffect(() => {
    if (!roadmapIdParam) return;
    let cancelled = false;
    (async () => {
      setFetchLoading(true);
      setFetchError("");
      try {
        const res = await apiGetRoadmapById(roadmapIdParam);
        const doc = unwrapRoadmap(res.data);
        if (cancelled || !doc) {
          if (!cancelled && !doc) setFetchError("Roadmap not found.");
          return;
        }
        setType(mapApiTypeToSelect(doc.type));
        setName(doc.name?.trim() ?? "");
        setRoadmapSubheading((doc.description ?? doc.roadMapDetails ?? "").trim());
        setDuration(doc.duration?.trim() ?? "");
        const raw = doc.imageUrl;
        if (raw && typeof raw === "string") {
          const resolved = resolveApiMediaUrl(raw) || raw;
          setBannerPreview(resolved);
          setBannerFile(null);
        } else {
          setBannerPreview(null);
        }
      } catch {
        if (!cancelled) setFetchError("Could not load roadmap from the server.");
      } finally {
        if (!cancelled) setFetchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapIdParam]);

  const applyBannerFile = useCallback((file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    setBannerFile(file);
    const next = URL.createObjectURL(file);
    if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
    bannerBlobUrlRef.current = next;
    setBannerPreview(next);
  }, []);

  useEffect(() => {
    return () => {
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = null;
      }
    };
  }, []);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyBannerFile(e.target.files?.[0]);
    e.target.value = "";
  };

  const handleBannerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes("Files")) return;
    setBannerDragOver(true);
    e.dataTransfer.dropEffect = "copy";
  };

  const handleBannerDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
    setBannerDragOver(false);
  };

  const handleBannerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBannerDragOver(false);
    const file = e.dataTransfer.files?.[0];
    applyBannerFile(file);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) {
      setError("Roadmap name is required.");
      return;
    }
    if (!duration.trim()) {
      setError("Completion time is required (e.g. 12 Months or 6).");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && roadmapIdParam) {
        await apiUpdateRoadmap(
          roadmapIdParam,
          {
            name: name.trim(),
            description: roadmapSubheading.trim(),
            duration: duration.trim(),
            type,
          },
          bannerFile ?? undefined
        );
        router.push(`/director/pastor-assignments/roadmap/${roadmapIdParam}`);
        return;
      }

      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name.trim());
      formData.append("duration", duration.trim());
      if (roadmapSubheading.trim()) {
        formData.append("description", roadmapSubheading.trim());
      }
      ["church", "pastor"].forEach((d, i) => formData.append(`divisions[${i}]`, d));
      if (bannerFile) formData.append("image", bannerFile);

      const res = await axiosInstance.post("/roadmaps", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const id = extractCreatedRoadmapId(res.data);
      if (!id) {
        setError("Roadmap was created but no ID was returned. Open the roadmap library.");
        return;
      }

      router.push(`/director/pastor-assignments/roadmap/${id}`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to save roadmap. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = `${directorInputClass} cursor-pointer appearance-none pr-10 [&>option]:bg-[#041f35] [&>option]:text-white`;

  if (fetchLoading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title={isEditMode ? "Edit roadmap" : "Create roadmap"}
          subtitle="Loading…"
          image={HeroBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: isEditMode ? "Edit" : "Create" },
          ]}
        />
        <main className="flex flex-1 items-center justify-center px-4 pb-24">
          <div className={directorSpinner} />
        </main>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={isEditMode ? "Edit roadmap" : "Create roadmap"}
        subtitle={
          isEditMode
            ? "Update details from the server; save when done."
            : "Step 1 — Roadmap details; then open the library or detail view."
        }
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: isEditMode ? "Edit" : "Create" },
        ]}
      />

      <main className="mx-auto flex-1 px-4 pb-12">
        <div className={`mx-auto max-w-xl ${directorGlassCard} relative overflow-hidden p-6 sm:p-8`}>
          <button
            type="button"
            onClick={() => router.push("/director/revitalization-roadmap")}
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>

          <div className="border-b border-white/10 pb-4 pr-10">
            <h2 className="text-lg font-bold text-white sm:text-xl">
              {isEditMode ? "Edit roadmap" : "Create new roadmap"}
            </h2>
            <p className="mt-1 text-xs text-[#8ec5eb]/80">
              {isEditMode
                ? "Values below are loaded from the API. Change the banner by uploading a new image."
                : "Creates the roadmap via POST /roadmaps; then you can manage it from the library."}
            </p>
          </div>

          {fetchError ? (
            <p className="mt-4 rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-2 text-sm text-amber-100">
              {fetchError}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className={`mt-6 space-y-5 ${fetchError ? "pointer-events-none opacity-50" : ""}`}>
            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">Type</label>
              <div className="relative">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className={selectCls}
                  aria-label="Roadmap type"
                >
                  {ROADMAP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8ec5eb]/70" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">
                Roadmap name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter roadmap name"
                className={directorInputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">Roadmap subheading</label>
              <p className="mb-2 text-xs text-white/50">Short task-style line shown with the roadmap (optional).</p>
              <textarea
                value={roadmapSubheading}
                onChange={(e) => setRoadmapSubheading(e.target.value)}
                placeholder="Task description preview"
                rows={3}
                className={`${directorInputClass} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">
                Completion time for the roadmap <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g. 12 Months"
                className={directorInputClass}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-white/90" id={`${bannerInputId}-label`}>
                Banner
              </span>
              <label
                htmlFor={bannerInputId}
                onDragOver={handleBannerDragOver}
                onDragLeave={handleBannerDragLeave}
                onDrop={handleBannerDrop}
                className={`relative mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 transition ${
                  bannerDragOver
                    ? "border-[#8ec5eb] bg-[#8ec5eb]/20 ring-2 ring-[#8ec5eb]/40"
                    : "border-[#8ec5eb]/35 bg-[#8ec5eb]/5 hover:border-[#8ec5eb]/55 hover:bg-[#8ec5eb]/10"
                }`}
              >
                <input
                  id={bannerInputId}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleBannerChange}
                  aria-labelledby={`${bannerInputId}-label`}
                />
                {bannerPreview ? (
                  <div className="relative h-36 w-full overflow-hidden rounded-lg">
                    <Image
                      src={bannerPreview}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={
                        bannerPreview.startsWith("blob:") || isRemoteImageSrc(bannerPreview)
                      }
                    />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-2 py-1 text-xs text-white/90">
                      Click or drop to replace
                    </span>
                  </div>
                ) : (
                  <>
                    <i
                      className={`fa-solid mb-2 text-2xl text-[#8ec5eb] ${bannerDragOver ? "fa-file-image" : "fa-cloud-arrow-up"}`}
                    />
                    <span className="text-center text-sm text-white/80">
                      {bannerDragOver ? "Drop image here" : "Drag & drop or click to upload"}
                    </span>
                    <span className="mt-1 text-xs text-white/45">PNG, JPG — optional</span>
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => router.push("/director/revitalization-roadmap")}
              className="rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || Boolean(fetchError)}
              className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(142,197,235,0.15)] transition hover:bg-[#8ec5eb]/30 disabled:opacity-60"
            >
              {submitting
                ? isEditMode
                  ? "Saving…"
                  : "Creating…"
                : isEditMode
                  ? "Save changes"
                  : "Create & continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CreateRoadmapPage() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <main className="flex flex-1 items-center justify-center px-4 py-24">
            <div className={directorSpinner} />
          </main>
        </div>
      }
    >
      <CreateRoadmapStepOnePage />
    </Suspense>
  );
}
