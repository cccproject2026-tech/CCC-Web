"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function InactiveMemberList() {
  const [activeTab, setActiveTab] = useState("overview");
  const [meeting1Date, setMeeting1Date] = useState("");
  const [meeting1Count, setMeeting1Count] = useState("");
  const [meeting2Date, setMeeting2Date] = useState("");
  const [meeting2Count, setMeeting2Count] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // ✅ Show popup when submit is clicked
  const handleSubmit = (meeting: string) => {
    console.log(`${meeting} submitted`);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000); // auto-hide after 2s
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] relative">
      <PastorHeader showFullHeader={true} />

      {/* ---------- HERO SECTION ---------- */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Community Revitalization and Multiplication Phase
            </span>{" "}
            &gt; Inactive Member List
          </p>
          <h1 className="text-3xl font-semibold mb-1">Inactive Member List</h1>
          <p className="text-white/70 text-sm">Completion Time Months 10 – 12</p>
        </div>
      </section>

      {/* ---------- MAIN SECTION ---------- */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 h-fit">
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
                {/* Header */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
                <hr className="border-t border-white/40 mb-8" />

                {/* Church Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Church Roadmap</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90">
                    Develop an inactive member list
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90">
                    Input a meeting date that the inactive member list was reviewed
                  </div>
                </div>

                {/* Meeting 1 */}
                <div className="bg-[#0F4A85]/60 rounded-lg p-6 mb-6 border border-[#5A8DCB]/60">
                  <h3 className="text-base font-semibold mb-3">Meeting 1</h3>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Date</label>
                    <input
                      type="date"
                      value={meeting1Date}
                      onChange={(e) => setMeeting1Date(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Inactive Members</label>
                    <input
                      type="text"
                      placeholder="Submit Number of Inactive Members..."
                      value={meeting1Count}
                      onChange={(e) => setMeeting1Count(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmit("Meeting 1")}
                      className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-[6px] rounded-md shadow-sm"
                    >
                      Submit
                    </button>
                  </div>
                </div>

                {/* Meeting 2 */}
                <div className="bg-[#0F4A85]/60 rounded-lg p-6 border border-[#5A8DCB]/60">
                  <h3 className="text-base font-semibold mb-3">Meeting 2</h3>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Date</label>
                    <input
                      type="date"
                      value={meeting2Date}
                      onChange={(e) => setMeeting2Date(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm mb-1">Inactive Members</label>
                    <input
                      type="text"
                      placeholder="Submit Number of Inactive Members..."
                      value={meeting2Count}
                      onChange={(e) => setMeeting2Count(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white placeholder-white/70 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSubmit("Meeting 2")}
                      className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-[6px] rounded-md shadow-sm"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Other Tabs */}
            {activeTab !== "overview" && (
              <div className="text-white/70 text-sm mt-10">Under Construction</div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ Popup (Task Completed) */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F4A85] px-8 py-5 rounded-xl shadow-lg flex items-center gap-3 fade-in">
            <div className="bg-[#3DBE72] text-white w-6 h-6 flex items-center justify-center rounded-full">
              <i className="fa-solid fa-check text-xs"></i>
            </div>
            <p className="font-medium text-[15px]">Task Completed</p>
          </div>
        </div>
      )}

    
    </div>
  );
}
