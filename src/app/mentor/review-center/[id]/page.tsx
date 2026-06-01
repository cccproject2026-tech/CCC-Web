"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import UserProfile from "@/app/Assets/user-profile.png";
import {
  apiGetAssignedUsers,
  apiGetMentorAppointments,
  apiGetRoadmapSubmissionActivity,
} from "@/app/Services/api";
import type { RoadmapSubmissionActivity } from "@/app/Services/roadmaps.service";
import {
  apiGetAssignedAssessments,
  apiGetUserAnswers,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import {
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

type Pastor = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  profilePicture?: string;
};

type WeeklyAssessmentSubmission = {
  assessmentId: string;
  assessmentName: string;
  submittedAt: string;
};

const isWithinCurrentWeek = (value?: string) => {
  if (!value) return false;

  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return false;

  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfNextWeek = new Date(startOfWeek);
  startOfNextWeek.setDate(startOfNextWeek.getDate() + 7);

  return submittedAt >= startOfWeek && submittedAt < startOfNextWeek;
};

const attentionItems = [
  {
    icon: "fa-regular fa-calendar-xmark",
    title: "Missed Meetings",
    count: 12,
    description: "Sessions requiring follow-up",
    tone: "border-red-300/30 bg-red-400/15 text-red-200",
  },
  {
    icon: "fa-solid fa-calendar-days",
    title: "Rescheduled Meetings",
    count: 8,
    description: "Updated meeting schedules",
    tone: "border-amber-300/30 bg-amber-400/15 text-amber-100",
  },
  {
    icon: "fa-solid fa-rotate",
    title: "Pastor Resubmitted Tasks",
    count: 0,
    description: "Tasks ready for another review",
    tone: "border-orange-300/30 bg-orange-400/15 text-orange-100",
  },
  {
    icon: "fa-solid fa-road",
    title: "New Roadmap Submissions",
    count: 0,
    description: "Roadmap items awaiting review",
    tone: "border-sky-300/30 bg-sky-400/15 text-sky-100",
  },
  {
    icon: "fa-regular fa-file-lines",
    title: "New Assessment Submissions",
    count: 17,
    description: "Assessment updates received",
    tone: "border-violet-300/30 bg-violet-400/15 text-violet-100",
  },
  {
    icon: "fa-regular fa-clock",
    title: "Today's Meetings",
    count: 42,
    description: "Sessions scheduled for today",
    tone: "border-emerald-300/30 bg-emerald-400/15 text-emerald-100",
  },
];

const recentActivities = [
  {
    icon: "fa-solid fa-rotate",
    title: "Pastor resubmitted a roadmap task",
    time: "2 hours ago",
    tone: "bg-orange-400/15 text-orange-100",
  },
  {
    icon: "fa-regular fa-file-lines",
    title: "New assessment submitted",
    time: "5 hours ago",
    tone: "bg-violet-400/15 text-violet-100",
  },
  {
    icon: "fa-regular fa-comment",
    title: "Mentor comment added",
    time: "Yesterday",
    tone: "bg-sky-400/15 text-sky-100",
  },
  {
    icon: "fa-solid fa-calendar-days",
    title: "Meeting rescheduled",
    time: "Yesterday",
    tone: "bg-amber-400/15 text-amber-100",
  },
];

const getMentorFromCookie = () => {
  const cookie = Cookies.get("mentor");
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
};

const getDisplayName = (user: Pastor | null) =>
  user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
      user.name ||
      "Pastor"
    : "Pastor";

const formatLocalDate = (date: Date) =>
  [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <section className={`p-3.5 ${mentorGlassCardFrost}`}>
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10">
          <i className={`${icon} text-xs text-[#8ec5eb]`} />
        </div>
        <h2 className="text-sm font-extrabold text-white">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "text-white",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-white/10 py-2 last:border-0">
      <span className="text-[11px] text-[#cde2f2]/70">{label}</span>
      <span className={`text-right text-[11px] font-bold ${valueClassName}`}>
        {value}
      </span>
    </div>
  );
}

export default function MentorReviewCenterDetailPage() {
  const params = useParams<{ id: string }>();
  const pastorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [pastor, setPastor] = useState<Pastor | null>(null);
  const [mentorName, setMentorName] = useState("Mentor");
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showTodayMeetings, setShowTodayMeetings] = useState(false);
  const [showMissedMeetings, setShowMissedMeetings] = useState(false);
  const [showRescheduledMeetings, setShowRescheduledMeetings] = useState(false);
  const [showWeeklyAssessments, setShowWeeklyAssessments] = useState(false);
const [showWeeklyRoadmaps, setShowWeeklyRoadmaps] = useState<
  "new" | "resubmitted" | null
>(null);
const [meetingSort, setMeetingSort] = useState<"newest" | "oldest">("newest");
const [weeklyAssessmentSubmissions, setWeeklyAssessmentSubmissions] = useState<
  WeeklyAssessmentSubmission[]
