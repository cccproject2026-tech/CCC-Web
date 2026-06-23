"use client";
import { useState, useEffect } from "react";
import { getCookie } from "@/app/utils/cookies";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { directorGlassCard, directorPageRoot } from "../../directorUi";
import ProgressBg from "../../../Assets/progress-bg.jpg";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import {
  apiGetUserProgress,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import { apiGetUserById, apiInviteFieldMentor, unwrapUserResponse } from "@/app/Services/users.service";
import {
  apiGetUserCertificate,
  hasRealCertificate,
  unwrapCertificate,
  type CertificateRecord,
} from "@/app/Services/certificates.service";
import {
  buildRoadmapAssignments,
  collapseRoadmapAssignmentsToParents,
  fetchMergedRoadmapsForAssignedUser,
  normalizeRoadmapId,
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
} from "@/app/Services/roadmap-assignments";
import {
  apiGetAssessments,
  apiGetAssignedAssessments,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import type { ProgressResponse, UserResponse } from "@/app/Services/types";

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
  imageUrl?: string | null;
  title: string;
  description: string;
  status: "Completed" | "In-progress" | "Not Started" | "Over Due";
  completedDate?: string;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  completionTime?: string;
  onClick: () => void;
}

function RoadmapProgressCard({
  imageUrl,
  title,
  description,
  status,
  completedDate,
  completedSteps,
  totalSteps,
  progressPercentage,
  completionTime,
  onClick,
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

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex overflow-hidden rounded-2xl border border-white/12 text-left transition hover:border-[#8ec5eb]/40 ${directorGlassCard}`}
    >
      <div className="relative w-1/3 shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            unoptimized={isRemoteImageSrc(imageUrl)}
          />
        ) : (
          <ApiImagePlaceholder className="h-full min-h-[220px] w-full" />
        )}
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
          <div className="flex flex-col gap-1">
            <div className="h-2 w-full rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-[#8ec5eb]/80"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-3 text-xs text-white/55">
              <span>Tasks: {completedSteps}/{totalSteps}</span>
              <span>{progressPercentage}%</span>
            </div>
          </div>
          {completionTime && <span className="text-xs text-white/70">Completion time: {completionTime}</span>}
        </div>
      </div>
    </button>
  );
}

interface SurveyCardProps {
  imageUrl?: string | null;
  title: string;
  description: string;
  status: "Completed" | "Submitted" | "Remaining";
  submittedDate?: string;
  dueDate?: string;
  onViewResult?: () => void;
  onViewCdp?: () => void;
}

function SurveyProgressCard({
  imageUrl,
  title,
  description,
  status,
  submittedDate,
  dueDate,
  onViewResult,
  onViewCdp,
}: SurveyCardProps) {
  return (
    <div className={`flex overflow-hidden rounded-2xl border border-white/12 ${directorGlassCard}`}>
      <div className="relative w-1/3 shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            unoptimized={isRemoteImageSrc(imageUrl)}
          />
        ) : (
          <ApiImagePlaceholder className="h-full min-h-[220px] w-full" />
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mb-4 text-sm text-white/65">{description}</p>
          <span className="w-fit rounded-md border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-xs font-semibold text-[#cde9f7]">
            Status: {status}
          </span>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
          {onViewResult && (
            <button
              type="button"
              onClick={onViewResult}
              className="w-fit rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
            >
              View Result
            </button>
          )}
          {onViewCdp && (
            <button
              type="button"
              onClick={onViewCdp}
              className="w-fit rounded-lg border border-emerald-300/45 bg-emerald-400/15 px-5 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-400/25"
            >
              View CDP
            </button>
          )}
          </div>
          <span className="text-xs text-white/55">
            {submittedDate ? `Submitted: ${submittedDate}` : `Due: ${dueDate || "N/A"}`}
          </span>
        </div>
      </div>
    </div>
  );
}

function mapRoadmapStatus(status: unknown): RoadmapCardProps["status"] {
  const s = String(status || "").toLowerCase().replace(/\s+/g, "_");
  if (s.includes("complete")) return "Completed";
  if (s === "overdue" || s === "over_due") return "Over Due";
  if (s === "due" || s.includes("progress")) return "In-progress";
  return "Not Started";
}

