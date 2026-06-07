"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/app/Services/config/axios-instance";
import HeroBg from "@/app/Assets/hero-bg.png";
import MapImg from "@/app/Assets/map-view.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import { apiGetDocuments } from "@/app/Services/api";
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
const getInitialsAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=173653&color=ffffff`;
const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];


type ViewMode = "map" | "grid" | "list";

function textMatchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

export default function MyMenteesPage() {
  const [filter, setFilter] = useState<"All" | "In-Progress" | "Completed">("All");

  const [sortBy, setSortBy] = useState("Newly Added");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);
const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
const [drawerDocuments, setDrawerDocuments] = useState<any[]>([]);
const [drawerDocsLoading, setDrawerDocsLoading] = useState(false);
const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);

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


const mapped = menteeUsers.map((u: any, i: number) => {
  console.log("RAW MENTEE USER:", u);

  return {
    id: String(u.id ?? u._id ?? ""),
    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Mentee",
    role: u.role ?? "",
    status: u.status,
    desc: "Assigned mentee in mentoring program",
    img: u.profilePicture || getInitialsAvatar(`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()),
    progress: 0,
    createdAt: u.createdAt,
    email: u.email,
    phoneNumber: u.phoneNumber,
    title: u.title,
    churchDetails: u.churchDetails,
    country: u.country,
    state: u.state,
    city: u.city,
    interest: u.interest,
  };
});

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

    // if (sortBy === "Phase") {
    //   list = [...list].sort((a, b) => (a.phase || "").localeCompare(b.phase || ""));
    // }
    if (sortBy === "Newly Added") {
  list = [...list].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
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
const openMenteeDrawer = async (mentee: any) => {
  setSelectedMentee(mentee);
  try {
  const searchValue = mentee.email || mentee.name;
  const interestRes = await axiosInstance.get(
    `/interests?search=${encodeURIComponent(searchValue)}`
  );

  const interests = Array.isArray(interestRes.data?.data)
    ? interestRes.data.data
    : [];

  const matchedInterest = interests.find((item: any) => {
    const interestUserId = String(item?.user?._id ?? item?.userId ?? "");
    const sameUser = interestUserId && interestUserId === String(mentee.id);

    const sameEmail =
      item?.email &&
      mentee.email &&
      String(item.email).toLowerCase() === String(mentee.email).toLowerCase();

    return sameUser || sameEmail;
  });

  if (matchedInterest) {
    setSelectedMentee({
      ...mentee,
      ...matchedInterest,
      id: mentee.id,
      name: mentee.name,
      img: mentee.img,
      role: mentee.role,
      status: mentee.status || matchedInterest.status,
      interest: matchedInterest,
    });
  }
} catch (error) {
  console.error("Failed to load interest details", error);
}
  setProfileDrawerOpen(true);
  setDrawerDocuments([]);
  setDrawerDocsLoading(true);

  try {
    const res = await apiGetDocuments(mentee.id);
    setDrawerDocuments(Array.isArray(res.data?.data) ? res.data.data : []);
  } catch (error) {
    console.error("Failed to load mentee documents", error);
    setDrawerDocuments([]);
  } finally {
    setDrawerDocsLoading(false);
  }
};

const handleCardMenuAction = (action: "schedule" | "roadmap" | "assessments", mentee: any) => {
  setOpenCardMenuId(null);

  if (action === "schedule") {
    router.push(`/mentor/MentorSchedule?userId=${encodeURIComponent(mentee.id)}`);
    return;
  }

  // if (action === "roadmap") {
  //   router.push(`/mentor/revitalization-roadmap?userId=${encodeURIComponent(mentee.id)}`);
  //   return;
  // }
  if (action === "roadmap") {
  router.push(
    `/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(mentee.id)}`
  );
  return;
}

  if (action === "assessments") {
    router.push(`/mentor/MentorAssessments?menteeId=${encodeURIComponent(mentee.id)}`);
  }
};
  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-0 pb-10 pt-4"
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

      <main className={`${mentorMainGradient} flex-1 px-0 py-10`}>
        <div className="w-full">
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
                {/* <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`${mentorIconButton} ${viewMode === "list" ? "ring-2 ring-[#8ec5eb]" : ""}`}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                >
                  <i className="fa-solid fa-list text-[#8ec5eb]" />
                </button> */}
              </div>
            </div>
          </div>

          {processedMentees.length > 0 && viewMode !== "map" && (
            <div className="mb-6 flex items-center gap-4 overflow-x-auto pb-2">
              {processedMentees.slice(0, 12).map((mentee) => (
                <button
                  key={mentee.id}
                  type="button"
                  // onClick={() => router.push(`/mentor/MenteesDetailed/profile?id=${mentee.id}`)}
                  onClick={() => openMenteeDrawer(mentee)}
                  className="flex min-w-[72px] flex-col items-center"
                >
                  <div className="relative">
                    <Image
                      src={mentee.img || Mentor1}
                      alt={mentee.name}
                      width={64}
                      height={64}
                      unoptimized={isRemoteImageSrc(mentee.img)}
                      // className="rounded-full border-2 border-[#8ec5eb]/50 object-cover shadow-md"
                      className="h-16 w-16 rounded-full border-2 border-[#8ec5eb]/50 object-cover shadow-md"
                    />
                    {/* <div className="absolute -bottom-0.5 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#062946] bg-emerald-400" /> */}
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
              {/* <div className="overflow-hidden rounded-xl border border-white/15">
                <Image src={MapImg} alt="Map" className="h-[min(480px,55vh)] w-full object-cover" />
              </div> */}
              <div className="relative overflow-hidden rounded-xl border border-white/15">
  <Image src={MapImg} alt="Map" className="h-[min(480px,55vh)] w-full object-cover" />

  {processedMentees.slice(0, 8).map((mentee, index) => {
    const pins = [
      { left: "22%", top: "38%" },
      { left: "36%", top: "52%" },
      { left: "48%", top: "42%" },
      { left: "58%", top: "58%" },
      { left: "68%", top: "45%" },
      { left: "76%", top: "62%" },
      { left: "42%", top: "68%" },
      { left: "30%", top: "60%" },
    ];

    return (
      <button
        key={mentee.id}
        type="button"
        onClick={() => openMenteeDrawer(mentee)}
        className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
        style={pins[index]}
        title={mentee.name}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#0f4a76] text-white shadow-lg">
          <i className="fa-solid fa-location-dot text-[#8ec5eb]" />
        </span>
        <span className="mt-1 max-w-[90px] truncate rounded-full bg-[#062946]/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          {mentee.name}
        </span>
      </button>
    );
  })}
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
                      {/* <option className="bg-[#0f4a76] text-white" value="Phase">
                        Phase
                      </option> */}
                      <option className="bg-[#0f4a76] text-white" value="Newly Added">
  Newly Added
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
                  
                    <div
  key={mentee.id}
  role="button"
  tabIndex={0}
  onClick={() => openMenteeDrawer(mentee)}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      openMenteeDrawer(mentee);
    }
  }}
  // className={`${mentorGlassCardRoadmap} relative w-full cursor-pointer flex-col items-stretch gap-4 p-5 text-left sm:flex-row sm:items-center sm:gap-6`}
  className={`${mentorGlassCardRoadmap} relative w-full cursor-pointer flex-col items-stretch gap-4 overflow-visible p-5 text-left sm:flex-row sm:items-center sm:gap-6 ${
  openCardMenuId === mentee.id ? "z-50" : "z-0"
}`}
>
                      {/* <div className="absolute right-4 top-4 z-20"> */}
  <div className="absolute right-4 top-4 z-[80]">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setOpenCardMenuId(openCardMenuId === mentee.id ? null : mentee.id);
    }}
    className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
  >
    <i className="fa-solid fa-ellipsis-vertical" />
  </button>

  {openCardMenuId === mentee.id && (
    <div
      onClick={(e) => e.stopPropagation()}
      // className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-white/15 bg-[#062946] shadow-2xl"
      className="absolute right-0 top-11 z-[90] w-56 overflow-hidden rounded-xl border border-white/15 bg-[#062946] shadow-2xl"
    >
      <button
        type="button"
        onClick={() => handleCardMenuAction("schedule", mentee)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar-check text-[#8ec5eb]" />
        Schedule Meeting
      </button>

      <button
        type="button"
        onClick={() => handleCardMenuAction("roadmap", mentee)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
      >
        <i className="fa-solid fa-route text-[#8ec5eb]" />
        Review Roadmap
      </button>

      <button
        type="button"
        onClick={() => handleCardMenuAction("assessments", mentee)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-white/10"
      >
        <i className="fa-regular fa-clipboard text-[#8ec5eb]" />
        Assessments
      </button>
    </div>
  )}
</div>
                      <div className="relative mx-auto shrink-0 sm:mx-0">
                        <Image
                          src={mentee.img}
                          alt={mentee.name}
                          width={120}
                          height={120}
                          unoptimized={isRemoteImageSrc(mentee.img)}
                          // className="h-[88px] w-[88px] rounded-xl border border-white/20 object-cover sm:h-[120px] sm:w-[120px]"
                          className="h-[88px] w-[88px] rounded-full border border-white/20 object-cover sm:h-[120px] sm:w-[120px]"
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
                          {/* <div className="flex shrink-0 gap-4 text-[#8ec5eb]">
                            <i className="fa-regular fa-envelope pointer-events-none" aria-hidden />
                            <i className="fa-regular fa-comment pointer-events-none" aria-hidden />
                            <i className="fa-solid fa-phone pointer-events-none" aria-hidden />
                            <i className="fa-brands fa-whatsapp pointer-events-none" aria-hidden />
                          </div> */}
                          <div className="flex shrink-0 gap-4 text-[#8ec5eb]">
  <a
    href={mentee.email ? `mailto:${mentee.email}` : undefined}
    onClick={(e) => e.stopPropagation()}
    className="transition hover:text-white"
    title="Email"
  >
    <i className="fa-regular fa-envelope" aria-hidden />
  </a>

<a
  href={
    mentee.phoneNumber
      ? `sms:${String(mentee.phoneNumber).replace(/[^\d+]/g, "")}`
      : undefined
  }
  onClick={(e) => e.stopPropagation()}
  className="transition hover:text-white"
  title="Message"
>
  <i className="fa-regular fa-comment" aria-hidden />
</a>

  <a
    href={mentee.phoneNumber ? `tel:${mentee.phoneNumber}` : undefined}
    onClick={(e) => e.stopPropagation()}
    className="transition hover:text-white"
    title="Call"
  >
    <i className="fa-solid fa-phone" aria-hidden />
  </a>

  <a
    href={
      mentee.phoneNumber
        ? `https://wa.me/${String(mentee.phoneNumber).replace(/[^\d]/g, "")}`
        : undefined
    }
    target="_blank"
    rel="noopener noreferrer"
    onClick={(e) => e.stopPropagation()}
    className="transition hover:text-white"
    title="WhatsApp"
  >
    <i className="fa-brands fa-whatsapp" aria-hidden />
  </a>
</div>
                          {mentee.progress === 100 && (
                            <span className="rounded-lg bg-[#8ec5eb]/20 px-3 py-1 text-xs font-medium text-[#8ec5eb]">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </main>
      {profileDrawerOpen && selectedMentee && (
  <>
    <div
      className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm"
      onClick={() => setProfileDrawerOpen(false)}
    />

    <aside className="fixed right-0 top-0 z-[100] flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-white/15 bg-[#062946] p-6 text-white shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Mentee Profile</h2>
        <button
          type="button"
          onClick={() => setProfileDrawerOpen(false)}
          className="rounded-full border border-white/15 px-3 py-1 text-white/80 hover:bg-white/10"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-white/15 bg-white/5 p-5 text-center">
        <Image
          src={selectedMentee.img}
          alt={selectedMentee.name}
          width={110}
          height={110}
          unoptimized={isRemoteImageSrc(selectedMentee.img)}
          className="h-[110px] w-[110px] rounded-full border border-white/20 object-cover"
        />

        <h3 className="mt-4 text-xl font-semibold">{selectedMentee.name}</h3>
        <p className="text-sm text-[#cde2f2]">{selectedMentee.role || "Pastor"}</p>
        <p className="mt-2 text-sm text-white/60">{selectedMentee.desc}</p>

        <div className="mt-5 w-full">
          <div className="mb-1 flex justify-between text-xs text-[#cde2f2]">
            <span>Progress</span>
            <span>{selectedMentee.progress ?? 0}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/15">
            <div
              className="h-2 rounded-full bg-[#8ec5eb]"
              style={{ width: `${Math.min(100, selectedMentee.progress ?? 0)}%` }}
            />
          </div>
        </div>

        {selectedMentee.phase && (
          <div className="mt-4 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-4 py-1 text-xs text-[#8ec5eb]">
            Phase: {selectedMentee.phase}
          </div>
        )}
      </div>
<div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
  <h4 className="mb-4 text-base font-semibold">Profile Details</h4>

  <div className="space-y-3 text-sm">
    <p><span className="text-white/50">Email:</span> {selectedMentee.email || "—"}</p>
    <p><span className="text-white/50">Phone:</span> {selectedMentee.phoneNumber || "—"}</p>
   {/* <p>
  <span className="text-white/50">Title:</span>{" "}
  {selectedMentee.title || selectedMentee.churchDetails?.[0]?.title || "—"}
</p> */}

{/* <p>
  <span className="text-white/50">Location:</span>{" "}
  {[
    selectedMentee.city || selectedMentee.churchDetails?.[0]?.city,
    selectedMentee.state || selectedMentee.churchDetails?.[0]?.state,
    selectedMentee.country || selectedMentee.churchDetails?.[0]?.country,
  ]
    .filter(Boolean)
    .join(", ") || "—"}
</p> */}
<p><span className="text-white/50">Role:</span> {selectedMentee.role || "—"}</p>
<p><span className="text-white/50">Status:</span> {selectedMentee.status || "—"}</p>
  </div>
</div>
<div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
  <h4 className="mb-4 text-base font-semibold">Church Information</h4>

  {selectedMentee.churchDetails?.length ? (
    <div className="space-y-4 text-sm">
      {selectedMentee.churchDetails.map((church: any, index: number) => (
        <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <p><span className="text-white/50">Church:</span> {church.churchName || "—"}</p>
          <p><span className="text-white/50">Phone:</span> {church.churchPhone || "—"}</p>
          <p><span className="text-white/50">Website:</span> {church.churchWebsite || "—"}</p>
          <p><span className="text-white/50">Address:</span> {church.churchAddress || "—"}</p>
          <p><span className="text-white/50">Location:</span> {[church.city, church.state, church.country].filter(Boolean).join(", ") || "—"}</p>
          <p><span className="text-white/50">Zip:</span> {church.zipCode || "—"}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-white/60">No church information available.</p>
  )}
</div>

<div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
  <h4 className="mb-4 text-base font-semibold">Interest Details</h4>

  <div className="space-y-3 text-sm">
    <p><span className="text-white/50">Title:</span> {selectedMentee.title || "—"}</p>
    <p><span className="text-white/50">Conference:</span> {selectedMentee.conference || "—"}</p>
    <p><span className="text-white/50">Years in Ministry:</span> {selectedMentee.yearsInMinistry || "—"}</p>
    <p><span className="text-white/50">Community Projects:</span> {selectedMentee.currentCommunityProjects || "—"}</p>
    <p><span className="text-white/50">Comments:</span> {selectedMentee.comments || "—"}</p>

    <div>
      <span className="text-white/50">Interests:</span>
      {selectedMentee.interests?.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedMentee.interests.map((item: string) => (
            <span key={item} className="rounded-full border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1 text-xs text-[#8ec5eb]">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <span> —</span>
      )}
    </div>
  </div>
</div>
      <div className="mt-6 rounded-2xl border border-white/15 bg-white/5 p-5">
        <h4 className="mb-4 text-base font-semibold">Documents</h4>

        {drawerDocsLoading ? (
          <p className="text-sm text-[#cde2f2]">Loading documents…</p>
        ) : drawerDocuments.length === 0 ? (
          <p className="text-sm text-white/60">No documents uploaded.</p>
        ) : (
          <div className="space-y-3">
            {drawerDocuments.map((doc: any, index: number) => (
              <button
                key={doc.fileUrl || index}
                type="button"
                onClick={() => doc.fileUrl && window.open(doc.fileUrl, "_blank", "noopener,noreferrer")}
                className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left hover:bg-white/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {doc.fileName || "Document"}
                  </p>
                  <p className="text-xs text-[#cde2f2]">
                    {doc.uploadedAt
                      ? new Date(doc.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Uploaded"}
                  </p>
                </div>
                <i className="fa-solid fa-arrow-up-right-from-square text-[#8ec5eb]" />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  </>
)}
    </div>
  );
}
