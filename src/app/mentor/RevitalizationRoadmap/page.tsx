"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/hero-bg.png";
import RoadmapHero from "@/app/Assets/roadmap-bg.png";
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

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

export default function RevitalizationRoadmapPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Pastor");
  const [searchQuery, setSearchQuery] = useState("");

  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const libraryFetchedRef = useRef(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) return;

        const usersRes = await apiGetAssignedUsers(mentorId);
        const users = usersRes.data.data || [];

        const progressResults = await Promise.all(
          users.map(async (u: any) => {
            const uid = u._id ?? u.id;
            try {
              const p = await apiGetUserProgress(uid);
              return {
                userId: uid,
                progress: p.data.data?.overallProgress ?? 0,
              };
            } catch {
              return { userId: uid, progress: 0 };
            }
          }),
        );

        const merged: Mentee[] = users.map((u: any) => {
          const uid = u._id ?? u.id;
          const found = progressResults.find((p) => p.userId === uid);

          return {
            _id: uid,
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
    if (activeTab !== "Library" || libraryFetchedRef.current) return;

    const fetchRoadmaps = async () => {
      try {
        setRoadmapLoading(true);
        libraryFetchedRef.current = true;
        const res = await apiGetRoadmaps();
        const body = res.data as { data?: unknown };
        const raw = body?.data;
        setRoadmaps(Array.isArray(raw) ? raw : []);
      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
        libraryFetchedRef.current = false;
      } finally {
        setRoadmapLoading(false);
      }
    };

    fetchRoadmaps();
  }, [activeTab]);

  const handleUserClick = (userId: string) => {
    router.push(`/mentor/RevitalizationRoadmap/home?userId=${userId}`);
  };

  const filteredPastors = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return mentees;
    return mentees.filter((m) => {
      const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim();
      return (
        matchesQuery(fullName, q) ||
        matchesQuery(m.email || "", q) ||
        matchesQuery(m.role || "", q) ||
        matchesQuery(m.profileInfo || "", q)
      );
    });
  }, [mentees, searchQuery]);

  const filteredRoadmaps = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return roadmaps;
    return roadmaps.filter((r: any) => {
      const name = String(r.name ?? "");
      const details = String(r.roadMapDetails ?? r.description ?? "");
      const extra = String(r.category ?? r.slug ?? "");
      return matchesQuery(name, q) || matchesQuery(details, q) || matchesQuery(extra, q);
    });
  }, [roadmaps, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold sm:text-3xl">Revitalization Roadmap</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">
              Open a pastor&apos;s roadmap or browse templates from the library.
            </p>
          </div>

          <div className={`p-4 sm:p-5 ${glassPanel}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full min-w-0 items-center rounded-xl border border-white/20 bg-white/10 sm:max-w-lg">
                <i className="fa-solid fa-magnifying-glass shrink-0 px-3 text-[#8ec5eb]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    activeTab === "Pastor"
                      ? "Search pastors by name, email, or role..."
                      : "Search roadmaps by name or description..."
                  }
                  autoComplete="off"
                  className="w-full min-w-0 flex-1 bg-transparent py-2.5 pr-2 text-sm text-white placeholder:text-white/50 focus:outline-none"
                  aria-label={activeTab === "Pastor" ? "Search pastors" : "Search roadmap library"}
                />
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="shrink-0 px-2 text-white/60 hover:text-white"
                    aria-label="Clear search"
                  >
                    <i className="fa-solid fa-xmark text-sm" />
                  </button>
                ) : null}
              </div>

              <div className="flex flex-wrap rounded-xl border border-white/15 bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("Pastor")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "Pastor"
                      ? "bg-[#8ec5eb]/25 text-white"
                      : "text-[#cde2f2] hover:bg-white/10"
                  }`}
                >
                  Pastor&apos;s Roadmaps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Library")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    activeTab === "Library"
                      ? "bg-[#8ec5eb]/25 text-white"
                      : "text-[#cde2f2] hover:bg-white/10"
                  }`}
                >
                  Roadmap Library
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {activeTab === "Pastor" && (
              <>
                {loading && (
                  <p className="py-16 text-center text-sm text-[#cde2f2]">Loading pastors…</p>
                )}
                {!loading && mentees.length === 0 && (
                  <p className="py-16 text-center text-sm text-[#cde2f2]">No assigned pastors yet.</p>
                )}
                {!loading && mentees.length > 0 && filteredPastors.length === 0 && (
                  <p className="py-16 text-center text-sm text-[#cde2f2]">
                    No pastors match your search. Try another name, email, or role.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {!loading &&
                    filteredPastors.map((mentee) => (
                      <button
                        key={mentee._id}
                        type="button"
                        onClick={() => handleUserClick(mentee._id)}
                        className={`flex w-full overflow-hidden text-left transition hover:border-white/25 ${glassPanel}`}
                      >
                        <div className="relative h-[140px] w-[120px] shrink-0 sm:h-[160px] sm:w-[140px]">
                          <Image
                            src={mentee.profilePicture || Mentor1}
                            alt={mentee.firstName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5">
                          <h4 className="text-base font-semibold text-white">
                            {mentee.firstName} {mentee.lastName}
                          </h4>
                          <p className="mt-1 text-sm text-[#cde2f2]">
                            {mentee.profileInfo || mentee.role}
                          </p>
                          <p className="mt-3 text-xs text-white/70">Tasks completed</p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-white/15">
                              <div
                                className="h-1.5 rounded-full bg-[#8ec5eb]"
                                style={{ width: `${Math.min(100, mentee.progress)}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[#8ec5eb]">{mentee.progress}%</span>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}

            {activeTab === "Library" && (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {roadmapLoading && (
                  <p className="col-span-full py-12 text-center text-sm text-[#cde2f2]">
                    Loading roadmaps…
                  </p>
                )}
                {!roadmapLoading && roadmaps.length > 0 && filteredRoadmaps.length === 0 && (
                  <p className="col-span-full py-12 text-center text-sm text-[#cde2f2]">
                    No roadmaps match your search. Try another title or keyword.
                  </p>
                )}
                {!roadmapLoading && roadmaps.length === 0 && (
                  <p className="col-span-full py-16 text-center text-sm text-[#cde2f2]">
                    No roadmap templates in the library yet.
                  </p>
                )}
                {!roadmapLoading &&
                  filteredRoadmaps.map((roadmap) => {
                    const rid = String(roadmap._id ?? roadmap.id ?? "");
                    return (
                    <div
                      key={rid || roadmap.name}
                      className={`overflow-hidden ${glassPanel}`}
                    >
                      <div className="relative h-[140px] w-full">
                        <Image
                          src={roadmap.imageUrl || RoadmapHero}
                          alt={roadmap.name}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#062946]/90 to-transparent" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-white">{roadmap.name}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-[#cde2f2]">
                          {roadmap.roadMapDetails}
                        </p>
                        <p className="mt-3 text-xs text-white/55">Steps: {roadmap.totalSteps}</p>
                      </div>
                    </div>
                  );
                  })}
              </div>
            )}
          </div>
        </div>
      </section>

      <PastorFooter />
    </div>
  );
}
