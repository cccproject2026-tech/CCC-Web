"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";

export default function RevitalizationRoadmapHome() {
  const [searchQuery, setSearchQuery] = useState("");

  // Roadmap phases data
  const roadmapPhases = [
    {
      id: 1,
      title: "Jump-start",
      description: "Join a two-day group revitalization session hosted by CCC",
      status: "Not Started" as const,
      completionTime: "Months 1-2",
      img: Card1,
      showDateSelector: true,
    },
    {
      id: 2,
      title: "Self Revitalization Phase",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started" as const,
      completionTime: "Months 1-2",
      img: Card2,
      showDateSelector: false,
    },
    {
      id: 3,
      title: "Church Empowerment Phase",
      description: "Join a two-day group revitalization session hosted by CCC",
      status: "Not Started" as const,
      completionTime: "Months 3-9",
      img: Card3,
      showDateSelector: false,
    },
    {
      id: 4,
      title: "Community Revitalization and Multiplication Phase",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started" as const,
      completionTime: "Months 10-12",
      img: Card4,
      showDateSelector: false,
    },
  ];

  const handleViewClick = (phaseId: number) => {
    console.log(`View clicked for phase ${phaseId}`);
    // Navigate to phase detail page
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section with Breadcrumbs */}
      <AppHero
        title="Revitalization Roadmap"
        backgroundImageUrl={HeroBg.src}
        breadcrumbItems={[
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "John Ross" },
        ]}
        heightClasses="h-[240px]"
      >
        <p className="text-[18px] md:text-[22px] lg:text-[26px] text-white/90 font-normal mb-2">
          John Ross
        </p>
      </AppHero>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar Section */}
          <div className="flex items-center justify-between mb-8">
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

            {/* Three dots menu - positioned to the right */}
            <div className="ml-4">
              <button className="text-white hover:text-white/80 transition-all p-2">
                <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
              </button>
            </div>
          </div>

          {/* Roadmap Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roadmapPhases.map((phase) => (
              <RoadmapHomeCard
                key={phase.id}
                img={phase.img}
                title={phase.title}
                description={phase.description}
                status={phase.status}
                completionTime={phase.completionTime}
                showDateSelector={phase.showDateSelector}
                onViewClick={() => handleViewClick(phase.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}

