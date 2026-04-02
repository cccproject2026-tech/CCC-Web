/**
 * Maps API assessment documents to the shape used by director/mentor edit UIs.
 */

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

  sections: (data.sections ?? []).map((section: any) => ({
    id: section._id,
    name: section.title ?? section.name ?? "",
    description: section.description ?? "",

    layers: (section.layers ?? []).map((layer: any) => ({
      id: layer._id,
      name: layer.title ?? layer.name ?? "",

      choices: (layer.choices ?? []).map((c: any) => ({
        id: c._id ?? c.id,
        text: c.text ?? c.label ?? "",
      })),

      recommendations: (layer.recommendations ?? []).map((text: string, idx: number) => ({
        id: `${layer._id}-rec-${idx}`,
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
