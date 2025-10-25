"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import DirectorHeader from "@/app/Components/DirectorHeader";
import DirectorFooter from "@/app/Components/DirectorFooter";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
import ScheduleMeetingModal from "@/app/Components/ScheduleMeetingModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

interface Mentor {
  id: number;
  name: string;
  role: string;
  description: string;
  img: any;
  menteeCount: number;
  isFeatured?: boolean;
  lastContact?: string;
  status: "active" | "inactive";
}

const MENTORS: Mentor[] = [
  {
    id: 1,
    name: "Jacob Jones",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor1,
    menteeCount: 5,
    isFeatured: true,
    lastContact: "2 days ago",
    status: "active",
  },
  {
    id: 2,
    name: "John Doe",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor2,
    menteeCount: 3,
    isFeatured: true,
    lastContact: "1 day ago",
    status: "active",
  },
  {
    id: 3,
    name: "Robert Fox",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor3,
    menteeCount: 7,
    isFeatured: true,
    lastContact: "3 days ago",
    status: "active",
  },
  {
    id: 4,
    name: "Jacob Jones",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor1,
    menteeCount: 4,
    isFeatured: true,
    lastContact: "1 week ago",
    status: "active",
  },
  {
    id: 5,
    name: "Robert Fox",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor3,
    menteeCount: 6,
    isFeatured: true,
    lastContact: "2 days ago",
    status: "active",
  },
  {
    id: 6,
    name: "John Doe",
    role: "Field Mentor",
    description: "Sub text area write something here. That you can read more",
    img: Mentor2,
    menteeCount: 2,
    isFeatured: true,
    lastContact: "4 days ago",
    status: "active",
  },
];

