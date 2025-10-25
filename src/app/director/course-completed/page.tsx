"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DirectorHeader from "@/app/Components/DirectorHeader";
import DirectorFooter from "@/app/Components/DirectorFooter";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

interface Person {
  id: number;
  name: string;
  role: string;
  img: any;
  isNew?: boolean;
  status?: "completed" | "certificate_issued" | "invited";
  response?: "Accepted" | "Waiting" | "Not Interested" | null;
  invitationDate?: string | null;
}

type SortOption = {
  value: string;
  label: string;
};

const PEOPLE: Person[] = [
  {
    id: 1,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    isNew: true,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 2,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 3,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 4,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 5,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 6,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "completed",
    response: null,
    invitationDate: null,
  },
  {
    id: 7,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 8,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 9,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 10,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 11,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 12,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "certificate_issued",
    response: null,
    invitationDate: null,
  },
  {
    id: 13,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    status: "invited",
    response: "Waiting",
    invitationDate: "10 Nov 2024",
  },
  {
    id: 14,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "invited",
    response: "Not Interested",
    invitationDate: "10 Nov 2024",
  },
  {
    id: 15,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "invited",
    response: "Accepted",
    invitationDate: "10 Nov 2024",
  },
  {
    id: 16,
    name: "John Doe",
    role: "Mentee",
    img: Mentor1,
    status: "invited",
    response: "Accepted",
    invitationDate: "10 Nov 2024",
  },
  {
    id: 17,
    name: "John Doe",
    role: "Mentee",
    img: Mentor2,
    status: "invited",
    response: "Accepted",
    invitationDate: "10 Nov 2024",
  },
  {
    id: 18,
    name: "John Doe",
    role: "Mentee",
    img: Mentor3,
    status: "invited",
    response: "Accepted",
    invitationDate: "10 Nov 2024",
  },
];

