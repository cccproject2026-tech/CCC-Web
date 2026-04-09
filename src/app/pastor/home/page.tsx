"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getCookie } from "@/app/utils/cookies";
import {
  subscribePastorAssignmentsBroadcast,
  subscribeProgressUpdated,
} from "@/app/utils/progress-sync";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/hero-bg.png";
import UserProfile from "../../Assets/user-profile.png";
import { useRouter } from "next/navigation";
import { getUpcomingAppointments, getUserAppointments } from "@/app/Services/pastor.service";
import { apiGetAssignedUsers, apiGetRoadmapsByUser } from "@/app/Services/api";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  apiGetAssignedAssessments,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { pastorMainGradient, pastorPageRoot } from "@/app/Components/pastor/pastor-theme";
import "@fortawesome/fontawesome-free/css/all.min.css";

type Mentor = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
};

/**
 * Dashboard “Things to Focus On” — each href loads a page that fetches its own data:
 * - Appointments → pastor schedule APIs
 * - My Mentors → assigned mentors
 * - Assessments → assigned assessments list
 */
const FOCUS_HREF = {
  todayAppointments: "/pastor/Appointments",
  otherAppointments: "/pastor/Appointments",
  myMentors: "/pastor/Mymentors",
  assessments: "/pastor/Assessments?tab=Due",
} as const;

const innerTileHover =
  "transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

const pastorFocusGlass =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] backdrop-blur-md";

