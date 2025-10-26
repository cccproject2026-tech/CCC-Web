"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
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
      <AppHeader showFullHeader={true} />

      {/* Hero Section */}
      <AppHero
        title="Track Progress"
        backgroundImageUrl={ProgressBg.src}
        heightClasses="h-[280px] sm:h-[300px] md:h-[320px]"
      />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-10 flex-1">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar and Filters */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative w-full md:w-[400px]">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border-none outline-none text-gray-900 placeholder-gray-400 shadow-md"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-md">
              {["All", "In-Progress", "Completed"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-6 py-2 rounded-md font-semibold text-sm transition-all ${
                    activeFilter === filter
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-transparent text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Pastors Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredPastors.map((pastor) => (
              <div
                key={pastor.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="flex">
                  {/* Profile Image */}
                  <div
                    className="w-[230px] flex-shrink-0 cursor-pointer bg-gray-100"
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
                  <div className="flex-1 p-6 flex flex-col">
                    <h3
                      className="text-[22px] font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() =>
                        router.push(`/director/all-pastors/${pastor.id}`)
                      }
                    >
                      {pastor.name}
                    </h3>
                    <p className="text-[13px] text-gray-400 mb-5 line-clamp-2 leading-relaxed">
                      {pastor.subtitle}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[15px] font-bold text-gray-900">
                          Progress
                        </span>
                        <span className="text-[15px] font-bold text-gray-900">
                          {pastor.progress}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
                          style={{ width: `${pastor.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Icons and Button */}
                    <div className="flex items-center justify-between mt-auto">
                      {/* Action Icons */}
                      <div className="flex items-center gap-3">
                        <button
                          className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all"
                          title="Email"
                        >
                          <i className="fa-solid fa-envelope text-gray-900 text-[15px]"></i>
                        </button>
                        <button
                          className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all"
                          title="Message"
                        >
                          <i className="fa-solid fa-message text-gray-900 text-[15px]"></i>
                        </button>
                        <button
                          className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all"
                          title="WhatsApp"
                        >
                          <i className="fa-brands fa-whatsapp text-gray-900 text-[15px]"></i>
                        </button>
                        <button
                          className="w-10 h-10 rounded-full border-2 border-gray-900 flex items-center justify-center hover:bg-gray-50 transition-all"
                          title="Phone"
                        >
                          <i className="fa-solid fa-phone text-gray-900 text-[15px]"></i>
                        </button>
                      </div>

                      {/* Status Button/Badge */}
                      {pastor.status === "in-progress" ? (
                        <button
                          onClick={() => handleMarkComplete(pastor.id)}
                          className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-bold text-[15px] hover:bg-[#1F2A6E] transition-all shadow-md"
                        >
                          Mark as Complete
                        </button>
                      ) : (
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-5 py-2.5 bg-green-100 text-green-700 rounded-lg font-bold text-[15px]">
                            Completed
                          </div>
                          {pastor.finalComments && (
                            <button
                              onClick={() => handleViewComments(pastor)}
                              className="px-4 py-2 bg-[#1F2A6E] text-white rounded-lg font-semibold text-[13px] hover:bg-[#0F1A5E] transition-all"
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
            <div className="text-center py-20">
              <i className="fa-solid fa-users text-white/30 text-6xl mb-4"></i>
              <p className="text-white text-xl font-semibold">
                No pastors found
              </p>
              <p className="text-white/70 mt-2">
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
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
            onClick={() => setShowCommentsModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl w-[600px] max-w-[90vw] animate-fade-in pointer-events-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-[20px] font-bold text-gray-900">
                    Final Comments
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Pr. {selectedPastor.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-gray-500 text-xl"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4 min-h-[200px]">
                  <p className="text-gray-900 text-[14px] leading-relaxed">
                    {selectedPastor.finalComments}
                  </p>
                </div>

                {/* Author Info */}
                {selectedPastor.commentAuthor && (
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">
                        {selectedPastor.commentAuthor.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-semibold text-[14px]">
                        {selectedPastor.commentAuthor}
                      </p>
                      <p className="text-gray-500 text-[12px]">
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
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-left">
          <div className="bg-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[320px] border-l-4 border-green-500">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-green-600 text-lg"></i>
            </div>
            <p className="text-gray-900 font-semibold">{toast}</p>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
