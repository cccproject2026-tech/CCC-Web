"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import AppHero from "@/app/Components/AppHero";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";

export default function JumpStartPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const descriptionPoints = [
    "Christ Method Alone (Why & How)",
    "Self-Leadership",
    "Dealing with Resistance",
    "Empower Others-Spiritual Renewal",
    "Community Engagement - Need Assessments",
    "Cycle of Evangelism & Discipleship",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section with Breadcrumbs */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${JumpStartBg.src})` }}
      >
        {/* Minimal overlay - no blur */}
        <div className="absolute inset-0 bg-[#1A2E5C]/60"></div>
        <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-8 pb-10 flex flex-col h-[280px]">
          {/* Breadcrumbs - Top */}
          <div className="text-sm text-white/80 mb-2">
            <span>Pastor&apos;s Roadmaps</span>
            <span className="mx-2">&gt;</span>
            <span>John Ross</span>
            <span className="mx-2">&gt;</span>
            <span>Revitalization Roadmap</span>
            <span className="mx-2">&gt;</span>
            <span className="font-semibold">Jump Start</span>
          </div>

          {/* Title and Status - Bottom aligned */}
          <div className="mt-auto">
            <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold leading-tight mb-3">
              Jump Start
            </h1>
            <div className="flex items-center gap-4">
              <span className="bg-[#4CAF50] text-white px-4 py-1.5 rounded-lg text-sm font-semibold">
                Completed
              </span>
              <span className="text-white/90 text-sm">
                Completed on 20 Oct 2024
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Module Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#2E3B8E] text-white px-6 py-4 font-bold">
                  Over View
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === "overview"
                        ? "bg-[#2E3B8E] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Over View
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
                      activeTab === "comments"
                        ? "bg-[#2E3B8E] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>Comments</span>
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      2
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("queries")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
                      activeTab === "queries"
                        ? "bg-[#2E3B8E] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span>Queries</span>
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      3
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-[#2E3B8E] text-2xl font-bold">
                    Over View
                  </h2>
                  <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                    <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                  </button>
                </div>

                {/* Roadmap Section */}
                <div className="mb-6">
                  <label className="block text-[#2E3B8E] font-bold text-sm mb-2">
                    Roadmap
                  </label>
                  <input
                    type="text"
                    value="Attend a Jump-start Session in your area."
                    readOnly
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 bg-gray-50 focus:outline-none focus:border-[#2E3B8E]"
                  />
                </div>

                {/* Description Section */}
                <div className="mb-6">
                  <label className="block text-[#2E3B8E] font-bold text-sm mb-4">
                    Description
                  </label>
                  <ol className="space-y-2 list-decimal list-inside">
                    {descriptionPoints.map((point, index) => (
                      <li
                        key={index}
                        className="text-gray-700 text-base leading-relaxed"
                      >
                        {point}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Notes Section */}
                <div className="mb-6">
                  <label className="block text-[#2E3B8E] font-bold text-sm mb-2">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Write Your Notes here..."
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#2E3B8E] resize-none"
                  />
                </div>

                {/* Session Date Section */}
                <div>
                  <label className="block text-[#2E3B8E] font-bold text-sm mb-2">
                    Session Date
                  </label>
                  <div className="relative">
                    <i className="fa-solid fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                    <input
                      type="text"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      onFocus={(e) => (e.target.type = "date")}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          e.target.type = "text";
                        }
                      }}
                      placeholder="Select Date"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:border-[#2E3B8E]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
