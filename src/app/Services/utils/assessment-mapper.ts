/**
 * Maps API assessment documents to the shape used by director/mentor edit UIs.
 */

import { extractSurveySectionsForCma } from "../assessment.service";
import type {
  AssessmentSectionCreateBody,
  CreatePreSurveyEntryPayload,
} from "../types/assessment.types";

export function buildPreSurveyPayloadForDirectorCreate(
  rows: Array<{
    text: string;
    type: "text" | "number";
    placeholder: string;
  }>,
): CreatePreSurveyEntryPayload[] {
  return rows
    .filter((r) => r.text.trim().length > 0)
    .map((r) => ({
      text: r.text.trim(),
      type: r.type,
      placeholder: r.placeholder.trim() || " ",
      required: true,
    }));
}

export function buildCreateAssessmentSectionsFromWizard(
  sections: Array<{
    name: string;
    guidelines: string;
    layers: Array<{ choices: string[] }>;
    plans?: Array<{ items: string[] }>;
  }>,
): AssessmentSectionCreateBody[] {
  return sections.map((section, sIdx) => {
    const description = section.guidelines?.trim() || "No guidelines provided";
    const layers = section.layers.map((wizLayer, lIdx) => {
      const trimmed = wizLayer.choices.map((c) => c.trim()).filter(Boolean);
      const texts = trimmed.length > 0 ? trimmed : ["Option 1"];
      return {
        title: `Layer ${lIdx + 1}`,
        choices: texts.map((text) => ({ text })),
      };
    });
    const recommendations =
      section.plans?.map((plan, idx) => ({
        level: (idx + 1) as 1 | 2 | 3 | 4,
        items: plan.items.map((t) => t.trim()).filter(Boolean),
      })) ?? [];
    return {
      title: section.name.trim() || `Section ${sIdx + 1}`,
      description,
      layers,
      recommendations,
    };
  });
}

export interface Recommendation {
  id: string;
  text: string;
  selected: boolean;
}

export interface Choice {
  id: string;
  text: string;
}

export interface Layer {
  id: string;
  name: string;
  choices: Choice[];
  recommendations: Recommendation[];
}

export type LevelKey = 1 | 2 | 3 | 4;

export interface LevelPlanItem {
  id: string;
  text: string;
}

export interface LevelPlanBlock {
  id: string;
  level: LevelKey;
  items: LevelPlanItem[];
}

export interface Section {
  id: string;
  name: string;
  description: string;
  layers: Layer[];
  levelPlans?: LevelPlanBlock[];
}

function safeJsonArray<T = unknown>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const p = JSON.parse(value) as unknown;
      return Array.isArray(p) ? (p as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function resolveSectionList(data: any): any[] {
  const s = data?.sections;
  if (typeof s === "string") {
    try {
      const p = JSON.parse(s) as unknown;
      if (Array.isArray(p) && p.length > 0) return p as any[];
    } catch {
      /* ignore */
    }
  }
  if (Array.isArray(s) && s.length > 0) return s;
  const extracted = extractSurveySectionsForCma(data);
  if (Array.isArray(extracted) && extracted.length > 0) return extracted as any[];
  if (Array.isArray(s)) return s;
  return [];
}

function recTextFromRaw(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "text" in (raw as object)) {
    return String((raw as { text?: string }).text ?? "");
  }
  return String(raw ?? "");
}

