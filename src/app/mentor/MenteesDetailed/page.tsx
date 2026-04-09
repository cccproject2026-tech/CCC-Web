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
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorBodyText,
  mentorEmptyPanel,
  mentorFilterPanel,
  mentorGlassCardFrost,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorIconButton,
  mentorMainGradient,
  mentorPageRoot,
  mentorSecondaryCta,
  mentorSelectDark,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { useRouter } from "next/navigation";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { isRemoteImageSrc } from "@/app/utils/image";

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

type ViewMode = "map" | "grid" | "list";

function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

export default function MyMenteesPage() {
  const [filter, setFilter] = useState<"All" | "In-Progress" | "Completed">("In-Progress");
  const [sortBy, setSortBy] = useState("Phase");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (focus !== "pastors" && focus !== "queries") return;
    const t = window.setTimeout(() => {
      document.getElementById("mentees-directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fetchMyMentees = async () => {
      try {
        setLoadError(null);
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) {
          setLoadError("Sign in as a mentor to see your assigned pastors.");
          setMentees([]);
          setLoading(false);
          return;
        }

        const res = await apiGetAssignedUsers(mentorId);
        const raw = res.data?.data;
        const menteeUsers = Array.isArray(raw) ? raw : [];

        const mapped = menteeUsers.map((u: any, i: number) => ({
          id: String(u.id ?? u._id ?? ""),
          name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Mentee",
          role: u.role ?? "",
          desc: "Assigned mentee in mentoring program",
          img: u.profilePicture || IMAGE_POOL[i % IMAGE_POOL.length],
          progress: 0,
        }));

        setMentees(mapped.filter((m) => m.id));
      } catch (err) {
        console.error("Failed to load mentees", err);
        setLoadError("Could not load mentees. Please try again.");
        setMentees([]);
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
            progress: res.data?.data?.overallProgress ?? 0,
            phase: res.data?.data?.currentPhase,
            completed: res.data?.data?.overallCompleted ?? false,
          })),
        ),
      );

      setMentees((prev) =>
        prev.map((m, idx) => {
          const r = results[idx];
          if (!r || r.status !== "fulfilled") return m;
          const v = r.value;
          return {
            ...m,
            progress: v.progress,
            phase: v.phase,
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
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">My Mentees</h1>
          <p className={`mt-2 ${mentorBodyText}`}>
            View and manage pastors assigned to your mentoring care.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 sm:px-8 md:px-20`}>
        <div className="mx-auto max-w-7xl">
          {loadError ? (
            <div className={`mb-6 ${mentorWarningPanel}`}>{loadError}</div>
          ) : null}

          <div id="mentees-directory" className={`${mentorFilterPanel} mb-6`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <MentorSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search mentees..."
                aria-label="Search mentees by name, role, or phase"
                className="w-full max-w-none lg:max-w-md"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("map")}
                  className={`${mentorIconButton} ${viewMode === "map" ? "ring-2 ring-[#8ec5eb]" : ""}`}
                  aria-label="Map view"
                  aria-pressed={viewMode === "map"}
                >
                  <i className="fa-solid fa-location-dot text-[#8ec5eb]" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`${mentorIconButton} ${viewMode === "grid" ? "ring-2 ring-[#8ec5eb]" : ""}`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                >
                  <i className="fa-solid fa-grip text-[#8ec5eb]" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`${mentorIconButton} ${viewMode === "list" ? "ring-2 ring-[#8ec5eb]" : ""}`}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <i className="fa-solid fa-list text-[#8ec5eb]" />
                </button>
              </div>
            </div>
          </div>

          {processedMentees.length > 0 && viewMode !== "map" && (
            <div className="mb-6 flex items-center gap-4 overflow-x-auto pb-2">
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
                      unoptimized={isRemoteImageSrc(mentee.img)}
                      className="rounded-full border-2 border-[#8ec5eb]/50 object-cover shadow-md"
                    />
                    <div className="absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#062946] bg-emerald-400" />
                  </div>
                  <p className="mt-2 w-[72px] truncate text-center text-xs text-[#cde2f2]">{mentee.name}</p>
                </button>
              ))}
            </div>
          )}

          {viewMode === "map" ? (
            <div className={`p-4 sm:p-5 ${mentorGlassCardFrost}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Map view</h2>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={mentorSecondaryCta}
                >
                  <i className="fa-solid fa-xmark mr-2" aria-hidden />
                  Close
                </button>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/15">
                <Image src={MapImg} alt="Map" className="h-[min(480px,55vh)] w-full object-cover" />
              </div>
            </div>
          ) : (
            <>
              <div className={`${mentorFilterPanel} mb-6`}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <MentorFilterTabGroup
                    tabs={["All", "In-Progress", "Completed"] as const}
                    active={filter}
                    onChange={setFilter}
                    aria-label="Mentee progress filter"
                    className="w-full lg:w-auto"
                  />
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-xs font-medium text-[#d9ebf8]">Sort by</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className={`${mentorSelectDark} min-w-[140px]`}
                      aria-label="Sort mentees"
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
              </div>

              {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className={mentorSpinner} />
                  <p className="mt-4 text-sm text-[#cde2f2]">Loading mentees…</p>
                </div>
              )}

              {!loading && !loadError && processedMentees.length === 0 && (
                <div className={mentorEmptyPanel}>
                  {mentees.length === 0
                    ? "No pastors are assigned to you yet."
                    : searchQuery.trim()
                      ? "No mentees match your search. Try a different name, role, or phase."
                      : "No mentees found in this filter."}
                </div>
              )}

              <div
                className={
                  viewMode === "list"
                    ? "mx-auto grid w-full max-w-3xl grid-cols-1 gap-3"
                    : "grid grid-cols-1 gap-5 md:grid-cols-2"
                }
              >
                {!loading &&
                  processedMentees.map((mentee) => (
                    <button
                      key={mentee.id}
                      type="button"
                      onClick={() => router.push(`/mentor/MenteesDetailed/profile?id=${mentee.id}`)}
                      className={`${mentorGlassCardRoadmap} w-full cursor-pointer flex-col items-stretch gap-4 p-5 text-left sm:flex-row sm:items-center sm:gap-6`}
                    >
                      <div className="relative mx-auto shrink-0 sm:mx-0">
                        <Image
                          src={mentee.img}
                          alt={mentee.name}
                          width={120}
                          height={120}
                          unoptimized={isRemoteImageSrc(mentee.img)}
                          className="h-[88px] w-[88px] rounded-xl border border-white/20 object-cover sm:h-[120px] sm:w-[120px]"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col text-left">
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
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex shrink-0 gap-4 text-[#8ec5eb]">
                            <i className="fa-regular fa-envelope pointer-events-none" aria-hidden />
                            <i className="fa-regular fa-comment pointer-events-none" aria-hidden />
                            <i className="fa-solid fa-phone pointer-events-none" aria-hidden />
                            <i className="fa-brands fa-whatsapp pointer-events-none" aria-hidden />
                          </div>
                          {mentee.progress === 100 && (
                            <span className="rounded-lg bg-[#8ec5eb]/20 px-3 py-1 text-xs font-medium text-[#8ec5eb]">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
