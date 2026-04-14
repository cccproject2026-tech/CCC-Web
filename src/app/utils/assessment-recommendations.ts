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