function mapOneLayer(sectionKey: string, layer: any, lidx: number): Layer | null {
  if (layer == null) return null;
  if (typeof layer !== "object") return null;
  const layerId = String(layer._id ?? layer.id ?? `${sectionKey}-layer-${lidx}`);
  const name = String(layer.title ?? layer.name ?? `Layer ${lidx + 1}`) || `Layer ${lidx + 1}`;

  const chIn = safeJsonArray(layer.choices) as any[];
  let choices: Choice[] = chIn
    .map((c, cidx) => {
      if (c == null) return { id: `${layerId}-c-${cidx}`, text: "" };
      if (typeof c === "string" || typeof c === "number")
        return { id: `${layerId}-c-${cidx}`, text: String(c) };
      if (typeof c === "object")
        return {
          id: String(c._id ?? c.id ?? `${layerId}-c-${cidx}`),
          text: String(c.text ?? c.label ?? ""),
        };
      return { id: `${layerId}-c-${cidx}`, text: "" };
    })
    .filter((ch) => ch != null) as Choice[];
  if (choices.length === 0) {
    choices = [{ id: `${layerId}-c0`, text: "Option 1" }];
  }

  const recsRaw = layer.recommendations;
  const recsArr: unknown[] = Array.isArray(recsRaw)
    ? (recsRaw as unknown[])
    : typeof recsRaw === "string"
      ? safeJsonArray(recsRaw)
      : [];
  const recommendations: Recommendation[] = recsArr.map((raw, idx) => ({
    id: `${layerId}-rec-${idx}`,
    text: recTextFromRaw(raw),
    selected: false,
  }));

  return { id: layerId, name, choices, recommendations };
}

function mapLevelPlansFromApi(section: any, sectionKey: string): LevelPlanBlock[] {
  const rules: unknown = section.recommendations;
  if (!Array.isArray(rules) || rules.length === 0) return [];
  if (!rules.some((r) => r && Array.isArray((r as { items?: unknown[] }).items))) {
    return [];
  }

  const used = new Set<LevelKey>();
  const out: LevelPlanBlock[] = [];
  (rules as { level?: number; items?: unknown[] }[]).forEach((rule, idx) => {
    if (!rule || !Array.isArray(rule.items) || (rule.items as any[]).length === 0) return;
    const levelNum = Math.min(4, Math.max(1, Number(rule.level) || idx + 1)) as 1 | 2 | 3 | 4;
    if (used.has(levelNum)) return;
    const items = (rule.items as unknown[])
      .map((t) => (typeof t === "string" ? t : String(t ?? "")).trim())
      .filter((s) => s.length > 0);
    if (items.length === 0) return;
    used.add(levelNum);
    out.push({
      id: `${sectionKey}-level-${levelNum}`,
      level: levelNum,
      items: items.map((text, j) => ({
        id: `${sectionKey}-level-${levelNum}-it-${j}`,
        text,
      })),
    });
  });
  return out.sort((a, b) => a.level - b.level);
}

function mapSectionLayersFromApi(section: any, sidx: number): Layer[] {
  const sid = String(section._id ?? section.id ?? `section-${sidx}`);
  const layerRows = safeJsonArray(section?.layers) as any[];
  return layerRows
    .map((layer, lidx) => mapOneLayer(sid, layer, lidx))
    .filter((L): L is Layer => L != null);
}

export const mapAssessmentFromApi = (data: any) => {
  const sectionRows = resolveSectionList(data);
  return {
    id: data._id,
    name: data.name,
    description: data.description,
    bannerImage: data.bannerImage,
    type: data.type,
    instructions: (data.instructions ?? []).map((text: string, idx: number) => ({
      id: `inst-${idx}`,
      text,
      checked: true,
    })),
    sections: sectionRows.map((section: any, sidx: number) => {
      const sid = String(section._id ?? section.id ?? `section-${sidx}`);
      return {
        id: sid,
        name: section.title ?? section.name ?? "",
        description: section.description ?? "",
        layers: mapSectionLayersFromApi(section, sidx),
        levelPlans: mapLevelPlansFromApi(section, sid),
      };
    }),
  };
};

function buildLevelRecommendationsPayload(blocks: LevelPlanBlock[] | undefined) {
  if (!blocks?.length) return undefined;
  const payload = blocks
    .map((b) => ({
      level: b.level,
      items: b.items.map((i) => i.text.trim()).filter((t) => t.length > 0),
    }))
    .filter((r) => r.items.length > 0)
    .sort((a, b) => a.level - b.level) as { level: 1 | 2 | 3 | 4; items: string[] }[];
  return payload.length ? payload : undefined;
}

