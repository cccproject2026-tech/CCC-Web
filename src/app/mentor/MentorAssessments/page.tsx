"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import HeroBg from "@/app/Assets/assignments-bg.png";
import UserProfile from "@/app/Assets/user-profile.png";
import Thumb1 from "@/app/Assets/thumb1.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import MentorHeader from "@/app/Components/MentorHeader";
import { ApiAvatarPlaceholder, ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import {
  apiGetAssignedAssessments,
  apiGetAssessmentById,
  apiGetAssessmentRecommendationRules,
  apiCreateAssessment,
  apiDeleteAssessments,
  flattenAssignedAssessmentRow,
  apiGetAssessments,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  apiAssignAssessmentViaModule,
  parseAssignedAssessmentsListBody,
  parseAssessmentDetailPayload,
  parseAssessmentsListPayload,
  apiSendSectionRecommendations,
} from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { useRouter, useSearchParams } from "next/navigation";
import MentorModal from "@/app/Components/mentor/MentorModal";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import SearchBar from "@/app/Components/SearchBar";
import { directorGlassCard, directorListCardRadius } from "@/app/director/directorUi";
import {
  mentorBodyText,
  mentorEmptyPanel,
  mentorFilterPanel,
  mentorGlassCardFrost,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorModalBtnSecondary,
  mentorPageRoot,
} from "@/app/Components/mentor/mentor-theme";
import FeaturedAvatars, { FeaturedAvatarItem } from "@/app/Components/FeaturedAvatars";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import {
  getStoredRecommendationsForPastorAssessment,
  normalizeSendableCdpMessage,
  upsertStoredRecommendation,
} from "@/app/utils/assessment-recommendations";

type MentorAssessmentStatus = "not_started" | "submitted" | "completed";

type RecommendationRow = {
  sectionId: string;
  sectionTitle: string;
  message: string;
  score?: number;
};

type RecommendationRule = {
  level?: number | string;
  items?: string[];
};

type RuleLayer = {
  _id?: string;
  title?: string;
  recommendations?: string[];
};

type RuleSection = {
  _id?: string;
  title?: string;
  name?: string;
  recommendations?: RecommendationRule[];
  layers?: RuleLayer[];
};

type MentorFeaturedAvatarItem = FeaturedAvatarItem & {
  email?: string;
  phoneNumber?: string;
  phone?: string;
};


function normalizeMentorAssessmentStatus(raw: unknown): MentorAssessmentStatus {
  const s = String(raw || "").toLowerCase().replace(/\s+/g, "_");

  if (s === "submitted") return "submitted";
  if (s === "completed" || s === "reviewed") return "completed";

  return "not_started";
}

function statusChipClass(status: MentorAssessmentStatus): string {
  if (status === "completed") return "border-emerald-300/40 bg-emerald-400/20 text-emerald-100";
  if (status === "submitted") return "border-amber-300/40 bg-amber-400/20 text-amber-100";
  return "border-white/20 bg-white/10 text-[#cde2f2]";
}

function statusLabel(status: MentorAssessmentStatus): string {
  if (status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  return "Not Started";
}

function assessmentStatusLabel(status?: MentorAssessmentStatus): string {
  return statusLabel(status || "not_started");
}

function assessmentStatusChipClass(status?: MentorAssessmentStatus): string {
  return statusChipClass(status || "not_started");
}

function formatDueDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickAssignedDueDate(rawItem: any, flat: any): string | undefined {
  const candidates = [
    flat?.dueDate,
    flat?.deadline,
    flat?.endDate,
    flat?.assignedDueDate,
    rawItem?.dueDate,
    rawItem?.deadline,
    rawItem?.endDate,
    rawItem?.assignedDueDate,
    rawItem?.assignment?.dueDate,
    rawItem?.assignment?.deadline,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function formatMeetingDateTime(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isMeetingStillActive(meetingDate: unknown, status: unknown): boolean {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "cancelled" || s === "missed") return false;
  if (typeof meetingDate !== "string" || !meetingDate.trim()) return true;
  const when = new Date(meetingDate).getTime();
  if (Number.isNaN(when)) return true;
  return when >= Date.now();
}

function formatCreatedDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isTodayDate(value?: string): boolean {
  if (!value) return false;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}
function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractAssessmentIdFromProgressRow(row: any): string {
  const direct = row?.assessmentId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (direct && typeof direct === "object") {
    const nested = String((direct as { _id?: string; id?: string })._id ?? (direct as { _id?: string; id?: string }).id ?? "").trim();
    if (nested) return nested;
  }
  const fallback = String(row?._id ?? row?.id ?? "").trim();
  return fallback;
}

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

function getAssessmentId(item: { _id?: string; id?: string }): string {
  const raw = item._id ?? item.id;
  return raw != null ? String(raw) : "";
}

function extractRulesPayload(body: unknown): RuleSection[] {
  if (Array.isArray(body)) return body as RuleSection[];
  if (!body || typeof body !== "object") return [];

  const o = body as Record<string, unknown>;
  if (Array.isArray(o.data)) return o.data as RuleSection[];

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data as RuleSection[];
    if (Array.isArray(d.sections)) return d.sections as RuleSection[];
    if (Array.isArray(d.items)) return d.items as RuleSection[];
  }

  if (Array.isArray(o.sections)) return o.sections as RuleSection[];
  if (Array.isArray(o.items)) return o.items as RuleSection[];

  return [];
}

function normalizeText(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function findRuleSection(
  ruleSections: RuleSection[],
  sectionId: string,
  sectionTitle: string,
  sectionIndex: number,
): RuleSection | undefined {
  const byId = ruleSections.find((rs) => String(rs?._id || "") === sectionId);
  if (byId) return byId;

  const normalizedTitle = normalizeText(sectionTitle);
  if (normalizedTitle) {
    const byTitle = ruleSections.find((rs) => {
      const t = normalizeText(rs?.title || rs?.name);
      return t !== "" && t === normalizedTitle;
    });
    if (byTitle) return byTitle;
  }

  return ruleSections[sectionIndex];
}

function buildSectionRuleText(section: RuleSection | undefined): string {
  if (!section) return "";
  const lines: string[] = [];

  const sectionRules = Array.isArray(section.recommendations) ? section.recommendations : [];
  sectionRules.forEach((rule, ruleIdx) => {
    const levelLabel = `Level ${String(rule.level ?? ruleIdx + 1)}`;
    const items = Array.isArray(rule.items) ? rule.items.filter((x) => String(x || "").trim() !== "") : [];
    if (items.length > 0) {
      lines.push(`${levelLabel}:`);
      items.forEach((item) => lines.push(`- ${item}`));
    }
  });

  const layers = Array.isArray(section.layers) ? section.layers : [];
  layers.forEach((layer, layerIdx) => {
    const layerTitle = layer.title || `Layer ${layerIdx + 1}`;
    const items = Array.isArray(layer.recommendations)
      ? layer.recommendations.filter((x) => String(x || "").trim() !== "")
      : [];
    if (items.length > 0) {
      lines.push(`${layerTitle}:`);
      items.forEach((item) => lines.push(`- ${item}`));
    }
  });

  return lines.join("\n").trim();
}

function buildSectionExistingText(section: any): string {
  if (!section || typeof section !== "object") return "";
  const lines: string[] = [];

  const sectionRules = Array.isArray(section.recommendations) ? section.recommendations : [];
  sectionRules.forEach((rule: any, idx: number) => {
    const levelLabel = `Level ${String(rule?.level ?? idx + 1)}`;
    const items = Array.isArray(rule?.items)
      ? rule.items.filter((x: unknown) => String(x || "").trim() !== "")
      : [];
    if (items.length > 0) {
      lines.push(`${levelLabel}:`);
      items.forEach((item: unknown) => lines.push(`- ${String(item)}`));
    } else if (rule?.message && String(rule.message).trim()) {
      lines.push(`${levelLabel}:`);
      lines.push(`- ${String(rule.message).trim()}`);
    }
  });

  const layers = Array.isArray(section.layers) ? section.layers : [];
  layers.forEach((layer: any, idx: number) => {
    const layerRecs = Array.isArray(layer?.recommendations)
      ? layer.recommendations.filter((x: unknown) => String(x || "").trim() !== "")
      : [];
    if (layerRecs.length > 0) {
      const layerTitle = String(layer?.title || `Layer ${idx + 1}`);
      lines.push(`${layerTitle}:`);
      layerRecs.forEach((item: unknown) => lines.push(`- ${String(item)}`));
    }
  });

  return lines.join("\n").trim();
}

function buildLayerTextForScore(section: RuleSection | undefined, score: number | undefined): string {
  if (!section || score === undefined || score === null) return "";

  // Priority 1: level-based recommendations matching the score exactly
  const sectionRules = Array.isArray(section.recommendations) ? section.recommendations : [];
  const matchingRule = sectionRules.find((r) => {
    const rLevel = typeof r.level === "number" ? r.level : Number(r.level);
    return !isNaN(rLevel) && rLevel === score;
  });
  if (matchingRule) {
    const items = Array.isArray(matchingRule.items)
      ? matchingRule.items.filter((x) => String(x || "").trim() !== "")
      : [];
    if (items.length > 0) return items.map((item) => `- ${item}`).join("\n");
  }

  // Priority 2: layers array indexed by score (score is 1-based → index = score - 1)
  const layers = Array.isArray(section.layers) ? section.layers : [];
  const layerIndex = score - 1;
  if (layerIndex >= 0 && layerIndex < layers.length) {
    const layer = layers[layerIndex];
    const items = Array.isArray(layer.recommendations)
      ? layer.recommendations.filter((x) => String(x || "").trim() !== "")
      : [];
    if (items.length > 0) {
      const lines: string[] = [];
      if (layer.title) lines.push(`${layer.title}:`);
      items.forEach((item) => lines.push(`- ${item}`));
      return lines.join("\n");
    }
  }

  return "";
}

function parseRecommendationItemsFromText(message: string): string[] {
  return message
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s*/, "").trim())
    .filter((line) => line !== "" && !/^level\s+\d+\s*:$/i.test(line) && !/^layer\s+\d+\s*:$/i.test(line));
}

function toNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value.trim());
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function extractUserAnswerSections(body: unknown): Array<{ sectionId: string; sectionScore?: number; recommendations: string[] }> {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return sections.map((s: any) => ({
    sectionId: String(s?.sectionId ?? s?._id ?? s?.id ?? ""),
    sectionScore:
      toNumberOrUndefined(s?.sectionScore) ??
      toNumberOrUndefined(s?.score) ??
      toNumberOrUndefined(s?.totalScore),
    recommendations: Array.isArray(s?.recommendations)
      ? s.recommendations.filter((x: unknown) => String(x || "").trim() !== "").map((x: unknown) => String(x))
      : [],
  }));
}

function extractRecommendationPreview(body: unknown): Array<{ sectionId: string; score?: number; recommendations: string[] }> {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = root.data;
  const list = Array.isArray(data)
    ? data
    : Array.isArray(root)
      ? (root as unknown[])
      : Array.isArray((data as Record<string, unknown> | undefined)?.sections)
        ? (((data as Record<string, unknown>).sections as unknown[]))
        : [];
  return list.map((row: any) => ({
    sectionId: String(row?.sectionId ?? row?._id ?? row?.id ?? ""),
    score:
      toNumberOrUndefined(row?.score) ??
      toNumberOrUndefined(row?.sectionScore) ??
      toNumberOrUndefined(row?.totalScore),
    recommendations: Array.isArray(row?.recommendations)
      ? row.recommendations.filter((x: unknown) => String(x || "").trim() !== "").map((x: unknown) => String(x))
      : [],
  }));
}

function countMenteesAssigned(item: any): number {
  // If the backend provides menteeAssigned directly, use it
  if (typeof item.menteeAssigned === "number") {
    return item.menteeAssigned;
  }

  // Otherwise, count unique userIds from assignments array
  if (Array.isArray(item.assignments) && item.assignments.length > 0) {
    const uniqueUserIds = new Set<string>();
    for (const assignment of item.assignments) {
      if (typeof assignment?.userId === "string" && assignment.userId.trim()) {
        uniqueUserIds.add(assignment.userId);
      }
    }
    return uniqueUserIds.size;
  }

  return 0;
}

export default function MentorAssessments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"normal" | "select">("normal");
  const [librarySortBy, setLibrarySortBy] = useState<"latest" | "oldest" | "name_asc" | "name_desc">("latest");
  const [pastorSortBy, setPastorSortBy] = useState<"name_asc" | "name_desc">("name_asc");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [assignAssessmentIds, setAssignAssessmentIds] = useState<string[]>([]);
  const [assignUsers, setAssignUsers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAssignUserIds, setSelectedAssignUserIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredItems, setFeaturedItems] = useState<MentorFeaturedAvatarItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "pastors">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "submitted" | "completed" | "not_started">("all");
  const [allPastorSubmissions, setAllPastorSubmissions] = useState<any[]>([]);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationSubmitting, setRecommendationSubmitting] = useState(false);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationRow[]>([]);
  const [recommendationAssessmentId, setRecommendationAssessmentId] = useState<string | null>(null);
  const [recommendationAssessmentTitle, setRecommendationAssessmentTitle] = useState("Assessment");
  const [failedBannerImageIds, setFailedBannerImageIds] = useState<Record<string, true>>({});
  const [deepLinkHandled, setDeepLinkHandled] = useState(false);
  const [submissionView, setSubmissionView] = useState<"today" | "previous">("today");

  const deepLinkMenteeId = (searchParams.get("menteeId") || "").trim();
  const deepLinkAssessmentId = (searchParams.get("assessmentId") || "").trim();
  const deepLinkOpenRecommendation = searchParams.get("openRecommendation") === "1";


  useEffect(() => {
  if (!deepLinkMenteeId) return;

  setActiveTab("pastors");
  setSelectedMenteeId((prev) =>
    prev === deepLinkMenteeId ? prev : deepLinkMenteeId
  );
}, [deepLinkMenteeId]);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formInstructions, setFormInstructions] = useState<string[]>([""]);
  const [formSections, setFormSections] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        if (selectedMenteeId) {
       
          const [assignedRes, allAssessmentsRes, progressRes, appointmentsRes] = await Promise.all([
  apiGetAssignedAssessments(selectedMenteeId),
  apiGetAssessments(),
  apiGetUserProgress(selectedMenteeId),
  apiGetAppointments({ userId: selectedMenteeId, futureOnly: false } as any),
]);

let assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);

