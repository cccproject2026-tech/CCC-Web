"use client";
import { useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import Mentor1 from "../../../Assets/mentor1.png";
import Mentor2 from "../../../Assets/mentor2.png";
import Mentor3 from "../../../Assets/mentor3.png";

export default function CourseProgressPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const progressData = [
    {
      id: 1,
      name: "John Doe",
      role: "Pastor",
      image: Mentor1,
      course: "Jump-Start Phase",
      progress: 100,
      status: "completed",
      completedModules: 8,
      totalModules: 8,
      lastActivity: "2 days ago",
    },
    {
      id: 2,
      name: "Jacob Jones",
      role: "Pastor",
      image: Mentor2,
      course: "Self Revitalization",
      progress: 65,
      status: "in-progress",
      completedModules: 8,
      totalModules: 12,
      lastActivity: "1 hour ago",
    },
    {
      id: 3,
      name: "Robert Fox",
      role: "Mentor",
      image: Mentor3,
      course: "Church Empowerment",
      progress: 30,
      status: "in-progress",
      completedModules: 3,
      totalModules: 10,
      lastActivity: "5 hours ago",
    },
    {
      id: 4,
      name: "Peter Smith",
      role: "Pastor",
      image: Mentor1,
      course: "Community Revitalization",
      progress: 100,
      status: "completed",
      completedModules: 15,
      totalModules: 15,
      lastActivity: "1 week ago",
    },
    {
      id: 5,
      name: "Michael Brown",
      role: "Field Mentor",
      image: Mentor2,
      course: "Leadership Development",
      progress: 85,
      status: "in-progress",
      completedModules: 12,
      totalModules: 14,
      lastActivity: "Yesterday",
    },
    {
      id: 6,
      name: "David Wilson",
      role: "Pastor",
      image: Mentor3,
      course: "Multiplication Phase",
      progress: 15,
      status: "at-risk",
      completedModules: 2,
      totalModules: 16,
      lastActivity: "2 weeks ago",
    },
  ];

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return "bg-green-500";
    if (progress >= 50) return "bg-yellow-500";
    if (progress >= 30) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "at-risk":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const filteredData = progressData.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Course Progress</h1>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          Monitor student progress and course completion rates
        </p>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-users text-[#2E3B8E] text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Students</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {progressData.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-check-circle text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {
                      progressData.filter((d) => d.status === "completed")
                        .length
                    }
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-spinner text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">In Progress</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {
                      progressData.filter((d) => d.status === "in-progress")
                        .length
                    }
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">At Risk</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {progressData.filter((d) => d.status === "at-risk").length}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search by name or course..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                {[
                  { value: "all", label: "All" },
                  { value: "completed", label: "Completed" },
                  { value: "in-progress", label: "In Progress" },
                  { value: "at-risk", label: "At Risk" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setFilterStatus(filter.value)}
                    className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                      filterStatus === filter.value
                        ? "bg-[#2E3B8E] text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress List */}
          <div className="space-y-4">
            {filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  {/* User Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={60}
                      height={60}
                      className="rounded-full"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-gray-600">{item.role}</p>
                      <p className="text-sm text-[#2E3B8E] font-semibold">
                        {item.course}
                      </p>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="flex-1 w-full md:w-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        Progress
                      </span>
                      <span className="text-sm font-bold text-gray-900">
                        {item.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className={`h-3 rounded-full ${getProgressColor(
                          item.progress
                        )}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span>
                        {item.completedModules}/{item.totalModules} Modules
                      </span>
                      <span>Last: {item.lastActivity}</span>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-col gap-2 items-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ")}
                    </span>
                    <button className="px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold text-sm hover:bg-[#1F2A6E] transition">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-gray-400 text-4xl"></i>
              </div>
              <p className="text-gray-600 text-lg">No progress data found</p>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
