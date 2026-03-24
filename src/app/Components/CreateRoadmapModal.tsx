"use client";
import { useState, useRef, useEffect } from "react";
import axiosInstance from "@/app/Services/config/axios-instance";

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
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtraItem {
  type: string;
  name: string;
  placeHolder?: string;
  buttonName?: string;
  haveButton?: boolean;
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
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultExtra = (): ExtraItem => ({ type: "TEXT_FIELD", name: "" });
const defaultNested = (): NestedItem => ({ name: "", duration: "", description: "", extras: [] });

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExtrasList({
  extras,
  onChange,
  onAdd,
  onRemove,
}: {
  extras: ExtraItem[];
  onChange: (idx: number, field: keyof ExtraItem, value: any) => void;
  onAdd: () => void;
  onRemove: (idx: number) => void;
}) {
  return (
    <div className="space-y-2">
      {extras.map((extra, idx) => (
        <div key={idx} className="flex gap-2 items-start border border-gray-200 rounded-lg p-3">
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={extra.type}
                  onChange={(e) => onChange(idx, "type", e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:border-[#2E3B8E] pr-8"
                >
                  {EXTRA_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] pointer-events-none"></i>
              </div>
              <input
                type="text"
                value={extra.name}
                onChange={(e) => onChange(idx, "name", e.target.value)}
                placeholder="Field name *"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
              />
            </div>
            {(extra.type === "TEXT_FIELD" || extra.type === "TEXT_AREA") && (
              <input
                type="text"
                value={extra.placeHolder || ""}
                onChange={(e) => onChange(idx, "placeHolder", e.target.value)}
                placeholder="Placeholder (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
              />
            )}
            {extra.type === "CHECKBOX" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div
                  onClick={() => onChange(idx, "haveButton", !extra.haveButton)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${extra.haveButton ? "bg-[#2E3B8E] border-[#2E3B8E]" : "bg-white border-gray-300"}`}
                >
                  {extra.haveButton && <i className="fa-solid fa-check text-white text-[8px]"></i>}
                </div>
                <span className="text-xs text-gray-600">Has button</span>
              </label>
            )}
            {(extra.type !== "TEXT_DISPLAY" && extra.type !== "UPLOAD" && extra.type !== "SECTION") && (
              <input
                type="text"
                value={extra.buttonName || ""}
                onChange={(e) => onChange(idx, "buttonName", e.target.value)}
                placeholder="Button name (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="mt-1 text-red-400 hover:text-red-600 transition text-xs flex-shrink-0"
          >
            <i className="fa-solid fa-trash"></i>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-2 border border-dashed border-[#2E3B8E]/40 rounded-lg py-2 text-[#2E3B8E] text-xs font-medium hover:border-[#2E3B8E] hover:bg-blue-50/30 transition"
      >
        <i className="fa-solid fa-plus text-[10px]"></i> Add Task/Extra
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CreateRoadmapModal({ isOpen, onClose, onSuccess }: CreateRoadmapModalProps) {
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
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    if (!duration.trim()) { setError("Completion time is required."); return; }
    const invalidExtra = extras.find((e) => !e.name.trim());
    if (invalidExtra) { setError("All extras/tasks must have a name."); return; }

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-[560px] mx-4 overflow-hidden shadow-2xl">

        {/* Header */}
        <div
          className="relative px-6 py-7 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1A2E7A 0%, #2E3B8E 60%, #3B5BD4 100%)" }}
        >
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.3) 20px, rgba(255,255,255,0.3) 40px)",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-white text-xl font-bold">Create New Roadmap</h2>
            {isPhase && (
              <p className="text-white/60 text-xs mt-1">
                Step {step} of 2 — {step === 1 ? "Basic Info & Tasks" : "Nested Roadmaps"}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="relative z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Step progress bar (Phase only) */}
        {isPhase && (
          <div className="flex">
            <div className={`h-1 flex-1 transition-all ${step >= 1 ? "bg-[#2E3B8E]" : "bg-gray-200"}`} />
            <div className={`h-1 flex-1 transition-all ${step >= 2 ? "bg-[#2E3B8E]" : "bg-gray-200"}`} />
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[68vh] overflow-y-auto">
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Type</label>
                <div className="relative">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:border-[#2E3B8E] pr-10"
                  >
                    {ROADMAP_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <i className="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none"></i>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter roadmap name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] resize-none"
                />
              </div>

              {/* Completion Time */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">
                  Completion Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 3 Months"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Phase label */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-1">Phase</label>
                <input
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  placeholder="e.g. Phase 1 (optional)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Division multi-select */}
              <div ref={divisionRef}>
                <label className="block text-sm font-medium text-gray-800 mb-1">Division</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDivisionDropdown((p) => !p)}
                    className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-left focus:outline-none focus:border-[#2E3B8E] hover:border-[#2E3B8E] transition bg-white"
                  >
                    <span className={divisions.length === 0 ? "text-gray-400" : "text-gray-800 capitalize"}>
                      {divisions.length === 0
                        ? "None"
                        : divisions.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}
                    </span>
                    <i className={`fa-solid fa-chevron-down text-gray-500 text-xs transition-transform ${showDivisionDropdown ? "rotate-180" : ""}`}></i>
                  </button>
                  {showDivisionDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      {DIVISION_OPTIONS.map((option) => {
                        const checked = divisions.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleDivision(option)}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 transition"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${checked ? "bg-[#2E3B8E] border-[#2E3B8E]" : "bg-white border-gray-300"}`}>
                              {checked && <i className="fa-solid fa-check text-white text-[9px]"></i>}
                            </div>
                            <span className={`capitalize ${checked ? "text-[#2E3B8E] font-medium" : "text-gray-700"}`}>
                              {option}
                            </span>
                          </button>
                        );
                      })}
                      {divisions.length > 0 && (
                        <div className="border-t border-gray-100 px-4 py-2">
                          <button type="button" onClick={() => setDivisions([])} className="text-xs text-red-500 hover:text-red-700 font-medium">
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
                <label className="block text-sm font-medium text-gray-800 mb-1">Upload Banner</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleBannerDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#2E3B8E] hover:bg-blue-50/30 transition"
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="Banner preview" className="h-24 object-contain rounded-lg" />
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full border-2 border-gray-400 flex items-center justify-center mb-2">
                        <i className="fa-solid fa-plus text-gray-400"></i>
                      </div>
                      <p className="text-sm text-gray-500">Drag & Drop or Click here to choose file</p>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <i className="fa-solid fa-circle-info"></i> Max file size: 5 MB
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
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-800">Tasks / Extras</label>
                  <span className="text-xs text-gray-400">{extras.length} added</span>
                </div>
                <ExtrasList
                  extras={extras}
                  onChange={handleExtraChange}
                  onAdd={handleAddExtra}
                  onRemove={handleRemoveExtra}
                />
              </div>
            </>
          )}

          {/* ── Step 2 (Phase only) ── */}
          {step === 2 && isPhase && (
            <>
              <p className="text-sm text-gray-500">
                Add nested roadmap items for this phase. Each requires a name and completion time.
              </p>
              <div className="space-y-5">
                {nestedItems.map((item, nIdx) => (
                  <div key={nIdx} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2E3B8E]">Roadmap {nIdx + 1}</span>
                      {nestedItems.length > 1 && (
                        <button
                          onClick={() => setNestedItems((prev) => prev.filter((_, i) => i !== nIdx))}
                          className="text-red-400 hover:text-red-600 transition text-xs"
                        >
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleNestedChange(nIdx, "name", e.target.value)}
                        placeholder="Enter name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Completion Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleNestedChange(nIdx, "duration", e.target.value)}
                        placeholder="e.g. 3 Months"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleNestedChange(nIdx, "description", e.target.value)}
                        placeholder="Enter description"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E]"
                      />
                    </div>

                    {/* Nested extras */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-700">Tasks / Extras</label>
                        <span className="text-xs text-gray-400">{item.extras.length} added</span>
                      </div>
                      <ExtrasList
                        extras={item.extras}
                        onChange={(eIdx, field, value) => handleNestedExtraChange(nIdx, eIdx, field, value)}
                        onAdd={() => handleAddNestedExtra(nIdx)}
                        onRemove={(eIdx) => handleRemoveNestedExtra(nIdx, eIdx)}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setNestedItems((prev) => [...prev, defaultNested()])}
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#2E3B8E]/40 rounded-xl py-2.5 text-[#2E3B8E] text-sm font-medium hover:border-[#2E3B8E] hover:bg-blue-50/30 transition"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add Another Roadmap
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end">
          {step === 2 && (
            <button
              onClick={() => { setError(""); setStep(1); }}
              className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          {step === 1 && isPhase ? (
            <button
              onClick={handleNext}
              className="px-8 py-2.5 rounded-xl bg-[#2E3B8E] text-white text-sm font-semibold hover:bg-[#1F2A6E] transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-8 py-2.5 rounded-xl bg-[#2E3B8E] text-white text-sm font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
              Create
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