const allAssessmentsBody: any = allAssessmentsRes?.data;

const allAssessments = Array.isArray(allAssessmentsBody?.data)
  ? allAssessmentsBody.data
  : Array.isArray(allAssessmentsBody)
    ? allAssessmentsBody
    : [];

const assignmentList = allAssessments
  .map((assessment: any) => {
    const assignment = Array.isArray(assessment?.assignments)
      ? assessment.assignments.find(
          (row: any) => String(row?.userId) === String(selectedMenteeId),
        )
      : null;

    if (!assignment) return null;

    return {
      assessment,
      assessmentId: assessment?._id || assessment?.id,
      assignmentId: assignment?._id,
      dueDate: assignment?.dueDate,
      assignedDueDate: assignment?.dueDate,
      updatedAt: assignment?.assignedAt || assessment?.updatedAt,
    };
  })
  .filter(Boolean);

const existingIds = new Set(
  assignedRows
    .map((item: any) => flattenAssignedAssessmentRow(item)?.assessmentId)
    .filter(Boolean),
);

const missingFromAssignedApi = assignmentList.filter((item: any) => {
  const id = String(item?.assessmentId || "");
  return id && !existingIds.has(id);
});

assignedRows = [...assignedRows, ...missingFromAssignedApi];
          const progressData = unwrapProgressData(progressRes);
          const assessmentProgress = Array.isArray(progressData?.assessments)
            ? progressData.assessments
            : [];
          const appointmentsBody: any = appointmentsRes?.data;
          const appointmentsList: any[] = Array.isArray(appointmentsBody)
            ? appointmentsBody
            : Array.isArray(appointmentsBody?.data)
              ? appointmentsBody.data
              : Array.isArray(appointmentsBody?.data?.data)
                ? appointmentsBody.data.data
                : [];
          const appointmentById = new Map<string, any>();
        
          const appointmentsByAssessmentId = new Map<string, any[]>();

