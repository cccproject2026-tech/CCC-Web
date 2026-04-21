"use client";
import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../DirectorHero";
import {
  directorGlassCard,
  directorGlassCardHover,
  directorPageRoot,
} from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import ScheduleMeetingModal from "@/app/Components/ScheduleMeetingModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ListMenteesModal from "@/app/Components/ListMenteesModal";
import RemoveMenteesModal from "@/app/Components/RemoveMenteesModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { isRemoteImageSrc } from "@/app/utils/image";

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

const optionsMenuItems = [
  {
    icon: "fa-solid fa-users",
    label: "List of Mentees",
    color: "text-[#8ec5eb]",
  },
  {
    icon: "fa-solid fa-user-plus",
    label: "Assign New Mentee",
    color: "text-[#8ec5eb]",
  },
  {
    icon: "fa-solid fa-user-minus",
    label: "Remove a Mentee",
    color: "text-[#8ec5eb]",
  },
  {
    icon: "fa-regular fa-calendar",
    label: "Schedule an Appointment",
    color: "text-[#8ec5eb]",
  },
  {
    icon: "fa-regular fa-pen-to-square",
    label: "Edit Profile",
    color: "text-[#8ec5eb]",
  },
  // {
  //   icon: "fa-solid fa-times-circle",
  //   label: "Remove as Field Mentor",
  //   color: "text-[#2E3B8E]",
  // },
];

