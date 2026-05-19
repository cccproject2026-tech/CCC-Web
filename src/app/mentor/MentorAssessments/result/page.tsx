"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "@/app/Assets/CMA-hero-bg.png";
import MentorHeader from "@/app/Components/MentorHeader";
import {
  apiGetAssessmentRecommendationRules,
  apiGetAssessmentById,
  apiGetUserAnswers,
  apiGetSectionRecommendations,
  apiSendSectionRecommendations,
  parseAssessmentDetailPayload,
  extractSurveySectionsForCma,
} from "@/app/Services/assessment.service";
import { getStoredRecommendationsForPastorAssessment, upsertStoredRecommendation } from "@/app/utils/assessment-recommendations";

type CdpMap = Record<string, string>;
type AnswersMap = Record<string, string>;
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

function normalizeSectionsForCmaUi(raw: unknown[]): any[] {
  return raw.map((sec: any) => ({
    ...sec,
    name: sec?.name ?? sec?.title ?? "Section",
    layers: (Array.isArray(sec?.layers) ? sec.layers : []).map((layer: any) => ({
      ...layer,
      question: layer?.question ?? layer?.title ?? layer?.name ?? "",
      choices: Array.isArray(layer?.choices)
        ? layer.choices.map((c: any, ci: number) =>
            typeof c === "string"
              ? { _id: `opt_${ci}`, label: c, value: c }
              : {
                  ...c,
                  _id: c?._id ?? c?.id ?? c?.value ?? `opt_${ci}`,
                  label: c?.label ?? c?.text ?? String(c?.value ?? ""),
                },
          )
        : [],
    })),
  }));
}

function resolveLayerKey(layer: any, sectionIndex: number, layerIndex: number): string {
  return String(layer?.layerId ?? layer?._id ?? `layer_${sectionIndex}_${layerIndex}`);
}

function choiceMatchesSelection(c: Record<string, unknown> | undefined, sel: string): boolean {
  if (!c) return false;
  const id = c._id != null ? String(c._id) : "";
  const cid = c.id != null ? String(c.id) : "";
  const val = c.value != null ? String(c.value) : "";
  const lab = c.label != null ? String(c.label) : "";
  const text = c.text != null ? String(c.text) : "";
  return sel === id || sel === cid || sel === val || sel === lab || sel === text;
}

function extractMentorCdpText(layer: Record<string, unknown> | null | undefined): string {
  if (!layer || typeof layer !== "object") return "";
  const keys = [
    "mentorCdp",
    "cdp",
    "customizedDevelopmentPlan",
    "customDevelopmentPlan",
    "mentorDevelopmentPlan",
    "developmentPlan",
    "mentorFeedback",
    "mentorMessage",
    "cdpText",
    "developmentPlanText",
    "recommendation",
    "recommendationMessage",
    "recommendationText",
    "matchedRecommendation",
    "appliedRecommendation",
    "selectedRecommendation",
    "personalizedPlan",
    "mentorNotes",
    "notes",
  ];

  for (const k of keys) {
    const v = layer[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }

  const rec = layer.recommendation;
  if (rec && typeof rec === "object" && !Array.isArray(rec)) {
    const o = rec as Record<string, unknown>;
    const m = o.message ?? o.text ?? o.label;
    if (m != null && String(m).trim()) return String(m).trim();
  }

  return "";
}

function parseRecommendationsCdpPayload(data: unknown): CdpMap {
  const out: CdpMap = {};

  if (Array.isArray(data)) {
    data.forEach((r: Record<string, unknown>) => {
      const msg = r?.message ?? r?.text ?? r?.cdp ?? r?.mentorCdp;
      const lid = r?.layerId ?? r?.layer_id ?? r?._id;
      if (lid != null && msg != null && String(msg).trim()) {
        out[String(lid)] = String(msg).trim();
      }
    });
    return out;
  }

  if (!data || typeof data !== "object") return out;

  let body = data as Record<string, unknown>;
  if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
    body = body.data as Record<string, unknown>;
  } else if (Array.isArray(body.data)) {
    return parseRecommendationsCdpPayload(body.data);
  }

  const sections = Array.isArray(body.sections) ? body.sections : [];
  sections.forEach((section: any, si: number) => {
    const layers = Array.isArray(section?.layers) ? section.layers : [];
    layers.forEach((layer: any, li: number) => {
      const text = extractMentorCdpText(layer);
      if (!text) return;
      const layerId = resolveLayerKey(layer, si, li);
      out[layerId] = text;
      const rawId = layer?.layerId ?? layer?._id ?? layer?.id;
      if (rawId != null) out[String(rawId)] = text;
    });
  });

  const recs = Array.isArray(body.recommendations) ? body.recommendations : [];
  recs.forEach((r: Record<string, unknown>) => {
    const msg = r?.message ?? r?.text ?? r?.cdp ?? r?.mentorCdp ?? r?.mentorMessage ?? r?.description;
    const lid = r?.layerId ?? r?.layer_id ?? r?.layerID ?? r?._id;
    if (lid != null && msg != null && String(msg).trim()) {
      out[String(lid)] = String(msg).trim();
    }
  });

  return out;
}

