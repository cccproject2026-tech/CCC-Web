"use client";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorAssignments() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("New");
  const [searchTerm, setSearchTerm] = useState("");

  const assignments = [
    {
      id: 1,
      title: "Prayer and Visitation Strategy",
      desc: "Finalize the teams vision for the church",
      status: "Not Started",
      months: "10 – 12",
      img: Card1,
    },
    {
      id: 2,
      title: "Calendar",
      desc: "Finalize a vision team meeting schedule through the end of the year",
      status: "Not Started",
      months: "10 – 12",
      img: Card2,
    },
    {
      id: 3,
      title: "Prayer",
      desc: "Prioritize church prayer times and meet consistently for prayer with your congregation",
      status: "Not Started",
      months: "10 – 12",
      img: Card3,
    },
    {
      id: 4,
      title: "Mentoring Conversations",
      desc: "Schedule two mentoring conversations with your mentor",
      status: "Not Started",
      months: "10 – 12",
      img: Card4,
      meetingDates: ["10 Nov 2024", "10 Dec 2024"],
    },
  ];

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_10%,rgba(141,211,243,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      {/* 🟣 HERO SECTION */}
      <section
        className="relative h-[250px] flex items-end justify-start px-16 pb-12 sm:px-4 sm:pb-6 bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(141,211,243,0.2),transparent_35%),linear-gradient(180deg,rgba(4,31,53,0.74)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <h1 className="relative z-10 text-4xl sm:text-2xl font-semibold text-white mb-1">
          Assignments
        </h1>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-transparent pt-16 pb-20 px-4 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">
          {/* 🔍 Search + Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10">
            {/* Search Box */}
            <div className="relative w-full md:w-[350px]">
              <i className="fa-solid fa-magnifying-glass text-[#cde2f2] absolute left-4 top-1/2 transform -translate-y-1/2 text-sm"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#cde2f2] shadow-sm outline-none focus:ring-2 focus:ring-[#8ec5eb]"
                suppressHydrationWarning={true}
              />
            </div>

            {/* Tabs */}
            <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm">
              {["New", "Due", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#8ec5eb] text-[#0b3558]"
                      : "text-[#cde2f2] hover:bg-white/10"
                  }`}
                  suppressHydrationWarning={true}
                >
                  {tab}
                  {tab === "Due" && (
                    <span className="ml-1 text-[13px]">🟡</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 🟩 FLEX CARD LAYOUT */}
          <div className="flex flex-wrap justify-between gap-y-8">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:shadow-lg md:w-[48%] md:flex-row"
              >
                {/* LEFT IMAGE */}
                <div className="relative w-full md:w-[200px] h-[200px] sm:h-[150px] flex-shrink-0 m-5 sm:m-3">
                  <Image
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex flex-col justify-between flex-1 p-5 sm:p-3">
                  <div>
                    <h3 className="mb-1 text-[17px] font-semibold leading-tight text-white sm:text-base">
                      {item.title}
                    </h3>
                    <p className="mb-3 text-sm text-[#cde2f2] sm:text-xs">
                      {item.desc}
                    </p>

                    {/* STATUS */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs sm:text-[10px] text-[#cde2f2] font-medium">
                        Status
                      </span>
                      <span className="rounded bg-[#8ec5eb]/20 px-2 py-[2px] text-xs font-medium text-[#d9ebf8] sm:text-[10px]">
                        {item.status}
                      </span>
                    </div>

                    {/* MEETING DATES (if available) */}
                    {item.meetingDates && (
                      <div className="flex gap-4 mb-3">
                        {item.meetingDates.map((date, i) => (
                          <div key={i} className="flex flex-col">
                            <p className="text-[12px] sm:text-[10px] text-[#cde2f2]">
                              {i === 0
                                ? "Month 3 meeting date"
                                : "Month 4 meeting date"}
                            </p>
                            <div className="mt-1 min-w-[120px] rounded-md border border-white/20 bg-white/10 px-3 py-[6px] text-center text-[12px] text-[#e4f1fb] sm:min-w-[100px] sm:text-[10px]">
                              {date}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COMPLETION TIME */}
                    <div>
                      <p className="text-[12px] sm:text-[10px] text-[#cde2f2]">
                        Completion Time
                      </p>
                      <p className="text-sm font-medium text-white sm:text-xs">
                        Months {item.months}
                      </p>
                    </div>
                  </div>

                  {/* ✅ VIEW BUTTON */}
                  <div className="flex justify-end">
                    <button
                      onClick={() => router.push("/pastor/assignments/details")}
                      className="rounded-lg bg-[#8ec5eb] px-5 py-2 text-sm font-semibold text-[#0b3558] transition hover:bg-[#a9d5f2] sm:px-4 sm:text-xs"
                      suppressHydrationWarning={true}
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
      <PastorFooter />
    </div>
  );
}
