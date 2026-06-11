export type StoredAssessmentRecommendation = {
  mentorId?: string;
  pastorId: string;
  assessmentId: string;
  sectionId: string;
  sectionTitle: string;
  message: string;
  sent: boolean;
  sentAt?: string;
  updatedAt: string;
};

const STORAGE_KEY = "ccc_assessment_recommendations_v1";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readAll(): StoredAssessmentRecommendation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? (parsed.filter((item): item is StoredAssessmentRecommendation => {
          return (
            !!item &&
            typeof item === "object" &&
            typeof (item as StoredAssessmentRecommendation).pastorId === "string" &&
            typeof (item as StoredAssessmentRecommendation).assessmentId === "string" &&
            typeof (item as StoredAssessmentRecommendation).sectionId === "string"
          );
        }) as StoredAssessmentRecommendation[])
      : [];
  } catch {
    return [];
  }
}

function writeAll(list: StoredAssessmentRecommendation[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function getStoredRecommendationsForPastorAssessment(
  pastorId: string,
  assessmentId: string,
): StoredAssessmentRecommendation[] {
  return readAll().filter(
    (item) => item.pastorId === pastorId && item.assessmentId === assessmentId,
  );
}

export function upsertStoredRecommendation(entry: StoredAssessmentRecommendation) {
  const list = readAll();
  const idx = list.findIndex(
    (item) =>
      item.pastorId === entry.pastorId &&
      item.assessmentId === entry.assessmentId &&
      item.sectionId === entry.sectionId,
  );

  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  writeAll(list);
}

function normalizeCdpText(value: unknown): string {
  return String(value ?? "").trim();
}

function getLevelHeading(line: string): number | undefined {
  const match = line.trim().match(/^level\s*([1-4])\b/i);
  if (!match) return undefined;

  const level = Number(match[1]);
  return Number.isFinite(level) ? level : undefined;
}

function getLevelHeadings(message: string): Array<{ level: number; index: number }> {
  return message
    .split(/\r?\n/)
    .map((line, index) => ({ level: getLevelHeading(line), index }))
    .filter((item): item is { level: number; index: number } => item.level != null);
}

export function hasMultipleCdpLevelBlocks(message: string): boolean {
  return new Set(getLevelHeadings(message).map((item) => item.level)).size > 1;
}

export function extractCdpLevelBlock(message: string, selectedLevel?: number): string {
  const text = normalizeCdpText(message);
  if (!text) return "";

  const headings = getLevelHeadings(text);
  if (headings.length === 0) return text;
  if (!hasMultipleCdpLevelBlocks(text)) return text;
  if (selectedLevel == null || !Number.isFinite(selectedLevel)) return "";

  const selectedIndex = headings.findIndex((heading) => heading.level === selectedLevel);
  if (selectedIndex < 0) return "";

  const lines = text.split(/\r?\n/);
  const start = headings[selectedIndex].index + 1;
  const end = headings[selectedIndex + 1]?.index ?? lines.length;

  return lines.slice(start, end).map(normalizeCdpText).filter(Boolean).join("\n").trim();
}

export function normalizeSendableCdpMessage(message: unknown, selectedLevel?: number): string {
  const text = normalizeCdpText(message);
  if (!text) return "";
  if (!hasMultipleCdpLevelBlocks(text)) return text;

  return extractCdpLevelBlock(text, selectedLevel);
}
