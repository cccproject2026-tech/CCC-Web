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
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <PastorHeader showFullHeader={true} />

      {/* 🟣 HERO SECTION */}
      <section
        className="relative h-[250px] flex items-end justify-start px-16 pb-12 bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90"></div>
        <h1 className="relative z-10 text-4xl font-semibold text-white mb-1">
          Assignments
        </h1>

   
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-[#254487] pt-24 pb-20 px-10 md:px-20">
        <div className="max-w-7xl mx-auto">
          {/* 🔍 Search + Tabs */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10">
            {/* Search Box */}
            <div className="relative w-full md:w-[350px]">
              <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 text-sm"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-[#103C8C]"
              />
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              {["New", "Due", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#103C8C] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
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
                className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden flex flex-col md:flex-row w-full md:w-[48%] transition-all duration-300"
              >
                {/* LEFT IMAGE */}
                <div className="relative w-full md:w-[200px] h-[200px] flex-shrink-0 m-5">
                  <Image
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex flex-col justify-between flex-1 p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[17px] leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{item.desc}</p>

                    {/* STATUS */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 font-medium">
                        Status
                      </span>
                      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-[2px] rounded">
                        {item.status}
                      </span>
                    </div>

                    {/* MEETING DATES (if available) */}
                    {item.meetingDates && (
                      <div className="flex gap-4 mb-3">
                        {item.meetingDates.map((date, i) => (
                          <div key={i} className="flex flex-col">
                            <p className="text-[12px] text-gray-500">
                              {i === 0
                                ? "Month 3 meeting date"
                                : "Month 4 meeting date"}
                            </p>
                            <div className="bg-[#EFF6FF] border border-[#E5E7EB] rounded-md px-3 py-[6px] text-[12px] text-gray-600 mt-1 min-w-[120px] text-center">
                              {date}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* COMPLETION TIME */}
                    <div>
                      <p className="text-[12px] text-gray-500">
                        Completion Time
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Months {item.months}
                      </p>
                    </div>
                  </div>

                  {/* ✅ VIEW BUTTON */}
                  <div className="flex justify-end">
                    <button
                      onClick={() =>
                        router.push("/pastor/assignments/details")
                      }
                      className="bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0B2E72] transition"
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
