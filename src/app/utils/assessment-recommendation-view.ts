type RecommendationSectionView = {
  sectionId: string;
  sectionTitle: string;
  message: string;
  sentAt?: string;
};

type SectionMeta = {
  _id?: string;
  id?: string;
  name?: string;
  title?: string;
  layers?: unknown[];
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function linesToText(lines: string[]): string {
  return lines.map((line) => normalizeText(line)).filter(Boolean).join("\n").trim();
}

function recommendationValueToLines(value: unknown): string[] {
  if (typeof value === "string") {
    const text = normalizeText(value);
    return text ? [text] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => recommendationValueToLines(item));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  const row = value as Record<string, unknown>;
  const direct = row.message ?? row.text ?? row.description ?? row.label ?? row.cdp ?? row.mentorCdp;
  if (direct != null && normalizeText(direct)) {
    return [normalizeText(direct)];
  }

  const items = row.items ?? row.recommendations;
  if (items != null) {
    return recommendationValueToLines(items);
  }

  return [];
}

function extractLayerRecommendationText(layer: unknown): string {
  if (!layer || typeof layer !== "object") return "";
  const row = layer as Record<string, unknown>;
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

  for (const key of keys) {
    const value = row[key];
    const text = linesToText(recommendationValueToLines(value));
    if (text) return text;
  }

  return "";
}

function buildSectionTitleMap(sections: SectionMeta[]): Map<string, string> {
  const map = new Map<string, string>();
  sections.forEach((section, index) => {
    const sectionId = normalizeText(section._id ?? section.id ?? `section_${index}`);
    if (!sectionId) return;
    map.set(sectionId, normalizeText(section.name ?? section.title ?? `Section ${index + 1}`));
  });
  return map;
}

function addRow(
  rows: Map<string, RecommendationSectionView>,
  sectionId: string,
  sectionTitle: string,
  message: string,
  sentAt?: string,
) {
  const normalizedSectionId = normalizeText(sectionId);
  const normalizedMessage = normalizeText(message);
  if (!normalizedSectionId || !normalizedMessage) return;

  const existing = rows.get(normalizedSectionId);
  if (!existing) {
    rows.set(normalizedSectionId, {
      sectionId: normalizedSectionId,
      sectionTitle: normalizeText(sectionTitle) || "Section",
      message: normalizedMessage,
      sentAt,
    });
    return;
  }

  if (existing.message.includes(normalizedMessage)) {
    if (!existing.sentAt && sentAt) existing.sentAt = sentAt;
    return;
  }

  existing.message = `${existing.message}\n\n${normalizedMessage}`.trim();
  if (!existing.sentAt && sentAt) existing.sentAt = sentAt;
}

function parseSectionRow(
  row: Record<string, unknown>,
  rows: Map<string, RecommendationSectionView>,
  titleById: Map<string, string>,
  sectionIndex: number,
) {
  const sectionId = normalizeText(row.sectionId ?? row._id ?? row.id ?? `section_${sectionIndex}`);
  const sectionTitle =
    normalizeText(row.sectionTitle ?? row.title ?? row.name) ||
    titleById.get(sectionId) ||
    `Section ${sectionIndex + 1}`;
  const sentAt = normalizeText(row.sentAt ?? row.updatedAt ?? row.createdAt) || undefined;

  const directMessage = linesToText(
    recommendationValueToLines(row.recommendations ?? row.message ?? row.text ?? row.cdp ?? row.mentorCdp),
  );
  if (directMessage) {
    addRow(rows, sectionId, sectionTitle, directMessage, sentAt);
  }

  const layers = Array.isArray(row.layers) ? row.layers : [];
  const layerMessages = layers
    .map((layer) => extractLayerRecommendationText(layer))
    .filter((message) => message !== "");
  if (layerMessages.length > 0) {
    addRow(rows, sectionId, sectionTitle, layerMessages.join("\n\n"), sentAt);
  }
}

function walkRecommendationPayload(
  payload: unknown,
  rows: Map<string, RecommendationSectionView>,
  titleById: Map<string, string>,
) {
  if (Array.isArray(payload)) {
    payload.forEach((entry, index) => {
      if (entry && typeof entry === "object") {
        parseSectionRow(entry as Record<string, unknown>, rows, titleById, index);
      }
    });
    return;
  }

  if (!payload || typeof payload !== "object") return;

  const body = payload as Record<string, unknown>;
  if (Array.isArray(body.sections)) {
    walkRecommendationPayload(body.sections, rows, titleById);
  }
  if (Array.isArray(body.recommendations)) {
    walkRecommendationPayload(body.recommendations, rows, titleById);
  }
  if (body.data != null) {
    walkRecommendationPayload(body.data, rows, titleById);
  }
}

export function parseRecommendationSectionsForPastorView(
  payload: unknown,
  sections: SectionMeta[] = [],
): RecommendationSectionView[] {
  const titleById = buildSectionTitleMap(sections);
  const rows = new Map<string, RecommendationSectionView>();
  walkRecommendationPayload(payload, rows, titleById);

  if (rows.size === 0) return [];

  const sectionOrder = new Map<string, number>();
  sections.forEach((section, index) => {
    const sectionId = normalizeText(section._id ?? section.id ?? `section_${index}`);
    if (sectionId) sectionOrder.set(sectionId, index);
  });

  return Array.from(rows.values()).sort((left, right) => {
    const leftOrder = sectionOrder.get(left.sectionId) ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = sectionOrder.get(right.sectionId) ?? Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

export type { RecommendationSectionView };