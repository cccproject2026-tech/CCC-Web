"use client";

export function formatRoadmapStatusLabel(status: string): string {
  const s = String(status || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (s.includes("complete")) return "Completed";
  if (s.includes("progress") || s === "due" || s === "assigned") return "In-progress";
  if (s.includes("over") && s.includes("due")) return "Over Due";
  if (s.includes("not_started") || s === "notstarted" || s === "") return "Not Started";
  return "Not Started";
}

/** Status chip styles for roadmap cards (mentor & pastor progress). */
export function progressStatusChipClass(statusRaw: string): string {
  const label = formatRoadmapStatusLabel(statusRaw);
  switch (label) {
    case "Not Started":
      return "bg-[#e6edff] text-[#1e40af]";
    case "In-progress":
      return "bg-[#fff6d8] text-[#d38a00]";
    case "Completed":
      return "bg-[#d8fff2] text-[#00A878]";
    case "Over Due":
      return "bg-red-500/25 text-red-100 border border-red-400/30";
    default:
      return "bg-[#e6edff] text-[#1e40af]";
  }
}

export const ROADMAP_FILTER_TABS = ["All", "In progress", "Completed", "Not started"] as const;
export type RoadmapFilterTab = (typeof ROADMAP_FILTER_TABS)[number];

export function roadmapMatchesFilter(r: any, filter: RoadmapFilterTab): boolean {
  const label = formatRoadmapStatusLabel(r.status);
  if (filter === "All") return true;
  if (filter === "Completed") return label === "Completed";
  if (filter === "In progress") return label === "In-progress" || label === "Over Due";
  if (filter === "Not started") return label === "Not Started";
  return true;
}

export function assessmentMatchesFilter(a: any, filter: RoadmapFilterTab): boolean {
  const status = String(a.status || "").toLowerCase().replace(/[_\s-]+/g, " ");
  const done = status === "completed" || status === "complete" || status === "reviewed";
  const completedSecs = Number(a.completedSections ?? 0);
  if (filter === "All") return true;
  if (filter === "Completed") return done;
  if (filter === "Not started") return !done && completedSecs === 0;
  if (filter === "In progress") return !done && completedSecs > 0;
  return true;
}

export function OverallProgressDonut({ overallPercent }: { overallPercent: number }) {
  const p = Math.min(100, Math.max(0, Number(overallPercent) || 0));
  const rem = Math.round(100 - p);
  const size = 176;
  const stroke = 16;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (p / 100) * circ;

  return (
    <div className="flex flex-col items-stretch gap-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative mx-auto shrink-0 sm:mx-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.28)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#0b3d5c"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            className="transition-all duration-700"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums text-white">{Math.round(p)}%</span>
          <span className="text-xs text-[#8ec5eb]/90">completed</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-4 sm:max-w-xs sm:pl-2">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <span className="h-4 w-4 shrink-0 rounded bg-[#0b3d5c]" />
          <span className="text-sm text-[#cde2f2]">Completed</span>
          <span className="ml-auto text-sm font-semibold tabular-nums text-white">{Math.round(p)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 shrink-0 rounded bg-white/35" />
          <span className="text-sm text-[#cde2f2]">Remaining</span>
          <span className="ml-auto text-sm font-semibold tabular-nums text-white">{rem}%</span>
        </div>
      </div>
    </div>
  );
}

export function IndividualBreakdownBarChart({ progress }: { progress: any }) {
  const rt = Number(progress?.totalRoadmaps ?? 0);
  const rc = Number(progress?.completedRoadmaps ?? 0);
  const rRem = Math.max(0, rt - rc);
  const at = Number(progress?.totalAssessments ?? 0);
  const ac = Number(progress?.completedAssessments ?? 0);
  const aRem = Math.max(0, at - ac);
  const maxY = Math.max(5, rt, rc, rRem, at, ac, aRem, 1);

  const step = maxY > 8 ? 2 : 1;
  const ticks: number[] = [];
  for (let v = maxY; v >= 0; v -= step) ticks.push(v);
  if (ticks[ticks.length - 1] !== 0) ticks.push(0);

  const chartH = 168;

  function BarGroup({
    total,
    completed,
    remaining,
  }: {
    total: number;
    completed: number;
    remaining: number;
  }) {
    const gTotal = "linear-gradient(to top, #6b7280 0%, #5b7aa8 55%, #9ec9eb 100%)";
    const gDone = "linear-gradient(to top, #0c3555 0%, #1e6ba8 55%, #4a9fd4 100%)";
    const gRem = "linear-gradient(to top, #2d5a5a 0%, #4a9090 50%, #8ec5eb 100%)";

    function Bar({ val, background }: { val: number; background: string }) {
      const h = maxY === 0 ? 0 : (val / maxY) * 100;
      return (
        <div className="flex w-5 flex-col justify-end sm:w-7" style={{ height: chartH }}>
          <div
            className="w-full rounded-t-md shadow-sm"
            style={{
              height: `${h}%`,
              minHeight: val > 0 ? 6 : 0,
              background,
            }}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col items-center gap-2">
        <div className="flex items-end justify-center gap-1.5 sm:gap-2" style={{ height: chartH }}>
          <Bar val={total} background={gTotal} />
          <Bar val={completed} background={gDone} />
          <Bar val={remaining} background={gRem} />
        </div>
        <div className="flex w-full justify-center gap-1.5 text-[9px] text-[#8ec5eb]/85 sm:gap-2 sm:text-[10px]">
          <span className="w-5 text-center sm:w-7">Tot</span>
          <span className="w-5 text-center sm:w-7">Done</span>
          <span className="w-5 text-center sm:w-7">Left</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 border-b border-white/10 pb-4 sm:justify-between sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="h-3 w-10 rounded bg-gradient-to-r from-[#6b7280] to-[#7eb8e0]" />
          <span className="text-xs text-[#cde2f2]">Total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-10 rounded bg-gradient-to-r from-[#0c3555] to-[#4a9fd4]" />
          <span className="text-xs text-[#cde2f2]">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-10 rounded bg-gradient-to-r from-[#3d6d6d] to-[#8ec5eb]" />
          <span className="text-xs text-[#cde2f2]">Remaining</span>
        </div>
      </div>

      <div className="flex gap-3 sm:gap-6">
        <div
          className="flex shrink-0 flex-col justify-between py-1 text-right font-mono text-[10px] tabular-nums leading-tight text-[#8ec5eb]/75"
          style={{ height: chartH }}
        >
          {ticks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-2 gap-4 sm:gap-8">
          <BarGroup total={rt} completed={rc} remaining={rRem} />
          <BarGroup total={at} completed={ac} remaining={aRem} />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm font-semibold text-white sm:gap-8">
        <span>Roadmap</span>
        <span>Assessments</span>
      </div>
    </div>
  );
}

export function ProgressFilterSegmented({
  active,
  setActive,
}: {
  active: RoadmapFilterTab;
  setActive: (v: RoadmapFilterTab) => void;
}) {
  return (
    <div
      className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-[#8ec5eb]/35 bg-[#041f35]/80 p-1.5 sm:max-w-2xl sm:grid-cols-4"
      role="tablist"
    >
      {ROADMAP_FILTER_TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => setActive(tab)}
          className={`rounded-xl px-2 py-2.5 text-center text-[11px] font-semibold transition sm:text-xs ${
            active === tab
              ? "bg-white text-[#062946] shadow-md"
              : "border border-transparent text-[#cde2f2] hover:border-white/20 hover:bg-white/5"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
