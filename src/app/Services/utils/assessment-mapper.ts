/**
 * Maps API assessment documents to the shape used by director/mentor edit UIs.
 */

import type {
  AssessmentSectionCreateBody,
  CreatePreSurveyEntryPayload,
} from "../types/assessment.types";

/**
 * Build `preSurvey` for POST /assessment — matches CCC-Director-Mobile (text / number fields, not MC choices).
 */
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

/** Build `sections` for POST /assessment from the director create wizard (mobile parity). */
export function buildCreateAssessmentSectionsFromWizard(
  sections: Array<{
    name: string;
    guidelines: string;
    layers: Array<{ choices: string[] }>;
    plans?: Array<{ items: string[] }>;
  }>,
): AssessmentSectionCreateBody[] {
  return sections.map((section, sIdx) => {
    const description =
      section.guidelines?.trim() || "No guidelines provided";
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

export interface Section {
  id: string;
  name: string;
  description: string;
  layers: Layer[];
}

export const mapAssessmentFromApi = (data: any) => ({
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

  sections: (data.sections ?? []).map((section: any, sidx: number) => ({
    id: String(section._id ?? section.id ?? `section-${sidx}`),
    name: section.title ?? section.name ?? "",
    description: section.description ?? "",

    layers: (section.layers ?? []).map((layer: any, lidx: number) => ({
      id: String(layer._id ?? layer.id ?? `layer-${lidx}`),
      name: layer.title ?? layer.name ?? "",

      choices: (layer.choices ?? []).map((c: any, cidx: number) => ({
        id: String(c._id ?? c.id ?? `choice-${cidx}`),
        text: c.text ?? c.label ?? "",
      })),

      recommendations: (layer.recommendations ?? []).map((text: string, idx: number) => ({
        id: `${String(layer._id ?? layer.id ?? "layer")}-rec-${idx}`,
        text: typeof text === "string" ? text : String(text),
        selected: false,
      })),
    })),
  })),
});

export const buildSectionsPayload = (sections: Section[]) => {
  return sections.map((section) => ({
    title: section.name,
    description: section.description,
    layers: section.layers.map((layer) => ({
      title: layer.name,
      choices: layer.choices.map((c) => ({ text: c.text })),
      recommendations: layer.recommendations.map((r) => r.text),
    })),
  }));
};
