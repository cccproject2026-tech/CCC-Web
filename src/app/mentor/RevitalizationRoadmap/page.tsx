"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

import MentorHeader from "@/app/Components/MentorHeader";

import HeroBg from "@/app/Assets/roadmap-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";

import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmaps } from "@/app/Services/roadmaps.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

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
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Pastor");
  const [sortBy, setSortBy] = useState("Country");

  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const mentor = getMentorFromCookie();

        if (!mentor?.id) return;

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

  const handleUserClick = (userId: string) => {
    router.push(`/mentor/RevitalizationRoadmap/home?userId=${userId}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <MentorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative h-[280px] bg-cover bg-center flex flex-col justify-end px-4 md:px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/50 to-transparent"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-semibold">Revitalization Roadmap</h1>
        </div>
      </section>

      {/* MAIN */}
      <main className="flex-1 px-4 md:px-20 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">

          {/* SEARCH + TABS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">

            <div className="flex items-center w-full sm:w-[340px] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab("Pastor")}
                className={`px-6 py-[8px] text-sm ${activeTab === "Pastor"
                  ? "bg-[#103C8C] text-white"
                  : "text-gray-600"
                  }`}
              >
                Pastor’s Roadmaps
              </button>

              <button
                onClick={() => setActiveTab("Library")}
                className={`px-6 py-[8px] text-sm ${activeTab === "Library"
                  ? "bg-[#103C8C] text-white"
                  : "text-gray-600"
                  }`}
              >
                Roadmap Library
              </button>
            </div>
          </div>

          {/* MENTEES */}
          {activeTab === "Pastor" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mentees.map((mentee) => (
                <div
                  key={mentee._id}
                  onClick={() => handleUserClick(mentee._id)}
                  className="flex bg-white rounded-xl border border-[#E5EAF1] overflow-hidden cursor-pointer"
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

                  <div className="p-4 flex flex-col justify-between text-[#0B1C58] flex-1">
                    <div>
                      <h4 className="text-[15px] font-semibold">
                        {mentee.firstName} {mentee.lastName}
                      </h4>

                      <p className="text-[13px] text-gray-500 mb-2">
                        {mentee.profileInfo || mentee.role}
                      </p>

                      <p className="text-[12px] mb-1">Tasks Completed</p>

                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 h-[6px] rounded-full">
                          <div
                            className="h-[6px] bg-[#00B16A] rounded-full"
                            style={{ width: `${mentee.progress}%` }}
                          />
                        </div>

                        <span className="text-[12px]">{mentee.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIBRARY */}
          {activeTab === "Library" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

              {roadmapLoading && <p>Loading roadmaps...</p>}

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
                      <h3 className="font-semibold text-[15px]">
                        {roadmap.name}
                      </h3>

                      <p className="text-[13px] text-gray-500 mb-2">
                        {roadmap.roadMapDetails}
                      </p>

                      <div className="text-xs text-gray-400">
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