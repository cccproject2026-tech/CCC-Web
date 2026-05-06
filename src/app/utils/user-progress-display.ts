import type { ProgressResponse } from "@/app/Services/types/progress.types";

/**
 * Prefer API `overallProgress`; fall back to completed/total items or roadmap aggregate.
 * CRITICAL: If all roadmaps AND all assessments are completed, return 100% (not backend value).
 */
export function deriveOverallProgressPercent(
  progress: ProgressResponse | null | undefined,
): number {
  if (!progress) return 0;

  // CRITICAL FIX: Check if all roadmaps AND all assessments are completed
  const totalRoadmaps = Number(progress.totalRoadmaps ?? 0);
  const completedRoadmaps = Number(progress.completedRoadmaps ?? 0);
  const totalAssessments = Number(progress.totalAssessments ?? 0);
  const completedAssessments = Number(progress.completedAssessments ?? 0);

  // If there's at least one roadmap or assessment, and all are completed, return 100%
  if (
    (totalRoadmaps > 0 || totalAssessments > 0) &&
    completedRoadmaps === totalRoadmaps &&
    completedAssessments === totalAssessments
  ) {
    return 100;
  }

  const raw = Number(progress.overallProgress);
  if (Number.isFinite(raw)) return Math.min(100, Math.max(0, raw));

  const total = Number(progress.totalItems);
  const done = Number(progress.completedItems);
  if (total > 0 && Number.isFinite(done)) {
    return Math.min(100, Math.round((done / total) * 1000) / 10);
  }

  const rp = Number(progress.overallRoadmapProgress);
  if (Number.isFinite(rp)) return Math.min(100, Math.max(0, rp));

  return 0;
}
