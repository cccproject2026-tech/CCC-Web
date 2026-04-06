"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import SelfRevitalizationHeroBg from "@/app/Assets/self-revitalization-hero.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import Card5 from "@/app/Assets/card5.png";
import Card6 from "@/app/Assets/card6.png";
import Card7 from "@/app/Assets/card7.png";
import Card8 from "@/app/Assets/card8.png";

export default function CommunityRevitalizationAndMultiplicationPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<
    "Church" | "Pastor" | "Due" | "Not Started" | "Completed"
  >("Church");

  // Roadmap items data for Community Revitalization and Multiplication Phase
  interface RoadmapItem {
    id: number;
    title: string;
    description: string;
    status: "Not Started" | "In-progress" | "Completed" | "Over Due";
    completionTime: string;
    img: any;
    showDateSelector: boolean;
    dateLabel?: string;
    category: "Church" | "Pastor";
  }

  const roadmapItems: RoadmapItem[] = [
    {
      id: 1,
      title: "Inactive Member List",
      description: "Develop an inactive member list and a relational map",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card1,
      showDateSelector: true,
      dateLabel: "Meeting Date 1",
      category: "Church",
    },
    {
      id: 2,
      title: "Doorway Events",
      description:
        "Schedule at least three intentional \"doorway\" events on your church calendar and invite inactive members to attend",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card2,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 3,
      title: "CMA Assessment",
      description:
        "Review the first CMA Assessment survey and retake the survey for revitalization results",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card3,
      showDateSelector: true,
      dateLabel: "Completion Date",
      category: "Church",
    },
    {
      id: 4,
      title: "Attendance",
      description: "Develop an intentional strategy for noticing lack of attendance",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card4,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 5,
      title: "Final Revitalization Review",
      description: "Celebrate wins and identify next steps for growth",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card5,
      showDateSelector: true,
      dateLabel: "Praise and Thanksgiving Date",
      category: "Church",
    },
    {
      id: 6,
      title: "Community Growth Strategy",
      description: "Develop strategies for community multiplication and growth",
      status: "Not Started",
      completionTime: "Months 10-12",
      img: Card6,
      showDateSelector: false,
      category: "Pastor",
    },
  ];

  // Filter roadmap items based on filter tab and search query
  const filteredItems = roadmapItems.filter((item) => {
    let matchesFilter = false;

    if (filterTab === "Church" || filterTab === "Pastor") {
      matchesFilter = item.category === filterTab;
    } else if (filterTab === "Due") {
      matchesFilter = item.status === "Over Due";
    } else if (filterTab === "Not Started") {
      matchesFilter = item.status === "Not Started";
    } else if (filterTab === "Completed") {
      matchesFilter = item.status === "Completed";
    }

    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Helper function to convert title to slug
  const titleToSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleCardClick = (itemId: number, title: string) => {
    const slug = titleToSlug(title);
    router.push(
      `/director/revitalization-roadmap/home/community-revitalization-and-multiplication/${slug}`
    );
  };

  const handleViewClick = (itemId: number, title: string) => {
    const slug = titleToSlug(title);
    router.push(
      `/director/revitalization-roadmap/home/community-revitalization-and-multiplication/${slug}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={SelfRevitalizationHeroBg.src}
        title="Community Revitalization and Multiplication Phase"
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "/director/revitalization-roadmap/home" },
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap/home",
          },
          { label: "Community Revitalization and Multiplication Phase" },
        ]}
        heightClasses="h-[240px]"
      />

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar and Filter Section */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="relative flex-1 max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-3">
              {/* Main Tab Container - Single white rounded container with all tabs */}
              <div className="bg-white rounded-lg shadow-md flex p-1">
                <button
                  onClick={() => setFilterTab("Church")}
                  className={`px-6 py-2 font-semibold text-sm transition-all rounded-l-lg ${
                    filterTab === "Church"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Church
                </button>
                <button
                  onClick={() => setFilterTab("Pastor")}
                  className={`px-6 py-2 font-semibold text-sm transition-all ${
                    filterTab === "Pastor"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Pastor
                </button>
                <button
                  onClick={() => setFilterTab("Due")}
                  className={`px-6 py-2 font-semibold text-sm transition-all ${
                    filterTab === "Due"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Due
                </button>
                <button
                  onClick={() => setFilterTab("Not Started")}
                  className={`px-6 py-2 font-semibold text-sm transition-all ${
                    filterTab === "Not Started"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Not Started
                </button>
                <button
                  onClick={() => setFilterTab("Completed")}
                  className={`px-6 py-2 font-semibold text-sm transition-all rounded-r-lg ${
                    filterTab === "Completed"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Completed
                </button>
              </div>

              {/* Three dots menu - Separate white rounded button */}
              <button className="bg-white rounded-lg shadow-md px-4 py-3 transition-all flex items-center justify-center hover:bg-gray-50">
                <i className="fa-solid fa-ellipsis-vertical text-[#2E3B8E] text-lg"></i>
              </button>
            </div>
          </div>

          {/* Roadmap Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredItems.map((item) => (
              <RoadmapHomeCard
                key={item.id}
                img={item.img}
                title={item.title}
                description={item.description}
                status={item.status}
                completionTime={item.completionTime}
                showDateSelector={item.showDateSelector}
                dateLabel={item.dateLabel}
                onViewClick={() => handleViewClick(item.id, item.title)}
                onCardClick={() => handleCardClick(item.id, item.title)}
              />
            ))}
          </div>
        </div>
      </main>    </div>
  );
}
