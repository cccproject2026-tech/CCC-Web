"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiCreateAssessment, apiDeleteAssessments, apiGetAssessments } from "@/app/Services/assessment.service";
import { useRouter } from "next/navigation";

const IMAGE_FALLBACKS = [Card1, Card2, Card3, Card4];

export default function MentorAssessments() {
    const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"normal" | "select">("normal");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formInstructions, setFormInstructions] = useState<string[]>([""]);
  const [formSections, setFormSections] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);

        const res = await apiGetAssessments({
          search: searchTerm || undefined,
        });
        console.log(res.data)
        setAssessments(res.data || []);
      } catch (err) {
        console.error("Failed to load assessments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [searchTerm]);

  // derived
  const filtered = assessments;

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleDelete = async () => {
    try {
      await apiDeleteAssessments(selectedIds);

      setAssessments(prev =>
        prev.filter(a => !selectedIds.includes(a._id))
      );

      setToastMsg(`${selectedIds.length} assessment(s) deleted`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      setToastMsg("Assessment name is required");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        name: formTitle,
        description: formDesc,
        instructions: formInstructions.filter(i => i.trim() !== ""),
        sections: formSections,
      };

      const res = await apiCreateAssessment(payload);

      setAssessments(prev => [res.data.data, ...prev]);

      setFormTitle("");
      setFormDesc("");
      setFormInstructions([""]);
      setFormSections([]);

      setShowForm(false);
      setToastMsg("Assessment created successfully");
    } catch (err) {
      console.error("Create failed", err);
      setToastMsg("Failed to create assessment");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <MentorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative h-[250px] flex items-end justify-start px-16 pb-12 bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90" />
        <h1 className="relative z-10 text-4xl font-semibold text-white mb-1">
          Assessments
        </h1>
      </section>

      <main className="flex-1 bg-[#254487] pt-10 pb-20 px-10 md:px-20">
        <div className="max-w-7xl mx-auto space-y-6">
          {!showForm ? (
            <>
              {/* 🔍 SEARCH + BUTTONS */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="relative w-full md:w-[350px]">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 text-sm" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-[#103C8C]"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setMode(mode === "select" ? "normal" : "select")
                    }
                    className={`${mode === "select"
                      ? "bg-[#103C8C] text-white"
                      : "bg-white text-[#0B1C58]"
                      } text-sm font-medium px-5 py-2 rounded-md border border-[#DDE2EB] hover:bg-[#F5F8FF] transition`}
                  >
                    <i className="fa-regular fa-pen-to-square mr-2"></i>
                    {mode === "select" ? "Cancel" : "Select"}
                  </button>

                  <button
                    onClick={() => router.push("/mentor/MentorAssessments/create")}
                    className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 shadow-md flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add
                  </button>
                </div>
              </div>

              {/* SELECTED TOOLBAR */}
              {mode === "select" && (
                <div className="bg-[#3C5FB8]/30 text-white rounded-md flex items-center justify-between px-5 py-3 mt-4">
                  <p>
                    Selected Items:{" "}
                    <span className="font-semibold">{selectedIds.length}</span>
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedIds(filtered.map((a) => a.id))}
                      className="bg-white text-[#0B1C58] px-4 py-[6px] rounded-md text-sm font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-[#fff] text-red-600 px-3 py-[6px] rounded-md text-sm font-medium flex items-center gap-2"
                    >
                      <i className="fa-solid fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              )}

              {loading && (
                <div className="text-center py-20 text-white">
                  Loading assessments...
                </div>
              )}

              {!loading && filtered.length === 0 && (
                <div className="text-center py-20 text-white/80">
                  No assessments found.
                </div>
              )}

              {/* GRID */}
              <div className="grid sm:grid-cols-2 gap-8 mt-6">
                {filtered.map((item, index) => (
                  <div
                    key={item._id}
                    className={`relative bg-white rounded-xl shadow-md flex overflow-hidden border transition ${selectedIds.includes(item._id)
                      ? "border-4 border-[#103C8C]"
                      : "border-transparent"
                      }`}
                  >
                    {/* CHECKBOX overlay */}
                    {mode === "select" && (
                      <div className="absolute right-3 top-3 z-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item._id)}
                          onChange={() => toggleSelect(item._id)}
                          className="w-5 h-5 accent-[#103C8C]"
                        />
                      </div>
                    )}

                    <div className="w-[180px] h-[140px] flex-shrink-0 m-5">
                      <Image
                        src={item.bannerImage || IMAGE_FALLBACKS[index % IMAGE_FALLBACKS.length]}
                        alt={item.name || "Assessment"}
                        width={180}
                        height={140}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-[#0B1C58] text-[15px] mb-1">
                          {item.name} <button
                            onClick={() =>
                              setShowDropdown(
                                showDropdown === item._id ? null : item._id
                              )
                            }
                            className="text-gray-500 hover:text-[#103C8C]"
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                        </h3>
                        <div className="relative">


                          {showDropdown === item._id && (
                            <div className="absolute right-0 top-2 bg-white border border-gray-200 rounded-md shadow-lg w-36 text-sm text-[#0B1C58] z-20">
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  setShowDropdown(null);
                                  setShowAssignDrawer(true);
                                }}
                              >
                                <i className="fa-solid fa-user-plus text-[#103C8C]" />
                                Assign to
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  setShowDropdown(null);
                                  // setMode("edit");
                                }}
                              >
                                <i className="fa-regular fa-pen-to-square text-[#103C8C]" />
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2 text-red-500"
                                onClick={() => {
                                  setShowDropdown(null);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <i className="fa-solid fa-trash" /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                      </div>
                      <div className="flex justify-between items-center mt-2">


                        <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-5 py-[6px] rounded-md transition">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* 🟨 CREATE ASSESSMENT INLINE FORM */}
              <div className="bg-transparent text-white">
                <h2 className="text-2xl font-semibold mb-8 text-white">
                  Create – Assessment
                </h2>

                <form onSubmit={handleCreate} className="space-y-8">
                  {/* Name + Description */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Name of Assessment
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Enter Name of Survey"
                      className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white"
                    />

                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Brief Description for Thumbnail"
                      className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white"
                    />
                  </div>

                  {/* Instructions */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-white font-medium">
                        General Instructions for the Assessment
                      </label>
                      <button
                        type="button"
                        className="flex items-center gap-2 bg-white text-[#0B1C58] text-sm font-medium px-4 py-[6px] rounded-md"
                      >
                        <i className="fa-solid fa-info-circle"></i> Instruction
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={formInstructions[0]}
                      onChange={(e) => setFormInstructions([e.target.value])}
                      placeholder="Enter Instructions"
                      className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white"
                    />
                  </div>

                  {/* Sections */}
                  <div className="border border-[#3B63B8] rounded-md p-5">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-white font-medium">Sections</label>
                      <button
                        type="button"
                        className="flex items-center gap-2 bg-white text-[#0B1C58] text-sm font-medium px-4 py-[6px] rounded-md"
                      >
                        <i className="fa-solid fa-plus"></i> Add
                      </button>
                    </div>

                    {/* Section 1 */}
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter Name of Survey"
                        className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white placeholder-gray-300"
                      />
                      <textarea
                        rows={2}
                        placeholder="Enter Guidelines"
                        className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white placeholder-gray-300"
                      />

                      {/* Layers */}
                      {[
                        "Layer 1",
                        "Layer 2",
                        "Layer 1 - Customized Development Plans",
                        "Layer 2 - Customized Development Plans",
                      ].map((layer, i) => (
                        <div
                          key={i}
                          className="border border-[#3B63B8] rounded-md p-4 space-y-3"
                        >
                          <div className="flex justify-between items-center">
                            <label className="text-white font-medium">{layer}</label>
                            <button
                              type="button"
                              className="flex items-center gap-2 bg-white text-[#0B1C58] text-sm font-medium px-4 py-[6px] rounded-md"
                            >
                              <i
                                className={`fa-solid ${layer.includes("Plan") ? "fa-file-alt" : "fa-list"
                                  }`}
                              ></i>
                              {layer.includes("Plan") ? "Plan" : "Choice"}
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Choice 1"
                            className="w-full border border-[#3B63B8] bg-transparent rounded-md px-4 py-2 text-white placeholder-gray-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upload Image */}
                  <div>
                    <label className="block text-white font-medium mb-3">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-[#3B63B8] rounded-md py-10 text-center text-gray-200">
                      <p>Drag & Drop or Click here to choose file</p>
                      <p className="text-xs mt-1 text-gray-300">Max file size: 10MB</p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-center gap-6 pt-8">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-white text-[#0B1C58] px-8 py-2 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="bg-[#FFD84E] text-[#0B1C58] px-8 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create Survey"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>



      {/* DELETE CONFIRM MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-[380px] text-center shadow-lg">
            <i className="fa-solid fa-trash text-red-500 text-3xl mb-4"></i>
            <p className="text-[#0B1C58] font-medium mb-6">
              Are you sure want to delete {selectedIds.length} Assignments?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border border-[#103C8C] text-[#103C8C] rounded-md px-6 py-2 font-medium hover:bg-[#F5F8FF]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-[#103C8C] text-white rounded-md px-6 py-2 font-medium hover:bg-[#0B2E72]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 bg-white rounded-md shadow-lg flex items-center gap-2 px-4 py-2 text-[#0B1C58] border border-gray-200 animate-fade-in">
          <i className="fa-solid fa-check text-green-500"></i>
          {toastMsg}
        </div>
      )}

      {/* 🟦 ASSIGN DRAWER */}
      {showAssignDrawer && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-[420px] h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h3 className="text-lg font-semibold text-[#0B1C58]">
                Assigned to
              </h3>
              <button
                onClick={() => setShowAssignDrawer(false)}
                className="text-gray-500 hover:text-[#103C8C]"
              >
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 text-sm"></i>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full border border-gray-300 rounded-md pl-9 pr-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-[#103C8C] outline-none"
                />
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border border-gray-200 rounded-md p-2 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="accent-[#103C8C]"
                      defaultChecked={i === 0}
                    />
                    <Image
                      src={"/user.png"}
                      alt="User"
                      width={35}
                      height={35}
                      className="rounded-full bg-gray-200"
                    />
                    <span className="text-[#0B1C58] text-sm font-medium">
                      John Ross
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-4">
              <p className="text-xs text-gray-500 mb-2">
                John Doe, John Ross and 3 Others
              </p>
              <button
                onClick={() => {
                  setShowAssignDrawer(false);
                  setToastMsg("Assigned Survey Successfully");
                  setTimeout(() => setToastMsg(""), 2500);
                }}
                className="w-full bg-[#103C8C] text-white rounded-md py-2 font-medium hover:bg-[#0B2E72]"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}
