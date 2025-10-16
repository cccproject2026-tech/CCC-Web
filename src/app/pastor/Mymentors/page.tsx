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
        className="relative bg-cover bg-center text-white h-[300px] flex items-end pb-16 px-20"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#001845]/80 via-[#0B2E72]/70 to-[#1A4A9A]/90"></div>
        <h1 className="relative z-10 text-3xl font-semibold">My Mentors</h1>
      </section>

      {/* --- Main Content --- */}
      <main className="flex-1 bg-[#1c578e] px-16 py-10 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Search + Toggle */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center bg-white rounded-lg shadow-sm px-4 py-2 w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass text-gray-400 mr-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="flex-1 text-sm text-gray-700 outline-none"
              />
            </div>

            <button
              onClick={() => setIsListView(!isListView)}
              className="ml-4 w-9 h-9 flex items-center justify-center bg-white rounded-md shadow hover:bg-[#F5F8FF] transition"
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
          <div className="flex flex-wrap items-center gap-6 mb-10">
            {[Mentor1, Mentor2, Mentor3].map((avatar, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-[72px] h-[72px] rounded-full border-[3px] border-[#9C7CFF] p-[2px] hover:border-[#103C8C] transition">
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[20px] font-semibold text-white">
              Current Mentors
            </h2>
            <a
              href="#"
              className="text-[#BFD4FF] text-sm font-medium hover:underline"
            >
              See all
            </a>
          </div>

          {/* Mentor Cards (Grid / List) */}
          <div
            className={`${
              isListView
                ? "flex flex-col gap-5"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            }`}
          >
            {mentors.map((mentor, i) =>
              isListView ? (
                <div
                  key={i}
                  onClick={() => setSelectedMentor(mentor)}
                  className="cursor-pointer bg-white rounded-xl flex items-center justify-between p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <Image
                      src={mentor.img}
                      alt={mentor.name}
                      className="w-[70px] h-[70px] object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-[16px]">
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
                    <button className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-white/80 rounded-full text-[#0B1C58] hover:bg-white shadow">
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
        <div className="fixed top-0 right-0 w-[420px] h-full bg-white shadow-2xl z-50 overflow-y-auto animate-slide-left">
          <div className="flex justify-between items-center p-4 border-b bg-[#F7FAFF]">
            <h3 className="font-semibold text-lg text-[#103C8C]">
              Mentor Details
            </h3>
            <button
              onClick={() => setSelectedMentor(null)}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-full"
            >
              <i className="fa-solid fa-xmark text-gray-600"></i>
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-5">
              <Image
                src={selectedMentor.img}
                alt={selectedMentor.name}
                className="w-[80px] h-[80px] rounded-lg object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-900 text-[17px]">
                  {selectedMentor.name}
                </h4>
                <p className="text-sm text-gray-500">{selectedMentor.role}</p>
                <div className="flex gap-3 mt-2 text-[#103C8C] text-[15px]">
                  <i className="fa-regular fa-envelope cursor-pointer"></i>
                  <i className="fa-regular fa-comment cursor-pointer"></i>
                  <i className="fa-solid fa-phone cursor-pointer"></i>
                  <i className="fa-brands fa-whatsapp cursor-pointer"></i>
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Profile Information
              </p>
              <textarea
                rows={3}
                placeholder="Enter details..."
                className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-700 resize-none focus:ring-1 focus:ring-[#103C8C]"
              />
            </div>

            {/* Schedule a Meeting */}
            <div>
              <p className="text-sm text-gray-600 font-medium mb-2 flex items-center gap-2">
                <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                Schedule a Meeting
              </p>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">
                  Select Available Date
                </p>

                {/* Calendar UI */}
                <div className="bg-[#103C8C] text-white rounded-md overflow-hidden">
                  <div className="flex justify-between items-center px-4 py-2 bg-[#0D3170]">
                    <button className="hover:opacity-80">
                      <i className="fa-solid fa-chevron-left text-sm"></i>
                    </button>
                    <p className="text-sm font-medium">August 2024</p>
                    <button className="hover:opacity-80">
                      <i className="fa-solid fa-chevron-right text-sm"></i>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 text-center text-xs py-2 font-medium">
                    <span>S</span>
                    <span>M</span>
                    <span>T</span>
                    <span>W</span>
                    <span>T</span>
                    <span>F</span>
                    <span>S</span>
                  </div>

                  <div className="grid grid-cols-7 text-center text-sm pb-4 gap-y-2">
                    {[...Array(31)].map((_, i) => (
                      <span
                        key={i}
                        className={`cursor-pointer ${
                          i + 1 === 4
                            ? "bg-white text-[#103C8C] font-semibold rounded-full w-6 h-6 mx-auto flex items-center justify-center"
                            : "opacity-90 hover:bg-white/20 rounded-full w-6 h-6 mx-auto flex items-center justify-center"
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
