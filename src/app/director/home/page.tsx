"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCookie, getCookie } from "@/app/utils/cookies";
import Image from "next/image";
import MentorCard from "@/app/Components/Card/MentorCard";
import { directorPageRoot } from "../directorUi";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import MapImg from "../../Assets/map-placeholder.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import {
  CreateUserDto,
  apiGetDirectorOverview,
  DirectorOverviewDto,
  apiGetTodaysAppointments,
  apiGetAllInterests,
  apiGetMentors,
  apiGetPastors,
  apiCreateUser,
  apiGetUserById,
  apiGetOverallProgress,
  apiGetAllUsers,
  Appointment,
  Interest,
  MentorPastor,
  User,
  UserOverallProgress,
} from "@/app/Services/api";
import { getPastorMedia } from "@/app/Services/pastor.service";
import { getGreeting } from "@/app/Services/utils/helpers";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const glassCard =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.4)]";
const glassCardHover =
  "transition-all duration-300 hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_100%)] hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

function parseUserCookie(): { firstName?: string; lastName?: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getCookie("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const getMediaThumbnail = (item: { mediaFiles?: { thumbnail?: string }[]; heading?: string }) => {
  const url = item?.mediaFiles?.[0]?.thumbnail;
  if (url && url.trim() !== "") return url;
  return Book;
};

const directorExploreCards = [
  {
    title: "Mentees",
    desc: "Schedule and manage appointments with ease for personalized guidance.",
    icon: "fa-regular fa-calendar-check",
    route: "/director/mentees",
  },
  {
    title: "Track Progress",
    desc: "Track growth and celebrate milestones across your network.",
    icon: "fa-solid fa-chart-simple",
    route: "/director/track-progress",
  },
  {
    title: "Schedule",
    desc: "View and coordinate schedules across mentors and mentees.",
    icon: "fa-regular fa-clipboard",
    route: "/director/schedule",
  },
  {
    title: "Revitalization Roadmap",
    desc: "Plan and execute regional development roadmaps efficiently.",
    icon: "fa-solid fa-pen-clip",
    route: "/director/revitalization-roadmap",
  },
];

export default function DirectorHome() {
  const router = useRouter();
  const [resolvedUserId, setResolvedUserId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"mentors" | "pastors">("mentors");
  const [fullName, setFullName] = useState("");
  const [userForm, setUserForm] = useState({
    email: "",
    role: "",
  });

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [mentors, setMentors] = useState<MentorPastor[]>([]);
  const [pastors, setPastors] = useState<MentorPastor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [directorOverview, setDirectorOverview] = useState<DirectorOverviewDto | null>(null);

  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [pastorsLoading, setPastorsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [networkProgressRows, setNetworkProgressRows] = useState<UserOverallProgress[]>([]);
  const [networkProgressLoading, setNetworkProgressLoading] = useState(true);
  const [completedPastorsCount, setCompletedPastorsCount] = useState<number | null>(null);
  const [roadmapFilterTab, setRoadmapFilterTab] = useState<0 | 1 | 2>(0);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mediaList, setMediaList] = useState<
    {
      _id: string;
      heading?: string;
      subheading?: string;
      description?: string;
      createdAt?: string;
      mediaFiles?: { thumbnail?: string }[];
    }[]
  >([]);
  const [cookieUser, setCookieUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

  useEffect(() => {
    const id = getCookie("userId");
    setResolvedUserId(id?.trim() ?? "");
    setCookieUser(parseUserCookie());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await getPastorMedia();
        setMediaList(res.data?.data || []);
      } catch (err) {
        console.error("Error fetching media:", err);
      }
    }
    fetchMedia();
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const fetchMentors = useCallback(async () => {
    try {
      setMentorsLoading(true);
      const response = await apiGetMentors({ limit: 4, roleMatch: "mixed" });
      setMentors(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  const fetchPastors = useCallback(async () => {
    try {
      setPastorsLoading(true);
      const response = await apiGetPastors({ limit: 4, roleMatch: "mixed" });
      setPastors(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching pastors:', error);
      setPastors([]);
    } finally {
      setPastorsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      const uid = resolvedUserId;
      setNetworkProgressLoading(true);

      const results = await Promise.allSettled([
        apiGetTodaysAppointments(uid || undefined),
        apiGetAllInterests({ status: 'new' }),
        apiGetMentors({ limit: 4, roleMatch: "mixed" }),
        apiGetPastors({ limit: 4, roleMatch: "mixed" }),
        apiGetDirectorOverview({
          period: 'yearly',
          year: new Date().getFullYear(),
          includeUsers: false,
        }),
        uid ? apiGetUserById(uid) : Promise.resolve(null),
        apiGetOverallProgress(),
        apiGetAllUsers({ role: "pastor", hasCompleted: true, limit: 1 }),
      ]);

      // Handle appointments
      if (results[0].status === 'fulfilled') {
        setAppointments(results[0].value.data.data || []);
      } else {
        console.error('Error fetching appointments:', results[0].reason);
        setAppointments([]);
      }
      setAppointmentsLoading(false);

      // Handle interests
      if (results[1].status === 'fulfilled') {
        setInterests(results[1].value.data.data || []);
      } else {
        console.error('Error fetching interests:', results[1].reason);
        setInterests([]);
      }
      setInterestsLoading(false);

      // Handle mentors
      if (results[2].status === 'fulfilled') {
        setMentors(results[2].value.data.data.users || []);
      } else {
        console.error('Error fetching mentors:', results[2].reason);
        setMentors([]);
      }
      setMentorsLoading(false);

      // Handle pastors
      if (results[3].status === 'fulfilled') {
        setPastors(results[3].value.data.data.users || []);
      } else {
        console.error('Error fetching pastors:', results[3].reason);
        setPastors([]);
      }
      setPastorsLoading(false);

      // Handle director overview
      if (results[4].status === 'fulfilled') {
        setDirectorOverview(results[4].value.data.data);
      } else {
        console.error('Error fetching director overview:', results[4].reason);
      }
      setOverviewLoading(false);

      // Handle user details
      if (results[5].status === 'fulfilled' && results[5].value) {
        setUser(results[5].value.data.data || null);
        if (uid) {
          setCookie("userId", uid);
        }
      } else if (results[5].status === 'rejected') {
        console.error('Error fetching user details:', results[5].reason);
        setUser(null);
      }

      // Network-wide progress rows (mentors & pastors) for snapshot list
      if (results[6].status === 'fulfilled') {
        const rows = results[6].value.data?.data;
        setNetworkProgressRows(Array.isArray(rows) ? rows : []);
      } else {
        console.error('Error fetching network progress:', results[6].reason);
        setNetworkProgressRows([]);
      }
      setNetworkProgressLoading(false);

      // Completed-course count (pastors marked completed)
      if (results[7].status === 'fulfilled') {
        const body = results[7].value.data?.data;
        const total =
          typeof body?.total === 'number'
            ? body.total
            : Array.isArray(body?.users)
              ? body.users.length
              : 0;
        setCompletedPastorsCount(total);
      } else {
        console.error('Error fetching completed pastors count:', results[7].reason);
        setCompletedPastorsCount(null);
      }
    };

    fetchAllData();
  }, [resolvedUserId]);

  const chartData = useMemo(() => {
    return directorOverview?.monthlyData.slice(-6).map(month => ({
      pastor: month.pastorsCompleted,
      mentor: month.mentorsCompleted,
      monthName: month.monthName,
    })) || [];
  }, [directorOverview?.monthlyData]);

  const donutChartData = useMemo(() => {
    if (!directorOverview) return null;

    const completed = directorOverview.overallCombinedProgress;
    const remaining = 100 - completed;
    const completedDegrees = (completed / 100) * 360;

    return { completed, remaining, completedDegrees };
  }, [directorOverview]);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    if (!firstName) {
      alert("Please enter a full name");
      return;
    }

    const userData: CreateUserDto = {
      firstName,
      lastName,
      email: userForm.email,
      role: userForm.role,
    };

    try {
      setAddUserLoading(true);
      await apiCreateUser(userData);
      setFullName("");
      setUserForm({ email: "", role: "" });

      fetchMentors();
      fetchPastors();

      alert("User added successfully!");
    } catch (error: any) {
      console.error("Failed to add user:", error);
      alert(error.response?.data?.message || "Failed to add user. Please try again.");
    } finally {
      setAddUserLoading(false);
    }
  }, [fullName, userForm, fetchMentors, fetchPastors]);

  // Get current data based on active tab
  const currentData = useMemo(() => activeTab === "mentors" ? mentors : pastors, [activeTab, mentors, pastors]);
  const currentLoading = useMemo(() => activeTab === "mentors" ? mentorsLoading : pastorsLoading, [activeTab, mentorsLoading, pastorsLoading]);

  const formatAppointment = useCallback((appointment: Appointment) => {
    const platformIcon = appointment.platform === 'gmeet' ? MeetIcon : DuoIcon;
    const mentorName = appointment.mentor
      ? `${appointment.mentor.firstName || ''} ${appointment.mentor.lastName || ''}`.trim()
      : 'Mentor';
    const mentorRole = appointment.mentor?.role || 'mentor';
    const meetingDate = new Date(appointment.meetingDate);
    const meetingTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { platformIcon, mentorName, mentorRole, meetingDate, meetingTime };
  }, []);

  const displayName =
    user?.firstName || cookieUser?.firstName
      ? `${user?.firstName ?? cookieUser?.firstName ?? ""} ${user?.lastName ?? cookieUser?.lastName ?? ""}, Welcome Aboard!`
      : "Welcome Aboard!";

  const roadmapSnapshotRows = useMemo(() => {
    const rows = networkProgressRows;
    if (roadmapFilterTab === 1) {
      return rows.filter((r) => (r.role || "").toLowerCase() === "pastor");
    }
    if (roadmapFilterTab === 2) {
      return rows.filter((r) => {
        const role = (r.role || "").toLowerCase();
        return role === "mentor" || role === "field-mentor";
      });
    }
    return rows;
  }, [networkProgressRows, roadmapFilterTab]);

  return (
    <div className={directorPageRoot}>
      {/* Hero — mentor / pastor glass + image */}
      <section className={`relative overflow-hidden rounded-3xl border border-white/10 ${glassCard}`}>
        <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]">
          <Image
            src={HeroBg}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062946] via-[#062946]/75 to-[#0a3558]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/90 via-transparent to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-full space-y-2 lg:max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-semibold leading-snug sm:text-3xl lg:text-4xl">
                Cultivate Spiritual, Professional, Social, And Community–
                <br className="hidden sm:block" />
                Engagement Developments
              </h1>
              <p className="text-sm text-white/80">{formattedTime}</p>
              <p className="text-xs text-white/60 sm:text-sm">{formattedDate}</p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/director/profile")}
              className="mt-4 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition hover:bg-white/15 lg:mt-0 lg:w-auto"
            >
              <Image
                src={UserProfile}
                alt=""
                width={48}
                height={48}
                className="rounded-full border-2 border-white/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{displayName}</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Continue watching */}
      <section className="mt-10 flex flex-col items-start justify-between gap-10 py-10 lg:flex-row">
        <div className="flex flex-col justify-center lg:w-1/4">
          <h2 className="mb-4 text-3xl font-semibold leading-tight text-white">
            Continue <br /> Watching{" "}
            <span className="text-[#8ec5eb] underline decoration-[#8ec5eb]/40 decoration-2 underline-offset-4">
              Course
            </span>
          </h2>
        </div>

        <div className="relative w-full lg:w-3/4">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={3}
            pagination={{ clickable: true }}
            loop={mediaList.length > 3}
            className="pb-12 [&_.swiper-pagination-bullet]:bg-white/40 [&_.swiper-pagination-bullet-active]:bg-[#8ec5eb]"
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {mediaList.map((item) => (
              <SwiperSlide key={item._id}>
                <div className={`overflow-hidden rounded-xl text-left ${glassCard} ${glassCardHover}`}>
                  <div className="relative">
                    <Image
                      src={getMediaThumbnail(item)}
                      alt={item.heading || "Media thumbnail"}
                      width={400}
                      height={200}
                      className="h-[160px] w-full object-cover sm:h-[180px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 transition hover:scale-110"
                      >
                        <i className="fa-solid fa-play text-sm text-[#0f4a76]" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="mb-1 text-xs font-semibold text-[#8ec5eb]">
                      {item.subheading || "Introduction"}
                    </p>
                    <h4 className="mb-1 text-sm font-semibold text-white">{item.heading}</h4>
                    <p className="mb-3 text-xs leading-snug text-white/65">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                      </span>
                      <button
                        type="button"
                        className="rounded-md border border-[#8ec5eb]/50 p-[6px] text-[#8ec5eb] transition hover:bg-[#8ec5eb]/15"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Today's Appointments */}
      <section className="relative mt-10 overflow-hidden py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold sm:text-xl">Today&apos;s Appointments</h2>
          <Link
            href="/director/schedule"
            className="text-sm font-medium text-[#8ec5eb] hover:text-[#b8ddf5]"
          >
            See all
          </Link>
        </div>

        {appointmentsLoading ? (
          <p className="text-sm text-white/55">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <div className={`p-8 text-center text-sm text-white/55 ${glassCard}`}>
            No appointments scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {appointments.slice(0, 2).map((appointment) => {
              const { platformIcon, mentorName, mentorRole, meetingDate, meetingTime } =
                formatAppointment(appointment);

              return (
                <div
                  key={appointment.id}
                  className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${glassCard}`}
                >
                  <div className="flex shrink-0 justify-center sm:justify-start">
                    <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:h-[120px] sm:w-[120px]">
                      <Image
                        src={platformIcon}
                        alt={appointment.platform}
                        className="h-12 w-12 sm:h-14 sm:w-14"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                      {appointment.mentor?.profilePicture ? (
                        <Image
                          src={appointment.mentor.profilePicture}
                          alt={mentorName}
                          width={40}
                          height={40}
                          className="rounded-full border border-white/30"
                        />
                      ) : (
                        <Image src={UserProfile} alt="User" width={40} height={40} className="rounded-full border border-white/30" />
                      )}
                      <div>
                        <h4 className="font-semibold text-white">{mentorName}</h4>
                        <p className="text-xs capitalize text-white/60">{mentorRole}</p>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap justify-center gap-2 text-xs sm:justify-start">
                      <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                        <i className="fa-regular fa-calendar mr-1 text-[#e3d247]" />
                        {meetingDate.toLocaleDateString()}
                      </span>
                      <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                        <i className="fa-regular fa-clock mr-1 text-[#5ee0d0]" />
                        {meetingTime}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:items-end">
                      <div>
                        <p className="text-xs text-white/55">
                          Mode:{" "}
                          <span className="text-[#b8d4ff] underline underline-offset-2 capitalize">
                            {appointment.platform}
                          </span>
                        </p>
                        <div className="mt-2 flex gap-4 text-sm text-white/80">
                          <i className="fa-solid fa-phone" />
                          <i className="fa-regular fa-comment" />
                          <i className="fa-brands fa-whatsapp" />
                        </div>
                      </div>

                      <button
                        type="button"
                        className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Today's roadmap list */}
      <section className="mt-10">
        <div className={`p-5 sm:p-6 lg:p-8 ${glassCard}`}>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold">Today&apos;s Roadmap List</h3>
            <div className="flex w-full rounded-xl border border-white/10 bg-white/5 p-1 sm:w-auto">
              {(["All", "Roadmap", "Survey"] as const).map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRoadmapFilterTab(index as 0 | 1 | 2)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium sm:flex-none ${
                    roadmapFilterTab === index
                      ? "bg-[#8ec5eb]/20 text-white"
                      : "text-white/55 hover:text-white/85"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {networkProgressLoading ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-6 text-center text-sm text-white/55">
                Loading roadmap activity…
              </p>
            ) : roadmapSnapshotRows.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-6 text-center text-sm text-white/55">
                No progress records for this filter.
              </p>
            ) : (
              roadmapSnapshotRows.slice(0, 8).map((row) => {
                const roleLabel = (row.role || "user").replace(/-/g, " ");
                const pct = Math.round(row.overallProgress ?? 0);
                return (
                  <button
                    key={row.userId}
                    type="button"
                    onClick={() => router.push(`/director/track-progress/${row.userId}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize text-white">
                        {roleLabel} · {pct}% overall
                      </p>
                      <p className="text-xs text-white/60">
                        {"Roadmaps & assessments combined progress"}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm text-white/80">
                      {row.firstName} {row.lastName}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/director/revitalization-roadmap/create")}
              className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-sm font-medium text-white transition hover:bg-[#8ec5eb]/25"
            >
              View Roadmap
            </button>
          </div>
        </div>
      </section>

      {/* New Interests Section */}
      <section className="mt-10 py-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="mb-4 text-2xl font-semibold sm:text-3xl md:text-[32px]">New Interests</h2>
            <p className="mb-6 text-base leading-relaxed text-white/70">
              Review the details of the newly submitted interest and take the
              next steps to guide and support the process effectively.
            </p>
            <button
              type="button"
              onClick={() => router.push("/director/interest-list")}
              className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-8 py-3 font-semibold text-white transition hover:bg-[#8ec5eb]/25"
            >
              See All
            </button>
          </div>

          <div className="space-y-4">
            {interestsLoading ? (
              <div className="py-8 text-center text-white/55">Loading interests…</div>
            ) : interests.length === 0 ? (
              <div className={`py-8 text-center text-sm text-white/55 ${glassCard}`}>No new interests</div>
            ) : (
              interests.slice(0, 4).map((interest) => (
                <div
                  key={interest._id}
                  className={`flex flex-col items-start justify-between gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:p-5 ${glassCard}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/15 bg-[#8ec5eb]/20">
                      <i className="fa-solid fa-user text-xl text-[#8ec5eb]" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        {interest.firstName} {interest.lastName}
                      </h4>
                      <p className="text-sm text-white/55">{interest.title || "No title"}</p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-solid fa-envelope text-lg" />
                    </button>
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-regular fa-comment text-lg" />
                    </button>
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-solid fa-phone text-lg" />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/director/interest-list/${interest.id || interest._id}`)}
                      className="rounded-md border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8ec5eb]/25 sm:px-6"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Add User Section */}
      <section className="mt-6 py-8 sm:py-12 md:py-16">
        <div className={`mx-auto max-w-6xl rounded-3xl border border-white/15 bg-[linear-gradient(135deg,rgba(142,197,235,0.12)_0%,rgba(6,41,70,0.95)_45%,#041f35_100%)] p-8 shadow-lg sm:p-12`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left side */}
            <div className="text-white">
              <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold mb-3">
                Add User
              </h2>
              <p className="text-white/90">
                Add new pastors and mentors to the platform
              </p>
            </div>

            {/* Right side - Form */}
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="text-white text-sm mb-2 block">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="Enter e-mail ID"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Title</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-md bg-white/10 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option className="text-black" value="">Select Title</option>
                  <option className="text-black" value="pastor">Pastor</option>
                  <option className="text-black" value="lay leader">Lay Leader</option>
                  <option className="text-black" value="seminarian">Seminarian</option>
                  <option className="text-black" value="mentor">Mentor</option>
                  <option className="text-black" value="field-mentor">Field Mentor</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="mt-2 rounded-md border border-white/30 bg-white/95 px-10 py-3 font-semibold text-[#062946] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addUserLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Mentors/Pastors Section */}
        <div className="mt-12 sm:mt-16">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex w-full gap-2 rounded-[20px] border border-white/10 bg-white/5 p-2 sm:w-auto sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("mentors")}
                className={`flex-1 rounded-[16px] px-6 py-3 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-8 md:px-10 sm:text-[16px] ${
                  activeTab === "mentors"
                    ? "bg-[#8ec5eb]/25 text-white shadow-md"
                    : "bg-transparent text-white/50 hover:text-white/85"
                }`}
              >
                Mentors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pastors")}
                className={`flex-1 rounded-[16px] px-6 py-3 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-8 md:px-10 sm:text-[16px] ${
                  activeTab === "pastors"
                    ? "bg-[#8ec5eb]/25 text-white shadow-md"
                    : "bg-transparent text-white/50 hover:text-white/85"
                }`}
              >
                Pastors
              </button>
            </div>
            <Link
              href={activeTab === "mentors" ? "/director/mentors" : "/director/mentees"}
              className="text-sm font-semibold text-[#8ec5eb] hover:text-[#b8ddf5] sm:text-[15px]"
            >
              See all
            </Link>
          </div>

          {currentLoading ? (
            <div className="py-8 text-center text-white/55">Loading…</div>
          ) : currentData.length === 0 ? (
            <div className="py-8 text-center text-white/55">No data available</div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
              {currentData.map((person) => {
                const personId = (person as any).id || person._id;
                const menteeCount = person.assignedId?.length || person.menteeCount || 0;
                const isMentor = activeTab === "mentors";
                return (
                  <MentorCard
                    key={personId}
                    variant="glass"
                    image={person?.profilePicture ? person.profilePicture : Mentor1}
                    name={`${person.firstName} ${person.lastName}`}
                    role={person.role}
                    menteeCount={menteeCount}
                    onViewDetails={() =>
                      isMentor
                        ? router.push(`/director/mentors/profile/${personId}`)
                        : router.push(`/director/mentees/profile?id=${personId}`)
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Explore CCC */}
      <section className="py-16">
        <h2 className="mb-10 text-[22px] font-semibold text-white">Explore CCC</h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {directorExploreCards.map((item) => (
            <div
              key={item.route}
              role="button"
              tabIndex={0}
              onClick={() => router.push(item.route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(item.route);
              }}
              className={`flex min-h-[200px] cursor-pointer flex-col justify-between rounded-xl p-6 text-white transition hover:scale-[1.02] ${glassCard} ${glassCardHover}`}
            >
              <i className={`${item.icon} mb-4 text-2xl text-[#8ec5eb]`} />
              <div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/75">{item.desc}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="flex items-center gap-2 text-sm text-[#8ec5eb] hover:text-[#b8ddf5]">
                  More
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Over View */}
      <section className="py-16">
        <h2 className="mb-8 text-[22px] font-semibold text-white">Over View</h2>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-3 sm:gap-6">
          {overviewLoading ? (
            <div className="col-span-3 py-8 text-center text-white/55">Loading overview…</div>
          ) : directorOverview ? (
            <>
              <div className={`rounded-xl p-8 ${glassCard}`}>
                <p className="mb-2 text-sm text-white/60">Total Mentors</p>
                <h3 className="text-4xl font-bold text-[#8ec5eb]">
                  {directorOverview.totalMentors}
                </h3>
              </div>
              <div className={`rounded-xl p-8 ${glassCard}`}>
                <p className="mb-2 text-sm text-white/60">Total Pastors</p>
                <h3 className="text-4xl font-bold text-[#8ec5eb]">
                  {directorOverview.totalPastors}
                </h3>
              </div>
              <div className={`rounded-xl p-8 ${glassCard}`}>
                <p className="mb-2 text-sm text-white/60">Pastors Completed</p>
                <h3 className="text-4xl font-bold text-[#8ec5eb]">
                  {directorOverview.completedPastors}
                </h3>
              </div>
            </>
          ) : (
            <div className="col-span-3 py-8 text-center text-white/55">No data available</div>
          )}
        </div>

        {/* Overall Progress */}
        <h2 className="mb-8 text-[22px] font-semibold text-white">Overall Progress</h2>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
          {/* Donut Chart */}
          <div className={`rounded-xl p-8 ${glassCard}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Roadmap & Assessments
              </h3>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#8ec5eb]" />
                  <span className="text-white/65">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-[#F9C74F]" />
                  <span className="text-white/65">Remaining</span>
                </div>
              </div>
            </div>

            <div className="flex h-[280px] items-center justify-center">
              {overviewLoading ? (
                <div className="text-white/55">Loading…</div>
              ) : donutChartData ? (
                <div className="relative">
                  <div className="relative h-[240px] w-[240px] rounded-full">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: `conic-gradient(
                          #8ec5eb 0deg ${donutChartData.completedDegrees}deg,
                          #F9C74F ${donutChartData.completedDegrees}deg 360deg
                        )`,
                      }}
                    />
                    <div className="absolute left-1/2 top-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#062946]" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#8ec5eb]">
                        {donutChartData.completed.toFixed(1)}%
                      </div>
                      <div className="mt-1 text-xs text-white/55">Completed</div>
                    </div>
                  </div>
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 transform rounded-md bg-[#8ec5eb]/30 px-2 py-2 text-sm font-semibold text-white sm:-left-20 sm:px-4">
                    {donutChartData.completed.toFixed(1)}%
                  </div>
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 transform rounded-md bg-[#F9C74F] px-2 py-2 text-sm font-semibold text-[#062946] sm:-right-20 sm:px-4">
                    {donutChartData.remaining.toFixed(1)}%
                  </div>
                </div>
              ) : (
                <div className="text-white/55">No data available</div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className={`rounded-xl p-4 sm:p-8 ${glassCard}`}>
            <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <h3 className="text-lg font-semibold text-white">
                Roadmap & Assessments
              </h3>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-[#8ec5eb]" />
                  <span className="text-white/65">Pastor</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-[#5ee0d0]" />
                  <span className="text-white/65">Mentor</span>
                </div>
                <select className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-sm text-white outline-none">
                  <option className="text-black">Past 6 Months</option>
                </select>
              </div>
            </div>

            <div className="flex h-[200px] items-end justify-between gap-2 sm:h-[280px] sm:gap-4">
              {overviewLoading ? (
                <div className="flex h-full w-full items-center justify-center text-white/55">
                  Loading chart data…
                </div>
              ) : chartData.length > 0 ? (
                chartData.map((data, i) => {
                  const maxValue = Math.max(
                    ...chartData.map(d => Math.max(d.pastor, d.mentor))
                  );
                  const pastorHeight = maxValue > 0 ? (data.pastor / maxValue) * 100 : 0;
                  const mentorHeight = maxValue > 0 ? (data.mentor / maxValue) * 100 : 0;

                  return (
                    <div
                      key={i}
                      className="flex flex-1 flex-col items-center gap-2"
                    >
                      <div className="flex h-[160px] w-full items-end gap-1 sm:h-[220px]">
                        <div
                          className="flex-1 rounded-t-md bg-[#8ec5eb]/80"
                          style={{ height: `${pastorHeight}%` }}
                        />
                        <div
                          className="flex-1 rounded-t-md bg-[#5ee0d0]/80"
                          style={{ height: `${mentorHeight}%` }}
                        />
                      </div>
                      <span className="text-xs text-white/60">{data.monthName}</span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/55">
                  No chart data available
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Course Completed & Invite */}
      <section className="py-16">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <button
            type="button"
            onClick={() => router.push("/director/course-completed")}
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${glassCard} ${glassCardHover}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <i className="fa-solid fa-award text-2xl text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold sm:text-xl">Course Completed</h3>
                <div className="mt-1 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-sm font-bold text-[#0f4a76]">
                  {completedPastorsCount == null ? "—" : completedPastorsCount}
                </div>
              </div>
            </div>
            <span className="self-end text-[#8ec5eb] hover:opacity-80 sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/director/invite-field-mentor")}
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${glassCard} ${glassCardHover}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <i className="fa-solid fa-user-plus text-2xl text-[#8ec5eb]" />
              </div>
              <h3 className="text-lg font-semibold sm:text-xl">Invite to be a Field Mentor</h3>
            </div>
            <span className="self-end text-[#8ec5eb] hover:opacity-80 sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl" />
            </span>
          </button>
        </div>
      </section>

      {/* Map */}
      <section className="py-16">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-[22px] font-semibold text-white">Network map</h2>
          <input
            type="text"
            placeholder="Search..."
            className="w-full max-w-xs rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#8ec5eb]/40 sm:w-auto"
          />
        </div>

        <div className={`relative overflow-hidden rounded-2xl border border-white/15 ${glassCard}`}>
          <Image
            src={MapImg}
            alt="Map"
            className="h-[420px] w-full object-cover"
          />
          <div className="absolute bottom-6 left-6 rounded-lg border border-white/20 bg-[#062946]/70 px-5 py-3 backdrop-blur-md">
            <p className="text-sm font-medium text-white/95">Mentor and mentee locations across the region</p>
          </div>
        </div>
      </section>
    </div>
  );
}