function readPastorUserId(): string | null {
  try {
    const user = JSON.parse(getCookie("user") || "{}");
    const id = user?.id || user?._id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

const isToday = (dateString: string) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

function appointmentMeetingDate(a: unknown): string {
  if (!a || typeof a !== "object") return "";
  const o = a as Record<string, unknown>;
  const v = o.meetingDate ?? o.date ?? o.startTime ?? o.scheduledAt;
  return v != null ? String(v) : "";
}

export default function PastorDashboard() {
  const router = useRouter();

  const [pastorUserId] = useState<string | null>(() => readPastorUserId());

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorsError, setMentorsError] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeAssessmentCount, setActiveAssessmentCount] = useState<number | null>(null);

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
  const [overallProgress, setOverallProgress] = useState<number | null>(null);

  const refreshAssessmentCount = useCallback(async () => {
    if (!pastorUserId) {
      setActiveAssessmentCount(null);
      return;
    }
    try {
      const [assessmentRes, progressRes] = await Promise.all([
        apiGetAssignedAssessments(pastorUserId),
        apiGetUserProgress(pastorUserId),
      ]);
      const list = parseAssignedAssessmentsListBody(assessmentRes.data);
      const progressData = unwrapProgressData(progressRes);
      const assessmentProgress = progressData?.assessments || [];

      let active = 0;
      for (const item of list) {
        const flat = flattenAssignedAssessmentRow(item);
        if (!flat) continue;
        const { assessmentId: aid, assignmentId } = flat;
        const progress = assessmentProgress.find(
          (p: { assessmentId?: string; assignmentId?: string }) =>
            String(p.assessmentId) === aid ||
            (assignmentId && p.assignmentId && String(p.assignmentId) === assignmentId),
        );

        const ps = String(progress?.status || "").toLowerCase().replace(/\s+/g, "_");
        let status: "Due" | "Not Started" | "Completed" | "Submitted" = "Not Started";
        if (ps === "completed" || ps === "reviewed") status = "Completed";
        else if (ps === "submitted") status = "Submitted";
        else if (
          ps === "in_progress" ||
          ps === "inprogress" ||
          ps === "assigned" ||
          ps === "due"
        )
          status = "Due";
        if (status === "Due" || status === "Not Started") active++;
      }
      setActiveAssessmentCount(active);
    } catch {
      setActiveAssessmentCount(null);
    }
  }, [pastorUserId]);

  const refreshRoadmapsAndProgress = useCallback(async () => {
    if (!pastorUserId) return;
    try {
      const res = await apiGetRoadmapsByUser(pastorUserId);
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
    try {
      const res = await apiGetUserProgress(pastorUserId);
      const progress = Number(res.data?.data?.overallProgress ?? 0);
      setOverallProgress(Number.isFinite(progress) ? progress : 0);
    } catch (error) {
      console.error("Error fetching overall progress:", error);
      setOverallProgress(null);
    }
  }, [pastorUserId]);

  useEffect(() => {
    void refreshRoadmapsAndProgress();
  }, [refreshRoadmapsAndProgress]);

  useEffect(() => {
    void refreshAssessmentCount();
  }, [refreshAssessmentCount]);

  useEffect(() => {
    if (!pastorUserId) return;

    const run = () => {
      void refreshRoadmapsAndProgress();
      void refreshAssessmentCount();
    };

    const unsubProgress = subscribeProgressUpdated((uid) => {
      if (uid === pastorUserId) run();
    });
    const unsubBc = subscribePastorAssignmentsBroadcast((ids) => {
      if (ids.includes(pastorUserId)) run();
    });
    const onVisibility = () => {
      if (document.visibilityState === "visible") run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubProgress();
      unsubBc();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pastorUserId, refreshRoadmapsAndProgress, refreshAssessmentCount]);

  const todaysAppointments = useMemo(
    () =>
      appointments.filter((a) => {
        const d = appointmentMeetingDate(a);
        return d && !Number.isNaN(Date.parse(d)) && isToday(d);
      }),
    [appointments],
  );

  const otherUpcomingCount = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return appointments.filter((a) => {
      const raw = appointmentMeetingDate(a);
      if (!raw || Number.isNaN(Date.parse(raw))) return false;
      const d = new Date(raw);
      return !isToday(raw) && d >= start;
    }).length;
  }, [appointments]);

  const focusItems = useMemo(
    () => [
      {
        label: "Today's Meetings",
        shortLabel: "Today",
        icon: "fa-regular fa-calendar-check",
        href: FOCUS_HREF.todayAppointments,
        count: todaysAppointments.length,
        ariaLabel: "Open appointments — today's meetings",
      },
      {
        label: "Other Upcoming Meetings",
        shortLabel: "Upcoming",
        icon: "fa-solid fa-layer-group",
        href: FOCUS_HREF.otherAppointments,
        count: otherUpcomingCount,
        ariaLabel: "Open appointments — upcoming schedule",
      },
      {
        label: "My Mentors",
        shortLabel: "Mentors",
        icon: "fa-regular fa-comments",
        href: FOCUS_HREF.myMentors,
        count: mentors.length,
        ariaLabel: "Open my mentors — assigned mentors",
      },
      {
        label: "Open Assessments",
        shortLabel: "Assessments",
        icon: "fa-regular fa-file-lines",
        href: FOCUS_HREF.assessments,
        count: activeAssessmentCount,
        ariaLabel: "Open assessments — due and open items",
      },
    ],
    [todaysAppointments.length, otherUpcomingCount, mentors.length, activeAssessmentCount],
  );

  const [currentTime, setCurrentTime] = useState("");

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      const time = now
        .toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        })
        .replace(":", " : ");

      const date = now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      });

      setCurrentTime(time);
      setCurrentDate(date);
    };

    updateTime();

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
    <div className={pastorPageRoot}>
      <PastorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-8 pt-6 sm:px-8 lg:px-20"
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
              <Image
                src={UserProfile}
                alt="User"
                width={44}
                height={44}
                className="rounded-full border border-white/40"
              />
              <div className="flex-1">
                <p className="text-lg font-semibold">Welcome aboard!</p>
                <p className="text-xs text-white/80">Progress</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-2 flex-1 rounded-full bg-white/25">
                    <div
                      className="h-2 rounded-full bg-[#8ec5eb]"
                      style={{ width: `${progressPercent}%` }}
                    />
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
        </div>
      </section>

      <main className={pastorMainGradient}>
        <div className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-8 lg:px-20">
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible">
            {focusItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                aria-label={item.ariaLabel}
                prefetch
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-left text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-[#8ec5eb]/40 hover:bg-white/10 sm:text-sm"
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.count != null ? (
                  <span className="rounded-full bg-[#8ec5eb]/25 px-2 py-0.5 text-[10px] font-bold text-white tabular-nums">
                    {item.count > 99 ? "99+" : item.count}
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <section className="mt-8">
            <div className={`p-5 sm:p-6 lg:p-8 ${pastorFocusGlass}`}>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <i className="fa-solid fa-filter text-lg text-[#8ec5eb]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold sm:text-xl">Things to Focus On</h2>
                  <p className="mt-1 text-sm text-[#cde2f2]">
                    Here are the most important things you should focus on today.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                {focusItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-label={item.ariaLabel}
                    prefetch
                    className={`flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-center ${innerTileHover}`}
                  >
                    <i className={`${item.icon} text-2xl text-[#8ec5eb]`} />
                    <span className="text-xs font-medium leading-snug text-white/90 sm:text-sm">
                      {item.label}
                    </span>
                    {item.count != null ? (
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-[#8ec5eb]">
                        {item.count > 99 ? "99+" : item.count}
                      </span>
                    ) : (
                      <span className="text-[10px] text-white/40">…</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div
              className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${pastorFocusGlass}`}
            >
              <div className="flex flex-1 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <i className="fa-solid fa-book-open text-[#8ec5eb]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold sm:text-lg">Need a Help?</h3>
                  <p className="mt-1 text-sm text-[#cde2f2]">
                    {(() => {
                      if (!nextAppointment) {
                        return "We've got simple steps to help you move forward.";
                      }
                      const raw = appointmentMeetingDate(nextAppointment);
                      const d = raw ? new Date(raw) : null;
                      if (!d || Number.isNaN(d.getTime())) {
                        return "We've got simple steps to help you move forward.";
                      }
                      return `Next: ${d.toLocaleString()}`;
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:gap-3">
                <Link
                  href={FOCUS_HREF.assessments}
                  prefetch
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
                >
                  <i className="fa-regular fa-circle-question text-[#8ec5eb]" />
                  Help
                </Link>
                <Link
                  href={FOCUS_HREF.myMentors}
                  prefetch
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white/15"
                >
                  <i className="fa-solid fa-phone text-[#8ec5eb]" />
                  Call Mentor
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <div className={`p-5 sm:p-6 ${pastorFocusGlass}`}>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                  <i className="fa-regular fa-compass text-[#8ec5eb]" />
                </div>
                <h3 className="text-2xl font-semibold">Quick Links</h3>
              </div>
              <p className="text-sm text-[#cde2f2]">Roadmap, mentors, progress, and notes.</p>
              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Link
                  href="/pastor/revitalization-roadmap?tab=In%20Progress"
                  prefetch
                  className={`rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 ${innerTileHover}`}
                >
                  <p className="text-sm font-medium">Roadmap Phases</p>
                </Link>
                <Link href="/pastor/Mymentors" prefetch className={`rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 ${innerTileHover}`}>
                  <p className="text-sm font-medium">My Mentors</p>
                </Link>
                <Link href="/pastor/Myprogress" prefetch className={`rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 ${innerTileHover}`}>
                  <p className="text-sm font-medium">Progress Tracker</p>
                </Link>
                <Link href="/pastor/Assessments" prefetch className={`rounded-xl border border-white/15 bg-white/5 p-4 text-left transition hover:bg-white/10 ${innerTileHover}`}>
                  <p className="text-sm font-medium">Assessments</p>
                </Link>
              </div>
            </div>
          </section>

          {(loadingMentors || mentorsError || roadmaps.length === 0) && (
            <div className="mt-5 text-xs text-[#cde2f2]">
              {loadingMentors
                ? "Loading dashboard data..."
                : mentorsError
                  ? mentorsError
                  : "No roadmap data yet."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
