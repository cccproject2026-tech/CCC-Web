"use client";
import { useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";import AppHero from "@/app/Components/Hero/AppHero";
import MentorBg from "../../../Assets/mentor-bg.png";
import Card1 from "../../../Assets/card1.png";
import Card2 from "../../../Assets/card2.png";
import Card3 from "../../../Assets/card3.png";
import Card4 from "../../../Assets/card4.png";
import Card5 from "../../../Assets/card5.png";
import Card6 from "../../../Assets/card6.png";
import Card7 from "../../../Assets/card7.png";
import Card8 from "../../../Assets/card8.png";

export default function CourseLibraryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  const libraryItems = [
    {
      id: 1,
      title: "Church Leadership Fundamentals",
      description: "Essential principles for effective church leadership",
      type: "course",
      modules: 10,
      duration: "6 weeks",
      level: "Beginner",
      image: Card1,
    },
    {
      id: 2,
      title: "Community Engagement Strategies",
      description: "Practical approaches to community outreach",
      type: "workshop",
      modules: 5,
      duration: "3 weeks",
      level: "Intermediate",
      image: Card2,
    },
    {
      id: 3,
      title: "Spiritual Formation for Pastors",
      description: "Deepening personal spiritual life and ministry",
      type: "course",
      modules: 12,
      duration: "8 weeks",
      level: "All Levels",
      image: Card3,
    },
    {
      id: 4,
      title: "Church Revitalization Toolkit",
      description: "Comprehensive resources for church renewal",
      type: "resource",
      modules: 8,
      duration: "Self-paced",
      level: "Advanced",
      image: Card4,
    },
    {
      id: 5,
      title: "Mentoring Best Practices",
      description: "Effective mentoring techniques and strategies",
      type: "course",
      modules: 7,
      duration: "4 weeks",
      level: "Intermediate",
      image: Card5,
    },
    {
      id: 6,
      title: "Conflict Resolution in Ministry",
      description: "Navigating and resolving church conflicts",
      type: "workshop",
      modules: 6,
      duration: "2 weeks",
      level: "Intermediate",
      image: Card6,
    },
    {
      id: 7,
      title: "Multiplication Principles",
      description: "Growing and multiplying church impact",
      type: "course",
      modules: 14,
      duration: "10 weeks",
      level: "Advanced",
      image: Card7,
    },
    {
      id: 8,
      title: "Leadership Development Program",
      description: "Comprehensive leadership training curriculum",
      type: "program",
      modules: 20,
      duration: "16 weeks",
      level: "All Levels",
      image: Card8,
    },
  ];

  const filters = [
    { value: "all", label: "All", icon: "fa-list" },
    { value: "course", label: "Courses", icon: "fa-book-open" },
    { value: "workshop", label: "Workshops", icon: "fa-chalkboard-teacher" },
    { value: "resource", label: "Resources", icon: "fa-folder-open" },
    { value: "program", label: "Programs", icon: "fa-graduation-cap" },
  ];

  const filteredItems = libraryItems.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || item.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "course":
        return "bg-blue-100 text-blue-700";
      case "workshop":
        return "bg-purple-100 text-purple-700";
      case "resource":
        return "bg-green-100 text-green-700";
      case "program":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course":
        return "fa-book-open";
      case "workshop":
        return "fa-chalkboard-teacher";
      case "resource":
        return "fa-folder-open";
      case "program":
        return "fa-graduation-cap";
      default:
        return "fa-file";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section */}
      <AppHero
        title="Course Library"
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director" },
          { label: "Courses", href: "/director/courses" },
          { label: "Course Library" },
        ]}
      >
        <p className="text-white/90 text-lg max-w-2xl">
          Access our comprehensive collection of courses, workshops, and
          resources
        </p>
      </AppHero>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
              {/* Search Bar */}
              <div className="flex-1 w-full">
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search library..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedFilter(filter.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all ${
                    selectedFilter === filter.value
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <i className={`fa-solid ${filter.icon}`}></i>
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {filters.slice(1).map((filter) => {
              const count = libraryItems.filter(
                (item) => item.type === filter.value
              ).length;
              return (
                <div
                  key={filter.value}
                  className="bg-white rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#2E3B8E]/10 rounded-lg flex items-center justify-center">
                      <i
                        className={`fa-solid ${filter.icon} text-[#2E3B8E]`}
                      ></i>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">{filter.label}</p>
                      <h3 className="text-2xl font-bold text-gray-900">
                        {count}
                      </h3>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Library Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all"
              >
                {/* Image */}
                <div className="h-40 bg-gradient-to-br from-[#2E3B8E] to-[#4A5FB8] relative flex items-center justify-center p-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={100}
                    height={100}
                    className="object-contain"
                  />
                  <span
                    className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold ${getTypeColor(
                      item.type
                    )}`}
                  >
                    <i
                      className={`fa-solid ${getTypeIcon(item.type)} mr-1`}
                    ></i>
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Meta Info */}
                  <div className="space-y-2 mb-4 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-book text-[#2E3B8E]"></i>
                      <span>{item.modules} Modules</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-regular fa-clock text-[#2E3B8E]"></i>
                      <span>{item.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-signal text-[#2E3B8E]"></i>
                      <span>{item.level}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button className="w-full px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold text-sm hover:bg-[#1F2A6E] transition-all">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-gray-400 text-4xl"></i>
              </div>
              <p className="text-gray-600 text-lg">No items found</p>
            </div>
          )}
        </div>
      </section>    </div>
  );
}
