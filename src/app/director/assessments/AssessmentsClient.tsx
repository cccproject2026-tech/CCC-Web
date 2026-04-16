"use client";
import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorListCardRadius,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
  directorToastClass,
} from "../directorUi";
import { DirectorFilterSection, DirectorSlideOver } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
import AssessmentBg from "../../Assets/assessment-bg.png";
import Thumb1 from "../../Assets/thumb1.png";
import Mentor1 from "../../Assets/mentor1.png";
import {
  apiGetAssessmentRecommendationRules,
  apiGetAssessmentById,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
  apiSendSectionRecommendations,
  apiDeleteAssessments,
  apiGetAssessments,
  parseAssessmentDetailPayload,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiAssignAssessment, apiGetUserProgress } from "@/app/Services/progress.service";
import { emitPastorAssignmentsChanged } from "@/app/utils/progress-sync";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import FeaturedAvatars, { FeaturedAvatarItem } from "@/app/Components/FeaturedAvatars";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { getStoredRecommendationsForPastorAssessment, upsertStoredRecommendation } from "@/app/utils/assessment-recommendations";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
    const msg = data?.message ?? data?.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length && typeof msg[0] === "string") return msg[0];
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

type AssignUserRow = {
  id: string;
  name: string;
  role?: string;
  avatar: string | typeof Mentor1;
};

const AVATAR_PAGE_SIZE = 10;

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

type DirectorAssessmentStatus = "not_started" | "submitted" | "completed";

function normalizeDirectorAssessmentStatus(raw: unknown): DirectorAssessmentStatus {
  const s = String(raw || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "submitted") return "submitted";
  if (s === "completed" || s === "reviewed") return "completed";
  return "not_started";
}

function statusChipClass(status: DirectorAssessmentStatus): string {
  if (status === "completed") return "border-emerald-300/40 bg-emerald-400/20 text-emerald-100";
  if (status === "submitted") return "border-amber-300/40 bg-amber-400/20 text-amber-100";
  return "border-white/20 bg-white/10 text-[#cde2f2]";
}

