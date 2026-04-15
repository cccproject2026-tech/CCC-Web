"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageContainer, directorPageRoot } from "../../directorUi";
import { apiGetRoadmapById } from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type RoadmapDoc = {
  _id?: string;
  name?: string;
  imageUrl?: string;
  divisions?: string[];
  roadmaps?: any[];
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

export default function DirectorRoadmapCreationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const roadmapId = sp.get("roadmapId")?.trim() || "";
  const roadmapType = (sp.get("type") as "single" | "phase" | null) || "single";
  const isEditMode = sp.get("isEditMode") === "true";
  const nestedRoadmapId = sp.get("nestedRoadmapId")?.trim() || "";

  const [parent, setParent] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [subheading, setSubheading] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerBlobUrlRef = useRef<string | null>(null);

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
        if (cancelled) return;
        setParent(doc);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load roadmap.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  // Mobile parity: prefill when editing (even though most edit flows go straight to roadmap-form)
  useEffect(() => {
    if (!isEditMode || !parent) return;
    const nested =
      roadmapType === "phase" && nestedRoadmapId
        ? parent.roadmaps?.find((r: any) => String(r?._id) === nestedRoadmapId)
        : parent.roadmaps?.[0];
    if (!nested) return;
    setName(String(nested.name || ""));
    setSubheading(String(nested.roadMapDetails || ""));
    setCompletionTime(String(nested.duration || ""));
    setSelectedDivision(String(nested.phase || "All") || "All");
    const img = resolveApiMediaUrl((nested as any)?.imageUrl) || "";
    if (img) setBannerPreview(img);
  }, [isEditMode, parent, roadmapType, nestedRoadmapId]);

  useEffect(() => {
    return () => {
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = null;
      }
    };
  }, []);

  const divisionChips = useMemo(() => {
    const list = Array.isArray(parent?.divisions) ? parent!.divisions! : [];
    const cleaned = list.map((d) => String(d || "").trim()).filter(Boolean);
    const withoutAll = cleaned.filter((d) => d.toLowerCase() !== "all");
    return ["All", ...withoutAll];
  }, [parent?.divisions]);

  const parentBannerImage = useMemo(() => {
    const direct = resolveApiMediaUrl(parent?.imageUrl) || "";
    const fromFirstNested = resolveApiMediaUrl(parent?.roadmaps?.[0]?.imageUrl) || "";
    return direct || fromFirstNested || "";
  }, [parent?.imageUrl, parent?.roadmaps]);

  const onNext = () => {
    if (!name.trim() || !subheading.trim()) {
      setError("Please fill in Name and Subheading.");
      return;
    }
    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("type", roadmapType);
    qp.set("isEditMode", isEditMode ? "true" : "false");
    if (nestedRoadmapId) qp.set("nestedRoadmapId", nestedRoadmapId);
    qp.set("name", name.trim());
    qp.set("subheading", subheading.trim());
    qp.set("completionTime", completionTime.trim());
    qp.set("selectedDivision", selectedDivision || "All");
    // bannerFile is uploaded during save on roadmap-form; we only show preview here.
    // Still pass preview url if any.
    if (bannerPreview) qp.set("bannerImage", bannerPreview);
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Create roadmap"
          subtitle="Loading…"
          image={null as any}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: "Roadmap creation" },
          ]}
        />
        <main className="flex flex-1 items-center justify-center px-4 pb-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#8ec5eb]" />
        </main>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Create roadmap"
        subtitle="Mobile parity: info-card fields (name/subheading/duration/division/banner) → next to form"
        image={null as any}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "Roadmap creation" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-3xl`}>
          {error ? (
            <div className={`${directorGlassCard} mb-6 p-4 text-sm text-red-200`}>{error}</div>
          ) : null}

          <div className={`${directorGlassCard} p-6`}>
            {/* Mobile parity: parent banner card */}
            <div className="mb-5 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <div className="relative h-[140px] w-full">
                {parentBannerImage ? (
                  <Image
                    src={parentBannerImage}
                    alt=""
                    fill
                    className="object-cover"
                    unoptimized={isRemoteImageSrc(parentBannerImage) || parentBannerImage.startsWith("blob:")}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-black/40 px-5 py-4">
                  <p className="text-center text-lg font-bold text-white">
                    {parent?.name || "Phase roadmap"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-white/80">
              These information will be shown in the info card of each Roadmap
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Roadmap Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={directorInputClass}
                  placeholder="Enter Name"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Roadmap Subheading</label>
                <textarea
                  value={subheading}
                  onChange={(e) => setSubheading(e.target.value)}
                  rows={3}
                  className={`${directorInputClass} min-h-[96px] resize-y`}
                  placeholder="Enter Subheading"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-white">Completion Time for the Roadmap</label>
                <input
                  value={completionTime}
                  onChange={(e) => setCompletionTime(e.target.value)}
                  className={directorInputClass}
                  placeholder="Months :"
                />
              </div>

              {roadmapType === "phase" ? (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white">Division of Phase</label>
                  <div className="flex flex-wrap gap-2">
                    {divisionChips.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() =>
                          setSelectedDivision((prev) => (prev === d ? "All" : d))
                        }
                        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                          selectedDivision === d
                            ? "border-white/30 bg-white text-[#0f4a76]"
                            : "border-white/15 bg-white/10 text-white hover:bg-white/15"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <label className="mb-2 block text-sm font-semibold text-white">
                  Banner Image for the Roadmap
                </label>

                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  id="phase-task-banner"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    e.target.value = "";
                    setBannerFile(f);
                    if (!f) return;
                    const next = URL.createObjectURL(f);
                    if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
                    bannerBlobUrlRef.current = next;
                    setBannerPreview(next);
                  }}
                />

                {bannerPreview ? (
                  <div className="overflow-hidden rounded-xl border border-white/20 bg-white/5">
                    <div className="relative h-[200px] w-full">
                      <Image
                        src={bannerPreview}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={isRemoteImageSrc(bannerPreview) || bannerPreview.startsWith("blob:")}
                      />
                    </div>
                    <label
                      htmlFor="phase-task-banner"
                      className="block cursor-pointer border-t border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-white/15"
                    >
                      Change Image
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="phase-task-banner"
                    className="mt-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/30 bg-white/10 px-4 py-5 text-white transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-cloud-arrow-up text-white" />
                    <span className="text-sm font-semibold">
                      Upload Banner Image for the Roadmap
                    </span>
                  </label>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

