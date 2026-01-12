"use client";
import { useMemo, useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import SearchBar from "@/app/Components/SearchBar";
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

// Helper function to convert User to Mentor
const convertUserToMentor = (user: any): Mentor => {
  const defaultImages = [Mentor1, Mentor2, Mentor3];
  const randomImage = defaultImages[Math.floor(Math.random() * defaultImages.length)];

  return {
    id: user.id || user._id,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    description: `${user.role} with ${user.assignedId?.length || 0} assigned mentees`,
    img: user.profilePicture || randomImage,
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
    color: "text-[#2E3B8E]",
  },
  {
    icon: "fa-solid fa-user-plus",
    label: "Assign New Mentee",
    color: "text-[#2E3B8E]",
  },
  {
    icon: "fa-solid fa-user-minus",
    label: "Remove a Mentee",
    color: "text-[#2E3B8E]",
  },
  {
    icon: "fa-regular fa-calendar",
    label: "Schedule an Appointment",
    color: "text-[#2E3B8E]",
  },
  {
    icon: "fa-regular fa-pen-to-square",
    label: "Edit Profile",
    color: "text-[#2E3B8E]",
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
  onMenuAction
}: {
  mentor: Mentor;
  isMenuOpen: boolean;
  onToggleMenu: (mentorId: string) => void;
  onMenuAction: (action: string, mentor: Mentor) => void;
}) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100">
      {/* Profile Image with Options Menu */}
      <div className="relative w-full h-[240px] bg-gray-100">
        <Image
          src={mentor.img}
          alt={mentor.name}
          fill
          style={{ objectFit: 'cover' }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          quality={85}
        />

        {/* Options Menu - Positioned in top-right corner of image */}
        <div className="absolute top-2 right-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(mentor.id);
              }}
              className="w-7 h-7 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-sm"
            >
              <i className="fa-solid fa-ellipsis-vertical text-gray-700 text-sm"></i>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-2 px-1 min-w-[240px] z-50">
                {optionsMenuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuAction(item.label, mentor);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] transition-all flex items-center gap-3 hover:bg-gray-50"
                  >
                    <i className={`${item.icon} ${item.color} text-base w-5`}></i>
                    <span className="text-gray-700 font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mentor Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="text-[17px] font-bold text-gray-900 mb-0.5">
              {mentor.name}
            </h3>
            <p className="text-[13px] text-gray-500">
              {mentor.role}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-[11px] font-semibold whitespace-nowrap ml-2 border border-yellow-200">
            {mentor.menteeCount} Mentees
          </span>
        </div>
        <p className="text-[12px] text-gray-400 leading-relaxed mb-4">
          {mentor.description}
        </p>

        {/* Action Icons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-3 sm:gap-4 text-[#2E3B8E]">
            <button
              className="hover:opacity-70 transition"
              aria-label="Email"
            >
              <i className="fa-regular fa-envelope text-[16px] sm:text-[17px]"></i>
            </button>
            <button
              className="hover:opacity-70 transition"
              aria-label="Message"
            >
              <i className="fa-regular fa-comment text-[16px] sm:text-[17px]"></i>
            </button>
            <button
              className="hover:opacity-70 transition"
              aria-label="WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-[16px] sm:text-[17px]"></i>
            </button>
            <button
              className="hover:opacity-70 transition"
              aria-label="Call"
            >
              <i className="fa-solid fa-phone text-[16px] sm:text-[17px]"></i>
            </button>
          </div>
          <button className="w-9 h-9 bg-[#2E3B8E] text-white rounded-lg flex items-center justify-center hover:bg-[#3A4BA0] transition-all flex-shrink-0">
            <i className="fa-solid fa-arrow-up-right-from-square text-xs"></i>
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
  onMenuAction
}: {
  mentor: Mentor;
  isMenuOpen: boolean;
  onToggleMenu: (mentorId: string) => void;
  onMenuAction: (action: string, mentor: Mentor) => void;
}) => {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 shadow-md hover:shadow-lg transition-all border border-gray-100">
      <div className="flex items-center gap-3 md:gap-5">
        {/* Profile Image */}
        <div className="relative flex-shrink-0">
          <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
            <Image
              src={mentor.img}
              alt={mentor.name}
              className="w-full h-full object-cover"
              fill
              sizes="64px"
            />
          </div>
        </div>

        {/* Mentor Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
            <h3 className="text-[15px] md:text-[17px] font-bold text-gray-900">
              {mentor.name}
            </h3>
            <span className="px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full text-[10px] md:text-[11px] font-semibold whitespace-nowrap border border-yellow-200">
              {mentor.menteeCount} Mentees
            </span>
          </div>
          <p className="text-[12px] md:text-[13px] text-gray-500 mb-1">
            {mentor.role}
          </p>
          <p className="text-[11px] md:text-[12px] text-gray-400 leading-relaxed hidden sm:block">
            {mentor.description}
          </p>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2 md:gap-4 text-[#2E3B8E]">
          <button
            className="hover:opacity-70 transition p-1 hidden sm:block"
            aria-label="Email"
          >
            <i className="fa-regular fa-envelope text-[16px] md:text-[17px]"></i>
          </button>
          <button
            className="hover:opacity-70 transition p-1 hidden sm:block"
            aria-label="Message"
          >
            <i className="fa-regular fa-comment text-[16px] md:text-[17px]"></i>
          </button>
          <button
            className="hover:opacity-70 transition p-1 hidden md:block"
            aria-label="WhatsApp"
          >
            <i className="fa-brands fa-whatsapp text-[17px]"></i>
          </button>
          <button
            className="hover:opacity-70 transition p-1"
            aria-label="Call"
          >
            <i className="fa-solid fa-phone text-[16px] md:text-[17px]"></i>
          </button>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(mentor.id);
              }}
              className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all"
            >
              <i className="fa-solid fa-ellipsis-vertical text-gray-600 text-sm"></i>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-2 px-1 min-w-[240px] z-50">
                {optionsMenuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMenuAction(item.label, mentor);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] transition-all flex items-center gap-3 hover:bg-gray-50"
                  >
                    <i className={`${item.icon} ${item.color} text-base w-5`}></i>
                    <span className="text-gray-700 font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
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

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        let role: string;
        let roleMatch: 'exact' | 'mixed' | undefined;

        if (activeFilter === "All") {
          role = "mentor";
          roleMatch = "mixed";
        } else if (activeFilter === "Mentors") {
          role = "mentor";
        } else if (activeFilter === "Field Mentor") {
          role = "field mentor";
        } else {
          role = "mentor";
          roleMatch = "mixed";
        }

        const response = await apiGetAllUsers({
          role,
          roleMatch,
          search: debouncedQuery || undefined,
        });

        const users = response.data.data.users;
        const mentors = users.map(convertUserToMentor);
        setAllMentors(mentors);
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setAllMentors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [activeFilter, debouncedQuery]);

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
        router.push(`/director/mentors/profile/edit`);
        setOpenMenuId(null);
        break;
      default:
        setToast({ message: `${action} clicked for ${mentor.name}`, type: 'success' });
        setTimeout(() => setToast(null), 2000);
        setOpenMenuId(null);
    }
  }, [router, handleScheduleMeeting, handleAssignMentees, handleRemoveMentee, handleListMentees]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Mentors" backgroundImageUrl={MentorBg.src} />

      {/* Search and Featured Mentors Section */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar and View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="w-full sm:max-w-[420px]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search"
                className="w-full"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-sm transition-all bg-white text-[#2E3B8E]`}
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
                ></i>
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
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 pb-6 md:pb-8 pt-4">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex gap-1.5 sm:gap-2 bg-white rounded-xl p-1.5 shadow-sm overflow-x-auto scrollbar-hide">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-5 sm:px-7 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all duration-200 whitespace-nowrap ${activeFilter === option.value
                  ? "bg-[#2E3B8E] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-white text-[14px] sm:text-[15px] font-semibold">
              Sort By
            </span>
            <div className="relative flex-1 sm:flex-initial">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 bg-white text-gray-700 rounded-lg text-[13px] sm:text-[14px] font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-3 min-w-[160px] sm:min-w-[180px] justify-between"
              >
                <span className="truncate">{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-2 px-1 min-w-[200px] z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] sm:text-[14px] transition-all flex items-center gap-3 ${sortBy === option
                        ? "bg-green-50 text-green-700 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                        }`}
                    >
                      <span
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center flex-shrink-0 ${sortBy === option
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300"
                          }`}
                      >
                        {sortBy === option && (
                          <i className="fa-solid fa-check text-white text-[9px]"></i>
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
      <section className="px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filteredMentors.map((mentor) => (
                <MentorGridCard
                  key={mentor.id}
                  mentor={mentor}
                  isMenuOpen={openMenuId === mentor.id}
                  onToggleMenu={handleToggleMenu}
                  onMenuAction={handleMenuAction}
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
                />
              ))}
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
              let role: string;
              let roleMatch: 'exact' | 'mixed' | undefined;

              if (activeFilter === "All") {
                role = "mentor";
                roleMatch = "mixed";
              } else if (activeFilter === "Mentors") {
                role = "mentor";
              } else if (activeFilter === "Field Mentor") {
                role = "field mentor";
              } else {
                role = "mentor";
                roleMatch = "mixed";
              }

              const response = await apiGetAllUsers({
                role,
                roleMatch,
                search: debouncedQuery || undefined,
              });

              const users = response.data.data.users;
              const mentors = users.map(convertUserToMentor);
              setAllMentors(mentors);
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
        <div className="fixed top-6 right-6 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check text-green-500' : 'fa-circle-exclamation text-red-500'} text-xl`}></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(showSortMenu || openMenuId) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSortMenu(false);
            setOpenMenuId(null);
          }}
        ></div>
      )}

      <AppFooter />
    </div>
  );
}
