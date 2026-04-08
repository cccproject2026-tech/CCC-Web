"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import PersonListCard from "@/app/Components/PersonListCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import AssignMentorModal, { Mentor } from "@/app/Components/AssignMentorModal";
import RemoveMentorModal from "@/app/Components/RemoveMentorModal";

import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

import {
  apiAssignUsers,
  apiGetAllUsers,
  apiGetAssignedUsers,
} from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";

export interface Mentee {
  id: string;
  name: string;
  role?: string;
  description: string;
  img: any;
  status: "active" | "completed" | "pending";
  progress?: number;
  phase?: string;
  assignedId: string[];
  assignedLoaded: boolean;
}

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

const mapUserToMentee = (user: any, index: number): Mentee => ({
  id: user.id ?? user._id,
  name: `${user.firstName} ${user.lastName}`,
  role: user.role,
  description: `${user.role} enrolled in mentoring program`,
  img: user.profilePicture || IMAGE_POOL[index % IMAGE_POOL.length],
  status: user.hasCompleted
    ? "completed"
    : user.status === "pending"
      ? "pending"
      : "active",
  progress: user.progressPercentage ?? 0,
  phase: user.currentPhase ?? undefined,
  assignedId: [],
  assignedLoaded: false,
});

export default function MenteesPage() {
  const router = useRouter();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "active"
  );
  const [sortBy, setSortBy] = useState("Phase");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);

  /* ---------------- LOAD ASSIGNED USERS ---------------- */

  const loadAssignedUsers = async (menteeId: string) => {
    const res = await apiGetAssignedUsers(menteeId);

    const assignedIds = res.data.data.map(
      (u: any) => u.id ?? u._id
    );

    setMentees((prev) =>
      prev.map((m) =>
        m.id === menteeId
          ? { ...m, assignedId: assignedIds, assignedLoaded: true }
          : m
      )
    );
  };

  /* ---------------- SEARCH DEBOUNCE ---------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  /* ---------------- FETCH MENTEES ---------------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    const fetchMentees = async () => {
      setLoading(true);
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;
        const params: Record<string, unknown> = {
          role: "pastor",
          roleMatch: "mixed",
          search,
          page: currentPage,
          limit: PAGE_SIZE,
        };

        if (activeTab === "active") {
          params.hasCompleted = false;
          params.status = "accepted";
        } else if (activeTab === "completed") {
          params.hasCompleted = true;
        }

        const res = await apiGetAllUsers(params as any);
        const { users, total, totalPages: tp } = res.data.data;
        setMentees(users.map((u: any, i: number) => mapUserToMentee(u, i)));
        setTotalCount(total);
        setTotalPages(tp);
      } catch (e) {
        console.error("Failed to load mentees", e);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentees();
  }, [debouncedQuery, currentPage, activeTab]);

  /* ---------------- PROGRESS ---------------- */

  // Stable key: changes whenever the set of users on the current page changes
  const menteeIdsKey = mentees.map((m) => m.id).join(",");

  useEffect(() => {
    if (!mentees.length) return;

    let cancelled = false;

    const hydrateProgress = async () => {
      // snapshot the current page's users so page changes mid-fetch stop cleanly
      const currentMentees = mentees.slice();
      for (const m of currentMentees) {
        if (cancelled) break;
        try {
          const res = await apiGetUserProgress(m.id);
          const progress = res.data.data?.overallProgress ?? 0;
          const completed = res.data.data?.overallCompleted ?? false;
          setMentees((prev) =>
            prev.map((item) =>
              item.id === m.id
                ? { ...item, progress, status: completed ? "completed" : item.status }
                : item
            )
          );
        } catch {
          // skip failed individual progress fetch
        }
        await new Promise((r) => setTimeout(r, 150));
      }
    };

    hydrateProgress();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menteeIdsKey]);

  /* ---------------- FETCH MENTORS ---------------- */

  useEffect(() => {
    const fetchMentors = async () => {
      const res = await apiGetAllUsers({
        role: "mentor",
        roleMatch: "exact",
      });

      setMentors(
        res.data.data.users.map((u: any, i: number): Mentor => ({
          id: u.id ?? u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          menteeCount: u.assignedId?.length ?? 0,
          img: u.profilePicture || IMAGE_POOL[i % IMAGE_POOL.length],
          loginDate: u.lastLogin
            ? new Date(u.lastLogin).toLocaleDateString()
            : "Not Started yet",
        }))
      );
    };

    fetchMentors();
  }, []);

  /* ---------------- ASSIGN ---------------- */

  const handleAssignMentors = async (newMentorIds: string[]) => {
    if (!selectedMentee) return;

    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee) return;

    const merged = Array.from(
      new Set([...mentee.assignedId, ...newMentorIds])
    );

    await apiAssignUsers(selectedMentee, merged);

    setMentees((prev) =>
      prev.map((m) =>
        m.id === selectedMentee
          ? { ...m, assignedId: merged }
          : m
      )
    );

    setShowAssignModal(false);
    setToast("Mentors assigned successfully");
  };

  /* ---------------- MARK COMPLETE ---------------- */

  const handleMarkComplete = () => setToast("Marked as complete");

  /* ---------------- REMOVE ---------------- */

  const handleRemoveMentors = async (mentorIdsToRemove: string[]) => {
    if (!selectedMentee) return;

    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee?.assignedLoaded) return;

    const updated = mentee.assignedId.filter(
      (id) => !mentorIdsToRemove.includes(id)
    );

    await apiAssignUsers(selectedMentee, updated);

    setMentees((prev) =>
      prev.map((m) =>
        m.id === selectedMentee
          ? { ...m, assignedId: updated }
          : m
      )
    );

    setShowRemoveModal(false);
    setToast("Mentors removed successfully");
  };

  /* ---------------- DERIVED ---------------- */

  const assignedMentors = useMemo(() => {
    if (!selectedMentee) return [];
    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee?.assignedLoaded) return [];
    return mentors.filter((mentor) =>
      mentee.assignedId.includes(mentor.id)
    );
  }, [selectedMentee, mentees, mentors]);

  const sortedMentees = useMemo(() => {
    const arr = [...mentees];
    switch (sortBy) {
      case "Name A-Z":
        return arr.sort((a, b) => a.name.localeCompare(b.name));
      case "Name Z-A":
        return arr.sort((a, b) => b.name.localeCompare(a.name));
      case "Progress":
        return arr.sort(
          (a, b) => (a.progress ?? 0) - (b.progress ?? 0)
        );
      case "Phase":
      default:
        return arr.sort((a, b) =>
          (a.phase ?? "\uFFFF").localeCompare(b.phase ?? "\uFFFF")
        );
    }
  }, [mentees, sortBy]);

  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      mentees.slice(0, 6).map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
      })),
    [mentees]
  );

  const getMenteeOptions = (menteeId: string) => [
    {
      icon: "fa-solid fa-route",
      label: "Revitalization Roadmap",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/pastor-assignments?assignUser=${encodeURIComponent(menteeId)}`
        ),
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/assessments?assignUser=${encodeURIComponent(menteeId)}`
        ),
    },
    {
      icon: "fa-regular fa-note-sticky",
      label: "Mentor Notes",
      color: "text-[#8ec5eb]",
      onClick: () => setToast("Opening Notes..."),
    },
    // {
    //   icon: "fa-solid fa-chart-line",
    //   label: "Track Progress",
    //   color: "text-red-500",
    //   onClick: handleTrackProgress,
    // },
    {
      icon: "fa-solid fa-user-plus",
      label: "Assign New Mentor",
      color: "text-[#8ec5eb]",
      onClick: () => {
        setSelectedMentee(menteeId);
        setShowAssignModal(true);
      },
    },
    {
      icon: "fa-solid fa-user-minus",
      label: "Remove a Mentor",
      color: "text-red-400",
      onClick: async () => {
        setSelectedMentee(menteeId);
        await loadAssignedUsers(menteeId);
        setShowRemoveModal(true);
      },
    },
  ];

  const activeCount = mentees.filter((m) => m.status === "active").length;
  const sortOptions = ["Phase", "Name A-Z", "Name Z-A", "Progress"];

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentees"
        subtitle="Pastors and leaders in your network."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentees" },
        ]}
      />

      {/* Search + Featured */}
      <section className="relative py-4 md:py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 w-full sm:max-w-[min(420px,100%)]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by name or email…"
                className="w-full"
                variant="dark"
              />
            </div>
            <div className="flex shrink-0 justify-end gap-2 sm:pl-2">
              <button
                type="button"
                onClick={() => router.push("/director/mentees/location")}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15"
                aria-label="Map view"
              >
                <i className="fa-solid fa-location-dot" />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15"
                aria-label="List view"
              >
                <i className="fa-solid fa-list" />
              </button>
            </div>
          </div>

          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars items={featuredItems} showDivider className="mb-2" />
          )}
        </div>
      </section>

      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "all"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "active"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              <span>In-Progress</span>
              {activeTab === "active" && activeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "completed"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              Completed
            </button>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 lg:shrink-0">
            <span className="text-[14px] font-semibold whitespace-nowrap text-white sm:text-[15px]">
              Sort By
            </span>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex w-full min-w-[160px] items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:min-w-[180px] sm:text-[14px]"
              >
                <span className="truncate">{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-[10px]" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 px-1 shadow-2xl backdrop-blur-md">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[13px] transition-all sm:text-[14px] ${sortBy === option
                        ? "bg-[#8ec5eb]/20 font-semibold text-white"
                        : "text-white/80 hover:bg-white/10"
                        }`}
                    >
                      <span
                        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 ${sortBy === option
                          ? "border-[#8ec5eb] bg-[#8ec5eb]/40"
                          : "border-white/30"
                          }`}
                      >
                        {sortBy === option && (
                          <i className="fa-solid fa-check text-[9px] text-white"></i>
                        )}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
            <p className="text-lg font-medium text-white">Loading mentees…</p>
          </div>
        ) : sortedMentees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa-solid fa-user-group mb-4 text-5xl text-white/40" />
            <p className="text-lg font-medium text-white">No mentees found</p>
            <p className="mt-2 text-sm text-white/60">
              Try another search or tab.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
          {sortedMentees.map((m) => (
            <PersonListCard
              key={m.id}
              id={m.id}
              name={m.name}
              role={m.role}
              description={m.description}
              image={m.img}
              variant="glass"
              profileLink={`/director/mentees/profile?id=${m.id}`}
              progress={
                m.progress !== undefined
                  ? { phase: m.phase, value: m.progress }
                  : undefined
              }
              optionsMenu={getMenteeOptions(m.id)}
              actionButton={
                activeTab === "active" && m.progress === 100
                  ? { text: "Mark as Complete", onClick: handleMarkComplete }
                  : undefined
              }
            />
          ))}
        </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/70">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-white/60">…</span>
                  ) : (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                        currentPage === item
                          ? "bg-[#8ec5eb]/30 text-white shadow ring-1 ring-[#8ec5eb]/40"
                          : "border border-white/15 bg-white/10 text-[#8ec5eb] hover:bg-white/15"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          </div>
        )}
        </div>
      </section>

      <AssignMentorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignMentors}
        mentors={mentors}
      />

      <RemoveMentorModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveMentors}
        mentors={assignedMentors}
      />

      {(showSortMenu) && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
}
