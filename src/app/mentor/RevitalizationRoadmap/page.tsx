"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/roadmap-bg.png"; // 🟦 use your dark blue pattern bg
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmaps } from "@/app/Services/roadmaps.service";

type Mentee = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profileInfo?: string;
  profilePicture?: string;
  progress: number;
};

export default function RevitalizationRoadmapPage() {
  const [activeTab, setActiveTab] = useState("Pastor");
  const [sortBy, setSortBy] = useState("Country");
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const mentorStr = localStorage.getItem("mentor");
        if (!mentorStr) throw new Error("Mentor missing in localStorage");

        const mentor = JSON.parse(mentorStr);

        const usersRes = await apiGetAssignedUsers(mentor.id);
        const users = usersRes.data.data || [];

        const progressResults = await Promise.all(
          users.map(async (u: any) => {
            try {
              const p = await apiGetUserProgress(u._id);
              return {
                userId: u._id,
                progress: p.data.data?.overallProgress ?? 0,
              };
            } catch {
              return { userId: u._id, progress: 0 };
            }
          })
        );

        const merged: Mentee[] = users.map((u: any) => {
          const found = progressResults.find((p) => p.userId === u._id);

          return {
            _id: u._id,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            profileInfo: u.profileInfo,
            profilePicture: u.profilePicture,
            progress: found?.progress ?? 0,
          };
        });

        setMentees(merged);
      } catch (err) {
        console.error("Fetch failed →", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);


  useEffect(() => {
    if (activeTab !== "Library" || roadmaps.length > 0) return;

    const fetchRoadmaps = async () => {
      try {
        setRoadmapLoading(true);

        const res = await apiGetRoadmaps();
        setRoadmaps(res.data?.data || []);

      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
      } finally {
        setRoadmapLoading(false);
      }
    };

    fetchRoadmaps();
  }, [activeTab]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <MentorHeader showFullHeader={true} />

      {/* 🟦 HERO SECTION */}
      <section
        className="relative h-[280px] bg-cover bg-center flex flex-col justify-end px-4 md:px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/50 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold">Revitalization Roadmap</h1>
        </div>
      </section>

      {/* 🟩 MAIN CONTENT */}
      <main className="flex-1 px-4 md:px-20 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">
          {/* 🔍 SEARCH + TABS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            {/* Search Input */}
            <div className="flex items-center w-full sm:w-[340px] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            {/* Toggle Buttons */}
            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab("Pastor")}
                className={`px-6 py-[8px] text-sm font-medium transition-all duration-200 ${activeTab === "Pastor"
                  ? "bg-[#103C8C] text-white"
                  : "text-gray-600 hover:text-[#103C8C]"
                  }`}
              >
                Pastor’s Roadmaps
              </button>
              <button
                onClick={() => setActiveTab("Library")}
                className={`px-6 py-[8px] text-sm font-medium transition-all duration-200 ${activeTab === "Library"
                  ? "bg-[#103C8C] text-white"
                  : "text-gray-600 hover:text-[#103C8C]"
                  }`}
              >
                Roadmap Library
              </button>
            </div>
          </div>

          {/* 🧑‍🤝‍🧑 MENTEE AVATARS */}
          <div className="flex items-center gap-6 mb-10 overflow-x-auto pb-2">
            {[Mentor1, Mentor2, Mentor3, Mentor1, Mentor2].map((img, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="relative">
                  <Image
                    src={img}
                    alt="Mentee"
                    width={70}
                    height={70}
                    className="rounded-full border-4 border-[#9D8CFF] shadow-md"
                  />
                  <div className="absolute -bottom-1 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <p className="text-sm mt-2">John Doe</p>
              </div>
            ))}
          </div>

          {/* 🔽 SORT DROPDOWN */}
          <div className="flex justify-end items-center mb-8">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-white/80">Sort By</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border border-white/40 text-white rounded-md px-3 py-1 text-sm focus:outline-none"
              >
                <option className="text-black">Country</option>
                <option className="text-black">Phase</option>
                <option className="text-black">Progress</option>
              </select>
            </div>
          </div>

          {/* 🧱 ROADMAP CARDS */}
          {/* 🧱 CONTENT */}
          {activeTab === "Pastor" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mentees.map((mentee) => (
                <div
                  key={mentee._id}
                  className="flex bg-white rounded-xl border border-[#E5EAF1] overflow-hidden"
                >
                  <div className="w-[150px] h-[150px] flex-shrink-0">
                    <Image
                      src={mentee.profilePicture || Mentor1}
                      alt={mentee.firstName}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex flex-col justify-between p-4 flex-1 text-[#0B1C58]">
                    <div>
                      <h4 className="text-[15px] font-semibold mb-0.5">
                        {mentee.firstName} {mentee.lastName}
                      </h4>

                      <p className="text-[13px] text-[#6B7280] mb-2 leading-snug">
                        {mentee.profileInfo || mentee.role}
                      </p>

                      <div className="inline-block bg-[#EAF4FF] text-[#0F4A85] text-[12px] px-3 py-[3px] rounded-full font-medium mb-3">
                        Phase : {mentee.role}
                      </div>

                      <p className="text-[12px] text-[#6B7280] mb-1 font-medium">
                        Tasks Completed
                      </p>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-[6px] rounded-full">
                          <div
                            className="h-[6px] bg-[#00B16A] rounded-full"
                            style={{ width: `${mentee.progress}%` }}
                          />
                        </div>

                        <span className="text-[12px] text-[#6B7280]">
                          {mentee.progress}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 text-[#0F4A85] mt-4 text-[15px]">
                      <i className="fa-regular fa-envelope cursor-pointer hover:text-[#0B1C58]" />
                      <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]" />
                      <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]" />
                      <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "Library" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {roadmapLoading && (
                <p className="text-white">Loading roadmaps...</p>
              )}

              {!roadmapLoading &&
                roadmaps.map((roadmap) => (
                  <div
                    key={roadmap._id}
                    className="bg-white rounded-xl border border-[#E5EAF1] overflow-hidden text-[#0B1C58]"
                  >
                    <div className="h-[150px] w-full">
                      <Image
                        src={roadmap.imageUrl || HeroBg}
                        alt={roadmap.name}
                        width={400}
                        height={150}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="font-semibold text-[15px] mb-1">
                        {roadmap.name}
                      </h3>

                      <p className="text-[13px] text-gray-500 mb-3">
                        {roadmap.roadMapDetails}
                      </p>

                      <div className="flex justify-between text-[12px] text-gray-400">
                        <span>{roadmap.duration}</span>
                        <span>{roadmap.type}</span>
                      </div>

                      <div className="mt-3 text-[12px] text-gray-500">
                        Steps: {roadmap.totalSteps}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
