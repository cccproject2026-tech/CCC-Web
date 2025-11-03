"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import overall from "@/app/Assets/overall-progress.jpeg";
import individual from "@/app/Assets/Individual.jpeg";
import progressBg from "@/app/Assets/progress-bg.png";
import card1 from "@/app/Assets/card1.png";
import card2 from "@/app/Assets/card2.png";
import card3 from "@/app/Assets/card3.png";

export default function PastorProgressPage() {
  const [filter, setFilter] = useState("Remaining");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false); // ✅ after marking complete
  const [activeTab, setActiveTab] = useState("comments"); // ✅ for tab switching

  // ✅ Handle completion
  const handleMarkComplete = () => {
    setIsDrawerOpen(false);
    setShowSuccess(true);
    setIsCompleted(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* HERO HEADER */}
      <section
        className="relative h-[220px] bg-cover bg-center flex flex-col justify-center px-20"
        style={{ backgroundImage: `url(${progressBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#103D8C]/95 to-[#06285A]/90"></div>
        <h1 className="relative z-10 text-3xl font-semibold tracking-wide">
          My Progress
        </h1>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[#F4F7FC] text-[#0B1C58] relative">
        {/* 🟦 OVERALL + INDIVIDUAL PROGRESS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-16 py-12 bg-[#176192]">
          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold mb-4">Overall Progress</h3>
            <div className="flex justify-center">
              <Image
                src={overall}
                alt="Overall Progress"
                width={480}
                height={480}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Individual Progress */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Individual Progress</h3>
              {/* 🟩 Add / View Final Comments Button */}
              {!isCompleted ? (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-5 py-[6px] rounded-md font-medium"
                >
                  Add Final Comments
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsDrawerOpen(true);
                    setActiveTab("comments");
                  }}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-5 py-[6px] rounded-md font-medium"
                >
                  View Final Comments
                </button>
              )}
            </div>
            <div className="flex justify-center">
              <Image
                src={individual}
                alt="Individual Progress"
                width={480}
                height={480}
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* 🟩 REVITALIZATION ROADMAP PROGRESS */}
        <section className="px-16 py-10 bg-gradient-to-b from-[#BBD6E9] to-[#E3F1FF]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Revitalization Roadmap Progress
            </h2>
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
            <RoadmapCard
              img={card1}
              title="Self Revitalization Phase"
              desc="Interested in receiving mentoring in community engagement"
              status="Due"
              statusColor="bg-[#FFF0F0] text-[#B91C1C] border-[#FCA5A5]"
              progress={75}
              completed="06/08"
              time="Months 1 – 2"
            />
            <RoadmapCard
              img={card2}
              title="Church Empowerment Phase"
              desc="Interested in receiving mentoring in community engagement"
              status="In-progress"
              statusColor="bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]"
              progress={65}
              completed="12/18"
              time="Months 3 – 9"
            />
            <RoadmapCard
              img={card3}
              title="Community Revitalization and Multiplication Phase"
              desc="Interested in receiving mentoring in community engagement"
              status="Not Started"
              statusColor="bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]"
              progress={35}
              completed="05/12"
              time="Months 10 – 12"
            />
          </div>
        </section>

        {/* 🟪 SURVEY PROGRESS */}
        <section className="px-16 pb-12 bg-gradient-to-b from-[#0D3C78] to-[#0B2A55] pt-8 text-white">
          <div className="flex justify-between items-center mb-6">
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
                  alt="Survey"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 p-5 text-[#0B1C58]">
                <h4 className="text-[15px] font-semibold mb-1">
                  Church Assessment Evaluation (CMA)
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

        {/* 🧩 FINAL COMMENTS DRAWER (ADD + VIEW MODES) */}
        {isDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white text-[#0B1C58] shadow-2xl z-50">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold">
                    {isCompleted ? "Final Comments & Summary" : "Final Comments"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Pr. John Doe</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-[#103C8C] transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              {/* Tabs (only after completed) */}
              {isCompleted && (
                <div className="flex border-b border-gray-200">
                  {["comments", "summary"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-sm font-medium capitalize ${
                        activeTab === tab
                          ? "border-b-2 border-[#103C8C] text-[#103C8C]"
                          : "text-gray-500 hover:text-[#103C8C]"
                      }`}
                    >
                      {tab === "comments" ? "Final Comments" : "Programme Summary"}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="p-6">
                {activeTab === "comments" && (
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write the Comments here..."
                    disabled={isCompleted}
                    className="w-full h-[260px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#103C8C] disabled:bg-gray-100"
                  />
                )}

                {isCompleted && activeTab === "summary" && (
                  <div className="text-sm text-gray-700">
                    <p className="mb-2 font-medium">Programme Completion Summary:</p>
                    <p>
                      The participant has successfully completed all phases of the
                      Revitalization Programme. Review comments have been recorded.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isCompleted && (
                <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 bg-white p-5 flex justify-end gap-4">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="border border-[#103C8C] text-[#103C8C] text-[13px] font-medium px-6 py-[6px] rounded-md hover:bg-[#F5F8FF] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[13px] font-medium px-8 py-[6px] rounded-md transition"
                  >
                    Mark Programme as Completed
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ✅ SUCCESS POPUP */}
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-5 flex items-center gap-3">
              <div className="text-green-600 text-2xl">✔</div>
              <p className="text-[#0B1C58] font-medium text-[15px]">
                This programme has been marked as Completed
              </p>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}

/* RoadmapCard unchanged */
function RoadmapCard({ img, title, desc, status, statusColor, progress, completed, time }: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <div className="w-1/3">
          <Image src={img} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-5">
          <h4 className="text-[15px] font-semibold mb-1">{title}</h4>
          <p className="text-[13px] text-[#6B7280] mb-3">{desc}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[#6B7280] font-medium">Status</span>
            <span className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${statusColor}`}>
              {status}
            </span>
          </div>
          <p className="text-[12px] text-[#6B7280] mb-1">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div
              className="h-[6px] bg-[#16A34A] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[12px] text-[#0B1C58] font-medium mb-2">{completed}</p>
          <p className="text-[12px] text-[#6B7280]">
            Completion Time <span className="font-semibold text-[#0B1C58]">{time}</span>
          </p>
          <div className="flex justify-end mt-4">
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
