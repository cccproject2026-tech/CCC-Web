"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/Hero/AppHero";
import RoadmapHomeCard from "@/app/Components/RoadmapHomeCard";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";

export default function RevitalizationRoadmapHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showExpectedOutcomePopup, setShowExpectedOutcomePopup] =
    useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState("4");
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Roadmap phases data
  const roadmapPhases = [
    {
      id: 1,
      title: "Jump-start",
      description: "Join a two-day group revitalization session hosted by CCC",
      status: "Completed" as const,
      completionTime: "Months 1 - 2",
      img: Card1,
      showDateSelector: false,
      completedOn: "20 Oct 2024",
      lastUpdatedOn: "25 Oct 2024",
      showCheckmark: true,
    },
    {
      id: 2,
      title: "Self Revitalization Phase",
      description: "Interested in receiving mentoring in community engagement",
      status: "Over Due" as const,
      completionTime: "Months 1 - 2",
      img: Card2,
      showDateSelector: false,
      taskCompleted: {
        completed: 6,
        total: 8,
      },
    },
    {
      id: 3,
      title: "Church Empowerment Phase",
      description: "Interested in receiving mentoring in community engagement",
      status: "In-progress" as const,
      completionTime: "Months 3 - 9",
      img: Card3,
      showDateSelector: false,
      taskCompleted: {
        completed: 12,
        total: 18,
      },
    },
    {
      id: 4,
      title: "Community Revitalization and Multiplication Phase",
      description: "Interested in receiving mentoring in community engagement",
      status: "Not Started" as const,
      completionTime: "Months 10 - 12",
      img: Card4,
      showDateSelector: false,
    },
  ];

  const handleViewClick = (phaseId: number, title: string) => {
    // Navigate to phase detail page based on phase
    if (title === "Jump-start") {
      router.push("/director/revitalization-roadmap/home/jump-start");
    } else if (title === "Self Revitalization Phase") {
      router.push("/director/revitalization-roadmap/home/self-revitalization");
    } else {
      console.log(`View clicked for phase ${phaseId}`);
      // Navigate to other phase pages when created
    }
  };

  const handleCardClick = (phaseId: number, title: string) => {
    // Navigate to phase detail page based on phase when card is clicked
    if (title === "Jump-start") {
      router.push("/director/revitalization-roadmap/home/jump-start");
    } else if (title === "Self Revitalization Phase") {
      router.push("/director/revitalization-roadmap/home/self-revitalization");
    } else {
      console.log(`Card clicked for phase ${phaseId}: ${title}`);
      // Navigate to other phase pages when created
    }
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowExpectedOutcomePopup(false);
      }
    };

    if (showExpectedOutcomePopup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExpectedOutcomePopup]);

  const expectedOutcomes = [
    { id: "4", label: "Expected Outcome - 4 Months", period: "4-months" },
    { id: "6", label: "Expected Outcome - 6 Months", period: "6-months" },
    { id: "9", label: "Expected Outcome - 9 Months", period: "9-months" },
    {
      id: "end",
      label: "Expected Outcome - End of Year",
      period: "end-of-year",
    },
  ];

  const handleOutcomeClick = (outcomeId: string) => {
    setSelectedOutcome(outcomeId);
    const outcome = expectedOutcomes.find((o) => o.id === outcomeId);
    if (outcome) {
      // Navigate to expected outcome page
      router.push(
        `/director/revitalization-roadmap/home/expected-outcome/${outcome.period}`
      );
      setShowExpectedOutcomePopup(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <AppHero
        title="Revitalization Roadmap"
        backgroundImageUrl={HeroBg.src}
        breadcrumbItems={[
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap",
          },
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
            <div className="ml-4 relative">
              <button
                ref={buttonRef}
                onClick={() =>
                  setShowExpectedOutcomePopup(!showExpectedOutcomePopup)
                }
                className="bg-white  border-2 border-white rounded-lg px-4 py-3 transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-ellipsis-vertical text-[#1F2A6E] text-lg"></i>
              </button>

              {/* Expected Outcome Popup */}
              {showExpectedOutcomePopup && (
                <div
                  ref={popupRef}
                  className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[280px] z-50"
                >
                  <div className="space-y-1">
                    {expectedOutcomes.map((outcome, index) => (
                      <button
                        key={outcome.id}
                        onClick={() => handleOutcomeClick(outcome.id)}
                        className={`w-full text-nowrap text-left px-4 py-3 rounded-lg text-[14px] font-medium transition-all flex items-center gap-3 ${
                          selectedOutcome === outcome.id
                            ? "bg-[#E6F3FF] text-[#0066CC]"
                            : "text-[#214080] hover:bg-gray-50"
                        }`}
                      >
                        <i
                          className={`fa-solid fa-download ${
                            selectedOutcome === outcome.id
                              ? "text-[#0066CC]"
                              : "text-[#214080]"
                          }`}
                        ></i>
                        <span>{outcome.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                completedOn={phase.completedOn}
                lastUpdatedOn={phase.lastUpdatedOn}
                taskCompleted={phase.taskCompleted}
                showCheckmark={phase.showCheckmark}
                onViewClick={() => handleViewClick(phase.id, phase.title)}
                onCardClick={() => handleCardClick(phase.id, phase.title)}
              />
            ))}
          </div>
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