// Memoized Grid Card Component
const MentorGridCard = memo(({
  mentor,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
  onViewProfile,
}: {
  mentor: Mentor;
  isMenuOpen: boolean;
  onToggleMenu: (mentorId: string) => void;
  onMenuAction: (action: string, mentor: Mentor) => void;
  onViewProfile: (mentorId: string) => void;
}) => {
  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border border-white/15 ${directorGlassCard} ${directorGlassCardHover}`}
    >
      <div className="relative aspect-[4/5] max-h-[280px] min-h-[200px] w-full bg-white/5">
        <Image
          src={mentor.img}
          alt={mentor.name}
          fill
          unoptimized={isRemoteImageSrc(mentor.img)}
          style={{ objectFit: "cover" }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          quality={85}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062946]/60 to-transparent" />

        <div className="absolute right-2 top-2 z-[50]">
          <div className="relative" data-mentor-menu="true">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(mentor.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-[#062946]/85 text-white backdrop-blur-sm transition hover:bg-[#062946]"
            >
              <i className="fa-solid fa-ellipsis-vertical text-sm" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 min-w-[240px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 pl-1 pr-1 shadow-2xl backdrop-blur-md">
                {optionsMenuItems.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuAction(item.label, mentor);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[13px] text-white/90 transition hover:bg-white/10"
                  >
                    <i className={`${item.icon} ${item.color} w-5 text-base`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="mb-0.5 line-clamp-2 text-base font-semibold text-white sm:text-[17px]">
              {mentor.name}
            </h3>
            <p className="line-clamp-1 text-[13px] capitalize text-white/65">
              {mentor.role}
            </p>
          </div>
          <span className="ml-2 shrink-0 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-[#cde2f2]">
            {mentor.menteeCount} Mentees
          </span>
        </div>
        <p className="mb-4 line-clamp-2 text-[12px] leading-relaxed text-white/50">
          {mentor.description}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/10 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-[#8ec5eb] sm:gap-3">
            <button type="button" className="transition hover:opacity-80" aria-label="Email">
              <i className="fa-regular fa-envelope text-base sm:text-[17px]" />
            </button>
            <button type="button" className="transition hover:opacity-80" aria-label="Message">
              <i className="fa-regular fa-comment text-base sm:text-[17px]" />
            </button>
            <button type="button" className="transition hover:opacity-80" aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp text-base sm:text-[17px]" />
            </button>
            <button type="button" className="transition hover:opacity-80" aria-label="Call">
              <i className="fa-solid fa-phone text-base sm:text-[17px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onViewProfile(mentor.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/10 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/20"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
});

MentorGridCard.displayName = "MentorGridCard";

// Memoized List Card Component
const MentorListCard = memo(({
  mentor,
  isMenuOpen,
  onToggleMenu,
  onMenuAction,
  onViewProfile,
}: {
  mentor: Mentor;
  isMenuOpen: boolean;
  onToggleMenu: (mentorId: string) => void;
  onMenuAction: (action: string, mentor: Mentor) => void;
  onViewProfile: (mentorId: string) => void;
}) => {
  return (
    <div
      className={`rounded-2xl border border-white/15 p-4 md:p-5 ${directorGlassCard} ${directorGlassCardHover}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="relative shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-white/20 bg-white/10 md:h-16 md:w-16">
            <Image
              src={mentor.img}
              alt={mentor.name}
              className="h-full w-full object-cover"
              fill
              unoptimized={isRemoteImageSrc(mentor.img)}
              sizes="64px"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2 md:gap-3">
            <h3 className="text-[15px] font-semibold text-white md:text-[17px]">
              {mentor.name}
            </h3>
            <span className="rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap text-[#cde2f2] md:text-[11px]">
              {mentor.menteeCount} Mentees
            </span>
          </div>
          <p className="mb-1 text-[12px] capitalize text-white/65 md:text-[13px]">
            {mentor.role}
          </p>
          <p className="hidden text-[11px] leading-relaxed text-white/50 sm:block md:text-[12px]">
            {mentor.description}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-[#8ec5eb] md:gap-3">
          <button
            type="button"
            className="hidden p-1 transition hover:opacity-80 sm:inline-flex"
            aria-label="Email"
          >
            <i className="fa-regular fa-envelope text-[16px] md:text-[17px]" />
          </button>
          <button
            type="button"
            className="hidden p-1 transition hover:opacity-80 sm:inline-flex"
            aria-label="Message"
          >
            <i className="fa-regular fa-comment text-[16px] md:text-[17px]" />
          </button>
          <button
            type="button"
            className="hidden p-1 transition hover:opacity-80 md:inline-flex"
            aria-label="WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-[17px]" />
          </button>
          <button type="button" className="p-1 transition hover:opacity-80" aria-label="Call">
            <i className="fa-solid fa-phone text-[16px] md:text-[17px]" />
          </button>
          <div className="relative z-[50]" data-mentor-menu="true">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(mentor.id);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10"
            >
              <i className="fa-solid fa-ellipsis-vertical text-sm" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 min-w-[240px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 pl-1 pr-1 shadow-2xl backdrop-blur-md">
                {optionsMenuItems.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuAction(item.label, mentor);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[13px] text-white/90 transition hover:bg-white/10"
                  >
                    <i className={`${item.icon} ${item.color} w-5 text-base`} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => onViewProfile(mentor.id)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/10 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/20"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return (
    prevProps.mentor.id === nextProps.mentor.id &&
    prevProps.isMenuOpen === nextProps.isMenuOpen
  );
});

MentorListCard.displayName = "MentorListCard";

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  /** Close mentor ⋮ menu on outside click (overlay is only for sort — avoids blocking card menus). */
  useEffect(() => {
    if (!openMenuId) return;
    const close = (e: MouseEvent | TouchEvent) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-mentor-menu]")) return;
      setOpenMenuId(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [openMenuId]);

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

  const handleToggleMenu = useCallback((mentorId: string) => {
    setOpenMenuId((prev) => (prev === mentorId ? null : mentorId));
  }, []);

  const handleScheduleMeeting = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowScheduleModal(true);
    setOpenMenuId(null);
  }, []);

  const handleAssignMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowAssignModal(true);
    setOpenMenuId(null);
  }, []);

  const handleRemoveMentee = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRemoveModal(true);
    setOpenMenuId(null);
  }, []);

  const handleListMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowListMenteesModal(true);
    setOpenMenuId(null);
  }, []);

  const handleMenuAction = useCallback((action: string, mentor: Mentor) => {
    switch (action) {
      case "List of Mentees":
        handleListMentees(mentor);
        break;
      case "Schedule an Appointment":
        handleScheduleMeeting(mentor);
        break;
      case "Assign New Mentee":
        handleAssignMentees(mentor);
        break;
      case "Remove a Mentee":
        handleRemoveMentee(mentor);
        break;
      case "Edit Profile":
        router.push(
          `/director/mentors/profile/edit?id=${encodeURIComponent(mentor.id)}`,
        );
        setOpenMenuId(null);
        break;
      default:
        setToast({ message: `${action} clicked for ${mentor.name}`, type: 'success' });
        setTimeout(() => setToast(null), 2000);
        setOpenMenuId(null);
    }
  }, [router, handleScheduleMeeting, handleAssignMentees, handleRemoveMentee, handleListMentees]);

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
          {/* Search Bar and View Toggle */}
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
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] shadow-sm transition-all hover:bg-white/15"
                aria-label="Toggle view"
                title={
                  viewMode === "grid"
                    ? "Switch to list view"
                    : "Switch to grid view"
                }
              >
                <i
                  className={`fa-solid ${viewMode === "grid" ? "fa-bars" : "fa-th"
                    } text-base`}
                />
              </button>
            </div>
          </div>

          {/* Featured Mentors - Horizontal Scroll */}
          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars items={featuredItems} showDivider className="mb-2" />
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
            <div
              className={`relative w-full sm:w-auto sm:min-w-[200px] ${showSortMenu ? "z-[50]" : ""}`}
            >
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex min-w-[160px] w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:w-auto sm:min-w-[180px] sm:text-[14px]"
              >
                <span className="truncate">{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-[60] mt-2 min-w-[200px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 px-1 shadow-2xl backdrop-blur-md">
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

      {/* Mentors Grid/List */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]"></div>
                <p className="text-white text-lg font-medium">Loading mentors...</p>
              </div>
            </div>
          ) : filteredMentors.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <i className="fa-solid fa-users text-white text-5xl mb-4 opacity-50"></i>
                <p className="text-white text-lg font-medium">No mentors found</p>
                <p className="text-white/70 text-sm mt-2">Try adjusting your search or filters</p>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-5">
              {filteredMentors.map((mentor) => (
                <MentorGridCard
                  key={mentor.id}
                  mentor={mentor}
                  isMenuOpen={openMenuId === mentor.id}
                  onToggleMenu={handleToggleMenu}
                  onMenuAction={handleMenuAction}
                  onViewProfile={(id) => router.push(`/director/mentors/profile/${id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {filteredMentors.map((mentor) => (
                <MentorListCard
                  key={mentor.id}
                  mentor={mentor}
                  isMenuOpen={openMenuId === mentor.id}
                  onToggleMenu={handleToggleMenu}
                  onMenuAction={handleMenuAction}
                  onViewProfile={(id) => router.push(`/director/mentors/profile/${id}`)}
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
        onConfirm={(meetingData) => {
          setToast({ message: "Meeting Scheduled Successfully", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={selectedMentor}
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

      <RemoveMenteesModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        mentorId={selectedMentor?.id ?? null}
        mentorName={selectedMentor?.name ?? null}
        onSuccess={(message) => {
          setToast({ message, type: "success" });
          setTimeout(() => setToast(null), 3000);
          const refresh = async () => {
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
                users.map((u: any, i: number) => convertUserToMentor(u, i)),
              );
              setTotalCount(total);
              setTotalPages(tp);
            } catch (error) {
              console.error("Error refreshing mentors:", error);
            }
          };
          void refresh();
        }}
        onError={(message) => {
          setToast({ message, type: "error" });
          setTimeout(() => setToast(null), 4000);
        }}
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

      {/* Dismiss sort dropdown only (mentor ⋮ menus use document listeners + z-index). */}
      {showSortMenu ? (
        <div
          className="fixed inset-0 z-30"
          aria-hidden
          onClick={() => setShowSortMenu(false)}
        />
      ) : null}
    </div>
  );
}
