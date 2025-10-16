"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/jumpstart-hero.png"; // Replace with correct hero image
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function MentoringRoadmapPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        {/* <p className="text-xs text-white/80 absolute mt-10">
            Revitalization Roadmap &gt; Self Revitalization Phase &gt;{" "}
            <span className="text-white font-medium">
              12-Month Mentoring Revitalization Roadmap Approval
            </span>
          </p> */}
        <div className="relative z-10">
          
          <h1 className="text-3xl font-semibold mb-1">
            12-Month Mentoring<br/>
             Revitalization Roadmap Approval
          </h1>
          <p className="text-white/70 text-sm">
            Completion Time Months 1 – 2
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">

          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-fit">
            {[
              { key: "overview", label: "Over View" },
              { key: "comments", label: "Comments", count: 2 },
              { key: "queries", label: "Queries", count: 3 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex justify-between items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "bg-[#103C8C] text-white shadow-sm"
                    : "bg-[#F8FAFF] text-gray-600 hover:bg-[#E9EEFF]"
                }`}
              >
                {item.label}
                {item.count && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-[1px] ${
                      activeTab === item.key
                        ? "bg-white/20 text-white"
                        : "bg-white border border-[#D0DAF9] text-[#103C8C]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>

                {/* Roadmap Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Roadmap</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Sign 12-Month Revitalization Roadmap
                  </div>
                </div>

                {/* Description Section */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    12-Month Revitalization Roadmap for pastoral mentoring and church growth
                  </div>
                </div>

                {/* Link Section */}
                <div className="mb-6">
                  <a
                    href="#"
                    className="text-[13px] text-white underline underline-offset-2 hover:text-[#FFD84E]"
                  >
                    VIEW 12 MONTHS MENTORING TIMELINE MONTHS
                  </a>
                </div>

                {/* Agreement Checkbox + Signature */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mt-8">
                  <label className="flex items-start text-[13px] text-white/90 gap-2 leading-tight">
                    <input
                      type="checkbox"
                      className="mt-[3px] accent-[#103C8C]"
                    />
                    <span>
                      I agree to participate in the 12-month revitalization mentoring and church growth roadmap provided by The Center for Community Change
                    </span>
                  </label>
               
                    <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-2 rounded-md shadow-md absolute mt-25 ml-170">
                    Signature Required here
                  </button>
                </div>

                <div></div>
              </>
            )}

            {/* COMMENTS & QUERIES (reuse your previous logic) */}
            {activeTab !== "overview" && (
              <div className="text-white/70 text-sm mt-10">
                {/* Placeholder for comments/queries reuse from your JumpStartPage */}
                Under Construction
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
