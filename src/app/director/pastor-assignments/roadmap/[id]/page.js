"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import AssignRoadmapModal from "@/app/Components/AssignRoadmapModal";
import MentorBg from "@/app/Assets/mentor-bg.png";
import axiosInstance from "@/app/Services/config/axios-instance";
import { apiGetRoadmapById } from "@/app/Services/api";

// ── Constants ──────────────────────────────────────────────────────────────────

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

const defaultExtra = () => ({ type: "TEXT_FIELD", name: "", placeHolder: "", buttonName: "", haveButton: false });
const defaultNested = () => ({ _id: null, name: "", duration: "", description: "", extras: [] });

// ── ExtrasList sub-component ───────────────────────────────────────────────────

function ExtrasList({ extras, onChange, onAdd, onRemove }) {
  return (
    <div className="space-y-2">
      {extras.map((extra, idx) => (
        <div key={idx} className="flex gap-2 items-start border border-gray-200 rounded-lg p-3 bg-gray-50/50">
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
              />
            </div>
            {(extra.type === "TEXT_FIELD" || extra.type === "TEXT_AREA") && (
              <input
                type="text"
                value={extra.placeHolder || ""}
                onChange={(e) => onChange(idx, "placeHolder", e.target.value)}
                placeholder="Placeholder (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
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
            {extra.type !== "TEXT_DISPLAY" && extra.type !== "UPLOAD" && extra.type !== "SECTION" && (
              <input
                type="text"
                value={extra.buttonName || ""}
                onChange={(e) => onChange(idx, "buttonName", e.target.value)}
                placeholder="Button name (optional)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
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
        <i className="fa-solid fa-plus text-[10px]"></i> Add Task / Extra
      </button>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function RoadmapDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  // ── Loading / error
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  // ── Modal
  const [showAssignModal, setShowAssignModal] = useState(false);

  // ── Step (Phase has 2 steps)
  const [step, setStep] = useState(1);

  // ── Form fields (mirrors CreateRoadmapModal exactly)
  const [type, setType] = useState("Phase");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [phase, setPhase] = useState("");
  const [divisions, setDivisions] = useState([]);
  const [showDivisionDropdown, setShowDivisionDropdown] = useState(false);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  const [extras, setExtras] = useState([]);

  // ── Nested items (Phase step 2)
  const [nestedItems, setNestedItems] = useState([defaultNested()]);

  const fileInputRef = useRef(null);
  const divisionRef = useRef(null);
  const isPhase = type === "Phase";

  // Close division dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (divisionRef.current && !divisionRef.current.contains(e.target)) {
        setShowDivisionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch roadmap and pre-populate form ──────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await apiGetRoadmapById(id);
        const data = res.data?.data || res.data;
        populateForm(data);
      } catch (err) {
        console.error("Error fetching roadmap:", err);
        setError("Failed to load roadmap.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const populateForm = (data) => {
    // Determine type
    const hasNested = data.roadmaps && data.roadmaps.length > 0;
    const roadmapType = data.type === "Phase" || hasNested ? "Phase" : "Single Roadmap";
    setType(roadmapType);
    setName(data.name || "");
    setDescription(data.description || data.roadMapDetails || "");
    setDuration(data.duration || "");
    setPhase(data.phase || "");
    setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
    setBannerPreview(data.imageUrl || null);

    // Extras
    const mappedExtras = (data.extras || []).map((e) => ({
      type: e.type || "TEXT_FIELD",
      name: e.name || "",
      placeHolder: e.placeHolder || "",
      buttonName: e.buttonName || "",
      haveButton: e.haveButton || false,
    }));
    setExtras(mappedExtras);

    // Nested items
    if (hasNested) {
      setNestedItems(
        data.roadmaps.map((item) => ({
          _id: item._id || null,
          name: item.name || "",
          duration: item.duration || "",
          description: item.description || item.roadMapDetails || "",
          extras: (item.extras || []).map((e) => ({
            type: e.type || "TEXT_FIELD",
            name: e.name || "",
            placeHolder: e.placeHolder || "",
            buttonName: e.buttonName || "",
            haveButton: e.haveButton || false,
          })),
        }))
      );
    }
  };

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const toggleDivision = (option) => {
    setDivisions((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    );
  };

  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleBannerDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  // Main extras
  const handleExtraChange = (idx, field, value) => {
    setExtras((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleAddExtra = () => setExtras((prev) => [...prev, defaultExtra()]);
  const handleRemoveExtra = (idx) => setExtras((prev) => prev.filter((_, i) => i !== idx));

  // Nested item handlers
  const handleNestedChange = (idx, field, value) => {
    setNestedItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };
  const handleNestedExtraChange = (nIdx, eIdx, field, value) => {
    setNestedItems((prev) =>
      prev.map((item, i) =>
        i === nIdx
          ? { ...item, extras: item.extras.map((ex, j) => j === eIdx ? { ...ex, [field]: value } : ex) }
          : item
      )
    );
  };
  const handleAddNestedExtra = (nIdx) => {
    setNestedItems((prev) =>
      prev.map((item, i) => i === nIdx ? { ...item, extras: [...item.extras, defaultExtra()] } : item)
    );
  };
  const handleRemoveNestedExtra = (nIdx, eIdx) => {
    setNestedItems((prev) =>
      prev.map((item, i) =>
        i === nIdx ? { ...item, extras: item.extras.filter((_, j) => j !== eIdx) } : item
      )
    );
  };

  // ── Validation & submit ───────────────────────────────────────────────────────

  const validateStep1 = () => {
    if (!name.trim()) { setError("Name is required."); return false; }
    if (!duration.trim()) { setError("Completion time is required."); return false; }
    const bad = extras.find((e) => !e.name.trim());
    if (bad) { setError("All extras/tasks must have a name."); return false; }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateStep1()) return;

    if (isPhase && step === 2) {
      for (const item of nestedItems) {
        if (!item.name.trim() || !item.duration.trim()) {
          setError("Each phase must have a name and completion time.");
          return;
        }
        if (item.extras.find((e) => !e.name.trim())) {
          setError("All phase extras/tasks must have a name.");
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

      extras.forEach((extra, i) => {
        formData.append(`extras[${i}][type]`, extra.type);
        formData.append(`extras[${i}][name]`, extra.name);
        if (extra.placeHolder) formData.append(`extras[${i}][placeHolder]`, extra.placeHolder);
        if (extra.buttonName) formData.append(`extras[${i}][buttonName]`, extra.buttonName);
        if (extra.haveButton !== undefined) formData.append(`extras[${i}][haveButton]`, String(extra.haveButton));
      });

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

      await axiosInstance.patch(`/roadmaps/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast("Roadmap updated successfully");
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : msg || "Failed to update roadmap.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
        <AppHero title="Roadmap Details" backgroundImageUrl={MentorBg.src} />
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero
        title={name || "Roadmap Details"}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Roadmaps", href: "/director/pastor-assignments" },
          { label: name || "Details" },
        ]}
      />

      <section className="px-4 sm:px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[800px] mx-auto space-y-6">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-white/80 hover:text-white transition text-[14px] font-medium"
            >
              <i className="fa-solid fa-arrow-left text-sm"></i>
              <span>Back</span>
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="px-5 py-2.5 bg-white text-[#2E3B8E] rounded-lg text-[14px] font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <i className="fa-solid fa-share-nodes"></i>
              <span>Assign</span>
            </button>
          </div>

          {/* Step indicator (Phase only) */}
          {isPhase && (
            <div className="bg-white/10 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => { setError(""); setStep(1); }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition ${step === 1 ? "bg-white text-[#2E3B8E] shadow" : "text-white/70 hover:text-white"}`}
              >
                Step 1 — Basic Info & Tasks
              </button>
              <button
                onClick={() => { setError(""); if (validateStep1()) setStep(2); }}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition ${step === 2 ? "bg-white text-[#2E3B8E] shadow" : "text-white/70 hover:text-white"}`}
              >
                Step 2 — Phases
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <i className="fa-solid fa-circle-exclamation text-red-500"></i>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-5">

              {/* Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Type</label>
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Description</label>
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Phase</label>
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Division</label>
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
                <label className="block text-sm font-semibold text-gray-800 mb-1.5">Banner Image</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleBannerDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#2E3B8E] hover:bg-blue-50/30 transition"
                >
                  {bannerPreview ? (
                    <div className="w-full flex flex-col items-center gap-3">
                      <img src={bannerPreview} alt="Banner preview" className="h-28 object-contain rounded-lg shadow" />
                      <p className="text-xs text-gray-400">Click or drop to replace</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center mb-2">
                        <i className="fa-solid fa-plus text-gray-400"></i>
                      </div>
                      <p className="text-sm text-gray-500">Drag & Drop or Click to choose file</p>
                      <p className="text-xs text-gray-400 mt-1"><i className="fa-solid fa-circle-info mr-1"></i>Max file size: 5 MB</p>
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
                  <label className="text-sm font-semibold text-gray-800">Tasks / Extras</label>
                  <span className="text-xs text-gray-400">{extras.length} added</span>
                </div>
                <ExtrasList
                  extras={extras}
                  onChange={handleExtraChange}
                  onAdd={handleAddExtra}
                  onRemove={handleRemoveExtra}
                />
              </div>

              {/* Step 1 action buttons */}
              <div className="flex justify-end gap-3 pt-2">
                {isPhase ? (
                  <button
                    onClick={handleNext}
                    className="px-8 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-sm font-semibold hover:bg-[#1F2A6E] transition"
                  >
                    Next <i className="fa-solid fa-arrow-right ml-1 text-xs"></i>
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-sm font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                    Save Changes
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2 (Phase only) ── */}
          {step === 2 && isPhase && (
            <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-5">
              <p className="text-sm text-gray-500">
                Edit the nested roadmap phases. Each requires a name and completion time.
              </p>

              <div className="space-y-5">
                {nestedItems.map((item, nIdx) => (
                  <div key={nIdx} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#2E3B8E]">Phase {nIdx + 1}</span>
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
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleNestedChange(nIdx, "name", e.target.value)}
                        placeholder="Enter name"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Completion Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleNestedChange(nIdx, "duration", e.target.value)}
                        placeholder="e.g. 3 Months"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleNestedChange(nIdx, "description", e.target.value)}
                        placeholder="Enter description (optional)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#2E3B8E] bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-700">Tasks / Extras</label>
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
                className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#2E3B8E]/40 rounded-xl py-3 text-[#2E3B8E] text-sm font-medium hover:border-[#2E3B8E] hover:bg-blue-50/30 transition"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add Another Phase
              </button>

              <div className="flex justify-between gap-3 pt-2">
                <button
                  onClick={() => { setError(""); setStep(1); }}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition"
                >
                  <i className="fa-solid fa-arrow-left mr-1 text-xs"></i> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-sm font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100]">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">{toast}</span>
          </div>
        </div>
      )}

      <AssignRoadmapModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roadmapIds={[id]}
        roadmapName={name}
        onSuccess={() => {
          setShowAssignModal(false);
          setToast("Assigned Successfully");
          setTimeout(() => setToast(null), 2000);
        }}
      />

      <AppFooter />
    </div>
  );
}