for (const appt of appointmentsList) {
  const id = String(appt?._id ?? appt?.id ?? "").trim();
  if (id) appointmentById.set(id, appt);

  const notes = String(appt?.notes ?? "");
  const metadata = appt?.metadata || appt?.meta || {};

  const fromMetadata = String(metadata?.assessmentId ?? "").trim();

  const fromNotes =
    notes.match(/assessmentId\s*[:=]\s*([^|\s,]+)/i)?.[1]?.trim() || "";

  const linkedAssessmentId = fromMetadata || fromNotes;

  if (linkedAssessmentId) {
    const prev = appointmentsByAssessmentId.get(linkedAssessmentId) || [];
    prev.push(appt);
    appointmentsByAssessmentId.set(linkedAssessmentId, prev);
  }
}

          const idStatusRows = assessmentProgress
          
            .map((p: any) => ({
  assessmentId: extractAssessmentIdFromProgressRow(p),
  status: normalizeMentorAssessmentStatus(p?.status),
  assignmentId: p?.assignmentId ? String(p.assignmentId) : undefined,
  submittedAt: p?.submittedAt,
  completedAt: p?.completedAt,
  updatedAt: p?.updatedAt,
  createdAt: p?.createdAt,
}))
            .filter((p: { assessmentId: string }) => p.assessmentId !== "");

          const uniqById = idStatusRows.filter(
            (row: { assessmentId: string }, idx: number, arr: Array<{ assessmentId: string }>) =>
              arr.findIndex((x) => x.assessmentId === row.assessmentId) === idx,
          );

          const statusByAssessmentId = new Map(
            uniqById.map((row) => [row.assessmentId, row]),
          );

        
          const assigned = (await Promise.all(
  assignedRows.map(async (item) => {
              const flat = flattenAssignedAssessmentRow(item);
              if (!flat) return null;
              const assessment = flat.assessment as any;
              const assessmentId = String(assessment?._id ?? assessment?.id ?? flat.assessmentId ?? "");
              if (!assessmentId) return null;
              const fullAssessment = allAssessments.find(
  (a: any) => String(a?._id ?? a?.id ?? "") === assessmentId,
);
              const progressRow = statusByAssessmentId.get(assessmentId);
              const appointmentId = String(
                (item as any)?.appointmentId ?? assessment?.appointmentId ?? "",
              ).trim();
              const apptFromId = appointmentId ? appointmentById.get(appointmentId) : null;
              const apptFromAssessment = (appointmentsByAssessmentId.get(assessmentId) || [])
                .slice()
                .sort((a, b) => {
                  const ta = new Date(String(a?.meetingDate ?? 0)).getTime();
                  const tb = new Date(String(b?.meetingDate ?? 0)).getTime();
                  return tb - ta;
                })[0];
              const appt = apptFromId || apptFromAssessment || null;
              let resolvedAppointmentId = "";
              if (appt?._id != null) resolvedAppointmentId = String(appt._id).trim();
              else if (appt?.id != null) resolvedAppointmentId = String(appt.id).trim();
              else resolvedAppointmentId = String(appointmentId || "").trim();

              const storedCdp = getStoredRecommendationsForPastorAssessment(
  selectedMenteeId,
  assessmentId,
);


const hasSentCdp = storedCdp.some((rec) => rec.sent === true);




let hasSubmittedAnswers = false;

try {
  const answersRes = await apiGetUserAnswers(
    assessmentId,
    selectedMenteeId,
  );

  hasSubmittedAnswers = Boolean((answersRes?.data as any)?.data?._id);
} catch {
  hasSubmittedAnswers = false;
}

const progressStatus = progressRow?.status || "not_started";

let normalizedStatus: MentorAssessmentStatus = "not_started";


const hasMeetingDetails = Boolean(resolvedAppointmentId || appt?.meetingDate);

if (hasMeetingDetails && hasSentCdp) {
  normalizedStatus = "completed";
} else if (
  hasSubmittedAnswers ||
  progressStatus === "submitted" ||
  progressStatus === "completed"
) {
  normalizedStatus = "submitted";
}
              const resolvedDueDate = pickAssignedDueDate(item, flat);
              
console.log("CDP CHECK:", {
  pastorId: selectedMenteeId,
  assessmentId,
  assessmentName: assessment?.name,
  storedCdp,
  hasSentCdp,
});
             return {
  ...assessment,
  _id: assessmentId,
  id: assessmentId,
  _mentorHasSentCdp: hasSentCdp,
_mentorCreatedAt:
  (item as any)?.assignedAt ||
  flat?.updatedAt ||
  flat?.assignedAt ||
  fullAssessment?.createdAt ||
  assessment?.createdAt ||
  fullAssessment?.updatedAt ||
  assessment?.updatedAt,

_mentorCreatedBy:
  assessment?.createdByName ||
  fullAssessment?.createdByName ||
  (typeof assessment?.createdBy === "string" ? assessment.createdBy : "") ||
  (typeof fullAssessment?.createdBy === "string" ? fullAssessment.createdBy : "") ||
  assessment?.createdBy?.name ||
  fullAssessment?.createdBy?.name ||
  assessment?.createdBy?.email ||
  fullAssessment?.createdBy?.email ||
  assessment?.assignedByName ||
  fullAssessment?.assignedByName ||
  "Director",
_mentorSubmittedAt:
  (progressRow as any)?.submittedAt ||
  (progressRow as any)?.completedAt ||
  (progressRow as any)?.updatedAt ||
  assessment?.submittedAt ||
  assessment?.updatedAt,

  _mentorAssignmentStatus: normalizedStatus,
                _mentorAssignmentId: flat.assignmentId ?? progressRow?.assignmentId,
                _mentorDueDate: resolvedDueDate,
                _mentorAppointmentId: resolvedAppointmentId || undefined,
                _mentorMeetingDate: appt?.meetingDate,
                _mentorMeetingDateLabel: formatMeetingDateTime(appt?.meetingDate),
                _mentorMeetingStatus: String(appt?.status ?? ""),
                _mentorMeetingActive: resolvedAppointmentId
                  ? isMeetingStillActive(appt?.meetingDate, appt?.status)
                  : false,
                menteeAssigned: countMenteesAssigned(assessment),
              };
            // })
            // .filter((value): value is any => value != null);
              })
)).filter((value): value is any => value != null);
const assignedWithCdp = await Promise.all(
  assigned.map(async (assessment: any) => {
    try {
      const recRes = await apiGetSectionRecommendations(
        assessment._id,
        selectedMenteeId,
      );

      const body: any = recRes.data;
      const data = body?.data ?? body;

    
  const hasRecommendationContent = (node: any): boolean => {
    if (!node) return false;

    if (typeof node === "string") return node.trim() !== "";

    if (Array.isArray(node)) {
      return node.some((item) => hasRecommendationContent(item));
    }

    if (typeof node !== "object") return false;

    if (node.sent === true || node.status === "sent") return true;

    const contentKeys = ["message", "text", "cdp", "mentorCdp", "recommendation"];
    if (contentKeys.some((key) => hasRecommendationContent(node[key]))) return true;

    if (
      Array.isArray(node.recommendations) &&
      node.recommendations.some((rec: any) =>
        typeof rec === "string" ? rec.trim() !== "" : rec != null || hasRecommendationContent(rec),
      )
    ) {
      return true;
    }

    if (Array.isArray(node.sections) && node.sections.some((section: any) => hasRecommendationContent(section))) {
      return true;
    }

    if (Array.isArray(node.layers) && node.layers.some((layer: any) => hasRecommendationContent(layer))) {
      return true;
    }

    return false;
  };

  const hasBackendCdp = hasRecommendationContent(data);

const finalHasCdp = assessment._mentorHasSentCdp || hasBackendCdp;
const hasMeetingDetails = Boolean(
  assessment._mentorAppointmentId || assessment._mentorMeetingDate
);

return {
  ...assessment,
  _mentorHasSentCdp: finalHasCdp,
  _mentorAssignmentStatus:
    hasMeetingDetails && finalHasCdp
      ? "completed"
      : assessment._mentorAssignmentStatus,
};
 
    } catch {
      return assessment;
    }
  }),
);
          const q = searchTerm.trim().toLowerCase();
         
          const filteredAssigned = !q
  ? assignedWithCdp
  : assignedWithCdp.filter((a: any) => {
              const name = String(a?.name || "").toLowerCase();
              const desc = String(a?.description || "").toLowerCase();
              return name.includes(q) || desc.includes(q);
            });
          setAssessments(filteredAssigned);
        } else {
          const res = await apiGetAssessments({
            search: searchTerm || undefined,
          });
          const parsed = parseAssessmentsListPayload(res.data);
        
          const withMenteeCounts = parsed.map((item: any) => ({
  ...item,
  createdOn: item.createdOn || item.createdAt || item.updatedAt,
  createdBy: item.createdBy || item.createdByName || "Director",
  menteeAssigned: countMenteesAssigned(item),
}));
          setAssessments(withMenteeCounts);
        }
      } catch (err) {
        console.error("Failed to load assessments", err);
        setAssessments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [searchTerm, selectedMenteeId]);

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;
    if (!mentorId) {
      setFeaturedItems([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setFeaturedLoading(true);
        const res = await apiGetAssignedUsers(mentorId);
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : [];
        const mapped: MentorFeaturedAvatarItem[] = list.map((u: any, idx: number) => ({
          id: String(u._id ?? u.id ?? idx),
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Pastor",
          img: isHttpUrl(u.profilePicture) ? u.profilePicture : UserProfile,
          email: u.email,
          phoneNumber: u.phoneNumber,
          phone: u.phone,
        }));
        if (!cancelled) setFeaturedItems(mapped);
      } catch (err) {
        console.error("Failed to load featured mentees", err);
        if (!cancelled) setFeaturedItems([]);
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!showAssignDrawer) {
      setAssignUsers([]);
      setAssignSearch("");
      setAssignDueDate("");
      setSelectedAssignUserIds([]);
      setAssignAssessmentIds([]);
      return;
    }

    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;
    if (!mentorId) return;

    let cancelled = false;
    (async () => {
      try {
        setAssignLoading(true);
        const res = await apiGetAssignedUsers(mentorId);
        const raw = res.data?.data;
        const list = Array.isArray(raw) ? raw : [];
        if (!cancelled) setAssignUsers(list);
      } catch {
        if (!cancelled) setAssignUsers([]);
      } finally {
        if (!cancelled) setAssignLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showAssignDrawer]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
    };

    if (showOptionsMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  const filteredAssignUsers = useMemo(() => {
    const q = assignSearch.trim().toLowerCase();
    if (!q) return assignUsers;
    return assignUsers.filter((u: any) => {
      const name = `${u.firstName || ""} ${u.lastName || ""}`.trim().toLowerCase();
      const email = String(u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [assignUsers, assignSearch]);

  const toggleAssignUser = (userId: string) => {
    setSelectedAssignUserIds((prev) =>
      prev.includes(userId) ? prev.filter((x) => x !== userId) : [...prev, userId],
    );
  };

  const toggleSelectMode = () => {
    setMode((prev) => {
      if (prev === "select") {
        setSelectedIds([]);
        return "normal";
      }
      return "select";
    });
  };

  const openAssignDrawerForSelection = () => {
    if (selectedIds.length === 0) {
      setToastMsg("Select at least one assessment to assign.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    setAssignAssessmentIds(selectedIds);
    setShowAssignDrawer(true);
  };

  const selectAllAssessments = () => {
    if (filtered.length === 0) return;
    setMode("select");
    setSelectedIds(filtered.map(getAssessmentId).filter(Boolean));
  };

  const handleAssignSubmit = async () => {
    if (assignAssessmentIds.length === 0 || selectedAssignUserIds.length === 0) {
      setToastMsg("Select at least one pastor to assign.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    try {
      setAssignSubmitting(true);
      // for (const assessmentId of assignAssessmentIds) {
      //   await apiAssignAssessmentViaModule(assessmentId, {
      for (const assessmentId of assignAssessmentIds) {
  console.log("ASSIGNING ASSESSMENT:", {
    assessmentId,
    selectedAssignUserIds,
  });

  await apiAssignAssessmentViaModule(assessmentId, {
          userIds: selectedAssignUserIds,
          dueDate: assignDueDate ? new Date(`${assignDueDate}T23:59:59`).toISOString() : undefined,
        });
      }
      setShowAssignDrawer(false);
      setAssignDueDate("");
      setToastMsg("Assessment assigned successfully");
      setTimeout(() => setToastMsg(""), 3000);
    } catch (e) {
      console.error(e);
      setToastMsg("Failed to assign assessment");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setAssignSubmitting(false);
    }
  };

  const activeSortBy = activeTab === "pastors" ? pastorSortBy : librarySortBy;

  const filtered = useMemo(() => {
    const list = [...assessments];
    const statusFiltered =
  selectedMenteeId && statusFilter !== "all"
    ? list.filter((item) => item._mentorAssignmentStatus === statusFilter)
    : list;
    if (activeSortBy === "name_asc") {
      return statusFiltered.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
    }
    if (activeSortBy === "name_desc") {
      return statusFiltered.sort((a, b) => String(b?.name || "").localeCompare(String(a?.name || "")));
    }
    if (activeSortBy === "oldest") {
      return statusFiltered.sort(
        (a, b) =>
          new Date(String(a?.createdOn ?? a?.createdAt ?? 0)).getTime() -
          new Date(String(b?.createdOn ?? b?.createdAt ?? 0)).getTime(),
      );
    }
    return statusFiltered.sort(
      (a, b) =>
        new Date(String(b?.createdOn ?? b?.createdAt ?? 0)).getTime() -
        new Date(String(a?.createdOn ?? a?.createdAt ?? 0)).getTime(),
    );
  }, [assessments, activeSortBy, selectedMenteeId, statusFilter]);

  const todaySubmissions = useMemo(() => {
  return filtered.filter((item: any) => {
    if (
  item._mentorAssignmentStatus !== "submitted" &&
  item._mentorAssignmentStatus !== "completed"
) {
  return false;
}

 
const submittedDate = item._mentorSubmittedAt;

    return isTodayDate(submittedDate);
  });
}, [filtered]);

const previousSubmissions = useMemo(() => {
  return filtered.filter((item: any) => {
    if (
  item._mentorAssignmentStatus !== "submitted" &&
  item._mentorAssignmentStatus !== "completed"
) {
  return false;
}


    const submittedDate = item._mentorSubmittedAt;

    return submittedDate && !isTodayDate(submittedDate);
  });
}, [filtered]);

  const filteredFeaturedItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const sortPastors = (items: MentorFeaturedAvatarItem[]) =>
      [...items].sort((a, b) => {
        const left = String(a?.name || "");
        const right = String(b?.name || "");
        return pastorSortBy === "name_desc"
          ? right.localeCompare(left)
          : left.localeCompare(right);
      });
    if (!q) return sortPastors(featuredItems);
    const matched = sortPastors(
      featuredItems.filter((item) =>
        String(item?.name || "").toLowerCase().includes(q),
      ),
    );
    if (!selectedMenteeId) return matched;
    const selected = featuredItems.find((item) => String(item.id) === String(selectedMenteeId));
    if (!selected) return matched;
    return matched.some((item) => String(item.id) === String(selected.id))
      ? matched
      : [selected, ...matched];
  }, [featuredItems, pastorSortBy, searchTerm, selectedMenteeId]);
  const allTodaySubmissions = useMemo(() => {
  return allPastorSubmissions.filter((item) => isTodayDate(item.submittedAt));
}, [allPastorSubmissions]);

const allPreviousSubmissions = useMemo(() => {
  return allPastorSubmissions.filter(
    (item) => item.submittedAt && !isTodayDate(item.submittedAt),
  );
}, [allPastorSubmissions]);
useEffect(() => {
  if (activeTab !== "all" || featuredItems.length === 0 || assessments.length === 0) return;

  let cancelled = false;

  const loadAllPastorSubmissions = async () => {
    const results: any[] = [];

    for (const pastor of featuredItems) {
      for (const assessment of assessments) {
        const assessmentId = getAssessmentId(assessment);
        if (!assessmentId) continue;

        try {
          const res = await apiGetUserAnswers(assessmentId, String(pastor.id));
          const body: any = res.data;
          const answerData = body?.data;

          if (!answerData?._id) continue;
console.log("ANSWER DATE CHECK:", {
  pastor: pastor.name,
  assessment: assessment.name,
  createdAt: answerData.createdAt,
  updatedAt: answerData.updatedAt,
  submittedAt: answerData.submittedAt,
});
let hasSentCdp = false;

try {
  const recRes = await apiGetSectionRecommendations(assessmentId, String(pastor.id));
  const data: any = recRes.data?.data ?? recRes.data;

  hasSentCdp = Array.isArray(data)
    ? data.some((rec: any) => {
        const recs = Array.isArray(rec?.recommendations)
          ? rec.recommendations.filter((x: any) => String(x || "").trim())
          : [];

        return (
          rec?.sent === true ||
          rec?.status === "sent" ||
          recs.length > 0 ||
          String(rec?.message || rec?.text || "").trim() !== ""
        );
      })
    : false;
} catch {
  hasSentCdp = false;
}
          results.push({
            ...assessment,
            _id: assessmentId,
            pastorId: pastor.id,
            pastorName: pastor.name,
            // submittedAt: answerData.updatedAt || answerData.createdAt,
            submittedAt:
  answerData.submittedAt ||
  answerData.createdAt ||
  answerData.updatedAt,
  // _mentorHasSentCdp:
  // getStoredRecommendationsForPastorAssessment(
  //   String(pastor.id),
  //   assessmentId,
  // ).some((rec) => rec.sent === true),
  _mentorHasSentCdp: hasSentCdp,
          });
        } catch {
          // no answer found
        }
      }
    }

    if (!cancelled) {
      setAllPastorSubmissions(results);
    }
  };

  void loadAllPastorSubmissions();

  return () => {
    cancelled = true;
  };
}, [activeTab, featuredItems, assessments]);
  // const getCardImageSrc = (assessment: any): string | typeof Thumb1 => {
  //   const assessmentId = getAssessmentId(assessment);
  //   if (assessmentId && failedBannerImageIds[assessmentId]) return Thumb1;
  //   const src = assessment?.image;
  //   if (typeof src === "string" && src.trim()) return src;
  //   return Thumb1;
  // };
  const getCardImageSrc = (assessment: any): string | null => {
  const assessmentId = getAssessmentId(assessment);
  if (assessmentId && failedBannerImageIds[assessmentId]) return null;

  const raw = assessment?.bannerImage || assessment?.image;

  if (typeof raw === "string" && raw.trim()) {
    return resolveApiMediaUrl(raw) ?? raw;
  }

  return null;
};

  const selectedMenteeName = useMemo(() => {
    const row = featuredItems.find((item) => String(item.id) === String(selectedMenteeId || ""));
    return row?.name || "Mentee";
  }, [featuredItems, selectedMenteeId]);

  const openRecommendationEditor = async (assessment: any) => {
    if (!selectedMenteeId) return;
    const assessmentId = getAssessmentId(assessment);
    if (!assessmentId) return;

    try {
      setRecommendationLoading(true);
      const [detailRes, rulesRes, userAnswersRes, previewRes] = await Promise.allSettled([
        apiGetAssessmentById(assessmentId),
        apiGetAssessmentRecommendationRules(assessmentId),
        apiGetUserAnswers(assessmentId, selectedMenteeId),
        apiGetSectionRecommendations(assessmentId, selectedMenteeId),
      ]);

      const detail =
        detailRes.status === "fulfilled" ? parseAssessmentDetailPayload(detailRes.value.data) : null;
      const ruleSections =
        rulesRes.status === "fulfilled" ? extractRulesPayload(rulesRes.value.data) : [];
      const answerSections =
        userAnswersRes.status === "fulfilled" ? extractUserAnswerSections(userAnswersRes.value.data) : [];
      const previewSections =
        previewRes.status === "fulfilled" ? extractRecommendationPreview(previewRes.value.data) : [];

      const sections = Array.isArray(detail?.sections) ? detail.sections : [];
      const stored = getStoredRecommendationsForPastorAssessment(selectedMenteeId, assessmentId);

      const rows: RecommendationRow[] = sections.map((section: any, idx: number) => {
        const sectionId = String(section?._id || `section_${idx}`);
        const sectionTitle = String(section?.name || section?.title || `Section ${idx + 1}`);
        const existing = stored.find((s) => s.sectionId === sectionId);
        const matchedRulesSection = findRuleSection(ruleSections, sectionId, sectionTitle, idx);

        const answerSection = answerSections.find((s) => s.sectionId === sectionId);
        const answerText = (answerSection?.recommendations || []).join("\n");
        const previewSection = previewSections.find((s) => s.sectionId === sectionId);
        const previewText = (previewSection?.recommendations || []).join("\n");
        const currentScore = answerSection?.sectionScore ?? previewSection?.score;
        const layerText = buildLayerTextForScore(matchedRulesSection, currentScore);
        const existingText = existing?.sent
          ? normalizeSendableCdpMessage(existing.message, currentScore)
          : "";
        const answerCdpText = normalizeSendableCdpMessage(answerText, currentScore);
        const previewCdpText = normalizeSendableCdpMessage(previewText, currentScore);
        const generatedCdpText = normalizeSendableCdpMessage(layerText, currentScore);

        return {
          sectionId,
          sectionTitle,
          score: currentScore,
          message: existingText || answerCdpText || previewCdpText || generatedCdpText,
        };
      });

      setRecommendationRows(rows);
      setRecommendationAssessmentId(assessmentId);
      setRecommendationAssessmentTitle(String(assessment?.name || "Assessment"));
      setRecommendationOpen(true);
    } catch (err) {
      console.error("Failed to load recommendation editor", err);
      setToastMsg("Unable to load recommendations editor");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    if (!deepLinkOpenRecommendation || !deepLinkAssessmentId || !selectedMenteeId || loading || deepLinkHandled) {
      return;
    }
    if (deepLinkMenteeId && selectedMenteeId !== deepLinkMenteeId) return;
    const assessment = assessments.find((a: any) => getAssessmentId(a) === deepLinkAssessmentId);
    if (!assessment) return;
    setDeepLinkHandled(true);
    void openRecommendationEditor(assessment);
  }, [
    deepLinkOpenRecommendation,
    deepLinkAssessmentId,
    selectedMenteeId,
    loading,
    deepLinkHandled,
    deepLinkMenteeId,
    assessments,
  ]);

  const handleSendRecommendations = async () => {
    if (!selectedMenteeId || !recommendationAssessmentId) return;
    const mentor = getMentorFromCookie();
    const mentorId = String(mentor?.id ?? mentor?._id ?? "");
    const now = new Date().toISOString();
    const payloadRows = recommendationRows
      .map((row) => ({
        ...row,
        parsedItems: parseRecommendationItemsFromText(
          normalizeSendableCdpMessage(row.message, row.score),
        ),
      }))
      .filter((row) => row.parsedItems.length > 0);

    if (payloadRows.length === 0) {
      setToastMsg("Add at least one recommendation to send");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    try {
      setRecommendationSubmitting(true);

      // Persist mentor-written recommendation content for pastor recommendation pages.
      payloadRows.forEach((row) => {
        upsertStoredRecommendation({
          mentorId: mentorId || undefined,
          pastorId: selectedMenteeId,
          assessmentId: recommendationAssessmentId,
          sectionId: row.sectionId,
          sectionTitle: row.sectionTitle,
          message: row.message.trim(),
          sent: true,
          sentAt: now,
          updatedAt: now,
        });
      });

      // Send per-section recommendations using endpoint POST /assessment/:assessmentId/send-recommendation.
      const sendResults = await Promise.allSettled(
        payloadRows.map((row) =>
          apiSendSectionRecommendations(recommendationAssessmentId, {
            userId: selectedMenteeId,
            sectionId: row.sectionId,
            recommendations: row.parsedItems,
          }),
        ),
      );
      console.log("CDP SEND RESULTS:", sendResults);

      const failed = sendResults.filter((r) => r.status === "rejected").length;
      const succeeded = sendResults.length - failed;

      if (failed === sendResults.length) {
        throw new Error("All recommendation requests failed");
      }

      if (failed > 0) {
        setToastMsg(`Sent ${succeeded} recommendation section(s); ${failed} failed`);
      } else {
        setToastMsg("Recommendations sent successfully");
      }

      setRecommendationOpen(false);
      setTimeout(() => setToastMsg(""), 3000);
    } catch (err) {
      console.error(err);
      setToastMsg("Failed to send recommendations");
      setTimeout(() => setToastMsg(""), 3000);
    } finally {
      setRecommendationSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleDelete = async () => {
    try {
      await apiDeleteAssessments(selectedIds);

      setAssessments((prev) => prev.filter((a) => !selectedIds.includes(getAssessmentId(a))));

      setToastMsg(`${selectedIds.length} assessment(s) deleted`);
      setSelectedIds([]);
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim()) {
      setToastMsg("Assessment name is required");
      return;
    }

    try {
      setCreating(true);

      const payload = {
        name: formTitle,
        description: formDesc,
        instructions: formInstructions.filter((i) => i.trim() !== ""),
        sections: formSections,
        type: "CMA" as const,
      };

      const res = await apiCreateAssessment(payload);
      const created = (res.data as { data?: unknown })?.data;
      if (created && typeof created === "object") {
        setAssessments((prev) => [created, ...prev]);
      }

      setFormTitle("");
      setFormDesc("");
      setFormInstructions([""]);
      setFormSections([]);

      setShowForm(false);
      setToastMsg("Assessment created successfully");
    } catch (err) {
      console.error("Create failed", err);
      setToastMsg("Failed to create assessment");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      {/* <section
        className="relative overflow-hidden bg-cover bg-center px-0 pb-10 pt-4"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      > */}
      <section
  className="relative overflow-hidden bg-cover bg-center px-4 pb-10 pt-4 sm:px-6 lg:px-8"
  style={{ backgroundImage: `url(${HeroBg.src})` }}
>
        <div className={mentorHeroOverlay} />

        <div className="relative z-10 mx-auto w-full max-w-[1180px]">
          <h1 className="text-2xl font-semibold sm:text-3xl">Assessments</h1>
          <p className={`mt-2 ${mentorBodyText}`}>Create, assign, and review mentoring assessments.</p>
        </div>
      </section>

      {/* <main className={`${mentorMainGradient} flex-1 px-0 pb-12`}> */}
      <main className={`${mentorMainGradient} flex-1 px-4 pb-12 sm:px-6 lg:px-8`}>
        <div className="mx-auto w-full max-w-[1180px] space-y-6">
          {!showForm ? (
            <>
              <div className={`mb-6 ${mentorFilterPanel}`}>
                <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                  <div className="relative w-full flex-1 md:max-w-md">
                    <SearchBar
                      value={searchTerm}
                      onChange={setSearchTerm}
                      placeholder="Search assessments or pastors…"
                      variant="dark"
                      className="w-full"
                    />
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
  <button
    type="button"
    onClick={() => {
      setActiveTab("all");
      setLibrarySortBy("latest");
      setSelectedMenteeId(null);
    }}
    className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
      activeTab === "all"
        ? "bg-[#3498DB] text-white"
        : "text-white/75 hover:bg-white/10"
    }`}
  >
     Assessment Library
  </button>

  <button
    type="button"
    onClick={() => {
      setActiveTab("pastors");
      setPastorSortBy("name_asc");
    }}
    className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
      activeTab === "pastors"
        ? "bg-[#3498DB] text-white"
        : "text-white/75 hover:bg-white/10"
    }`}
  >
    Pastors Assessment
  </button>
</div>

                  <div className="flex flex-wrap gap-3">
                    {mode !== "select" && (
                      <>
                        <select
                          value={activeSortBy}
                          onChange={(e) => {
                            if (activeTab === "pastors") {
                              setPastorSortBy(e.target.value as "name_asc" | "name_desc");
                            } else {
                              setLibrarySortBy(e.target.value as "latest" | "oldest" | "name_asc" | "name_desc");
                            }
                          }}
                          className="h-[42px] min-w-[170px] rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white outline-none transition focus:border-[#8ec5eb]/55 focus:ring-2 focus:ring-[#8ec5eb]/30 [&>option]:bg-[#062946] [&>option]:text-white"
                          aria-label="Sort assessments"
                        >
                          {activeTab === "all" && (
                            <>
                              <option value="latest">Newest</option>
                              <option value="oldest">Oldest</option>
                            </>
                          )}
                          <option value="name_asc">Name A-Z</option>
                          <option value="name_desc">Name Z-A</option>
                        </select>
                        {activeTab === "all" && (
                          <>
                            <button
                              type="button"
                              onClick={toggleSelectMode}
                              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/15"
                            >
                              <i className="fa-solid fa-check-square" />
                              Select
                            </button>
                            <button
                              type="button"
                              onClick={() => router.push("/mentor/MentorAssessments/create")}
                              className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-4 py-2 font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                            >
                              <i className="fa-solid fa-plus" />
                              Add
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {mode === "select" && (
                <div className={`${mentorFilterPanel} flex flex-wrap items-center justify-between gap-4 p-5`}>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="font-semibold text-white">{selectedIds.length} selected</span>
                    <button
                      type="button"
                      onClick={selectAllAssessments}
                      className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:bg-white/15"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={openAssignDrawerForSelection}
                      disabled={selectedIds.length === 0}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-4 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <i className="fa-solid fa-user-plus text-xs" />
                      Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={selectedIds.length === 0}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 transition hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                    <button
                      type="button"
                      onClick={toggleSelectMode}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
                    >
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
                    <p className="font-semibold text-white">Loading assessments…</p>
                  </div>
                </div>
              ) : (
                <>
                  {activeTab === "pastors" && !featuredLoading && filteredFeaturedItems.length > 0 && (
                    <div className={`mb-6 ${mentorFilterPanel} px-4 py-3 sm:px-5`}>
                      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-snug text-[#cde2f2]/90">
                            Select a mentee below to view their assigned assessments.
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                          {selectedMenteeId && (
                            <button
                              type="button"
                              onClick={() => setSelectedMenteeId(null)}
                              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                            >
                              Clear filter
                            </button>
                          )}
                        </div>
                      </div>
                      <FeaturedAvatars
                        items={filteredFeaturedItems}
                        showDivider={false}
                        className="mb-0"
                        sizePx={72}
                        gapClass="gap-6 sm:gap-8"
                        selectedId={selectedMenteeId}
                        onItemClick={(item) => setSelectedMenteeId(String(item.id))}
                      />
                    </div>
                  )}
                  {activeTab === "pastors" && !selectedMenteeId && (
  <div className="mb-6">
    <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
      Pastor Profiles
    </h2>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {filteredFeaturedItems.map((pastor) => {
        const email = String(pastor.email || "");
        const phoneRaw = String(pastor.phoneNumber || pastor.phone || "");
        const phoneHref = phoneRaw.replace(/[^\d+]/g, "");
        const whatsappHref = phoneRaw.replace(/[^\d]/g, "");
        const hasPhoneNumber = /\d/.test(phoneRaw);

        return (
        // <div key={pastor.id} className={`${mentorFilterPanel} flex items-center gap-5 p-5`}>
        //   <Image
        //     src={pastor.img || UserProfile}
        //     alt=""
        //     width={96}
        //     height={96}
        //     className="h-24 w-24 rounded-xl object-cover"
        //     unoptimized={typeof pastor.img === "string" && isRemoteImageSrc(pastor.img)}
        //   />

        //   <div className="min-w-0 flex-1">
        //     <h3 className="text-lg font-bold text-white">{pastor.name}</h3>
        //     <p className="text-sm text-white/60">Pastor</p>
        //   </div>

        //   <button
        //     type="button"
        //     onClick={() => setSelectedMenteeId(String(pastor.id))}
        //     className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
        //   >
        //     View
        //   </button>
        // </div>
        <div key={pastor.id} className={`${mentorFilterPanel} relative flex items-center gap-5 p-5`}>
  <div className="options-menu-container absolute right-4 top-4">
    <button
      type="button"
      onClick={() =>
        setShowOptionsMenu(showOptionsMenu === String(pastor.id) ? null : String(pastor.id))
      }
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 hover:bg-white/15"
    >
      <i className="fa-solid fa-ellipsis-vertical" />
    </button>

    {showOptionsMenu === String(pastor.id) && (
      <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-white/15 bg-[#041f35] py-2 shadow-xl">
        <button
          type="button"
          onClick={() => {
            setShowOptionsMenu(null);
            router.push(`/mentor/MentorSchedule?recipientType=pastor&pastorId=${pastor.id}`);
          }}
          className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
        >
          <i className="fa-regular fa-calendar-plus text-[#8ec5eb]" />
          Schedule Meeting
        </button>
      </div>
    )}
  </div>

  <Image
    src={pastor.img || UserProfile}
    alt=""
    width={96}
    height={96}
    className="h-24 w-24 rounded-xl object-cover"
    unoptimized={typeof pastor.img === "string" && isRemoteImageSrc(pastor.img)}
  />

  <div className="min-w-0 flex-1">
    <h3 className="text-lg font-bold text-white">{pastor.name}</h3>
    <p className="text-sm text-white/60">Pastor</p>

    <div className="mt-4 flex items-center gap-2">
      <a
        href={`mailto:${email}?subject=Community Change Assessment`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
        aria-label="Email pastor"
      >
        <i className="fa-regular fa-envelope" />
      </a>

      {hasPhoneNumber ? (
        <a
          href={`tel:${phoneHref}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
          aria-label="Call pastor"
        >
          <i className="fa-solid fa-phone" />
        </a>
      ) : (
        <span className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
          <i className="fa-solid fa-phone" />
        </span>
      )}

      {whatsappHref ? (
        <a
          href={`https://wa.me/${whatsappHref}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
          aria-label="WhatsApp pastor"
        >
          <i className="fa-brands fa-whatsapp" />
        </a>
      ) : (
        <span className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
          <i className="fa-brands fa-whatsapp" />
        </span>
      )}

      {hasPhoneNumber ? (
        <a
          href={`sms:${phoneHref}`}
          onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
          aria-label="Message pastor"
        >
          <i className="fa-regular fa-comment-dots" />
        </a>
      ) : (
        <span className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
          <i className="fa-regular fa-comment-dots" />
        </span>
      )}
    </div>
  </div>

  <button
    type="button"
    onClick={() => setSelectedMenteeId(String(pastor.id))}
    className="mr-12 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
  >
    View
  </button>
</div>
        );
      })}
    </div>
  </div>
)}
                  {/* {selectedMenteeId && (
  <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div className={`${mentorFilterPanel} p-5`}>
      <h3 className="mb-3 text-base font-semibold text-white">
        Today&apos;s Submissions
      </h3>

      {todaySubmissions.length > 0 ? (
        <div className="space-y-3">
          {todaySubmissions.map((assessment: any, idx: number) => (
            <div
              key={`today-submission-${getAssessmentId(assessment) || idx}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-sm font-semibold text-white">
                {assessment.name || "Assessment"}
              </p>
              <p className="mt-1 text-xs text-[#cde2f2]/75">
                Submitted by {selectedMenteeName}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}`,
                    )
                  }
                  className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  View Result
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
                    )
                  }
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Send CDP
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#cde2f2]/70">
          No assessments submitted today.
        </p>
      )}
    </div>

    <div className={`${mentorFilterPanel} p-5`}>
      <h3 className="mb-3 text-base font-semibold text-white">
        Previous Submissions
      </h3>

      {previousSubmissions.length > 0 ? (
        <div className="space-y-3">
          {previousSubmissions.map((assessment: any, idx: number) => (
            <div
              key={`previous-submission-${getAssessmentId(assessment) || idx}`}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <p className="text-sm font-semibold text-white">
                {assessment.name || "Assessment"}
              </p>
              <p className="mt-1 text-xs text-[#cde2f2]/75">
                Submitted by {selectedMenteeName}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}`,
                    )
                  }
                  className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  View Result
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
                    )
                  }
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Send CDP
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#cde2f2]/70">
          No previous submissions found.
        </p>
      )}
    </div>
  </div>
)} */}
{activeTab === "all" && !selectedMenteeId && (
  // <div className="mb-4 flex justify-end">
  //   <button
  //     type="button"
  //     onClick={() => router.push("/mentor/MentorAssessments/meetings")}
  //     className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[#9b5cff] bg-[#123a5a]/65 px-5 text-sm font-semibold text-white shadow-[0_0_10px_rgba(155,92,255,0.28)] transition hover:bg-[#173f62]/75 hover:shadow-[0_0_14px_rgba(155,92,255,0.38)]"
  //   >
  //     <i className="fa-regular fa-calendar-check" />
  //     Scheduled Meetings
  //   </button>
  // </div>
  <div className="mb-4 flex justify-end">
  <div className="flex flex-col items-end">
    <button
      type="button"
      onClick={() => router.push("/mentor/MentorAssessments/meetings")}
      className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border-2 border-[#9b5cff] bg-[#123a5a]/65 px-5 text-sm font-semibold text-white shadow-[0_0_10px_rgba(155,92,255,0.28)] transition hover:bg-[#173f62]/75 hover:shadow-[0_0_14px_rgba(155,92,255,0.38)]"
    >
      <i className="fa-regular fa-calendar-check" />
      Scheduled Meetings
    </button>

    <p className="mt-2 text-xs font-medium text-white/65">
      Meetings scheduled after assessment submissions.
    </p>
  </div>
</div>
)}
{activeTab === "all" && !selectedMenteeId && (
  <section className={`${mentorFilterPanel} mb-6 p-5`}>
    <div className="mb-4 flex items-center justify-between gap-4">
      {/* <div>
        <h3 className="text-lg font-semibold text-white">
          {submissionView === "today" ? "Today's Submissions" : "Previous Submissions"}
        </h3>

        <button
          type="button"
          onClick={() => router.push("/mentor/MentorAssessments/submissions")}
          className="mt-1 text-xs font-semibold text-[#8ec5eb] hover:underline"
        >
          View all
        </button>
      </div> */}
      <div className="flex flex-wrap items-center gap-3">
  <h3 className="text-lg font-semibold text-white">
    {submissionView === "today" ? "Today's Submissions" : "Previous Submissions"}
  </h3>

  <button
    type="button"
    onClick={() => router.push("/mentor/MentorAssessments/submissions")}
    className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-1.5 text-sm font-semibold text-[#b9e2ff] transition hover:bg-[#8ec5eb]/25"
  >
    View all
  </button>
</div>

      {/* <button
        type="button"
        onClick={() =>
          setSubmissionView((prev) => (prev === "today" ? "previous" : "today"))
        }
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 text-white transition hover:bg-[#8ec5eb]/25"
      >
        <i className="fa-solid fa-arrow-right" />
      </button> */}
      <div className="flex items-center gap-3">
  <span className="text-base font-extrabold tracking-wide text-white drop-shadow-sm">
  {submissionView === "today" ? "Go to previous submissions" : "Go to today’s submissions"}
</span>

  <button
    type="button"
    onClick={() =>
      setSubmissionView((prev) => (prev === "today" ? "previous" : "today"))
    }
    className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 text-white transition hover:bg-[#8ec5eb]/25"
  >
    <i className={`fa-solid ${submissionView === "today" ? "fa-arrow-right" : "fa-arrow-left"}`} />
  </button>
</div>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {(submissionView === "today" ? allTodaySubmissions : allPreviousSubmissions)
        .slice(0, 2)
        .map((assessment: any, idx: number) => (
          <div
            key={`${submissionView}-${assessment._id}-${assessment.pastorId}-${idx}`}
            className="flex min-h-[112px] flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4"
          >
            <p className="text-sm font-semibold text-white">
              {assessment.name || "Assessment"}
            </p>

            <p className="mt-1 text-xs font-semibold text-amber-200">
              Submitted by {assessment.pastorName}
            </p>

            <div className="mt-auto flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${assessment.pastorId}`,
                  )
                }
                className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
              >
                View Result
              </button>

              <button
                type="button"
                onClick={() =>
                  
                    // `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${assessment.pastorId}&editRecommendation=1`,
                    router.push(
assessment._mentorHasSentCdp
  ? `/mentor/MentorAssessments/result/cdp?assessmentId=${assessment._id}&userId=${assessment.pastorId}`
  : `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${assessment.pastorId}&editRecommendation=1`
                    )          
                }
                className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                {assessment._mentorHasSentCdp ? "Customized Development Plan " : "Send Customized Development Plan"}
              </button>
            </div>
          </div>
        ))}

      {(submissionView === "today" ? allTodaySubmissions : allPreviousSubmissions).length === 0 && (
        <p className="col-span-full py-6 text-sm text-[#cde2f2]/70">
          No {submissionView === "today" ? "assessments submitted today" : "previous submissions found"}.
        </p>
      )}
    </div>
  </section>
)}
{(activeTab === "all" || selectedMenteeId) && (
  <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-white sm:text-xl">
                      {selectedMenteeId ? `${selectedMenteeName}'s Assessments` : " Assessment Library"}
                    </h2>
                    {selectedMenteeId && (
  <select
    value={statusFilter}
    onChange={(e) =>
      setStatusFilter(e.target.value as "all" | "submitted" | "completed" | "not_started")
    }
    className="h-[42px] min-w-[170px] rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none [&>option]:bg-[#062946] [&>option]:text-white"
  >
    <option value="all">All Status</option>
    <option value="submitted">Submitted</option>
    <option value="completed">Completed</option>
    <option value="not_started">Not Started</option>
  </select>
)}
                  </div>
                  {filtered.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {filtered.map((assessment: any, idx: number) => (
                    <div
                      key={getAssessmentId(assessment) || `assessment-${idx}`}
                      className={`relative ${directorListCardRadius} transition-all ${directorGlassCard} ${selectedIds.includes(getAssessmentId(assessment))
                          ? "bg-[#f59e0b]/15 border-transparent"
                          : "border border-white/10"
                        }`}
                    >
                      {mode !== "select" && (
                        <div className="options-menu-container absolute right-4 top-4 z-[60]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const cardId = getAssessmentId(assessment);
                              setShowOptionsMenu((prev) => (prev === cardId ? null : cardId));
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                            aria-label="Assessment options"
                          >
                            <i className="fa-solid fa-ellipsis-vertical" />
                          </button>

                          {showOptionsMenu === getAssessmentId(assessment) && (
                            <div className="absolute right-0 z-[200] mt-2 w-52 animate-slide-down overflow-hidden rounded-lg border border-white/15 bg-[#041f35]/98 py-2 shadow-xl backdrop-blur-md">
                              {selectedMenteeId ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={!assessment._mentorAppointmentId || !assessment._mentorMeetingActive}
                                    onClick={() => {
                                      setShowOptionsMenu(null);
                                      if (!assessment._mentorAppointmentId || !assessment._mentorMeetingActive) return;
                                      router.push(`/mentor/MentorSchedule/${encodeURIComponent(assessment._mentorAppointmentId)}`);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 disabled:hover:bg-transparent"
                                  >
                                    <i className="fa-regular fa-calendar-check text-[#8ec5eb]" />
                                    <span className="flex flex-col">
                                      <span>View Meeting</span>
                                      <span className="text-[11px] text-white/65">
                                        {assessment._mentorMeetingDateLabel || "No meeting details"}
                                      </span>
                                    </span>
                                  </button>

                                  {(assessment._mentorAssignmentStatus === "submitted" ||
                                    assessment._mentorAssignmentStatus === "completed") && (
//                                       <button
//                                         type="button"
//                                         onClick={() => {
//                                           setShowOptionsMenu(null);
//                                           // router.push(
//                                           //   `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
//                                           // );
//                                           router.push(
//   assessment._mentorHasSentCdp
//     ? `/mentor/MentorAssessments/result/cdp?assessmentId=${assessment._id}&userId=${selectedMenteeId}`
//     : `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
// );
//                                         }}
//                                         className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/10"
//                                       >
//                                         <i className="fa-regular fa-clipboard text-[#8ec5eb]" />
//                                         {assessment._mentorHasSentCdp ? "Customized Development Plan " : "Send Customized Development Plan"}
//                                       </button>
<button
  type="button"
  disabled={!assessment._mentorHasSentCdp && !assessment._mentorAppointmentId}
  onClick={() => {
    setShowOptionsMenu(null);

    if (!assessment._mentorHasSentCdp && !assessment._mentorAppointmentId) {
      setToastMsg("Schedule a meeting before sending CDP.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    router.push(
      assessment._mentorHasSentCdp
        ? `/mentor/MentorAssessments/result/cdp?assessmentId=${assessment._id}&userId=${selectedMenteeId}`
        : `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
    );
  }}
  className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 disabled:hover:bg-transparent"
></button>
                                    )}
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const id = getAssessmentId(assessment);
                                      if (!id) return;
                                      setAssignAssessmentIds([id]);
                                      setShowAssignDrawer(true);
                                      setShowOptionsMenu(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/10"
                                  >
                                    <i className="fa-solid fa-user-plus text-[#8ec5eb]" />
                                    Assign to
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const id = getAssessmentId(assessment);
                                      if (!id) return;
                                      setShowOptionsMenu(null);
                                      router.push(`/mentor/MentorAssessments/${id}/edit`);
                                    }}
                                    className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left text-sm text-white/90 transition hover:bg-white/10"
                                  >
                                    <i className="fa-solid fa-pen text-[#8ec5eb]" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const id = getAssessmentId(assessment);
                                      if (!id) return;
                                      setSelectedIds([id]);
                                      setShowDeleteConfirm(true);
                                      setShowOptionsMenu(null);
                                    }}
                                    className="flex w-full items-center gap-2 border-t border-white/10 px-4 py-2 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                                  >
                                    <i className="fa-solid fa-trash" />
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {mode === "select" && (
                        <div className="absolute left-4 top-4 z-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(getAssessmentId(assessment))}
                            onChange={() => toggleSelect(getAssessmentId(assessment))}
                            className="h-5 w-5 cursor-pointer rounded accent-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/50"
                          />
                        </div>
                      )}

                      <div className="flex flex-col gap-0 p-0">
                        {/* Row 1: Image + Title + Description */}
                        <div className="flex gap-4 p-4 pr-14">
                          <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                            {/* {(() => {
                              const cardImageSrc = getCardImageSrc(assessment);
                              const assessmentId = getAssessmentId(assessment);
                              return (
                            <Image
                              src={cardImageSrc}
                              alt={assessment.name || "Assessment"}
                              fill
                              className="object-cover"
                              onError={() => {
                                if (!assessmentId) return;
                                setFailedBannerImageIds((prev) =>
                                  prev[assessmentId] ? prev : { ...prev, [assessmentId]: true },
                                );
                              }}
                              unoptimized={
                                typeof cardImageSrc === "string" &&
                                (cardImageSrc.startsWith("blob:") || isRemoteImageSrc(cardImageSrc))
                              }
                            />
                              );
                            })()} */}
                            {(() => {
  const cardImageSrc = getCardImageSrc(assessment);
  const assessmentId = getAssessmentId(assessment);

  return cardImageSrc ? (
    <Image
      src={cardImageSrc}
      alt={assessment.name || "Assessment"}
      fill
      className="object-cover"
      onError={() => {
        if (!assessmentId) return;
        setFailedBannerImageIds((prev) =>
          prev[assessmentId] ? prev : { ...prev, [assessmentId]: true },
        );
      }}
      unoptimized={
        cardImageSrc.startsWith("blob:") || isRemoteImageSrc(cardImageSrc)
      }
    />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-white/5 text-center">
      <span className="px-2 text-sm font-semibold text-white/60">
        {assessment.name || "No Image"}
      </span>
    </div>
  );
})()}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div>
                              {/* <h3 className="mb-2 text-lg font-bold text-white">{assessment.name}</h3>
                              <p className="text-sm text-white/65">{assessment.description}</p> */}
                              <h3 className="mb-1 truncate text-base font-bold text-white">{assessment.name}</h3>

<p className="line-clamp-2 min-h-[38px] text-sm leading-[19px] text-white/65">
  {assessment.description || "No description available."}
</p>

{selectedMenteeId && (
  <div className="mt-2 flex flex-wrap items-center gap-2">
    <span
      className={`inline-flex w-fit rounded-md border px-2.5 py-1 text-xs font-bold ${assessmentStatusChipClass(
        assessment._mentorAssignmentStatus,
      )}`}
    >
      {assessmentStatusLabel(assessment._mentorAssignmentStatus)}
    </span>
    <span className="inline-flex w-fit items-center gap-1 rounded-md bg-[#fff6d8] px-2.5 py-1 text-xs font-bold text-[#d38a00]">
      <i className="fa-regular fa-calendar text-[10px]" />
      Due: {formatDueDate(assessment._mentorDueDate) || "N/A"}
    </span>
  </div>
  
)}
                            </div>
                          </div>
                        </div>

{activeTab === "pastors" && selectedMenteeId ? (
  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-white/10 px-4 py-3 text-xs text-[#d9ebf8]">
    <span className="min-w-0">
      <span className="text-[#d9ebf8]/65">Created By: </span>
      <span className="font-semibold text-white">{assessment._mentorCreatedBy || "N/A"}</span>
    </span>
    <span>
      <span className="text-[#d9ebf8]/65">Created At: </span>
      <span className="font-semibold text-white">{formatCreatedDate(assessment._mentorCreatedAt) || "N/A"}</span>
    </span>
    <span className="min-w-0">
      <span className="text-[#d9ebf8]/65">Meeting: </span>
      {assessment._mentorAppointmentId ? (
        <button
          type="button"
          onClick={() => router.push(`/mentor/MentorSchedule/${encodeURIComponent(assessment._mentorAppointmentId)}`)}
          className="font-bold text-amber-200 underline-offset-2 hover:text-amber-100 hover:underline"
        >
          {assessment._mentorMeetingDateLabel ? `${assessment._mentorMeetingDateLabel} · Zoom` : "Meeting scheduled · Zoom"}
        </button>
      ) : (
        <span className="font-bold text-amber-200">
          {assessment._mentorMeetingDateLabel ? `${assessment._mentorMeetingDateLabel} · Zoom` : "N/A"}
        </span>
      )}
    </span>
  </div>
) : null}
                        

                        {selectedMenteeId ? (
                          <div className="w-full border-t border-white/10">
                            <div className="flex items-center justify-end px-6 py-4">
                              {/* <span
                                className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${assessmentStatusChipClass(
                                  assessment._mentorAssignmentStatus,
                                )}`}
                              >
                                {assessmentStatusLabel(assessment._mentorAssignmentStatus)}
                              </span> */}
                              <div className="ml-auto flex items-center gap-2">
                                {(assessment._mentorAssignmentStatus === "submitted" ||
                                  assessment._mentorAssignmentStatus === "completed") && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        router.push(
                                          `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}`,
                                        )
                                      }
                                      className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                                    >
                                      View Result
                                    </button>
                                  )}
                                {(assessment._mentorAssignmentStatus === "submitted" ||
                                  assessment._mentorAssignmentStatus === "completed") && (
//                                     <button
//                                       type="button"
//                                       onClick={() =>
//                                         // router.push(
//                                         //   `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
//                                         // )
//                                         router.push(
//   assessment._mentorHasSentCdp
//     ? `/mentor/MentorAssessments/result/cdp?assessmentId=${assessment._id}&userId=${selectedMenteeId}`
//     : `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
// )
//                                       }
//                                       className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
//                                     >
//                                       {assessment._mentorHasSentCdp ? "Customized Development Plan " : "Send Customized Development Plan"}
//                                     </button>
<button
  type="button"
  disabled={!assessment._mentorHasSentCdp && !assessment._mentorAppointmentId}
  onClick={() => {
    if (!assessment._mentorHasSentCdp && !assessment._mentorAppointmentId) {
      setToastMsg("Schedule a meeting before sending CDP.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }

    router.push(
      assessment._mentorHasSentCdp
        ? `/mentor/MentorAssessments/result/cdp?assessmentId=${assessment._id}&userId=${selectedMenteeId}`
        : `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${selectedMenteeId}&editRecommendation=1`,
    );
  }}
  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/10"
>
  {assessment._mentorHasSentCdp ? "Customized Development Plan " : "Send Customized Development Plan"}
</button>
                                  )}
                                {/* <button
                                  type="button"
                                  onClick={() =>
                                    router.push(`/mentor/MentorAssessments/${assessment.id}?viewUser=${selectedMenteeId}`)
                                  }
                                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                                >
                                  View
                                </button> */}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Row 2: Metadata + Button */}
                            <div className="border-t border-white/10">
                              <div className="flex items-center justify-between gap-4 px-6 py-4">
                                <div className="grid grid-cols-3 gap-8 flex-1">
                                  <div className="text-center">
                                    <p className="text-xs text-white/60 mb-1">Created on</p>
                                    <p className="text-sm font-semibold text-white">{formatCreatedDate(assessment.createdOn) || "N/A"}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-white/60 mb-1">Created by</p>
                                    <p className="text-sm font-semibold text-white">{assessment.createdBy || "Director"}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-white/60 mb-1">Mentees Assigned</p>
                                    <p className="text-sm font-semibold text-white">{assessment.menteeAssigned || 0}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/mentor/MentorAssessments/${assessment._id}`)}
                                  className="shrink-0 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                                >
                                  View / Edit
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                  ) : (
                <div className={`mx-auto max-w-md px-8 py-14 text-center ${mentorGlassCardRoadmap} rounded-xl border border-white/10`}>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
                    <i className="fa-regular fa-folder-open text-2xl text-[#8ec5eb]" />
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {selectedMenteeId
                      ? "No assessments assigned to this pastor."
                      : "No assessments found"}
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    {selectedMenteeId
                      ? "Assign assessments from the full list when needed."
                      : "Try another search or create an assessment with Add."}
                  </p>
                               </div>
                  )}
  </>
)}
                </>
              )}
            </>
          ) : (
            <>
              <div className="text-white">
                <h2 className="mb-8 text-2xl font-semibold text-white">Create – Assessment</h2>

                <form onSubmit={handleCreate} className="space-y-8">
                  <div>
                    <label className="mb-2 block font-medium text-[#cde2f2]">Name of Assessment</label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Enter Name of Survey"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-medium text-[#cde2f2]">Description</label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Brief Description for Thumbnail"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="font-medium text-[#cde2f2]">General Instructions for the Assessment</label>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                      >
                        <i className="fa-solid fa-info-circle" /> Instruction
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={formInstructions[0]}
                      onChange={(e) => setFormInstructions([e.target.value])}
                      placeholder="Enter Instructions"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>

                  <div className={mentorFilterPanel}>
                    <div className="mb-4 flex items-center justify-between">
                      <label className="font-medium text-[#cde2f2]">Sections</label>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                      >
                        <i className="fa-solid fa-plus" /> Add
                      </button>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Enter Name of Survey"
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                      />
                      <textarea
                        rows={2}
                        placeholder="Enter Guidelines"
                        className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                      />

                      {[
                        "Layer 1",
                        "Layer 2",
                        "Layer 1 - Customized Development Plans",
                        "Layer 2 - Customized Development Plans",
                      ].map((layer, i) => (
                        <div key={i} className="space-y-3 rounded-xl border border-white/15 p-4">
                          <div className="flex items-center justify-between">
                            <label className="font-medium text-[#cde2f2]">{layer}</label>
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white"
                            >
                              <i
                                className={`fa-solid ${layer.includes("Plan") ? "fa-file-alt" : "fa-list"}`}
                              />
                              {layer.includes("Plan") ? "Plan" : "Choice"}
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="Choice 1"
                            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-3 block font-medium text-[#cde2f2]">Upload Image</label>
                    <div className="rounded-xl border-2 border-dashed border-white/25 py-10 text-center text-[#cde2f2]">
                      <p>Drag & Drop or Click here to choose file</p>
                      <p className="mt-1 text-xs text-white/50">Max file size: 10MB</p>
                    </div>
                  </div>

                  <div className="flex justify-center gap-6 pt-8">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="rounded-xl border border-white/25 bg-white/10 px-8 py-2.5 font-medium text-white hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      className="rounded-xl bg-[#ffd84e] px-8 py-2.5 font-semibold text-[#062946] disabled:opacity-50"
                    >
                      {creating ? "Creating..." : "Create Survey"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </main>

      <MentorModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete assessments?"
        footer={
          <>
            <button
              type="button"
              className={mentorModalBtnSecondary}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="w-full rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto"
              onClick={handleDelete}
            >
              Delete
            </button>
          </>
        }
      >
        <p>
          This will permanently delete {selectedIds.length} assessment
          {selectedIds.length === 1 ? "" : "s"}. This action cannot be undone.
        </p>
      </MentorModal>

      {toastMsg && (
        <div className="animate-fade-in fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-white/20 bg-[#0a3558] px-4 py-2 text-sm text-white shadow-lg">
          <i className="fa-solid fa-check text-[#8ec5eb]" />
          {toastMsg}
        </div>
      )}

      {showAssignDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-transparent"
            onClick={() => setShowAssignDrawer(false)}
          />
          <div className="relative flex h-full w-full max-w-md flex-col border-l border-white/15 bg-[#062946] shadow-2xl">
            <div className={`mx-4 mt-4 border-b border-white/10 px-6 py-5 ${mentorGlassCardFrost}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Assign assessment{assignAssessmentIds.length === 1 ? "" : "s"}
                  </h3>
                  <p className="mt-1 text-xs text-[#cde2f2]/80">Choose pastors (mentees) to receive this survey.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssignDrawer(false)}
                  className="text-[#8ec5eb] hover:text-white"
                >
                  <i className="fa-solid fa-xmark text-xl" />
                </button>
              </div>
            </div>

            <div className="border-b border-white/10 p-4">
              <MentorSearchBar
                variant="absolute"
                value={assignSearch}
                onChange={setAssignSearch}
                placeholder="Search pastors by name or email…"
                aria-label="Search pastors to assign"
                className="w-full"
              />
              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-white">Due date</span>
                <input
                  type="date"
                  value={toDateInputValue(assignDueDate) || assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/30"
                />
              </label>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {assignLoading && (
                <p className="py-8 text-center text-sm text-[#cde2f2]">Loading your mentees…</p>
              )}
              {!assignLoading && filteredAssignUsers.length === 0 && (
                <p className="py-8 text-center text-sm text-[#cde2f2]">
                  No mentees match your search, or none are assigned to you yet.
                </p>
              )}
              {!assignLoading &&
                filteredAssignUsers.map((u: any, idx: number) => {
                  const uid = String(u._id ?? u.id ?? "");
                  const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Pastor";
                  const pic = isHttpUrl(u.profilePicture) ? u.profilePicture : null;
                  return (
                    <label
                      key={uid || idx}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 p-3 transition hover:bg-white/5"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAssignUserIds.includes(uid)}
                        onChange={() => toggleAssignUser(uid)}
                        className="h-5 w-5 accent-[#8ec5eb]"
                      />
                      {pic ? (
                        <Image
                          src={pic}
                          alt=""
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded-full border border-white/20 object-cover"
                          unoptimized
                        />
                      ) : (
                        <ApiAvatarPlaceholder
                          label={u.firstName || name}
                          className="h-10 w-10 shrink-0 rounded-full border border-white/20"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-white">{name}</div>
                        <div className="truncate text-xs text-[#cde2f2]/70">{u.email || u.role || ""}</div>
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="border-t border-white/10 px-6 py-4">
              <p className="mb-3 text-xs text-[#cde2f2]/80">
                {selectedAssignUserIds.length} selected
              </p>
              <button
                type="button"
                disabled={assignSubmitting || selectedAssignUserIds.length === 0}
                onClick={handleAssignSubmit}
                className="w-full rounded-xl bg-[#8ec5eb]/90 py-2.5 font-semibold text-[#062946] hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {assignSubmitting ? "Assigning…" : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {recommendationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-transparent"
            onClick={() => setRecommendationOpen(false)}
          />
          <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#062946] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Edit and send recommendations</h3>
                <p className="mt-1 text-xs text-[#cde2f2]/80">
                  {selectedMenteeName} • {recommendationAssessmentTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRecommendationOpen(false)}
                className="text-[#8ec5eb] hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto p-6">
              {recommendationLoading ? (
                <p className="text-sm text-[#cde2f2]">Loading recommendations editor…</p>
              ) : recommendationRows.length === 0 ? (
                <p className="text-sm text-[#cde2f2]">No sections found for this assessment.</p>
              ) : (
                recommendationRows.map((row, idx) => (
                  <div key={row.sectionId || idx} className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#8ec5eb]">{row.sectionTitle}</p>
                      {typeof row.score === "number" && (
                        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-[#cde2f2]">
                          Score: {row.score}
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={4}
                      value={row.message}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRecommendationRows((prev) =>
                          prev.map((item, i) => (i === idx ? { ...item, message: value } : item)),
                        );
                      }}
                      placeholder="Write recommendation for this section"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setRecommendationOpen(false)}
                className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={recommendationSubmitting || recommendationLoading}
                onClick={handleSendRecommendations}
                className="rounded-lg bg-[#8ec5eb]/90 px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recommendationSubmitting ? "Sending..." : "Send to mentee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
