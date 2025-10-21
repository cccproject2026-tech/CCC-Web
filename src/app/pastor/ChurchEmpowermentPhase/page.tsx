"use client";
import Image from "next/image";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/self-revitalization-hero.png"; // 🖼️ replace with your hero image

// Card images
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";
import Card5 from "../../Assets/card5.png";
import Card6 from "../../Assets/card6.png";
import Card7 from "../../Assets/card7.png";
import { useRouter } from "next/navigation";


export default function ChurchEmpowermentPhasePage() {
  const router = useRouter();

  const [filter, setFilter] = useState("Church");

  const cards = [
    {
      title: "Community Engagement Project",
      description:
        "Complete a community engagement project with a member/discipleship and share the stories of God's work.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card1,
    },
    {
      title: "Facility Review",
      description:
        "Complete a review of your facility and make the necessary minor adjustments to make it more visitor friendly.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card2,
    },
    {
      title: "Welcome Team",
      description:
        "Develop a welcome team strategy and begin implementing that strategy. Include a secret guest.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card3,
    },
    {
      title: "Guest Contact Information",
      description:
        "Begin collecting guest contact information and measure guest follow-up.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card4,
    },
    {
      title: "Community Assessment",
      description:
        "Refine your understanding of the needs in your community by using a community assessment.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card5,
    },
    {
      title: "Community Engagement Events",
      description:
        "Plan two community engagement events with at least one follow-up bridge event that addresses felt needs in the community.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card6,
    },
    {
      title: "Empower Ministry Leaders",
      description:
        "Begin empowering ministry leaders into challenge activities in the workplace, or include a lay Bible worker role.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card7,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[300px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/50 to-transparent"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
              Phase 2
            </span>
            <h1 className="text-3xl font-semibold">
              Church Empowerment Phase
            </h1>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
        <div className="max-w-7xl mx-auto">

          {/* Search + Filters Row */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            {/* Search Box */}
            <div className="flex items-center w-[360px] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg shadow-sm overflow-hidden p-1">
                {["Church", "Pastor", "Due", "Not Started", "Completed"].map(
                  (tab) => (
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
                  )
                )}
              </div>

              {/* Ellipsis Menu */}
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
                className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all"
              >
                {/* Image */}
                <div className="relative w-[42%] h-[200px] shrink-0 m-3">
                  <Image
                    src={card.img}
                    alt={card.title}
                    fill
                    className="object-cover rounded-l-2xl"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col justify-between w-[58%] px-5 py-4 text-[#0B1C58]">
                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
                      {card.title}
                    </h3>

                    <p className="text-[13px] text-[#6B7280] leading-snug mb-[8px]">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[12px] text-[#6B7280] font-medium">
                        Status
                      </span>
                      <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#EFF6FF] text-[#6B7280] border-[#E5E7EB]">
                        {card.status}
                      </span>
                    </div>

                    <p className="text-[12px] text-[#6B7280] mt-8">
                      Completion Time{" "}
                      <span className="font-semibold text-[#0B1C58]">
                        {card.completion}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-end -mt-4">
                 <button
  onClick={() => router.push(`/pastor/CommunityEngagementProject`)}
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