function extractUserAnswerSectionsPayload(data: unknown): any[] {
  if (Array.isArray(data)) {
    if (data.length === 0) return [];
    const first = data[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first.sections)) return first.sections as any[];
    if (first && Array.isArray(first.answers)) return first.answers as any[];
    const looksLikeSectionRows = data.every(
      (row) =>
        row &&
        typeof row === "object" &&
        ("sectionId" in (row as Record<string, unknown>) || "layers" in (row as Record<string, unknown>)),
    );
    if (looksLikeSectionRows) return data as any[];
    return [];
  }

  if (!data || typeof data !== "object") return [];

  const root = data as Record<string, unknown>;
  if (Array.isArray(root.sections)) return root.sections as any[];
  if (Array.isArray(root.answers)) return root.answers as any[];

  const d1 = root.data;
  if (Array.isArray(d1)) {
    const first = d1[0] as Record<string, unknown> | undefined;
    if (first && Array.isArray(first.sections)) return first.sections as any[];
    if (first && Array.isArray(first.answers)) return first.answers as any[];
  }

  if (d1 && typeof d1 === "object") {
    const o1 = d1 as Record<string, unknown>;
    if (Array.isArray(o1.sections)) return o1.sections as any[];
    if (Array.isArray(o1.answers)) return o1.answers as any[];

    const d2 = o1.data;
    if (d2 && typeof d2 === "object") {
      const o2 = d2 as Record<string, unknown>;
      if (Array.isArray(o2.sections)) return o2.sections as any[];
      if (Array.isArray(o2.answers)) return o2.answers as any[];
    }
  }

  return [];
}

function getLayerChoiceSelection(layer: any): string {
  const direct = layer?.selectedChoice;
  if (direct != null && String(direct).trim()) return String(direct).trim();
  if (Array.isArray(layer?.selectedValues) && layer.selectedValues[0] != null) {
    const first = String(layer.selectedValues[0]).trim();
    if (first) return first;
  }
  return "";
}

function findAnswerSection(templateSection: any, answerSections: any[], sectionIndex: number): any | undefined {
  const sid = String(templateSection?._id ?? templateSection?.id ?? "").trim();
  if (sid) {
    const byId = answerSections.find((s) => String(s?.sectionId ?? s?._id ?? s?.id ?? "").trim() === sid);
    if (byId) return byId;
  }
  return answerSections[sectionIndex];
}

