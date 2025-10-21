"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png"; // 🖼 replace with correct hero image
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function DoorwayEvents() {
  const [activeTab, setActiveTab] = useState("overview");
  const [event1Date, setEvent1Date] = useState("");
  const [event2Date, setEvent2Date] = useState("");
  const [event3Date, setEvent3Date] = useState("");

  const handleSubmit = () => {
    console.log("Submitted doorway events data");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Community Revitalization and Multiplication Phase
            </span>{" "}
            &gt; Doorway Events
          </p>

          <h1 className="text-3xl font-semibold mb-1">Doorway Events</h1>
          <p className="text-white/70 text-sm">
            Completion Time Months 10 – 12
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">

          {/* LEFT SIDEBAR */}
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
            {activeTab === "overview" && (
              <>
                {/* HEADER */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
                <hr className="border-t border-white/40 mb-8" />

                {/* CHURCH ROADMAP */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Church Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Invite inactive members
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Schedule at least 3 intentional “doorway” events on your
                    church calendar and invite inactive members to attend
                  </div>
                </div>

                {/* DATE FIELDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm mb-1">Date of Event 1</label>
                    <div className="relative">
                      <i className="fa-regular fa-calendar absolute left-3 top-2.5 text-white/70 text-sm"></i>
                      <input
                        type="date"
                        value={event1Date}
                        onChange={(e) => setEvent1Date(e.target.value)}
                        className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-8 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm mb-1">Date of Event 2</label>
                    <div className="relative">
                      <i className="fa-regular fa-calendar absolute left-3 top-2.5 text-white/70 text-sm"></i>
                      <input
                        type="date"
                        value={event2Date}
                        onChange={(e) => setEvent2Date(e.target.value)}
                        className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-8 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[48%] mb-8">
                  <label className="block text-sm mb-1">Date of Event 3</label>
                  <div className="relative">
                    <i className="fa-regular fa-calendar absolute left-3 top-2.5 text-white/70 text-sm"></i>
                    <input
                      type="date"
                      value={event3Date}
                      onChange={(e) => setEvent3Date(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-8 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-8 py-[8px] rounded-md shadow-sm"
                  >
                    Submit
                  </button>
                </div>
              </>
            )}

            {/* COMMENTS & QUERIES PLACEHOLDER */}
            {activeTab !== "overview" && (
              <div className="text-white/70 text-sm mt-10">
                Under Construction
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
