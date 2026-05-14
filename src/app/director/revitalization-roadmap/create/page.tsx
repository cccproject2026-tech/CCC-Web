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
  if (res == null) return null;
  if (typeof res === "string") {
    try {
      return unwrapRoadmap(JSON.parse(res));
    } catch {
      return null;
    }
  }
  if (typeof res !== "object" || Array.isArray(res)) return null;
  const r = res as Record<string, unknown>;

  const isDoc = (o: unknown): o is RoadmapDoc =>
    Boolean(
      o &&
        typeof o === "object" &&
        !Array.isArray(o) &&
        ("_id" in (o as object) ||
          "name" in (o as object) ||
          "title" in (o as object) ||
          "roadmaps" in (o as object) ||
          "type" in (o as object) ||
          "roadMapDetails" in (o as object) ||
          "duration" in (o as object)),
    );

  const fromInner = (o: unknown): RoadmapDoc | null => {
    if (!o || typeof o !== "object" || Array.isArray(o)) return null;
    const x = o as Record<string, unknown>;
    if (typeof x.roadmap === "object" && x.roadmap && !Array.isArray(x.roadmap)) {
      return fromInner(x.roadmap) ?? (isDoc(x.roadmap) ? (x.roadmap as RoadmapDoc) : null);
    }
    if (typeof x.roadMap === "object" && x.roadMap && !Array.isArray(x.roadMap)) {
      return fromInner(x.roadMap) ?? (isDoc(x.roadMap) ? (x.roadMap as RoadmapDoc) : null);
    }
    if (x.result && typeof x.result === "object" && !Array.isArray(x.result)) {
      return fromInner(x.result);
    }
    if (isDoc(o)) return o as RoadmapDoc;
    if (x.data && typeof x.data === "object" && !Array.isArray(x.data)) {
      return fromInner(x.data);
    }
    return null;
  };

  if (r.data != null) {
    const data = r.data;
    if (typeof data === "object" && !Array.isArray(data)) {
      const inner = data as Record<string, unknown>;
      if (inner.data != null && typeof inner.data === "object" && !Array.isArray(inner.data)) {
        const d = fromInner(inner.data);
        if (d) return d;
      }
      const d2 = fromInner(data);
      if (d2) return d2;
    }
  }
  if (r.result && typeof r.result === "object") {
    const d3 = fromInner(r.result);
    if (d3) return d3;
  }
  return fromInner(r);
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
  const root = doc as Record<string, unknown>;
  const nest = nested0 as Record<string, unknown> | null;

  const firstNonEmpty = (...parts: (string | undefined)[]) =>
    parts.map((p) => (p ?? "").trim()).find(Boolean) ?? "";

  const apiType = mapApiTypeToSelect(doc.type);
  const typeFromUrl = url.type?.trim().toLowerCase();
  const type =
    typeFromUrl === "phase"
      ? "Phase"
      : typeFromUrl === "single"
        ? "Single"
        : apiType;

  const name = firstNonEmpty(
    (doc.name ?? "").trim() || undefined,
    typeof root.title === "string" ? root.title : undefined,
    typeof root.roadMapName === "string" ? root.roadMapName : undefined,
    typeof root.label === "string" ? root.label : undefined,
    nested0?.name ? String(nested0.name).trim() : undefined,
    nest && typeof nest.title === "string" ? nest.title : undefined,
    url.name ? safeDecodeURIComponent(url.name) : undefined,
  );

  const subheading = firstNonEmpty(
    ...[doc.description, doc.roadMapDetails, root.subheading, root.roadMapDetails, root.details].map(
      (x) => (typeof x === "string" ? x.trim() : undefined),
    ),
    nested0?.roadMapDetails ? String(nested0.roadMapDetails).trim() : undefined,
    nested0?.description ? String(nested0.description).trim() : undefined,
    nest && typeof nest.roadMapDetails === "string" ? nest.roadMapDetails : undefined,
    url.subheading ? safeDecodeURIComponent(url.subheading) : undefined,
  );

  const duration = firstNonEmpty(
    doc.duration ? String(doc.duration).trim() : undefined,
    nested0?.duration ? String(nested0.duration).trim() : undefined,
    nest && typeof nest.duration === "string" ? nest.duration : undefined,
    url.completionTime ? safeDecodeURIComponent(url.completionTime) : undefined,
  );

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
/** Windows / some pickers leave `type` empty; still allow common image extensions. */
function isLikelyImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tif|tiff)$/i.test(file.name);
}

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
  const [bannerFileError, setBannerFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const bannerBlobUrlRef = useRef<string | null>(null);
  const bannerFileInputRef = useRef<HTMLInputElement | null>(null);
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
    if (!file) return;
    if (!isLikelyImageFile(file)) {
      setBannerFileError("Please choose a PNG, JPG, or other image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
  setBannerFileError("Image size must be less than 5MB.");
  return;
}
    setBannerFileError("");
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
    if (type === "Phase" && divisions.length === 0) {
      setError("Please add at least one division (e.g. church or pastor).");
      return;
    }

    try {
      setSubmitting(true);

      if (isEditMode && roadmapIdParam) {
        const sub = roadmapSubheading.trim();
        const normalizedDivisions = divisions
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean);
        await apiUpdateRoadmap(
          roadmapIdParam,
          {
            name: name.trim(),
            description: sub,
            roadMapDetails: sub,
            duration: duration.trim(),
            type: type === "Phase" ? "phase" : "single",
            ...(normalizedDivisions.length ? { divisions: normalizedDivisions } : {}),
          },
          bannerFile ?? undefined
        );
        router.refresh();
        router.push("/director/revitalization-roadmap");
        return;
      }

      // Mobile / CreateRoadmapModal parity: type + multipart fields the API validates (not JSON-stringified arrays).
      const sub = roadmapSubheading.trim();
      const normalizedDivisions = divisions
        .map((d) => d.trim().toLowerCase())
        .filter(Boolean);
      const payload = {
        type: type === "Phase" ? "phase" : "single",
        name: name.trim(),
        roadMapDetails: sub,
        description: sub,
        duration: duration.trim(),
        divisions: normalizedDivisions.length ? normalizedDivisions : ["church"],
      };

      const res = await apiCreateRoadmap(payload, bannerFile ?? undefined);
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
        if (
          bannerPreview &&
          !bannerPreview.startsWith("blob:") &&
          !bannerPreview.startsWith("data:")
        ) {
          qp.set("bannerImage", bannerPreview);
        }
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
                <label className="mb-2 block text-sm font-medium text-white/90">
  Division of Phase <span className="text-white/45">(add required divisions)</span>
</label>
                <div className="flex flex-wrap items-end gap-3">
                  <input
                    value={newDivision}
                    onChange={(e) => setNewDivision(e.target.value)}
                    placeholder="Church,Pastor..."
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
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="block text-sm font-medium text-white/90" id={`${bannerInputId}-label`}>
                  Banner
                </span>
                {bannerPreview ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (bannerBlobUrlRef.current) {
                        URL.revokeObjectURL(bannerBlobUrlRef.current);
                        bannerBlobUrlRef.current = null;
                      }
                      setBannerFileError("");
                      setBannerFile(null);
                      setBannerPreview(null);
                    }}
                    className="text-sm font-semibold text-red-300/90 hover:underline"
                  >
                    Remove image
                  </button>
                ) : null}
              </div>
              <div
                onDragOver={handleBannerDragOver}
                onDragLeave={handleBannerDragLeave}
                onDrop={handleBannerDrop}
                className={`relative mt-1 rounded-xl border-2 border-dashed px-4 py-6 transition ${
                  bannerDragOver
                    ? "border-[#8ec5eb] bg-[#8ec5eb]/20 ring-2 ring-[#8ec5eb]/40"
                    : "border-[#8ec5eb]/35 bg-[#8ec5eb]/5 hover:border-[#8ec5eb]/55 hover:bg-[#8ec5eb]/10"
                }`}
              >
                <input
                  ref={bannerFileInputRef}
                  id={bannerInputId}
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="sr-only"
                  onChange={handleBannerChange}
                  aria-labelledby={`${bannerInputId}-label`}
                />
                <div className="mb-3 flex flex-wrap justify-center gap-2">
                  <label
                    htmlFor={bannerInputId}
                    className="cursor-pointer rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                  >
                    {bannerPreview ? "Replace image" : "Upload image"}
                  </label>
                </div>
                {bannerFileError ? (
                  <p className="mb-2 text-center text-sm text-amber-200/95" role="status">
                    {bannerFileError}
                  </p>
                ) : null}
                {bannerPreview ? (
                  <label
                    htmlFor={bannerInputId}
                    className="relative mx-auto flex h-36 w-full max-w-md cursor-pointer overflow-hidden rounded-lg"
                    aria-label="Change banner image"
                  >
                    {bannerPreview.startsWith("blob:") || bannerPreview.startsWith("data:") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={bannerPreview}
                        alt=""
                        className="h-36 w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={bannerPreview}
                        alt=""
                        width={800}
                        height={288}
                        sizes="(max-width: 768px) 100vw, 640px"
                        className="h-36 w-full object-cover"
                        unoptimized={isRemoteImageSrc(bannerPreview)}
                      />
                    )}
                    <span className="pointer-events-none absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded-md bg-black/50 px-2 py-1 text-center text-xs text-white/90">
                      Click to replace
                    </span>
                  </label>
                ) : (
                  <label
                    htmlFor={bannerInputId}
                    className="flex w-full cursor-pointer flex-col items-center py-4"
                  >
                    <i
                      className={`fa-solid mb-2 text-2xl text-[#8ec5eb] ${bannerDragOver ? "fa-file-image" : "fa-cloud-arrow-up"}`}
                    />
                    <span className="text-center text-sm text-white/80">
                      {bannerDragOver ? "Drop image here" : "Or click here to choose a file"}
                    </span>
                    <span className="mt-1 text-xs text-white/45">
  PNG, JPG, JPEG, WebP — max 5MB
</span>
                  </label>
                )}
              </div>
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
