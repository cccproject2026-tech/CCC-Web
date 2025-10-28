"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import overall from "../../Assets/overall-progress.jpeg"
import individual from "../../Assets/Individual.jpeg"

// Images
import progressBg from "../../Assets/progress-bg.png";
import card1 from "../../Assets/card1.png";
import card2 from "../../Assets/card2.png";
import card3 from "../../Assets/card3.png";

export default function PastorProgressPage() {
  const [filter, setFilter] = useState("Remaining");

  const roadmapCards = [
    {
      img: card1,
      title: "Self Revitalization Phase",
      completion: "10/12 tasks completed",
      time: "Completion Time",
    },
    {
      img: card2,
      title: "Church Empowerment Phase",
      completion: "14/18 tasks completed",
      time: "Completion Time",
    },
    {
      img: card3,
      title: "Community Revitalization and Multiplication Phase",
      completion: "5/12 tasks completed",
      time: "Completion Time",
    },
  ];

  const surveyCard = {
    img: card1,
    title: "Church Assessment Evaluation (CMA)",
    due: "Due 02/12/2024",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* HEADER */}
      <div
        className="relative bg-gradient-to-r from-[#103D8C] to-[#06285A]"
        style={{
          backgroundImage: `url(${progressBg.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          height:"220px"
        }}
      >
        <h1 className="text-3xl font-semibold tracking-wide mt-35 pl-17">My Progress</h1>
      </div>

      {/* CONTENT */}
      <main className="flex-1 bg-[#F4F7FC] text-[#0B1C58]">
        {/* --- OVERALL + INDIVIDUAL PROGRESS --- */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-16 py-12 bg-[#176192]">
          {/* Left Card */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
            <div className="flex justify-center">
              <Image
                src={overall} // replace with your donut chart image
                alt="Progress Chart"
                width={500}
                height={500}
              />
            </div>
          </div>

          {/* Right Card */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold mb-4">Individual Progress</h3>
            <div className="flex justify-center">
              <Image
                src={individual} // replace with your bar chart image
                alt="Progress Bar"
                width={500}
                height={500}
              />
            </div>
          </div>
        </section>

        {/* --- ROADMAP PROGRESS --- */}
      {/* --- ROADMAP PROGRESS --- */}
<section className="px-16 mb-12 bg-gradient-to-b from-[#BBD6E9] to-[#E3F1FF] pt-8">
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-xl font-semibold">Revitalization Roadmap Progress</h2>

    <div className="flex bg-white rounded-lg shadow overflow-hidden">
      {["All", "Completed", "Remaining"].map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`px-5 py-2 text-sm font-medium transition-all ${
            filter === tab
              ? "bg-[#103C8C] text-white"
              : "text-gray-600 hover:text-[#103C8C]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>

  <div className="grid lg:grid-cols-2 gap-8">
    {/* CARD 1 */}
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <div className="w-1/3">
          <Image
            src={card1}
            alt="Self Revitalization"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-5">
          <h4 className="text-[15px] font-semibold mb-1">
            Self Revitalization Phase
          </h4>
          <p className="text-[13px] text-[#6B7280] mb-3">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[#6B7280] font-medium">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#FFF0F0] text-[#B91C1C] border-[#FCA5A5]">
              Due
            </span>
          </div>

          {/* Progress bar */}
          <p className="text-[12px] text-[#6B7280] mb-1">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#16A34A] rounded-full w-[75%]"></div>
          </div>
          <p className="text-[12px] text-[#0B1C58] font-medium mb-2">06/08</p>

          <p className="text-[12px] text-[#6B7280]">
            Completion Time{" "}
            <span className="font-semibold text-[#0B1C58]">Months 1 – 2</span>
          </p>

          <div className="flex justify-end mt-4">
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* CARD 2 */}
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <div className="w-1/3">
          <Image
            src={card2}
            alt="Church Empowerment Phase"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-5">
          <h4 className="text-[15px] font-semibold mb-1">
            Church Empowerment Phase
          </h4>
          <p className="text-[13px] text-[#6B7280] mb-3">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[#6B7280] font-medium">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]">
              In-progress
            </span>
          </div>

          <p className="text-[12px] text-[#6B7280] mb-1">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#F59E0B] rounded-full w-[65%]"></div>
          </div>
          <p className="text-[12px] text-[#0B1C58] font-medium mb-2">12/18</p>

          <p className="text-[12px] text-[#6B7280]">
            Completion Time{" "}
            <span className="font-semibold text-[#0B1C58]">Months 3 – 9</span>
          </p>

          <div className="flex justify-end mt-4">
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* CARD 3 */}
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <div className="w-1/3">
          <Image
            src={card3}
            alt="Community Revitalization"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-5">
          <h4 className="text-[15px] font-semibold mb-1">
            Community Revitalization and Multiplication Phase
          </h4>
          <p className="text-[13px] text-[#6B7280] mb-3">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[#6B7280] font-medium">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]">
              Not Started
            </span>
          </div>

          <p className="text-[12px] text-[#6B7280] mb-1">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#2563EB] rounded-full w-[35%]"></div>
          </div>
          <p className="text-[12px] text-[#0B1C58] font-medium mb-2">05/12</p>

          <p className="text-[12px] text-[#6B7280]">
            Completion Time{" "}
            <span className="font-semibold text-[#0B1C58]">Months 10 – 12</span>
          </p>

          <div className="flex justify-end mt-4">
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* --- SURVEY PROGRESS --- */}
<section className="px-16 pb-10 bg-gradient-to-b from-[#0D3C78] to-[#0B2A55] pt-8">
  <div className="flex justify-between items-center mb-6 text-white">
    <h2 className="text-xl font-semibold">Survey Progress</h2>
    <div className="flex bg-white rounded-lg shadow overflow-hidden">
      {["All", "Completed", "Remaining"].map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`px-5 py-2 text-sm font-medium transition-all ${
            filter === tab
              ? "bg-[#103C8C] text-white"
              : "text-gray-500 hover:text-[#103C8C]"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>

  <div className="bg-white rounded-2xl overflow-hidden shadow-sm max-w-xl">
    <div className="flex">
      <div className="w-1/3">
        <Image
          src={card1}
          alt={surveyCard.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 p-5 text-[#0B1C58]">
        <h4 className="text-[15px] font-semibold mb-1">
          {surveyCard.title}
        </h4>
        <p className="text-[13px] text-[#6B7280] mb-3">
          Interested in receiving mentoring in community engagement
        </p>
        <p className="text-[12px] text-[#6B7280] mb-1">Due</p>
        <p className="text-[13px] text-[#0B1C58] font-semibold mb-4">
          20 Oct 2024
        </p>

        <div className="flex justify-end">
          <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
            View
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

      </main>


    </div>
  );
}