function isRoadmapComplete(row: Record<string, unknown>): boolean {
  const totalSteps = Math.max(0, Number(row.totalSteps ?? 0));
  const completedSteps = Math.max(0, Number(row.completedSteps ?? 0));
  return (
    mapRoadmapStatus(row.status) === "Completed" ||
    (totalSteps > 0 && completedSteps >= totalSteps) ||
    Number(row.progressPercentage ?? 0) >= 100
  );
}

function roadmapPercentage(row: Record<string, unknown>): number {
  const totalSteps = Math.max(0, Number(row.totalSteps ?? 0));
  const completedSteps = Math.max(0, Number(row.completedSteps ?? 0));
  const raw =
    totalSteps > 0
      ? (completedSteps / totalSteps) * 100
      : Number(row.progressPercentage ?? 0);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

function formatDateShort(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function isCompletedAssessmentStatus(status: unknown): boolean {
  const s = String(status || "").toLowerCase().replace(/[_\s-]+/g, " ");
  return s === "completed" || s === "complete" || s === "reviewed";
}

function getFinalCommentMentorName(comment: any): string | null {
  const toLabel = (value: unknown): string | null => {
    if (!value) return null;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? trimmed : null;
    }
    if (typeof value === "object") {
      const row = value as Record<string, unknown>;
      const nestedCandidates = [
        row.name,
        row.fullName,
        row.firstName && row.lastName ? `${String(row.firstName)} ${String(row.lastName)}` : null,
        row.firstName,
        row.lastName,
        row.email,
        row._id,
        row.id,
      ];
      for (const candidate of nestedCandidates) {
        const label = toLabel(candidate);
        if (label) return label;
      }
    }
    return null;
  };

  const candidates = [
    comment.commentorName,
    comment.mentorName,
    comment.commentor,
    comment.createdBy,
    comment.commentorId,
  ];

  for (const candidate of candidates) {
    const label = toLabel(candidate);
    if (label) return label;
  }

  return null;
}

function hasCdpInRecommendationsPayload(body: unknown): boolean {
  const walk = (node: unknown, parentSent = false): boolean => {
    if (!node) return false;
    if (Array.isArray(node)) return node.some((item) => walk(item, parentSent));
    if (typeof node !== "object") return false;
    const row = node as Record<string, unknown>;
    const sentRaw = row.sent ?? row.isSent ?? row.status;
    const isSent =
      parentSent ||
      sentRaw === true ||
      String(sentRaw ?? "").trim().toLowerCase() === "sent";
    const message = String(row.message ?? row.text ?? row.cdp ?? row.mentorCdp ?? "").trim();
    const recommendations = Array.isArray(row.recommendations)
      ? row.recommendations.some((value) => String(value ?? "").trim())
      : false;
    if (isSent && (message || recommendations)) return true;
    return (
      walk(row.data, isSent) ||
      walk(row.sections, isSent) ||
      walk(row.recommendations, isSent) ||
      walk(row.layers, isSent)
    );
  };
  return walk(body);
}

function hasCdpInAnswerPayload(body: unknown): boolean {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return sections.some((section: any) => {
    const sectionRecommendations = Array.isArray(section?.recommendations)
      ? section.recommendations.some((value: unknown) => String(value ?? "").trim())
      : false;
    const layerRecommendations = Array.isArray(section?.layers)
      ? section.layers.some(
          (layer: any) =>
            Array.isArray(layer?.recommendations) &&
            layer.recommendations.some((value: unknown) => String(value ?? "").trim()),
        )
      : false;
    return sectionRecommendations || layerRecommendations;
  });
}

function hasSubmittedMainAssessmentAnswers(body: unknown): boolean {
  const root =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const data =
    root.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const sections = Array.isArray(data.sections) ? data.sections : [];

  return sections.some((section: any) => {
    const layers = Array.isArray(section?.layers) ? section.layers : [];

    return layers.some((layer: any) => {
      const selectedChoice = layer?.selectedChoice;
      const selectedValues = layer?.selectedValues;

      const hasSelectedChoice =
        selectedChoice !== undefined &&
        selectedChoice !== null &&
        String(selectedChoice).trim() !== "";

      const hasSelectedValues =
        Array.isArray(selectedValues) &&
        selectedValues.some((value) => String(value ?? "").trim() !== "");

      return hasSelectedChoice || hasSelectedValues;
    });
  });
}

export default function IndividualProgressPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.userId;
  const userId =
    typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? decodeURIComponent(rawId[0] ?? "") : "";
  const [isInviteFieldMentorModalOpen, setIsInviteFieldMentorModalOpen] = useState(false);
  const [isInvitingFieldMentor, setIsInvitingFieldMentor] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [certificateMessage, setCertificateMessage] = useState<string | null>(null);
  const [showStatusMessages, setShowStatusMessages] = useState(false);
  const [roadmapFilter, setRoadmapFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [surveyFilter, setSurveyFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [roadmaps, setRoadmaps] = useState<Record<string, unknown>[]>([]);
  const [assessments, setAssessments] = useState<Record<string, unknown>[]>([]);
  const [roadmapsLoading, setRoadmapsLoading] = useState(false);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "—";
  const isCompleted = progressData?.overallCompleted ?? false;
  const [directorId, setDirectorId] = useState<string>("");
  const canInviteFieldMentor = Boolean(directorId && user?.email && user?.hasCompleted);
  const hasCertificate = hasRealCertificate(certificate);
  const assignedContentLoading = roadmapsLoading || assessmentsLoading;

  useEffect(() => {
    const storedUserId = getCookie("userId");
    setDirectorId(storedUserId as string);
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setLoadError(null);
    Promise.all([apiGetUserById(userId), apiGetUserProgress(userId)])
      .then(async ([userRes, progressRes]) => {
        const loadedUser = unwrapUserResponse(userRes);
        const loadedProgress = unwrapUserProgressDetail(progressRes);
        setUser(loadedUser);
        setProgressData(loadedProgress);
        const shouldLoadCertificate =
          Boolean(loadedUser?.hasCompleted) ||
          (Array.isArray(loadedProgress?.finalComments) && loadedProgress.finalComments.length > 0);
        if (shouldLoadCertificate) {
          try {
            setCertificate(unwrapCertificate(await apiGetUserCertificate(userId)));
          } catch {
            setCertificate(null);
          }
        } else {
          setCertificate(null);
        }
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
    if (!userId || !progressData) return;
    let cancelled = false;

    const loadRoadmaps = async () => {
      setRoadmapsLoading(true);
      try {
        const roadmapDocs = await fetchMergedRoadmapsForAssignedUser(userId);
        const assignments = buildRoadmapAssignments(roadmapDocs, progressData);
        const parents = collapseRoadmapAssignmentsToParents(assignments);
        const mapped = parents.map((parent) => {
          const parentId = String(parent.parentRoadmapId || parent.id);
          const tasks = assignments.filter(
            (assignment) => String(assignment.parentRoadmapId || assignment.id) === parentId,
          );
          const progressRow = progressData?.roadmaps?.find(
            (row) => String(row.roadMapId) === parentId,
          );
          const hasNestedTasks = parent.hasNestedTasks === true;
          const totalSteps = hasNestedTasks
            ? tasks.length
            : Math.max(0, Number(progressRow?.totalSteps ?? 0));
          const completedSteps = hasNestedTasks
            ? tasks.filter((task) => mapRoadmapStatus(task.status) === "Completed").length
            : Math.max(0, Number(progressRow?.completedSteps ?? 0));
          const progressPercentage =
            totalSteps > 0
              ? (completedSteps / totalSteps) * 100
              : Number(progressRow?.progressPercentage ?? 0);
          const roadmapDoc = roadmapDocs.find(
            (roadmap) =>
              normalizeRoadmapId(roadmap._id ?? (roadmap as { id?: unknown }).id) === parentId,
          );
          const nestedRoadmaps = unwrapNestedRoadmapsArray(roadmapDoc);
          const roadmapType = String(roadmapDoc?.type || "").toLowerCase();
          const isSingleRoadmap =
            roadmapType === "single" ||
            roadmapType.includes("jump");
          const isPhaseRoadmap =
            !isSingleRoadmap &&
            (roadmapType === "phase" ||
              roadmapDoc?.haveNextedRoadMaps === true ||
              nestedRoadmaps.length > 0 ||
              parent.hasNestedTasks === true);
          const taskId =
            resolveNestedTemplateItemId(nestedRoadmaps[0]) ||
            String(tasks[0]?.id || "");

          return {
            id: parentId,
            title: parent.title || parent.parentRoadmapName || "Roadmap",
            description: parent.desc || tasks.find((task) => task.desc)?.desc || "",
            status: parent.status,
            completedSteps,
            totalSteps,
            progressPercentage,
            completionTime: parent.months,
            imageUrl: resolveApiMediaUrl(parent.imageUrl),
            isPhaseRoadmap,
            taskId,
          };
        });

        console.log("Track progress roadmaps", mapped);
        if (!cancelled) setRoadmaps(mapped);
      } catch (error) {
        console.error("Failed to load track progress roadmaps", error);
        if (!cancelled) setRoadmaps([]);
      } finally {
        if (!cancelled) setRoadmapsLoading(false);
      }
    };

    void loadRoadmaps();
    return () => {
      cancelled = true;
    };
  }, [progressData, userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadAssessments = async () => {
      setAssessmentsLoading(true);
      try {
        const [assignedRes, allAssessmentsRes] = await Promise.all([
          apiGetAssignedAssessments(userId),
          apiGetAssessments().catch(() => null),
        ]);
        let assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
        const allBody = allAssessmentsRes?.data as { data?: unknown } | unknown[] | undefined;
        const allAssessments = Array.isArray(allBody)
          ? allBody
          : Array.isArray(allBody?.data)
            ? allBody.data
            : [];
        const existingIds = new Set(
          assignedRows
            .map((row) => flattenAssignedAssessmentRow(row)?.assessmentId)
            .filter(Boolean),
        );
        const missingRows = allAssessments
          .map((assessment: any) => {
            const assignment = Array.isArray(assessment?.assignments)
              ? assessment.assignments.find(
                  (row: any) => String(row?.userId) === String(userId),
                )
              : null;
            return assignment ? { assessment, ...assignment } : null;
          })
          .filter((row: unknown) => {
            const id = flattenAssignedAssessmentRow(row)?.assessmentId;
            return id && !existingIds.has(id);
          });
        assignedRows = [...assignedRows, ...missingRows];

        const mapped = (
          await Promise.all(
            assignedRows.map(async (row) => {
              const flat = flattenAssignedAssessmentRow(row);
              if (!flat) return null;
              const progressRow = progressData?.assessments?.find(
                (item) =>
                  String(item.assessmentId) === flat.assessmentId ||
                  Boolean(
                    flat.assignmentId &&
                      item.assignmentId &&
                      String(item.assignmentId) === flat.assignmentId,
                  ),
              );
              const [answersRes, recommendationsRes] = await Promise.allSettled([
                apiGetUserAnswers(flat.assessmentId, userId),
                apiGetSectionRecommendations(flat.assessmentId, userId),
              ]);
              const answerData =
                answersRes.status === "fulfilled"
                  ? (answersRes.value.data as { data?: Record<string, unknown> })?.data
                  : undefined;
              const hasResult =
                answersRes.status === "fulfilled" &&
                hasSubmittedMainAssessmentAnswers(answersRes.value.data);
              const hasCdp =
                (answersRes.status === "fulfilled" &&
                  hasCdpInAnswerPayload(answersRes.value.data)) ||
                (recommendationsRes.status === "fulfilled" &&
                  hasCdpInRecommendationsPayload(recommendationsRes.value.data));

              return {
                id: flat.assessmentId,
                title: String(flat.assessment.name || flat.assessment.title || "Assessment"),
                description: String(flat.assessment.description || ""),
                imageUrl: resolveApiMediaUrl(
                  flat.assessment.bannerImage || flat.assessment.imageUrl || flat.assessment.image,
                ),
                status: hasCdp ? "Completed" : hasResult ? "Submitted" : "Remaining",
                progressStatusRaw: progressRow?.status,
                hasResult,
                hasCdp,
                submittedDate:
                  hasResult || hasCdp
                    ? formatDateShort(
                        answerData?.submittedAt ||
                          answerData?.createdAt ||
                          answerData?.updatedAt ||
                          flat.updatedAt,
                      )
                    : undefined,
                dueDate: formatDateShort(flat.dueDate),
              };
            }),
          )
        ).filter((row) => row != null) as Record<string, unknown>[];

        console.log("Track progress assessments", mapped);
        if (!cancelled) setAssessments(mapped);
      } catch (error) {
        console.error("Failed to load track progress assessments", error);
        if (!cancelled) setAssessments([]);
      } finally {
        if (!cancelled) setAssessmentsLoading(false);
      }
    };

    void loadAssessments();
    return () => {
      cancelled = true;
    };
  }, [progressData, userId]);

  useEffect(() => {
    if (!inviteMessage && !certificateMessage) {
      setShowStatusMessages(false);
      return;
    }

    setShowStatusMessages(true);

    const fadeTimer = window.setTimeout(() => {
      setShowStatusMessages(false);
    }, 2600);

    const clearTimer = window.setTimeout(() => {
      setInviteMessage(null);
      setCertificateMessage(null);
    }, 3200);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(clearTimer);
    };
  }, [inviteMessage, certificateMessage]);

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
      setCertificateMessage(null);
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

  const roadmapPct =
    roadmaps.length > 0
      ? Math.round(
          (roadmaps.filter((card) => isRoadmapComplete(card)).length / roadmaps.length) * 100,
        )
      : 0;

  const derivedTotalRoadmaps = roadmaps.length;
  const derivedCompletedRoadmaps = roadmaps.filter((card) => isRoadmapComplete(card)).length;
  const progressDataForChart = progressData
    ? {
        ...progressData,
        totalRoadmaps: derivedTotalRoadmaps,
        completedRoadmaps: derivedCompletedRoadmaps,
      }
    : progressData;

  const progress = {
    completed: progressData?.overallProgress ?? 0,
    remaining: 100 - (progressData?.overallProgress ?? 0),
  };
  const totalAssessmentsForChart = assessments.length;
  const completedAssessmentsForChart = assessments.filter(
    (assessment) =>
      isCompletedAssessmentStatus(assessment.status) ||
      isCompletedAssessmentStatus(assessment.progressStatusRaw),
  ).length;

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
        data: [progressDataForChart?.totalRoadmaps ?? 0, totalAssessmentsForChart],
        backgroundColor: "rgba(142, 197, 235, 0.35)",
        borderRadius: 4,
      },
      {
        label: "Completed",
        data: [progressDataForChart?.completedRoadmaps ?? 0, completedAssessmentsForChart],
        backgroundColor: "#8ec5eb",
        borderRadius: 4,
      },
    ],
  };

  const maxBar = Math.max(
    3,
    progressDataForChart?.totalRoadmaps ?? 0,
    totalAssessmentsForChart,
    progressDataForChart?.completedRoadmaps ?? 0,
    completedAssessmentsForChart,
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
  const filteredRoadmapCards = roadmaps.filter((card) => {
    if (roadmapFilter === "All") return true;
    if (roadmapFilter === "Completed") return isRoadmapComplete(card);
    if (roadmapFilter === "Remaining") return !isRoadmapComplete(card);
    return true;
  });

  // Filter survey cards
  const filteredSurveyCards = assessments.filter((card) => {
    const completed = card.status === "Completed" || card.status === "Submitted";
    if (surveyFilter === "All") return true;
    if (surveyFilter === "Completed") return completed;
    if (surveyFilter === "Remaining") return !completed;
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

      {!loadError && (inviteMessage || certificateMessage) ? (
        <section className="relative px-4 pb-6 sm:px-6 md:px-12 lg:px-20">
          <div
            className={`mx-auto max-w-[1400px] space-y-3 transition-opacity duration-500 ${
              showStatusMessages ? "opacity-100" : "opacity-0"
            }`}
          >
            {inviteMessage ? (
              <div className="rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-4 py-3 text-sm text-[#d8edf9]">
                {inviteMessage}
              </div>
            ) : null}
            {certificateMessage ? (
              <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-50">
                {certificateMessage}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className={`relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20 ${loadError ? "hidden" : ""}`}>
        <div className="mx-auto max-w-[1400px] space-y-10">
          <div className="relative">
            <div className="mb-4 flex flex-wrap justify-end gap-3">
              {(user?.fieldMentorInvitation || canInviteFieldMentor) && (
                <button
                  type="button"
                  onClick={handleInviteAsFieldMentor}
                  disabled={isInvitingFieldMentor || Boolean(user?.fieldMentorInvitation) || !canInviteFieldMentor}
                  className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {user?.fieldMentorInvitation
                    ? " Field Mentor Invitation sent"
                    : isInvitingFieldMentor
                      ? "Sending invitation..."
                      : "Invite as Field Mentor"}
                </button>
              )}
              {user?.hasCompleted && (
                hasCertificate ? (
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Certificate issued
                </button>
                ) : (
                  <Link
                    href={`/director/mentees/profile/${encodeURIComponent(userId)}?issueCertificate=1`}
                    className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-400/25"
                  >
                    Issue Certificate
                  </Link>
                )
              )}
            </div>
            {Array.isArray(progressData?.finalComments) && progressData.finalComments.length > 0 ? (
              <div className={`mb-8 mt-6 rounded-2xl border border-white/12 p-5 sm:p-6 ${directorGlassCard}`}>
                <div className="mb-4 flex flex-col gap-3 sm:items-start">
                  <h2 className="text-lg font-semibold text-white">Final comments by mentor</h2>
                </div>
                <div className="space-y-3">
                  {progressData.finalComments.map((comment, index) => (
                    <div
                      key={comment._id || `${comment.commentorId}-${index}`}
                      className="rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <p className="text-sm font-semibold text-amber-200">
                        {(() => {
                          const mentorName = getFinalCommentMentorName(comment);
                          return mentorName && !/^[a-f0-9]{24}$/i.test(mentorName)
                            ? `Marked completed by Mentor: ${mentorName}`
                            : "Marked completed by Mentor";
                        })()}
                      </p>
                      <p className="text-sm leading-relaxed text-white/85">{comment.comment}</p>
                      <p className="mt-2 text-xs text-white/55">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : "Unknown date"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
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
              {assignedContentLoading && filteredRoadmapCards.length === 0 ? (
                <p className="col-span-full text-sm text-white/65">Loading assigned roadmaps...</p>
              ) : null}
              {!assignedContentLoading && filteredRoadmapCards.length === 0 ? (
                <p className="col-span-full text-sm text-white/65">No roadmaps to show for this filter.</p>
              ) : null}
              {filteredRoadmapCards.map((card) => (
                <RoadmapProgressCard
                  key={String(card.id)}
                  imageUrl={typeof card.imageUrl === "string" ? card.imageUrl : null}
                  title={String(card.title || "Roadmap")}
                  description={String(card.description || "No description available.")}
                  status={isRoadmapComplete(card) ? "Completed" : mapRoadmapStatus(card.status)}
                  completedSteps={Math.max(0, Number(card.completedSteps ?? 0))}
                  totalSteps={Math.max(0, Number(card.totalSteps ?? 0))}
                  progressPercentage={roadmapPercentage(card)}
                  completionTime={typeof card.completionTime === "string" ? card.completionTime : undefined}
                  onClick={() => {
                    const roadmapId = String(card.id || "");
                    if (!roadmapId) return;
                    if (card.isPhaseRoadmap) {
                      router.push(
                        `/director/revitalization-roadmap/phase?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(roadmapId)}`,
                      );
                      return;
                    }
                    const taskId = String(card.taskId || "");
                    if (taskId) {
                      router.push(
                        `/director/revitalization-roadmap/task?roadmapId=${encodeURIComponent(roadmapId)}&userId=${encodeURIComponent(userId)}&taskId=${encodeURIComponent(taskId)}&mode=view`,
                      );
                      return;
                    }
                    router.push(
                      `/director/revitalization-roadmap/roadmap-form?roadmapId=${encodeURIComponent(roadmapId)}&type=single&isEditMode=true&viewOnly=true`,
                    );
                  }}
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
              {assignedContentLoading && filteredSurveyCards.length === 0 ? (
                <p className="col-span-full text-sm text-white/65">Loading assigned assessments...</p>
              ) : null}
              {!assignedContentLoading && filteredSurveyCards.length === 0 ? (
                <p className="col-span-full text-sm text-white/65">No assessments to show for this filter.</p>
              ) : null}
              {filteredSurveyCards.map((card) => (
                <SurveyProgressCard
                  key={String(card.id)}
                  imageUrl={typeof card.imageUrl === "string" ? card.imageUrl : null}
                  title={String(card.title || "Assessment")}
                  description={String(card.description || "No description available.")}
                  status={
                    card.status === "Completed" || card.status === "Submitted"
                      ? card.status
                      : "Remaining"
                  }
                  submittedDate={typeof card.submittedDate === "string" ? card.submittedDate : undefined}
                  dueDate={typeof card.dueDate === "string" ? card.dueDate : undefined}
                  onViewResult={
                    card.hasResult
                      ? () =>
                          router.push(
                            `/director/assessments/result?assessmentId=${encodeURIComponent(String(card.id))}&userId=${encodeURIComponent(userId)}`,
                          )
                      : undefined
                  }
                  onViewCdp={
                    card.hasCdp
                      ? () =>
                          router.push(
                            `/director/assessments/result/cdp?assessmentId=${encodeURIComponent(String(card.id))}&userId=${encodeURIComponent(userId)}`,
                          )
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </section>
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

