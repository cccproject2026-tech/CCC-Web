"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import {
  apiCreateAssessment,
  apiDeleteAssessments,
  apiGetAssessments,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import { apiAssignAssessment } from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { useRouter } from "next/navigation";
import Mentor1 from "@/app/Assets/mentor1.png";

const IMAGE_FALLBACKS = [Card1, Card2, Card3, Card4];

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function getAssessmentId(item: { _id?: string; id?: string }): string {
  const raw = item._id ?? item.id;
  return raw != null ? String(raw) : "";
}

export default function MentorAssessments() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"normal" | "select">("normal");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [assignAssessmentId, setAssignAssessmentId] = useState<string | null>(null);
  const [assignUsers, setAssignUsers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAssignUserIds, setSelectedAssignUserIds] = useState<string[]>([]);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
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
        setAssessments(parseAssessmentsListPayload(res.data));
      } catch (err) {
        console.error("Failed to load assessments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [searchTerm]);

  useEffect(() => {
    if (!showAssignDrawer) {
      setAssignUsers([]);
      setAssignSearch("");
      setSelectedAssignUserIds([]);
      setAssignAssessmentId(null);
      return;
    }

    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;
    if (!mentorId) return;

    let cancelled = false;
    (async () => {
      try {
        setAssignLoading(true);
        const res = await apiGetAssignedUsers(mentorId);
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : [];
        if (!cancelled) setAssignUsers(list);
      } catch {
        if (!cancelled) setAssignUsers([]);
      } finally {
        if (!cancelled) setAssignLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showAssignDrawer]);

  const filteredAssignUsers = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return assignUsers;
    return assignUsers.filter((u: any) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [assignUsers, assignSearch]);

  const toggleAssignUser = (userId: string) => {
    setSelectedAssignUserIds((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
    );
  };

  const handleAssignSubmit = async () => {
    if (!assignAssessmentId || selectedAssignUserIds.length === 0) {
      setToastMsg("Select at least one pastor to assign.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    try {
      setAssignSubmitting(true);
      await apiAssignAssessment({
        userIds: selectedAssignUserIds,
        assessmentIds: [assignAssessmentId],
      });
      setShowAssignDrawer(false);
      setToastMsg("Assessment assigned successfully");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setToastMsg("Failed to assign assessment");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const filtered = assessments;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDelete = async () => {
    try {
      await apiDeleteAssessments(selectedIds);

      setAssessments((prev) => prev.filter((a) => !selectedIds.includes(getAssessmentId(a))));

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
        instructions: formInstructions.filter((i) => i.trim() !== ""),
        sections: formSections,
      };

      const res = await apiCreateAssessment(payload);
      const created = (res.data as { data?: unknown })?.data;
      if (created && typeof created === "object") {
        setAssessments((prev) => [created, ...prev]);
      }

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
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-center px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Assessments</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Create, assign, and review mentoring assessments.</p>
        </div>
      </section>

      <main className="flex-1 px-4 pb-12 sm:px-8 lg:px-20">
        <div className="mx-auto max-w-7xl space-y-6">
          {!showForm ? (
            <>
              <div className={`p-4 sm:p-5 ${glassPanel}`}>
                <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex w-full items-center rounded-xl border border-white/20 bg-white/10 md:max-w-md">
                    <i className="fa-solid fa-magnifying-glass px-3 text-[#8ec5eb]" />
                    <input
                      type="search"
                      placeholder="Search assessments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-transparent py-2.5 pr-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
                      autoComplete="off"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMode(mode === "select" ? "normal" : "select")}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${
                        mode === "select"
                          ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white"
                          : "border-white/20 bg-white/10 text-[#cde2f2] hover:bg-white/15"
                      }`}
                    >
                      <i className="fa-regular fa-pen-to-square mr-2" />
                      {mode === "select" ? "Cancel" : "Select"}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/mentor/MentorAssessments/create")}
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-6 py-2.5 text-sm font-semibold text-[#062946] shadow-md transition hover:bg-[#8ec5eb]"
                    >
                      <i className="fa-solid fa-plus" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {mode === "select" && (
                <div className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${glassPanel}`}>
                  <p className="text-sm text-[#cde2f2]">
                    Selected: <span className="font-semibold text-white">{selectedIds.length}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(filtered.map(getAssessmentId).filter(Boolean))
                      }
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/30"
                    >
                      <i className="fa-solid fa-trash" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {loading && <div className="py-16 text-center text-[#cde2f2]">Loading assessments…</div>}

              {!loading && filtered.length === 0 && (
                <div className={`py-16 text-center text-[#cde2f2] ${glassPanel}`}>No assessments found.</div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {filtered.map((item, index) => {
                  const aid = getAssessmentId(item);
                  return (
                    <div
                      key={aid || index}
                      className={`relative flex overflow-hidden rounded-2xl border transition ${
                        selectedIds.includes(aid)
                          ? "border-[#8ec5eb] ring-2 ring-[#8ec5eb]/40"
                          : "border-white/15"
                      } ${glassPanel}`}
                    >
                      {mode === "select" && (
                        <div className="absolute right-3 top-3 z-20">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(aid)}
                            onChange={() => toggleSelect(aid)}
                            className="h-5 w-5 accent-[#8ec5eb]"
                            aria-label={`Select ${item.name || "assessment"}`}
                          />
                        </div>
                      )}

                      <div className="m-4 h-[140px] w-[180px] flex-shrink-0 overflow-hidden rounded-xl border border-white/20">
                        <Image
                          src={item.bannerImage || IMAGE_FALLBACKS[index % IMAGE_FALLBACKS.length]}
                          alt={item.name || "Assessment"}
                          width={180}
                          height={140}
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 pr-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] font-semibold text-white">{item.name}</h3>
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowDropdown(showDropdown === aid ? null : aid)}
                                className="text-[#8ec5eb] hover:text-white"
                                aria-label="More actions"
                              >
                                <i className="fa-solid fa-ellipsis-vertical" />
                              </button>

                              {showDropdown === aid && (
                                <div className="absolute right-0 top-8 z-40 min-w-[9rem] rounded-xl border border-white/20 bg-[#0a3558] py-1 text-sm shadow-xl">
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#cde2f2] hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      setAssignAssessmentId(aid);
                                      setSelectedAssignUserIds([]);
                                      setShowAssignDrawer(true);
                                    }}
                                  >
                                    <i className="fa-solid fa-user-plus text-[#8ec5eb]" />
                                    Assign to
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#cde2f2] hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      if (aid) router.push(`/mentor/MentorAssessments/${aid}/edit`);
                                    }}
                                  >
                                    <i className="fa-regular fa-pen-to-square text-[#8ec5eb]" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-300 hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      setSelectedIds([aid]);
                                      setShowDeleteConfirm(true);
                                    }}
                                  >
                                    <i className="fa-solid fa-trash" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[#cde2f2]/90">{item.description}</p>
                        </div>
                        <div className="relative z-10 mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              if (aid) router.push(`/mentor/MentorAssessments/${aid}`);
                            }}
                            disabled={!aid}
                            className="rounded-xl bg-[#8ec5eb]/90 px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="text-white">
                <h2 className="mb-8 text-2xl font-semibold text-white">Create – Assessment</h2>

                <form onSubmit={handleCreate} className="space-y-8">
                  <div>
                    <label className="mb-2 block font-medium text-[#cde2f2]">Name of Assessment</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Enter Name of Survey"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-[#cde2f2]">Description</label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Brief Description for Thumbnail"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-medium text-[#cde2f2]">General Instructions for the Assessment</label>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                      >
                        <i className="fa-solid fa-info-circle" /> Instruction
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={formInstructions[0]}
                      onChange={(e) => setFormInstructions([e.target.value])}
                      placeholder="Enter Instructions"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div className={`rounded-xl border border-white/20 p-5 ${glassPanel}`}>
                    <div className="mb-4 flex items-center justify-between">
                      <label className="font-medium text-[#cde2f2]">Sections</label>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                      >
                        <i className="fa-solid fa-plus" /> Add
                      </button>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter Name of Survey"
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                      />
                      <textarea
                        rows={2}
                        placeholder="Enter Guidelines"
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                      />

                      {[
                        "Layer 1",
                        "Layer 2",
                        "Layer 1 - Customized Development Plans",
                        "Layer 2 - Customized Development Plans",
                      ].map((layer, i) => (
                        <div key={i} className="space-y-3 rounded-xl border border-white/15 p-4">
                          <div className="flex items-center justify-between">
                            <label className="font-medium text-[#cde2f2]">{layer}</label>
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                            >
                              <i
                                className={`fa-solid ${layer.includes("Plan") ? "fa-file-alt" : "fa-list"}`}
                              />
                              {layer.includes("Plan") ? "Plan" : "Choice"}
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Choice 1"
                            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block font-medium text-[#cde2f2]">Upload Image</label>
                    <div className="rounded-xl border-2 border-dashed border-white/25 py-10 text-center text-[#cde2f2]">
                      <p>Drag & Drop or Click here to choose file</p>
                      <p className="mt-1 text-xs text-white/50">Max file size: 10MB</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 pt-8">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-white/25 bg-white/10 px-8 py-2.5 font-medium text-white hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-xl bg-[#ffd84e] px-8 py-2.5 font-semibold text-[#062946] disabled:opacity-50"
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-[380px] rounded-2xl border border-white/20 bg-[#0a3558] p-8 text-center shadow-xl">
            <i className="fa-solid fa-trash mb-4 text-3xl text-red-400" />
            <p className="mb-6 font-medium text-white">
              Delete {selectedIds.length} assessment{selectedIds.length === 1 ? "" : "s"}?
            </p>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-white/30 px-6 py-2 font-medium text-[#cde2f2] hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-6 py-2 font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="animate-fade-in fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-white/20 bg-[#0a3558] px-4 py-2 text-sm text-white shadow-lg">
          <i className="fa-solid fa-check text-[#8ec5eb]" />
          {toastMsg}
        </div>
      )}

      {showAssignDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-transparent"
            onClick={() => setShowAssignDrawer(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/15 bg-[#062946] shadow-2xl">
            <div className={`border-b border-white/10 px-6 py-5 ${glassPanel} mx-4 mt-4 rounded-2xl border`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">Assign assessment</h3>
                  <p className="mt-1 text-xs text-[#cde2f2]/80">Choose pastors (mentees) to receive this survey.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignDrawer(false)}
                  className="text-[#8ec5eb] hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-xl" />
                </button>
              </div>
            </div>

            <div className="border-b border-white/10 p-4">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]/70" />
                <input
                  type="search"
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                  placeholder="Search pastors by name or email…"
                  className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/40"
                />
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {assignLoading && (
                <p className="py-8 text-center text-sm text-[#cde2f2]">Loading your mentees…</p>
              )}
              {!assignLoading && filteredAssignUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-[#cde2f2]">
                  No mentees match your search, or none are assigned to you yet.
                </p>
              )}
              {!assignLoading &&
                filteredAssignUsers.map((u: any, idx: number) => {
                  const uid = String(u._id ?? u.id ?? "");
                  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Pastor";
                  const img = u.profilePicture || Mentor1;
                  return (
                    <label
                      key={uid || idx}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignUserIds.includes(uid)}
                        onChange={() => toggleAssignUser(uid)}
                        className="h-5 w-5 accent-[#8ec5eb]"
                      />
                      <Image
                        src={img}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full border border-white/20 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{name}</div>
                        <div className="truncate text-xs text-[#cde2f2]/70">{u.email || u.role || ""}</div>
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="border-t border-white/10 px-6 py-4">
              <p className="mb-3 text-xs text-[#cde2f2]/80">
                {selectedAssignUserIds.length} selected
              </p>
              <button
                type="button"
                disabled={assignSubmitting || selectedAssignUserIds.length === 0}
                onClick={handleAssignSubmit}
                className="w-full rounded-xl bg-[#8ec5eb]/90 py-2.5 font-semibold text-[#062946] hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignSubmitting ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PastorFooter />
    </div>
  );
}
