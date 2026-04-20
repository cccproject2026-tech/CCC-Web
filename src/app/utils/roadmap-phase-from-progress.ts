import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import type { ProgressResponse, ProgressRoadmap } from "@/app/Services/types/progress.types";

function isJumpstartName(name: string): boolean {
  const n = name.toLowerCase();
  return n.includes("jump") && n.includes("start");
}

function roadmapNameRank(name: string): number {
  const n = name.toLowerCase();
  if (n.includes("jump") && n.includes("start")) return 0;
  if (n.includes("self") && n.includes("revitalization")) return 1;
  if (n.includes("church") && n.includes("empowerment")) return 2;
  if (n.includes("community") && n.includes("multiplication")) return 3;
  return 100;
}

function sortRoadmapsByCanonicalPhase(
  rows: ProgressRoadmap[],
  nameById: Map<string, string>,
): ProgressRoadmap[] {
  return [...rows].sort((a, b) => {
    const an = roadmapNameRank(nameById.get(a.roadMapId) || "");
    const bn = roadmapNameRank(nameById.get(b.roadMapId) || "");
    if (an !== bn) return an - bn;
    return String(a.roadMapId).localeCompare(String(b.roadMapId));
  });
}

function isRoadmapRowIncomplete(r: ProgressRoadmap): boolean {
  const pct = Number(r.progressPercentage) || 0;
  const st = String(r.status ?? "")
    .toLowerCase()
    .replace(/_/g, " ");
  if (pct >= 100) return false;
  if (st.includes("complete")) return false;
  return true;
}

/**
 * Label for the roadmap phase the user is currently in (first incomplete phase in canonical order).
 */
export function deriveCurrentRoadmapPhaseLabel(
  progress: ProgressResponse | null | undefined,
  nameById: Map<string, string>,
): string | undefined {
  if (!progress?.roadmaps?.length) return undefined;

  const withoutJump = progress.roadmaps.filter((r) => {
    const label = nameById.get(r.roadMapId)?.trim() || "";
    return !isJumpstartName(label);
  });
  if (!withoutJump.length) return undefined;

  const ordered = sortRoadmapsByCanonicalPhase(withoutJump, nameById);
  const active = ordered.find(isRoadmapRowIncomplete);
  if (active) {
    const label = nameById.get(active.roadMapId)?.trim();
    return label || "Current roadmap";
  }

  const last = ordered[ordered.length - 1];
  const lastName = last ? nameById.get(last.roadMapId)?.trim() : "";
  if (lastName) return `${lastName} (completed)`;
  return "All roadmap phases completed";
}

/** Load display names for roadmap ids (deduped). */
export async function fetchRoadmapTitlesForIds(ids: string[]): Promise<Map<string, string>> {
  const uniq = [...new Set(ids.map((id) => String(id).trim()).filter(Boolean))];
  const map = new Map<string, string>();
  await Promise.all(
    uniq.map(async (id) => {
      try {
        const res = await apiGetRoadmapById(id);
        const raw = res.data as { data?: { name?: string }; name?: string } | undefined;
        const doc = (raw?.data ?? raw) as { name?: string } | undefined;
        const name = typeof doc?.name === "string" ? doc.name.trim() : "";
        if (name) map.set(id, name);
      } catch {
        // ignore failed roadmap fetch
      }
    }),
  );
  return map;
}