>([]);
const [weeklyRoadmaps, setWeeklyRoadmaps] = useState<RoadmapSubmissionActivity[]>([]);
  const [assessmentStats, setAssessmentStats] = useState({
  completed: 0,
  total: 0,
  pendingReview: 0,
});
const [roadmapPercent, setRoadmapPercent] = useState(0);

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;
    const loadAppointments = async () => {
  try {
    const res = await apiGetMentorAppointments(String(mentorId), false);
    const list = unwrapAppointmentsAxiosData(res);
    setAppointments(Array.isArray(list) ? list : []);
  } catch (error) {
    console.error("Failed to load mentor appointments", error);
    setAppointments([]);
  }
};

const loadProgressStats = async () => {
  try {
    const [assignedRes, progressRes] = await Promise.all([
      apiGetAssignedAssessments(String(pastorId)),
      apiGetUserProgress(String(pastorId)),
    ]);
    const assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
    const progress = unwrapProgressData(progressRes);
    // const rows = Array.isArray(progress?.assessments)
    //   ? progress.assessments
    //   : [];
    // let completed = 0;
    // let pendingReview = 0;

    // assignedRows.forEach((item) => {
    //   const flat = flattenAssignedAssessmentRow(item);
    //   if (!flat) return;

    //   const progressRow = rows.find(
    //     (row) =>
    //       String(row?.assessmentId ?? "") === flat.assessmentId ||
    //       Boolean(
    //         flat.assignmentId &&
    //           row?.assignmentId &&
    //           String(row.assignmentId) === flat.assignmentId,
    //       ),
    //   );
    //   const status = String(progressRow?.status ?? "").toLowerCase().trim();

    //   if (status === "completed" || status === "reviewed") {
    //     completed += 1;
    //   }
    //   if (status === "submitted") {
    //     pendingReview += 1;
    //   }
    // });
let completed = 0;
let pendingReview = 0;

assignedRows.forEach((item:any) => {
  const flat: any  = flattenAssignedAssessmentRow(item);
  if (!flat) return;

  const status = String(
    flat.status ??
      flat.progressStatus ??
      item?.status ??
      item?.progressStatus ??
      "",
  )
    .toLowerCase()
    .trim();

  if (status === "completed" || status === "reviewed") {
    completed += 1;
  }

  if (status === "submitted") {
    pendingReview += 1;
  }
});
    setAssessmentStats({
      completed,
      total: assignedRows.length,
      pendingReview,
    });

    const weeklySubmissions = await Promise.all(
      assignedRows.map(async (item) => {
        const flat: any = flattenAssignedAssessmentRow(item);
        if (!flat) return null;

        try {
          const answersRes = await apiGetUserAnswers(
            flat.assessmentId,
            String(pastorId),
          );
          const answerData = (answersRes.data as any)?.data;
          if (!answerData?._id) return null;

          const submittedAt =
            answerData.submittedAt ||
            answerData.createdAt ||
            answerData.updatedAt;

          if (!isWithinCurrentWeek(submittedAt)) return null;

          return {
            assessmentId: flat.assessmentId,
            assessmentName: String(
              flat.assessment?.name ??
                flat.assessment?.title ??
                flat.name ??
                "Assessment",
            ),
            submittedAt: String(submittedAt),
          };
        } catch {
          return null;
        }
      }),
    );

    setWeeklyAssessmentSubmissions(
      weeklySubmissions
        .filter((item): item is WeeklyAssessmentSubmission => Boolean(item))
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        ),
    );

    setRoadmapPercent(
      Math.min(100, Math.max(0, Number(progress?.overallRoadmapProgress ?? 0))),
    );
  } catch (error) {
    console.error("Failed to load pastor progress stats", error);
    setAssessmentStats({
      completed: 0,
      total: 0,
      pendingReview: 0,
    });
    setWeeklyAssessmentSubmissions([]);
    setRoadmapPercent(0);
  }
};

const loadRoadmapActivity = async () => {
  try {
    const today = formatLocalDate(new Date());
    const res = await apiGetRoadmapSubmissionActivity(
      String(pastorId),
      today,
      today,
    );
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    console.log("ROADMAP ACTIVITY RESPONSE", rows);
    setWeeklyRoadmaps(rows);
  } catch (error) {
    console.warn("Failed to load roadmap submission activity", error);
    setWeeklyRoadmaps([]);
  }
};
//     const loadAppointments = async () => {
//       const loadAssessmentStats = async () => {
//   try {
//     const res = await apiGetAssignedAssessments(String(pastorId));
//     const rows = parseAssignedAssessmentsListBody(res.data);

//     let completed = 0;
//     let pendingReview = 0;

//     rows.forEach((item: any) => {
//       const flat: any = flattenAssignedAssessmentRow(item);
//       if (!flat) return;

//       const status = String(
//         flat.status ??
//           flat.progressStatus ??
//           item?.status ??
//           item?.progressStatus ??
//           "",
//       )
//         .toLowerCase()
//         .trim();

//       if (status === "completed" || status === "reviewed") {
//         completed += 1;
//       }

//       if (status === "submitted") {
//         pendingReview += 1;
//       }
//     });

