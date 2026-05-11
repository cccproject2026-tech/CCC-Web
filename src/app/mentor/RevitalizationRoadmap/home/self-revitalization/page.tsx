"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
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

export default function SelfRevitalizationPhasePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("All");

  // Roadmap items data
  const roadmapItems: Array<{
    id: number;
    title: string;
    description: string;
    status: "Not Started" | "In-progress" | "Completed" | "Over Due";
    completionTime: string;
    img: any;
    showDateSelector: boolean;
  }> = [
    {
      id: 1,
      title: "12-Month Mentoring Revitalization Roadmap Approval",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card1,
      showDateSelector: false,
    },
    {
      id: 2,
      title: "Prayer & Visit Strategy",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card2,
      showDateSelector: false,
    },
    {
      id: 3,
      title: "Pastoral Ministry Profile (PMP)",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card3,
      showDateSelector: false,
    },
    {
      id: 4,
      title: "Church Assessment Evaluation (CMA)",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card4,
      showDateSelector: false,
    },
    {
      id: 5,
      title: "God's Vision for your Church",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card5,
      showDateSelector: false,
    },
    {
      id: 6,
      title: "Calendar",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card6,
      showDateSelector: false,
    },
    {
      id: 7,
      title: "Identify a Member/Disciple",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card7,
      showDateSelector: false,
    },
    {
      id: 8,
      title: "Community Engagement Project",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started",
      completionTime: "Months 1-2",
      img: Card8,
      showDateSelector: false,
    },
  ];

  // Filter roadmap items based on filter tab and search query
  const filteredItems = roadmapItems.filter((item) => {
    const matchesFilter =
      filterTab === "All" ||
      (filterTab === "Completed" && item.status === "Completed") ||
      (filterTab === "Not Started" && item.status === "Not Started");
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
      `/director/revitalization-roadmap/self-revitalization/${slug}`
    );
  };

  const handleViewClick = (itemId: number, title: string) => {
    const slug = titleToSlug(title);
    router.push(
      `/director/revitalization-roadmap/self-revitalization/${slug}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={SelfRevitalizationHeroBg.src}
        title="Self Revitalization Phase"
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "/director/revitalization-roadmap" },
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap",
          },
          { label: "Self Revitalization Phase" },
        ]}
        heightClasses="h-[240px]"
      />

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="w-full">
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
                  onClick={() => setFilterTab("All")}
                  className={`px-6 py-2 font-semibold text-sm transition-all rounded-lg ${
                    filterTab === "All"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterTab("Completed")}
                  className={`px-6 py-2 font-semibold text-sm transition-all rounded-lg ${
                    filterTab === "Completed"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setFilterTab("Not Started")}
                  className={`px-6 py-2 font-semibold text-sm transition-all rounded-lg ${
                    filterTab === "Not Started"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-600 bg-transparent hover:text-gray-800"
                  }`}
                >
                  Not Started
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
                onViewClick={() => handleViewClick(item.id, item.title)}
                onCardClick={() => handleCardClick(item.id, item.title)}
              />
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
