"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import PersonListCard from "@/app/Components/PersonListCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import AssignMentorModal from "@/app/Components/AssignMentorModal";
import RemoveMentorModal from "@/app/Components/RemoveMentorModal";

import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";

interface Mentee {
  id: string;
  name: string;
  description: string;
  img: any;
  status: "active" | "completed" | "pending";
  progress?: number;
  phase?: string;
}

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

const mapUserToMentee = (user: any, index: number): Mentee => ({
  id: user.id,
  name: `${user.firstName} ${user.lastName}`,
  description: `${user.role} enrolled in mentoring program`,
  img: user.profilePicture || IMAGE_POOL[index % IMAGE_POOL.length],
  status: user.hasCompleted 
    ? "completed"
    : user.status === "pending"
      ? "pending"
      : "active",
  progress: user.progressPercentage ?? 0,
  phase: user.currentPhase ?? undefined,
});

const AVAILABLE_MENTORS = [
  {
    id: 1,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 0,
    img: Mentor1,
    loginDate: "Not Started yet",
  },
  {
    id: 2,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 2,
    img: Mentor2,
    loginDate: "Not Started yet",
  },
  {
    id: 3,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 2,
    img: Mentor3,
    loginDate: "15 Nov 2024",
  },
  {
    id: 4,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 2,
    img: Mentor1,
    loginDate: "15 Nov 2024",
  },
  {
    id: 5,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 2,
    img: Mentor2,
    loginDate: "15 Nov 2024",
  },
  {
    id: 6,
    name: "Robert Fox",
    role: "Pastor",
    menteeCount: 2,
    img: Mentor3,
    loginDate: "15 Nov 2024",
  },
];

export default function MenteesPage() {
  const router = useRouter();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "active"
  );
  const [sortBy, setSortBy] = useState("Phase");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);

  useEffect(() => {
    const fetchMentees = async () => {
      try {
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          search: query || undefined,
        });
        console.log(res.data.data.users)
        setMentees(
          res.data.data.users.map((u: any, i: number) =>
            mapUserToMentee(u, i)
          )
        );
      } catch (err) {
        console.error(err);
        setMentees([]);
      }
    };

    fetchMentees();
  }, [query]);

  useEffect(() => {
    if (!mentees.length) return;

    const hydrateProgress = async () => {
      const results = await Promise.allSettled(
        mentees.map((m) =>
          apiGetUserProgress(m.id).then((res) => ({
            userId: m.id,
            progress: res.data.data?.overallProgress ?? 0,
            completed: res.data.data?.overallCompleted ?? false,
          }))
        )
      );

      setMentees((prev) =>
        prev.map((m) => {
          const match = results.find(
            (r) =>
              r.status === "fulfilled" && r.value.userId === m.id
          ) as PromiseFulfilledResult<any> | undefined;

          if (!match) return m;

          return {
            ...m,
            progress: match.value.progress,
            status: match.value.completed ? "completed" : m.status,
          };
        })
      );
    };

    hydrateProgress();
  }, [mentees.length]);

  const filteredMentees = useMemo(() => {
    return mentees.filter((m) => {
      const matchesTab = activeTab === "all" || m.status === activeTab;
      const matchesSearch = m.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [mentees, activeTab, query]);

  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      mentees.slice(0, 6).map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
      })),
    [mentees]
  );

  const handleTrackProgress = () => {
    setToast("Track Progress...");
    setTimeout(() => setToast(null), 2000);
  };

  const handleMarkComplete = () => {
    setToast("Marked as Complete");
    setTimeout(() => setToast(null), 2000);
  };

  const getMenteeOptions = (menteeId: string) => [
    {
      icon: "fa-solid fa-route",
      label: "Revitalization Roadmap",
      color: "text-blue-600",
      onClick: () => setToast("Opening Roadmap..."),
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      color: "text-purple-600",
      onClick: () => setToast("Opening Assessments..."),
    },
    {
      icon: "fa-solid fa-file-lines",
      label: "Assignment",
      color: "text-blue-500",
      onClick: () => setToast("Opening Assignments..."),
    },
    {
      icon: "fa-regular fa-note-sticky",
      label: "Mentor Notes",
      color: "text-orange-500",
      onClick: () => setToast("Opening Notes..."),
    },
    {
      icon: "fa-solid fa-chart-line",
      label: "Track Progress",
      color: "text-red-500",
      onClick: handleTrackProgress,
    },
    {
      icon: "fa-solid fa-user-plus",
      label: "Assign New Mentor",
      color: "text-blue-600",
      onClick: () => {
        setSelectedMentee(menteeId);
        setShowAssignModal(true);
      },
    },
    {
      icon: "fa-solid fa-user-minus",
      label: "Remove a Mentor",
      color: "text-red-600",
      onClick: () => {
        setSelectedMentee(menteeId);
        setShowRemoveModal(true);
      },
    },
  ];

  const activeCount = mentees.filter((m) => m.status === "active").length;
  const sortOptions = ["Phase", "Name A-Z", "Name Z-A", "Progress"];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Mentees" backgroundImageUrl={MentorBg.src} />

      {/* Search + Featured */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6 md:mb-8">
            <div className="w-full sm:max-w-[420px]">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full px-4 py-3 pl-11 rounded-lg bg-white text-[#1A2E7A] placeholder-gray-400 outline-none shadow-md text-[15px]"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push("/director/mentees/location")}
                className="w-11 h-11 rounded-lg bg-white text-[#2E3B8E]"
              >
                <i className="fa-solid fa-location-dot"></i>
              </button>
              <button className="w-11 h-11 rounded-lg bg-white text-[#2E3B8E]">
                <i className="fa-solid fa-list"></i>
              </button>
            </div>
          </div>

          <FeaturedAvatars items={featuredItems} showDivider className="mb-2" />
        </div>
      </section>

      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 pb-6 md:pb-8 pt-4">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch lg:items-center justify-between">
          {/* Filter Tabs */}
          <div className="flex gap-1.5 sm:gap-2 bg-white rounded-xl p-1.5 shadow-sm overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-5 sm:px-7 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === "all"
                ? "bg-[#2E3B8E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab("active")}
              className={`px-5 sm:px-7 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${activeTab === "active"
                ? "bg-[#2E3B8E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              <span>In-Progress</span>
              {activeTab === "active" && activeCount > 0 && (
                <span className="px-1.5 min-w-[20px] h-5 flex items-center justify-center bg-yellow-400 text-gray-900 rounded-full text-[11px] font-bold">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`px-5 sm:px-7 py-2.5 rounded-lg text-[13px] sm:text-[14px] font-semibold transition-all duration-200 whitespace-nowrap ${activeTab === "completed"
                ? "bg-[#2E3B8E] text-white shadow-sm"
                : "text-gray-600 hover:text-gray-800"
                }`}
            >
              Completed
            </button>
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

      {/* Cards */}
      <section className="px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          {filteredMentees.map((m) => (
            <PersonListCard
              key={m.id}
              id={m.id}
              name={m.name}
              description={m.description}
              image={m.img}
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
      </section>

      <AssignMentorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={() => setShowAssignModal(false)}
        mentors={AVAILABLE_MENTORS}
      />

      <RemoveMentorModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => setShowRemoveModal(false)}
        mentors={AVAILABLE_MENTORS}
      />

      <AppFooter />
    </div>
  );
}