function buildAnswerMapFromSections(templateSections: any[], answerSections: any[]): AnswersMap {
  const userAnswers: AnswersMap = {};

  templateSections.forEach((templateSection: any, sectionIndex: number) => {
    const answerSection = findAnswerSection(templateSection, answerSections, sectionIndex);
    const answerLayers = Array.isArray(answerSection?.layers) ? answerSection.layers : [];
    const templateLayers = Array.isArray(templateSection?.layers) ? templateSection.layers : [];

    templateLayers.forEach((templateLayer: any, layerIndex: number) => {
      const uiLayerId = resolveLayerKey(templateLayer, sectionIndex, layerIndex);
      const templateLayerId = String(templateLayer?._id ?? templateLayer?.id ?? "").trim();

      const byId = answerLayers.find(
        (l: any) =>
          String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() !== "" &&
          (String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() === uiLayerId ||
            (templateLayerId && String(l?.layerId ?? l?._id ?? l?.id ?? "").trim() === templateLayerId)),
      );

      const answerLayer = byId ?? answerLayers[layerIndex];
      if (!answerLayer) return;

      const selected = getLayerChoiceSelection(answerLayer);
      if (!selected) return;

      const selectedAsIndex = Number(selected);
      const hasNumericIndex = Number.isInteger(selectedAsIndex);
      const choices = Array.isArray(templateLayer?.choices) ? templateLayer.choices : [];
      const matchingChoice = choices.find((c: any) => choiceMatchesSelection(c as Record<string, unknown>, selected));

      if (matchingChoice) {
        userAnswers[uiLayerId] = String(
          matchingChoice?._id ?? matchingChoice?.id ?? matchingChoice?.value ?? matchingChoice?.label,
        );
      } else if (hasNumericIndex) {
        // Backend can send selectedChoice as 1-based ("1","2",...) or 0-based.
        const oneBasedIndex = selectedAsIndex - 1;
        const zeroBasedIndex = selectedAsIndex;
        const byIndex =
          oneBasedIndex >= 0 && oneBasedIndex < choices.length
            ? choices[oneBasedIndex]
            : zeroBasedIndex >= 0 && zeroBasedIndex < choices.length
              ? choices[zeroBasedIndex]
              : null;
        if (byIndex) {
        userAnswers[uiLayerId] = String(byIndex?._id ?? byIndex?.id ?? byIndex?.value ?? byIndex?.label ?? selected);
        } else {
          userAnswers[uiLayerId] = selected;
        }
      } else {
        userAnswers[uiLayerId] = selected;
      }
    });
  });

  return userAnswers;
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
    const byTitle = ruleSections.find((rs) => normalizeText(rs?.title || rs?.name) === normalizedTitle);
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

export default function MentorAssessmentResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = (searchParams.get("assessmentId") || "").trim();
  const userId = (searchParams.get("userId") || "").trim();
  const editRecommendation = (searchParams.get("editRecommendation") || "").trim() === "1";
  const viewRecommendation = (searchParams.get("viewRecommendation") || "").trim() === "1";

  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [assessmentTitle, setAssessmentTitle] = useState("Assessment Result");
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [mentorLayerCdp, setMentorLayerCdp] = useState<CdpMap>({});
  const [hasRecommendations, setHasRecommendations] = useState(false);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationSubmitting, setRecommendationSubmitting] = useState(false);
  const [recommendationRows, setRecommendationRows] = useState<RecommendationRow[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [didAutoOpenRecommendation, setDidAutoOpenRecommendation] = useState(false);

  useEffect(() => {
    if (!assessmentId || !userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);

        const detailRes = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(detailRes.data);
        const rawSections = extractSurveySectionsForCma(detail ?? undefined);
        const normalizedSections = normalizeSectionsForCmaUi(rawSections);
        if (!cancelled) {
          setSections(normalizedSections);
          setAssessmentTitle(String(detail?.name || "Assessment Result"));
        }

        const cdpMap: CdpMap = {};

        try {
          const answersRes = await apiGetUserAnswers(assessmentId, userId);
          const sectionsData = extractUserAnswerSectionsPayload(answersRes.data);
          if (!cancelled) {
            setAnswers(buildAnswerMapFromSections(normalizedSections, sectionsData));
          }

          // Check if any section has recommendations
          let hasRecs = false;
          if (Array.isArray(sectionsData)) {
            hasRecs = sectionsData.some(
              (section: any) => Array.isArray(section?.recommendations) && section.recommendations.length > 0,
            );
            if (!cancelled) {
              setHasRecommendations(hasRecs);
            }

            sectionsData.forEach((section: any, sectionIndex: number) => {
              section?.layers?.forEach((layer: any, layerIndex: number) => {
                const lid = resolveLayerKey(layer, sectionIndex, layerIndex);
                const cdp = extractMentorCdpText(layer as Record<string, unknown>);
                if (!cdp) return;
                cdpMap[lid] = cdp;
                const rawId = layer?.layerId ?? layer?._id ?? layer?.id;
                if (rawId != null) cdpMap[String(rawId)] = cdp;
              });
            });
          }
        } catch {
          if (!cancelled) setAnswers({});
        }

        try {
          const recRes = await apiGetSectionRecommendations(assessmentId, userId);
          Object.assign(cdpMap, parseRecommendationsCdpPayload(recRes.data));
        } catch {
          /* optional */
        }

        if (!cancelled) setMentorLayerCdp(cdpMap);
      } catch {
        if (!cancelled) {
          setSections([]);
          setAnswers({});
          setMentorLayerCdp({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assessmentId, userId]);

  const openRecommendationEditor = async () => {
    if (!assessmentId || !userId) return;
    try {
      setRecommendationLoading(true);
      const [detailRes, rulesRes, userAnswersRes, previewRes] = await Promise.allSettled([
        apiGetAssessmentById(assessmentId),
        apiGetAssessmentRecommendationRules(assessmentId),
        apiGetUserAnswers(assessmentId, userId),
        apiGetSectionRecommendations(assessmentId, userId),
      ]);

      const detail = detailRes.status === "fulfilled" ? parseAssessmentDetailPayload(detailRes.value.data) : null;
      const ruleSections = rulesRes.status === "fulfilled" ? extractRulesPayload(rulesRes.value.data) : [];
      const answerSections = userAnswersRes.status === "fulfilled" ? extractUserAnswerSections(userAnswersRes.value.data) : [];
      const previewSections = previewRes.status === "fulfilled" ? extractRecommendationPreview(previewRes.value.data) : [];
      const rawSections = Array.isArray(detail?.sections) ? detail.sections : [];
      const stored = getStoredRecommendationsForPastorAssessment(userId, assessmentId);

      const rows: RecommendationRow[] = rawSections.map((section: any, idx: number) => {
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
          // message: existing?.message || answerText || previewText || layerText || existingFromAssessment || rulesText,
          message: viewRecommendation
  ? existing?.message || previewText || answerText || ""
  : existing?.message ||
    answerText ||
    previewText ||
    layerText ||
    existingFromAssessment ||
    rulesText,
        };
      });

      setRecommendationRows(rows);
      setRecommendationOpen(true);
    } catch (err) {
      console.error("Failed to load recommendation editor", err);
      setToast("Unable to load recommendations editor");
      setTimeout(() => setToast(null), 3000);
    } finally {
      setRecommendationLoading(false);
    }
  };

  useEffect(() => {
    // if (!editRecommendation || didAutoOpenRecommendation) return;
    if (!(editRecommendation || viewRecommendation) || didAutoOpenRecommendation) return;
    if (!assessmentId || !userId || loading) return;
    setDidAutoOpenRecommendation(true);
    void openRecommendationEditor();
  // }, [editRecommendation, didAutoOpenRecommendation, assessmentId, userId, loading]);
  }, [editRecommendation, viewRecommendation, didAutoOpenRecommendation, assessmentId, userId, loading]);

  const handleSendRecommendations = async () => {
    if (!assessmentId || !userId) return;
    const now = new Date().toISOString();
    const payloadRows = recommendationRows
      .map((row) => ({ ...row, parsedItems: parseRecommendationItemsFromText(row.message) }))
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
          pastorId: userId,
          assessmentId,
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
          apiSendSectionRecommendations(assessmentId, {
            userId,
            sectionId: row.sectionId,
            recommendations: row.parsedItems,
          }),
        ),
      );
      // const failed = sendResults.filter((r) => r.status === "rejected").length;
      // const succeeded = sendResults.length - failed;
      const isAlreadySentError = (r: any) =>
  r.status === "rejected" &&
  String(r.reason?.response?.data?.message || "")
    .toLowerCase()
    .includes("recommendation already sent");

const failed = sendResults.filter(
  (r: any) => r.status === "rejected" && !isAlreadySentError(r),
).length;

const alreadySent = sendResults.filter(isAlreadySentError).length;

const succeeded =
  sendResults.filter((r: any) => r.status === "fulfilled").length + alreadySent;
// console.log(
//   "CDP SEND FAILED DETAILS:",
//   sendResults.map((r: any) =>
//     r.status === "rejected"
//       ? {
//           message: r.reason?.message,
//           status: r.reason?.response?.status,
//           data: r.reason?.response?.data,
//           url: r.reason?.config?.url,
//           method: r.reason?.config?.method,
//           payload: r.reason?.config?.data,
//         }
//       : r,
//   ),
// );
      // if (failed === sendResults.length) throw new Error("All recommendation requests failed");
//       if (failed === sendResults.length) {
//   // console.error("ALL CDP REQUESTS FAILED:", sendResults);
//   setToast("Failed to send CDP");
//   return;
// }
if (failed > 0 && succeeded === 0) {
  console.error("ALL CDP REQUESTS FAILED:", sendResults);
  setToast("Failed to send CDP");
  return;
}
      // setToast(
      //   failed > 0
      //     ? `Sent ${succeeded} recommendation section(s); ${failed} failed`
      //     : "Recommendations sent successfully",
      // );
      if (alreadySent > 0 && failed === 0) {
  setToast("CDP already sent");
} else if (failed > 0) {
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
const handleDownloadCdpPdf = () => {
  const rows = recommendationRows.filter((row) =>
    String(row.message || "").trim(),
  );

  if (rows.length === 0) {
    setToast("No CDP available to download");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  const html = `
    <html>
      <head>
        <title>CDP - ${assessmentTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          h2 { font-size: 16px; margin-top: 24px; }
          .score { font-size: 12px; color: #555; margin-bottom: 10px; }
          .box { border: 1px solid #ddd; padding: 14px; border-radius: 8px; white-space: pre-line; }
        </style>
      </head>
      <body>
        <h1>Customized Development Plan</h1>
        <p>${assessmentTitle}</p>
        ${rows
          .map(
            (row) => `
              <h2>${row.sectionTitle}</h2>
              ${typeof row.score === "number" ? `<div class="score">Score: ${row.score}</div>` : ""}
              <div class="box">${String(row.message).replaceAll("\n", "<br />")}</div>
            `,
          )
          .join("")}
      </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
  const selectedCount = useMemo(() => Object.keys(answers).length, [answers]);

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white antialiased">
      <MentorHeader showFullHeader={true} />

      <header
        className="relative flex min-h-[160px] items-center bg-cover bg-center bg-no-repeat px-0 py-8 text-white"
        style={{ backgroundImage: `url(${headerBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.92)_100%)]" />
        <div className="relative z-10 flex w-full items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl md:text-3xl">{assessmentTitle}</h1>
            <p className="mt-2 text-sm text-[#d9ebf8]">Mentor view of mentee submitted answers.</p>
          </div>
        </div>
      </header>

      <main className="w-full py-8 sm:py-8 md:py-10">
        {!assessmentId || !userId ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            Missing assessment or mentee information.
          </div>
        ) : loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8ec5eb] border-t-transparent" />
            Loading result...
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-[#cde2f2]">
            No sections found for this assessment.
          </div>
        ) : (
          <div className="flex flex-col gap-6 sm:flex-row">
            <aside className="w-full shrink-0 rounded-2xl border border-white/15 bg-white/5 p-4 sm:w-[320px]">
              <h2 className="mb-3 text-sm font-semibold text-[#8ec5eb]">Sections</h2>
              <p className="mb-4 text-xs text-[#cde2f2]">Answered items: {selectedCount}</p>
              <div className="space-y-2">
                {sections.map((sec, i) => (
                  <button
                    key={sec?._id || sec?.id || i}
                    type="button"
                    onClick={() => setActiveSection(i)}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                      activeSection === i
                        ? "border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
                        : "border-white/15 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                    }`}
                  >
                    <div className="text-[11px] text-[#8ec5eb]">Section {i + 1}</div>
                    <div className="line-clamp-2">{sec?.name || sec?.title || `Section ${i + 1}`}</div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="mb-5 flex justify-end">
                <button
                  type="button"
                  onClick={openRecommendationEditor}
                  className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  {viewRecommendation || hasRecommendations || Object.keys(mentorLayerCdp).length > 0 ? "CDP Sent" : "Send CDP"}
                </button>
              </div>
              <div className="space-y-5">
                {(sections[activeSection]?.layers || []).map((layer: any, layerIndex: number) => {
                  const layerId = resolveLayerKey(layer, activeSection, layerIndex);
                  return (
                    <div
                      key={layerId}
                      className="rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(12,58,95,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-5"
                    >
                      <h3 className="mb-3 text-base font-semibold text-white">
                        {layer?.question || layer?.title || "Question"}
                      </h3>

                      <div className="space-y-2">
                        {(layer?.choices || []).map((choice: any, ci: number) => {
                          const choiceKey = String(choice?._id ?? choice?.value ?? choice?.label ?? `c_${ci}`);
                          const choiceLabel = choice?.label ?? choice?.text ?? String(choice?.value ?? "");
                          const selected =
                            answers[layerId] === choiceKey ||
                            (choice?.value != null && answers[layerId] === String(choice.value)) ||
                            (choice?.label != null && answers[layerId] === String(choice.label));

                          return (
                            <label
                              key={`${layerId}-${choiceKey}-${ci}`}
                              className={`flex items-start gap-3 rounded-lg border px-2 py-1 ${
                                selected ? "border-[#8ec5eb]/40 bg-[#8ec5eb]/10" : "border-transparent"
                              }`}
                            >
                              <input
                                type="radio"
                                name={layerId}
                                checked={selected}
                                readOnly
                                disabled
                                className="mt-1 h-4 w-4 accent-[#8ec5eb]"
                              />
                              <span className="text-sm leading-relaxed text-[#e8f4fc]">{choiceLabel}</span>
                            </label>
                          );
                        })}
                      </div>

                      {(() => {
                        const fromApi =
                          mentorLayerCdp[layerId] ||
                          (layer?.layerId != null && mentorLayerCdp[String(layer.layerId)]) ||
                          (layer?._id != null && mentorLayerCdp[String(layer._id)]) ||
                          "";
                        const cdp = String(fromApi || "").trim();
                        if (!cdp) return null;
                        return (
                          <div className="mt-4 rounded-xl border border-[#8ec5eb]/35 bg-[#041f35]/80 p-4">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]">
                              Customized Development Plan (CDP)
                            </p>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-[#d9ebf8]">{cdp}</p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSection((v) => Math.max(0, v - 1))}
                  disabled={activeSection === 0}
                  className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                {activeSection === sections.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76]"
                  >
                    Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveSection((v) => Math.min(sections.length - 1, v + 1))}
                    className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76]"
                  >
                    Next
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

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
                <h3 className="text-lg font-semibold text-white">{viewRecommendation ? "Sent CDP" : "Edit and send recommendations"}</h3>
                <p className="mt-1 text-xs text-white/75">{assessmentTitle}</p>
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
                      readOnly={viewRecommendation}
                      onChange={(e) => {
                        const value = e.target.value;
                        setRecommendationRows((prev) => prev.map((item, i) => (i === idx ? { ...item, message: value } : item)));
                      }}
                      placeholder="Write recommendation for this section"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/50"
                    />
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            {viewRecommendation && (
  <button
    type="button"
    onClick={handleDownloadCdpPdf}
    className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8ec5eb]/30"
  >
    Download PDF
  </button>
)}
              <button
                type="button"
                onClick={() => setRecommendationOpen(false)}
                className="rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                Cancel
              </button>
              {/* <button
                type="button"
                disabled={recommendationSubmitting || recommendationLoading}
                onClick={handleSendRecommendations}
                className="rounded-lg bg-[#8ec5eb]/90 px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {recommendationSubmitting ? "Sending..." : "Send to mentee"}
              </button> */}
              {!viewRecommendation && (
  <button
    type="button"
    disabled={recommendationSubmitting || recommendationLoading}
    onClick={handleSendRecommendations}
    className="rounded-lg bg-[#8ec5eb]/90 px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {recommendationSubmitting ? "Sending..." : "Send to mentee"}
  </button>
)}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-6 top-6 z-[130] animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0a3558] px-4 py-3 text-white shadow-lg">
            <i className="fa-solid fa-circle-check text-[#8ec5eb]" />
            <span className="text-sm font-semibold">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