export default function MyMentorsPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Mentors");
  const [sortBy, setSortBy] = useState("Least Mentees");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const featuredMentors = MENTORS.filter((m) => m.isFeatured);
  const allMentors = MENTORS;

  const filteredMentors = useMemo(() => {
    let filtered = allMentors.filter((m) =>
      m.name.toLowerCase().includes(query.toLowerCase())
    );

    if (activeFilter === "Mentors") {
      filtered = filtered.filter((m) => m.status === "active");
    } else if (activeFilter === "Field Mentor") {
      filtered = filtered.filter((m) => m.role === "Field Mentor");
    }

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
  }, [query, activeFilter, sortBy]);

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

  const optionsMenuItems = [
    {
      icon: "fa-solid fa-users",
      label: "List of Mentees",
      color: "text-blue-600",
    },
    {
      icon: "fa-solid fa-user-plus",
      label: "Assign New Mentee",
      color: "text-green-600",
    },
    {
      icon: "fa-solid fa-user-minus",
      label: "Remove a Mentee",
      color: "text-red-600",
    },
    {
      icon: "fa-regular fa-calendar",
      label: "Schedule an Appointment",
      color: "text-indigo-600",
    },
    {
      icon: "fa-regular fa-pen-to-square",
      label: "Edit Profile",
      color: "text-orange-600",
    },
    {
      icon: "fa-solid fa-user-x",
      label: "Remove as Field Mentor",
      color: "text-red-600",
    },
  ];

  const handleScheduleMeeting = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowScheduleModal(true);
  };

  const handleAssignMentees = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowAssignModal(true);
  };

  const handleRemoveMentee = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRemoveModal(true);
  };

  const handleAction = (action: string, mentor: Mentor) => {
    switch (action) {
      case "Schedule an Appointment":
        handleScheduleMeeting(mentor);
        break;
      case "Assign New Mentee":
        handleAssignMentees(mentor);
        break;
      case "Remove a Mentee":
        handleRemoveMentee(mentor);
        break;
      default:
        setToast(`${action} clicked for ${mentor.name}`);
        setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <DirectorHeader showFullHeader={true} />

      {/* Hero Section with Background - Increased Height */}
      <section
        className="relative bg-cover bg-center h-[300px] text-white flex items-end px-6 md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        {/* Hero Title - Increased padding for more height */}
        <div className="relative z-10 pt-20 pb-12">
          <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold leading-tight">
            My Mentors
          </h1>
        </div>
      </section>

      {/* Search and Featured Mentors Section */}
      <section className="relative px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar and View Toggle */}
          <div className="flex items-center justify-between mb-8">
            <div className="w-full max-w-[500px]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search"
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md transition-all ${
                  viewMode === "grid"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <i className="fa-solid fa-th-large"></i>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md transition-all ${
                  viewMode === "list"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <i className="fa-solid fa-list"></i>
              </button>
            </div>
          </div>

          {/* Featured Mentors - Horizontal Scroll */}
          <div className="mb-8">
            <h2 className="text-white text-[18px] font-semibold mb-4">
              Featured Mentors
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {featuredMentors.map((mentor) => (
                <div key={mentor.id} className="flex-shrink-0 text-center">
                  <div className="relative w-20 h-20 mb-3">
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-purple-400 bg-gradient-to-r from-purple-400 to-pink-400 p-0.5">
                      <div className="w-full h-full rounded-full overflow-hidden bg-white">
                        <Image
                          src={mentor.img}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-white text-[14px] font-medium">
                    {mentor.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Sort Section */}
      <section className="relative px-6 md:px-12 lg:px-20 pb-8">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex gap-2 bg-white rounded-lg p-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 ${
                  activeFilter === option.value
                    ? "bg-[#2E3B8E] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-white text-[15px] font-bold">Sort By</span>
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg text-[14px] font-medium shadow-md hover:bg-gray-50 transition-all flex items-center gap-3 min-w-[180px] justify-between"
              >
                <span>{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-xs"></i>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[200px] z-50">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] transition-all flex items-center gap-2 ${
                        sortBy === option
                          ? "bg-green-50 text-green-700 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          sortBy === option
                            ? "border-green-500 bg-green-500"
                            : "border-gray-300"
                        }`}
                      >
                        {sortBy === option && (
                          <i className="fa-solid fa-check text-white text-[8px]"></i>
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
      <section className="px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-[1400px] mx-auto">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl p-3 shadow-lg hover:shadow-xl transition-all max-w-[280px] mx-auto"
                >
                  {/* Profile Image with Options Menu */}
                  <div className="relative w-full h-54 mb-3 rounded-lg overflow-hidden bg-gray-100">
                    <Image
                      src={mentor.img}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Options Menu - Positioned in top-right corner of image */}
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <button
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setShowOptionsMenu(!showOptionsMenu);
                          }}
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-md"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-gray-600 text-sm"></i>
                        </button>

                        {showOptionsMenu &&
                          selectedMentor?.id === mentor.id && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[260px] z-50">
                              {optionsMenuItems.map((item, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    handleAction(item.label, mentor);
                                    setShowOptionsMenu(false);
                                  }}
                                  className="w-full text-left px-4 py-3 rounded-lg text-[14px] transition-all flex items-center gap-3 hover:bg-gray-50"
                                >
                                  <i
                                    className={`${item.icon} ${item.color} text-lg w-5`}
                                  ></i>
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
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[18px] font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[12px] font-semibold">
                        {mentor.menteeCount} Mentees
                      </span>
                    </div>
                    <p className="text-[14px] text-gray-500 mb-2">
                      {mentor.role}
                    </p>
                    <p className="text-[12px] text-gray-400 leading-relaxed">
                      {mentor.description}
                    </p>
                  </div>

                  {/* Action Icons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[#2E3B8E] text-[18px]">
                      <button
                        className="hover:opacity-70 transition"
                        aria-label="Email"
                      >
                        <i className="fa-regular fa-envelope"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition"
                        aria-label="Message"
                      >
                        <i className="fa-regular fa-comment"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition"
                        aria-label="WhatsApp"
                      >
                        <i className="fa-brands fa-whatsapp"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition"
                        aria-label="Call"
                      >
                        <i className="fa-solid fa-phone"></i>
                      </button>
                    </div>
                    <button className="w-10 h-10 bg-[#2E3B8E] text-white rounded-lg flex items-center justify-center hover:bg-[#3A4BA0] transition-all">
                      <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all border border-gray-100"
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Image */}
                    <div className="relative flex-shrink-0">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100">
                        <Image
                          src={mentor.img}
                          alt={mentor.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    {/* Mentor Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[16px] font-bold text-gray-900 truncate">
                          {mentor.name}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-[11px] font-semibold whitespace-nowrap">
                          {mentor.menteeCount} Mentees
                        </span>
                      </div>
                      <p className="text-[13px] text-gray-500 mb-1">
                        {mentor.role}
                      </p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {mentor.description}
                      </p>
                    </div>

                    {/* Action Icons */}
                    <div className="flex items-center gap-3 text-[#2E3B8E] text-[16px]">
                      <button
                        className="hover:opacity-70 transition p-1"
                        aria-label="Email"
                      >
                        <i className="fa-regular fa-envelope"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition p-1"
                        aria-label="Message"
                      >
                        <i className="fa-regular fa-comment"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition p-1"
                        aria-label="Call"
                      >
                        <i className="fa-solid fa-phone"></i>
                      </button>
                      <button
                        className="hover:opacity-70 transition p-1"
                        aria-label="Video Call"
                      >
                        <i className="fa-solid fa-video"></i>
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => {
                            setSelectedMentor(mentor);
                            setShowOptionsMenu(!showOptionsMenu);
                          }}
                          className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded transition-all"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-gray-600 text-xs"></i>
                        </button>

                        {showOptionsMenu &&
                          selectedMentor?.id === mentor.id && (
                            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[260px] z-50">
                              {optionsMenuItems.map((item, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    handleAction(item.label, mentor);
                                    setShowOptionsMenu(false);
                                  }}
                                  className="w-full text-left px-4 py-3 rounded-lg text-[14px] transition-all flex items-center gap-3 hover:bg-gray-50"
                                >
                                  <i
                                    className={`${item.icon} ${item.color} text-lg w-5`}
                                  ></i>
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
          setToast("Meeting Scheduled Successfully");
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={selectedMentor}
      />

      {/* Assign Mentees Modal */}
      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={(selectedMentees) => {
          setToast(`${selectedMentees.length} Mentees Assigned Successfully`);
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={selectedMentor}
      />

      {/* Remove Mentee Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => {
          setToast("Mentee Removed Successfully");
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
      {(showSortMenu || showOptionsMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowSortMenu(false);
            setShowOptionsMenu(false);
          }}
        ></div>
      )}

      <DirectorFooter />
    </div>
  );
}
