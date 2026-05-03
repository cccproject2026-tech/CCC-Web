"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import HeroBg from "@/app/Assets/assignments-bg.png";
import UserProfile from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
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
  parseAssignedAssessmentsListBody,
  parseAssessmentDetailPayload,
  parseAssessmentsListPayload,
  apiSendSectionRecommendations,
} from "@/app/Services/assessment.service";
import { apiAssignAssessment, apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { useRouter } from "next/navigation";
import MentorModal from "@/app/Components/mentor/MentorModal";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
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
import { getStoredRecommendationsForPastorAssessment, upsertStoredRecommendation } from "@/app/utils/assessment-recommendations";

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

  // Fallback: if score-specific layer is empty, aggregate non-empty layer recommendations.
  const aggregated: string[] = [];
  layers.forEach((layer) => {
    const items = Array.isArray(layer.recommendations)
      ? layer.recommendations.filter((x) => String(x || "").trim() !== "")
      : [];
    if (items.length > 0) {
      if (layer.title) aggregated.push(`${layer.title}:`);
      items.forEach((item) => aggregated.push(`- ${item}`));
    }
  });
  if (aggregated.length > 0) return aggregated.join("\n");

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

export default function MentorAssessments() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<"normal" | "select">("normal");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [assignAssessmentId, setAssignAssessmentId] = useState<string | null>(null);
  const [assignUsers, setAssignUsers] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAssignUserIds, setSelectedAssignUserIds] = useState<string[]>([]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredItems, setFeaturedItems] = useState<FeaturedAvatarItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationSubmitting, setRecommendationSubmitting] = useState(false);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationRow[]>([]);
  const [recommendationAssessmentId, setRecommendationAssessmentId] = useState<string | null>(null);
  const [recommendationAssessmentTitle, setRecommendationAssessmentTitle] = useState("Assessment");

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
          const [assignedRes, progressRes] = await Promise.all([
            apiGetAssignedAssessments(selectedMenteeId),
            apiGetUserProgress(selectedMenteeId),
          ]);
          const assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
          const progressData = unwrapProgressData(progressRes);
          const assessmentProgress = Array.isArray(progressData?.assessments)
            ? progressData.assessments
            : [];

          const idStatusRows = assessmentProgress
            .map((p: any) => ({
              assessmentId: extractAssessmentIdFromProgressRow(p),
              status: normalizeMentorAssessmentStatus(p?.status),
              assignmentId: p?.assignmentId ? String(p.assignmentId) : undefined,
            }))
            .filter((p: { assessmentId: string }) => p.assessmentId !== "");

          const uniqById = idStatusRows.filter(
            (row: { assessmentId: string }, idx: number, arr: Array<{ assessmentId: string }>) =>
              arr.findIndex((x) => x.assessmentId === row.assessmentId) === idx,
          );

          const statusByAssessmentId = new Map(
            uniqById.map((row) => [row.assessmentId, row]),
          );

          const assigned = assignedRows
            .map((item) => {
              const flat = flattenAssignedAssessmentRow(item);
              if (!flat) return null;
              const assessment = flat.assessment as any;
              const assessmentId = String(assessment?._id ?? assessment?.id ?? flat.assessmentId ?? "");
              if (!assessmentId) return null;
              const progressRow = statusByAssessmentId.get(assessmentId);
              return {
                ...assessment,
                _id: assessmentId,
                id: assessmentId,
                _mentorAssignmentStatus: progressRow?.status || "not_started",
                _mentorAssignmentId: flat.assignmentId ?? progressRow?.assignmentId,
                _mentorDueDate: flat.dueDate,
              };
            })
            .filter((value): value is any => value != null);

          const q = searchTerm.trim().toLowerCase();
          const filteredAssigned = !q
            ? assigned
            : assigned.filter((a: any) => {
              const name = String(a?.name || "").toLowerCase();
              const desc = String(a?.description || "").toLowerCase();
              return name.includes(q) || desc.includes(q);
            });
          setAssessments(filteredAssigned);
        } else {
          const res = await apiGetAssessments({
            search: searchTerm || undefined,
          });
          setAssessments(parseAssessmentsListPayload(res.data));
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
        const mapped: FeaturedAvatarItem[] = list.map((u: any, idx: number) => ({
          id: String(u._id ?? u.id ?? idx),
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Pastor",
          img: isHttpUrl(u.profilePicture) ? u.profilePicture : UserProfile,
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
      setAssignAssessmentId(null);
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

  const handleAssignSubmit = async () => {
    if (!assignAssessmentId || selectedAssignUserIds.length === 0) {
      setToastMsg("Select at least one pastor to assign.");
      setTimeout(() => setToastMsg(""), 3000);
      return;
    }
    try {
      setAssignSubmitting(true);
      await apiAssignAssessment({
        userIds: selectedAssignUserIds,
        assessmentIds: [assignAssessmentId],
        dueDate: assignDueDate ? new Date(`${assignDueDate}T23:59:59`).toISOString() : undefined,
      });
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

  const filtered = assessments;

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
        const rulesText = buildSectionRuleText(matchedRulesSection);
        const existingFromAssessment = buildSectionExistingText(section);

        const answerSection = answerSections.find((s) => s.sectionId === sectionId);
        const answerText = (answerSection?.recommendations || []).join("\n");
        const previewSection = previewSections.find((s) => s.sectionId === sectionId);
        const previewText = (previewSection?.recommendations || []).join("\n");
        const currentScore = answerSection?.sectionScore ?? previewSection?.score;
        const layerText = buildLayerTextForScore(matchedRulesSection, currentScore);

        return {
          sectionId,
          sectionTitle,
          score: currentScore,
          message: existing?.message || answerText || previewText || layerText || existingFromAssessment || rulesText,
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

  const handleSendRecommendations = async () => {
    if (!selectedMenteeId || !recommendationAssessmentId) return;
    const mentor = getMentorFromCookie();
    const mentorId = String(mentor?.id ?? mentor?._id ?? "");
    const now = new Date().toISOString();
    const payloadRows = recommendationRows
      .map((row) => ({
        ...row,
        parsedItems: parseRecommendationItemsFromText(row.message),
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

      <section
        className="relative overflow-hidden bg-cover bg-center px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Assessments</h1>
          <p className={`mt-2 ${mentorBodyText}`}>Create, assign, and review mentoring assessments.</p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 pb-12 sm:px-8 lg:px-20`}>
        <div className="mx-auto max-w-7xl space-y-6">
          {!showForm ? (
            <>
              <div className={mentorFilterPanel}>
                <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
                  <MentorSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search assessments..."
                    aria-label="Search assessments"
                    className="w-full md:max-w-md"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setMode(mode === "select" ? "normal" : "select")}
                      className={`rounded-xl border px-5 py-2.5 text-sm font-medium transition ${mode === "select"
                        ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white"
                        : "border-white/20 bg-white/10 text-[#cde2f2] hover:bg-white/15"
                        }`}
                    >
                      <i className="fa-regular fa-pen-to-square mr-2" />
                      {mode === "select" ? "Cancel" : "Select"}
                    </button>

                    <button
                      type="button"
                      onClick={() => router.push("/mentor/MentorAssessments/create")}
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-[#8ec5eb]/90 px-6 py-2.5 text-sm font-semibold text-[#062946] shadow-md transition hover:bg-[#8ec5eb]"
                    >
                      <i className="fa-solid fa-plus" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {!featuredLoading && featuredItems.length > 0 && (
                <div className={mentorFilterPanel}>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm text-[#cde2f2]">
                      {selectedMenteeId
                        ? "Showing assigned assessments for selected mentee"
                        : "Showing all assessments"}
                    </p>
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
                  <FeaturedAvatars
                    items={featuredItems}
                    showDivider={false}
                    className="mb-0"
                    onItemClick={(item) => setSelectedMenteeId(String(item.id))}
                  />
                </div>
              )}

              {mode === "select" && (
                <div
                  className={`${mentorFilterPanel} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
                >
                  <p className="text-sm text-[#cde2f2]">
                    Selected: <span className="font-semibold text-white">{selectedIds.length}</span>
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(filtered.map(getAssessmentId).filter(Boolean))
                      }
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-100 hover:bg-red-500/30"
                    >
                      <i className="fa-solid fa-trash" /> Delete
                    </button>
                  </div>
                </div>
              )}

              {loading && <div className="py-16 text-center text-[#cde2f2]">Loading assessments…</div>}

              {!loading && filtered.length === 0 && (
                <div className={mentorEmptyPanel}>No assessments found.</div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                {filtered.map((item, index) => {
                  const aid = getAssessmentId(item);
                  return (
                    <div
                      key={aid || `row-${index}`}
                      className={`relative flex overflow-hidden ${mentorGlassCardRoadmap} ${selectedIds.includes(aid) ? "ring-2 ring-[#8ec5eb]/50" : ""
                        }`}
                    >
                      {mode === "select" && (
                        <div className="absolute right-3 top-3 z-20">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(aid)}
                            onChange={() => toggleSelect(aid)}
                            className="h-5 w-5 accent-[#8ec5eb]"
                            aria-label={`Select ${item.name || "assessment"}`}
                          />
                        </div>
                      )}

                      <div className="m-4 h-[140px] w-[180px] flex-shrink-0 overflow-hidden rounded-xl border border-white/20">
                        {isHttpUrl(item.bannerImage) ? (
                          <Image
                            src={item.bannerImage}
                            alt={item.name || "Assessment"}
                            width={180}
                            height={140}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiImagePlaceholder className="h-full w-full rounded-xl" />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between p-4 pr-3">
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-[15px] font-semibold text-white">{item.name}</h3>
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                onClick={() => setShowDropdown(showDropdown === aid ? null : aid)}
                                className="text-[#8ec5eb] hover:text-white"
                                aria-label="More actions"
                              >
                                <i className="fa-solid fa-ellipsis-vertical" />
                              </button>

                              {showDropdown === aid && (
                                <div className="absolute right-0 top-8 z-40 min-w-[9rem] rounded-xl border border-white/20 bg-[#0a3558] py-1 text-sm shadow-xl">
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#cde2f2] hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      setAssignAssessmentId(aid);
                                      setSelectedAssignUserIds([]);
                                      setShowAssignDrawer(true);
                                    }}
                                  >
                                    <i className="fa-solid fa-user-plus text-[#8ec5eb]" />
                                    Assign to
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-[#cde2f2] hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      if (aid) router.push(`/mentor/MentorAssessments/${aid}/edit`);
                                    }}
                                  >
                                    <i className="fa-regular fa-pen-to-square text-[#8ec5eb]" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-300 hover:bg-white/10"
                                    onClick={() => {
                                      setShowDropdown(null);
                                      setSelectedIds([aid]);
                                      setShowDeleteConfirm(true);
                                    }}
                                  >
                                    <i className="fa-solid fa-trash" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-[#cde2f2]/90">{item.description}</p>

                          {selectedMenteeId && (
                            <div className="mt-3 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[#cde2f2]/80">Status</span>
                                <span
                                  className={`rounded-md border px-2 py-1 font-medium ${statusChipClass(
                                    (item._mentorAssignmentStatus as MentorAssessmentStatus) || "not_started",
                                  )}`}
                                >
                                  {statusLabel(
                                    (item._mentorAssignmentStatus as MentorAssessmentStatus) || "not_started",
                                  )}
                                </span>
                              </div>
                              {formatDueDate(item._mentorDueDate) ? (
                                <div className="text-[#cde2f2]/80">
                                  Due {formatDueDate(item._mentorDueDate)}
                                </div>
                              ) : null}
                            </div>
                          )}
                        </div>
                        <div className="relative z-10 mt-3 flex flex-wrap justify-end gap-2">
                          {selectedMenteeId &&
                            ((item._mentorAssignmentStatus as MentorAssessmentStatus) === "submitted" ||
                              (item._mentorAssignmentStatus as MentorAssessmentStatus) === "completed") && (
                              <button
                                type="button"
                                onClick={() => {
                                  const aid = getAssessmentId(item);
                                  if (!aid || !selectedMenteeId) return;
                                  router.push(
                                    `/mentor/MentorAssessments/result?assessmentId=${encodeURIComponent(aid)}&userId=${encodeURIComponent(selectedMenteeId)}`,
                                  );
                                }}
                                className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                              >
                                View Result
                              </button>
                            )}

                          {selectedMenteeId &&
                            ((item._mentorAssignmentStatus as MentorAssessmentStatus) === "submitted" ||
                              (item._mentorAssignmentStatus as MentorAssessmentStatus) === "completed") && (
                              <button
                                type="button"
                                onClick={() => openRecommendationEditor(item)}
                                className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                              >
                                Send CDP
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() => {
                              if (aid) router.push(`/mentor/MentorAssessments/${aid}`);
                            }}
                            disabled={!aid}
                            className="rounded-xl bg-[#8ec5eb]/90 px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
                  <h3 className="text-lg font-semibold text-white">Assign assessment</h3>
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
