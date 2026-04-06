"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Image from "next/image";

export default function AssignMentorsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("mentors");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("least-mentees");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedMentors, setSelectedMentors] = useState([]);

  // Dummy data for mentors
  const mentors = [
    {
      id: 1,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 5,
    },
    {
      id: 2,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 8,
    },
    {
      id: 3,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 12,
    },
    {
      id: 4,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 15,
    },
    {
      id: 5,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 24,
    },
    {
      id: 6,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 10,
    },
    {
      id: 7,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 18,
    },
    {
      id: 8,
      name: "John Doe",
      role: "Mentor",
      image: Mentor1,
      menteeCount: 22,
    },
  ];

  // Filter mentors based on active tab
  const filteredMentors = mentors.filter((mentor) => {
    if (activeTab === "all") return true;
    if (activeTab === "mentors") return mentor.role === "Mentor";
    if (activeTab === "field-mentor") return mentor.role === "Field Mentor";
    return true;
  });

  // Filter by search query
  const searchedMentors = filteredMentors.filter((mentor) =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort mentors
  const sortedMentors = [...searchedMentors].sort((a, b) => {
    if (sortBy === "least-mentees") return a.menteeCount - b.menteeCount;
    if (sortBy === "most-mentees") return b.menteeCount - a.menteeCount;
    return 0;
  });

  const handleToggleSelect = (mentorId) => {
    if (selectedMentors.includes(mentorId)) {
      setSelectedMentors(selectedMentors.filter((id) => id !== mentorId));
    } else {
      setSelectedMentors([...selectedMentors, mentorId]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Assign Mentors" backgroundImageUrl={MentorBg.src} />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search, Filter, and Sort Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-4 border border-gray-200 border-dashed">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "all"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("mentors")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "mentors"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Mentors
                </button>
                <button
                  onClick={() => setActiveTab("field-mentor")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "field-mentor"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Field Mentor
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-6 py-3 pr-10 text-gray-700 font-semibold text-[14px] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="least-mentees">
                    Sort By: Least Number of Mentees
                  </option>
                  <option value="most-mentees">
                    Sort By: Most Number of Mentees
                  </option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>

              {/* View Toggle */}
              <button
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
                className="px-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all"
              >
                <i className="fa-solid fa-th-large text-lg"></i>
              </button>
            </div>
          </div>

          {/* Selection Bar */}
          {selectedMentors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 border border-gray-200 border-dashed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[15px] font-semibold text-gray-700">
                    {selectedMentors.length}{" "}
                    {selectedMentors.length === 1 ? "Mentor" : "Mentors"}{" "}
                    Selected
                  </span>
                  <button
                    onClick={() => setSelectedMentors([])}
                    className="text-[14px] text-[#2E3B8E] hover:text-[#1F2A6E] font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => router.push("/director/interest-list")}
                    className="px-5 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                  >
                    Assign Selected
                  </button>
                  <button className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-[14px] font-semibold hover:bg-red-700 transition-all">
                    Remove Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mentor Cards Grid/List */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {sortedMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all relative"
                >
                  {/* Checkbox */}
                  <div className="absolute top-4 right-4">
                    <input
                      type="checkbox"
                      checked={selectedMentors.includes(mentor.id)}
                      onChange={() => handleToggleSelect(mentor.id)}
                      className="w-5 h-5 cursor-pointer accent-[#2E3B8E]"
                    />
                  </div>

                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={mentor.image}
                        alt={mentor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Name and Role */}
                  <div className="text-center mb-3">
                    <h3 className="text-[17px] font-bold text-gray-900 mb-1">
                      {mentor.name}
                    </h3>
                    <p className="text-[14px] text-gray-600">{mentor.role}</p>
                  </div>

                  {/* Mentee Count Badge */}
                  <div className="flex justify-center mb-3">
                    <span className="inline-block px-3 py-1.5 bg-yellow-100 text-[#2E3B8E] rounded-full text-[12px] font-bold">
                      {mentor.menteeCount} Mentees
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-gray-600 text-center">
                    Sub text area write something here. That you can read more
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-xl shadow-lg p-5 hover:shadow-xl transition-all relative flex items-center gap-5"
                >
                  {/* Checkbox */}
                  <div>
                    <input
                      type="checkbox"
                      checked={selectedMentors.includes(mentor.id)}
                      onChange={() => handleToggleSelect(mentor.id)}
                      className="w-5 h-5 cursor-pointer accent-[#2E3B8E]"
                    />
                  </div>

                  {/* Profile Image */}
                  <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={mentor.image}
                      alt={mentor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-[17px] font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      <span className="text-[14px] text-gray-600">
                        • {mentor.role}
                      </span>
                    </div>
                    <p className="text-[13px] text-gray-600 mb-2">
                      Sub text area write something here. That you can read more
                    </p>
                    <span className="inline-block px-3 py-1 bg-yellow-100 text-[#2E3B8E] rounded-full text-[12px] font-bold">
                      {mentor.menteeCount} Mentees
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {sortedMentors.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl shadow-xl p-12">
              <i className="fa-solid fa-search text-gray-300 text-6xl mb-4"></i>
              <p className="text-gray-500 text-[16px]">No mentors found</p>
            </div>
          )}
        </div>
      </section>    </div>
  );
}
