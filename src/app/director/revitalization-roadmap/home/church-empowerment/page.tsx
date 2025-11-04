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

export default function ChurchEmpowermentPhasePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<
    "Church" | "Pastor" | "Due" | "Not Started" | "Completed"
  >("Church");

  // Roadmap items data for Church Empowerment Phase
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
    month3Date?: boolean;
    month4Date?: boolean;
  }

  const roadmapItems: RoadmapItem[] = [
    // Church Category Items
    {
      id: 1,
      title: "Community Engagement Project",
      description:
        "Complete a community engagement project with the member/disciple and share the stories of God's work",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card1,
      showDateSelector: true,
      dateLabel: "Date of the Project",
      category: "Church",
    },
    {
      id: 2,
      title: "Facility Review",
      description:
        "Complete a review of your facility and make the necessary minor adjustments to make it more visitor friendly",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card2,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 3,
      title: "Welcome Team",
      description:
        "Develop a welcome team strategy and begin implementing that strategy, include a secret guest",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card3,
      showDateSelector: true,
      dateLabel: "Secret Guest Date",
      category: "Church",
    },
    {
      id: 4,
      title: "Guest Contact Information",
      description:
        "Begin collecting guest contact information and measure guest follow-up",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card4,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 5,
      title: "Community Assessment",
      description:
        "Refine your understanding of the needs in your community by using a community assessment tool",
      status: "Not Started",
      completionTime: "Months 5-6",
      img: Card5,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 6,
      title: "Community Engagement Events",
      description:
        "Plan two community engagement events with at least 1 follow-up bridge event that addresses felt needs in the community",
      status: "Not Started",
      completionTime: "Months 5-6",
      img: Card6,
      showDateSelector: false,
      category: "Church",
    },
    {
      id: 7,
      title: "Empower Ministry Leaders",
      description:
        "Begin empowering ministry leaders into calendar activities in the worship service and offering a regular new member opportunities to come to the church service. Include a lay Bible worker role",
      status: "Not Started",
      completionTime: "Months 7-9",
      img: Card7,
      showDateSelector: false,
      category: "Church",
    },
    // Pastor Category Items
    {
      id: 8,
      title: "God's Vision Team",
      description: "Finalize the teams vision for the church",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card1,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 9,
      title: "Calendar",
      description:
        "Finalize a vision team meeting schedule through the end of the year",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card2,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 10,
      title: "Prayer",
      description:
        "Prioritize church prayer times and meet consistently for prayer with your congregation",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card3,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 11,
      title: "Mentoring Conversations",
      description: "Schedule two mentoring conversations with your mentor",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card4,
      showDateSelector: true,
      dateLabel: "Month 3 meeting date",
      month3Date: true,
      month4Date: true,
      category: "Pastor",
    },
    {
      id: 12,
      title: "Welcome Team",
      description:
        'Lead the church board and/or nominating committee to implement a "welcome team" strategy',
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card5,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 13,
      title: "Secret Guest",
      description:
        'Process the "secret quest" visit with your church and incorporate findings into your welcome team strategy',
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card6,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 14,
      title: "God-Moments",
      description:
        "Celebrate wins with your church by sharing special moments and miracles that are happening in your congregation",
      status: "Not Started",
      completionTime: "Months 3-4",
      img: Card7,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 15,
      title: "Share your Vision",
      description: "Make an effort to continually share your vision with the church",
      status: "Not Started",
      completionTime: "Months 5-6",
      img: Card8,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 16,
      title: "Calendar of Events",
      description:
        "Develop a calendar with your church of events for the year that includes at least two community engagement events and their follow-up events",
      status: "Not Started",
      completionTime: "Months 5-6",
      img: Card1,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 17,
      title: "Preaching Calendar",
      description:
        "Coordinate a preaching calendar for the year that focuses a growing relationship with Christ and with each ministry leader",
      status: "Not Started",
      completionTime: "Months 7-9",
      img: Card2,
      showDateSelector: false,
      category: "Pastor",
    },
    {
      id: 18,
      title: "Proclamation Event Team",
      description: "Recruit a proclamation event team",
      status: "Not Started",
      completionTime: "Months 7-9",
      img: Card3,
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
      `/director/revitalization-roadmap/home/church-empowerment/${slug}`
    );
  };

  const handleViewClick = (itemId: number, title: string) => {
    const slug = titleToSlug(title);
    router.push(
      `/director/revitalization-roadmap/home/church-empowerment/${slug}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={SelfRevitalizationHeroBg.src}
        title="Church Empowerment Phase"
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
          { label: "Church Empowerment Phase" },
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
