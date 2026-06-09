"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Image from "next/image";
import HeroBg from "../../Assets/hero-bg.png";
import UserProfile from "../../Assets/user-profile.png";
import MapImg from "../../Assets/map-placeholder.png";
import { useRouter } from "next/navigation";
import { apiGetAssignedUsers, apiGetMentorAppointments, apiGetMentorSchedule, apiGetRoadmapSubmissionActivity } from "@/app/Services/api";
import { fetchMergedRoadmapsForAssignedUser, unwrapNestedRoadmapsArray } from "@/app/Services/roadmap-assignments";
import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import MentorHeader from "@/app/Components/MentorHeader";
import { getGreeting } from "@/app/Services/utils/helpers";
import Cookies from "js-cookie";
import Link from "next/link";
import {
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import DashboardFocusModal from "@/app/Components/dashboard/DashboardFocusModal";
import { loadMentorFocusSections } from "@/app/utils/dashboard-focus/mentor-focus";
import type { DashboardFocusSection } from "@/app/utils/dashboard-focus/types";

const innerTileHover =
  "transition-all duration-300 hover:border-white/25 hover:bg-white/[0.08] hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

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

/**
 * CCC-Mobile `MentorDashboardHome` EXPLORE_TILES — same labels and routes (web paths).
 */
const quickLinks = [
  {
    icon: "fa-regular fa-file-lines",
    line1: "Session",
    line2: "Notes",
    route: "/mentor/notes",
  },
  {
    icon: "fa-solid fa-microphone",
    line1: "Voice",
    line2: "Notes",
    route: "/mentor/voice-notes",
  },
  {
    icon: "fa-regular fa-calendar",
    line1: "Mentorship",
    line2: "Sessions",
    route: "/mentor/mentoring-session",
  },
  {
    icon: "fa-solid fa-user-group",
    line1: "My",
    line2: "Mentees",
    route: "/mentor/MenteesDetailed",
  },
  {
    icon: "fa-solid fa-chart-simple",
    line1: "Mentees'",
    line2: "Progress",
    route: "/mentor/TrackProgress",
  },
];
const formatLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

const normalizeStatus = (value: unknown) =>
  String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");

async function pastorNeedsReviewAttention(pastorId: string) {
  const today = formatLocalDate(new Date());

  const activityRes = await apiGetRoadmapSubmissionActivity(pastorId, today, today);
  const activityRows = Array.isArray(activityRes.data?.data) ? activityRes.data.data : [];

  const hasResubmitted = activityRows.some(
    (row: any) => row?.isResubmission === true,
  );

  const roadmaps = await fetchMergedRoadmapsForAssignedUser(pastorId);
  const hasNotStarted = roadmaps.some((roadmap: any) =>
    unwrapNestedRoadmapsArray(roadmap).some((task: any) => {
      const status = normalizeStatus(task?.status ?? task?.submissionStatus ?? task?.reviewStatus);
      return status === "" || status === "not_started" || status === "notstarted";
    }),
  );

  return hasResubmitted || hasNotStarted;
}
export default function MentorHomePage() {
  const router = useRouter();
  const [mentees, setMentees] = useState<any[]>([]);
  const [reviewCenterAttentionCount, setReviewCenterAttentionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scheduleList, setScheduleList] = useState<any[]>([]);
  const [mentorUser, setMentorUser] = useState<ReturnType<typeof getMentorFromCookie>>(null);

  const [mentorFocusSections, setMentorFocusSections] = useState<DashboardFocusSection[]>([]);
  const [mentorFocusLoading, setMentorFocusLoading] = useState(false);
  const [focusModalOpen, setFocusModalOpen] = useState(false);
  const [focusModalSectionId, setFocusModalSectionId] = useState<string | null>(null);
  const [focusModalTitle, setFocusModalTitle] = useState<string | undefined>(undefined);
  const [focusInitialReady, setFocusInitialReady] = useState(false);
  const prevUserIdForFocus = useRef<string | null>(null);

  const userId = mentorUser?.id ?? mentorUser?._id ?? userIdStatic;


  const todayDateOnlyISO = useMemo(() => {
  const today = new Date();

  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}, []);

  const menteesForFocus = useMemo(
    () =>
      mentees
        .map((m: { _id?: string; id?: string; firstName?: string; lastName?: string }) => ({
          id: String(m._id ?? m.id ?? ""),
          firstName: m.firstName,
          lastName: m.lastName,
        }))
        .filter((m) => m.id),
    [mentees],
  );

  /** Same four tiles as CCC-Mobile `focusTiles` (Ionicons → Font Awesome). */
  const focusTiles = useMemo(
    () =>
      [
        {
          icon: "fa-regular fa-calendar",
          line1: "Today's",
          line2: "Mentorship Sessions",
          sheetTitle: "Today's Mentorship Sessions",
          sectionId: "mentorship-sessions-today",
        },
        {
          icon: "fa-solid fa-layer-group",
          line1: "Other",
          line2: "Meetings",
          sheetTitle: "Other Meetings",
          sectionId: "other-meetings",
        },
        {
          icon: "fa-regular fa-comments",
          line1: "Today's Pastor",
          line2: "Queries",
          sheetTitle: "Today's Pastor Queries",
          sectionId: "pastor-queries",
        },
        {
          icon: "fa-regular fa-file-lines",
          line1: "Survey",
          line2: "Submissions",
          sheetTitle: "Survey Submissions",
          sectionId: "survey-submissions",
        },
      ] as const,
    [],
  );

  const displayedMentorFocusSections = useMemo(() => {
    if (!focusModalSectionId) return mentorFocusSections;
    if (focusModalSectionId === "mentorship-sessions-today") {
      return mentorFocusSections.filter(
        (s) => s.id === "mentorship-sessions-today" || s.id === "mentorship-program-upcoming",
      );
    }
    return mentorFocusSections.filter((s) => s.id === focusModalSectionId);
  }, [focusModalSectionId, mentorFocusSections]);

  const openThingsToFocusModal = useCallback((opts?: { sectionId?: string; title?: string }) => {
    setFocusModalSectionId(opts?.sectionId ?? null);
    setFocusModalTitle(opts?.title);
    setFocusModalOpen(true);
  }, []);

  useEffect(() => {
    setMentorUser(getMentorFromCookie());
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
        const res = await apiGetAssignedUsers(String(uid));
        // const raw = res.data?.data;
        // setMentees(Array.isArray(raw) ? raw : []);
        const raw = res.data?.data;
const assigned = Array.isArray(raw) ? raw : [];

setMentees(assigned);
const attentionFlags = await Promise.all(
  assigned.map(async (pastor: any) => {
    const pastorId = String(pastor?._id ?? pastor?.id ?? "").trim();
    if (!pastorId) return false;
    return pastorNeedsReviewAttention(pastorId);
  }),
);

setReviewCenterAttentionCount(attentionFlags.filter(Boolean).length);
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
    if (!userId) {
      setScheduleList([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        let list: any[] = [];
      
        try {
  const res = await apiGetMentorSchedule(userId);
  list = unwrapAppointmentsAxiosData(res);

  if (!Array.isArray(list) || list.length === 0) {
    const fallbackRes = await apiGetMentorAppointments(userId, false);
    list = unwrapAppointmentsAxiosData(fallbackRes);
  }
} catch {
  const res = await apiGetMentorAppointments(userId, false);
  list = unwrapAppointmentsAxiosData(res);
}
        if (!cancelled) setScheduleList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to load mentor schedule:", err);
        if (!cancelled) setScheduleList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setMentorFocusSections([]);
      setFocusInitialReady(true);
      prevUserIdForFocus.current = null;
      return;
    }
    if (prevUserIdForFocus.current !== userId) {
      setFocusInitialReady(false);
      prevUserIdForFocus.current = userId;
    }
    let cancelled = false;
    setMentorFocusLoading(true);
    void loadMentorFocusSections({
      mentorId: userId,
      mentees: menteesForFocus,
      otherAppointments: scheduleList,
      todayDateOnlyISO,
    })
      .then((sections) => {
        if (!cancelled) setMentorFocusSections(sections);
      })
      .catch(() => {
        if (!cancelled) setMentorFocusSections([]);
      })
      .finally(() => {
        if (!cancelled) {
          setMentorFocusLoading(false);
          setFocusInitialReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [userId, menteesForFocus, scheduleList, todayDateOnlyISO]);

  const firstName = mentorUser?.firstName ?? mentorStatic?.firstName ?? "";
  const lastName = mentorUser?.lastName ?? mentorStatic?.lastName ?? "";
  const mentorName =
    `${firstName} ${lastName}`.trim() || "Mentor";
  const welcomeLine = `Welcome back, ${mentorName}!`;

  const blockingLoad = loading || (Boolean(userId) && !focusInitialReady);

  if (blockingLoad) {
    return (
      <div className={`${mentorPageRoot} items-center justify-center`}>
        <div className="text-center text-white">
          <div className={`mx-auto mb-4 ${mentorSpinner}`} />
          <p className="text-sm text-[#cde2f2]">Loading your dashboard…</p>
        </div>
      </div>
    );
  }
  const currentTime = new Date()
  .toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  .replace(":", " : ");

const currentDate = new Date().toLocaleDateString("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      {/* <main className="relative z-10 w-full flex-1 pb-28 pt-0 sm:pb-10"> */}
      <main className="relative z-10 w-full flex-1 pb-10 pt-0">
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8">
        {/* Hero — CCC-Mobile: greeting on hero, compact welcome card, showClockDate false */}
        {/* <section
          className={`relative overflow-hidden rounded-3xl border border-white/10 ${mentorGlassCardFrost}`}
        >
          <div className="relative min-h-[162px] sm:min-h-[200px] lg:min-h-[210px]">
            <Image
              src={HeroBg}
              alt=""
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062946] via-[#062946]/75 to-[#0a3558]/50" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/90 via-transparent to-transparent" />

            <div className="relative z-10 flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] text-white/95"
                style={{ textShadow: "0 1px 4px rgba(0,0,0,0.25)" }}
              >
                {getGreeting()}
              </p>

              <div className="flex w-full flex-col gap-2 lg:max-w-sm lg:items-end">
                <button
                  type="button"
                  onClick={() => router.push("/mentor/profile")}
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition hover:bg-white/15"
                >
                  <Image
                    src={UserProfile}
                    alt=""
                    width={48}
                    height={48}
                    className="rounded-full border-2 border-white/30"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{welcomeLine}</p>
                    <p className="mt-1 text-xs text-white/65">Tap to view your profile</p>
                  </div>
                </button>
                {/* <button
                  type="button"
                  onClick={() => router.push("/mentor/MentorProgress")}
                  className="self-stretch rounded-xl border border-white/15 bg-white/5 py-2 text-center text-xs font-semibold text-[#8ec5eb] transition hover:bg-white/10 lg:self-end lg:px-6"
                >
                  View progress
                </button> */}
              {/* </div>
            </div>
          </div>
        </section> */} 
        {/* Hero — director-style */}
<section
  className={`relative m-0 overflow-hidden rounded-none border-0 sm:rounded-3xl sm:border sm:border-white/10 ${mentorGlassCardFrost}`}
>
  {/* <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]"> */}
  <div className="relative min-h-[360px] sm:min-h-[300px] lg:min-h-[340px]">
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
          Cultivate Spiritual, Professional, Social, And Community
          <br className="hidden sm:block" />
          Engagement Developments
        </h1>
        <p className="text-sm text-white/80">{currentTime}</p>
<p className="text-xs text-white/60 sm:text-sm">{currentDate}</p>
      </div>

      {/* <button
        type="button"
        onClick={() => router.push("/mentor/profile")}
        className="mt-4 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition hover:bg-white/15 lg:mt-0 lg:w-auto"
      > */}
      <div className="mt-4 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md lg:mt-0 lg:w-auto">
        {/* <Image
          src={UserProfile}
          alt=""
          width={48}
          height={48}
          className="rounded-full border-2 border-white/30"
        /> */}
<img
  src={
    mentorUser?.profilePicture
      ? mentorUser.profilePicture
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          mentorName || "Mentor"
        )}&background=173653&color=ffffff`
  }
  alt={mentorName}
  className="h-12 w-12 rounded-full border-2 border-white/30 object-cover"
/>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {welcomeLine}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* Things to Focus On */}
        <section className="m-0">
          <div className={`p-4 sm:p-5 ${mentorGlassCardFrost}`}>
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2.5">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                  <i className="fa-solid fa-filter text-base text-[#8ec5eb]" />
                </div>
                <h2 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  Things to Focus On
                </h2>
              </div>
              <p className="pl-[42px] text-xs leading-4 text-white/70 sm:text-[12px]">
                Here are the most important things you should focus on today.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {focusTiles.map((tile) => (
                <button
                  key={tile.sectionId}
                  type="button"
                  onClick={() =>
                    openThingsToFocusModal({
                      sectionId: tile.sectionId,
                      title: tile.sheetTitle,
                    })
                  }
                  className={`flex min-h-[100px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-center sm:min-h-[120px] sm:gap-3 sm:p-4 ${innerTileHover}`}
                >
                  <i className={`${tile.icon} text-xl text-[#8ec5eb] sm:text-2xl`} />
                  <span className="text-[11px] font-medium leading-tight text-white/90 sm:text-xs">
                    <span className="block">{tile.line1}</span>
                    <span className="block">{tile.line2}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Need a Help? — mobile: Help → support/contact-information (web: profile as hub) */}
        {/* <section className="m-0">
          <div
            className={`flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2 ${mentorGlassCardFrost}`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <i className="fa-solid fa-book-open text-xs text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                  Need a Help?
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug text-white/55 sm:text-[11px]">
                  We&apos;ve got simple steps to help you move forward.
                </p>
              </div>
            </div>
            <Link
              href="/mentor/help"
              prefetch
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/15 sm:self-center"
            >
              <i className="fa-regular fa-circle-question text-[#8ec5eb]" />
              Help
            </Link>
          </div>
        </section> */}
        {/* Review Center */}
        <section className="m-0">
          <Link
            href="/mentor/review-center"
            prefetch
            className={`flex flex-col gap-3 p-2.5 transition hover:bg-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2 ${mentorGlassCardFrost}`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <i className="fa-regular fa-clipboard text-xs text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                  Review Center
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug text-white/55 sm:text-[11px]">
                  Review pastor roadmaps, assessments, and submissions.
                </p>
              </div>
            </div>

            {/* <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-emerald-300/30 bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold text-emerald-100 sm:self-center">
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-400 px-1.5 text-[10px] font-black text-[#062946]">
                0
              </span>
              <i className="fa-solid fa-chevron-right text-[10px] text-emerald-100/80" />
            </span> */}
            {/* <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center self-start rounded-lg border border-emerald-300/30 bg-emerald-400/15 text-emerald-100 sm:self-center">
  <i className="fa-solid fa-chevron-right text-sm text-emerald-100/90" />
</span> */}
<div className="relative self-end sm:self-center">
  {reviewCenterAttentionCount > 0 && (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
      {reviewCenterAttentionCount}
    </span>
  )}

  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-400/15 text-emerald-100">
    <i className="fa-solid fa-chevron-right text-sm text-emerald-100/90" />
  </span>
</div>
          </Link>
        </section>
        {/* Quick Links — same card pattern as mobile (title row + four tiles); no extra subtitle */}
        <section className="m-0">
          <div className={`p-4 sm:p-5 ${mentorGlassCardFrost}`}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <i className="fa-solid fa-map text-base text-[#8ec5eb]" />
              </div>
              <h2 className="text-base font-extrabold tracking-tight text-white sm:text-lg">Quick Links</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
              {quickLinks.map((q) => (
                <Link
                  key={q.route}
                  href={q.route}
                  prefetch
                  className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] py-6 sm:gap-3 sm:py-8 ${innerTileHover}`}
                >
                  <i className={`${q.icon} text-xl text-[#8ec5eb] sm:text-2xl`} />
                  <span className="text-center text-[11px] font-medium leading-tight text-white/90 sm:text-xs">
                    <span className="block">{q.line1}</span>
                    <span className="block">{q.line2}</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
{/* help */}
  <section className="m-0">
          <div
            className={`flex flex-col gap-3 p-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2 ${mentorGlassCardFrost}`}
          >
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                <i className="fa-solid fa-book-open text-xs text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold tracking-tight text-white sm:text-base">
                  Need a Help?
                </h3>
                <p className="mt-0.5 text-[10px] leading-snug text-white/55 sm:text-[11px]">
                  We&apos;ve got simple steps to help you move forward.
                </p>
              </div>
            </div>
            <Link
              href="/mentor/help"
              prefetch
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/15 sm:self-center"
            >
              <i className="fa-regular fa-circle-question text-[#8ec5eb]" />
              Help
            </Link>
          </div>
        </section>

        {/* Map — assigned mentees shown on preset positions */}
<section className="mt-3 pb-2">
  <div
    className={`overflow-hidden rounded-2xl border border-white/10 ${mentorGlassCardFrost}`}
    style={{ minHeight: 410 }}
  >
    <div className="relative h-[410px] w-full">
      <Image src={MapImg} alt="Assigned mentees map" fill className="object-cover" />

      {mentees.slice(0, 8).map((mentee, index) => {
       const pins = [
  { left: "18%", top: "36%" },
  { left: "36%", top: "36%" },
  { left: "54%", top: "36%" },
  { left: "72%", top: "36%" },
  { left: "24%", top: "62%" },
  { left: "42%", top: "62%" },
  { left: "60%", top: "62%" },
  { left: "78%", top: "62%" },
];

const pin = pins[index];

        const name =
          `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
          mentee.name ||
          "Mentee";

        return (
          <button
            key={mentee._id ?? mentee.id ?? index}
            type="button"
            onClick={() => router.push("/mentor/MenteesDetailed")}
            className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            style={pin}
            title={name}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#0f4a76] text-white shadow-lg">
              <i className="fa-solid fa-location-dot text-[#8ec5eb]" />
            </span>

            <span className="mt-1 max-w-[110px] truncate rounded-full bg-[#062946]/90 px-2.5 py-1 text-[11px] font-semibold text-white shadow">
              {name}
            </span>
          </button>
        );
      })}
    </div>
  </div>
</section>
        </div>
      </main>

      {/* <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#0a1220]/95 py-3 backdrop-blur-lg md:hidden"
        aria-label="Primary"
      >
        <Link href="/mentor/home" className="flex flex-col items-center gap-1 text-[#8ec5eb]">
          <i className="fa-solid fa-house text-lg" />
          <span className="text-[10px] font-medium">Dashboard</span>
        </Link>
        <Link href="/mentor/MenteesDetailed" className="flex flex-col items-center gap-1 text-white/50">
          <i className="fa-solid fa-magnifying-glass text-lg" />
          <span className="text-[10px] font-medium">Discover</span>
        </Link>
        <Link href="/mentor/profile" className="flex flex-col items-center gap-1 text-white/50">
          <i className="fa-regular fa-user text-lg" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav> */}

      <DashboardFocusModal
        open={focusModalOpen}
        onClose={() => setFocusModalOpen(false)}
        title={focusModalTitle}
        sections={displayedMentorFocusSections}
        isLoading={focusModalOpen && mentorFocusLoading}
      />

      <div className="relative z-10 mt-auto" />
    </div>
  );
}
