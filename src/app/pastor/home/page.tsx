"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCookie } from "@/app/utils/cookies";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/hero-bg.png";
import UserProfile from "../../Assets/user-profile.png";
import PastorFooter from "@/app/Components/PastorFooter";
import { useRouter } from "next/navigation";
import { getUpcomingAppointments, getUserAppointments } from "@/app/Services/pastor.service";
import { apiGetAssignedUsers, apiGetRoadmapsByUser } from "@/app/Services/api";
import { apiGetUserProgress } from "@/app/Services/progress.service";

type Mentor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
};

export default function PastorDashboard() {
  const router = useRouter();

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  useEffect(() => {
    const fetchMentors = async () => {
      try {
        setLoadingMentors(true);
        setMentorsError(null);

        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) {
          setMentorsError("User session not found. Please log in again.");
          return;
        }

        const response = await apiGetAssignedUsers(userId);
        const assigned = (response.data?.data || []) as any[];
        const normalizedMentors: Mentor[] = assigned.map((mentor) => ({
          id: mentor.id || mentor._id || "",
          firstName: mentor.firstName || "",
          lastName: mentor.lastName || "",
          email: mentor.email || "",
          username: mentor.username || "",
          role: mentor.role || "Mentor",
        }));
        setMentors(normalizedMentors);
      } catch (err: any) {
        console.error("Error fetching mentors", err);
        setMentors([]);
        setMentorsError(err?.message || "Unable to fetch mentors from API.");
      } finally {
        setLoadingMentors(false);
      }
    };

    fetchMentors();
  }, []);

  useEffect(() => {
  const storedUser = JSON.parse(getCookie("user") || "{}");

  const userId = storedUser?.id || storedUser?._id || "";

  if (!userId) return;

  async function fetchAppointments() {
    try {
      let list: any[] = [];

      // Try dedicated upcoming endpoint first.
      try {
        const res = await getUpcomingAppointments(userId);
        const data = res.data?.data;
        list = Array.isArray(data)
          ? data
          : Array.isArray(data?.appointments)
          ? data.appointments
          : Array.isArray(data?.upcomingAppointments)
          ? data.upcomingAppointments
          : Array.isArray(res.data?.appointments)
          ? res.data.appointments
          : [];
      } catch {
        // Fall back to user appointments endpoint when upcoming is unavailable.
        const fallbackRes = await getUserAppointments(userId);
        const fallbackData = fallbackRes.data?.data;
        list = Array.isArray(fallbackData)
          ? fallbackData
          : Array.isArray(fallbackData?.appointments)
          ? fallbackData.appointments
          : Array.isArray(fallbackRes.data?.appointments)
          ? fallbackRes.data.appointments
          : [];
      }

      setAppointments(list);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    }
  }

  fetchAppointments();
}, []);

  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapTab, setRoadmapTab] = useState("All");
  const [overallProgress, setOverallProgress] = useState<number | null>(null);

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const user = JSON.parse(getCookie("user") || "{}");
        const uid = user?.id || user?._id;
        if (!uid) return;
        const res = await apiGetRoadmapsByUser(uid);
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const mapped = data.map((item: any) => ({
          id: item._id,
          title: item.name,
          hasNested: Array.isArray(item.roadmaps) && item.roadmaps.length > 0,
          status:
            item.status?.toLowerCase() === "in progress"
              ? "In Progress"
              : item.status?.toLowerCase() === "completed"
              ? "Completed"
              : item.status?.toLowerCase() === "due"
              ? "Due"
              : "Remaining",
        }));
        setRoadmaps(mapped);
      } catch (err) {
        console.error("Error fetching roadmaps:", err);
      }
    };
    fetchRoadmaps();
  }, []);

  useEffect(() => {
    const fetchOverallProgress = async () => {
      try {
        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) return;
        const res = await apiGetUserProgress(userId);
        const progress = Number(res.data?.data?.overallProgress ?? 0);
        setOverallProgress(Number.isFinite(progress) ? progress : 0);
      } catch (error) {
        console.error("Error fetching overall progress:", error);
        setOverallProgress(null);
      }
    };
    fetchOverallProgress();
  }, []);

  const filteredRoadmaps =
    roadmapTab === "All"
      ? roadmaps
      : roadmaps.filter((r) => r.status === roadmapTab);

  const [currentTime, setCurrentTime] = useState("");

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      // Format Time → "11 : 59 AM"
      const time = now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }).replace(":", " : ");

      // Format Date → "Tuesday, Sep 23"
      const date = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      setCurrentTime(time);
      setCurrentDate(date);
    };

    // Initial call
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);
  const completedCount = roadmaps.filter((item) => item.status === "Completed").length;
  const progressPercent = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        overallProgress ??
          (roadmaps.length > 0 ? (completedCount / roadmaps.length) * 100 : 0),
      ),
    ),
  );
  const nextAppointment = appointments[0];
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? "Good Morning" : greetingHour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-14 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/85">{greeting}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold tracking-wide">{currentTime}</p>
              <p className="text-xs text-white/80">{currentDate}</p>
            </div>
          </div>

          <div
            className="rounded-2xl border border-white/20 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-4 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md"
            onClick={() => router.push("/pastor/profile")}
          >
            <div className="flex items-center gap-3">
              <Image src={UserProfile} alt="User" width={44} height={44} className="rounded-full border border-white/40" />
              <div className="flex-1">
                <p className="text-lg font-semibold">Welcome aboard!</p>
                <p className="text-xs text-white/80">Progress</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-white/25">
                    <div className="h-2 rounded-full bg-[#8ec5eb]" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <span className="text-sm font-semibold">{progressPercent}%</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push("/pastor/Myprogress");
                  }}
                  className="mt-2 text-xs font-semibold text-[#8ec5eb] hover:text-white"
                >
                  View Progress Tracker
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <i className="fa-solid fa-filter text-[#8ec5eb]" />
                </div>
                <h3 className="text-2xl font-semibold">Things to Focus On</h3>
              </div>
              <p className="text-sm text-[#cde2f2]">Here are the most important things you should focus on today.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Link href="/pastor/Appointments" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-xs text-[#cde2f2]">Today&apos;s Meetings</p>
                </Link>
                <Link href="/pastor/revitalization-roadmap?tab=In%20Progress" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-xs text-[#cde2f2]">In Progress Roadmaps</p>
                </Link>
                <Link href="/pastor/Assessments?tab=In%20Progress" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-xs text-[#cde2f2]">In Progress Assessments</p>
                </Link>
                <Link href="/pastor/Mymentors" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-xs text-[#cde2f2]">Mentor Comments</p>
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-5 backdrop-blur-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl font-semibold">Need a Help?</h3>
                  <p className="text-sm text-[#cde2f2]">
                    {nextAppointment
                      ? `Next: ${new Date(nextAppointment.meetingDate).toLocaleString()}`
                      : "We've got simple steps to help you move forward."}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => router.push("/pastor/Appointments")} className="rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/15">
                    <i className="fa-regular fa-circle-question mr-2" />
                    Help
                  </button>
                  <button onClick={() => router.push("/pastor/Mymentors")} className="rounded-xl border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/15">
                    <i className="fa-solid fa-phone mr-2" />
                    Call Mentor
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <i className="fa-regular fa-compass text-[#8ec5eb]" />
                </div>
                <h3 className="text-2xl font-semibold">Quick Links</h3>
              </div>
              <p className="text-sm text-[#cde2f2]">Roadmap, mentors, progress, and notes.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Link href="/pastor/revitalization-roadmap" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-sm font-medium">Roadmap Phases</p>
                </Link>
                <Link href="/pastor/Mymentors" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-sm font-medium">My Mentors</p>
                </Link>
                <Link href="/pastor/Myprogress" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-sm font-medium">Progress Tracker</p>
                </Link>
                <Link href="/pastor/Assessments" className="rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10">
                  <p className="text-sm font-medium">Assessments</p>
                </Link>
              </div>
            </div>
          </div>

          {(loadingMentors || mentorsError || filteredRoadmaps.length === 0) && (
            <div className="mt-5 text-xs text-[#cde2f2]">
              {loadingMentors
                ? "Loading dashboard data..."
                : mentorsError
                ? mentorsError
                : "No roadmap data yet."}
            </div>
          )}
        </div>
      </section>

      <PastorFooter />
    </div>
  );
}
