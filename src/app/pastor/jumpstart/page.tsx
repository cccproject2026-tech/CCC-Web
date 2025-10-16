"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import User1 from "@/app/Assets/user-profile.png";
import User2 from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function JumpStartPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [queryTab, setQueryTab] = useState("New");

  const comments = [
    {
      name: "John Doe",
      role: "Mentor",
      time: "9:41 am",
      text: "Needs improvement. Refer XYZ document",
      avatar: User1,
    },
    {
      name: "Robin Roe",
      role: "Project Manager",
      time: "Yesterday",
      text: "No need to spend time researching this area. Focus on the other sub group.",
      avatar: User2,
    },
    {
      name: "Robin Roe",
      role: "Project Manager",
      time: "Yesterday",
      text: "No need to spend time researching this area. Focus on the other sub group.",
      avatar: User2,
    },
    {
      name: "Robin Roe",
      role: "Mentor",
      time: "10/11/2024",
      text: "Needs improvement. Refer XYZ document",
      avatar: User2,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <p className="text-sm text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white">Jump Start</span>
          </p>
          <h1 className="text-3xl font-semibold">Jump Start</h1>
          <p className="text-white/70 text-sm mt-1">
            Completion Time Months 1 – 2
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-[220px]">
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
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="text-white/80 hover:text-white text-sm">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>

                <div className="bg-[#1070A9]/70 rounded-lg p-4 mb-4 border border-[#3B8CC2]">
                  <h3 className="text-sm font-semibold text-white mb-2">
                    Roadmap
                  </h3>
                  <p className="bg-[#22A0CA]/50 text-white text-sm px-4 py-2 rounded-md">
                    Attend a Jump-start Session in your area
                  </p>
                </div>

                <div className="bg-[#1070A9]/70 rounded-lg p-4 mb-4 border border-[#3B8CC2]">
                  <h3 className="text-sm font-semibold text-white mb-3">
                    Description
                  </h3>
                  <ul className="list-decimal list-inside text-sm space-y-1 text-white/90">
                    <li>Christ Method Alone (Why &amp; How)</li>
                    <li>Self-Leadership</li>
                    <li>Dealing with Resistance</li>
                    <li>Empower Others – Spiritual Renewal</li>
                    <li>Community Engagement – Need Assessments</li>
                    <li>Cycle of Evangelism &amp; Discipleship</li>
                  </ul>
                </div>

                <div className="rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-semibold text-white mb-3">Notes</h3>
                  <textarea
                    placeholder="Write Your Notes here..."
                    className="w-full rounded-md bg-transparent border border-[#52A1D1] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-20"
                  ></textarea>
                </div>

                <div className="flex items-center justify-between gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <i className="fa-regular fa-calendar text-white/80 text-sm"></i>
                    <input
                      type="text"
                      readOnly
                      value="10 Nov 2024"
                      className="bg-transparent border border-[#52A1D1] text-sm text-white px-3 py-2 rounded-md focus:outline-none w-[180px]"
                    />
                  </div>

                  <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-6 py-2 rounded-md shadow">
                    Jump-start Completed
                  </button>
                </div>
              </>
            )}

            {activeTab === "comments" && (
              <>
                <h2 className="text-xl font-semibold mb-6">Comments</h2>
                <div className="space-y-4">
                  {comments.map((c, i) => (
                    <div
                      key={i}
                      className="bg-white text-gray-800 rounded-lg shadow-sm p-4 flex justify-between items-start"
                    >
                      <div className="flex gap-3">
                        <Image
                          src={c.avatar}
                          alt={c.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{c.name}</h4>
                            <span className="text-xs text-gray-400">{c.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-1">{c.role}</p>
                          <p className="text-sm">{c.text}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="flex gap-4 text-[#103C8C] text-sm">
                          <i className="fa-regular fa-envelope cursor-pointer"></i>
                          <i className="fa-regular fa-comment cursor-pointer"></i>
                          <i className="fa-solid fa-phone cursor-pointer"></i>
                          <i className="fa-brands fa-whatsapp cursor-pointer"></i>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

  {activeTab === "queries" && (
  <>
    <h2 className="text-[20px] font-semibold mb-4 border-b border-white/30 pb-2">
      Queries
    </h2>

    {/* Filter Tabs */}
    <div className="flex justify-end mb-5">
      <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
        {["New", "Answered", "Pending"].map((tab) => (
          <button
            key={tab}
            onClick={() => setQueryTab(tab)}
            className={`px-6 py-[7px] text-sm font-medium transition-all duration-200
              ${
                queryTab === tab
                  ? "bg-[#103C8C] text-white m-2"
                  : "bg-white text-gray-500 hover:text-[#103C8C]"
              }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>

    {/* Query Section */}
    {queryTab === "New" && (
      <div className="rounded-xl p-6">
        <p className="text-[15px] font-semibold mb-2">
          Submit your question here.
        </p>

        <div className="relative">
          <textarea
            placeholder="Write Your Questions..."
            className="w-full rounded-md bg-transparent border border-[#7FB6EA] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-28 mb-2"
          ></textarea>

          <span className="text-xs text-white/60 absolute bottom-4 right-4">
            (250 Words)
          </span>
        </div>

        <div className="flex justify-end mt-4">
          <button className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-8 py-[6px] rounded-md border border-[#2C57A6] shadow-sm">
            Submit
          </button>
        </div>
      </div>
    )}

    {queryTab === "Answered" && (
      <div className="space-y-8 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="border-b border-white/20 pb-6">
            {/* User Message */}
            <div className="flex items-start gap-3 mb-3">
              <Image
                src={User1}
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm">Me</h4>
                <p className="text-xs text-white/70 mb-1">22/09/2024</p>
                <p className="text-sm text-white/90">
                  Is it possible for you to get me a letter stating that my
                  volunteering is part of this course to submit to my church
                  committee?
                </p>
              </div>
            </div>

            {/* Mentor Reply */}
            <div className="ml-11 bg-[#325C9C]/50 rounded-lg p-4 w-[90%]">
              <div className="flex items-start gap-3">
                <Image
                  src={User2}
                  alt="Mentor"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-semibold text-sm">John Doe</h4>
                  <p className="text-xs text-white/70 mb-1">22/09/2024</p>
                  <p className="text-xs text-white/70 mb-2">Mentor</p>
                  <p className="text-sm text-white/90">
                    I do not have the authority to do that. Please contact
                    Project Manager
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}

    {queryTab === "Pending" && (
      <div className="space-y-8 mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="border-b border-white/20 pb-6">
            {/* User Message */}
            <div className="flex items-start gap-3 mb-3">
              <Image
                src={User1}
                alt="User"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-sm">Me</h4>
                <p className="text-xs text-white/70 mb-1">12/09/2024</p>
                <p className="text-sm text-white/90">
                  Is it possible for you to get me a letter stating that my
                  volunteering is part of this course to submit to my church
                  committee?
                </p>
              </div>
            </div>

            {/* Waiting for Response */}
            <div className="ml-11 bg-[#325C9C]/50 rounded-lg p-4 w-[90%] flex items-center gap-2">
              <i className="fa-solid fa-spinner animate-spin text-white/70 text-sm"></i>
              <p className="text-sm text-white/80">Waiting for response</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
)}


          </div>
        </div>
      </main>

      <PastorFooter />
    </div>
  );
}
