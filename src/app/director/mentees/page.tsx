"use client";
import { useMemo, useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppHero from "@/app/Components/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import PersonListCard from "@/app/Components/PersonListCard";
import TabSwitcher from "@/app/Components/TabSwitcher";
import SortDropdown from "@/app/Components/SortDropdown";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

interface Mentee {
  id: number;
  name: string;
  role: string;
  description: string;
  img: any;
  isNew?: boolean;
  status: "active" | "completed" | "pending" | "inactive";
  mentorName?: string;
  progress?: number;
  church?: string;
}

const MENTEES: Mentee[] = [
  {
    id: 1,
    name: "John Ross",
    role: "Pastor",
    description:
      "Sub text area write something here. That you can read more about him",
    img: Mentor1,
    isNew: true,
    status: "active",
    mentorName: "John Doe",
    progress: 65,
    church: "Loma Linda University Church",
  },
  {
    id: 2,
    name: "Robert Smith",
    role: "Associate Pastor",
    description: "Dedicated to growing his ministry and serving his community",
    img: Mentor2,
    status: "active",
    mentorName: "Jane Smith",
    progress: 80,
    church: "Grace Community Church",
  },
  {
    id: 3,
    name: "James Williams",
    role: "Youth Pastor",
    description: "Passionate about youth ministry and community outreach",
    img: Mentor3,
    status: "completed",
    mentorName: "Michael Johnson",
    progress: 100,
    church: "Faith Baptist Church",
  },
  {
    id: 4,
    name: "Michael Brown",
    role: "Senior Pastor",
    description: "Leading church revitalization with enthusiasm and dedication",
    img: Mentor1,
    status: "active",
    mentorName: "Sarah Williams",
    progress: 45,
    church: "Hope Church",
  },
  {
    id: 5,
    name: "David Johnson",
    role: "Pastor",
    description: "Seeking guidance in growing a small congregation",
    img: Mentor2,
    status: "pending",
    progress: 0,
    church: "Riverside Church",
  },
  {
    id: 6,
    name: "Christopher Davis",
    role: "Associate Pastor",
    description:
      "Recently joined the mentorship program for professional growth",
    img: Mentor3,
    status: "inactive",
    mentorName: "David Brown",
    progress: 20,
    church: "New Life Church",
  },
  {
    id: 7,
    name: "Daniel Martinez",
    role: "Pastor",
    description: "Focusing on community service and church growth strategies",
    img: Mentor1,
    status: "completed",
    mentorName: "Emily Davis",
    progress: 100,
    church: "Trinity Church",
  },
  {
    id: 8,
    name: "Matthew Garcia",
    role: "Youth Pastor",
    description: "Learning advanced techniques in youth ministry development",
    img: Mentor2,
    status: "active",
    mentorName: "John Doe",
    progress: 55,
    church: "Cornerstone Church",
  },
];

export default function MenteesPage() {
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "pending" | "inactive"
  >("active");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<number | null>(null);

  // Sort options based on active tab
  const getSortOptions = () => {
    const baseOptions = [
      { value: "name_asc", label: "Name (A-Z)" },
      { value: "name_desc", label: "Name (Z-A)" },
    ];

    if (activeTab === "active" || activeTab === "inactive") {
      return [
        ...baseOptions,
        { value: "progress_high", label: "Highest Progress" },
        { value: "progress_low", label: "Lowest Progress" },
        { value: "mentor", label: "Mentor Name" },
      ];
    }

    return baseOptions;
  };

  const data = useMemo(() => {
    let filtered = MENTEES.filter((m) => {
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
        case "progress_high":
          return (b.progress || 0) - (a.progress || 0);
        case "progress_low":
          return (a.progress || 0) - (b.progress || 0);
        case "mentor":
          return (a.mentorName || "").localeCompare(b.mentorName || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [activeTab, query, sortBy]);

  // Get counts for each tab
  const activeMentees = MENTEES.filter((m) => m.status === "active").length;
  const completedMentees = MENTEES.filter(
    (m) => m.status === "completed"
  ).length;
  const pendingMentees = MENTEES.filter((m) => m.status === "pending").length;
  const inactiveMentees = MENTEES.filter((m) => m.status === "inactive").length;

  const tabs = [
    { id: "active", label: "Active Mentees", count: activeMentees },
    { id: "completed", label: "Completed", count: completedMentees },
    { id: "pending", label: "Pending Assignment", count: pendingMentees },
    { id: "inactive", label: "Inactive", count: inactiveMentees },
  ];

  const handleAssignMentor = (id: number) => {
    setSelectedMentee(id);
    setShowAssignModal(true);
  };

  const handleTrackProgress = (id: number) => {
    setToast("Redirecting to progress tracking...");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHeader showFullHeader={true} />

      <AppHero title="Mentees" backgroundImageUrl={MentorBg.src} />

      {/* Controls Section - Below Hero Banner */}
      <section className="relative bg-gradient-to-b from-[#4A90C0] to-[#5BA3D0] px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start lg:items-start justify-between">
          {/* Search - Left Side */}
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search mentees..."
            className="w-full lg:w-[380px]"
          />

          {/* Right Side: Tabs + Sort */}
          <div className="flex flex-col gap-4 items-end w-full lg:w-auto">
            {/* Tabs */}
            <TabSwitcher
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(id) =>
                setActiveTab(
                  id as "active" | "completed" | "pending" | "inactive"
                )
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
              <i className="fa-solid fa-user-group text-white/30 text-6xl mb-4"></i>
              <p className="text-white text-xl">No mentees found</p>
            </div>
          ) : (
            data.map((mentee) => (
              <PersonListCard
                key={mentee.id}
                id={mentee.id}
                name={mentee.name}
                role={mentee.role}
                description={mentee.description}
                image={mentee.img}
                isNew={mentee.isNew}
                profileLink={`/director/mentee-profile`}
                badge={
                  mentee.progress !== undefined && mentee.progress > 0
                    ? {
                        text: `${mentee.progress}% Complete`,
                        color: "bg-green-100 text-green-700",
                      }
                    : undefined
                }
                actionButton={{
                  text:
                    activeTab === "pending"
                      ? "Assign Mentor"
                      : activeTab === "completed"
                      ? "View Certificate"
                      : "Track Progress",
                  onClick: () =>
                    activeTab === "pending"
                      ? handleAssignMentor(mentee.id)
                      : handleTrackProgress(mentee.id),
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

      {/* Assign Mentor Modal */}
      <ConfirmModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={() => {
          setToast("Mentor Assigned Successfully");
          setTimeout(() => setToast(null), 3000);
        }}
        title="Assign Mentor"
        message="Select a mentor to assign to this mentee. This will start their mentorship journey."
        confirmText="Assign"
        cancelText="Cancel"
        confirmColor="bg-blue-600 hover:bg-blue-700"
        icon="fa-solid fa-user-plus"
        iconColor="text-blue-500 bg-blue-100"
      />

      <AppFooter />
    </div>
  );
}
