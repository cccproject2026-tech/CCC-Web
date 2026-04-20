"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorListCardRadius,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
  directorToastClass,
} from "../directorUi";
import { DirectorFilterSection, DirectorSlideOver } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
import AssessmentBg from "../../Assets/assessment-bg.png";
import Thumb1 from "../../Assets/thumb1.png";
import Mentor1 from "../../Assets/mentor1.png";
import {
  apiDeleteAssessments,
  apiGetAssessments,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiAssignAssessment, apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { emitPastorAssignmentsChanged } from "@/app/utils/progress-sync";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
    const msg = data?.message ?? data?.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length && typeof msg[0] === "string") return msg[0];
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

type AssignUserRow = {
  id: string;
  name: string;
  role?: string;
  avatar: string | typeof Mentor1;
};

const mapUserToAssignUser = (user: any): AssignUserRow => ({
  id: String(user.id ?? user._id ?? ""),
  name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
  role: user.role,
  avatar: user.profilePicture || Mentor1,
});

function AssessmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignUserFromQuery = searchParams.get("assignUser");
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
  const [users, setUsers] = useState<AssignUserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const lastAssignBootstrap = useRef<string | null>(null);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);
        setListError(null);

        const res = await apiGetAssessments({
          search: searchQuery || undefined,
        });

        const body = res?.data;
        const list = parseAssessmentsListPayload(body);
        const mapped: any[] = [];
        for (const item of list) {
          const rawItem = item as Record<string, unknown>;
          const rawId = rawItem._id ?? rawItem.id;
          const id = rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";
          if (!id) continue;

          const raw = rawItem.bannerImage;
          const resolved =
            (typeof raw === "string" ? resolveApiMediaUrl(raw) ?? raw : null) || Thumb1;
          const titleRaw =
            (typeof rawItem.name === "string" && rawItem.name.trim() ? rawItem.name : null) ??
            (typeof rawItem.title === "string" && rawItem.title.trim() ? rawItem.title : null);
          mapped.push({
            id,
            title: titleRaw ?? "Untitled",
            description: typeof rawItem.description === "string" ? rawItem.description : "",
            image: resolved,
            type: rawItem.type,
          });
        }

        if (assignUserFromQuery) {
          try {
            const progRes = await apiGetUserProgress(assignUserFromQuery);
            const pr = unwrapProgressData(progRes);
            const rows = pr?.assessments ?? [];
            const allowed = new Set<string>();
            for (const row of rows) {
              const aid = (row as { assessmentId?: string }).assessmentId;
              if (aid != null && String(aid).trim() !== "") {
                allowed.add(String(aid).trim());
              }
            }
            if (allowed.size === 0) {
              setAssessments([]);
            } else {
              setAssessments(mapped.filter((a) => allowed.has(String(a.id))));
            }
          } catch (e) {
            console.error("Failed to load pastor assessment assignments", e);
            setAssessments([]);
          }
        } else {
          setAssessments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch assessments", error);
        setAssessments([]);
        setListError(getApiErrorMessage(error, "Could not load assessments. Check your connection and try again."));
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [searchQuery, assignUserFromQuery]);

  useEffect(() => {
    if (!assignUserFromQuery) return;
    if (lastAssignBootstrap.current === assignUserFromQuery) return;
    lastAssignBootstrap.current = assignUserFromQuery;
    setSelectedUsers([assignUserFromQuery]);
    setIsSelectionMode(true);
    setToast("Select assessments, then tap Assigned to.");
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [assignUserFromQuery]);

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

        const inner = res?.data?.data;
        let listUsers: unknown[] = [];
        if (inner && typeof inner === "object") {
          const o = inner as Record<string, unknown>;
          if (Array.isArray(o.users)) listUsers = o.users;
          else if (Array.isArray(o.rows)) listUsers = o.rows;
        }
        setUsers(listUsers.map(mapUserToAssignUser).filter((u) => u.id));
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
    const userIds = selectedUsers.map(String).filter(Boolean);
    const assessmentIds = selectedAssessments.map(String).filter(Boolean);
    if (!userIds.length || !assessmentIds.length) {
      setToast("Select at least one user and one assessment");
      return;
    }

    try {
      setLoading(true);

      for (const assessmentId of assessmentIds) {
        await apiAssignAssessment({
          userIds,
          assessmentIds: [assessmentId],
        });
      }

      emitPastorAssignmentsChanged(userIds);

      setShowAssignModal(false);
      setIsSelectionMode(false);
      setSelectedUsers([]);
      setSelectedAssessments([]);

      setToast("Assessment assigned successfully");
    } catch (error) {
      console.error("Assignment failed", error);
      setToast(getApiErrorMessage(error, "Failed to assign assessment"));
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssessments.length) return;

    try {
      setLoading(true);

      await apiDeleteAssessments(selectedAssessments);

      setAssessments((prev) => prev.filter((a) => !selectedAssessments.includes(a.id)));

      setToast(`${selectedAssessments.length} assessment(s) deleted`);
      setShowDeleteModal(false);
      setIsSelectionMode(false);
      setSelectedAssessments([]);
    } catch (err) {
      console.error(err);
      setToast("Failed to delete assessments");
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
    String(assessment.title ?? "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

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
      <DirectorHero
        title="Assessments"
        subtitle={
          assignUserFromQuery
            ? "Assessments assigned to this pastor."
            : "Create, edit, and assign assessments to pastors."
        }
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments" },
        ]}
      />

      <section className="relative py-8">
        <div className={directorPageContainer}>
          <DirectorFilterSection>
            <div className="relative w-full flex-1 md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search assessments…"
                variant="dark"
                className="w-full"
              />
              {listError ? (
                <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                  {listError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {!isSelectionMode ? (
                <>
                  <button type="button" onClick={handleSelectMode} className={directorBtnSecondary}>
                    <i className="fa-solid fa-check-square"></i>
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/director/assessments/create")}
                    className={directorBtnPrimary}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAssessments.length === 0) {
                      setToast("Select at least one assessment first.");
                      setTimeout(() => setToast(null), 3500);
                      return;
                    }
                    setShowAssignModal(true);
                  }}
                  className={directorBtnPrimary}
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Assigned to
                </button>
              )}
            </div>
          </DirectorFilterSection>

          {isSelectionMode && (
            <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-5 ${directorGlassCard}`}>
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

          {loadingAssessments ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className={directorSpinner} />
                <p className="font-semibold text-white">Loading assessments…</p>
              </div>
            </div>
          ) : filteredAssessments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`relative ${directorListCardRadius} border border-white/10 transition-all ${directorGlassCard} ${
                    selectedAssessments.includes(assessment.id) ? "ring-2 ring-[#8ec5eb]/60" : ""
                  }`}
                >
                  {isSelectionMode && (
                    <div className="absolute left-4 top-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={() => handleSelectAssessment(assessment.id)}
                        className="h-5 w-5 cursor-pointer rounded accent-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/50"
                      />
                    </div>
                  )}

                  {!isSelectionMode && (
                    <div className="options-menu-container absolute right-4 top-4 z-[60]">
                      <button
                        type="button"
                        onClick={() =>
                          setShowOptionsMenu(
                            showOptionsMenu === assessment.id ? null : assessment.id
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
                              setSelectedAssessments([assessment.id]);
                              setShowAssignModal(true);
                              setShowOptionsMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                          >
                            <i className="fa-solid fa-user-plus text-[#8ec5eb]"></i>
                            Assign to
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOptionsMenu(null);
                              router.push(`/director/assessments/${assessment.id}`);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                          >
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
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                      <Image
                        src={assessment.image || Thumb1}
                        alt={assessment.title}
                        fill
                        className="object-cover"
                        unoptimized={
                          typeof assessment.image === "string" &&
                          (assessment.image.startsWith("blob:") || isRemoteImageSrc(assessment.image))
                        }
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-white">{assessment.title}</h3>
                        <p className="text-sm text-white/65">{assessment.description}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/director/assessments/${assessment.id}`)}
                        className="mt-4 self-end rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                      >
                        View / edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`mx-auto max-w-md px-8 py-14 text-center ${directorGlassCard}`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <i className="fa-regular fa-folder-open text-2xl text-[#8ec5eb]" />
              </div>
              <p className="text-lg font-semibold text-white">
                {assignUserFromQuery
                  ? "No assessments assigned to this pastor."
                  : "No assessments found"}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {assignUserFromQuery
                  ? "Assign assessments from the full list when needed."
                  : "Try another search or create an assessment with Add."}
              </p>
            </div>
          )}
        </div>
      </section>

      <DirectorSlideOver
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign to"
        footer={
          <div>
            <p className="mb-3 text-center text-sm text-gray-600">
              {selectedUsers.length === 0
                ? "Select one or more pastors."
                : `${selectedUsers.length} pastor${selectedUsers.length === 1 ? "" : "s"} selected`}
            </p>
            <button
              type="button"
              onClick={handleAssign}
              disabled={selectedUsers.length === 0 || loading}
              className="w-full rounded-lg bg-[#2E3B8E] px-6 py-3 font-semibold text-white transition hover:bg-[#1F2A6E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Assigning…" : "Assign"}
            </button>
          </div>
        }
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <SearchBar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="Search pastors…"
            variant="light"
            className="w-full"
          />
        </div>
        <div className="px-6 py-4">
          <div className="space-y-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  className="h-5 w-5 rounded text-[#2E3B8E] focus:ring-2 focus:ring-[#2E3B8E]"
                />
                <Image
                  src={user.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  unoptimized={typeof user.avatar === "string" && isRemoteImageSrc(user.avatar)}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="truncate text-sm text-gray-600">{user.role}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </DirectorSlideOver>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete assessments?"
        message="The selected assessments will be removed. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        icon="fa-solid fa-trash"
        iconColor="text-red-600 bg-red-50"
        confirmColor="bg-[#2E3B8E] hover:bg-[#1F2A6E]"
        pendingConfirmText="Deleting…"
      />

      {toast && (
        <div className="fixed right-6 top-6 z-[110] animate-fade-in">
          <div className={directorToastClass}>
            <i className="fa-solid fa-circle-check text-xl text-green-500" />
            <span className="font-semibold text-gray-800">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessmentsClient() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <div className={directorSpinner} />
            <p className="font-semibold text-white">Loading…</p>
          </div>
        </div>
      }
    >
      <AssessmentsPageContent />
    </Suspense>
  );
}
