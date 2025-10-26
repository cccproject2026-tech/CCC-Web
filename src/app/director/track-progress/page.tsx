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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Track Progress</h1>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          Monitor and analyze progress across all programs and participants
        </p>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Overall Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-users text-[#2E3B8E] text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Pastors</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {pastorProgress.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-user-tie text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Mentors</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {mentorProgress.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-chart-line text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Progress</p>
                  <h3 className="text-2xl font-bold text-gray-900">47%</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-calendar-check text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Sessions</p>
                  <h3 className="text-2xl font-bold text-gray-900">81</h3>
                </div>
              </div>
            </div>
          </div>

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
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("pastors")}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === "pastors"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pastors
                </button>
                <button
                  onClick={() => setActiveTab("mentors")}
                  className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === "mentors"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Pastor Info */}
                    <div className="flex items-center gap-4 lg:w-1/4">
                      <Image
                        src={pastor.image}
                        alt={pastor.name}
                        width={70}
                        height={70}
                        className="rounded-full"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {pastor.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {pastor.currentPhase}
                        </p>
                        <p className="text-xs text-gray-500">
                          Mentor: {pastor.mentor}
                        </p>
                        <span
                          className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
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
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-700">
                            Overall Progress
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {pastor.overallProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(
                              pastor.overallProgress
                            )}`}
                            style={{ width: `${pastor.overallProgress}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              Roadmap
                            </span>
                            <span className="text-xs font-bold">
                              {pastor.roadmapProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-blue-500"
                              style={{ width: `${pastor.roadmapProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              Assessments
                            </span>
                            <span className="text-xs font-bold">
                              {pastor.assessmentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-purple-500"
                              style={{
                                width: `${pastor.assessmentProgress}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">
                              Assignments
                            </span>
                            <span className="text-xs font-bold">
                              {pastor.assignmentProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full bg-green-500"
                              style={{ width: `${pastor.assignmentProgress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center">
                      <button className="px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold text-sm hover:bg-[#1F2A6E] transition">
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
                  className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all"
                >
                  {/* Mentor Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <Image
                      src={mentor.image}
                      alt={mentor.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {mentor.name}
                      </h3>
                      <p className="text-sm text-gray-600">{mentor.role}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(
                          mentor.status
                        )}`}
                      >
                        {mentor.status.charAt(0).toUpperCase() +
                          mentor.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Mentees</span>
                      <span className="text-lg font-bold text-[#2E3B8E]">
                        {mentor.mentees}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">
                        Completed Sessions
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {mentor.completedSessions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Upcoming</span>
                      <span className="text-lg font-bold text-yellow-600">
                        {mentor.upcomingSessions}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Rating</span>
                      <span className="text-lg font-bold text-yellow-500">
                        ⭐ {mentor.overallRating}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold text-sm hover:bg-[#1F2A6E] transition">
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
