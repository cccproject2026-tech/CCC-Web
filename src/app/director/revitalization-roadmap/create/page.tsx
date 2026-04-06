"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axiosInstance from "@/app/Services/config/axios-instance";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../../directorUi";
import HeroBg from "../../../Assets/roadmap-bg.png";

/** Step 1 creates a shell roadmap; Phase roadmaps with nested steps use the library editor. */
const ROADMAP_TYPES = ["Single Roadmap"] as const;

function extractCreatedRoadmapId(res: { data?: { data?: { _id?: string }; _id?: string } }): string | null {
  const d = res.data?.data ?? res.data;
  const id = (d as { _id?: string })?._id ?? (d as { id?: string })?.id;
  return id && typeof id === "string" ? id : null;
}

export default function CreateRoadmapStepOnePage() {
  const router = useRouter();
  const [type] = useState<string>("Single Roadmap");
  const [name, setName] = useState("");
  const [roadmapSubheading, setRoadmapSubheading] = useState("");
  const [duration, setDuration] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
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

      const id = extractCreatedRoadmapId(res);
      if (!id) {
        setError("Roadmap was created but no ID was returned. Open the roadmap library.");
        return;
      }

      router.push(`/director/revitalization-roadmap/create/${id}/task-description`);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string | string[] } } };
      const msg = e?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to create roadmap. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectCls = `${directorInputClass} appearance-none pr-10 [&>option]:bg-[#041f35] [&>option]:text-white`;

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Create Roadmap"
        subtitle="Step 1 of 2 — Roadmap details"
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "Create" },
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
            <h2 className="text-lg font-bold text-white sm:text-xl">Create New Roadmap</h2>
            <p className="mt-1 text-xs text-[#8ec5eb]/80">
              Save the shell first; you will add task page copy and custom fields next.
            </p>
          </div>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-white/90">Type</label>
              <div className="relative">
                <select value={type} disabled className={`${selectCls} opacity-90`}>
                  {ROADMAP_TYPES.map((t) => (
                    <option key={t} value={t}>
                      Single
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
              <label className="mb-1 block text-sm font-medium text-white/90">Banner</label>
              <label className="relative mt-1 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#8ec5eb]/35 bg-[#8ec5eb]/5 px-4 py-10 transition hover:border-[#8ec5eb]/55 hover:bg-[#8ec5eb]/10">
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 cursor-pointer opacity-0"
                  onChange={handleBannerChange}
                  aria-label="Upload banner image for the roadmap"
                />
                {bannerPreview ? (
                  <div className="relative h-36 w-full overflow-hidden rounded-lg">
                    <Image src={bannerPreview} alt="" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <>
                    <i className="fa-solid fa-cloud-arrow-up mb-2 text-2xl text-[#8ec5eb]" />
                    <span className="text-center text-sm text-white/80">Upload banner image for the roadmap</span>
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
              disabled={submitting}
              className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(142,197,235,0.15)] transition hover:bg-[#8ec5eb]/30 disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create & continue"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
