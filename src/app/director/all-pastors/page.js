"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/Header/AppHeader";import AppHero from "@/app/Components/Hero/AppHero";
import ProgressBg from "../../Assets/progress-bg.jpg";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function AllPastorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [toast, setToast] = useState(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPastor, setSelectedPastor] = useState(null);

  // Sample pastor data with varying progress and comments
  const [pastors, setPastors] = useState([
    {
      id: 1,
      name: "John Doe",
      subtitle:
        "Sub text area write something here. That you can read more about him",
      progress: 100,
      status: "completed",
      image: Mentor3,
      finalComments:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in rep",
      commentAuthor: "David",
      commentRole: "Director",
    },
    {
      id: 2,
      name: "John Doe",
      subtitle:
        "Sub text area write something here. That you can read more about him",
      progress: 70,
      status: "in-progress",
      image: Mentor1,
      finalComments: null,
      commentAuthor: null,
      commentRole: null,
    },
    {
      id: 3,
      name: "Jane Smith",
      subtitle:
        "Experienced pastor with focus on community engagement and growth",
      progress: 85,
      status: "in-progress",
      image: Mentor2,
      finalComments: null,
      commentAuthor: null,
      commentRole: null,
    },
    {
      id: 4,
      name: "Michael Johnson",
      subtitle:
        "Dedicated to revitalizing communities through faith-based initiatives",
      progress: 92,
      status: "in-progress",
      image: Mentor3,
      finalComments: null,
      commentAuthor: null,
      commentRole: null,
    },
    {
      id: 5,
      name: "Sarah Williams",
      subtitle:
        "Passionate about mentoring and developing future church leaders",
      progress: 45,
      status: "in-progress",
      image: Mentor1,
      finalComments: null,
      commentAuthor: null,
      commentRole: null,
    },
    {
      id: 6,
      name: "Robert Brown",
      subtitle: "Committed to church empowerment and multiplication strategies",
      progress: 100,
      status: "completed",
      image: Mentor2,
      finalComments:
        "Excellent progress throughout the program. Demonstrated strong leadership skills and commitment to church revitalization. Successfully completed all phases and assessments with outstanding results.",
      commentAuthor: "Sarah",
      commentRole: "Director",
    },
  ]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkComplete = (pastorId) => {
    setPastors(
      pastors.map((pastor) =>
        pastor.id === pastorId
          ? { ...pastor, status: "completed", progress: 100 }
          : pastor
      )
    );
    showToast("Pastor marked as completed successfully!");
  };

  const handleViewComments = (pastor) => {
    setSelectedPastor(pastor);
    setShowCommentsModal(true);
  };

  const filteredPastors = pastors.filter((pastor) => {
    const matchesSearch = pastor.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "In-Progress" && pastor.status === "in-progress") ||
      (activeFilter === "Completed" && pastor.status === "completed");

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] via-[#2876AC] to-[#2876AC]">
      {/* Hero Section */}
      <AppHero
        title="Track Progress"
        backgroundImageUrl={ProgressBg.src}
        heightClasses="h-[280px] sm:h-[300px] md:h-[320px]"
      />

      {/* Main Content */}
      <section className="relative px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-20 py-4 sm:py-6 md:py-8 lg:py-10 flex-1">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar and Filters */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
            {/* Search Bar */}
            <div className="relative w-full lg:w-[400px] xl:w-[450px]">
              <i className="fa-solid fa-magnifying-glass absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 bg-white rounded-lg border-none outline-none text-gray-900 placeholder-gray-400 shadow-md text-sm sm:text-base focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg p-1 sm:p-1.5 shadow-md w-full lg:w-auto overflow-x-auto">
              {["All", "In-Progress", "Completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 sm:px-4 lg:px-6 py-2.5 sm:py-2 rounded-md font-semibold text-xs sm:text-sm transition-all flex-1 lg:flex-none whitespace-nowrap touch-manipulation ${
                    activeFilter === filter
                      ? "bg-[#2E3B8E] text-white shadow-sm"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Pastors Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {filteredPastors.map((pastor) => (
              <div
                key={pastor.id}
                className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Profile Image */}
                  <div
                    className="w-full md:w-[200px] lg:w-[220px] xl:w-[230px] h-[180px] sm:h-[200px] md:h-auto flex-shrink-0 cursor-pointer bg-gray-100"
                    onClick={() =>
                      router.push(`/director/all-pastors/${pastor.id}`)
                    }
                  >
                    <Image
                      src={pastor.image}
                      alt={pastor.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Pastor Details */}
                  <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col">
                    <h3
                      className="text-base sm:text-lg md:text-xl lg:text-[22px] font-bold text-gray-900 mb-1.5 sm:mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() =>
                        router.push(`/director/all-pastors/${pastor.id}`)
                      }
                    >
                      {pastor.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 md:mb-5 line-clamp-2 leading-relaxed">
                      {pastor.subtitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3 sm:mb-4 md:mb-5">
                      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          Progress
                        </span>
                        <span className="text-sm sm:text-base font-bold text-gray-900">
                          {pastor.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2 sm:h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${pastor.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Icons and Button */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 mt-auto">
                      {/* Action Icons */}
                      <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 md:gap-3">
                        <button
                          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all touch-manipulation"
                          title="Email"
                        >
                          <i className="fa-solid fa-envelope text-gray-900 text-xs sm:text-sm"></i>
                        </button>
                        <button
                          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all touch-manipulation"
                          title="Message"
                        >
                          <i className="fa-solid fa-message text-gray-900 text-xs sm:text-sm"></i>
                        </button>
                        <button
                          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all touch-manipulation"
                          title="WhatsApp"
                        >
                          <i className="fa-brands fa-whatsapp text-gray-900 text-xs sm:text-sm"></i>
                        </button>
                        <button
                          className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all touch-manipulation"
                          title="Phone"
                        >
                          <i className="fa-solid fa-phone text-gray-900 text-xs sm:text-sm"></i>
                        </button>
                      </div>

                      {/* Status Button/Badge */}
                      {pastor.status === "in-progress" ? (
                        <button
                          onClick={() => handleMarkComplete(pastor.id)}
                          className="px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-[#2E3B8E] text-white rounded-lg font-bold text-xs sm:text-sm md:text-[15px] hover:bg-[#1F2A6E] transition-all shadow-md w-full sm:w-auto touch-manipulation"
                        >
                          Mark as Complete
                        </button>
                      ) : (
                        <div className="flex flex-col items-stretch sm:items-end gap-2">
                          <div className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-lg font-bold text-xs sm:text-sm md:text-[15px] text-center sm:text-left">
                            Completed
                          </div>
                          {pastor.finalComments && (
                            <button
                              onClick={() => handleViewComments(pastor)}
                              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#1F2A6E] text-white rounded-lg font-semibold text-xs sm:text-[13px] hover:bg-[#0F1A5E] transition-all w-full sm:w-auto touch-manipulation"
                            >
                              View Final Comments
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {filteredPastors.length === 0 && (
            <div className="text-center py-8 sm:py-12 md:py-16 lg:py-20 px-4">
              <i className="fa-solid fa-users text-white/30 text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4"></i>
              <p className="text-white text-base sm:text-lg md:text-xl font-semibold">
                No pastors found
              </p>
              <p className="text-white/70 mt-2 text-xs sm:text-sm md:text-base">
                Try adjusting your search or filter
              </p>
            </div>
          )}
        </div>
      </section>

      {/* View Final Comments Modal */}
      {showCommentsModal && selectedPastor && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6"
            onClick={() => setShowCommentsModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-3 sm:p-4 md:p-6">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-2xl w-full max-w-[320px] xs:max-w-[400px] sm:max-w-[500px] md:max-w-[600px] max-h-[85vh] sm:max-h-[80vh] md:max-h-[75vh] animate-fade-in pointer-events-auto overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="px-4 py-3 sm:px-5 sm:py-4 md:px-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="min-w-0 flex-1 pr-2">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">
                    Final Comments
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">
                    Pr. {selectedPastor.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0 touch-manipulation"
                >
                  <i className="fa-solid fa-xmark text-gray-500 text-base sm:text-lg"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-5 md:p-6 overflow-y-auto flex-1 min-h-0">
                <div className="bg-gray-50 rounded-lg p-4 sm:p-5 mb-4 min-h-[140px] sm:min-h-[160px]">
                  <p className="text-gray-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
                    {selectedPastor.finalComments}
                  </p>
                </div>

                {/* Author Info */}
                {selectedPastor.commentAuthor && (
                  <div className="flex items-center gap-3 sm:gap-4 pt-4 border-t border-gray-200">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm sm:text-base">
                        {selectedPastor.commentAuthor.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-gray-900 font-semibold text-sm sm:text-base">
                        {selectedPastor.commentAuthor}
                      </p>
                      <p className="text-gray-500 text-xs sm:text-sm">
                        {selectedPastor.commentRole}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-3 sm:bottom-4 md:bottom-6 lg:bottom-8 right-3 sm:right-4 md:right-6 lg:right-8 z-[100] animate-slide-left">
          <div className="bg-white rounded-lg shadow-2xl px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 flex items-center gap-2 sm:gap-3 min-w-[260px] sm:min-w-[300px] md:min-w-[320px] border-l-4 border-green-500">
            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-green-600 text-xs sm:text-sm md:text-lg"></i>
            </div>
            <p className="text-gray-900 font-semibold text-xs sm:text-sm md:text-base">{toast}</p>
          </div>
        </div>
      )}    </div>
  );
}
