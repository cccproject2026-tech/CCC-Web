"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/self-revitalization-hero.png";

import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import Card5 from "@/app/Assets/card5.png";
import Card6 from "@/app/Assets/card6.png";
import Card7 from "@/app/Assets/card7.png";
import Card8 from "@/app/Assets/card8.png";

export default function SelfRevitalizationPhasePage() {
  const [filter, setFilter] = useState("All");
  const router = useRouter();

  const cards = [
    {
      title: "12-Month Mentoring Revitalization Roadmap Approval",
      category: "Completion | Phase 1 | Roadmap",
      status: "Not Started",
      completion: "Months 1–2",
      img: Card1,
      route: "/pastor/MentoringRoadmap",
    },
    {
      title: "Prayer & Visit Strategy",
      category: "Completion | Phase 1 | Strategy",
      status: "Not Started",
      completion: "Months 1–2",
      img: Card2,
      route: "/pastor/PrayerAndVisitationStrategy",
    },
    {
      title: "Pastoral Ministry Profile (PMP)",
      category: "Completion | Pastoral | Assessment evaluation",
      status: "Submitted",
      completion: "Months 3–4",
      note: "Meeting Scheduled on 21 January 2025",
      img: Card3,
      route: "/pastor/PastoralMinistryProfile",
    },
    {
      title: "Church Assessment Evaluation (CMA)",
      category: "Completion | Assessment | Evaluation",
      status: "Not Started",
      completion: "Months 3–4",
      img: Card4,
      route: "/pastor/CMAAssessment",
    },
    {
      title: "God’s Vision for your Church",
      category: "Completion | Vision | Strategy",
      status: "Not Started",
      completion: "Months 5–6",
      img: Card5,
      route: "/pastor/GodsVisionTeam",
    },
    {
      title: "Calendar",
      category: "Completion | Planning | Timeline",
      status: "Not Started",
      completion: "Months 5–6",
      img: Card6,
      route: "/pastor/CalendarPage",
    },
    {
      title: "Identify a Member/Disciple",
      category: "Completion | Leadership | Discipleship",
      status: "Not Started",
      completion: "Months 7–8",
      img: Card7,
      route: "/pastor/self-revitalization/member-disciple",
    },
    {
      title: "Community Engagement Project",
      category: "Completion | Project | Community",
      status: "Not Started",
      completion: "Months 7–8",
      img: Card8,
      route: "/pastor/CommunityEngagementProject",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* ✅ HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Self Revitalization Phase
            </span>
          </p>
          <div className="flex items-center gap-2">
            <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
              Phase 1
            </span>
            <h1 className="text-3xl font-semibold">
              Self Revitalization Phase
            </h1>
          </div>
        </div>
      </section>

      {/* ✅ MAIN CONTENT */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
        <div className="max-w-7xl mx-auto">
          {/* Search & Filter Row */}
          <div className="flex justify-between items-center mb-8">
            {/* 🔍 Search Box */}
            <div className="flex items-center w-[40%] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            {/* 🧩 Filter Tabs + Menu */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg shadow-sm overflow-hidden p-1">
                {["All", "Due", "Not Started", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`relative px-5 py-[7px] text-sm font-medium transition-all duration-200
                      ${
                        filter === tab
                          ? "bg-[#103C8C] text-white"
                          : "text-gray-500 hover:text-[#103C8C]"
                      }`}
                  >
                    {tab}

                    {tab === "Due" && (
                      <span className="absolute top-2 -right-1 bg-[#FFD84E] text-[#0B1C58] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white">
                        3
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* ⋮ Menu Button */}
              <button className="bg-white rounded-lg w-8 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <i className="fa-solid fa-ellipsis-vertical text-[#103C8C]"></i>
              </button>
            </div>
          </div>

          {/* ✅ Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all"
              >
                {/* Left Image */}
                <div className="relative w-[42%] h-[200px] shrink-0 m-3">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    className="object-cover rounded-l-2xl"
                  />
                </div>

                {/* Right Content */}
                <div className="flex flex-col justify-between w-[58%] px-5 py-4 text-[#0B1C58]">
                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
                      {card.title}
                    </h3>
                    <p className="text-[13px] text-[#6B7280] leading-snug mb-[8px]">
                      {card.description ||
                        "Complete a Pastoral Assessment evaluation or develop strategy as part of your roadmap."}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[12px] text-[#6B7280] font-medium">
                        Status
                      </span>

                      <span
                        className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${
                          card.status === "Submitted"
                            ? "bg-[#E0EDFF] text-[#103C8C] border-[#C3D4FF]"
                            : "bg-[#EFF6FF] text-[#6B7280] border-[#E5E7EB]"
                        }`}
                      >
                        {card.status}
                      </span>

                      {card.note && (
                        <span className="text-[11px] bg-[#FFF9E5] text-[#B78E00] px-2 py-[3px] rounded-md font-medium border border-[#F2E4B0]">
                          {card.note}
                        </span>
                      )}
                    </div>

                    <p className="text-[12px] text-[#6B7280] mt-10">
                      Completion Time{" "}
                      <span className="font-semibold text-[#0B1C58]">
                        {card.completion}
                      </span>
                    </p>
                  </div>

                  {/* ✅ View Button */}
                  <div className="flex justify-end -mt-6">
                    <button
                      onClick={() => router.push(card.route)}
                      className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-[12px] font-medium px-6 py-[6px] rounded-md shadow-sm"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
