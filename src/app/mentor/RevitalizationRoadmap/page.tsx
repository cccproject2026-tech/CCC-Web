"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

import MentorHeader from "@/app/Components/MentorHeader";
import RoadmapHero from "@/app/Assets/roadmap-bg.png";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";

import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmaps } from "@/app/Services/roadmaps.service";
import { unwrapRoadmapsList, unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

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

/** Match pastor revitalization-roadmap card treatment */
const roadmapCard =
  "flex w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row";

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
        const body = usersRes.data as { data?: unknown };
        const users = Array.isArray(body?.data) ? body.data : [];

        const progressResults = await Promise.all(
          users.map(async (u: any) => {
            const uid = u._id ?? u.id;
            try {
              const p = await apiGetUserProgress(uid);
              const prog = unwrapProgressData(p);
              return {
                userId: uid,
                progress: prog?.overallProgress ?? 0,
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
        setRoadmaps(unwrapRoadmapsList(res));
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
        className="relative flex h-[180px] items-end bg-cover bg-bottom px-6 pb-6 text-white sm:h-[200px] sm:px-10 sm:pb-8 md:h-[250px] md:px-20 md:pb-10"
        style={{ backgroundImage: `url(${RoadmapHero.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10 max-w-7xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Revitalization Roadmap</h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Open a pastor&apos;s assigned roadmaps or browse templates from the library.
          </p>
        </div>
      </section>

      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 sm:px-8 md:px-16 md:py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex w-full items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 shadow-sm backdrop-blur lg:max-w-md">
              <i className="fa-solid fa-magnifying-glass mr-3 shrink-0 text-[#cde2f2]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === "Pastor" ? "Search pastors…" : "Search roadmaps…"}
                autoComplete="off"
                className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none"
                aria-label={activeTab === "Pastor" ? "Search pastors" : "Search roadmap library"}
              />
              {searchQuery.trim() ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="shrink-0 text-white/60 hover:text-white"
                  aria-label="Clear search"
                >
                  <i className="fa-solid fa-xmark text-sm" />
                </button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-1 items-center overflow-x-auto rounded-xl border border-white/20 bg-white/10 px-2 py-1 shadow-sm backdrop-blur lg:flex-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("Pastor")}
                  className={`whitespace-nowrap rounded-md px-4 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                    activeTab === "Pastor"
                      ? "bg-white text-[#0f4a76]"
                      : "text-[#d9ebf8] hover:bg-white/15"
                  }`}
                >
                  Pastor&apos;s roadmaps
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("Library")}
                  className={`whitespace-nowrap rounded-md px-4 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                    activeTab === "Library"
                      ? "bg-white text-[#0f4a76]"
                      : "text-[#d9ebf8] hover:bg-white/15"
                  }`}
                >
                  Roadmap library
                </button>
              </div>
            </div>
          </div>

          {activeTab === "Pastor" && (
            <>
              {loading && (
                <div className="flex justify-center py-16">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
                </div>
              )}
              {!loading && mentees.length === 0 && (
                <p className="py-16 text-center text-sm text-[#cde2f2]">No assigned pastors yet.</p>
              )}
              {!loading && mentees.length > 0 && filteredPastors.length === 0 && (
                <p className="py-16 text-center text-sm text-[#cde2f2]">
                  No pastors match your search. Try another name, email, or role.
                </p>
              )}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                {!loading &&
                  filteredPastors.map((mentee) => (
                    <button
                      key={mentee._id}
                      type="button"
                      onClick={() => handleUserClick(mentee._id)}
                      className={`text-left ${roadmapCard}`}
                    >
                      <div className="relative m-4 h-[180px] w-full shrink-0 sm:h-[200px] sm:w-[200px]">
                        {isHttpUrl(mentee.profilePicture) ? (
                          <Image
                            src={mentee.profilePicture!}
                            alt={`${mentee.firstName} ${mentee.lastName}`.trim()}
                            width={200}
                            height={200}
                            className="h-full w-full rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                        <div>
                          <h3 className="mb-1 text-base font-semibold text-white md:text-[17px]">
                            {mentee.firstName} {mentee.lastName}
                          </h3>
                          <p className="mb-3 text-sm text-[#cde2f2]">
                            {mentee.profileInfo || mentee.role || "Pastor"}
                          </p>
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-medium text-[#d9ebf8]">Overall progress</span>
                            <span className="rounded bg-[#e6edff] px-2 py-[2px] text-xs font-medium text-[#1e40af]">
                              {Math.min(100, Math.round(mentee.progress))}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full max-w-xs rounded-full bg-white/15">
                            <div
                              className="h-1.5 rounded-full bg-[#8ec5eb]"
                              style={{ width: `${Math.min(100, mentee.progress)}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end sm:mt-0">
                          <span className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76]">
                            View roadmaps
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}

          {activeTab === "Library" && (
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {roadmapLoading && (
                <div className="col-span-full flex justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
                </div>
              )}
              {!roadmapLoading && roadmaps.length > 0 && filteredRoadmaps.length === 0 && (
                <p className="col-span-full py-12 text-center text-sm text-[#cde2f2]">
                  No roadmaps match your search.
                </p>
              )}
              {!roadmapLoading && roadmaps.length === 0 && (
                <p className="col-span-full py-16 text-center text-sm text-[#cde2f2]">
                  No roadmap templates in the library yet.
                </p>
              )}
              {!roadmapLoading &&
                filteredRoadmaps.map((roadmap: any) => {
                  const rid = String(roadmap._id ?? roadmap.id ?? "");
                  const imgOk = isHttpUrl(roadmap.imageUrl);
                  return (
                    <div key={rid || roadmap.name} className={roadmapCard}>
                      <div className="relative m-4 h-[180px] w-full shrink-0 sm:h-[200px] sm:w-[200px]">
                        {imgOk ? (
                          <Image
                            src={roadmap.imageUrl}
                            alt={roadmap.name || "Roadmap"}
                            width={200}
                            height={200}
                            className="h-full w-full rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                        <div>
                          <h3 className="mb-1 text-base font-semibold text-white md:text-[17px]">
                            {roadmap.name}
                          </h3>
                          <p className="line-clamp-3 text-sm text-[#cde2f2]">
                            {roadmap.roadMapDetails || roadmap.description || "—"}
                          </p>
                          <p className="mt-3 text-xs text-[#d9ebf8]">
                            Steps: {roadmap.totalSteps ?? roadmap.roadmaps?.length ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
