"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../directorUi";
import AssessmentBg from "../../Assets/assessment-bg.png";
import Thumb1 from "../../Assets/thumb1.png";
import Thumb2 from "../../Assets/thumb2.png";
import Mentor1 from "../../Assets/mentor1.png";
import { User } from "@/app/Services/types";
import {
  apiDeleteAssessments,
  apiGetAssessments,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiAssignAssessment } from "@/app/Services/progress.service";

const mapUserToAssignUser = (user: any) => ({
  id: user.id ?? user._id,
  name: `${user.firstName} ${user.lastName}`,
  role: user.role,
  avatar: user.profilePicture || Mentor1,
});

export default function AssessmentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);

        const res = await apiGetAssessments({
          search: searchQuery || undefined,
        });

        const list = parseAssessmentsListPayload(res.data);
        const mapped: any[] = list.map((item: any) => ({
          id: item._id,
          title: item.name,
          description: item.description,
          image: item.bannerImage || Thumb1,
          type: item.type,
        }));

        setAssessments(mapped);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
        setAssessments([]);
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [searchQuery]);

  useEffect(() => {
    if (!showAssignModal) return;

    const fetchPastors = async () => {
      try {
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          search: userSearch || undefined,
          page: 1,
          limit: 20,
        });

        setUsers(
          res.data.data.users.map(mapUserToAssignUser)
        );
      } catch (err) {
        console.error("Failed to fetch pastors", err);
        setUsers([]);
      }
    };

    fetchPastors();
  }, [showAssignModal, userSearch]);


  const handleSelectAssessment = (id: string) => {
    setSelectedAssessments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedAssessments(
      selectedAssessments.length === assessments.length
        ? []
        : assessments.map((a) => a.id)
    );
  };

  const handleSelectMode = () => {
    setIsSelectionMode(true);
    setSelectedAssessments([]);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssessments([]);
  };

  const handleAssign = async () => {
    if (!selectedUsers.length || !selectedAssessments.length) {
      setToast("Select at least one user and one assessment");
      return;
    }

    try {
      setLoading(true);

      await apiAssignAssessment({
        userIds: selectedUsers,
        assessmentIds: selectedAssessments,
      });

      setShowAssignModal(false);
      setIsSelectionMode(false);
      setSelectedUsers([]);
      setSelectedAssessments([]);

      setToast("Assessment assigned successfully");
    } catch (error) {
      console.error("Assignment failed", error);
      setToast("Failed to assign assessment");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };


  const handleDelete = async () => {
    if (!selectedAssessments.length) return;

    try {
      setLoading(true);

      await apiDeleteAssessments(selectedAssessments);

      setAssessments(prev =>
        prev.filter(a => !selectedAssessments.includes(a.id))
      );

      setToast(`${selectedAssessments.length} assessment(s) deleted`);
      setShowDeleteModal(false);
      setIsSelectionMode(false);
      setSelectedAssessments([]);
    } catch (err) {
      console.error(err);
      setToast('Failed to delete assessments');
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredAssessments = assessments.filter((assessment) =>
    assessment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
    };

    if (showOptionsMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero title="Assessments" subtitle="Create and assign assessments to pastors." image={AssessmentBg} />

      <section className="relative py-8">
        <div className="mx-auto max-w-[1400px]">
          <div className={`mb-8 flex flex-col items-center justify-between gap-4 md:flex-row ${directorGlassCard} p-5`}>
            <div className="relative w-full max-w-md flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${directorInputClass} pl-11`}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!isSelectionMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleSelectMode}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-check-square"></i>
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/director/assessments/create")}
                    className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-[#8ec5eb]/25"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-[#8ec5eb]/25"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Assigned to
                </button>
              )}
            </div>
          </div>

          {isSelectionMode && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-white">
                  {selectedAssessments.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
                >
                  Select All
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedAssessments.length === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          {/* Assessments Grid */}
          {loadingAssessments ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#8ec5eb]" />
                <p className="text-white font-semibold">Loading assessments...</p>
              </div>
            </div>
          ) : filteredAssessments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`relative rounded-xl border border-white/10 transition-all ${directorGlassCard} ${selectedAssessments.includes(assessment.id)
                    ? "ring-2 ring-[#8ec5eb]/60"
                    : ""
                    }`}
                >
                  {/* Checkbox for selection mode */}
                  {isSelectionMode && (
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={() => handleSelectAssessment(assessment.id)}
                        className="h-5 w-5 cursor-pointer rounded accent-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/50"
                      />
                    </div>
                  )}

                  {/* Three dots menu */}
                  {!isSelectionMode && (
                    <div className="absolute top-4 right-4 z-[60] options-menu-container">
                      <button
                        onClick={() =>
                          setShowOptionsMenu(
                            showOptionsMenu === assessment.id
                              ? null
                              : assessment.id
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                      {showOptionsMenu === assessment.id && (
                        <div className="absolute right-0 z-[200] mt-2 w-48 animate-slide-down rounded-lg border border-white/15 bg-[#041f35]/98 py-2 shadow-xl backdrop-blur-md">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAssignModal(true);
                              setShowOptionsMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                          >
                            <i className="fa-solid fa-user-plus text-[#8ec5eb]"></i>
                            Assign to
                          </button>
                          <button type="button" className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10">
                            <i className="fa-solid fa-pen text-[#8ec5eb]"></i>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssessments([assessment.id]);
                              setShowDeleteModal(true);
                              setShowOptionsMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-300 hover:bg-red-500/10"
                          >
                            <i className="fa-solid fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 p-6">
                    {/* Assessment Image */}
                    <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden relative">
                      <Image
                        src={assessment.image || Thumb1}
                        alt={assessment.title}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Assessment Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-white">
                          {assessment.title}
                        </h3>
                        <p className="text-sm text-white/65">
                          {assessment.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/director/assessments/${assessment.id}`)
                        }
                        className="mt-4 self-end rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                      >
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-white text-4xl"></i>
              </div>
              <p className="text-white text-lg">No assessments found</p>
            </div>
          )}
        </div>
      </section>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-left">
            {/* Header */}
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Assigned to</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg"
              >
                <i className="fa-solid fa-xmark text-xl text-gray-600"></i>
              </button>
            </div>

            {/* Search */}
            <div className="p-6 border-b">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full rounded-lg border border-white/20 bg-white/10 py-3 pl-12 pr-4 text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/40"
                />
              </div>
            </div>

            {/* User List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="w-5 h-5 text-[#2E3B8E] rounded focus:ring-2 focus:ring-[#2E3B8E]"
                    />
                    <Image
                      src={Mentor1}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-600">{user.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t">
              <div className="text-sm text-gray-600 mb-4">
                Who Am I Do You Why Doe and 3 Others
              </div>
              <button
                onClick={handleAssign}
                disabled={selectedUsers.length === 0}
                className="w-full px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-trash text-red-600 text-2xl"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Are you sure want to
            </h3>
            <h3 className="text-xl font-bold text-center text-red-600 mb-6">
              Delete ! Assignments ?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[70] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-gray-800 font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
