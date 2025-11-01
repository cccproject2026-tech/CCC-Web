"use client";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import RoadmapCard from "@/app/Components/RoadmapCard";
import FeaturedAvatars from "@/app/Components/FeaturedAvatars";
import MentorCard from "@/app/Components/MentorCard";
import HeroBg from "../../Assets/roadmap-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";

export default function RevitalizationRoadmapPage() {
  const [activeTab, setActiveTab] = useState("roadmap-library");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("least-mentees");
  const [filterCount, setFilterCount] = useState(3);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filters, setFilters] = useState({
    country: true,
    state: true,
    conference: true,
  });

  const sortPopupRef = useRef(null);
  const filterPopupRef = useRef(null);

  // Roadmap Library Data
  const roadmapLibrary = [
    {
      id: 1,
      title: "Jump-start",
      description: "Interested in receiving mentoring in community engagement",
      completionTime: "Months 1 - 2",
      img: Card1,
    },
    {
      id: 2,
      title: "Self Revitalization Phase",
      description: "Interested in receiving mentoring in community engagement",
      completionTime: "Months 1 - 2",
      img: Card2,
    },
    {
      id: 3,
      title: "Church Empowerment Phase",
      description: "Interested in receiving mentoring in community engagement",
      completionTime: "Months 1 - 2",
      img: Card3,
    },
    {
      id: 4,
      title: "Community Revitalization and Multiplication Phase",
      description: "Interested in receiving mentoring in community engagement",
      completionTime: "Months 1 - 2",
      img: Card4,
    },
  ];

  // Mentors Data
  const mentors = [
    { id: 1, name: "Jacob Jones", image: Mentor1 },
    { id: 2, name: "John Doe", image: Mentor2 },
    { id: 3, name: "Robert Fox", image: Mentor3 },
    { id: 4, name: "Jacob Jones", image: Mentor1 },
    { id: 5, name: "Robert Fox", image: Mentor3 },
    { id: 6, name: "John Doe", image: Mentor2 },
  ];

  const mentorCards = [
    {
      id: 1,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 5,
      image: Mentor1,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 2,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 6,
      image: Mentor2,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 3,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 3,
      image: Mentor3,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 4,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 4,
      image: Mentor1,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 5,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 2,
      image: Mentor2,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 6,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 7,
      image: Mentor3,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 7,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 1,
      image: Mentor1,
      description: "Sub text area write something here. That you can read more",
    },
    {
      id: 8,
      name: "John Doe",
      role: "Mentor",
      menteeCount: 8,
      image: Mentor2,
      description: "Sub text area write something here. That you can read more",
    },
  ];

  // Pastor Roadmaps Data
  const pastorRoadmaps = [
    {
      id: 1,
      name: "John Doe",
      phase: "Community Revitalization and Multiplication",
      progress: 100,
      image: Mentor1,
      description:
        "Sub text area write something here. That you can read more about him.",
    },
    {
      id: 2,
      name: "John Doe",
      phase: "Church Empowerment",
      progress: 70,
      image: Mentor2,
      description:
        "Sub text area write something here. That you can read more about him.",
    },
    {
      id: 3,
      name: "John Doe",
      phase: "Self Revitalization",
      progress: 70,
      image: Mentor3,
      description:
        "Sub text area write something here. That you can read more about him.",
    },
    {
      id: 4,
      name: "John Doe",
      phase: "Self Revitalization",
      progress: 70,
      image: Mentor1,
      description:
        "Sub text area write something here. That you can read more about him.",
    },
  ];

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sortPopupRef.current &&
        !sortPopupRef.current.contains(event.target)
      ) {
        setShowSortPopup(false);
      }
      if (
        filterPopupRef.current &&
        !filterPopupRef.current.contains(event.target)
      ) {
        setShowFilterPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getProgressColor = (progress) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 70) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleToggleFilter = (filterKey) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterKey]: !prev[filterKey],
      };

      // Update filter count
      const activeFilters = Object.values(newFilters).filter(Boolean).length;
      setFilterCount(activeFilters);

      return newFilters;
    });
  };

  const handleClearSort = () => {
    setSortBy("least-mentees");
    setShowSortPopup(false);
  };

  const handleClearFilter = () => {
    setFilters({
      country: false,
      state: false,
      conference: false,
    });
    setFilterCount(0);
    setShowFilterPopup(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center text-white h-[250px] flex items-end pb-10 px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        {/* Dark overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#001845]/70 via-[#0B2E72]/50 to-[#1A4A9A]/90"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-semibold">Revitalization Roadmap</h1>
          <p className="text-white/80 text-lg mt-2">
            Track and manage church revitalization phases
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 px-16 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Search and Tabs Section */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("roadmap-library")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "roadmap-library"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Roadmap Library
                </button>
                <button
                  onClick={() => setActiveTab("mentors")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "mentors"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Mentors
                </button>
                <button
                  onClick={() => setActiveTab("pastor-roadmaps")}
                  className={`px-6 py-3 rounded-lg font-semibold text-[14px] transition-all ${
                    activeTab === "pastor-roadmaps"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Pastor's Roadmaps
                </button>
                <button className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold text-[14px] hover:bg-[#1F2A6E] transition-all flex items-center gap-2">
                  <i className="fa-solid fa-plus"></i>
                  New Roadmap
                </button>
              </div>
            </div>
          </div>

          {/* Content Based on Active Tab */}
          {activeTab === "roadmap-library" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
              {roadmapLibrary.map((roadmap) => (
                <RoadmapCard
                  key={roadmap.id}
                  img={roadmap.img}
                  title={roadmap.title}
                  description={roadmap.description}
                  completionTime={roadmap.completionTime}
                />
              ))}
            </div>
          )}

          {activeTab === "mentors" && (
            <div>
              {/* Mentor Avatars */}
              <FeaturedAvatars
                items={mentors.map((mentor) => ({
                  id: mentor.id,
                  name: mentor.name,
                  img: mentor.image,
                }))}
                gapClass="gap-4"
                nameClass="text-sm text-white"
                className="mb-6"
                showGradientBorder={false}
              />

              {/* Sort and Filter */}
              <div className="flex justify-between items-center mb-6">
                <div
                  className="flex items-center gap-4 relative"
                  ref={sortPopupRef}
                >
                  <button
                    onClick={() => setShowSortPopup(!showSortPopup)}
                    className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-gray-700 font-semibold text-[14px] focus:outline-none focus:border-[#2E3B8E] hover:bg-gray-50 transition-all"
                  >
                    Sort By:{" "}
                    {sortBy === "least-mentees"
                      ? "Least Mentees"
                      : "Most Mentees"}
                  </button>

                  {/* Sort Popup */}
                  {showSortPopup && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[250px] z-50">
                      <h3 className="text-[14px] font-bold text-gray-900 mb-3">
                        Sort Mentees popup 15
                      </h3>

                      {/* Radio Options */}
                      <div className="space-y-3 mb-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            value="least-mentees"
                            checked={sortBy === "least-mentees"}
                            onChange={(e) => {
                              setSortBy(e.target.value);
                              setShowSortPopup(false);
                            }}
                            className="w-4 h-4 text-[#2E3B8E] focus:ring-[#2E3B8E]"
                          />
                          <span className="text-[14px] text-gray-700">
                            Least number of Mentees
                          </span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="sort"
                            value="most-mentees"
                            checked={sortBy === "most-mentees"}
                            onChange={(e) => {
                              setSortBy(e.target.value);
                              setShowSortPopup(false);
                            }}
                            className="w-4 h-4 text-[#2E3B8E] focus:ring-[#2E3B8E]"
                          />
                          <span className="text-[14px] text-gray-700">
                            Most number of Mentees
                          </span>
                        </label>
                      </div>

                      {/* Clear Sort Button */}
                      <button
                        onClick={handleClearSort}
                        className="text-[#2E3B8E] text-[14px] font-semibold hover:underline"
                      >
                        Clear Sort
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative" ref={filterPopupRef}>
                  <button
                    onClick={() => setShowFilterPopup(!showFilterPopup)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition-all"
                  >
                    <i className="fa-solid fa-filter"></i>
                    Filter
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {filterCount}
                    </span>
                  </button>

                  {/* Filter Popup */}
                  {showFilterPopup && (
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 min-w-[200px] z-50">
                      <h3 className="text-[14px] font-bold text-gray-900 mb-3">
                        Filter
                      </h3>

                      {/* Filter Options */}
                      <div className="space-y-3 mb-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[14px] text-gray-700">
                            Country
                          </span>
                          <button
                            onClick={() => handleToggleFilter("country")}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              filters.country
                                ? "bg-[#2E3B8E] border-[#2E3B8E]"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {filters.country && (
                              <i className="fa-solid fa-check text-white text-xs"></i>
                            )}
                          </button>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[14px] text-gray-700">
                            State
                          </span>
                          <button
                            onClick={() => handleToggleFilter("state")}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              filters.state
                                ? "bg-[#2E3B8E] border-[#2E3B8E]"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {filters.state && (
                              <i className="fa-solid fa-check text-white text-xs"></i>
                            )}
                          </button>
                        </label>

                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[14px] text-gray-700">
                            Conference
                          </span>
                          <button
                            onClick={() => handleToggleFilter("conference")}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              filters.conference
                                ? "bg-[#2E3B8E] border-[#2E3B8E]"
                                : "bg-white border-gray-300"
                            }`}
                          >
                            {filters.conference && (
                              <i className="fa-solid fa-check text-white text-xs"></i>
                            )}
                          </button>
                        </label>
                      </div>

                      {/* Clear Filter Button */}
                      <button
                        onClick={handleClearFilter}
                        className="text-[#2E3B8E] text-[14px] font-semibold hover:underline"
                      >
                        Clear Filter
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mentor Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mentorCards.map((mentor) => (
                  <MentorCard
                    key={mentor.id}
                    image={mentor.image}
                    name={mentor.name}
                    role={mentor.role}
                    menteeCount={mentor.menteeCount}
                    onViewDetails={() => {
                      // Handle view details action
                      console.log(`View details for ${mentor.name}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === "pastor-roadmaps" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pastorRoadmaps.map((pastor) => (
                <div
                  key={pastor.id}
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  {/* Profile Image */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-full overflow-hidden">
                      <Image
                        src={pastor.image}
                        alt={pastor.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="text-center mb-3">
                    <h3 className="text-[17px] font-bold text-gray-900 mb-1">
                      {pastor.name}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-gray-600 text-center mb-4">
                    {pastor.description}
                  </p>

                  {/* Phase */}
                  <div className="text-center mb-4">
                    <span className="inline-block px-3 py-1 bg-[#2E3B8E] text-white rounded-full text-[12px] font-bold">
                      Phase: {pastor.phase}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Tasks Completed
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {pastor.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(
                          pastor.progress
                        )}`}
                        style={{ width: `${pastor.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Icons */}
                  <div className="flex justify-center gap-3 mb-4">
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                      <i className="fa-solid fa-envelope text-gray-600"></i>
                    </button>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                      <i className="fa-solid fa-comment text-gray-600"></i>
                    </button>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                      <i className="fa-solid fa-phone text-gray-600"></i>
                    </button>
                    <button className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all">
                      <i className="fa-solid fa-external-link-alt text-gray-600"></i>
                    </button>
                  </div>

                  {/* Arrow Button */}
                  <div className="flex justify-end">
                    <button className="w-8 h-8 bg-[#2E3B8E] rounded-lg flex items-center justify-center hover:bg-[#1F2A6E] transition-all">
                      <i className="fa-solid fa-arrow-right text-white text-sm"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AppFooter />
    </div>
  );
}
