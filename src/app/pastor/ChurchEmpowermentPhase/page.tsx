"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/self-revitalization-hero.png";

// Card images
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";
import Card5 from "../../Assets/card5.png";
import Card6 from "../../Assets/card6.png";
import Card7 from "../../Assets/card7.png";

type CardItem = {
  title: string;
  description: string;
  status: string;
  completion: string;
  img: any;
  href: string; // ← unique route per card
};

export default function ChurchEmpowermentPhasePage() {
  const router = useRouter();
  const [filter, setFilter] = useState("Church");

  const cards: CardItem[] = [
    {
      title: "Community Engagement Project",
      description:
        "Complete a community engagement project with a member/discipleship and share the stories of God's work.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card1,
      href: "/pastor/CommunityEngagementProject",
    },
    {
      title: "Facility Review",
      description:
        "Complete a review of your facility and make the necessary minor adjustments to make it more visitor friendly.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card2,
      href: "/pastor/FacilityReview",
    },
    {
      title: "Welcome Team",
      description:
        "Develop a welcome team strategy and begin implementing that strategy. Include a secret guest.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card3,
      href: "/pastor/WelcomeTeam",
    },
    {
      title: "Guest Contact Information",
      description:
        "Begin collecting guest contact information and measure guest follow-up.",
      status: "Not Started",
      completion: "Months 3 – 4",
      img: Card4,
      href: "/pastor/GuestContactInformation",
    },
    {
      title: "Community Assessment",
      description:
        "Refine your understanding of the needs in your community by using a community assessment.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card5,
      href: "/pastor/CommunityAssessment",
    },
    {
      title: "Community Engagement Events",
      description:
        "Plan two community engagement events with at least one follow-up bridge event that addresses felt needs in the community.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card6,
      href: "/pastor/CommunityEngagementEvents",
    },
    {
      title: "Empower Ministry Leaders",
      description:
        "Begin empowering ministry leaders into challenge activities in the workplace, or include a lay Bible worker role.",
      status: "Not Started",
      completion: "Months 5 – 6",
      img: Card7,
      href: "/pastor/EmpowerMinistryLeaders",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative flex h-[300px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
              Phase 2
            </span>
            <h1 className="text-3xl font-semibold">Church Empowerment Phase</h1>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-10 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* Search + Filters Row */}
          <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
            {/* Search Box */}
            <div className="flex w-[360px] items-center overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm backdrop-blur">
              <i className="fa-solid fa-magnifying-glass px-3 text-[#cde2f2]"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#cde2f2] focus:outline-none"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-3">
              <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 p-1 shadow-sm backdrop-blur">
                {["Church", "Pastor", "Due", "Not Started", "Completed"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`relative px-5 py-[7px] text-sm font-medium transition-all duration-200 ${
                        filter === tab
                          ? "bg-white text-[#0f4a76]"
                          : "text-[#d9ebf8] hover:bg-white/15"
                      }`}
                    >
                      {tab}
                      {tab === "Due" && (
                        <span className="absolute -right-1 top-2 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-[#FFD84E] text-[10px] font-bold text-[#0B1C58]">
                          3
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>

              {/* Ellipsis Menu */}
              <button className="flex h-10 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 shadow-sm hover:bg-white/15">
                <i className="fa-solid fa-ellipsis-vertical text-[#d9ebf8]" />
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <div
                key={index}
                className="flex overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all hover:shadow-md"
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
                <div className="flex w-[58%] flex-col justify-between px-5 py-4 text-white">
                  <div>
                    <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
                      {card.title}
                    </h3>

                    <p className="mb-[8px] text-[13px] leading-snug text-[#cde2f2]">
                      {card.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[12px] font-medium text-[#d9ebf8]">
                        Status
                      </span>
                      <span className="rounded-full border border-transparent bg-[#e6edff] px-2 py-[3px] text-[11px] font-medium text-[#1e40af]">
                        {card.status}
                      </span>
                    </div>

                    <p className="mt-8 text-[12px] text-[#d9ebf8]">
                      Completion Time{" "}
                      <span className="font-semibold text-white">
                        {card.completion}
                      </span>
                    </p>
                  </div>

                  <div className="flex justify-end -mt-4">
                    <button
                      onClick={() => router.push(card.href)}
                      className="rounded-md bg-white px-6 py-[6px] text-[12px] font-semibold text-[#0f4a76] shadow-sm transition hover:bg-[#e7f1fa]"
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
