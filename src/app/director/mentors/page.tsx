"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import PersonListCard from "@/app/Components/PersonListCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import ConfirmModal from "@/app/Components/ConfirmModal";
import ScheduleMeetingModal from "@/app/Components/ScheduleMeetingModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ListMenteesModal from "@/app/Components/ListMenteesModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiCreateAppointment } from "@/app/Services/api";
import {
  extractApiErrorMessage,
  parseSlotStartToIso,
  uiMeetingModeToPlatform,
} from "@/app/Services/appointment-utils";
import { getDirectorUserId } from "@/app/utils/director-auth";

interface Mentor {
  id: string;
  name: string;
  role: string;
  description: string;
  img: any;
  menteeCount: number;
  isFeatured?: boolean;
  lastContact?: string;
  status: string;
  assignedIds: string[];
}

// Helper function to convert User to Mentor (index = stable fallback avatar)
const convertUserToMentor = (user: any, index: number): Mentor => {
  const defaultImages = [Mentor1, Mentor2, Mentor3];

  return {
    id: user.id || user._id,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    description: `${user.role} with ${user.assignedId?.length || 0} assigned mentees`,
    img: user.profilePicture || defaultImages[index % defaultImages.length],
    menteeCount: user.assignedId?.length || 0,
    isFeatured: false,
    lastContact: undefined,
    status: user.status,
    assignedIds: user.assignedId || [],
  };
};

