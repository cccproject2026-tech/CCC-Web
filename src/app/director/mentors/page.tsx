"use client";
import { useMemo, useState } from "react";
import DirectorHeader from "@/app/Components/DirectorHeader";
import DirectorFooter from "@/app/Components/DirectorFooter";
import PersonListCard from "@/app/Components/PersonListCard";
import TabSwitcher from "@/app/Components/TabSwitcher";
import SortDropdown from "@/app/Components/SortDropdown";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
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
  isNew?: boolean;
  status: "active" | "inactive" | "pending";
  menteeCount: number;
  specialization?: string;
  experience?: number;
}

const MENTORS: Mentor[] = [
  {
    id: 1,
    name: "John Doe",
    role: "Senior Field Mentor",
    description:
      "Sub text area write something here. That you can read more about him",
    img: Mentor1,
    isNew: true,
    status: "active",
    menteeCount: 5,
    specialization: "Church Revitalization",
    experience: 15,
  },
  {
    id: 2,
    name: "Jane Smith",
    role: "Field Mentor",
    description:
      "Experienced mentor with strong background in pastoral ministry",
    img: Mentor2,
    status: "active",
    menteeCount: 3,
    specialization: "Community Engagement",
    experience: 10,
  },
  {
    id: 3,
    name: "Michael Johnson",
    role: "Field Mentor",
    description:
      "Passionate about helping pastors grow and develop their ministries",
    img: Mentor3,
    status: "active",
    menteeCount: 7,
    specialization: "Leadership Development",
    experience: 12,
  },
  {
    id: 4,
    name: "Sarah Williams",
    role: "Senior Field Mentor",
    description: "Dedicated to supporting church growth and transformation",
    img: Mentor1,
    status: "inactive",
    menteeCount: 0,
    specialization: "Worship Ministry",
    experience: 8,
  },
  {
    id: 5,
    name: "David Brown",
    role: "Field Mentor",
    description: "Expert in church administration and strategic planning",
    img: Mentor2,
    status: "pending",
    menteeCount: 0,
    specialization: "Administration",
    experience: 6,
  },
  {
    id: 6,
    name: "Emily Davis",
    role: "Field Mentor",
    description: "Focused on youth ministry and community outreach programs",
    img: Mentor3,
    status: "active",
    menteeCount: 4,
    specialization: "Youth Ministry",
    experience: 9,
  },
];

export default function MentorsPage() {
  const [activeTab, setActiveTab] = useState<"active" | "inactive" | "pending">(
    "active"
  );
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<number | null>(null);

  // Sort options based on active tab
  const getSortOptions = () => {
    return [
      { value: "name_asc", label: "Name (A-Z)" },
      { value: "name_desc", label: "Name (Z-A)" },
      { value: "mentees_high", label: "Most Mentees" },
      { value: "mentees_low", label: "Least Mentees" },
      { value: "experience_high", label: "Most Experienced" },
      { value: "experience_low", label: "Least Experienced" },
    ];
  };

  const data = useMemo(() => {
    let filtered = MENTORS.filter((m) => {
      const matchesTab = m.status === activeTab;
      const matchesSearch = m.name.toLowerCase().includes(query.toLowerCase());
      return matchesTab && matchesSearch;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "mentees_high":
          return b.menteeCount - a.menteeCount;
        case "mentees_low":
          return a.menteeCount - b.menteeCount;
        case "experience_high":
          return (b.experience || 0) - (a.experience || 0);
        case "experience_low":
          return (a.experience || 0) - (b.experience || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeTab, query, sortBy]);

  // Get counts for each tab
  const activeMentors = MENTORS.filter((m) => m.status === "active").length;
  const inactiveMentors = MENTORS.filter((m) => m.status === "inactive").length;
  const pendingMentors = MENTORS.filter((m) => m.status === "pending").length;

  const tabs = [
    { id: "active", label: "Active Mentors", count: activeMentors },
    { id: "inactive", label: "Inactive Mentors", count: inactiveMentors },
    { id: "pending", label: "Pending Approval", count: pendingMentors },
  ];

  const handleRemoveMentor = (id: number) => {
    setToast("Mentor Removed Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const handleAssignMentees = (id: number) => {
    setToast("Redirecting to assign mentees...");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <DirectorHeader showFullHeader={true} />

      {/* Hero Section with Background */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2E5C]/80 to-[#2876AC]/70"></div>

        {/* Hero Title */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-16 pb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold leading-tight">
              Mentors
            </h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg text-[15px] font-semibold hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Add New Mentor
            </button>
          </div>
        </div>
      </section>

      {/* Controls Section - Below Hero Banner */}
      <section className="relative bg-gradient-to-b from-[#4A90C0] to-[#5BA3D0] px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start lg:items-start justify-between">
          {/* Search - Left Side */}
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search mentors..."
            className="w-full lg:w-[380px]"
          />

          {/* Right Side: Tabs + Sort */}
          <div className="flex flex-col gap-4 items-end w-full lg:w-auto">
            {/* Tabs */}
            <TabSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(id) =>
                setActiveTab(id as "active" | "inactive" | "pending")
              }
              showCountOnActive={true}
            />

            {/* Sort By */}
            <SortDropdown
              options={getSortOptions()}
              value={sortBy}
              onChange={setSortBy}
              label="Sort By"
            />
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto">
          {data.length === 0 ? (
            <div className="col-span-2 text-center py-20">
              <i className="fa-solid fa-users text-white/30 text-6xl mb-4"></i>
              <p className="text-white text-xl">No mentors found</p>
            </div>
          ) : (
            data.map((mentor) => (
              <PersonListCard
                key={mentor.id}
                id={mentor.id}
                name={mentor.name}
                role={mentor.role}
                description={mentor.description}
                image={mentor.img}
                isNew={mentor.isNew}
                profileLink={`/director/mentor-profile/${mentor.id}`}
                menteeCount={mentor.menteeCount}
                actionButton={{
                  text:
                    activeTab === "active"
                      ? "Assign Mentees"
                      : activeTab === "pending"
                      ? "Approve"
                      : "Reactivate",
                  onClick: () =>
                    activeTab === "active"
                      ? handleAssignMentees(mentor.id)
                      : handleRemoveMentor(mentor.id),
                }}
              />
            ))
          )}
        </div>
      </section>

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

      {/* Add Mentor Modal */}
      <ConfirmModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={() => {
          setToast("Mentor Added Successfully");
          setTimeout(() => setToast(null), 3000);
        }}
        title="Add New Mentor"
        message="This will open the form to add a new mentor to the system."
        confirmText="Continue"
        cancelText="Cancel"
        confirmColor="bg-blue-600 hover:bg-blue-700"
        icon="fa-solid fa-user-plus"
        iconColor="text-blue-500 bg-blue-100"
      />

      <DirectorFooter />
    </div>
  );
}
