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
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
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
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 pb-24 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">

          {/* LEFT PANEL */}
          <div className="h-fit w-full rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur flex flex-col gap-2">
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
                    ? "bg-white text-[#0f4a76] shadow-sm"
                    : "bg-transparent text-[#d9ebf8] hover:bg-white/15"
                }`}
              >
                {item.label}
                {item.count && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-[1px] ${
                      activeTab === item.key
                        ? "bg-white/20 text-white"
                        : "border border-white/20 bg-white/10 text-white"
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
                  <button className="flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-white/10 text-[#d9ebf8] hover:bg-white/15">
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
               
                    <button className="absolute ml-170 mt-25 rounded-md bg-white px-6 py-2 text-sm font-semibold text-[#0f4a76] shadow-md transition hover:bg-[#e7f1fa]">
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