export default function MyMentorsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Mentors");
  const [sortBy, setSortBy] = useState("Least Mentees");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showListMenteesModal, setShowListMenteesModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedQuery]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;

        const base = { search, page: currentPage, limit: PAGE_SIZE };

        const response =
          activeFilter === "All"
            ? await apiGetAllUsers({
                ...base,
                role: "mentor",
                roleMatch: "mixed",
              })
            : activeFilter === "Mentors"
              ? await apiGetAllUsers({
                  ...base,
                  role: "mentor",
                  roleMatch: "exact",
                })
              : activeFilter === "Field Mentor"
                ? await apiGetAllUsers({
                    ...base,
                    role: "field-mentor",
                  })
                : await apiGetAllUsers({
                    ...base,
                    role: "mentor",
                    roleMatch: "mixed",
                  });

        const { users, total, totalPages: tp } = response.data.data;
        setAllMentors(
          users.map((u: any, i: number) => convertUserToMentor(u, i))
        );
        setTotalCount(total);
        setTotalPages(tp);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setAllMentors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [activeFilter, debouncedQuery, currentPage]);

  const featuredMentors = useMemo(() => allMentors.slice(0, 6), [allMentors]);
  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      featuredMentors.map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
      })),
    [featuredMentors]
  );

  const filteredMentors = useMemo(() => {
    const filtered = [...allMentors];

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "Least Mentees":
          return a.menteeCount - b.menteeCount;
        case "Most Mentees":
          return b.menteeCount - a.menteeCount;
        case "Name A-Z":
          return a.name.localeCompare(b.name);
        case "Name Z-A":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allMentors, sortBy]);

  const sortOptions = [
    "Least Mentees",
    "Most Mentees",
    "Name A-Z",
    "Name Z-A",
    "Last Contacted",
  ];

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Mentors", value: "Mentors" },
    { label: "Field Mentor", value: "Field Mentor" },
  ];

  const handleScheduleMeeting = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowScheduleModal(true);
  }, []);

  const handleAssignMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowAssignModal(true);
  }, []);

  const handleRemoveMentee = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRemoveModal(true);
  }, []);

  const handleListMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowListMenteesModal(true);
  }, []);

  const getMentorOptions = (mentor: Mentor) => [
    {
      icon: "fa-solid fa-users",
      label: "List of Mentees",
      color: "text-[#8ec5eb]",
      onClick: () => handleListMentees(mentor),
    },
    {
      icon: "fa-solid fa-user-plus",
      label: "Assign New Mentee",
      color: "text-[#8ec5eb]",
      onClick: () => handleAssignMentees(mentor),
    },
    {
      icon: "fa-solid fa-user-minus",
      label: "Remove a Mentee",
      color: "text-red-400",
      onClick: () => handleRemoveMentee(mentor),
    },
    {
      icon: "fa-regular fa-calendar",
      label: "Schedule an Appointment",
      color: "text-[#8ec5eb]",
      onClick: () => handleScheduleMeeting(mentor),
    },
    {
      icon: "fa-regular fa-pen-to-square",
      label: "Edit Profile",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(`/director/mentors/profile/edit?id=${mentor.id}`),
    },
  ];

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentors"
        subtitle="Manage mentors and mentee assignments."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentors" },
        ]}
      />

      {/* Search and Featured Mentors Section */}
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
          </div>

          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars
              items={featuredItems}
              showDivider
              className="mb-2"
              selectedId={selectedMentor?.id ?? null}
              onItemClick={(item) => {
                const m = allMentors.find(
                  (x) => String(x.id) === String(item.id)
                );
                if (!m) return;
                setSelectedMentor((prev) => (prev?.id === m.id ? null : m));
              }}
            />
          )}
        </div>
      </section>

      {/* Filters and Sort Section */}
      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          {/* Filter Tabs */}
          <div
            className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeFilter === option.value
                  ? "bg-[#8ec5eb]/25 text-white shadow-sm ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 lg:shrink-0">
            <span className="text-[14px] font-semibold whitespace-nowrap text-white sm:text-[15px]">
              Sort By
            </span>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex min-w-[160px] w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:w-auto sm:min-w-[180px] sm:text-[14px]"
              >
                <span className="truncate">{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 px-1 shadow-2xl backdrop-blur-md">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
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

      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
              <p className="text-lg font-medium text-white">Loading mentors…</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa-solid fa-users mb-4 text-5xl text-white/40" />
              <p className="text-lg font-medium text-white">No mentors found</p>
              <p className="mt-2 text-sm text-white/60">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
              {filteredMentors.map((mentor) => (
                <PersonListCard
                  key={mentor.id}
                  id={mentor.id}
                  name={mentor.name}
                  role={mentor.role}
                  description={mentor.description}
                  image={mentor.img}
                  variant="glass"
                  profileLink={`/director/mentors/profile/${mentor.id}`}
                  menteeCount={mentor.menteeCount}
                  optionsMenu={getMentorOptions(mentor)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-white/70 text-sm">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
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
                      <span key={`ellipsis-${idx}`} className="text-white/60 px-1">…</span>
                    ) : (
                      <button
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={async (data) => {
          const directorId = getDirectorUserId();
          if (!directorId) {
            setToast({ message: "Session expired. Please sign in again.", type: "error" });
            setTimeout(() => setToast(null), 4000);
            throw new Error("No session");
          }
          if (!selectedMentor) {
            setToast({ message: "No mentor selected.", type: "error" });
            setTimeout(() => setToast(null), 4000);
            throw new Error("No mentor");
          }
          try {
            const meetingDate = parseSlotStartToIso(
              data.dateYmd,
              data.timeSlot.replace(/\u2013/g, "-")
            );
            await apiCreateAppointment({
              userId: directorId,
              mentorId: selectedMentor.id,
              meetingDate,
              platform: uiMeetingModeToPlatform(data.meetingOption),
              notes: data.notes || "Scheduled from Director Mentors",
            });
            setToast({ message: "Meeting scheduled successfully", type: "success" });
            setTimeout(() => setToast(null), 3000);
          } catch (e) {
            setToast({
              message: extractApiErrorMessage(e) || "Failed to schedule meeting",
              type: "error",
            });
            setTimeout(() => setToast(null), 4000);
            throw e;
          }
        }}
        mentor={
          selectedMentor
            ? {
                id: selectedMentor.id,
                name: selectedMentor.name,
                img: selectedMentor.img,
                menteeCount: selectedMentor.menteeCount,
              }
            : null
        }
      />

      {/* Assign Mentees Modal */}
      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={(message) => {
          setToast({ message, type: 'success' });
          setTimeout(() => setToast(null), 3000);
          // Refresh the mentors list to show updated assigned counts
          const fetchMentors = async () => {
            try {
              const search =
                debouncedQuery.length > 0 ? debouncedQuery : undefined;
              const base = {
                search,
                page: currentPage,
                limit: PAGE_SIZE,
              };
              const response =
                activeFilter === "All"
                  ? await apiGetAllUsers({
                      ...base,
                      role: "mentor",
                      roleMatch: "mixed",
                    })
                  : activeFilter === "Mentors"
                    ? await apiGetAllUsers({
                        ...base,
                        role: "mentor",
                        roleMatch: "exact",
                      })
                    : activeFilter === "Field Mentor"
                      ? await apiGetAllUsers({
                          ...base,
                          role: "field-mentor",
                        })
                      : await apiGetAllUsers({
                          ...base,
                          role: "mentor",
                          roleMatch: "mixed",
                        });
              const { users, total, totalPages: tp } = response.data.data;
              setAllMentors(
                users.map((u: any, i: number) => convertUserToMentor(u, i))
              );
              setTotalCount(total);
              setTotalPages(tp);
            } catch (error) {
              console.error("Error refreshing mentors:", error);
            }
          };
          fetchMentors();
        }}
        onError={(message) => {
          setToast({ message, type: 'error' });
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={selectedMentor ? {
          name: selectedMentor.name,
          id: selectedMentor.id,
          assignedIds: selectedMentor.assignedIds
        } : undefined}
      />

      {/* Remove Mentee Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => {
          setToast({ message: "Mentee Removed Successfully", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
        title="Remove a Mentee"
        message={`Remove a mentee from ${selectedMentor?.name}. This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-solid fa-user-minus"
        iconColor="text-red-500 bg-red-100"
      />

      {/* List Mentees Modal */}
      <ListMenteesModal
        isOpen={showListMenteesModal}
        onClose={() => setShowListMenteesModal(false)}
        mentorId={selectedMentor?.id || null}
        mentorName={selectedMentor?.name || null}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-6 z-[100] animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#041f35]/95 px-6 py-4 shadow-2xl backdrop-blur-md">
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400'} text-xl`}></i>
            <span className="text-[15px] font-semibold text-white">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
}
