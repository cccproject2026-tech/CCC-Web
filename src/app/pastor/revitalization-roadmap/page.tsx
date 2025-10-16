"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import PhaseImg from "@/app/Assets/phase-img.png"; // replace with your actual image
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/roadmap-bg.png"; 

interface Phase {
  id: number;
  title: string;
  description: string;
  phase: string;
  months: string;
  status: "Not Started" | "In-progress" | "Completed" | "Due";
  sessionDate?: string;
}

export default function RevitalizationRoadmap() {
  const [phases] = useState<Phase[]>([
    {
      id: 1,
      title: "Jump-start",
      description:
        "Attend a two-day revitalization jump-start session to strengthen your ministry.",
      phase: "Phase 1",
      months: "1 – 2",
      status: "Not Started",
      sessionDate: "10 Nov 2024",
    },
    {
      id: 2,
      title: "Self Revitalization Phase",
      description:
        "Take a deeper look into your ministry to bring conflict resolution and change.",
      phase: "Phase 2",
      months: "1 – 2",
      status: "Not Started",
      sessionDate: "12 Dec 2024",
    },
    {
      id: 3,
      title: "Church Empowerment Phase",
      description:
        "Create community to empower your church and make a long-term plan for growth.",
      phase: "Phase 3",
      months: "3 – 9",
      status: "In-progress",
      sessionDate: "05 Jan 2025",
    },
    {
      id: 4,
      title: "Community Revitalization and Multiplication Phase",
      description:
        "Review community service outcomes and empower others as you explore opportunities for further growth.",
      phase: "Phase 4",
      months: "10 – 12",
      status: "Completed",
      sessionDate: "20 Feb 2025",
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#1C578E]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
    <section
  className="relative bg-cover bg-center text-white h-[250px] flex items-end pb-10 px-20"
  style={{ backgroundImage: `url(${HeroBg.src})` }}
>
  {/* dark overlay gradient for readability */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#001845]/70 via-[#0B2E72]/50 to-[#1A4A9A]/90"></div>

  <div className="relative z-10">
    <h1 className="text-3xl font-semibold">Revitalization Roadmap</h1>
  </div>
</section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Search Bar */}
          <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2 w-full max-w-md mb-8">
            <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
            <input
              type="text"
              placeholder="Search"
              className="flex-1 text-sm text-gray-700 outline-none"
            />
          </div>

          {/* PHASE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {phases.map((phase) => (
              <div
                key={phase.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden flex transition-all duration-300"
              >
                {/* LEFT IMAGE */}
                <div className="relative w-[200px] h-[200px] flex-shrink-0">
                  <Image
                    src={PhaseImg}
                    alt={phase.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-1 rounded-md">
                    {phase.phase}
                  </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex flex-col justify-between flex-1 p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[17px] leading-tight mb-1">
                      {phase.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {phase.description}
                    </p>

                    {/* STATUS */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 font-medium">
                        Status
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-[2px] rounded ${
                          phase.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : phase.status === "In-progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {phase.status}
                      </span>
                    </div>

                    {/* SESSION DATE */}
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fa-regular fa-calendar text-[#103C8C] text-sm"></i>
                      <input
                        type="text"
                        value={phase.sessionDate}
                        readOnly
                        className="border border-gray-300 rounded-md px-2 py-1 text-xs text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#103C8C] w-[150px]"
                      />
                    </div>

                    {/* COMPLETION TIME */}
                    <div>
                      <p className="text-[12px] text-gray-500">
                        Completion Time
                      </p>
                      <p className="text-sm font-medium text-gray-800">
                        Months {phase.months}
                      </p>
                    </div>
                  </div>

                  {/* VIEW BUTTON */}
                  <div className="flex justify-end">
                    <button className="bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0B2E72] transition">
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
