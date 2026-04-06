"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import HeroBg from "@/app/Assets/hero-bg.png";
import MapImg from "@/app/Assets/map-view.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { useRouter } from "next/navigation";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

export default function MyMenteesPage() {
  const [filter, setFilter] = useState("In-Progress");
  const [sortBy, setSortBy] = useState("Phase");
  const [isMapView, setIsMapView] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchMyMentees = async () => {
      try {
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) return;

        const res = await apiGetAssignedUsers(mentorId);
        const menteeUsers = res.data.data;

        const mapped = menteeUsers.map((u: any, i: number) => ({
          id: u.id ?? u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          desc: "Assigned mentee in mentoring program",
          img: u.profilePicture || IMAGE_POOL[i % IMAGE_POOL.length],
          progress: 0,
          phase: undefined,
        }));

        setMentees(mapped);
      } catch (err) {
        console.error("Failed to load mentees", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMentees();
  }, []);

  useEffect(() => {
    if (!mentees.length) return;

    const hydrateProgress = async () => {
      const results = await Promise.allSettled(
        mentees.map((m) =>
          apiGetUserProgress(m.id).then((res) => ({
            userId: m.id,
            progress: res.data.data?.overallProgress ?? 0,
            phase: res.data.data?.currentPhase,
            completed: res.data.data?.overallCompleted ?? false,
          })),
        ),
      );

      setMentees((prev) =>
        prev.map((m) => {
          const match = results.find(
            (r) => r.status === "fulfilled" && r.value.userId === m.id,
          ) as PromiseFulfilledResult<{
            userId: string;
            progress: number;
            phase?: string;
            completed: boolean;
          }> | undefined;

          if (!match) return m;

          return {
            ...m,
            progress: match.value.progress,
            phase: match.value.phase,
          };
        }),
      );
    };

    hydrateProgress();
  }, [mentees.length]);

  const processedMentees = useMemo(() => {
    let list = [...mentees];

    if (filter !== "All") {
      list = list.filter((m) => {
        if (filter === "Completed") return m.progress === 100;
        if (filter === "In-Progress") return m.progress < 100;
        return true;
      });
    }

    if (sortBy === "Name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "Progress") {
      list = [...list].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    }

    if (sortBy === "Phase") {
      list = [...list].sort((a, b) => (a.phase || "").localeCompare(b.phase || ""));
    }

    const q = searchQuery.trim();
    if (q) {
      list = list.filter((m) => {
        const phaseStr = m.phase != null && m.phase !== "" ? String(m.phase) : "";
        return (
          textMatchesQuery(m.name || "", q) ||
          textMatchesQuery(m.role || "", q) ||
          textMatchesQuery(m.desc || "", q) ||
          textMatchesQuery(phaseStr, q)
        );
      });
    }

    return list;
  }, [mentees, filter, sortBy, searchQuery]);

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
            <h1 className="text-2xl font-semibold sm:text-3xl">My Mentees</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">
              View and manage pastors assigned to your mentoring care.
            </p>
          </div>

          <div className={`p-4 sm:p-5 ${glassPanel}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex w-full items-center rounded-xl border border-white/20 bg-white/10 sm:max-w-md">
                <i className="fa-solid fa-magnifying-glass px-3 text-[#8ec5eb]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search mentees..."
                  autoComplete="off"
                  className="w-full bg-transparent py-2.5 pr-3 text-sm text-white placeholder:text-white/50 focus:outline-none"
                  aria-label="Search mentees by name, role, or phase"
                />
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="px-2 text-white/60 hover:text-white"
                    aria-label="Clear search"
                  >
                    <i className="fa-solid fa-xmark text-sm" />
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMapView(true)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/15 ${
                    isMapView ? "ring-2 ring-[#8ec5eb]" : ""
                  }`}
                  aria-label="Map view"
                >
                  <i className="fa-solid fa-location-dot text-[#8ec5eb]" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsMapView(false)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/15 ${
                    !isMapView ? "ring-2 ring-[#8ec5eb]" : ""
                  }`}
                  aria-label="Grid view"
                >
                  <i className="fa-solid fa-grip text-[#8ec5eb]" />
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 hover:bg-white/15"
                  aria-label="List view"
                >
                  <i className="fa-solid fa-list text-[#8ec5eb]" />
                </button>
              </div>
            </div>
          </div>

          {processedMentees.length > 0 && (
            <div className="mt-5 flex items-center gap-4 overflow-x-auto pb-2">
              {processedMentees.slice(0, 12).map((mentee) => (
                <button
                  key={mentee.id}
                  type="button"
                  onClick={() => router.push(`/mentor/MenteesDetailed/profile?id=${mentee.id}`)}
                  className="flex min-w-[72px] flex-col items-center"
                >
                  <div className="relative">
                    <Image
                      src={mentee.img || Mentor1}
                      alt={mentee.name}
                      width={64}
                      height={64}
                      className="rounded-full border-2 border-[#8ec5eb]/50 object-cover shadow-md"
                    />
                    <div className="absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#062946] bg-emerald-400" />
                  </div>
                  <p className="mt-2 w-[72px] truncate text-center text-xs text-[#cde2f2]">{mentee.name}</p>
                </button>
              ))}
            </div>
          )}

          <div className="mt-6">
            {isMapView ? (
              <div className={`p-4 sm:p-5 ${glassPanel}`}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Map view</h2>
                  <button
                    type="button"
                    onClick={() => setIsMapView(false)}
                    className="rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
                  >
                    <i className="fa-solid fa-xmark mr-1" /> Close
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-white/15">
                  <Image src={MapImg} alt="Map" className="h-[min(480px,55vh)] w-full object-cover" />
                </div>
              </div>
            ) : (
              <>
                <div className={`mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${glassPanel}`}>
                  <div className="flex flex-wrap rounded-xl border border-white/15 bg-white/5 p-1">
                    {["All", "In-Progress", "Completed"].map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFilter(tab)}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                          filter === tab
                            ? "bg-[#8ec5eb]/25 text-white"
                            : "text-[#cde2f2] hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#cde2f2]">
                    <span>Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/40"
                    >
                      <option className="bg-[#0f4a76] text-white" value="Phase">
                        Phase
                      </option>
                      <option className="bg-[#0f4a76] text-white" value="Progress">
                        Progress
                      </option>
                      <option className="bg-[#0f4a76] text-white" value="Name">
                        Name
                      </option>
                    </select>
                  </div>
                </div>

                {loading && (
                  <p className="py-16 text-center text-sm text-[#cde2f2]">Loading mentees…</p>
                )}

                {!loading && processedMentees.length === 0 && (
                  <p className="py-16 text-center text-sm text-[#cde2f2]">
                    {mentees.length === 0
                      ? "No mentees found in this category."
                      : searchQuery.trim()
                        ? "No mentees match your search. Try a different name, role, or phase."
                        : "No mentees found in this category."}
                  </p>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {!loading &&
                    processedMentees.map((mentee) => (
                      <button
                        key={mentee.id}
                        type="button"
                        onClick={() => router.push(`/mentor/MenteesDetailed/profile?id=${mentee.id}`)}
                        className={`w-full p-4 text-left transition hover:border-white/25 sm:p-5 ${glassPanel}`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          <Image
                            src={mentee.img}
                            alt={mentee.name}
                            width={64}
                            height={64}
                            className="h-16 w-16 shrink-0 rounded-xl border border-white/20 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-base font-semibold text-white">{mentee.name}</h4>
                            <p className="text-sm text-[#cde2f2]">{mentee.role}</p>
                            <p className="mt-1 text-xs text-white/60">{mentee.desc}</p>
                            {mentee.phase != null && mentee.phase !== "" && (
                              <span className="mt-3 inline-block rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-xs font-medium text-[#8ec5eb]">
                                Phase: {String(mentee.phase)}
                              </span>
                            )}
                            <div className="mt-4">
                              <div className="mb-1 flex justify-between text-xs text-[#cde2f2]">
                                <span>Progress</span>
                                <span>{mentee.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-white/15">
                                <div
                                  className="h-1.5 rounded-full bg-[#8ec5eb]"
                                  style={{ width: `${Math.min(100, mentee.progress)}%` }}
                                />
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                              <div className="flex gap-4 text-[#8ec5eb]">
                                <i className="fa-regular fa-envelope cursor-pointer hover:text-white" />
                                <i className="fa-regular fa-comment cursor-pointer hover:text-white" />
                                <i className="fa-solid fa-phone cursor-pointer hover:text-white" />
                                <i className="fa-brands fa-whatsapp cursor-pointer hover:text-white" />
                              </div>
                              {mentee.progress === 100 && (
                                <span className="rounded-lg bg-[#8ec5eb]/20 px-3 py-1 text-xs font-medium text-[#8ec5eb]">
                                  Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
