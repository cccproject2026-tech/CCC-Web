"use client";
import { useEffect, useState } from "react";
import AppHero from "@/app/Components/Hero/AppHero";
import ProgressCard from "@/app/Components/Card/ProgressCard";
import AppFooter from "@/app/Components/AppFooter";
import ProgressBg from "../../Assets/progress-bg.jpg";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { UserOverallProgressDto } from "@/app/Services/types";
import { apiGetOverallProgress } from "@/app/Services/progress.service";

type ProgressListItem = {
  userId: string;
  fullName: string;
  role: string;
  progress: number;
  profileImage?: string;
};

export default function TrackProgressPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [progressData, setProgressData] = useState<ProgressListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGetOverallProgress()
      .then((res) => {
        const normalized = res.data.data.map((item) => ({
          userId: item.userId,
          fullName: `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim(),
          role: item.role,
          progress: item.overallProgress ?? 0,
          profileImage: item.profilePicture,
        }));


        setProgressData(normalized);
      })
      .finally(() => setLoading(false));
  }, []);
  // const progressData = [
  //   {
  //     id: 1,
  //     name: "John Doe",
  //     slug: "john-doe",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 100,
  //   },
  //   {
  //     id: 2,
  //     name: "John Doe",
  //     slug: "john-doe-2",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 70,
  //   },
  //   {
  //     id: 3,
  //     name: "John Doe",
  //     slug: "john-doe-3",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 80,
  //   },
  //   {
  //     id: 4,
  //     name: "John Doe",
  //     slug: "john-doe-4",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 90,
  //   },
  //   {
  //     id: 5,
  //     name: "John Doe",
  //     slug: "john-doe-5",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 90,
  //   },
  //   {
  //     id: 6,
  //     name: "John Doe",
  //     slug: "john-doe-6",
  //     image: Mentor1,
  //     description:
  //       "Sub text area write something here. That you can read more about him",
  //     progress: 100,
  //   },
  // ];

  const filteredData = progressData.filter((item) => {
    const matchesSearch = item.fullName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeTab === "all" ||
      (activeTab === "in-progress" && item.progress < 100) ||
      (activeTab === "completed" && item.progress === 100);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] to-[#2E3B8E]">
      {/* Hero Section */}
      <AppHero
        title="Track Progress"
        backgroundImageUrl={ProgressBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Track Progress" },
        ]}
      />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            {/* Search Bar */}
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white inline-flex h-10 px-1 items-center gap-1 rounded-lg shadow-md">
              {[
                { id: "all", label: "All" },
                { id: "in-progress", label: "In-Progress" },
                { id: "completed", label: "Completed" },
              ].map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 h-8 rounded-md capitalize font-semibold text-sm transition-all ${activeTab === tab.id
                    ? "bg-[#1E366F] text-white"
                    : "bg-transparent text-[#1E366F]"
                    } ${index === 0 ? "rounded-l-lg" : ""} ${index === 2 ? "rounded-r-lg" : ""
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Progress Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredData.map((item) => (
              <ProgressCard
                key={item.userId}
                image={item.profileImage || Mentor1}
                name={item.fullName}
                description={item.role}
                progress={item.progress}
                slug={item.userId} // Mongo ID – correct routing
                showCompleteButton={item.progress === 100}
                onCompleteClick={(e) => {
                  e.stopPropagation();
                  console.log("Mark as complete");
                }}
                onEmailClick={(e) => {
                  e.stopPropagation();
                  console.log("Email clicked");
                }}
                onMessageClick={(e) => {
                  e.stopPropagation();
                  console.log("Message clicked");
                }}
                onWhatsAppClick={(e) => {
                  e.stopPropagation();
                  console.log("WhatsApp clicked");
                }}
                onPhoneClick={(e) => {
                  e.stopPropagation();
                  console.log("Phone clicked");
                }}
              />
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-white text-4xl"></i>
              </div>
              <p className="text-white text-lg">No progress data found</p>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
