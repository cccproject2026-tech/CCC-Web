"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/AppHeader";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import MentorBg from "../../Assets/mentor-bg.png";

export default function InterestReceivedPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("state");
  const [selectedPastors, setSelectedPastors] = useState([]);

  // Dummy data for interests
  const interests = [
    {
      id: 1,
      name: "Robert Fox",
      role: "Pastor",
      status: "new",
      timestamp: "09:43 AM",
      date: "15 Nov 2024",
    },
    {
      id: 2,
      name: "Robert Fox",
      role: "Pastor",
      status: "new",
      timestamp: "09:43 AM",
      date: "15 Nov 2024",
    },
    {
      id: 3,
      name: "Robert Fox",
      role: "Pastor",
      status: "pending",
      timestamp: null,
      date: "15 Nov 2024",
    },
    {
      id: 4,
      name: "Robert Fox",
      role: "Pastor",
      status: "new",
      timestamp: null,
      date: "15 Nov 2024",
    },
    {
      id: 5,
      name: "Robert Fox",
      role: "Pastor",
      status: "new",
      timestamp: null,
      date: "15 Nov 2024",
    },
    {
      id: 6,
      name: "Robert Fox",
      role: "Pastor",
      status: "accepted",
      timestamp: null,
      date: "15 Nov 2024",
    },
    {
      id: 7,
      name: "Robert Fox",
      role: "Pastor",
      status: "new",
      timestamp: null,
      date: "15 Nov 2024",
    },
    {
      id: 8,
      name: "Robert Fox",
      role: "Pastor",
      status: "pending",
      timestamp: null,
      date: "15 Nov 2024",
    },
  ];

  // Filter interests based on active tab
  const filteredInterests = interests.filter((interest) => {
    if (activeTab === "all") return true;
    return interest.status === activeTab;
  });

  // Filter by search query
  const searchedInterests = filteredInterests.filter((interest) =>
    interest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Count interests by status
  const newCount = interests.filter((i) => i.status === "new").length;
  const pendingCount = interests.filter((i) => i.status === "pending").length;

  const handleToggleSelect = (pastorId) => {
    if (selectedPastors.includes(pastorId)) {
      setSelectedPastors(selectedPastors.filter((id) => id !== pastorId));
    } else {
      setSelectedPastors([...selectedPastors, pastorId]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Interest Received" backgroundImageUrl={MentorBg.src} />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search, Filter, and Sort Section */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-8 border border-gray-200 border-dashed">
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
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("new")}
                  className={`relative px-6 py-3 rounded-full font-semibold text-[14px] transition-all ${
                    activeTab === "new"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  New
                  {newCount > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                        activeTab === "new"
                          ? "bg-white text-[#2E3B8E]"
                          : "bg-[#FFD700] text-[#2E3B8E]"
                      }`}
                    >
                      {newCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`relative px-6 py-3 rounded-full font-semibold text-[14px] transition-all ${
                    activeTab === "pending"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Pending
                  {pendingCount > 0 && (
                    <span
                      className={`absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-bold ${
                        activeTab === "pending"
                          ? "bg-white text-[#2E3B8E]"
                          : "bg-[#FFD700] text-[#2E3B8E]"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("accepted")}
                  className={`px-6 py-3 rounded-full font-semibold text-[14px] transition-all ${
                    activeTab === "accepted"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300"
                  }`}
                >
                  Accepted
                </button>
              </div>

              {/* State Filter Dropdown */}
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="appearance-none bg-white border-2 border-gray-200 rounded-lg px-6 py-3 pr-10 text-gray-700 font-semibold text-[14px] focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="state">State</option>
                  <option value="usa">USA</option>
                  <option value="canada">Canada</option>
                  <option value="mexico">Mexico</option>
                  <option value="brazil">Brazil</option>
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
              </div>
            </div>
          </div>

          {/* Selection Bar */}
          {selectedPastors.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-4 mb-6 border border-gray-200 border-dashed">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-[15px] font-semibold text-gray-700">
                    {selectedPastors.length}{" "}
                    {selectedPastors.length === 1 ? "Pastor" : "Pastors"}{" "}
                    Selected
                  </span>
                  <button
                    onClick={() => setSelectedPastors([])}
                    className="text-[14px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear Selection
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-all">
                    Assign to Mentors
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interest Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchedInterests.map((interest) => (
              <div
                key={interest.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all relative"
              >
                {/* Checkbox */}
                <div className="absolute top-4 right-4">
                  <input
                    type="checkbox"
                    checked={selectedPastors.includes(interest.id)}
                    onChange={() => handleToggleSelect(interest.id)}
                    className="w-5 h-5 cursor-pointer accent-[#2E3B8E]"
                  />
                </div>

                {/* Header with Icon and Timestamp */}
                <div className="flex items-start justify-between mb-4 pr-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <i className="fa-solid fa-user text-blue-600 text-2xl"></i>
                  </div>
                  <span className="text-[13px] text-gray-500 font-medium">
                    {interest.timestamp || interest.date}
                  </span>
                </div>

                {/* Name and Role */}
                <div className="mb-4">
                  <h3 className="text-[17px] font-bold text-gray-900 mb-1">
                    {interest.name}
                  </h3>
                  <p className="text-[14px] text-gray-600">{interest.role}</p>
                </div>

                {/* Contact Icons and View Button */}
                <div className="flex items-center justify-between gap-4">
                  {/* Contact Icons */}
                  <div className="flex items-center gap-4 text-gray-500 text-[18px]">
                    <button
                      className="hover:text-blue-600 transition-colors"
                      aria-label="Email"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <i className="fa-regular fa-envelope"></i>
                    </button>
                    <button
                      className="hover:text-blue-600 transition-colors"
                      aria-label="Chat"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <i className="fa-regular fa-comment"></i>
                    </button>
                    <button
                      className="hover:text-blue-600 transition-colors"
                      aria-label="Call"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <i className="fa-solid fa-phone"></i>
                    </button>
                  </div>

                  {/* View Button */}
                  <button
                    onClick={() =>
                      router.push(`/director/interest-list/${interest.id}`)
                    }
                    className="px-4 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all whitespace-nowrap"
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {searchedInterests.length === 0 && (
            <div className="text-center py-12">
              <i className="fa-solid fa-search text-gray-300 text-6xl mb-4"></i>
              <p className="text-gray-500 text-[16px]">No interests found</p>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
