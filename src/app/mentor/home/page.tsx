"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import HeroBg from "../../Assets/hero-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import UserProfile from "../../Assets/user-profile.png";
import MapImg from "../../Assets/map-placeholder.png";
import { useRouter } from "next/navigation";
import { apiAssignUsers, apiGetMentorAppointments } from "@/app/Services/api";
import MentorHeader from "@/app/Components/MentorHeader";
import { getGreeting } from "@/app/Services/utils/helpers";
import Cookies from "js-cookie";
import Link from "next/link";

const glassCard =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.4)]";
const glassCardHover =
  "transition-all duration-300 hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_100%)] hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

const getMentorFromCookie = () => {
  const cookie = Cookies.get("mentor");
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
};

const mentorStatic = getMentorFromCookie();
const userIdStatic = mentorStatic?.id ?? mentorStatic?._id;
const assignedIdsStatic = mentorStatic?.assignedId || [];

const isToday = (dateString: string) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const focusItems = [
  {
    label: "Today's Mentorship Sessions",
    shortLabel: "Today's Mentorship",
    icon: "fa-regular fa-calendar-check",
    route: "/mentor/MentorSchedule",
  },
  {
    label: "Other Meetings",
    shortLabel: "Other Meetings",
    icon: "fa-solid fa-layer-group",
    route: "/mentor/MentorSchedule",
  },
  {
    label: "Pastor Queries",
    shortLabel: "Pastor Queries",
    icon: "fa-regular fa-comments",
    route: "/mentor/MenteesDetailed",
  },
  {
    label: "Survey Submissions",
    shortLabel: "Survey Submissions",
    icon: "fa-regular fa-file-lines",
    route: "/mentor/MentorAssessments",
  },
];

const quickLinks = [
  {
    title: "Session Notes",
    icon: "fa-regular fa-note-sticky",
    route: "/mentor/documents",
  },
  {
    title: "My Mentees",
    icon: "fa-solid fa-user-group",
    route: "/mentor/MenteesDetailed",
  },
  {
    title: "Mentees' Progress",
    icon: "fa-solid fa-chart-simple",
    route: "/mentor/TrackProgress",
  },
];

const exploreCards = [
  {
    title: "Mentees",
    desc: "Schedule and manage appointments with ease.",
    icon: "fa-regular fa-calendar-check",
    route: "/mentor/MenteesDetailed",
  },
  {
    title: "Track Progress",
    desc: "Track growth and celebrate milestones.",
    icon: "fa-solid fa-chart-simple",
    route: "/mentor/TrackProgress",
  },
  {
    title: "Schedule",
    desc: "View and manage your mentoring schedule.",
    icon: "fa-regular fa-clipboard",
    route: "/mentor/MentorSchedule",
  },
  {
    title: "Revitalization Roadmap",
    desc: "Plan and execute your development roadmap.",
    icon: "fa-solid fa-pen-clip",
    route: "/mentor/RevitalizationRoadmap",
  },
];

