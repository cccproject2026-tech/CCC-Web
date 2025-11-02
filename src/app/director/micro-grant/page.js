"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";
import MicroGrantCard from "@/app/Components/Card/MicroGrantCard";
import MicroGrantBg from "../../Assets/micro-grant.jpg";
import UserProfile from "@/app/Assets/user-profile.png";

const page = () => {
  const [activeTab, setActiveTab] = useState("new");
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Sample data for cards
  const cards = Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    name: "Robert Fox",
    role: "Pastor",
    date: i % 3 === 0 ? "15 Nov 2024" : i % 3 === 1 ? "09:43 AM" : "07:40 AM",
    image: UserProfile,
  }));

  // Filter tabs configuration
  const tabs = [
    { id: "new", label: "New", badge: "12" },
    { id: "pending", label: "Pending", badge: "3" },
    { id: "accepted", label: "Accepted", badge: null },
  ];

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] to-[#2E3B8E]">
      {/* Hero Section */}
      <AppHero
        title="Micro Grant"
        backgroundImageUrl={MicroGrantBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Micro Grant" },
        ]}
      >
        <p className="text-white/90 text-lg max-w-2xl">
          Manage and track micro grant applications
        </p>
      </AppHero>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-10">
            {/* Search Bar */}
            <div className="flex-1 w-full md:max-w-md">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#2E3B8E] text-gray-900 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filter Tabs and Edit Form Button */}
            <div className="flex items-center gap-4">
              {/* Filter Tabs */}
              <div className="bg-white inline-flex h-10 px-1 items-center gap-1 rounded-lg shadow-md">
                {tabs.map((tab, index) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 h-8 rounded-md capitalize font-semibold text-sm transition-all ${
                      activeTab === tab.id
                        ? "bg-[#1E366F] text-white"
                        : "bg-transparent text-[#1E366F]"
                    } ${index === 0 ? "rounded-l-lg" : ""} ${
                      index === tabs.length - 1 ? "rounded-r-lg" : ""
                    }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className="absolute -top-2 -right-2 bg-[#FFD700] text-[#2E3B8E] text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Edit Form Button */}
              <button
                onClick={() => router.push("/director/micro-grant/edit")}
                className="h-10 px-4 rounded-lg bg-white text-[#1E366F] font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-md"
              >
                <i className="fa-solid fa-pencil text-base"></i>
                Edit Form
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <MicroGrantCard
                key={card.id}
                image={card.image}
                name={card.name}
                role={card.role}
                date={card.date}
                slug={card.id.toString()}
              />
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-regular fa-folder-open text-white text-4xl"></i>
              </div>
              <p className="text-white text-lg">No applications found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default page;
