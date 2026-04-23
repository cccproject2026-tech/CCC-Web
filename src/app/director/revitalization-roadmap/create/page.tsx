"use client";

import { useState, useCallback, useEffect, useRef, useId, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { apiCreateRoadmap, apiGetRoadmapById, apiUpdateRoadmap } from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot, directorSpinner } from "../../directorUi";
import HeroBg from "../../../Assets/roadmap-bg.png";

/** Mobile parity: CreateRoadmapSheet uses 'Phase' | 'Single'. */
const ROADMAP_TYPES = ["Phase", "Single"] as const;

type NestedRoadmapStub = {
  _id?: string;
  name?: string;
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  imageUrl?: string;
};

type RoadmapDoc = {
  _id?: string;
  name?: string;
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  type?: string;
  imageUrl?: string;
  divisions?: string[];
  roadmaps?: NestedRoadmapStub[];
};

function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (
      inner.data != null &&
      typeof inner.data === "object" &&
      !Array.isArray(inner.data)
    ) {
      return inner.data as RoadmapDoc;
    }
    return data as RoadmapDoc;
  }
  if ("_id" in r || "name" in r) return r as RoadmapDoc;
  return null;
}

function mapApiTypeToSelect(apiType: string | undefined): string {
  const t = String(apiType ?? "").toLowerCase();
  if (t === "phase" || t.includes("phase")) return "Phase";
  return "Single";
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

/**
 * Parent document may store marketing copy on the first nested template (single / phase).
 */
function deriveEditFormValues(
  doc: RoadmapDoc,
  url: {
    name?: string | null;
    subheading?: string | null;
    completionTime?: string | null;
    bannerImage?: string | null;
    type?: string | null;
  },
): {
  type: string;
  name: string;
  subheading: string;
  duration: string;
  divisions: string[];
  bannerUrl: string | null;
} {
  const nested0 = Array.isArray(doc.roadmaps) && doc.roadmaps.length > 0 ? doc.roadmaps[0] : null;

  const apiType = mapApiTypeToSelect(doc.type);
  const typeFromUrl = url.type?.trim().toLowerCase();
  const type =
    typeFromUrl === "phase"
      ? "Phase"
      : typeFromUrl === "single"
        ? "Single"
        : apiType;

  const name =
    (doc.name ?? "").trim() ||
    (nested0?.name && String(nested0.name).trim()) ||
    (url.name ? safeDecodeURIComponent(url.name) : "").trim();

  const subheading =
    [
      doc.description,
      doc.roadMapDetails,
      nested0?.roadMapDetails,
      nested0?.description,
    ]
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .find(Boolean) ||
    (url.subheading ? safeDecodeURIComponent(url.subheading) : "").trim();

  const duration =
    (doc.duration && String(doc.duration).trim()) ||
    (nested0?.duration && String(nested0.duration).trim()) ||
    (url.completionTime ? safeDecodeURIComponent(url.completionTime) : "").trim();

  const divisions =
    Array.isArray(doc.divisions) && doc.divisions.length ? [...doc.divisions] : [];

  const rawBanner =
    (typeof doc.imageUrl === "string" && doc.imageUrl.trim()) ||
    (typeof nested0?.imageUrl === "string" && nested0.imageUrl.trim()) ||
    (url.bannerImage ? safeDecodeURIComponent(url.bannerImage) : "").trim();

  const bannerUrl = rawBanner
    ? resolveApiMediaUrl(rawBanner) || rawBanner
    : null;

  return {
    type,
    name,
    subheading,
    duration,
    divisions,
    bannerUrl,
  };
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

  const [type, setType] = useState<string>("Single");
  const [name, setName] = useState("");
  const [roadmapSubheading, setRoadmapSubheading] = useState("");
  const [duration, setDuration] = useState("");
  // Mobile parity: divisions are only configured during create (phase type)
  const [divisions, setDivisions] = useState<string[]>([]);
  const [newDivision, setNewDivision] = useState("");
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

        const urlSeed = {
          name: searchParams.get("name"),
          subheading: searchParams.get("subheading"),
          completionTime: searchParams.get("completionTime"),
          bannerImage: searchParams.get("bannerImage"),
          type: searchParams.get("type"),
        };

        const v = deriveEditFormValues(doc as RoadmapDoc, urlSeed);
        setType(v.type);
        setName(v.name);
        setRoadmapSubheading(v.subheading);
        setDuration(v.duration);
        setDivisions(v.divisions.length ? v.divisions : []);
        if (v.bannerUrl) {
          setBannerPreview(v.bannerUrl);
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
    if (!roadmapSubheading.trim()) {
      setError("Roadmap subheading is required.");
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
        router.push("/director/revitalization-roadmap");
        return;
      }

      // Mobile parity: create parent roadmap first, then route into form flow.
      const payload = {
        type: type === "Phase" ? "phase" : "single",
        name: name.trim(),
        roadMapDetails: roadmapSubheading.trim(),
        duration: duration.trim(),
        divisions:
          type === "Phase"
            ? (divisions.length ? divisions : ["All"])
            : (divisions.length ? divisions : ["All"]),
        extras: [],
        roadmaps: [],
      };

      const res = await apiCreateRoadmap(payload as any, bannerFile ?? undefined);
      const id = extractCreatedRoadmapId(res.data);
      if (!id) {
        setError("Roadmap was created but no ID was returned. Open the roadmap library.");
        return;
      }

      if (type === "Phase") {
        // Mobile parity: after creating a Phase roadmap, land on the phase list first.
        router.push(`/director/revitalization-roadmap/phase-list?roadmapId=${encodeURIComponent(id)}`);
      } else {
        const qp = new URLSearchParams();
        qp.set("roadmapId", id);
        qp.set("type", "single");
        qp.set("isEditMode", "false");
        qp.set("name", name.trim());
        qp.set("subheading", roadmapSubheading.trim());
        qp.set("completionTime", duration.trim());
        if (bannerPreview) qp.set("bannerImage", bannerPreview);
        router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
      }
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
            : undefined
        }
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: isEditMode ? "Edit" : "Create" },
        ]}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 pb-12 sm:px-6 lg:px-10">
        <div className={`mx-auto w-full max-w-5xl ${directorGlassCard} relative overflow-hidden p-6 sm:p-8 lg:p-10`}>
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
                : ""}
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
                  disabled={isEditMode}
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
              <label className="mb-1 block text-sm font-medium text-white/90">
                {type === "Phase" ? "Name of Subtitle for Phase" : "Roadmap Subheading"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <textarea
                value={roadmapSubheading}
                onChange={(e) => setRoadmapSubheading(e.target.value)}
                placeholder={type === "Phase" ? "Enter Subtitle" : "Enter Subheading"}
                rows={3}
                className={`${directorInputClass} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">
                {type === "Phase" ? "Completion Time for the Phase" : "Completion Time for the Roadmap"}{" "}
                <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="1-2 Months"
                className={directorInputClass}
              />
            </div>

            {type === "Phase" && !isEditMode ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-white/90">Division of Phase</label>
                <div className="flex flex-wrap items-end gap-3">
                  <input
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    placeholder="None"
                    className={`${directorInputClass} flex-1 min-w-[220px]`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const d = newDivision.trim();
                      if (!d) return;
                      setDivisions((prev) => [...prev, d]);
                      setNewDivision("");
                    }}
                    className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-plus text-xs" /> Add
                  </button>
                </div>

                {divisions.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {divisions.map((d, idx) => (
                      <span
                        key={`${d}-${idx}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm text-white/90"
                      >
                        {d}
                        <button
                          type="button"
                          onClick={() => setDivisions((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-white/70 hover:text-white"
                          aria-label={`Remove ${d}`}
                        >
                          <i className="fa-solid fa-xmark text-xs" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

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
                  : "Create"}
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