export default function MentorHomePage() {
  const router = useRouter();
  const [mentees, setMentees] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [mentorUser, setMentorUser] = useState<ReturnType<typeof getMentorFromCookie>>(null);

  const userId = mentorUser?.id ?? mentorUser?._id ?? userIdStatic;
  const assignedIds = mentorUser?.assignedId || assignedIdsStatic;

  useEffect(() => {
    setMentorUser(getMentorFromCookie());
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const m = getMentorFromCookie();
        const uid = m?.id ?? m?._id;
        if (!uid) {
          setMentees([]);
          return;
        }
        const ids = m?.assignedId || [];
        const res = await apiAssignUsers(uid, ids);
        setMentees(res.data?.data?.assignedId || []);
      } catch (error) {
        console.error("Error fetching mentor home data:", error);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        if (!userId) return;
        setAppointmentsLoading(true);
        const res = await apiGetMentorAppointments(userId, true);
        const allAppointments = res.data?.data || [];
        const todays = allAppointments.filter((a: { meetingDate: string }) =>
          isToday(a.meetingDate),
        );
        setAppointments(todays);
      } catch (err) {
        console.error("Failed to load appointments:", err);
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    fetchAppointments();
  }, [userId]);

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

  const firstName = mentorUser?.firstName ?? mentorStatic?.firstName ?? "";
  const lastName = mentorUser?.lastName ?? mentorStatic?.lastName ?? "";
  const welcomeLine =
    firstName || lastName
      ? `Welcome back, ${firstName}${firstName && lastName ? " " : ""}${lastName}!`
      : "Welcome back!";

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-transparent font-[Albert_Sans]">
        <div className="text-center text-white">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
          <p className="text-sm text-[#cde2f2]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pb-10 lg:px-8 lg:pt-6">
        {/* Hero */}
        <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 ${glassCard}`}
        >
          <div className="relative h-[220px] sm:h-[280px] lg:h-[320px]">
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
              <div className="space-y-1 lg:max-w-xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  {getGreeting()}
                </p>
                <p className="text-sm text-white/80 sm:text-base">{formattedTime}</p>
                <p className="text-xs text-white/60 sm:text-sm">{formattedDate}</p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/mentor/profile")}
                className={`mt-6 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition hover:bg-white/15 lg:mt-0 lg:w-auto`}
              >
                <Image
                  src={UserProfile}
                  alt=""
                  width={48}
                  height={48}
                  className="rounded-full border-2 border-white/30"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{welcomeLine}</p>
                  <p className="mt-1 text-xs text-white/65">Tap to view your profile</p>
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Quick filter chips — horizontal scroll on small screens */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
          {focusItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => router.push(item.route)}
              className="shrink-0 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-left text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-[#8ec5eb]/40 hover:bg-white/10 sm:text-sm"
            >
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">{item.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Things to focus on */}
        <section className="mt-8">
          <div className={`p-5 sm:p-6 lg:p-8 ${glassCard}`}>
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <i className="fa-solid fa-filter text-lg text-[#8ec5eb]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold sm:text-xl">Things to Focus On</h2>
                <p className="mt-1 text-sm text-white/65">
                  Here are the most important things you should focus on today.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {focusItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => router.push(item.route)}
                  className={`flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center ${glassCardHover}`}
                >
                  <i className={`${item.icon} text-2xl text-[#8ec5eb]`} />
                  <span className="text-xs font-medium leading-snug text-white/90 sm:text-sm">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Need a help? */}
        <section className="mt-6">
          <div
            className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${glassCard}`}
          >
            <div className="flex flex-1 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <i className="fa-solid fa-book-open text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-base font-semibold sm:text-lg">Need a Help?</h3>
                <p className="mt-1 text-sm text-white/65">
                  We&apos;ve got simple steps to help you move forward.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => router.push("/mentor/MentorAssessments")}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
              >
                <i className="fa-regular fa-circle-question text-[#8ec5eb]" />
                Help
              </button>
              <button
                type="button"
                onClick={() => router.push("/mentor/MentorSchedule")}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
              >
                <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                Sessions
              </button>
            </div>
          </div>
        </section>

        {/* Today's appointments */}
        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold sm:text-xl">Today&apos;s Appointments</h2>
            <Link
              href="/mentor/MentorSchedule"
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
            <div className="grid gap-4 lg:grid-cols-2">
              {appointments.slice(0, 2).map((appt, i) => {
                const meetingDate = new Date(appt.meetingDate);
                return (
                  <div
                    key={appt._id || i}
                    className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${glassCard}`}
                  >
                    <div className="flex shrink-0 justify-center sm:justify-start">
                      <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:h-[120px] sm:w-[120px]">
                        <Image
                          src={i % 2 === 0 ? DuoIcon : MeetIcon}
                          alt=""
                          className="h-12 w-12 sm:h-14 sm:w-14"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                        <Image
                          src={appt.mentor?.profilePicture || UserProfile}
                          alt=""
                          width={40}
                          height={40}
                          className="rounded-full border border-white/30"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {appt.mentor?.firstName} {appt.mentor?.lastName}
                          </p>
                          <p className="text-xs text-white/60">{appt.mentor?.role || "Mentor"}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 text-xs sm:justify-start">
                        <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                          <i className="fa-regular fa-calendar mr-1 text-[#e3d247]" />
                          {meetingDate.toLocaleDateString()}
                        </span>
                        <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                          <i className="fa-regular fa-clock mr-1 text-[#5ee0d0]" />
                          {meetingDate.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-white/55">
                        Mode:{" "}
                        <span className="text-[#b8d4ff] underline">{appt.platform}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="mt-10">
          <div className={`p-5 sm:p-6 lg:p-8 ${glassCard}`}>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                <i className="fa-solid fa-map text-[#8ec5eb]" />
              </div>
              <h2 className="text-lg font-semibold sm:text-xl">Quick Links</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
              {quickLinks.map((q) => (
                <button
                  key={q.title}
                  type="button"
                  onClick={() => router.push(q.route)}
                  className={`flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] py-8 ${glassCardHover}`}
                >
                  <i className={`${q.icon} text-2xl text-[#8ec5eb]`} />
                  <span className="text-sm font-medium text-white/90">{q.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Reminders / mentees */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold sm:text-xl">Reminders</h2>
            <Link
              href="/mentor/MenteesDetailed"
              className="text-sm font-medium text-[#8ec5eb] hover:text-[#b8ddf5]"
            >
              See all
            </Link>
          </div>
          {mentees.length === 0 ? (
            <div className={`p-8 text-center text-sm text-white/55 ${glassCard}`}>
              No mentees are assigned yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {mentees.slice(0, 4).map((mentee, i) => (
                <button
                  key={mentee._id || i}
                  type="button"
                  onClick={() =>
                    router.push(`/mentor/MenteesDetailed/profile?id=${mentee._id}`)
                  }
                  className={`overflow-hidden text-left ${glassCard} ${glassCardHover}`}
                >
                  <div className="relative aspect-[4/3] w-full">
                    <Image
                      src={mentee.profilePicture || [Mentor1, Mentor2, Mentor3][i % 3]}
                      alt=""
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#062946] to-transparent opacity-80" />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-white">
                      {mentee.firstName} {mentee.lastName}
                    </p>
                    <p className="text-xs text-white/55">{mentee.role}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Roadmap list */}
        <section className="mt-10">
          <div className={`p-5 sm:p-6 lg:p-8 ${glassCard}`}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold">Today&apos;s Roadmap List</h3>
              <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
                {["All", "Roadmap", "Survey"].map((tab, index) => (
                  <button
                    key={tab}
                    type="button"
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium sm:flex-none ${
                      index === 0
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
              {[
                {
                  title: "Submitted Roadmap",
                  desc: "Task: Complete a Community Engagement Project",
                  user: "John Doe",
                },
                {
                  title: "Submitted Survey",
                  desc: "Title: Pastoral Ministry Profile (PMP)",
                  user: "Richard Roe",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 sm:flex-row sm:items-center"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="text-xs text-white/55">{item.desc}</p>
                  </div>
                  <span className="text-sm text-white/70">{item.user}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => router.push("/mentor/RevitalizationRoadmap")}
                className="rounded-xl bg-[#8ec5eb] px-5 py-2.5 text-sm font-semibold text-[#062946] transition hover:bg-[#b8ddf5]"
              >
                View Roadmap
              </button>
            </div>
          </div>
        </section>

        {/* Explore */}
        <section className="mt-10">
          <h2 className="mb-6 text-lg font-semibold sm:text-xl">Explore CCC</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {exploreCards.map((item) => (
              <button
                key={item.route}
                type="button"
                onClick={() => router.push(item.route)}
                className={`flex flex-col items-start p-5 text-left ${glassCard} ${glassCardHover}`}
              >
                <i className={`${item.icon} mb-4 text-2xl text-[#8ec5eb]`} />
                <span className="font-semibold text-white">{item.title}</span>
                <span className="mt-2 text-sm text-white/60">{item.desc}</span>
                <span className="mt-4 flex items-center gap-2 text-sm text-[#8ec5eb]">
                  More <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Map */}
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">Mentees map</h2>
            <input
              type="search"
              placeholder="Search mentees…"
              className="w-full max-w-xs rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#8ec5eb]/50 sm:w-auto"
            />
          </div>
          <div className={`overflow-hidden rounded-3xl border border-white/10 ${glassCard} p-1`}>
            <div className="relative aspect-[21/9] min-h-[280px] w-full sm:min-h-[360px] lg:min-h-[420px]">
              <Image src={MapImg} alt="Map" fill className="rounded-[1.35rem] object-cover" />
              <div className="absolute bottom-4 left-4 rounded-xl border border-white/15 bg-black/40 px-4 py-3 backdrop-blur-md sm:bottom-6 sm:left-6">
                <p className="text-sm font-medium text-white">Mentor locations across the region</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile bottom nav — matches app-style shell */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#0a1220]/95 py-3 backdrop-blur-lg md:hidden"
        aria-label="Primary"
      >
        <Link
          href="/mentor/home"
          className="flex flex-col items-center gap-1 text-[#8ec5eb]"
        >
          <i className="fa-solid fa-house text-lg" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link
          href="/mentor/MenteesDetailed"
          className="flex flex-col items-center gap-1 text-white/50"
        >
          <i className="fa-solid fa-magnifying-glass text-lg" />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>
        <Link
          href="/mentor/profile"
          className="flex flex-col items-center gap-1 text-white/50"
        >
          <i className="fa-regular fa-user text-lg" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

      <div className="relative z-10 mt-auto">
      </div>
    </div>
  );
}