export default function CourseCompletedPage() {
  const [activeTab, setActiveTab] = useState<
    "completed" | "certificate_issued" | "invited"
  >("completed");
  const [sortBy, setSortBy] = useState<string>("latest_completed");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Sort options based on active tab
  const getSortOptions = (): SortOption[] => {
    if (activeTab === "completed") {
      return [
        { value: "latest_completed", label: "Latest Completed" },
        { value: "oldest_completed", label: "Oldest Completed" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    } else if (activeTab === "certificate_issued") {
      return [
        { value: "latest_issued", label: "Latest Issued" },
        { value: "oldest_issued", label: "Oldest Issued" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    } else {
      return [
        { value: "accepted", label: "Accepted" },
        { value: "waiting", label: "Waiting for Response" },
        { value: "not_interested", label: "Not Interested" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    }
  };

  // Update sort when tab changes
  const handleTabChange = (
    tab: "completed" | "certificate_issued" | "invited"
  ) => {
    setActiveTab(tab);
    if (tab === "completed") {
      setSortBy("latest_completed");
    } else if (tab === "certificate_issued") {
      setSortBy("latest_issued");
    } else {
      setSortBy("waiting");
    }
  };

  const data = useMemo(() => {
    const filtered = PEOPLE.filter((p) => {
      if (activeTab === "completed") return p.status === "completed";
      if (activeTab === "certificate_issued")
        return p.status === "certificate_issued";
      return p.status === "invited";
    }).filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

    // Basic client-side sort mock
    return filtered;
  }, [activeTab, query]);

  // Get counts for each tab
  const completedCount = PEOPLE.filter((p) => p.status === "completed").length;

  const handleIssueCertificate = (id: number) => {
    setToast("Certificate Issued Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = (id: number) => {
    setToast("Invited to be a Field Mentor Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const sortOptions = getSortOptions();
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label ||
    sortOptions[0].label;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <DirectorHeader showFullHeader={true} />

      {/* Hero Section with Background */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2E5C]/80 to-[#2876AC]/70"></div>

        {/* Hero Title */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-16 pb-8">
          <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold leading-tight">
            {activeTab === "invited"
              ? "Invite to be a Field Mentor"
              : "Course Completed"}
          </h1>
        </div>
      </section>

      {/* Controls Section - Below Hero Banner */}
      <section className="relative bg-gradient-to-b from-[#4A90C0] to-[#5BA3D0] px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-6 items-start lg:items-start justify-between">
          {/* Search - Left Side */}
          <div className="w-full lg:w-[380px]">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full px-4 py-3 pl-11 rounded-lg bg-white text-[#1A2E7A] placeholder-gray-400 outline-none shadow-md text-[15px]"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
          </div>

          {/* Right Side: Tabs + Sort */}
          <div className="flex flex-col gap-4 items-end w-full lg:w-auto">
            {/* Tabs */}
            <div className="flex gap-2 bg-white rounded-xl p-2 shadow-lg">
              <button
                onClick={() => handleTabChange("completed")}
                className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "completed"
                    ? "bg-[#2E3B8E] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <span>Completed</span>
                {activeTab === "completed" && completedCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-[11px] bg-yellow-400 text-gray-800 rounded-full font-bold">
                    {completedCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange("certificate_issued")}
                className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "certificate_issued"
                    ? "bg-[#2E3B8E] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Certificate Issued
              </button>
              <button
                onClick={() => handleTabChange("invited")}
                className={`px-6 py-3 rounded-lg text-[14px] font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === "invited"
                    ? "bg-[#2E3B8E] text-white shadow-md"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Invited as Field Mentor
              </button>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-3">
              <span className="text-white text-[15px] font-medium whitespace-nowrap">
                Sort By
              </span>
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-xl text-[14px] font-medium shadow-md hover:bg-white/10 transition-all flex items-center gap-3 min-w-[220px] justify-between"
                >
                  <span>{currentSortLabel}</span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>

                {/* Sort Dropdown Menu */}
                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[220px] z-[60]">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] transition-all flex items-center gap-2 ${
                          sortBy === option.value
                            ? "bg-green-50 text-green-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            sortBy === option.value
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {sortBy === option.value && (
                            <i className="fa-solid fa-check text-white text-[8px]"></i>
                          )}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1400px] mx-auto">
          {data.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl p-5 flex gap-5 items-start shadow-lg hover:shadow-xl transition-all"
            >
              {/* Image with relative positioning for "New" badge - Clickable */}
              <Link
                href="/director/mentee-profile"
                className="relative w-[120px] h-[120px] overflow-hidden rounded-xl bg-gray-100 flex-shrink-0 cursor-pointer"
              >
                <Image
                  src={p.img}
                  alt={p.name}
                  className="w-full h-full object-cover"
                />
                {p.isNew && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-yellow-400 text-gray-900 rounded-md text-[11px] font-bold shadow-sm">
                    New
                  </span>
                )}
              </Link>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-h-[120px]">
                <div>
                  <Link
                    href="/director/mentee-profile"
                    className="flex items-center gap-2 mb-1 hover:opacity-80 transition-opacity"
                  >
                    <h3 className="font-bold text-[#1A2E7A] text-[16px]">
                      {p.name}
                    </h3>
                    <i className="fa-solid fa-circle-check text-[#5B9FD7] text-sm"></i>
                  </Link>
                  <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">
                    Sub text area write something here. That you can read more
                    about him
                  </p>

                  {activeTab === "invited" && (
                    <div className="text-[12px] text-gray-700 space-y-1 mb-3">
                      <p>
                        <span className="font-semibold">
                          Invitation sent on :
                        </span>{" "}
                        <span className="font-bold">{p.invitationDate}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Response :</span>
                        <span
                          className={`px-2 py-1 rounded-md text-white text-[11px] font-semibold ${
                            p.response === "Accepted"
                              ? "bg-green-500"
                              : p.response === "Waiting"
                              ? "bg-gray-400"
                              : "bg-red-500"
                          }`}
                        >
                          {p.response}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[#2E3B8E] text-[17px]">
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-envelope"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-comment"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-solid fa-phone"></i>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="self-end flex-shrink-0">
                {activeTab === "completed" && (
                  <button
                    onClick={() => handleIssueCertificate(p.id)}
                    className="px-4 py-2.5 bg-[#1F2A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md whitespace-nowrap"
                  >
                    Issue Certificate
                  </button>
                )}
                {activeTab === "certificate_issued" && (
                  <button
                    onClick={() => handleInvite(p.id)}
                    className="px-4 py-2.5 bg-[#1F2A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md whitespace-nowrap"
                  >
                    Invite as Field Mentor
                  </button>
                )}
                {activeTab === "invited" && (
                  <button className="px-4 py-2.5 bg-[#1F2A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md whitespace-nowrap">
                    Invite as Field Mentor
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close sort menu */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortMenu(false)}
        ></div>
      )}

      <DirectorFooter />
    </div>
  );
}
