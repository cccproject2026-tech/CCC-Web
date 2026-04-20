import type { ProgressResponse } from "@/app/Services/types/progress.types";

/**
 * Prefer API `overallProgress`; fall back to completed/total items or roadmap aggregate.
 */
export function deriveOverallProgressPercent(
  progress: ProgressResponse | null | undefined,
): number {
  if (!progress) return 0;
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
