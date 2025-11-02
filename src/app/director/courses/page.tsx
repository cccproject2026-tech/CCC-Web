"use client";
import { useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";
import Card5 from "../../Assets/card5.png";
import Card6 from "../../Assets/card6.png";

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const courses = [
    {
      id: 1,
      title: "Jump-Start Phase",
      description:
        "Introduction to church revitalization fundamentals and key concepts",
      duration: "Months 1-2",
      modules: 8,
      participants: 45,
      category: "foundation",
      image: Card1,
    },
    {
      id: 2,
      title: "Self Revitalization",
      description: "Focus on personal growth and spiritual development",
      duration: "Months 3-6",
      modules: 12,
      participants: 38,
      category: "personal",
      image: Card2,
    },
    {
      id: 3,
      title: "Church Empowerment",
      description: "Building capacity and empowering church leaders",
      duration: "Months 7-12",
      modules: 10,
      participants: 32,
      category: "leadership",
      image: Card3,
    },
    {
      id: 4,
      title: "Community Revitalization",
      description: "Engaging with and transforming your community",
      duration: "Months 13-18",
      modules: 15,
      participants: 28,
      category: "community",
      image: Card4,
    },
    {
      id: 5,
      title: "Leadership Development",
      description: "Advanced leadership training and mentorship",
      duration: "Months 19-24",
      modules: 14,
      participants: 25,
      category: "leadership",
      image: Card5,
    },
    {
      id: 6,
      title: "Multiplication Phase",
      description: "Multiplying impact and creating sustainable growth",
      duration: "Months 25-30",
      modules: 16,
      participants: 20,
      category: "growth",
      image: Card6,
    },
  ];

  const categories = [
    { value: "all", label: "All Courses" },
    { value: "foundation", label: "Foundation" },
    { value: "personal", label: "Personal Growth" },
    { value: "leadership", label: "Leadership" },
    { value: "community", label: "Community" },
    { value: "growth", label: "Growth" },
  ];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-12 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">Courses</h1>
        <p className="text-white/90 text-lg max-w-2xl mx-auto">
          Explore our comprehensive course catalog designed to equip pastors and
          mentors for effective ministry
        </p>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                      selectedCategory === category.value
                        ? "bg-[#2E3B8E] text-white"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-book-open text-[#2E3B8E] text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Courses</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {courses.length}
                  </h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-user-graduate text-green-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Active Students</p>
                  <h3 className="text-2xl font-bold text-gray-900">188</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-certificate text-yellow-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Completed</p>
                  <h3 className="text-2xl font-bold text-gray-900">142</h3>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fa-solid fa-clock text-blue-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Avg. Duration</p>
                  <h3 className="text-2xl font-bold text-gray-900">4.5 Mo</h3>
                </div>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Course Image */}
                <div className="h-48 overflow-hidden bg-gradient-to-br from-[#2E3B8E] to-[#4A5FB8] relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src={course.image}
                      alt={course.title}
                      width={120}
                      height={120}
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {course.description}
                  </p>

                  {/* Course Meta */}
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <i className="fa-regular fa-clock"></i>
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fa-solid fa-book"></i>
                      {course.modules} Modules
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"
                        ></div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      {course.participants} participants
                    </span>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-4 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition-all">
                    View Course
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-white text-4xl"></i>
              </div>
              <p className="text-white text-lg">No courses found</p>
            </div>
          )}
        </div>
      </section>

      <AppFooter />
    </div>
  );
}
