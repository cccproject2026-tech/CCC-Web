"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCookie, getCookie } from "@/app/utils/cookies";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";
import MentorCard from "@/app/Components/Card/MentorCard";
import {
  directorGlassCard,
  directorGlassCardHover,
  directorInputClass,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
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
  apiGetAllUsers,
  Appointment,
  Interest,
  MentorPastor,
  User,
} from "@/app/Services/api";
import type { UserRole } from "@/app/Services/types/users.types";
import { getPastorMedia } from "@/app/Services/pastor.service";
import { getGreeting } from "@/app/Services/utils/helpers";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function parseUserCookie(): {
  firstName?: string;
  lastName?: string;
  id?: string;
  _id?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getCookie("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function readArrayFromApiBody(res: { data: unknown } | null | undefined): unknown[] {
  if (!res?.data) return [];
  const body = res.data as unknown[] | Record<string, unknown> | null;
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const d = (body as { data?: unknown }).data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as { data: unknown[] }).data)) {
    return (d as { data: unknown[] }).data;
  }
  return [];
}

function readUsersPage(res: { data: unknown } | null | undefined): { users: MentorPastor[]; total?: number } {
  if (!res?.data) return { users: [] };
  const body = res.data as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return { users: [] };
  const inner = body.data;
  if (Array.isArray(inner)) return { users: inner as MentorPastor[] };
  if (inner && typeof inner === "object") {
    const u = (inner as { users?: unknown; total?: number }).users;
    if (Array.isArray(u)) {
      return { users: u as MentorPastor[], total: (inner as { total?: number }).total };
    }
    const nested = (inner as { data?: { users?: unknown; total?: number } }).data;
    if (nested?.users && Array.isArray(nested.users)) {
      return { users: nested.users as MentorPastor[], total: nested.total };
    }
  }
  return { users: [] };
}

function readDirectorOverviewPayload(
  res: { data: unknown } | null | undefined,
): DirectorOverviewDto | null {
  if (!res?.data) return null;
  const body = res.data as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;
  if ("totalMentors" in body && "monthlyData" in body) {
    return body as unknown as DirectorOverviewDto;
  }
  const d = body.data;
  if (d && typeof d === "object" && "totalMentors" in d) {
    return d as DirectorOverviewDto;
  }
  if (d && typeof d === "object" && (d as { data?: unknown }).data) {
    const dd = (d as { data: unknown }).data;
    if (dd && typeof dd === "object" && "totalMentors" in (dd as object)) {
      return dd as DirectorOverviewDto;
    }
  }
  return null;
}

