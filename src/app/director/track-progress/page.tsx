"use client";
import { useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

export default function TrackProgressPage() {
  const [activeTab, setActiveTab] = useState("pastors");
  const [searchQuery, setSearchQuery] = useState("");

  const stats = {
    totalPastors: 3,
    activeMentors: 3,
    avgProgress: 47,
    sessions: 81,
  };

  const pastorProgress = [
    {
      id: 1,
      name: "John Doe",
      image: Mentor1,
      currentPhase: "Self Revitalization",
      overallProgress: 45,
      roadmapProgress: 60,
      assessmentProgress: 50,
      assignmentProgress: 30,
      mentor: "Jacob Jones",
      status: "on-track",
    },
    {
      id: 2,
      name: "Robert Fox",
      image: Mentor2,
      currentPhase: "Church Empowerment",
      overallProgress: 72,
      roadmapProgress: 80,
      assessmentProgress: 75,
      assignmentProgress: 60,
      mentor: "John Ross",
      status: "on-track",
    },
    {
      id: 3,
      name: "Peter Smith",
      image: Mentor3,
      currentPhase: "Jump-Start",
      overallProgress: 25,
      roadmapProgress: 30,
      assessmentProgress: 20,
      assignmentProgress: 25,
      mentor: "David Wilson",
      status: "needs-attention",
    },
  ];

  const mentorProgress = [
    {
      id: 1,
      name: "Jacob Jones",
      image: Mentor1,
      role: "Field Mentor",
      mentees: 5,
      completedSessions: 24,
      upcomingSessions: 3,
      overallRating: 4.8,
      status: "active",
    },
    {
      id: 2,
      name: "John Ross",
      image: Mentor2,
      role: "Mentor",
      mentees: 8,
      completedSessions: 42,
      upcomingSessions: 5,
      overallRating: 4.9,
      status: "active",
    },
    {
      id: 3,
      name: "David Wilson",
      image: Mentor3,
      role: "Mentor",
      mentees: 3,
      completedSessions: 15,
      upcomingSessions: 2,
      overallRating: 4.7,
      status: "active",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-700";
      case "needs-attention":
        return "bg-yellow-100 text-yellow-700";
      case "at-risk":
        return "bg-red-100 text-red-700";
      case "active":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 70) return "bg-green-500";
    if (progress >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const filteredPastors = pastorProgress.filter((pastor) =>
    pastor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMentors = mentorProgress.filter((mentor) =>
    mentor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#2E6BA5] via-[#2876AC] to-[#3284B8]">
      <AppHeader showFullHeader={true} />

      {/* Stats Cards */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 pt-8 pb-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Total Pastors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-users text-purple-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Total Pastors
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stats.totalPastors}
                  </h3>
                </div>
              </div>
            </div>

            {/* Active Mentors */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-user-tie text-blue-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Active Mentors
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stats.activeMentors}
                  </h3>
                </div>
              </div>
            </div>

            {/* Avg Progress */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-chart-line text-green-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">
                    Avg. Progress
                  </p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stats.avgProgress}%
                  </h3>
                </div>
              </div>
            </div>

            {/* Sessions */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fa-solid fa-calendar-check text-orange-600 text-2xl"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Sessions</p>
                  <h3 className="text-3xl font-bold text-gray-900">
                    {stats.sessions}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 flex-1">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Tabs */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab("pastors")}
                  className={`px-8 py-2.5 rounded-md font-bold text-sm transition-all ${
                    activeTab === "pastors"
                      ? "bg-[#1F2A6E] text-white shadow-md"
                      : "bg-transparent text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pastors
                </button>
                <button
                  onClick={() => setActiveTab("mentors")}
                  className={`px-8 py-2.5 rounded-md font-bold text-sm transition-all ${
                    activeTab === "mentors"
                      ? "bg-[#1F2A6E] text-white shadow-md"
                      : "bg-transparent text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Mentors
                </button>
              </div>
            </div>
          </div>

          {/* Content Based on Tab */}
          {activeTab === "pastors" && (
            <div className="space-y-4">
              {filteredPastors.map((pastor) => (
                <div
                  key={pastor.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-6 items-center">
                    {/* Pastor Info */}
                    <div className="flex items-center gap-4 lg:w-1/4">
                      <Image
                        src={pastor.image}
                        alt={pastor.name}
                        width={80}
                        height={80}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {pastor.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">
                          {pastor.currentPhase}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Mentor: {pastor.mentor}
                        </p>
                        <span
                          className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                            pastor.status
                          )}`}
                        >
                          {pastor.status
                            .split("-")
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-gray-900">
                            Overall Progress
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {pastor.overallProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getProgressColor(
                              pastor.overallProgress
                            )}`}
                            style={{ width: `${pastor.overallProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-700 font-semibold">
                              Roadmap
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {pastor.roadmapProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-blue-600"
                              style={{ width: `${pastor.roadmapProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-700 font-semibold">
                              Assessments
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {pastor.assessmentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-purple-600"
                              style={{
                                width: `${pastor.assessmentProgress}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-700 font-semibold">
                              Assignments
                            </span>
                            <span className="text-xs font-bold text-gray-900">
                              {pastor.assignmentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-green-600"
                              style={{ width: `${pastor.assignmentProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center">
                      <button className="px-6 py-3 bg-[#1F2A6E] text-white rounded-lg font-bold text-sm hover:bg-[#0F1A5E] transition shadow-md">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "mentors" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMentors.map((mentor) => (
                <div
                  key={mentor.id}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  {/* Mentor Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <Image
                      src={mentor.image}
                      alt={mentor.name}
                      width={70}
                      height={70}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      <p className="text-sm text-gray-600 font-medium">
                        {mentor.role}
                      </p>
                      <span
                        className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          mentor.status
                        )}`}
                      >
                        {mentor.status.charAt(0).toUpperCase() +
                          mentor.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">
                        Mentees
                      </span>
                      <span className="text-xl font-bold text-[#2E3B8E]">
                        {mentor.mentees}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">
                        Completed Sessions
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {mentor.completedSessions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">
                        Upcoming
                      </span>
                      <span className="text-xl font-bold text-orange-600">
                        {mentor.upcomingSessions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700 font-medium">
                        Rating
                      </span>
                      <span className="text-xl font-bold text-yellow-500">
                        ⭐ {mentor.overallRating}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-4 py-3 bg-[#1F2A6E] text-white rounded-lg font-bold text-sm hover:bg-[#0F1A5E] transition shadow-md">
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