export const buildSectionsPayload = (sections: Section[]) => {
  return sections.map((section) => {
    const rec = buildLevelRecommendationsPayload(section.levelPlans ?? []);
    return {
      title: section.name,
      description: section.description,
      layers: section.layers.map((layer) => ({
        title: layer.name,
        choices: layer.choices.map((c) => ({ text: c.text })),
        recommendations: layer.recommendations.map((r) => r.text),
      })),
      /** Always send so removing all level blocks clears CDP on the server. */
      recommendations: rec ?? [],
    };
  });
};

// ─── Director create/edit wizard (4 layers, 4 CDP plan blocks) ─────────────

export const WIZARD_LAYER_COUNT = 4;

export type DirectorWizardLayer = { id: number; choices: string[]; notes: string };
export type DirectorWizardPlan = { id: number; name: string; items: string[] };

export type DirectorEditSection = {
  id: string;
  name: string;
  guidelines: string;
  layers: DirectorWizardLayer[];
  plans: DirectorWizardPlan[];
};

export function defaultWizardPlanName(levelIndex0: number): string {
  return `Level ${levelIndex0 + 1} - Customized Development Plans`;
}

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newDirectorEditSection(): DirectorEditSection {
  return {
    id: newId(),
    name: "",
    guidelines: "",
    layers: Array.from({ length: WIZARD_LAYER_COUNT }, (_, i) => ({
      id: i + 1,
      choices: [""],
      notes: "",
    })),
    plans: Array.from({ length: WIZARD_LAYER_COUNT }, (_, i) => ({
      id: i + 1,
      name: defaultWizardPlanName(i),
      items: [""],
    })),
  };
}

/**
 * Map API section model to the same 4× layer + 4× plan shape as the create-assessment page.
 * Extra API layers after the 4th are not shown; missing layers are padded.
 */
export function sectionToDirectorEditWizard(s: Section): DirectorEditSection {
  const layers: DirectorWizardLayer[] = [];
  for (let i = 0; i < WIZARD_LAYER_COUNT; i++) {
    const L = s.layers[i];
    if (L) {
      const choiceTexts = L.choices.length
        ? L.choices.map((c) => c.text)
        : [""];
      const notes = L.recommendations
        .map((r) => r.text)
        .map((t) => t.trim())
        .filter(Boolean)
        .join("\n");
      layers.push({ id: i + 1, choices: choiceTexts, notes });
    } else {
      layers.push({ id: i + 1, choices: [""], notes: "" });
    }
  }

  const plans: DirectorWizardPlan[] = [];
  for (let i = 0; i < WIZARD_LAYER_COUNT; i++) {
    const wantLevel = (i + 1) as LevelKey;
    const block = (s.levelPlans ?? []).find((b) => b.level === wantLevel);
    const items = block?.items?.length
      ? block.items.map((it) => it.text)
      : [""];
    plans.push({ id: i + 1, name: defaultWizardPlanName(i), items });
  }

  return {
    id: s.id,
    name: s.name,
    guidelines: s.description,
    layers,
    plans,
  };
}

export function directorEditWizardToSection(w: DirectorEditSection): Section {
  const levelPlans: LevelPlanBlock[] = w.plans
    .map((plan, idx) => {
      const level = (idx + 1) as LevelKey;
      const items = plan.items
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((text) => ({ id: newId(), text }));
      if (items.length === 0) return null;
      return { id: newId(), level, items };
    })
    .filter((b): b is LevelPlanBlock => b != null);

  const layers: Layer[] = w.layers.map((wl, lIdx) => {
    const trimmed = wl.choices.map((c) => c.trim());
    const texts =
      trimmed.some((c) => c.length > 0) ? trimmed.filter((c) => c.length > 0) : ["Option 1"];
    const recStrings = wl.notes
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    return {
      id: newId(),
      name: `Layer ${lIdx + 1}`,
      choices: texts.map((text, j) => ({ id: newId(), text: text || `Option ${j + 1}` })),
      recommendations: recStrings.map((text) => ({
        id: newId(),
        text,
        selected: false,
      })),
    };
  });
  return {
    id: w.id,
    name: w.name,
    description: w.guidelines,
    layers,
    levelPlans,
  };
}