function readUserPayload(res: { data: unknown } | null | undefined): User | null {
  if (!res?.data) return null;
  const body = res.data as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;
  if ("_id" in body && (body.firstName != null || body.email)) {
    return body as unknown as User;
  }
  const d = body.data;
  if (d && typeof d === "object" && ("_id" in d || "email" in d)) {
    return d as User;
  }
  if (d && typeof d === "object" && (d as { data?: User }).data) {
    return (d as { data: User }).data;
  }
  return null;
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
  const [completedPastorsCount, setCompletedPastorsCount] = useState<number | null>(null);
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
    const idFromCookie = getCookie("userId")?.trim() ?? "";
    const u = parseUserCookie();
    const fromUser =
      (typeof u?.id === "string" && u.id.trim()) ||
      (typeof u?._id === "string" && u._id.trim()) ||
      "";
    const uid = idFromCookie || fromUser;
    if (!idFromCookie && fromUser) {
      setCookie("userId", fromUser);
    }
    setResolvedUserId(uid);
    setCookieUser(u ? { firstName: u.firstName, lastName: u.lastName } : null);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await getPastorMedia();
        setMediaList(
          readArrayFromApiBody(res) as {
            _id: string;
            heading?: string;
            subheading?: string;
            description?: string;
            createdAt?: string;
            mediaFiles?: { thumbnail?: string }[];
          }[],
        );
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
      setMentors(readUsersPage(response).users);
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
      setPastors(readUsersPage(response).users);
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

      // Completed-course count (pastors marked completed)
      if (results[6].status === 'fulfilled') {
        const body = results[6].value.data?.data;
        const total =
          typeof body?.total === 'number'
            ? body.total
            : Array.isArray(body?.users)
              ? body.users.length
              : 0;
        setCompletedPastorsCount(total);
      } else {
        console.error('Error fetching completed pastors count:', results[6].reason);
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
      role: userForm.role as UserRole,
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
    const p = (appointment.platform || "").toLowerCase();
    const platformIcon =
      p === "gmeet" || p === "google-meet" || p.includes("google") ? MeetIcon : DuoIcon;
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

  return (
    <div className={directorPageRoot}>
      {/* Hero — mentor / pastor glass + image */}
      <section className={`relative overflow-hidden rounded-3xl border border-white/10 ${directorGlassCard}`}>
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
                <div className={`overflow-hidden rounded-xl text-left ${directorGlassCard} ${directorGlassCardHover}`}>
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
          <div className={`p-8 text-center text-sm text-white/55 ${directorGlassCard}`}>
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
                  className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${directorGlassCard}`}
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
                          unoptimized={isRemoteImageSrc(
                            appointment.mentor.profilePicture,
                          )}
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
                        onClick={() => router.push("/director/schedule")}
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
              <div className={`py-8 text-center text-sm text-white/55 ${directorGlassCard}`}>No new interests</div>
            ) : (
              interests.slice(0, 4).map((interest) => (
                <div
                  key={interest._id}
                  className={`flex flex-col items-start justify-between gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:p-5 ${directorGlassCard}`}
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
                      onClick={() => router.push(`/director/interest-list/${interest._id}`)}
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
                        : router.push(`/director/mentees/profile/${personId}`)
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
              className={`flex min-h-[200px] cursor-pointer flex-col justify-between rounded-xl p-6 text-white transition hover:scale-[1.02] ${directorGlassCard} ${directorGlassCardHover}`}
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

      {/* Overview + roadmap & assessment progress (matches director / track-progress language) */}
      <section className="py-12 sm:py-16">
        <div className={directorPageContainer}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Overview</h2>
          <p className="mt-1 text-sm text-white/55">Network headcount and completions at a glance.</p>

          <div className="mb-10 mt-6 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-3 sm:gap-6">
            {overviewLoading ? (
              <div className="col-span-3 flex justify-center py-12">
                <div className={directorSpinner} role="status" aria-label="Loading" />
              </div>
            ) : directorOverview ? (
              <>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10">
                    <i className="fa-solid fa-user-tie text-[#8ec5eb]" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Total mentors</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.totalMentors}
                  </h3>
                </div>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10">
                    <i className="fa-solid fa-users text-[#8ec5eb]" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Total pastors</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.totalPastors}
                  </h3>
                </div>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">
                    <i className="fa-solid fa-circle-check text-emerald-300" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Pastors completed</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.completedPastors}
                  </h3>
                </div>
              </>
            ) : (
              <div className="col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] py-10 text-center text-sm text-white/55">
                No overview data available
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Overall progress</h2>
              <p className="mt-1 max-w-xl text-sm text-white/55">
                Roadmap and assessment completion (combined). Open Track Progress for per-person detail.
              </p>
            </div>
            <Link
              href="/director/track-progress"
              className="shrink-0 text-sm font-semibold text-[#8ec5eb] transition hover:text-[#b8ddf5]"
            >
              View track progress
              <i className="fa-solid fa-arrow-up-right-from-square ml-1.5 text-xs opacity-80" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div className={`${directorGlassCard} p-5 sm:p-8`}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">Roadmap &amp; assessments</h3>
                  <p className="mt-1 text-xs text-white/50">Network-wide combined completion</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#8ec5eb]" />
                    Done
                  </span>
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f9c74f]" />
                    Remaining
                  </span>
                </div>
              </div>

              <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 py-2 sm:min-h-[280px]">
                {overviewLoading ? (
                  <div className={directorSpinner} role="status" aria-label="Loading" />
                ) : donutChartData ? (
                  <>
                    <div className="relative h-[200px] w-[200px] sm:h-[220px] sm:w-[220px]">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(
                            #8ec5eb 0deg ${donutChartData.completedDegrees}deg,
                            #f9c74f ${donutChartData.completedDegrees}deg 360deg
                          )`,
                        }}
                      />
                      <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#041f35] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                          {donutChartData.completed.toFixed(1)}%
                        </span>
                        <span className="mt-0.5 text-xs text-white/50">complete</span>
                      </div>
                    </div>
                    <div className="flex w-full max-w-sm justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                      <div>
                        <p className="text-white/50">Completed</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-[#8ec5eb]">
                          {donutChartData.completed.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50">Remaining</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-[#f9c74f]">
                          {donutChartData.remaining.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/50">No progress data available</p>
                )}
              </div>
            </div>

            <div className={`${directorGlassCard} p-5 sm:p-8`}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">Monthly completions</h3>
                  <p className="mt-1 text-xs text-white/50">Pastors and mentors (last six months in view)</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#8ec5eb]" />
                    <span className="text-white/70">Pastor</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#5ee0d0]" />
                    <span className="text-white/70">Mentor</span>
                  </div>
                  <select
                    disabled
                    className={`${directorInputClass} !py-2 !text-sm opacity-80`}
                    aria-label="Time range (fixed to past six months in chart)"
                    title="Chart shows the last 6 months from your overview"
                  >
                    <option className="bg-[#0a3558]">Past 6 months</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#041f35]/50 p-3 sm:p-4">
                <div className="flex h-[200px] items-end justify-between gap-1.5 sm:h-[240px] sm:gap-3">
                  {overviewLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className={directorSpinner} role="status" aria-label="Loading chart" />
                    </div>
                  ) : chartData.length > 0 ? (
                    chartData.map((data, i) => {
                      const maxValue = Math.max(
                        ...chartData.map((d) => Math.max(d.pastor, d.mentor)),
                        1,
                      );
                      const pastorHeight = maxValue > 0 ? (data.pastor / maxValue) * 100 : 0;
                      const mentorHeight = maxValue > 0 ? (data.mentor / maxValue) * 100 : 0;
                      return (
                        <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-[160px] w-full max-w-[48px] items-end justify-center gap-0.5 self-center sm:h-[200px] sm:max-w-none sm:gap-1">
                            <div
                              className="w-[46%] max-w-[22px] rounded-t-md bg-gradient-to-t from-[#6eb6e0] to-[#8ec5eb] shadow-sm sm:max-w-[28px]"
                              style={{ height: `${Math.max(pastorHeight, 2)}%` }}
                              title={`Pastors: ${data.pastor}`}
                            />
                            <div
                              className="w-[46%] max-w-[22px] rounded-t-md bg-gradient-to-t from-[#3ec9b8] to-[#5ee0d0] shadow-sm sm:max-w-[28px]"
                              style={{ height: `${Math.max(mentorHeight, 2)}%` }}
                              title={`Mentors: ${data.mentor}`}
                            />
                          </div>
                          <span className="max-w-full truncate text-center text-[10px] text-white/55 sm:text-xs">
                            {data.monthName}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                      No chart data for this period
                    </div>
                  )}
                </div>
              </div>
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
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${directorGlassCard} ${directorGlassCardHover}`}
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
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${directorGlassCard} ${directorGlassCardHover}`}
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

        <div className={`relative overflow-hidden rounded-2xl border border-white/15 ${directorGlassCard}`}>
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
