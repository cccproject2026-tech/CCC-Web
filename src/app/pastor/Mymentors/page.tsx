"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function Mymentors() {
  const [isListView, setIsListView] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<any | null>(null);

  const mentors = [
    { img: Mentor1, name: "John Doe", role: "Mentor" },
    { img: Mentor2, name: "Jacob Jones", role: "Field Mentor" },
    { img: Mentor3, name: "Robert Fox", role: "Mentor" },
    { img: Mentor1, name: "John Doe", role: "Mentor" },
    { img: Mentor2, name: "Jacob Jones", role: "Field Mentor" },
    { img: Mentor3, name: "Robert Fox", role: "Mentor" },
  ];

  return (
    <div className="min-h-screen flex flex-col relative">
      <PastorHeader showFullHeader={true} />

      {/* --- Hero Section --- */}
      <section
        className="relative bg-cover bg-center text-white h-[250px] md:h-[300px] flex items-end pb-8 md:pb-16 px-4 md:px-8 lg:px-20"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#001845]/80 via-[#0B2E72]/70 to-[#1A4A9A]/90"></div>
        <h1 className="relative z-10 text-2xl sm:text-3xl font-semibold">
          My Mentors
        </h1>
      </section>

      {/* --- Main Content --- */}
      <main className="flex-1 bg-[#1c578e] px-4 md:px-8 lg:px-16 py-6 md:py-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Search + Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-10 gap-4">
            <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2 w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 text-sm text-gray-700 outline-none"
                suppressHydrationWarning
              />
            </div>

            <button
              onClick={() => setIsListView(!isListView)}
              className="w-9 h-9 flex items-center justify-center bg-white rounded-md shadow hover:bg-[#F5F8FF] transition self-start sm:self-center shrink-0"
              suppressHydrationWarning
            >
              <i
                className={`${
                  isListView
                    ? "fa-solid fa-border-all text-[#103C8C]"
                    : "fa-solid fa-list text-[#103C8C]"
                } text-lg`}
              ></i>
            </button>
          </div>

          {/* Mentor Avatars */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-6 md:mb-10">
            {[Mentor1, Mentor2, Mentor3].map((avatar, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] rounded-full border-[3px] border-[#9C7CFF] p-[2px] hover:border-[#103C8C] transition">
                  <Image
                    src={avatar}
                    alt="mentor"
                    className="rounded-full w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-white mt-1">John Doe</p>
              </div>
            ))}
          </div>

          {/* Current Mentors */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-2">
            <h2 className="text-[20px] font-semibold text-white">
              Current Mentors
            </h2>
            <a
              href="#"
              className="text-[#BFD4FF] text-sm font-medium hover:underline self-start"
            >
              See all
            </a>
          </div>

          {/* Mentor Cards (Grid / List) */}
          <div
            className={`${
              isListView
                ? "flex flex-col gap-4 sm:gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
            }`}
          >
            {mentors.map((mentor, i) =>
              isListView ? (
                <div
                  key={i}
                  onClick={() => setSelectedMentor(mentor)}
                  className="cursor-pointer bg-white rounded-xl flex flex-col sm:flex-row sm:items-center justify-between p-4 shadow-sm hover:shadow-md transition gap-4 sm:gap-0"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={mentor.img}
                      alt={mentor.name}
                      className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-[16px] truncate">
                        {mentor.name}
                      </h4>
                      <p className="text-sm text-gray-500">{mentor.role}</p>
                      <p className="text-[13px] text-gray-400 leading-snug">
                        Sub text area write something here. That you can read
                        more
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={i}
                  onClick={() => setSelectedMentor(mentor)}
                  className="cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                >
                  <div className="relative">
                    <Image
                      src={mentor.img}
                      alt={mentor.name}
                      className="w-full h-[180px] object-cover"
                    />
                    <button
                      className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full text-[#0B1C58] hover:bg-white shadow"
                      suppressHydrationWarning
                    >
                      <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
                    </button>
                  </div>
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 text-[16px] mb-1">
                      {mentor.name}
                    </h4>
                    <p className="text-sm text-gray-500">{mentor.role}</p>
                    <p className="text-[13px] text-gray-400 mt-2 leading-snug">
                      Sub text area write something here.
                      <br />
                      That you can read more
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </main>

      {/* --- Overlay Background --- */}
      {selectedMentor && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSelectedMentor(null)}
        ></div>
      )}

      {/* --- Sidebar Mentor Details --- */}
      {selectedMentor && (
        <div className="fixed inset-0 md:top-0 md:right-0 md:left-auto md:bottom-auto w-full md:w-[420px] h-full bg-white shadow-2xl z-50 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-[#F7FAFF] border-b z-10">
            <div className="flex justify-between items-center p-4">
              <h3 className="font-semibold text-base md:text-lg text-[#103C8C]">
                Mentor Details
              </h3>
              <button
                onClick={() => setSelectedMentor(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full flex-shrink-0"
                suppressHydrationWarning
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 pb-safe">
            {/* Profile Section */}
            <div className="flex flex-col items-center md:flex-row md:items-start gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <Image
                src={selectedMentor.img}
                alt={selectedMentor.name}
                className="w-[80px] h-[80px] md:w-[70px] md:h-[70px] rounded-lg object-cover flex-shrink-0"
              />
              <div className="text-center md:text-left w-full">
                <h4 className="font-semibold text-gray-900 text-lg md:text-[17px] mb-1">
                  {selectedMentor.name}
                </h4>
                <p className="text-sm text-gray-500 mb-3">{selectedMentor.role}</p>
                <div className="flex gap-4 justify-center md:justify-start text-[#103C8C] text-lg">
                  <i className="fa-regular fa-envelope cursor-pointer hover:text-[#0B2E72] transition p-2 hover:bg-blue-50 rounded-full"></i>
                  <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B2E72] transition p-2 hover:bg-blue-50 rounded-full"></i>
                  <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B2E72] transition p-2 hover:bg-blue-50 rounded-full"></i>
                  <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B2E72] transition p-2 hover:bg-blue-50 rounded-full"></i>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 text-gray-700">
                Profile Information
              </p>
              <textarea
                rows={4}
                placeholder="Enter details..."
                className="w-full border border-gray-300 rounded-md p-3 text-sm text-gray-700 resize-none focus:ring-2 focus:ring-[#103C8C] focus:border-transparent"
                suppressHydrationWarning
              />
            </div>

            {/* Schedule a Meeting */}
            <div>
              <p className="text-sm font-medium mb-3 flex items-center gap-2 text-gray-700">
                <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                Schedule a Meeting
              </p>

              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">
                  Select Available Date
                </p>

                {/* Calendar UI */}
                <div className="bg-[#103C8C] text-white rounded-lg overflow-hidden shadow-sm">
                  <div className="flex justify-between items-center px-4 py-3 bg-[#0D3170]">
                    <button
                      className="hover:opacity-80 p-1 rounded transition"
                      suppressHydrationWarning
                    >
                      <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <p className="text-sm font-medium">August 2024</p>
                    <button
                      className="hover:opacity-80 p-1 rounded transition"
                      suppressHydrationWarning
                    >
                      <i className="fa-solid fa-chevron-right text-sm"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center text-xs py-2 font-medium border-b border-white/20">
                    <span className="py-1">S</span>
                    <span className="py-1">M</span>
                    <span className="py-1">T</span>
                    <span className="py-1">W</span>
                    <span className="py-1">T</span>
                    <span className="py-1">F</span>
                    <span className="py-1">S</span>
                  </div>

                  <div className="grid grid-cols-7 text-center text-sm p-2 gap-1">
                    {[...Array(31)].map((_, i) => (
                      <span
                        key={i}
                        className={`cursor-pointer transition-all duration-200 ${
                          i + 1 === 4
                            ? "bg-white text-[#103C8C] font-semibold rounded-full w-8 h-8 mx-auto flex items-center justify-center shadow-sm"
                            : "opacity-90 hover:bg-white/20 rounded-full w-8 h-8 mx-auto flex items-center justify-center hover:scale-110"
                        }`}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PastorFooter />
    </div>
  );
}
