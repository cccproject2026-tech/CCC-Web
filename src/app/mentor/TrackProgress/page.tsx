"use client";
import Image from "next/image";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/progress-bg.png";
import PastorImg from "@/app/Assets/mentor1.png"; // 👤 example pastor image
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

export default function TrackProgressPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const pastors = [
    {
      id: 1,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 100,
    },
    {
      id: 2,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 70,
    },
    {
      id: 3,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 80,
    },
    {
      id: 4,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 90,
    },
    {
      id: 5,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 90,
    },
    {
      id: 6,
      name: "John Doe",
      desc: "Sub text area write something here. That you can read more about him",
      progress: 100,
    },
  ];

  const filtered = pastors.filter((p) => {
    if (filter === "In-Progress") return p.progress < 100;
    if (filter === "Completed") return p.progress === 100;
    return true;
  });

  const visible = filtered.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader />

      {/* HERO SECTION */}
      <section
        className="relative h-[280px] bg-cover bg-center flex flex-col justify-end px-4 md:px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/60 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold">Track Progress</h1>
        </div>
      </section>

      {/* MAIN SECTION */}
      <main className="flex-1 px-4 md:px-20 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">
          {/* SEARCH BAR */}
          {/* SEARCH BAR + FILTERS */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-12">
            {/* Search */}
            <div className="flex items-center w-full sm:w-[480px] bg-white rounded-lg overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-[10px] text-sm text-gray-600 focus:outline-none"
              />
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              {["All", "In-Progress", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-8 py-[8px] text-sm font-medium transition-all duration-200 rounded-md
          ${
            filter === tab
              ? "bg-[#103C8C] text-white shadow-sm"
              : "text-gray-700 hover:text-[#103C8C]"
          }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* GRID OF CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visible.map((pastor, index) => (
              <div
                key={index}
                className="bg-white rounded-xl text-[#0B1C58] p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-md hover:shadow-lg transition-all duration-200"
              >
                {/* LEFT: IMAGE */}
                <Image
                  src={PastorImg}
                  alt={pastor.name}
                  width={120}
                  height={120}
                  className="rounded-md object-cover sm:w-[150px] sm:h-[150px]"
                />

                {/* RIGHT: DETAILS */}
                <div className="flex-1">
                  <h4 className="text-[16px] font-semibold">{pastor.name}</h4>
                  <p className="text-sm text-gray-500 mt-[2px]">
                    {pastor.desc}
                  </p>

                  {/* PROGRESS SECTION */}
                  <div className="mt-4">
                    <p className="text-xs text-gray-600 mb-[4px] font-medium">
                      Progress
                    </p>
                    <div className="w-full bg-gray-200 h-[6px] rounded-full mb-[6px]">
                      <div
                        className="h-[6px] bg-[#00B16A] rounded-full"
                        style={{ width: `${pastor.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {pastor.progress}%
                      </p>

                      {/* BUTTONS */}
                      {pastor.progress === 100 ? (
                        <button className="bg-[#00B16A]/10 text-[#00B16A] text-[12px] font-medium px-4 py-[4px] rounded-md border border-[#00B16A]/40">
                          Completed
                        </button>
                      ) : pastor.progress >= 90 ? (
                        <button
                          className="bg-[#103C8C] text-white text-[12px] font-medium px-4 py-[4px] rounded-md hover:bg-[#0B2F6A] transition"
                          onClick={() => router.push("/mentor/MentorProgress")}
                        >
                          Mark as Complete
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* ACTION ICONS */}
                  <div className="flex gap-5 text-[#103C8C] text-[15px] mt-3">
                    <i className="fa-regular fa-envelope cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]"></i>
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
