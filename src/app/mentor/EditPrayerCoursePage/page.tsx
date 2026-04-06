"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

/* ---------------- Types ---------------- */
type ExtraFieldType = "text" | "textarea" | "upload" | "date";
type ExtraField = {
  id: number;
  type: ExtraFieldType;
  label: string;
  placeholder?: string;
  allowPastorSelect?: boolean; // for 'date'
  value?: string;
  file?: File | null;
};

export default function EditPrayerCoursePage() {
  const router = useRouter();

  /* ---------- Base form ---------- */
  const [name, setName] = useState("Prayer and Visitation Strategy");
  const [instructions, setInstructions] = useState("");
  const [months, setMonths] = useState("Months : 10 – 12");
  const [task, setTask] = useState("Create a prayer and visitation strategy");
  const [desc, setDesc] = useState(
    "Develop a prayer and visitation strategy and upload document"
  );

  /* ---------- Dynamic row / dropdown ---------- */
  const [insertText, setInsertText] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  /* ---------- Dynamic fields list ---------- */
  const [fields, setFields] = useState<ExtraField[]>([
    { id: 1, type: "upload", label: "Upload Strategy", file: null },
  ]);

  /* ---------- Banner ---------- */
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  /* ---------- Modals ---------- */
  type ModalType = ExtraFieldType | null;
  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);

  // shared modal inputs
  const [modalHeading, setModalHeading] = useState("");
  const [modalPlaceholder, setModalPlaceholder] = useState("");
  const [modalAllowPastor, setModalAllowPastor] = useState(true);

  const openCreateModal = (t: ExtraFieldType) => {
    setEditingFieldId(null);
    setModalType(t);
    setModalHeading(
      insertText.trim() ||
        (t === "text"
          ? "Text Field"
          : t === "textarea"
          ? "Text Area"
          : t === "upload"
          ? "Upload Strategy"
          : "Follow up Event Date")
    );
    setModalPlaceholder(
      t === "text" || t === "textarea" ? "Enter Place Holder" : ""
    );
    setModalAllowPastor(t === "date" ? true : false);
  };

  const openEditModal = (f: ExtraField) => {
    setEditingFieldId(f.id);
    setModalType(f.type);
    setModalHeading(f.label);
    setModalPlaceholder(f.placeholder || "");
    setModalAllowPastor(!!f.allowPastorSelect);
  };

  const closeModal = () => {
    setModalType(null);
    setEditingFieldId(null);
  };

  const upsertFieldFromModal = () => {
    if (!modalType) return;
    const base: Partial<ExtraField> = {
      label: modalHeading || "",
      placeholder: modalType === "date" ? undefined : modalPlaceholder,
      allowPastorSelect: modalType === "date" ? modalAllowPastor : undefined,
    };

    if (editingFieldId) {
      setFields((prev) =>
        prev.map((f) => (f.id === editingFieldId ? { ...f, ...base } as ExtraField : f))
      );
    } else {
      setFields((prev) => [
        ...prev,
        { id: Date.now(), type: modalType, ...base, file: null } as ExtraField,
      ]);
      setInsertText("");
    }
    closeModal();
  };

  /* ---------- Handlers ---------- */
  const removeField = (id: number) =>
    setFields((prev) => prev.filter((f) => f.id !== id));

  const onUploadChange = (id: number, file: File | null) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, file } : f)));

  const onBannerChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setBannerFile(e.target.files?.[0] || null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call API
    setShowSuccess(true);
    setTimeout(() => {
      router.push("/mentor/PrayerAndVisitationStrategyPage");
    }, 1800);
  };

  /* ---------- Success popup ---------- */
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C]">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[250px] md:h-[270px] bg-cover bg-center flex items-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90" />
        <div className="relative z-10 px-10 md:px-20 pb-8">
          <h1 className="text-white text-[34px] font-semibold tracking-tight">
            Courses
          </h1>
        </div>
      </section>

      {/* FORM */}
      <main className="flex-1 bg-[#254487] pb-24">
        <div className="max-w-5xl mx-auto px-10 md:px-20 pt-10">
          <h2 className="text-white text-[20px] font-semibold mb-6">Create – Courses</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-white text-sm mb-2">Name of Courses</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Name of Courses"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Instructions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-white text-sm">General Instructions</label>
                <button
                  type="button"
                  className="w-8 h-8 rounded-md bg-white/15 border border-white/30 text-white flex items-center justify-center"
                  title="Help"
                >
                  <i className="fa-regular fa-circle-info text-[14px]" />
                </button>
              </div>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Brief Description for Instructions"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Months */}
            <div>
              <label className="block text-white text-sm mb-2">Completion Time</label>
              <input
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                placeholder="Months :"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Task */}
            <div>
              <label className="block text-white text-sm mb-2">Name of Task</label>
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter Name of Task"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-white text-sm mb-2">Description</label>
              <textarea
                rows={3}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Brief Description for Thumbnail"
                className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none focus:ring-2 focus:ring-[#FFD84E]"
              />
            </div>

            {/* Render dynamic sections */}
            {fields.map((f) => (
              <div key={f.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-white text-sm flex items-center gap-2">
                    {f.type === "upload" && <i className="fa-regular fa-image" />}
                    {f.type === "text" && <i className="fa-solid fa-font" />}
                    {f.type === "textarea" && <i className="fa-regular fa-square" />}
                    {f.type === "date" && <i className="fa-regular fa-calendar" />}
                    {f.label}
                  </h4>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(f)}
                      className="inline-flex items-center gap-2 bg-white/90 text-[#103C8C] text-sm font-medium px-4 py-2 rounded-md border border-white hover:bg-white"
                    >
                      <i className="fa-regular fa-pen-to-square" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="inline-flex items-center gap-2 bg-white/90 text-[#103C8C] text-sm font-medium px-4 py-2 rounded-md border border-white hover:bg-white"
                    >
                      Remove Field
                    </button>
                  </div>
                </div>

                {/* controls */}
                {f.type === "upload" && (
                  <label className="block h-[170px] w-full rounded-md border-2 border-dashed border-[#5A8DCB] text-white/85 bg-transparent flex flex-col items-center justify-center text-center">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => onUploadChange(f.id, e.target.files?.[0] || null)}
                    />
                    <i className="fa-solid fa-plus text-white text-lg mb-2" />
                    <div>Drag & Drop or Click here to choose file</div>
                    <div className="text-xs text-white/60 mt-1">Max file size : 10 MB</div>
                  </label>
                )}

                {f.type === "text" && (
                  <input
                    placeholder={f.placeholder || "Enter text"}
                    className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none"
                  />
                )}

                {f.type === "textarea" && (
                  <textarea
                    rows={3}
                    placeholder={f.placeholder || "Enter description"}
                    className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none"
                  />
                )}

                {f.type === "date" && (
                  <div className="space-y-2">
                    <div className="relative">
                      <i className="fa-regular fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-white/80" />
                      <input
                        type="date"
                        className="w-full bg-transparent border border-[#5A8DCB] rounded-md pl-10 pr-3 py-2 text-white placeholder-white/70 outline-none"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-white text-sm">
                      <input
                        type="checkbox"
                        className="accent-[#103C8C]"
                        defaultChecked={!!f.allowPastorSelect}
                        onChange={(e) =>
                          setFields((prev) =>
                            prev.map((x) =>
                              x.id === f.id ? { ...x, allowPastorSelect: e.target.checked } : x
                            )
                          )
                        }
                      />
                      Allow Pastor to Select Date
                    </label>
                  </div>
                )}
              </div>
            ))}

            {/* Insert Field row + Add Field menu */}
            <div className="relative">
              <div className="flex items-center gap-3">
                <input
                  value={insertText}
                  onChange={(e) => setInsertText(e.target.value)}
                  placeholder="Insert Field"
                  className="flex-1 bg-white/10 border border-[#5A8DCB] rounded-md px-4 py-2 text-white placeholder-white/70 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowAddMenu((s) => !s)}
                  className="flex items-center gap-2 bg-white text-[#103C8C] text-sm font-medium px-4 py-2 rounded-md border border-[#DDE2EB] hover:bg-[#F5F8FF]"
                >
                  <i className="fa-regular fa-square-plus" />
                  Add Field
                </button>
              </div>

              {showAddMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-xl border border-gray-200 z-20"
                  onMouseLeave={() => setShowAddMenu(false)}
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    onClick={() => {
                      setShowAddMenu(false);
                      openCreateModal("text");
                    }}
                  >
                    <i className="fa-solid fa-font" />
                    Text Field
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    onClick={() => {
                      setShowAddMenu(false);
                      openCreateModal("textarea");
                    }}
                  >
                    <i className="fa-regular fa-square" />
                    Text Area
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    onClick={() => {
                      setShowAddMenu(false);
                      openCreateModal("upload");
                    }}
                  >
                    <i className="fa-regular fa-folder-open" />
                    Upload Field
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    onClick={() => {
                      setShowAddMenu(false);
                      openCreateModal("date");
                    }}
                  >
                    <i className="fa-regular fa-calendar" />
                    Date Picker
                  </button>
                </div>
              )}
            </div>

            {/* Banner */}
            <div>
              <h4 className="text-white text-sm mb-3 flex items-center gap-2">
                <i className="fa-regular fa-image" />
                Upload Banner Image
              </h4>

              <label className="block h-[170px] w-full rounded-md border-2 border-dashed border-[#5A8DCB] text-white/85 bg-transparent flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition">
                <input type="file" className="hidden" onChange={onBannerChange} />
                <i className="fa-solid fa-plus text-white text-lg mb-2" />
                <div>Drag & Drop or Click here to choose file</div>
                <div className="text-xs text-white/60 mt-1">Max file size : 10 MB</div>
              </label>

              {bannerFile && (
                <div className="mt-3 flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                    <i className="fa-regular fa-file-image" />
                  </div>
                  <div className="text-sm">
                    {bannerFile.name}{" "}
                    <span className="text-white/70">
                      ({(bannerFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="pt-4 flex items-center justify-center gap-4">
              <a
                href="/assignments/prayer-and-visitation"
                className="inline-flex items-center justify-center bg-white text-[#103C8C] px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="inline-flex items-center justify-center bg-[#1B2E5B] text-white px-6 py-2 rounded-md text-sm font-medium hover:brightness-110"
              >
                Create Assignment
              </button>
            </div>
          </form>
        </div>
      </main>

    

      {/* ---------------- Modals ---------------- */}
      {modalType && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-24">
          <div className="w-[860px] max-w-[95vw] rounded-xl bg-white shadow-2xl">
            <div className="px-8 pt-7 pb-2">
              <h3 className="text-[22px] font-semibold text-[#0B1C58]">
                {modalType === "text"
                  ? "Text Field"
                  : modalType === "textarea"
                  ? "Text Area"
                  : modalType === "upload"
                  ? "Upload Field"
                  : "Date Picker"}
              </h3>
            </div>

            <div className="px-8 pb-6 space-y-4">
              {/* Heading */}
              <div>
                <label className="block text-[#637094] text-sm mb-2">Heading</label>
                <input
                  value={modalHeading}
                  onChange={(e) => setModalHeading(e.target.value)}
                  placeholder={
                    modalType === "date" ? "Enter Heading of the field" : "Upload Strategy"
                  }
                  className="w-full border border-[#D9DFEE] rounded-md px-4 py-2 text-[#0B1C58] outline-none focus:ring-2 focus:ring-[#103C8C]"
                />
              </div>

              {/* Placeholder for text + textarea */}
              {(modalType === "text" || modalType === "textarea") && (
                <div>
                  <label className="block text-[#637094] text-sm mb-2">Place Holder</label>
                  <input
                    value={modalPlaceholder}
                    onChange={(e) => setModalPlaceholder(e.target.value)}
                    placeholder="Enter Place Holder"
                    className="w-full border border-[#D9DFEE] rounded-md px-4 py-2 text-[#0B1C58] outline-none focus:ring-2 focus:ring-[#103C8C]"
                  />
                </div>
              )}

              {/* Checkbox for date */}
              {modalType === "date" && (
                <label className="flex items-center gap-2 text-[#0B1C58] text-sm mt-1">
                  <input
                    type="checkbox"
                    className="accent-[#103C8C]"
                    checked={modalAllowPastor}
                    onChange={(e) => setModalAllowPastor(e.target.checked)}
                  />
                  Allow Pastor to Select Date
                </label>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalHeading("");
                    setModalPlaceholder("");
                    setModalAllowPastor(modalType === "date");
                  }}
                  className="px-5 py-2 rounded-md border border-[#D9DFEE] text-[#103C8C] bg-[#EEF1FA]"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={upsertFieldFromModal}
                  className="px-5 py-2 rounded-md bg-[#103C8C] text-white hover:bg-[#0B2E72]"
                >
                  Insert Field
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- Success popup ---------------- */}
      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-xl shadow-2xl px-6 py-5 text-[#0B1C58] text-sm font-medium">
            <div className="flex items-center gap-3">
              <i className="fa-solid fa-circle-check text-green-500 text-lg" />
              Assignment Created Successfully
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