function statusLabel(status: DirectorAssessmentStatus): string {
  if (status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  return "Not Started";
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

function extractUserAnswerSections(body: unknown): Array<{ sectionId: string; sectionScore?: number; recommendations: string[] }> {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
  const sections = Array.isArray(data.sections) ? data.sections : [];
  return sections.map((s: any) => ({
    sectionId: String(s?.sectionId ?? ""),
    sectionScore: typeof s?.sectionScore === "number" ? s.sectionScore : undefined,
    recommendations: Array.isArray(s?.recommendations)
      ? s.recommendations.filter((x: unknown) => String(x || "").trim() !== "").map((x: unknown) => String(x))
      : [],
  }));
}

function extractRecommendationPreview(body: unknown): Array<{ sectionId: string; score?: number; recommendations: string[] }> {
  const root = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const data = root.data;
  const list = Array.isArray(data) ? data : Array.isArray(root) ? (root as unknown[]) : [];
  return list.map((row: any) => ({
    sectionId: String(row?.sectionId ?? ""),
    score: typeof row?.score === "number" ? row.score : undefined,
    recommendations: Array.isArray(row?.recommendations)
      ? row.recommendations.filter((x: unknown) => String(x || "").trim() !== "").map((x: unknown) => String(x))
      : [],
  }));
}

const mapUserToAssignUser = (user: any): AssignUserRow => ({
  id: String(user.id ?? user._id ?? ""),
  name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User",
  role: user.role,
  avatar: user.profilePicture || Mentor1,
});

function AssessmentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignUserFromQuery = searchParams.get("assignUser");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AssignUserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [featuredItems, setFeaturedItems] = useState<FeaturedAvatarItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);
  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(null);
  const [avatarPage, setAvatarPage] = useState(1);
  const [avatarTotalPages, setAvatarTotalPages] = useState(1);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationSubmitting, setRecommendationSubmitting] = useState(false);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationRow[]>([]);
  const [recommendationAssessmentId, setRecommendationAssessmentId] = useState<string | null>(null);
  const [recommendationAssessmentTitle, setRecommendationAssessmentTitle] = useState("Assessment");
  const lastAssignBootstrap = useRef<string | null>(null);

  const selectedMenteeName = useMemo(() => {
    const row = featuredItems.find((item) => String(item.id) === String(selectedMenteeId || ""));
    return row?.name || "Mentee";
  }, [featuredItems, selectedMenteeId]);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);
        setListError(null);

        if (selectedMenteeId) {
          const progressRes = await apiGetUserProgress(selectedMenteeId);
          const progressData = unwrapProgressData(progressRes);
          const assessmentProgress = Array.isArray(progressData?.assessments)
            ? progressData.assessments
            : [];

          const idStatusRows = assessmentProgress
            .map((p: any) => ({
              assessmentId: extractAssessmentIdFromProgressRow(p),
              status: normalizeDirectorAssessmentStatus(p?.status),
            }))
            .filter((p: { assessmentId: string }) => p.assessmentId !== "");

          const uniqById = idStatusRows.filter(
            (row: { assessmentId: string }, idx: number, arr: Array<{ assessmentId: string }>) =>
              arr.findIndex((x) => x.assessmentId === row.assessmentId) === idx,
          );

          const details = await Promise.allSettled(
            uniqById.map(async (row: { assessmentId: string; status: DirectorAssessmentStatus }) => {
              const detailRes = await apiGetAssessmentById(row.assessmentId);
              const detail = parseAssessmentDetailPayload(detailRes.data);
              if (!detail) return null;
              const raw = (detail as any)?.bannerImage;
              const resolved = (typeof raw === "string" ? resolveApiMediaUrl(raw) ?? raw : null) || Thumb1;
              return {
                ...(detail as any),
                id: String((detail as any)._id ?? row.assessmentId),
                image: resolved,
                title: String((detail as any).name ?? (detail as any).title ?? "Untitled"),
                _selectedPastorStatus: row.status,
              };
            }),
          );

          const assigned = details
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
            .map((r) => r.value)
            .filter((v) => v != null);

          const q = searchQuery.trim().toLowerCase();
          const filteredAssigned = !q
            ? assigned
            : assigned.filter((a: any) => {
                const title = String(a?.title || "").toLowerCase();
                const desc = String(a?.description || "").toLowerCase();
                return title.includes(q) || desc.includes(q);
              });
          setAssessments(filteredAssigned);
        } else {
          const res = await apiGetAssessments({
            search: searchQuery || undefined,
          });

          const body = res?.data;
          const list = parseAssessmentsListPayload(body);
          const mapped: any[] = [];
          for (const item of list) {
            const rawItem = item as unknown as Record<string, unknown>;
            const rawId = rawItem._id ?? rawItem.id;
            const id = rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";
            if (!id) continue;

            const raw = rawItem.bannerImage;
            const resolved =
              (typeof raw === "string" ? resolveApiMediaUrl(raw) ?? raw : null) || Thumb1;
            const titleRaw =
              (typeof rawItem.name === "string" && rawItem.name.trim() ? rawItem.name : null) ??
              (typeof rawItem.title === "string" && rawItem.title.trim() ? rawItem.title : null);
            mapped.push({
              id,
              title: titleRaw ?? "Untitled",
              description: typeof rawItem.description === "string" ? rawItem.description : "",
              image: resolved,
              type: rawItem.type,
            });
          }

          setAssessments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch assessments", error);
        setAssessments([]);
        setListError(getApiErrorMessage(error, "Could not load assessments. Check your connection and try again."));
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [searchQuery, selectedMenteeId]);

  useEffect(() => {
    let cancelled = false;

    const fetchFeaturedPastors = async () => {
      try {
        setFeaturedLoading(true);
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          page: avatarPage,
          limit: AVATAR_PAGE_SIZE,
        });

        const inner = res?.data?.data as unknown;
        let listUsers: unknown[] = [];
        let totalPages = 1;
        if (inner && typeof inner === "object") {
          const o = inner as unknown as Record<string, unknown>;
          if (Array.isArray(o.users)) listUsers = o.users;
          else if (Array.isArray(o.rows)) listUsers = o.rows;

          const tp = Number(o.totalPages);
          const total = Number(o.total);
          if (Number.isFinite(tp) && tp > 0) {
            totalPages = Math.max(1, Math.floor(tp));
          } else if (Number.isFinite(total) && total > 0) {
            totalPages = Math.max(1, Math.ceil(total / AVATAR_PAGE_SIZE));
          }
        }

        const mapped: FeaturedAvatarItem[] = (listUsers as any[])
          .map((u: any, idx: number) => ({
            id: String(u?._id ?? u?.id ?? idx),
            name: `${u?.firstName || ""} ${u?.lastName || ""}`.trim() || "Pastor",
            img: u?.profilePicture || Mentor1,
          }))
          .filter((x) => String(x.id).trim() !== "");

        if (!cancelled) {
          setFeaturedItems(mapped);
          setAvatarTotalPages(totalPages);
        }
      } catch (err) {
        console.error("Failed to fetch featured pastors", err);
        if (!cancelled) {
          setFeaturedItems([]);
          setAvatarTotalPages(1);
        }
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    };

    fetchFeaturedPastors();

    return () => {
      cancelled = true;
    };
  }, [avatarPage]);

  useEffect(() => {
    if (!assignUserFromQuery) return;
    if (lastAssignBootstrap.current === assignUserFromQuery) return;
    lastAssignBootstrap.current = assignUserFromQuery;
    setSelectedUsers([assignUserFromQuery]);
    setIsSelectionMode(true);
    setToast("Select assessments, then tap Assigned to.");
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [assignUserFromQuery]);

  useEffect(() => {
    if (!showAssignModal) return;

    const fetchPastors = async () => {
      try {
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          search: userSearch || undefined,
          page: 1,
          limit: 20,
        });

        const inner = res?.data?.data;
        let listUsers: unknown[] = [];
        if (inner && typeof inner === "object") {
          const o = inner as unknown as Record<string, unknown>;
          if (Array.isArray(o.users)) listUsers = o.users;
          else if (Array.isArray(o.rows)) listUsers = o.rows;
        }
        setUsers(listUsers.map(mapUserToAssignUser).filter((u) => u.id));
      } catch (err) {
        console.error("Failed to fetch pastors", err);
        setUsers([]);
      }
    };

    fetchPastors();
  }, [showAssignModal, userSearch]);

  const handleSelectAssessment = (id: string) => {
    setSelectedAssessments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedAssessments(
      selectedAssessments.length === assessments.length
        ? []
        : assessments.map((a) => a.id)
    );
  };

  const handleSelectMode = () => {
    setIsSelectionMode(true);
    setSelectedAssessments([]);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssessments([]);
  };

  const handleAssign = async () => {
    const userIds = selectedUsers.map(String).filter(Boolean);
    const assessmentIds = selectedAssessments.map(String).filter(Boolean);
    if (!userIds.length || !assessmentIds.length) {
      setToast("Select at least one user and one assessment");
      return;
    }

    try {
      setLoading(true);

      for (const assessmentId of assessmentIds) {
        await apiAssignAssessment({
          userIds,
          assessmentIds: [assessmentId],
        });
      }

      emitPastorAssignmentsChanged(userIds);

      setShowAssignModal(false);
      setIsSelectionMode(false);
      setSelectedUsers([]);
      setSelectedAssessments([]);

      setToast("Assessment assigned successfully");
    } catch (error) {
      console.error("Assignment failed", error);
      setToast(getApiErrorMessage(error, "Failed to assign assessment"));
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssessments.length) return;

    try {
      setLoading(true);

      await apiDeleteAssessments(selectedAssessments);

      setAssessments((prev) => prev.filter((a) => !selectedAssessments.includes(a.id)));

      setToast(`${selectedAssessments.length} assessment(s) deleted`);
      setShowDeleteModal(false);
      setIsSelectionMode(false);
      setSelectedAssessments([]);
    } catch (err) {
      console.error(err);
      setToast("Failed to delete assessments");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredAssessments = assessments.filter((assessment) =>
    String(assessment.title ?? "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const openRecommendationEditor = async (assessment: any) => {
    if (!selectedMenteeId) return;
    const assessmentId = String(assessment?.id ?? "");
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
      setRecommendationAssessmentTitle(String(assessment?.title || "Assessment"));
      setRecommendationOpen(true);
    } catch (err) {
      console.error("Failed to load recommendation editor", err);
      setToast("Unable to load recommendations editor");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRecommendationLoading(false);
    }
  };

  const handleSendRecommendations = async () => {
    if (!selectedMenteeId || !recommendationAssessmentId) return;
    const now = new Date().toISOString();
    const payloadRows = recommendationRows
      .map((row) => ({
        ...row,
        parsedItems: parseRecommendationItemsFromText(row.message),
      }))
      .filter((row) => row.parsedItems.length > 0);

    if (payloadRows.length === 0) {
      setToast("Add at least one recommendation to send");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      setRecommendationSubmitting(true);

      payloadRows.forEach((row) => {
        upsertStoredRecommendation({
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
        setToast(`Sent ${succeeded} recommendation section(s); ${failed} failed`);
      } else {
        setToast("Recommendations sent successfully");
      }

      setRecommendationOpen(false);
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast("Failed to send recommendations");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRecommendationSubmitting(false);
    }
  };

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

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Assessments"
        subtitle="Create, edit, and assign assessments to pastors."
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments" },
        ]}
      />

      <section className="relative py-8">
        <div className={directorPageContainer}>
          <DirectorFilterSection>
            <div className="relative w-full flex-1 md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search assessments…"
                variant="dark"
                className="w-full"
              />
              {listError ? (
                <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm text-red-100">
                  {listError}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              {!isSelectionMode ? (
                <>
                  <button type="button" onClick={handleSelectMode} className={directorBtnSecondary}>
                    <i className="fa-solid fa-check-square"></i>
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/director/assessments/create")}
                    className={directorBtnPrimary}
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAssessments.length === 0) {
                      setToast("Select at least one assessment first.");
                      setTimeout(() => setToast(null), 3500);
                      return;
                    }
                    setShowAssignModal(true);
                  }}
                  className={directorBtnPrimary}
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Assigned to
                </button>
              )}
            </div>
          </DirectorFilterSection>

          {!featuredLoading && featuredItems.length > 0 && (
            <div className={`mb-6 p-5 ${directorGlassCard}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-white/75">
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
              <div className="mt-3 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAvatarPage((prev) => Math.max(1, prev - 1))}
                  disabled={featuredLoading || avatarPage <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Previous avatar page"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <span className="text-xs text-white/75">
                  Page {avatarPage} / {avatarTotalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setAvatarPage((prev) => Math.min(avatarTotalPages, prev + 1))}
                  disabled={featuredLoading || avatarPage >= avatarTotalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Next avatar page"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>
            </div>
          )}

          {isSelectionMode && (
            <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-5 ${directorGlassCard}`}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-white">
                  {selectedAssessments.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
                >
                  Select All
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedAssessments.length === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          {loadingAssessments ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className={directorSpinner} />
                <p className="font-semibold text-white">Loading assessments…</p>
              </div>
            </div>
          ) : filteredAssessments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`relative ${directorListCardRadius} border border-white/10 transition-all ${directorGlassCard} ${
                    selectedAssessments.includes(assessment.id) ? "ring-2 ring-[#8ec5eb]/60" : ""
                  }`}
                >
                  {isSelectionMode && (
                    <div className="absolute left-4 top-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={() => handleSelectAssessment(assessment.id)}
                        className="h-5 w-5 cursor-pointer rounded accent-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/50"
                      />
                    </div>
                  )}

                  {!isSelectionMode && (
                    <div className="options-menu-container absolute right-4 top-4 z-[60]">
                      <button
                        type="button"
                        onClick={() =>
                          setShowOptionsMenu(
                            showOptionsMenu === assessment.id ? null : assessment.id
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                      {showOptionsMenu === assessment.id && (
                        <div className="absolute right-0 z-[200] mt-2 w-48 animate-slide-down rounded-lg border border-white/15 bg-[#041f35]/98 py-2 shadow-xl backdrop-blur-md">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssessments([assessment.id]);
                              setShowAssignModal(true);
                              setShowOptionsMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                          >
                            <i className="fa-solid fa-user-plus text-[#8ec5eb]"></i>
                            Assign to
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowOptionsMenu(null);
                              router.push(`/director/assessments/${assessment.id}`);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                          >
                            <i className="fa-solid fa-pen text-[#8ec5eb]"></i>
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAssessments([assessment.id]);
                              setShowDeleteModal(true);
                              setShowOptionsMenu(null);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-300 hover:bg-red-500/10"
                          >
                            <i className="fa-solid fa-trash"></i>
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 p-6">
                    <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                      <Image
                        src={assessment.image || Thumb1}
                        alt={assessment.title}
                        fill
                        className="object-cover"
                        unoptimized={
                          typeof assessment.image === "string" &&
                          (assessment.image.startsWith("blob:") || isRemoteImageSrc(assessment.image))
                        }
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h3 className="mb-2 text-lg font-bold text-white">{assessment.title}</h3>
                        <p className="text-sm text-white/65">{assessment.description}</p>
                        {selectedMenteeId && (
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-white/65">Status</span>
                            <span
                              className={`rounded-md border px-2 py-1 font-medium ${statusChipClass(
                                (assessment._selectedPastorStatus as DirectorAssessmentStatus) || "not_started",
                              )}`}
                            >
                              {statusLabel(
                                (assessment._selectedPastorStatus as DirectorAssessmentStatus) || "not_started",
                              )}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap justify-end gap-2">
                        {selectedMenteeId &&
                          ((assessment._selectedPastorStatus as DirectorAssessmentStatus) === "submitted" ||
                            (assessment._selectedPastorStatus as DirectorAssessmentStatus) === "completed") && (
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/director/assessments/result?assessmentId=${encodeURIComponent(String(assessment.id))}&userId=${encodeURIComponent(selectedMenteeId)}`,
                                )
                              }
                              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                            >
                              View Result
                            </button>
                          )}

                        {selectedMenteeId &&
                          ((assessment._selectedPastorStatus as DirectorAssessmentStatus) === "submitted" ||
                            (assessment._selectedPastorStatus as DirectorAssessmentStatus) === "completed") && (
                            <button
                              type="button"
                              onClick={() => openRecommendationEditor(assessment)}
                              className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                            >
                              Edit Recommendation
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() => router.push(`/director/assessments/${assessment.id}`)}
                          className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                        >
                          View / edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`mx-auto max-w-md px-8 py-14 text-center ${directorGlassCard}`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <i className="fa-regular fa-folder-open text-2xl text-[#8ec5eb]" />
              </div>
              <p className="text-lg font-semibold text-white">No assessments found</p>
              <p className="mt-2 text-sm text-white/60">
                Try another search or create an assessment with Add.
              </p>
            </div>
          )}
        </div>
      </section>

      <DirectorSlideOver
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign to"
        footer={
          <div>
            <p className="mb-3 text-center text-sm text-gray-600">
              {selectedUsers.length === 0
                ? "Select one or more pastors."
                : `${selectedUsers.length} pastor${selectedUsers.length === 1 ? "" : "s"} selected`}
            </p>
            <button
              type="button"
              onClick={handleAssign}
              disabled={selectedUsers.length === 0 || loading}
              className="w-full rounded-lg bg-[#2E3B8E] px-6 py-3 font-semibold text-white transition hover:bg-[#1F2A6E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Assigning…" : "Assign"}
            </button>
          </div>
        }
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <SearchBar
            value={userSearch}
            onChange={setUserSearch}
            placeholder="Search pastors…"
            variant="light"
            className="w-full"
          />
        </div>
        <div className="px-6 py-4">
          <div className="space-y-2">
            {users.map((user) => (
              <label
                key={user.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  className="h-5 w-5 rounded text-[#2E3B8E] focus:ring-2 focus:ring-[#2E3B8E]"
                />
                <Image
                  src={user.avatar}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                  unoptimized={typeof user.avatar === "string" && isRemoteImageSrc(user.avatar)}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900">{user.name}</div>
                  <div className="truncate text-sm text-gray-600">{user.role}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </DirectorSlideOver>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete assessments?"
        message="The selected assessments will be removed. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        icon="fa-solid fa-trash"
        iconColor="text-red-600 bg-red-50"
        confirmColor="bg-[#2E3B8E] hover:bg-[#1F2A6E]"
        pendingConfirmText="Deleting…"
      />

      {recommendationOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
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
                <p className="mt-1 text-xs text-white/75">
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
                <p className="text-sm text-white/75">Loading recommendations editor…</p>
              ) : recommendationRows.length === 0 ? (
                <p className="text-sm text-white/75">No sections found for this assessment.</p>
              ) : (
                recommendationRows.map((row, idx) => (
                  <div key={row.sectionId || idx} className="rounded-xl border border-white/15 bg-white/5 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#8ec5eb]">{row.sectionTitle}</p>
                      {typeof row.score === "number" && (
                        <span className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[11px] text-white/80">
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

      {toast && (
        <div className="fixed right-6 top-6 z-[110] animate-fade-in">
          <div className={directorToastClass}>
            <i className="fa-solid fa-circle-check text-xl text-green-500" />
            <span className="font-semibold text-gray-800">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessmentsClient() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <div className={directorSpinner} />
            <p className="font-semibold text-white">Loading…</p>
          </div>
        </div>
      }
    >
      <AssessmentsPageContent />
    </Suspense>
  );
}
