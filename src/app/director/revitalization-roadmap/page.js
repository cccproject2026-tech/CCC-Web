"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import RoadmapCard from "@/app/Components/RoadmapCard";
import FeaturedAvatars from "@/app/Components/FeaturedAvatars";
import MentorCard from "@/app/Components/Card/MentorCard";
import PastorCard from "@/app/Components/Card/PastorCard";
import HeroBg from "../../Assets/roadmap-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import { apiGetRoadmaps, apiGetMentorList, apiGetOverallProgress, apiDeleteRoadmap } from "@/app/Services/api";
import { unwrapRoadmapsList } from "@/app/Services/roadmap-assignments";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../directorUi";


export default function RevitalizationRoadmapPage() {
  const router = useRouter();
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
  const [roadmapLibrary, setRoadmapLibrary] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [mentorsList, setMentorsList] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [pastorProgressList, setPastorProgressList] = useState([]);
  const [loadingPastors, setLoadingPastors] = useState(false);

  useEffect(() => {
    if (activeTab !== "mentors" || mentorsList.length > 0) return;
    const fetchMentors = async () => {
      try {
        setLoadingMentors(true);
        const res = await apiGetMentorList();
        const data = res.data?.data?.users || res.data?.data?.mentors || [];
        setMentorsList(data);
      } catch (err) {
        console.error("Error fetching mentors:", err);
      } finally {
        setLoadingMentors(false);
      }
    };
    fetchMentors();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "pastor-roadmaps" || pastorProgressList.length > 0) return;
    const fetchPastors = async () => {
      try {
        setLoadingPastors(true);
        const res = await apiGetOverallProgress("pastor");
        const data = res.data?.data || [];
        setPastorProgressList(data);
      } catch (err) {
        console.error("Error fetching pastor progress:", err);
      } finally {
        setLoadingPastors(false);
      }
    };
    fetchPastors();
  }, [activeTab]);

  const sortPopupRef = useRef(null);
  const filterPopupRef = useRef(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        const res = await apiGetRoadmaps();
        /** Handles raw arrays, { data }, { roadmaps }, nested envelopes, etc. */
        const list = unwrapRoadmapsList(res);
        const mapped = list.map((item) => ({
          id: item._id,
          title: item.name || "Untitled roadmap",
          description: item.description || item.roadMapDetails || "No description",
          completionTime: item.duration || "N/A",
          img: item.imageUrl || Card1,
        }));
        setRoadmapLibrary(mapped);
      } catch (err) {
        console.error("Error fetching roadmaps:", err);
      } finally {
        setLoadingRoadmaps(false);
      }
    };
    fetchRoadmaps();
  }, []);


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

  const handleDeleteRoadmap = async (id) => {
    try {
      await apiDeleteRoadmap(id);
      setRoadmapLibrary((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error("Error deleting roadmap:", err);
    }
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
    <div className={directorPageRoot}>
      <DirectorHero
        title="Revitalization Roadmap"
        subtitle="Track and manage church revitalization phases."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className={`mb-8 p-6 ${directorGlassCard}`}>
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70"></i>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${directorInputClass} pl-11`}
                  />
                </div>
              </div>

              {/* Tab Navigation */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("roadmap-library")}
                  className={`rounded-lg px-6 py-3 text-[14px] font-semibold transition-all ${
                    activeTab === "roadmap-library"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Roadmap Library
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mentors")}
                  className={`rounded-lg px-6 py-3 text-[14px] font-semibold transition-all ${
                    activeTab === "mentors"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Mentors
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pastor-roadmaps")}
                  className={`rounded-lg px-6 py-3 text-[14px] font-semibold transition-all ${
                    activeTab === "pastor-roadmaps"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Pastor's Roadmaps
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/director/pastor-assignments")}
                  className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/20"
                >
                  <i className="fa-solid fa-share-nodes"></i>
                  Assign
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/director/revitalization-roadmap/create")}
                  className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  <i className="fa-solid fa-plus"></i>
                  New Roadmap
                </button>
              </div>
            </div>
          </div>

          {/* Content Based on Active Tab */}
          {activeTab === "roadmap-library" && (
            <div>
              {loadingRoadmaps ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {roadmapLibrary
                    .filter((r) =>
                      r.title
                        .toLowerCase()
                        .includes((searchQuery || "").trim().toLowerCase())
                    )
                    .map((roadmap) => (
                      <RoadmapCard
                        key={roadmap.id}
                        variant="directorGlass"
                        id={roadmap.id}
                        img={roadmap.img}
                        title={roadmap.title}
                        description={roadmap.description}
                        completionTime={roadmap.completionTime}
                        onView={() =>
                          router.push(
                            `/director/pastor-assignments/roadmap/${roadmap.id}`
                          )
                        }
                        onEdit={() =>
                          router.push(
                            `/director/pastor-assignments/roadmap/${roadmap.id}`
                          )
                        }
                        onDelete={() => handleDeleteRoadmap(roadmap.id)}
                      />
                    ))}
                  {roadmapLibrary.filter((r) =>
                    r.title
                      .toLowerCase()
                      .includes((searchQuery || "").trim().toLowerCase())
                  ).length === 0 && (
                    <p className="text-white/70 col-span-2">
                      {roadmapLibrary.length === 0
                        ? "No roadmaps yet. Create one with New Roadmap."
                        : "No roadmaps match your search."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "mentors" && (
            <div>
              {loadingMentors ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
              <>
              {/* Mentor Avatars */}
              <FeaturedAvatars
                items={mentorsList.map((mentor, idx) => {
                  const defaultImages = [Mentor1, Mentor2, Mentor3];
                  return {
                    id: mentor._id || mentor.id,
                    name: `${mentor.firstName} ${mentor.lastName}`,
                    img: mentor.profilePicture || defaultImages[idx % defaultImages.length],
                  };
                })}
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
                    className="bg-white border-2 border-gray-200 rounded-lg px-4 py-2 text-gray-700 font-semibold text-[14px] focus:outline-none focus:border-[#2E3B8E] hover:bg-gray-50 transition-all flex items-center gap-2"
                  >
                    <span>
                      {sortBy === "least-mentees"
                        ? "Least Mentees"
                        : "Most Mentees"}
                    </span>
                    <i className="fa-solid fa-chevron-down text-gray-600 text-xs"></i>
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
                    <i className="fa-solid fa-filter text-gray-700"></i>
                    <span>Filter</span>
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {filterCount}
                    </span>
                    <i className="fa-solid fa-chevron-down text-gray-600 text-xs"></i>
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
                {mentorsList
                  .filter((m) =>
                    `${m.firstName} ${m.lastName}`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    const aC = a.assignedId?.length || 0;
                    const bC = b.assignedId?.length || 0;
                    return sortBy === "most-mentees" ? bC - aC : aC - bC;
                  })
                  .map((mentor, idx) => {
                    const defaultImages = [Mentor1, Mentor2, Mentor3];
                    const fallback = defaultImages[idx % defaultImages.length];
                    return (
                    <MentorCard
                      key={mentor._id || mentor.id}
                      image={mentor.profilePicture || fallback}
                      name={`${mentor.firstName} ${mentor.lastName}`}
                      role={mentor.role || "Mentor"}
                      menteeCount={mentor.assignedId?.length || 0}
                      onViewDetails={() => router.push(`/director/mentors/profile/${mentor._id || mentor.id}`)}
                    />
                  );})
                }
                {mentorsList.length === 0 && (
                  <p className="text-white/70 col-span-4">No mentors found.</p>
                )}
              </div>
              </>
              )}
            </div>
          )}

          {activeTab === "pastor-roadmaps" && (
            <div>
              {loadingPastors ? (
                <div className="flex justify-center py-12">
                  <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
              <>
              {/* Featured Avatars */}
              <FeaturedAvatars
                items={pastorProgressList.map((pastor, idx) => {
                  const defaultImages = [Mentor1, Mentor2, Mentor3];
                  return {
                    id: pastor.userId,
                    name: `${pastor.firstName} ${pastor.lastName}`,
                    img: pastor.profilePicture || defaultImages[idx % defaultImages.length],
                  };
                })}
                gapClass="gap-4"
                nameClass="text-sm text-white"
                className="mb-6"
                showGradientBorder={false}
              />

              {/* Horizontal Line */}
              <div className="h-px bg-white/30 mb-6"></div>

              {/* Filter */}
              <div className="flex justify-end items-center mb-6">
                <div className="relative" ref={filterPopupRef}>
                  <button
                    onClick={() => setShowFilterPopup(!showFilterPopup)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-gray-700 font-semibold text-[14px] hover:bg-gray-50 transition-all"
                  >
                    <i className="fa-solid fa-filter text-gray-700"></i>
                    <span>Filter</span>
                    <span className="bg-yellow-400 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {filterCount}
                    </span>
                    <i className="fa-solid fa-chevron-down text-gray-600 text-xs"></i>
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

              {/* Pastor Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pastorProgressList
                  .filter((p) =>
                    `${p.firstName} ${p.lastName}`
                      .toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  )
                  .map((pastor, idx) => {
                    const defaultImages = [Mentor1, Mentor2, Mentor3];
                    const fallback = defaultImages[idx % defaultImages.length];
                    return (
                      <PastorCard
                        key={pastor.userId}
                        image={pastor.profilePicture || fallback}
                        name={`${pastor.firstName} ${pastor.lastName}`}
                        description={`${pastor.completedRoadmaps || 0}/${pastor.totalRoadmaps || 0} roadmaps completed`}
                        phase="Roadmap Progress"
                        progress={pastor.overallRoadmapProgress || 0}
                        onViewDetails={() => {
                          router.push("/director/revitalization-roadmap/home");
                        }}
                      />
                    );
                  })}
                {pastorProgressList.length === 0 && (
                  <p className="text-white/70 col-span-2">No pastor progress found.</p>
                )}
              </div>
              </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
