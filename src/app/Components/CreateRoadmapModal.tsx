"use client";
import { useState, useRef, useEffect } from "react";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  directorGlassCard,
  directorInputClass,
} from "@/app/director/directorUi";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROADMAP_TYPES = ["Phase", "Single Roadmap"];
const DIVISION_OPTIONS = ["church", "pastor"];

const EXTRA_TYPES = [
  { value: "TEXT_FIELD", label: "Text Field" },
  { value: "TEXT_AREA", label: "Text Area" },
  { value: "TEXT_DISPLAY", label: "Text Display" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "UPLOAD", label: "Upload" },
  { value: "DATE_PICKER", label: "Date Picker" },
  { value: "SECTION", label: "Section" },
  { value: "SIGNATURE", label: "Signature" },
  { value: "ASSESSMENT", label: "Assessment (link)" },
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtraItem {
  type: string;
  name: string;
  placeHolder?: string;
  buttonName?: string;
  haveButton?: boolean;
  /** Required when type is ASSESSMENT (matches backend ExtraItem / AssessmentExtra). */
  assessmentId?: string;
}

interface NestedItem {
  name: string;
  duration: string;
  description: string;
  extras: ExtraItem[];
}

interface CreateRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Match director shell (glass + #8ec5eb). Default: glass. */
  variant?: "light" | "glass";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const defaultExtra = (): ExtraItem => ({ type: "TEXT_FIELD", name: "", assessmentId: "" });
const defaultNested = (): NestedItem => ({ name: "", duration: "", description: "", extras: [] });

// ─── Sub-components ───────────────────────────────────────────────────────────

export function ExtrasList({
  extras,
  onChange,
  onAdd,
  onRemove,
  glass,
  hideFooterAdd = false,
}: {
  extras: ExtraItem[];
  onChange: (idx: number, field: keyof ExtraItem, value: any) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  glass: boolean;
  /** When true, omit the dashed “Add Task/Extra” row (e.g. page supplies its own add control). */
  hideFooterAdd?: boolean;
}) {
  const inCls = glass
    ? `${directorInputClass} px-3 py-2 text-xs`
    : "w-full rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]";
  const selCls = glass
    ? `${directorInputClass} appearance-none px-3 py-2 pr-8 text-xs [&>option]:bg-[#041f35] [&>option]:text-white`
    : "w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-xs text-gray-800 focus:outline-none focus:border-[#2E3B8E]";
  const rowCls = glass
    ? "flex items-start gap-2 rounded-lg border border-white/15 bg-white/[0.06] p-3"
    : "flex items-start gap-2 rounded-lg border border-gray-200 p-3";

  return (
    <div className="space-y-2">
      {extras.map((extra, idx) => (
        <div key={idx} className={rowCls}>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <select
                  value={extra.type}
                  onChange={(e) => onChange(idx, "type", e.target.value)}
                  className={selCls}
                >
                  {EXTRA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <i className={`fa-solid fa-chevron-down pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] ${glass ? "text-[#8ec5eb]/70" : "text-gray-400"}`} />
              </div>
              <input
                type="text"
                value={extra.name}
                onChange={(e) => onChange(idx, "name", e.target.value)}
                placeholder="Field name *"
                className={`min-w-0 flex-1 ${inCls}`}
              />
            </div>
            {(extra.type === "TEXT_FIELD" || extra.type === "TEXT_AREA") && (
              <input
                type="text"
                value={extra.placeHolder || ""}
                onChange={(e) => onChange(idx, "placeHolder", e.target.value)}
                placeholder="Placeholder (optional)"
                className={inCls}
              />
            )}
            {extra.type === "ASSESSMENT" && (
              <input
                type="text"
                value={extra.assessmentId || ""}
                onChange={(e) => onChange(idx, "assessmentId", e.target.value)}
                placeholder="Assessment ID (Mongo ID) *"
                className={inCls}
              />
            )}
            {extra.type === "CHECKBOX" && (
              <label className="flex cursor-pointer items-center gap-2">
                <button
                  type="button"
                  onClick={() => onChange(idx, "haveButton", !extra.haveButton)}
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition ${extra.haveButton ? (glass ? "border-[#8ec5eb] bg-[#8ec5eb]/30" : "border-[#2E3B8E] bg-[#2E3B8E]") : glass ? "border-white/30 bg-transparent" : "border-gray-300 bg-white"}`}
                >
                  {extra.haveButton && <i className={`fa-solid fa-check text-[8px] ${glass ? "text-[#8ec5eb]" : "text-white"}`} />}
                </button>
                <span className={`text-xs ${glass ? "text-white/70" : "text-gray-600"}`}>Has button</span>
              </label>
            )}
            {(extra.type !== "TEXT_DISPLAY" &&
              extra.type !== "UPLOAD" &&
              extra.type !== "SECTION" &&
              extra.type !== "ASSESSMENT") && (
              <input
                type="text"
                value={extra.buttonName || ""}
                onChange={(e) => onChange(idx, "buttonName", e.target.value)}
                placeholder="Button name (optional)"
                className={inCls}
              />
            )}
            {extra.type === "ASSESSMENT" && (
              <input
                type="text"
                value={extra.buttonName || ""}
                onChange={(e) => onChange(idx, "buttonName", e.target.value)}
                placeholder="Button label (optional)"
                className={inCls}
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="mt-1 flex-shrink-0 text-xs text-red-400 transition hover:text-red-300"
          >
            <i className="fa-solid fa-trash" />
          </button>
        </div>
      ))}
      {!hideFooterAdd ? (
        <button
          type="button"
          onClick={onAdd}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border border-dashed py-2 text-xs font-medium transition ${
            glass
              ? "border-[#8ec5eb]/40 text-[#8ec5eb] hover:bg-[#8ec5eb]/10"
              : "border-[#2E3B8E]/40 text-[#2E3B8E] hover:border-[#2E3B8E] hover:bg-blue-50/30"
          }`}
        >
          <i className="fa-solid fa-plus text-[10px]" /> Add Task/Extra
        </button>
      ) : null}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateRoadmapModal({
  isOpen,
  onClose,
  onSuccess,
  variant = "glass",
}: CreateRoadmapModalProps) {
  const glass = variant === "glass";
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1 fields
  const [type, setType] = useState("Phase");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [phase, setPhase] = useState("");
  const [divisions, setDivisions] = useState<string[]>([]);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [extras, setExtras] = useState<ExtraItem[]>([]);

  // Step 2 fields (Phase only)
  const [nestedItems, setNestedItems] = useState<NestedItem[]>([defaultNested()]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const divisionRef = useRef<HTMLDivElement>(null);

  const isPhase = type === "Phase";

  // Close division dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (divisionRef.current && !divisionRef.current.contains(e.target as Node)) {
        setShowDivisionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const resetAll = () => {
    setStep(1);
    setType("Phase");
    setName("");
    setDescription("");
    setDuration("");
    setPhase("");
    setDivisions([]);
    setShowDivisionDropdown(false);
    setBannerFile(null);
    setBannerPreview(null);
    setExtras([]);
    setNestedItems([defaultNested()]);
    setError("");
    setSubmitting(false);
  };

  const handleClose = () => { resetAll(); onClose(); };

  // Division toggle
  const toggleDivision = (option: string) => {
    setDivisions((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  };

  // Banner image
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleBannerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  // Main extras handlers
  const handleExtraChange = (idx: number, field: keyof ExtraItem, value: any) => {
    setExtras((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAddExtra = () => setExtras((prev) => [...prev, defaultExtra()]);
  const handleRemoveExtra = (idx: number) => setExtras((prev) => prev.filter((_, i) => i !== idx));

  // Nested item handlers
  const handleNestedChange = (idx: number, field: keyof Omit<NestedItem, "extras">, value: string) => {
    setNestedItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleNestedExtraChange = (nIdx: number, eIdx: number, field: keyof ExtraItem, value: any) => {
    setNestedItems((prev) =>
      prev.map((item, i) =>
        i === nIdx
          ? { ...item, extras: item.extras.map((ex, j) => j === eIdx ? { ...ex, [field]: value } : ex) }
          : item
      )
    );
  };
  const handleAddNestedExtra = (nIdx: number) => {
    setNestedItems((prev) =>
      prev.map((item, i) => i === nIdx ? { ...item, extras: [...item.extras, defaultExtra()] } : item)
    );
  };
  const handleRemoveNestedExtra = (nIdx: number, eIdx: number) => {
    setNestedItems((prev) =>
      prev.map((item, i) =>
        i === nIdx ? { ...item, extras: item.extras.filter((_, j) => j !== eIdx) } : item
      )
    );
  };

  // Validation & navigation
  const handleNext = () => {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!duration.trim()) { setError("Completion time is required."); return; }
    const invalidExtra = extras.find((e) => !e.name.trim());
    if (invalidExtra) { setError("All extras/tasks must have a name."); return; }
    const badAssessment = extras.find((e) => e.type === "ASSESSMENT" && !e.assessmentId?.trim());
    if (badAssessment) { setError("Assessment-type tasks must include an Assessment ID."); return; }
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!duration.trim()) { setError("Completion time is required."); return; }
    const invalidExtra = extras.find((e) => !e.name.trim());
    if (invalidExtra) { setError("All extras/tasks must have a name."); return; }
    const badAssessmentRoot = extras.find((e) => e.type === "ASSESSMENT" && !e.assessmentId?.trim());
    if (badAssessmentRoot) { setError("Assessment-type tasks must include an Assessment ID."); return; }

    if (isPhase && step === 2) {
      for (const item of nestedItems) {
        if (!item.name.trim() || !item.duration.trim()) {
          setError("Each nested roadmap must have a name and completion time.");
          return;
        }
        const invalidNested = item.extras.find((e) => !e.name.trim());
        if (invalidNested) {
          setError("All nested roadmap extras/tasks must have a name.");
          return;
        }
        const badNestedA = item.extras.find((e) => e.type === "ASSESSMENT" && !e.assessmentId?.trim());
        if (badNestedA) {
          setError("Nested Assessment tasks must include an Assessment ID.");
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("type", type);
      formData.append("name", name.trim());
      formData.append("duration", duration.trim());
      if (description.trim()) formData.append("description", description.trim());
      if (phase.trim()) formData.append("phase", phase.trim());
      divisions.forEach((d, i) => formData.append(`divisions[${i}]`, d));
      if (bannerFile) formData.append("image", bannerFile);

      // Append extras as indexed keys so NestJS ValidationPipe parses them as array of objects
      extras.forEach((extra, i) => {
        formData.append(`extras[${i}][type]`, extra.type);
        formData.append(`extras[${i}][name]`, extra.name);
        if (extra.placeHolder) formData.append(`extras[${i}][placeHolder]`, extra.placeHolder);
        if (extra.buttonName) formData.append(`extras[${i}][buttonName]`, extra.buttonName);
        if (extra.haveButton !== undefined) formData.append(`extras[${i}][haveButton]`, String(extra.haveButton));
        if (extra.type === "ASSESSMENT" && extra.assessmentId?.trim()) {
          formData.append(`extras[${i}][assessmentId]`, extra.assessmentId.trim());
        }
      });

      // For Phase type: include nested roadmaps as indexed keys
      if (isPhase) {
        const filteredNested = nestedItems.filter((item) => item.name.trim() && item.duration.trim());
        filteredNested.forEach((item, i) => {
          formData.append(`roadmaps[${i}][name]`, item.name.trim());
          formData.append(`roadmaps[${i}][duration]`, item.duration.trim());
          if (item.description.trim()) formData.append(`roadmaps[${i}][description]`, item.description.trim());
          item.extras.forEach((extra, j) => {
            formData.append(`roadmaps[${i}][extras][${j}][type]`, extra.type);
            formData.append(`roadmaps[${i}][extras][${j}][name]`, extra.name);
            if (extra.placeHolder) formData.append(`roadmaps[${i}][extras][${j}][placeHolder]`, extra.placeHolder);
            if (extra.buttonName) formData.append(`roadmaps[${i}][extras][${j}][buttonName]`, extra.buttonName);
            if (extra.haveButton !== undefined) formData.append(`roadmaps[${i}][extras][${j}][haveButton]`, String(extra.haveButton));
            if (extra.type === "ASSESSMENT" && extra.assessmentId?.trim()) {
              formData.append(`roadmaps[${i}][extras][${j}][assessmentId]`, extra.assessmentId.trim());
            }
          });
        });
      }

      await axiosInstance.post("/roadmaps", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetAll();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to create roadmap. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const labelCls = glass ? "mb-1 block text-sm font-medium text-white/90" : "mb-1 block text-sm font-medium text-gray-800";
  const subLabelCls = glass ? "text-xs text-white/55" : "text-xs text-gray-500";
  const fieldClass = glass
    ? directorInputClass
    : "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]";
  const fieldClassSm = glass
    ? `${directorInputClass} px-3 py-2 text-sm`
    : "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]";
  const selectClass = glass
    ? `${directorInputClass} appearance-none pr-10 text-sm [&>option]:bg-[#041f35] [&>option]:text-white`
    : "w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 focus:outline-none focus:border-[#2E3B8E]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-roadmap-title"
    >
      <div
        className={`flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl ${
          glass ? directorGlassCard : "bg-white"
        }`}
      >
        {/* Header */}
        <div
          className={`relative flex items-center justify-between px-5 py-5 sm:px-6 sm:py-6 ${
            glass
              ? "border-b border-white/10 bg-gradient-to-r from-[#062946] via-[#0a3558] to-[#062946]"
              : ""
          }`}
          style={
            glass
              ? undefined
              : { background: "linear-gradient(135deg, #1A2E7A 0%, #2E3B8E 60%, #3B5BD4 100%)" }
          }
        >
          {!glass ? (
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 40px)",
              }}
            />
          ) : null}
          <div className="relative z-10 min-w-0 pr-2">
            <h2 id="create-roadmap-title" className="text-lg font-bold text-white sm:text-xl">
              Create New Roadmap
            </h2>
            {isPhase ? (
              <p className="mt-1 text-xs text-white/65">
                Step {step} of 2 — {step === 1 ? "Details & optional tasks" : "Nested roadmaps"}
              </p>
            ) : (
              <p className="mt-1 text-xs text-white/65">
                Single-step form — fill required fields, then create.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        </div>

        {/* Step progress bar (Phase only) */}
        {isPhase && (
          <div className="flex border-b border-white/10">
            <div
              className={`h-1 flex-1 transition-all ${step >= 1 ? "bg-[#8ec5eb]" : glass ? "bg-white/15" : "bg-gray-200"}`}
            />
            <div
              className={`h-1 flex-1 transition-all ${step >= 2 ? "bg-[#8ec5eb]" : glass ? "bg-white/15" : "bg-gray-200"}`}
            />
          </div>
        )}

        {/* Body */}
        <div
          className={`max-h-[min(68vh,720px)] space-y-4 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5 ${
            glass ? "bg-[#041f35]/35" : ""
          }`}
        >
          {error && (
            <p
              className={`rounded-lg border px-3 py-2 text-sm ${
                glass
                  ? "border-red-400/40 bg-red-500/15 text-red-200"
                  : "border-red-200 bg-red-50 text-red-600"
              }`}
            >
              {error}
            </p>
          )}

          {glass && step === 1 && (
            <p className="text-xs leading-relaxed text-white/60">
              <span className="font-semibold text-[#8ec5eb]">*</span> Required fields. Tasks / extras are
              optional—add them only if this roadmap needs custom fields or linked assessments.
            </p>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              {/* Type */}
              <div>
                <label className={labelCls}>Roadmap type</label>
                <p className={`${subLabelCls} mb-2`}>
                  <strong className={glass ? "text-white/80" : "font-semibold text-gray-900"}>Phase</strong>{" "}
                  uses two steps (this page, then nested roadmaps).{" "}
                  <strong className={glass ? "text-white/80" : "font-semibold text-gray-900"}>
                    Single Roadmap
                  </strong>{" "}
                  saves in one step.
                </p>
                <div className="relative">
                  <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                    {ROADMAP_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <i className={`fa-solid fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs ${glass ? "text-[#8ec5eb]/70" : "text-gray-500"}`} />
                </div>
              </div>

              {/* Name */}
              <div>
                <label className={labelCls}>
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter roadmap name"
                  className={fieldClass}
                />
              </div>

              {/* Description */}
              <div>
                <label className={labelCls}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description (optional)"
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
              </div>

              {/* Completion Time */}
              <div>
                <label className={labelCls}>
                  Completion time <span className="text-red-400">*</span>
                </label>
                <p className={`${subLabelCls} mb-2`}>
                  Shown to users (e.g. &quot;3 Months&quot;, &quot;12 Weeks&quot;).
                </p>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 Months"
                  className={fieldClass}
                />
              </div>

              {/* Phase label */}
              <div>
                <label className={labelCls}>Phase label</label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  placeholder="e.g. Phase 1 (optional)"
                  className={fieldClass}
                />
              </div>

              {/* Division multi-select */}
              <div ref={divisionRef}>
                <label className={labelCls}>Division</label>
                <p className={`${subLabelCls} mb-2`}>Optional — limit visibility to church and/or pastor views.</p>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDivisionDropdown((p) => !p)}
                    className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm transition ${
                      glass
                        ? directorInputClass
                        : "border border-gray-300 bg-white focus:border-[#2E3B8E] hover:border-[#2E3B8E]"
                    }`}
                  >
                    <span
                      className={
                        divisions.length === 0
                          ? glass
                            ? "text-white/45"
                            : "text-gray-400"
                          : glass
                            ? "capitalize text-white"
                            : "capitalize text-gray-800"
                      }
                    >
                      {divisions.length === 0
                        ? "None selected"
                        : divisions.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-xs transition-transform ${showDivisionDropdown ? "rotate-180" : ""} ${glass ? "text-[#8ec5eb]/70" : "text-gray-500"}`} />
                  </button>
                  {showDivisionDropdown && (
                    <div
                      className={`absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border shadow-lg ${
                        glass
                          ? "border-white/15 bg-[#041f35]/98 backdrop-blur-md"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {DIVISION_OPTIONS.map((option) => {
                        const checked = divisions.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleDivision(option)}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                              glass ? "hover:bg-white/10" : "hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition ${
                                checked
                                  ? glass
                                    ? "border-[#8ec5eb] bg-[#8ec5eb]/25"
                                    : "border-[#2E3B8E] bg-[#2E3B8E]"
                                  : glass
                                    ? "border-white/30 bg-transparent"
                                    : "border-gray-300 bg-white"
                              }`}
                            >
                              {checked && (
                                <i className={`fa-solid fa-check text-[9px] ${glass ? "text-[#8ec5eb]" : "text-white"}`} />
                              )}
                            </div>
                            <span
                              className={`capitalize ${
                                checked
                                  ? glass
                                    ? "font-medium text-[#8ec5eb]"
                                    : "font-medium text-[#2E3B8E]"
                                  : glass
                                    ? "text-white/85"
                                    : "text-gray-700"
                              }`}
                            >
                              {option}
                            </span>
                          </button>
                        );
                      })}
                      {divisions.length > 0 && (
                        <div className={`border-t px-4 py-2 ${glass ? "border-white/10" : "border-gray-100"}`}>
                          <button
                            type="button"
                            onClick={() => setDivisions([])}
                            className="text-xs font-medium text-red-400 hover:text-red-300"
                          >
                            Clear all
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Banner upload */}
              <div>
                <label className={labelCls}>Banner image</label>
                <p className={`${subLabelCls} mb-2`}>Optional. JPEG, PNG, or WebP (max 5 MB recommended).</p>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleBannerDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition ${
                    glass
                      ? "border-white/20 hover:border-[#8ec5eb]/50 hover:bg-[#8ec5eb]/5"
                      : "border-gray-300 hover:border-[#2E3B8E] hover:bg-blue-50/30"
                  }`}
                >
                  {bannerPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerPreview} alt="Banner preview" className="h-24 rounded-lg object-contain" />
                  ) : (
                    <>
                      <div
                        className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          glass ? "border-[#8ec5eb]/50" : "border-gray-400"
                        }`}
                      >
                        <i className={`fa-solid fa-plus ${glass ? "text-[#8ec5eb]" : "text-gray-400"}`} />
                      </div>
                      <p className={`text-sm ${glass ? "text-white/70" : "text-gray-500"}`}>
                        Drag & drop or click to choose a file
                      </p>
                      <p className={`mt-1 flex items-center gap-1 text-xs ${glass ? "text-white/45" : "text-gray-400"}`}>
                        <i className="fa-solid fa-circle-info" /> Max ~5 MB
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleBannerChange}
                />
              </div>

              {/* Extras / Tasks */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className={glass ? "text-sm font-medium text-white/90" : "text-sm font-medium text-gray-800"}>
                    Tasks / extras
                  </label>
                  <span className={`text-xs ${glass ? "text-white/45" : "text-gray-400"}`}>{extras.length} added</span>
                </div>
                <ExtrasList
                  extras={extras}
                  onChange={handleExtraChange}
                  onAdd={handleAddExtra}
                  onRemove={handleRemoveExtra}
                  glass={glass}
                />
              </div>
            </>
          )}

          {/* ── Step 2 (Phase only) ── */}
          {step === 2 && isPhase && (
            <>
              <p className={`text-sm ${glass ? "text-white/65" : "text-gray-500"}`}>
                Add one or more nested roadmaps for this phase. Each needs a <strong className={glass ? "text-white/90" : ""}>name</strong> and{" "}
                <strong className={glass ? "text-white/90" : ""}>completion time</strong>. Tasks / extras are optional per nested item.
              </p>
              <div className="space-y-5">
                {nestedItems.map((item, nIdx) => (
                  <div
                    key={nIdx}
                    className={`space-y-3 rounded-xl border p-4 ${
                      glass ? "border-white/15 bg-white/[0.06]" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-semibold ${glass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"}`}>
                        Nested roadmap {nIdx + 1}
                      </span>
                      {nestedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNestedItems((prev) => prev.filter((_, i) => i !== nIdx))}
                          className="text-xs text-red-400 transition hover:text-red-300"
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className={`mb-1 block text-xs font-medium ${glass ? "text-white/80" : "text-gray-700"}`}>
                        Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleNestedChange(nIdx, "name", e.target.value)}
                        placeholder="Enter name"
                        className={fieldClassSm}
                      />
                    </div>

                    <div>
                      <label className={`mb-1 block text-xs font-medium ${glass ? "text-white/80" : "text-gray-700"}`}>
                        Completion time <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleNestedChange(nIdx, "duration", e.target.value)}
                        placeholder="e.g. 3 Months"
                        className={fieldClassSm}
                      />
                    </div>

                    <div>
                      <label className={`mb-1 block text-xs font-medium ${glass ? "text-white/80" : "text-gray-700"}`}>
                        Description
                      </label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleNestedChange(nIdx, "description", e.target.value)}
                        placeholder="Enter description (optional)"
                        className={fieldClassSm}
                      />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className={`text-xs font-medium ${glass ? "text-white/80" : "text-gray-700"}`}>
                          Tasks / extras
                        </label>
                        <span className={`text-xs ${glass ? "text-white/45" : "text-gray-400"}`}>
                          {item.extras.length} added
                        </span>
                      </div>
                      <ExtrasList
                        extras={item.extras}
                        onChange={(eIdx, field, value) => handleNestedExtraChange(nIdx, eIdx, field, value)}
                        onAdd={() => handleAddNestedExtra(nIdx)}
                        onRemove={(eIdx) => handleRemoveNestedExtra(nIdx, eIdx)}
                        glass={glass}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setNestedItems((prev) => [...prev, defaultNested()])}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-2.5 text-sm font-medium transition ${
                  glass
                    ? "border-[#8ec5eb]/40 text-[#8ec5eb] hover:bg-[#8ec5eb]/10"
                    : "border-[#2E3B8E]/40 text-[#2E3B8E] hover:border-[#2E3B8E] hover:bg-blue-50/30"
                }`}
              >
                <i className="fa-solid fa-plus text-xs" /> Add another nested roadmap
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className={`flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6 ${
            glass ? "border-white/10 bg-[#041f35]/50" : "border-gray-100 bg-white"
          }`}
        >
          {step === 2 && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep(1);
              }}
              className={`rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
                glass
                  ? "border border-white/20 text-white hover:bg-white/10"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              Back
            </button>
          )}
          {step === 1 && isPhase ? (
            <button
              type="button"
              onClick={handleNext}
              className={`rounded-xl px-8 py-2.5 text-sm font-semibold transition ${
                glass
                  ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#b8ddf5]"
                  : "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center justify-center gap-2 rounded-xl px-8 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                glass
                  ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#b8ddf5]"
                  : "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
              }`}
            >
              {submitting && <i className="fa-solid fa-spinner animate-spin text-xs" />}
              Create roadmap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
