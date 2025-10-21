"use client";
import Image from "next/image";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/self-revitalization-hero.png";

// Card images
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";
import Card5 from "../../Assets/card5.png";

export default function CommunityRevitalizationPage() {
  const [filter, setFilter] = useState("Church");

  const cards = [
    {
      title: "Inactive Member List",
      description:
        "Develop an inactive member list and a relational map.",
      status: "Not Started",
      completion: "Months 10 – 12",
      fields: [
        { label: "Meeting Date 1", placeholder: "Select Date" },
        { label: "Meeting Date 2", placeholder: "Select Date" },
      ],
      img: Card1,
    },
    {
      title: "Doorway Events",
      description:
        "Schedule at least three intentional “doorway” events with your church calendar and invite inactive members to attend.",
      status: "Not Started",
      completion: "Months 10 – 12",
      img: Card2,
    },
    {
      title: "CMA Assessment",
      description:
        "Review the final CMA Assessment survey and finalize the survey for revitalization results.",
      status: "Not Started",
      completion: "Months 10 – 12",
      fields: [{ label: "Completion Date", placeholder: "Select Date" }],
      img: Card3,
    },
    {
      title: "Attendance",
      description:
        "Develop an intentional strategy for noticing lack of attendance.",
      status: "Not Started",
      completion: "Months 10 – 12",
      img: Card4,
    },
    {
      title: "Final Revitalization Review",
      description:
        "Celebrate wins and identify next steps for growth.",
      status: "Not Started",
      completion: "Months 10 – 12",
      fields: [
        {
          label: "Praise and Thanksgiving Date",
          placeholder: "Select Date",
        },
      ],
      img: Card5,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[300px] bg-cover bg-center flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/50 to-transparent"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
              Phase 3
            </span>
            <h1 className="text-3xl font-semibold">
              Community Revitalization and Multiplication Phase
            </h1>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">
          {/* Search + Filters */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            <div className="flex items-center w-[360px] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg shadow-sm overflow-hidden p-1">
                {["Church", "Pastor", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-5 py-[7px] text-sm font-medium transition-all duration-200 ${
                      filter === tab
                        ? "bg-[#103C8C] text-white"
                        : "text-gray-500 hover:text-[#103C8C]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <button className="bg-white rounded-lg w-8 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <i className="fa-solid fa-ellipsis-vertical text-[#103C8C]"></i>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className="flex bg-white rounded-xl border border-[#E5EAF1] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Left Image */}
                <div className="relative w-[50%] h-[260px] shrink-0 m-5">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Right Content */}
                <div className="flex flex-col justify-between w-[60%] p-5 text-[#0B1C58]">
                  <div>
                    <h3 className="text-[15px] font-semibold mb-1">
                      {card.title}
                    </h3>
                    <p className="text-[13px] text-[#6B7280] mb-2 leading-snug">
                      {card.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[12px] text-[#6B7280] font-medium">
                        Status
                      </span>
                      <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#EFF6FF] text-[#6B7280] border-[#E5E7EB]">
                        {card.status}
                      </span>
                    </div>

                    {/* Optional fields */}
                    {card.fields && (
                      <div className="grid grid-cols-1 gap-2 mb-3">
                        {card.fields.map((field, i) => (
                          <input
                            key={i}
                            type="text"
                            placeholder={field.placeholder}
                            className="border border-[#E5E7EB] rounded-md px-3 py-[6px] text-[13px] text-gray-600 focus:outline-none w-full"
                          />
                        ))}
                      </div>
                    )}

                    <p className="text-[12px] text-[#6B7280]">
                      Completion Time{" "}
                      <span className="font-semibold text-[#0B1C58]">
                        {card.completion}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-end mt-3">
                    <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-[12px] font-medium px-6 py-[6px] rounded-md shadow-sm">
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
