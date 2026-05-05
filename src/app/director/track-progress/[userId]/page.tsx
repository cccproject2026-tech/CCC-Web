"use client";
import { useState, useEffect } from "react";
import { getCookie } from "@/app/utils/cookies";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import DirectorHero from "../../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../../directorUi";
import ProgressBg from "../../../Assets/progress-bg.jpg";
import Card1 from "../../../Assets/card1.png";
import Card2 from "../../../Assets/card2.png";
import Card3 from "../../../Assets/card3.png";
import Card4 from "../../../Assets/card4.png";
import {
  apiAddFinalComment,
  apiGetUserProgress,
  apiMarkProgramComplete,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import { apiGetUserById, apiInviteFieldMentor, unwrapUserResponse } from "@/app/Services/users.service";
import type {
  ProgressAssessment,
  ProgressResponse,
  ProgressRoadmap,
  UserResponse,
} from "@/app/Services/types";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RoadmapCardProps {
  image: any;
  title: string;
  description: string;
  status: "Completed" | "In-progress" | "Not Started" | "Over Due";
  completedDate?: string;
  tasksCompleted?: string; // e.g., "06/08"
  completionTime?: string; // e.g., "Months 1-2"
}

function RoadmapProgressCard({
  image,
  title,
  description,
  status,
  completedDate,
  tasksCompleted,
  completionTime,
}: RoadmapCardProps) {
  const getStatusBadgeStyle = () => {
    switch (status) {
      case "Completed":
        return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
      case "In-progress":
        return "border-amber-400/40 bg-amber-500/15 text-amber-100";
      case "Not Started":
        return "border-[#8ec5eb]/35 bg-[#8ec5eb]/10 text-[#cde9f7]";
      case "Over Due":
        return "border-red-400/40 bg-red-500/15 text-red-100";
      default:
        return "border-white/20 bg-white/10 text-white/80";
    }
  };

  const taskPct =
    tasksCompleted && tasksCompleted.includes("/")
      ? (() => {
          const [a, b] = tasksCompleted.split("/").map((x) => parseInt(x, 10));
          if (!b || Number.isNaN(a) || Number.isNaN(b)) return 0;
          return Math.min(100, Math.round((a / b) * 100));
        })()
      : 0;

  return (
    <div className={`flex overflow-hidden rounded-2xl border border-white/12 ${directorGlassCard}`}>
      <div className="relative w-1/3 shrink-0">
        <Image src={image} alt={title} width={200} height={200} className="h-full w-full object-cover" />
        {status === "Completed" && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/80" />
              <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-emerald-500">
                <i className="fa-solid fa-check text-sm font-bold text-white"></i>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mb-4 text-sm text-white/65">{description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold ${getStatusBadgeStyle()}`}>
            Status: {status}
          </span>
          {status === "Completed" && completedDate && (
            <span className="text-xs text-white/70">Completed on: {completedDate}</span>
          )}
          {tasksCompleted && (
            <div className="flex flex-col gap-1">
              <div className="h-2 w-full rounded-full bg-white/15">
                <div className="h-2 rounded-full bg-[#8ec5eb]/80" style={{ width: `${taskPct}%` }} />
              </div>
              <span className="text-xs text-white/55">Tasks: {tasksCompleted}</span>
            </div>
          )}
          {completionTime && <span className="text-xs text-white/70">Completion time: {completionTime}</span>}
        </div>
      </div>
    </div>
  );
}

interface SurveyCardProps {
  image: any;
  title: string;
  description: string;
  status: "Completed" | "Remaining";
  submittedDate?: string;
  dueDate?: string;
  onButtonClick?: () => void;
}

function SurveyProgressCard({
  image,
  title,
  description,
  status,
  submittedDate,
  dueDate,
  onButtonClick,
}: SurveyCardProps) {
  return (
    <div className={`flex overflow-hidden rounded-2xl border border-white/12 ${directorGlassCard}`}>
      <div className="relative w-1/3 shrink-0">
        <Image src={image} alt={title} width={200} height={200} className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mb-4 text-sm text-white/65">{description}</p>
        </div>
        <div className="flex flex-col gap-3">
          {status === "Completed" && (
            <button
              type="button"
              onClick={onButtonClick}
              className="w-fit rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
            >
              Customized development plans
            </button>
          )}
          <span className="text-xs text-white/55">
            {status === "Completed" ? `Submitted: ${submittedDate}` : `Due: ${dueDate}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function mapRoadmapStatus(rm: ProgressRoadmap): RoadmapCardProps["status"] {
  const s = (rm.status || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "completed" || s === "complete") return "Completed";
  if (s === "overdue" || s === "over_due") return "Over Due";
  if (s === "in_progress" || s === "in-progress" || s === "inprogress") return "In-progress";
  return "Not Started";
}

function mapAssessmentStatus(as: ProgressAssessment): SurveyCardProps["status"] {
  const s = (as.status || "").toLowerCase();
  if (s === "completed" || s === "complete") return "Completed";
  return "Remaining";
}

export default function IndividualProgressPage() {
  const params = useParams();
  const rawId = params?.userId;
  const userId =
    typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0] ?? "") : "";
  const [isFinalCommentsModalOpen, setIsFinalCommentsModalOpen] = useState(false);
  const [isInviteFieldMentorModalOpen, setIsInviteFieldMentorModalOpen] = useState(false);
  const [finalComments, setFinalComments] = useState("");
  const [hasComments, setHasComments] = useState(false);
  const [isMarkingProgramComplete, setIsMarkingProgramComplete] = useState(false);
  const [isInvitingFieldMentor, setIsInvitingFieldMentor] = useState(false);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [roadmapFilter, setRoadmapFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [surveyFilter, setSurveyFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "—";
  const isCompleted = progressData?.overallCompleted ?? false;
  const [directorId, setDirectorId] = useState<string>("");

  useEffect(() => {
    const storedUserId = getCookie("userId");
    setDirectorId(storedUserId as string);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([apiGetUserById(userId), apiGetUserProgress(userId)])
      .then(([userRes, progressRes]) => {
        setUser(unwrapUserResponse(userRes));
        setProgressData(unwrapUserProgressDetail(progressRes));
      })
      .catch((e) => {
        console.error(e);
        setLoadError("Could not load this user’s progress.");
        setUser(null);
        setProgressData(null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (progressData?.finalComments?.length) {
      setHasComments(true);
      setFinalComments(progressData.finalComments[0].comment);
    }
  }, [progressData]);

  const handleSubmitComments = async () => {
    if (!finalComments.trim()) return;


    try {
      await apiAddFinalComment({
        userId,
        commentorId: directorId,
        comment: finalComments,
      });


      // Fetch latest progress after save
      const progressRes = await apiGetUserProgress(userId);
      setProgressData(unwrapUserProgressDetail(progressRes));


      setHasComments(true);
    } catch (error) {
      console.error("Failed to add final comment", error);
    }
  };

  const handleMarkAsCompleted = async () => {
    if (!userId) return;
    try {
      setIsMarkingProgramComplete(true);
      setCompletionMessage(null);
      setInviteMessage(null);
      await apiMarkProgramComplete(userId);

      // Fetch latest progress after marking complete
      const progressRes = await apiGetUserProgress(userId);
      setProgressData(unwrapUserProgressDetail(progressRes));

      setIsFinalCommentsModalOpen(false);
      setCompletionMessage("Programme marked as completed.");
      if (user?.email && directorId) {
        setIsInviteFieldMentorModalOpen(true);
      } else {
        setInviteMessage("Programme completed, but the field mentor invitation cannot be sent because the pastor email or director session is missing.");
      }
    } catch (error) {
      console.error("Failed to mark program as completed", error);
      setCompletionMessage("Failed to mark programme as completed.");
    } finally {
      setIsMarkingProgramComplete(false);
    }
  };

  const handleInviteAsFieldMentor = async () => {
    if (!user?.email) {
      setInviteMessage("Pastor email is missing. Unable to send the field mentor invitation.");
      return;
    }
    if (!directorId) {
      setInviteMessage("Director session is missing. Sign in again and retry the invitation.");
      return;
    }

    try {
      setIsInvitingFieldMentor(true);
      setInviteMessage(null);
      await apiInviteFieldMentor({
        email: user.email,
        invitedBy: directorId,
      });

      setIsInviteFieldMentorModalOpen(false);
      setInviteMessage("Field mentor invitation sent successfully.");
      const userRes = await apiGetUserById(userId);
      setUser(unwrapUserResponse(userRes));
    } catch (error) {
      console.error("Failed to invite as field mentor", error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setInviteMessage(typeof message === "string" ? message : "Failed to send the field mentor invitation.");
    } finally {
      setIsInvitingFieldMentor(false);
    }
  };

  const roadmapCards =
    progressData?.roadmaps?.map((rm) => ({
      id: rm.roadMapId,
      image: Card1,
      title: "Roadmap",
      description: "Revitalization roadmap",
      status: mapRoadmapStatus(rm),
      tasksCompleted: rm.totalSteps > 0 ? `${rm.completedSteps}/${rm.totalSteps}` : undefined,
    })) ?? [];

  const surveyCards =
    progressData?.assessments?.map((as) => ({
      id: as.assessmentId,
      image: Card2,
      title: "Assessment",
      description: "Assessment progress",
      status: mapAssessmentStatus(as),
      submittedDate: mapAssessmentStatus(as) === "Completed" ? "Submitted" : undefined,
      dueDate: mapAssessmentStatus(as) === "Remaining" ? "Pending" : undefined,
    })) ?? [];

  const roadmapPct =
    progressData && progressData.totalRoadmaps > 0
      ? Math.round((progressData.completedRoadmaps / progressData.totalRoadmaps) * 100)
      : 0;

  const progress = {
    completed: progressData?.overallProgress ?? 0,
    remaining: 100 - (progressData?.overallProgress ?? 0),
  };

  // Donut Chart Data
  const donutChartData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [progress.completed, progress.remaining],
        backgroundColor: ["#8ec5eb", "rgba(255,255,255,0.12)"],
        borderWidth: 0,
      },
    ],
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    cutout: "70%",
  };

  // Bar Chart Data
  const barChartData = {
    labels: ["Roadmaps", "Assessments"],
    datasets: [
      {
        label: "Total",
        data: [progressData?.totalRoadmaps ?? 0, progressData?.totalAssessments ?? 0],
        backgroundColor: "rgba(142, 197, 235, 0.35)",
        borderRadius: 4,
      },
      {
        label: "Completed",
        data: [progressData?.completedRoadmaps ?? 0, progressData?.completedAssessments ?? 0],
        backgroundColor: "#8ec5eb",
        borderRadius: 4,
      },
    ],
  };

  const maxBar = Math.max(
    3,
    progressData?.totalRoadmaps ?? 0,
    progressData?.totalAssessments ?? 0,
    progressData?.completedRoadmaps ?? 0,
    progressData?.completedAssessments ?? 0,
  );

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: maxBar,
        ticks: {
          stepSize: 1,
          color: "rgba(255,255,255,0.55)",
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
          color: "rgba(255,255,255,0.08)",
          borderDash: [5, 5],
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: "rgba(255,255,255,0.75)",
          font: {
            size: 14,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Filter roadmap cards
  const filteredRoadmapCards = roadmapCards.filter((card) => {
    if (roadmapFilter === "All") return true;
    if (roadmapFilter === "Completed") return card.status === "Completed";
    if (roadmapFilter === "Remaining")
      return card.status !== "Completed";
    return true;
  });

  // Filter survey cards
  const filteredSurveyCards = surveyCards.filter((card) => {
    if (surveyFilter === "All") return true;
    if (surveyFilter === "Completed") return card.status === "Completed";
    if (surveyFilter === "Remaining") return card.status === "Remaining";
    return true;
  });

  if (!userId) {
    return (
      <div className={directorPageRoot}>
        <p className="p-8 text-white">Invalid link.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
          <p className="text-sm text-white/70">Loading progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={userName}
        subtitle="Roadmaps, assessments, and final comments."
        image={ProgressBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Track Progress", href: "/director/track-progress" },
          { label: userName },
        ]}
      />

      {loadError ? (
        <section className="relative px-4 pb-12 sm:px-6 md:px-12 lg:px-20">
          <div className="mx-auto max-w-lg rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-6 text-center text-red-100">
            {loadError}
          </div>
        </section>
      ) : null}

      {!loadError && (completionMessage || inviteMessage) ? (
        <section className="relative px-4 pb-6 sm:px-6 md:px-12 lg:px-20">
          <div className="mx-auto max-w-[1400px] space-y-3">
            {completionMessage ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                {completionMessage}
              </div>
            ) : null}
            {inviteMessage ? (
              <div className="rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-4 py-3 text-sm text-[#d8edf9]">
                {inviteMessage}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={`relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20 ${loadError ? "hidden" : ""}`}>
        <div className="mx-auto max-w-[1400px] space-y-10">
          <div className="relative">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsFinalCommentsModalOpen(true)}
                className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
              >
                {isCompleted ? "View final comments" : "Add final comments"}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className={`p-6 sm:p-8 ${directorGlassCard}`}>
                <h2 className="mb-6 text-xl font-semibold text-white">Roadmap &amp; assessments</h2>
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-[#8ec5eb]" />
                    <span className="text-xs text-white/65">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-white/25" />
                    <span className="text-xs text-white/65">Remaining</span>
                  </div>
                </div>
                <div className="relative flex h-64 items-center justify-center">
                  <div className="relative flex h-full w-full items-center justify-center">
                    <Doughnut data={donutChartData} options={donutChartOptions} />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-white/15 bg-[#041f35]/90 backdrop-blur-sm">
                        <span className="text-lg font-bold text-white">
                          {progress.completed === 100 ? "Done" : `${progress.completed}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {progress.completed > 0 && (
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                      <div className="relative flex items-center">
                        <div className="mr-2 h-0.5 w-10 bg-[#8ec5eb]" />
                        <div className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-3 py-1.5 text-sm font-semibold text-white">
                          {progress.completed}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`relative p-6 sm:p-8 ${directorGlassCard}`}>
                <div className="mb-6">
                  <h2 className="mb-2 text-xl font-semibold text-white">Breakdown</h2>
                  <p className="text-sm text-white/55">Roadmaps vs assessments (totals and completed)</p>
                </div>
                <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#8ec5eb]/40" />
                    <span className="text-xs text-white/65">Total</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#8ec5eb]" />
                    <span className="text-xs text-white/65">Completed</span>
                  </div>
                </div>
                <div className="relative h-64">
                  <Bar
                    data={barChartData}
                    options={barChartOptions}
                    plugins={[
                      {
                        id: "customLabels",
                        afterDatasetsDraw: (chart: any) => {
                          const ctx = chart.ctx;
                          const meta = chart.getDatasetMeta(1); // Completed dataset
                          meta.data.forEach((bar: any, index: number) => {
                            if (index === 0 && roadmapPct > 0) {
                              const x = bar.x;
                              const y = bar.y;
                              const barHeight = bar.height;

                              const percentage = roadmapPct;

                              // Calculate badge dimensions
                              const badgeWidth = 40;
                              const badgeHeight = 20;
                              const badgeX = x - badgeWidth / 2;
                              const badgeY = y - barHeight - badgeHeight - 5;

                              ctx.save();
                              // Draw rounded rectangle background
                              ctx.fillStyle = "#8ec5eb";
                              const radius = 4;
                              ctx.beginPath();
                              ctx.moveTo(badgeX + radius, badgeY);
                              ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
                              ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
                              ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
                              ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
                              ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
                              ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
                              ctx.lineTo(badgeX, badgeY + radius);
                              ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
                              ctx.closePath();
                              ctx.fill();

                              // Draw white text
                              ctx.fillStyle = "#FFFFFF";
                              ctx.font = "bold 12px sans-serif";
                              ctx.textAlign = "center";
                              ctx.textBaseline = "middle";
                              ctx.fillText(`${percentage}%`, x, badgeY + badgeHeight / 2);
                              ctx.restore();
                            }
                          });
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border border-white/12 p-5 sm:p-6 ${directorGlassCard}`}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Revitalization roadmap</h2>
              <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1">
                {(["All", "Completed", "Remaining"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setRoadmapFilter(f)}
                    className={`h-8 rounded-md px-4 text-sm font-semibold transition-all ${
                      roadmapFilter === f
                        ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoadmapCards.map((card) => (
                <RoadmapProgressCard
                  key={card.id}
                  image={card.image}
                  title={card.title}
                  description={card.description}
                  status={card.status}
                  tasksCompleted={card.tasksCompleted}
                />
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border border-white/12 p-5 sm:p-6 ${directorGlassCard}`}>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Survey / assessments</h2>
              <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1">
                {(["All", "Completed", "Remaining"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSurveyFilter(f)}
                    className={`h-8 rounded-md px-4 text-sm font-semibold transition-all ${
                      surveyFilter === f
                        ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSurveyCards.map((card) => (
                <SurveyProgressCard
                  key={card.id}
                  image={card.image}
                  title={card.title}
                  description={card.description}
                  status={card.status}
                  submittedDate={'submittedDate' in card ? card.submittedDate : undefined}
                  dueDate={'dueDate' in card ? card.dueDate : undefined}
                  onButtonClick={() => console.log("Customized Development Plans clicked")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Final Comments Modal */}
      {isFinalCommentsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl ${directorGlassCard}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Final comments</h2>
                <p className="mt-1 text-sm text-white/55">{userName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFinalCommentsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              <textarea
                value={finalComments}
                onChange={(e) => !hasComments && setFinalComments(e.target.value)}
                placeholder={hasComments ? "" : "Write comments here…"}
                readOnly={hasComments}
                rows={10}
                className={`${directorInputClass} min-h-[200px] resize-none ${
                  hasComments ? "cursor-not-allowed opacity-90" : ""
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsFinalCommentsModalOpen(false)}
                className="rounded-xl border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancel
              </button>
              {hasComments ? (
                <button
                  type="button"
                  onClick={handleMarkAsCompleted}
                  disabled={isMarkingProgramComplete}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isMarkingProgramComplete ? "Marking programme..." : "Mark programme as completed"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitComments}
                  disabled={!directorId}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite as Field Mentor Modal */}
      {isInviteFieldMentorModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl ${directorGlassCard}`}>
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-white">Invite as Field Mentor</h2>
                <p className="mt-1 text-sm text-white/55">{userName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteFieldMentorModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-4">
                <div className="flex items-start gap-3">
                  <i className="fa-solid fa-circle-check mt-0.5 text-emerald-300"></i>
                  <div>
                    <h3 className="font-semibold text-emerald-100">Program Completed</h3>
                    <p className="mt-1 text-sm text-emerald-100/80">
                      {userName} has successfully completed their program.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-white/80">
                Do you want to invite <span className="font-semibold text-white">{userName}</span> to become a{" "}
                <span className="font-semibold text-[#8ec5eb]">Field Mentor</span>? This will change their role and give them access to mentor other pastors.
              </p>
              {user?.email ? (
                <p className="mt-3 text-sm text-white/55">Invitation email: {user.email}</p>
              ) : (
                <p className="mt-3 text-sm text-amber-200/85">No email is available for this user, so the invitation cannot be sent yet.</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsInviteFieldMentorModalOpen(false)}
                className="rounded-xl border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Not Now
              </button>
              <button
                type="button"
                onClick={handleInviteAsFieldMentor}
                disabled={isInvitingFieldMentor || !user?.email || !directorId}
                className="rounded-xl border border-emerald-400/50 bg-emerald-500/20 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isInvitingFieldMentor ? "Sending invitation..." : "Invite as Field Mentor"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