//     setAssessmentStats({
//       completed,
//       total: rows.length,
//       pendingReview,
//     });
//   } catch (error) {
//     console.error("Failed to load assessment stats", error);
//     setAssessmentStats({
//       completed: 0,
//       total: 0,
//       pendingReview: 0,
//     });
//   }
// };
//   try {
//     const res = await apiGetMentorAppointments(String(mentorId), false);
//     const list = unwrapAppointmentsAxiosData(res);
//     setAppointments(Array.isArray(list) ? list : []);
//   } catch (error) {
//     console.error("Failed to load mentor appointments", error);
//     setAppointments([]);
//   }
// };
    setMentorName(getDisplayName(mentor));
//     if (mentorId) {
//   void loadAppointments();
// }
if (mentorId) {
  void loadAppointments();
}

if (pastorId) {
  void loadProgressStats();
  void loadRoadmapActivity();
}
    if (!mentorId || !pastorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void apiGetAssignedUsers(String(mentorId))
      .then((res) => {
        if (cancelled) return;
        const assigned: Pastor[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const selected =
          assigned.find(
            (user) =>
              String(user._id ?? user.id ?? "") === String(pastorId),
          ) ?? null;
        setPastor(selected);
      })
      .catch((error) => {
        console.error("Failed to load selected pastor", error);
        if (!cancelled) setPastor(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pastorId]);

  if (loading) {
    return (
      <div className={`${mentorPageRoot} items-center justify-center`}>
        <div className="text-center">
          <div className={`mx-auto mb-4 ${mentorSpinner}`} />
          <p className="text-sm text-[#cde2f2]">
            Loading pastor dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!pastor) {
    return (
      <div className={mentorPageRoot}>
        <main className="relative z-10 mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 sm:px-6">
          <Link
            href="/mentor/review-center"
            className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#8ec5eb] transition hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-xs" />
            Back to Review Center
          </Link>
          <div className={`p-8 text-center ${mentorGlassCardFrost}`}>
            <i className="fa-regular fa-user mb-3 text-3xl text-white/25" />
            <p className="text-sm font-semibold text-white">Pastor not found</p>
            <p className="mt-1 text-xs text-[#cde2f2]/60">
              This pastor is not currently assigned to you.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const pastorName = getDisplayName(pastor);
  const assessmentCompleted = assessmentStats.completed;
const assessmentTotal = assessmentStats.total;
const assessmentPendingReview = assessmentStats.pendingReview;

const assessmentPercent = assessmentTotal
  ? Math.round((assessmentCompleted / assessmentTotal) * 100)
  : 0;

const assessmentCircleStyle = {
  background: `conic-gradient(#9b7cff ${assessmentPercent}%, rgba(255,255,255,0.12) 0)`,
};
  const mentor = getMentorFromCookie();
const mentorId = String(mentor?.id ?? mentor?._id ?? "");

// const pastorAppointments = appointments.filter((appointment) => {
//   const appointmentPastorId = String(
//     appointment.userId ??
//       appointment.user?._id ??
//       appointment.user?.id ??
//       "",
//   );
//   const isSameDay = (value?: string) => {
//   if (!value) return false;

//   const date = new Date(value);
//   const today = new Date();

//   return (
//     date.getFullYear() === today.getFullYear() &&
//     date.getMonth() === today.getMonth() &&
//     date.getDate() === today.getDate()
//   );
// };

// const todayMeetings = pastorAppointments
//   .filter((appointment) => isSameDay(appointment.meetingDate))
//   .sort((a, b) => getStartTime(a) - getStartTime(b));

//   const appointmentMentorId = String(
//     appointment.mentorId ??
//       appointment.mentor?._id ??
//       appointment.mentor?.id ??
//       "",
//   );

//   return appointmentPastorId === String(pastorId) && appointmentMentorId === mentorId;
// });
// const now = Date.now();

// const getStatus = (appointment: any) =>
//   String(appointment.status ?? "").toLowerCase();

// const getStartTime = (appointment: any) =>
//   new Date(appointment.meetingDate ?? "").getTime();
const now = Date.now();

const getStatus = (appointment: any) =>
  String(appointment.status ?? "").toLowerCase();

const getStartTime = (appointment: any) =>
  new Date(appointment.meetingDate ?? "").getTime();

const getEndTime = (appointment: any) =>
  new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();

const pastorAppointments = appointments.filter((appointment) => {
  const appointmentPastorId = String(
    appointment.userId ??
      appointment.user?._id ??
      appointment.user?.id ??
      "",
  );

  const appointmentMentorId = String(
    appointment.mentorId ??
      appointment.mentor?._id ??
      appointment.mentor?.id ??
      "",
  );

  return appointmentPastorId === String(pastorId) && appointmentMentorId === mentorId;
});

const isSameDay = (value?: string) => {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
};

const todayMeetings = pastorAppointments
  .filter((appointment) => isSameDay(appointment.meetingDate))
  .sort((a, b) => getStartTime(a) - getStartTime(b));

const missedMeetings = pastorAppointments
  .filter((appointment) => getStatus(appointment) === "missed")
  .sort((a, b) => getStartTime(b) - getStartTime(a));

const rescheduledMeetings = pastorAppointments
  .filter((appointment) => getStatus(appointment) === "rescheduled")
  .sort((a, b) => getStartTime(b) - getStartTime(a));

const newRoadmapSubmissions = weeklyRoadmaps.filter(
  (activity) => activity.isResubmission === false,
);
const pastorResubmittedTasks = weeklyRoadmaps.filter(
  (activity) => activity.isResubmission === true,
);
const newSubmissionCount = newRoadmapSubmissions.length;
const resubmittedCount = pastorResubmittedTasks.length;

if (
  pastorAppointments.length > 0 &&
  missedMeetings.length === 0 &&
  rescheduledMeetings.length === 0
) {
  console.log(
    "Review Center appointment statuses:",
    [...new Set(pastorAppointments.map((appointment) => String(appointment.status)))],
  );
}

// const getEndTime = (appointment: any) =>
//   new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();

const isPastOrFinished = (appointment: any) => {
  const status = getStatus(appointment);
  const end = getEndTime(appointment);

  return (
    status === "completed" ||
    status === "missed" ||
    status === "cancelled" ||
    (Number.isFinite(end) && end < now)
  );
};

const endedAppointments = pastorAppointments
  .filter(isPastOrFinished)
  .sort((a, b) => getEndTime(b) - getEndTime(a));

const ongoingAppointment =
  pastorAppointments.find((appointment) => {
    const status = getStatus(appointment);
    const start = getStartTime(appointment);
    const end = getEndTime(appointment);

    if (["completed", "missed", "cancelled"].includes(status)) return false;

    return (
      Number.isFinite(start) &&
      Number.isFinite(end) &&
      start <= now &&
      now < end
    );
  }) ?? null;

const futureAppointments = pastorAppointments
  .filter((appointment) => {
    const status = getStatus(appointment);
    const start = getStartTime(appointment);

    if (["completed", "missed", "cancelled"].includes(status)) return false;

    return Number.isFinite(start) && start > now;
  })
  .sort((a, b) => getStartTime(a) - getStartTime(b));

const lastMeeting = endedAppointments[0] ?? null;
const nextMeeting = ongoingAppointment ?? futureAppointments[0] ?? null;
const isNextMeetingOngoing = Boolean(ongoingAppointment);
// const now = Date.now();

// // const completedAppointments = pastorAppointments
// //   .filter((appointment) => {
// //     const status = String(appointment.status ?? "").toLowerCase();
// //     const end = new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();
// //     return status === "completed" || end < now;
// //   })
// const completedAppointments = pastorAppointments
//   .filter((appointment) => {
//     const end = new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();
//     return Number.isFinite(end) && end < now;
//   })
//   .sort(
//     (a, b) =>
//       new Date(b.endTime ?? b.meetingDate ?? "").getTime() -
//       new Date(a.endTime ?? a.meetingDate ?? "").getTime(),
//   );

// // const upcomingAppointments = pastorAppointments
// //   .filter((appointment) => {
// //     const status = String(appointment.status ?? "").toLowerCase();
// //     const start = new Date(appointment.meetingDate ?? "").getTime();
// //     return status !== "completed" && start >= now;
// //   })
// const upcomingAppointments = pastorAppointments
//   .filter((appointment) => {
//     const start = new Date(appointment.meetingDate ?? "").getTime();
//     return Number.isFinite(start) && start > now;
//   })
//   .sort(
//     (a, b) =>
//       new Date(a.meetingDate ?? "").getTime() -
//       new Date(b.meetingDate ?? "").getTime(),
//   );
//   const ongoingAppointment =
//   pastorAppointments.find((appointment) => {
//     const start = new Date(appointment.meetingDate ?? "").getTime();
//     const end = new Date(appointment.endTime ?? appointment.meetingDate ?? "").getTime();

//     return Number.isFinite(start) && Number.isFinite(end) && start <= now && end >= now;
//   }) ?? null;

// const lastMeeting = completedAppointments[0] ?? null;
// const nextMeeting = upcomingAppointments[0] ?? null;

const formatMeetingDate = (value?: string) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNextMeetingMain = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);
  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) return "Today";

  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatMeetingTime = (value?: string) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};
const formatRelativeDays = (value?: string) => {
  if (!value) return "N/A";
  const diff = now - new Date(value).getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
};

// const daysUntil = (value?: string) => {
//   if (!value) return "N/A";
//   const diff = new Date(value).getTime() - now;
//   const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
//   if (days === 0) return "Today";
//   if (days === 1) return "In 1 day";
//   return `In ${days} days`;
// };
const daysUntil = (value?: string) => {
  if (!value) return "N/A";

  const target = new Date(value);
  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const startOfTarget = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const days = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  if (days === 0) return "Today";
  if (days === 1) return "In 1 day";

  return `In ${days} days`;
};

const renderMeetingModal = ({
  title,
  description,
  meetings,
  emptyText,
  onClose,
}: {
  title: string;
  description: string;
  meetings: any[];
  emptyText: string;
  onClose: () => void;
}) => {
  const sortedMeetings = [...meetings].sort((a, b) => {
    const diff = getStartTime(a) - getStartTime(b);
    return meetingSort === "oldest" ? diff : -diff;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-white">{title}</h3>
            <p className="text-xs text-[#cde2f2]/65">{description}</p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={meetingSort}
              onChange={(e) =>
                setMeetingSort(e.target.value as "newest" | "oldest")
              }
              className="h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-bold text-white outline-none [&>option]:bg-[#061f35]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
        </div>

        <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
          {sortedMeetings.length > 0 ? (
            sortedMeetings.map((meeting) => (
              <Link
                key={meeting._id ?? meeting.id}
                href={`/mentor/MentorSchedule/${meeting._id ?? meeting.id}`}
                className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-white">
                      {pastorName}
                    </p>
                    <p className="text-xs text-[#cde2f2]/65">Pastor</p>
                  </div>

                  <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                    {String(meeting.status ?? "Scheduled")}
                  </span>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-[#cde2f2]/55">Date</p>
                    <p className="text-xs font-bold text-white">
                      {formatMeetingDate(meeting.meetingDate)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                    <p className="text-[10px] text-[#cde2f2]/55">Time</p>
                    <p className="text-xs font-bold text-white">
                      {formatMeetingTime(meeting.meetingDate)} -{" "}
                      {formatMeetingTime(meeting.endTime)}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-xs font-semibold text-[#8ec5eb]">
                  Mode: {meeting.mode ?? meeting.platform ?? "N/A"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
              <p className="text-sm font-semibold text-white">{emptyText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const roadmapModalItems =
  showWeeklyRoadmaps === "resubmitted"
    ? pastorResubmittedTasks
    : newRoadmapSubmissions;

const roadmapModalTitle =
  showWeeklyRoadmaps === "resubmitted"
    ? "Pastor Resubmitted Tasks"
    : "New Roadmap Submissions";

// const renderMeetingModal = ({
//   title,
//   description,
//   meetings,
//   emptyText,
//   onClose,
// }: {
//   title: string;
//   description: string;
//   meetings: any[];
//   emptyText: string;
//   onClose: () => void;
// }) => (
  
//   <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
//     <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
//       <div className="mb-4 flex items-center justify-between gap-3">
//         <div>
//           <h3 className="text-lg font-extrabold text-white">{title}</h3>
//           <p className="text-xs text-[#cde2f2]/65">{description}</p>
//         </div>
//         <button
//           type="button"
//           onClick={onClose}
//           className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
//         >
//           <i className="fa-solid fa-xmark" />
//         </button>
//       </div>

//       <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
//         {meetings.length > 0 ? (
//           meetings.map((meeting) => (
//             <Link
//               key={meeting._id ?? meeting.id}
//               href={`/mentor/MentorSchedule/${meeting._id ?? meeting.id}`}
//               className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
//             >
//               <div className="flex items-start justify-between gap-3">
//                 <div>
//                   <p className="text-sm font-extrabold text-white">{pastorName}</p>
//                   <p className="text-xs text-[#cde2f2]/65">Pastor</p>
//                 </div>
//                 <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
//                   {String(meeting.status ?? "Scheduled")}
//                 </span>
//               </div>

//               <div className="mt-3 grid gap-2 sm:grid-cols-2">
//                 <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
//                   <p className="text-[10px] text-[#cde2f2]/55">Date</p>
//                   <p className="text-xs font-bold text-white">
//                     {formatMeetingDate(meeting.meetingDate)}
//                   </p>
//                 </div>
//                 <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
//                   <p className="text-[10px] text-[#cde2f2]/55">Time</p>
//                   <p className="text-xs font-bold text-white">
//                     {formatMeetingTime(meeting.meetingDate)} -{" "}
//                     {formatMeetingTime(meeting.endTime)}
//                   </p>
//                 </div>
//               </div>

//               <p className="mt-3 text-xs font-semibold text-[#8ec5eb]">
//                 Mode: {meeting.mode ?? meeting.platform ?? "N/A"}
//               </p>
//             </Link>
//           ))
//         ) : (
//           <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
//             <p className="text-sm font-semibold text-white">{emptyText}</p>
//           </div>
//         )}
//       </div>
//     </div>
//   </div>
// );


  return (
    <div className={mentorPageRoot}>
      <main className="relative z-10 mx-auto w-full max-w-[1180px] flex-1 px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center gap-3">
          <Link
            href="/mentor/review-center"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-white sm:text-2xl">
              Review Center
            </h1>
            <p className="mt-0.5 text-xs text-[#cde2f2]/65">
              Key activities and updates for this pastor
            </p>
          </div>
        </header>

        <section className={`mb-5 overflow-hidden ${mentorGlassCardFrost}`}>
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            <div className="flex min-w-0 items-center gap-3 p-4 lg:w-[235px] lg:shrink-0">
              <Image
                src={pastor.profilePicture || UserProfile}
                alt={pastorName}
                width={62}
                height={62}
                unoptimized={Boolean(pastor.profilePicture)}
                className="h-[62px] w-[62px] rounded-full border-2 border-white/20 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-base font-extrabold text-white">
                  {pastorName}
                </p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8ec5eb]">
                  Pastor
                </p>
                {/* <p className="mt-1.5 text-[11px] text-[#cde2f2]/65">
                  Current Mentor:{" "}
                  <span className="font-semibold text-white/90">
                    {mentorName}
                  </span>
                </p> */}
                <p className="mt-1.5 text-[11px] text-[#cde2f2]/65">
  Current Mentor:{" "}
  <Link
    href="/mentor/profile"
    className="font-semibold text-white/90 underline-offset-2 transition hover:text-[#8ec5eb] hover:underline"
  >
    {mentorName}
  </Link>
</p>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-2 border-t border-white/10 sm:grid-cols-5 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2 border-b border-r border-white/10 p-3 sm:border-b-0">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#3498DB ${roadmapPercent}%, rgba(255,255,255,0.12) 0)`,
                  }}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a2945] text-[11px] font-black text-white">
                    {Math.round(roadmapPercent)}%
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-[#cde2f2]/65">
                    Roadmap Progress
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-200">
                    On Track
                  </p>
                </div>
              </div>
              {/* <div className="border-b border-r border-white/10 p-3 sm:border-b-0">
                <p className="text-[11px] text-[#cde2f2]/65">
                  Assessments Completed
                </p>
                <p className="mt-2 text-lg font-black text-white">4/6</p>
                <p className="text-xs font-bold text-amber-100">
                  2 Pending Review
                </p>
              </div> */}
              <Link
  href={`/mentor/MentorAssessments?menteeId=${encodeURIComponent(String(pastorId))}`}
  className="flex flex-col items-center justify-center border-b border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05] sm:border-b-0"
>
  <p className="text-[11px] text-[#cde2f2]/65">
    Assessments Completed
  </p>

  <span
    className="mt-2 flex h-12 w-12 items-center justify-center rounded-full"
    style={assessmentCircleStyle}
  >
    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0a2945] text-[11px] font-black text-white">
      {assessmentCompleted}/{assessmentTotal || 0}
    </span>
  </span>

  <p className="mt-2 text-xs font-bold text-amber-100">
    {assessmentPendingReview} Pending Review
  </p>
</Link>
              {/* <div className="border-b border-r border-white/10 p-3 sm:border-b-0">
                <p className="text-[11px] text-[#cde2f2]/65">Last Meeting</p>
                <p className="mt-2 text-sm font-black text-white">12 days ago</p>
                <p className="text-xs font-bold text-red-200">Overdue</p>
              </div> */}
              <Link
  href={
  lastMeeting
    ? `/mentor/MentorSchedule/${lastMeeting._id ?? lastMeeting.id}`
    : "#"
}
  className="flex flex-col items-center justify-center border-b border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05] sm:border-b-0"
>
  <p className="text-[11px] text-[#cde2f2]/65">Last Meeting</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-400/15 text-[#8ec5eb]">
    <i className="fa-regular fa-calendar-check text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">
    {lastMeeting ? formatNextMeetingMain(lastMeeting.meetingDate) : "N/A"}
  </p>
  <p className="text-xs font-bold text-red-200">
    {lastMeeting
  ? `${formatMeetingTime(lastMeeting.meetingDate)} · Finished`
  : "No finished meeting"}
  </p>
</Link>
              {/* <div className="border-r border-white/10 p-3">
                <p className="text-[11px] text-[#cde2f2]/65">Next Meeting</p>
                <p className="mt-2 text-sm font-black text-white">
                  May 31, 2026
                </p>
                <p className="text-xs font-bold text-sky-100">In 3 days</p>
              </div> */}
              <Link
  href={
  nextMeeting
    ? `/mentor/MentorSchedule/${nextMeeting._id ?? nextMeeting.id}`
    : "#"
}
  className="flex flex-col items-center justify-center border-r border-white/10 p-3 text-center transition hover:bg-white/[0.05]"
>
  <p className="text-[11px] text-[#cde2f2]/65">Next Meeting</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
    <i className="fa-regular fa-calendar-plus text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">
    {nextMeeting
  ? isNextMeetingOngoing
    ? "Ongoing now"
    : formatNextMeetingMain(nextMeeting.meetingDate)
  : "N/A"}
  </p>
  <p className="text-xs font-bold text-sky-100">
   {/* {nextMeeting
  ? `${daysUntil(nextMeeting.meetingDate)} · ${formatMeetingTime(nextMeeting.meetingDate)}`
  : "No upcoming meeting"} */}
  {nextMeeting
  ? isNextMeetingOngoing
    ? `${formatMeetingTime(nextMeeting.meetingDate)} – ${formatMeetingTime(nextMeeting.endTime)}`
    : `${daysUntil(nextMeeting.meetingDate)} · ${formatMeetingTime(nextMeeting.meetingDate)}`
  : "No upcoming meeting"}
  </p>
</Link>
             <div className="flex flex-col items-center justify-center p-3 text-center">
  <p className="text-[11px] text-[#cde2f2]/65">Last Login</p>
  <span className="mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-200">
    <i className="fa-regular fa-user text-sm" />
  </span>
  <p className="mt-2 text-sm font-black text-white">N/A</p>
  <p className="text-xs font-bold text-[#cde2f2]/70">No login data</p>
</div>
            </div>
          </div>
        </section>

        <section className="mb-5">
          <h2 className="mb-3 text-sm font-extrabold uppercase tracking-[0.16em] text-[#cde2f2]/75">
            Attention Required
          </h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {attentionItems.map((item) => (
              // <button
              //   key={item.title}
              //   type="button"
              //   className={`relative flex min-h-[132px] flex-col items-start p-3 text-left ${mentorGlassCardFrost}`}
              // >
              <button
  key={item.title}
  type="button"
  onClick={() => {
    if (item.title === "Missed Meetings") setShowMissedMeetings(true);
    if (item.title === "Rescheduled Meetings") {
      setShowRescheduledMeetings(true);
    }
    if (item.title === "Pastor Resubmitted Tasks") {
      setShowWeeklyRoadmaps("resubmitted");
    }
    if (item.title === "New Roadmap Submissions") {
      setShowWeeklyRoadmaps("new");
    }
    if (item.title === "Today's Meetings") setShowTodayMeetings(true);
    if (item.title === "New Assessment Submissions") {
      setShowWeeklyAssessments(true);
    }
  }}
  className={`relative flex min-h-[132px] flex-col items-start p-3 text-left ${mentorGlassCardFrost}`}
>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${item.tone}`}
                >
                  <i className={`${item.icon} text-base`} />
                </span>
                <span className="mt-2 min-w-0 pr-3">
                  <span className="block text-xl font-black leading-none text-white">
                    {/* {item.count} */}
                    {item.title === "Missed Meetings"
                      ? missedMeetings.length
                      : item.title === "Rescheduled Meetings"
                        ? rescheduledMeetings.length
                        : item.title === "Pastor Resubmitted Tasks"
                          ? resubmittedCount
                          : item.title === "New Roadmap Submissions"
                            ? newSubmissionCount
                            : item.title === "Today's Meetings"
                              ? todayMeetings.length
                              : item.title === "New Assessment Submissions"
                                ? weeklyAssessmentSubmissions.length
                                : item.count}
                  </span>
                  <span className="mt-1.5 block text-[11px] font-bold leading-tight text-white">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-[10px] leading-tight text-[#cde2f2]/60">
                    {item.description}
                  </span>
                </span>
                <i className="fa-solid fa-chevron-right absolute bottom-3 right-3 text-[10px] text-[#cde2f2]/45" />
              </button>
            ))}
          </div>
        </section>

        <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Panel title="Mentorship Sessions" icon="fa-regular fa-calendar">
  <DetailRow label="Last Session" value="12 days ago" />
  <DetailRow label="Next Session" value="May 31, 2026" />
  <DetailRow label="Sessions Completed" value="7/12" />
  <DetailRow
    label="Status"
    value="On Track"
    valueClassName="text-emerald-200"
  />

  <button
    type="button"
    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
  >
    View sessions
    <i className="fa-solid fa-arrow-right text-[10px]" />
  </button>
</Panel>
          <Panel title="Roadmap Progress" icon="fa-solid fa-road">
            <DetailRow
              label="Jump Start Roadmap"
              value="80%"
              valueClassName="text-emerald-200"
            />
            <DetailRow
              label="Self Revitalization"
              value="45%"
              valueClassName="text-amber-100"
            />
            <DetailRow
              label="Church Empowerment"
              value="Not Started"
              valueClassName="text-[#cde2f2]/70"
            />
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
            >
              View roadmap
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </Panel>
          <Panel title="Assessment Status" icon="fa-regular fa-file-lines">
  <DetailRow
    label="Church Assessment"
    value="Completed"
    valueClassName="text-emerald-200"
  />
  <DetailRow
    label="Pastor Assessment"
    value="Submitted / Waiting Review"
    valueClassName="text-amber-100"
  />
  <DetailRow
    label="Mentor Assessment"
    value="Pending"
    valueClassName="text-red-200"
  />

  <button
    type="button"
    className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
  >
    View assessments
    <i className="fa-solid fa-arrow-right text-[10px]" />
  </button>
</Panel>
          <Panel
            title="Queries and Comments"
            icon="fa-regular fa-comments"
          >
            <DetailRow label="Queries Open" value="3" />
            <DetailRow label="Unread Notes" value="2" />
            <DetailRow label="Mentor Comments" value="4" />
            <DetailRow label="Announcements" value="1" />
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#8ec5eb] transition hover:text-white"
            >
              View all messages
              <i className="fa-solid fa-arrow-right text-[10px]" />
            </button>
          </Panel>
        </div>

        <Panel title="Recent Activity" icon="fa-solid fa-clock-rotate-left">
          <div className="space-y-1">
            {recentActivities.map((activity) => (
              <div
                key={activity.title}
                className="flex items-center gap-3 border-b border-white/10 py-3 last:border-0"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activity.tone}`}
                >
                  <i className={`${activity.icon} text-sm`} />
                </span>
                <p className="min-w-0 flex-1 text-xs font-semibold text-white/90">
                  {activity.title}
                </p>
                <span className="shrink-0 text-[11px] text-[#cde2f2]/55">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </Panel>
{showTodayMeetings && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
    <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-white">
            Today’s Meetings
          </h3>
          <p className="text-xs text-[#cde2f2]/65">
            {todayMeetings.length} meeting(s) scheduled today
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTodayMeetings(false)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {todayMeetings.length > 0 ? (
          todayMeetings.map((meeting) => (
            <Link
              key={meeting._id ?? meeting.id}
              href={`/mentor/MentorSchedule/${meeting._id ?? meeting.id}`}
              className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-extrabold text-white">
                    {pastorName}
                  </p>
                  <p className="text-xs text-[#cde2f2]/65">Pastor</p>
                </div>

                <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                  {String(meeting.status ?? "Scheduled")}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-[#cde2f2]/55">Date</p>
                  <p className="text-xs font-bold text-white">
                    {formatMeetingDate(meeting.meetingDate)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                  <p className="text-[10px] text-[#cde2f2]/55">Time</p>
                  <p className="text-xs font-bold text-white">
                    {formatMeetingTime(meeting.meetingDate)} –{" "}
                    {formatMeetingTime(meeting.endTime)}
                  </p>
                </div>
              </div>

              <p className="mt-3 text-xs font-semibold text-[#8ec5eb]">
                Mode: {meeting.mode ?? meeting.platform ?? "N/A"}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
            <p className="text-sm font-semibold text-white">
              No meetings today
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)}
        {showMissedMeetings &&
          renderMeetingModal({
            title: "Missed Meetings",
            description: `${missedMeetings.length} missed meeting(s)`,
            meetings: missedMeetings,
            emptyText: "No missed meetings",
            onClose: () => setShowMissedMeetings(false),
          })}
        {showRescheduledMeetings &&
          renderMeetingModal({
            title: "Rescheduled Meetings",
            description: `${rescheduledMeetings.length} rescheduled meeting(s)`,
            meetings: rescheduledMeetings,
            emptyText: "No rescheduled meetings",
            onClose: () => setShowRescheduledMeetings(false),
          })}
        {showWeeklyRoadmaps && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    {roadmapModalTitle}
                  </h3>
                  <p className="text-xs text-[#cde2f2]/65">
                    {roadmapModalItems.length} submission(s) today
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWeeklyRoadmaps(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
                {roadmapModalItems.length > 0 ? (
                  roadmapModalItems.map((activity, index) => (
                    // <div
                    //   key={`${activity.submissionId ?? activity.roadMapId}-${index}`}
                    //   className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                    // >
                    <Link
  key={`${activity.submissionId ?? activity.roadMapId}-${index}`}
  href={`/mentor/RevitalizationRoadmap/task?userId=${encodeURIComponent(
    String(pastorId),
  )}&roadmapId=${encodeURIComponent(
    activity.roadMapId,
  )}${
    activity.nestedRoadMapItemId
      ? `&taskId=${encodeURIComponent(activity.nestedRoadMapItemId)}`
      : ""
  }`}
  className="block rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:bg-white/[0.08]"
>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          {/* <p className="text-sm font-extrabold text-white">
                            {activity.taskName || "Roadmap Task"}
                          </p>
                          <p className="mt-1 text-xs text-[#cde2f2]/65">
                            {activity.parentRoadmapName || "Roadmap"}
                          </p> */}
                          <p className="text-sm font-extrabold text-white">
  {activity.taskName || "Roadmap Task"}
</p>
<p className="mt-1 text-xs text-[#cde2f2]/65">
  Parent roadmap: {activity.parentRoadmapName || "Roadmap"}
</p>
{activity.nestedRoadMapItemId ? (
  <p className="mt-1 text-[11px] font-semibold text-[#8ec5eb]">
    Nested task
  </p>
) : null}
                        </div>
                        <span className="rounded-lg border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase text-amber-100">
                          {activity.status || "Submitted"}
                        </span>
                      </div>

                      <div className="mt-3 text-xs text-[#cde2f2]/75">
                        <p>Submission #{activity.submissionNumber ?? "N/A"}</p>
                        <p className="mt-1">
                          Submitted:{" "}
                          {activity.submittedAt
                            ? new Date(activity.submittedAt).toLocaleString()
                            : "N/A"}
                        </p>
                        {activity.resubmittedAt ? (
                          <p className="mt-1">
                            Resubmitted:{" "}
                            {new Date(activity.resubmittedAt).toLocaleString()}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      No roadmap submissions today
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {showWeeklyAssessments && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className={`w-full max-w-xl p-5 ${mentorGlassCardFrost}`}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    New Assessment Submissions
                  </h3>
                  <p className="text-xs text-[#cde2f2]/65">
                    {weeklyAssessmentSubmissions.length} submission(s) this week
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWeeklyAssessments(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="max-h-[224px] space-y-3 overflow-y-auto pr-1">
                {weeklyAssessmentSubmissions.length > 0 ? (
                  weeklyAssessmentSubmissions.map((submission) => (
                    <div
                      key={submission.assessmentId}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] p-4"
                    >
                      <p className="text-sm font-extrabold text-white">
                        {submission.assessmentName}
                      </p>
                      <p className="mt-1 text-xs text-[#cde2f2]/65">
                        Submitted{" "}
                        {new Date(submission.submittedAt).toLocaleDateString(
                          undefined,
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </p>
                      <Link
                        href={`/mentor/MentorAssessments/result?assessmentId=${encodeURIComponent(
                          submission.assessmentId,
                        )}&userId=${encodeURIComponent(String(pastorId))}`}
                        className="mt-3 inline-flex text-xs font-bold text-[#8ec5eb] transition hover:text-white"
                      >
                        View Result
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-sm font-semibold text-white">
                      No assessment submissions this week
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
