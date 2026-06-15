"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import "@fortawesome/fontawesome-free/css/all.min.css";

import PastorHeader from "@/app/Components/PastorHeader";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import {
  collapseRoadmapAssignmentsToParents,
  fetchRoadmapAssignmentsForUser,
} from "@/app/Services/roadmap-assignments";
import {
  IndividualBreakdownBarChart,
  OverallProgressDonut,
  ProgressFilterSegmented,
  type RoadmapFilterTab,
  assessmentMatchesFilter,
  formatRoadmapStatusLabel,
  progressStatusChipClass,
  roadmapMatchesFilter,
} from "@/app/Components/ProgressDashboardShared";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import {
  apiGetAssignedAssessments,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";
import { pastorRoadmapDescriptionLineClamp2 } from "@/app/Components/pastor/pastor-theme";

function pickSubmittedAtFromProgressAssessment(a: any): string | null {
  const candidates = [
    a?.submittedOn,
    a?.submittedAt,
    a?.updatedAt,
    a?.completedAt,
    a?.assessmentCompletedAt,
    a?.completionDate,
  ];
  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) return raw;
  }
  return null;
}

function pickAssignedDueDate(raw: any): string | null {
  const candidates = [
    raw?.dueDate,
    raw?.deadline,
    raw?.endDate,
    raw?.assignedDueDate,
    raw?.assignment?.dueDate,
    raw?.assignment?.deadline,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

async function mapWithConcurrencyLimit<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const safeLimit = Math.max(1, Math.min(limit, items.length));
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: safeLimit }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      results[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

export default function PastorMyProgressPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Pastor");
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilterTab>("All");
  const [surveyFilter, setSurveyFilter] = useState<RoadmapFilterTab>("All");

  useEffect(() => {
    try {
      const raw = getCookie("user");
      if (!raw) {
        setUserId(null);
        setLoading(false);
        return;
      }
      const user = JSON.parse(raw);
      const id = user?.id || user?._id;
      if (!id) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(String(id));
      const name = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
      if (name) setDisplayName(name);
      if (user?.email) setEmail(String(user.email));
    } catch {
      setUserId(null);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const run = async () => {
      try {
        const res = await apiGetUserProgress(userId);
        setProgress(unwrapProgressData(res));
      } catch (e) {
        console.error("Failed to fetch progress", e);
        setProgress(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    return subscribeProgressUpdated((uid) => {
      if (uid !== userId) return;
      void (async () => {
        try {
          const res = await apiGetUserProgress(userId);
          setProgress(unwrapProgressData(res));
        } catch (e) {
          console.error("Failed to fetch progress", e);
          setProgress(null);
        }
      })();
    });
  }, [userId]);


useEffect(() => {
  if (!userId) return;

  const hydrateRoadmaps = async () => {
    try {
      const data = await fetchRoadmapAssignmentsForUser(userId);
      const parentCards = collapseRoadmapAssignmentsToParents(data);
      console.log("PARENT CARDS", parentCards);

      const mapped = parentCards.map((item: any) => ({
        roadMapId: item.id,
        title: item.title,
        description: item.desc || "No description",
        timeline: item.months || "—",
        imageUrl: item.imageUrl,
        percent: item.progress ?? 0,
        status: item.status,
        // completedSteps: item.completedSteps ?? 0,
        // totalSteps: item.totalSteps ?? 0,
        completedSteps:
  item.completedSteps ??
  item.completedTaskCount ??
  item.completedTasks ??
  0,

totalSteps:
  item.totalSteps ??
  item.totalTaskCount ??
  item.totalTasks ??
  0,
        isPhase: item.hasNestedTasks === true,
      }));

      setRoadmaps(mapped);
    } catch (err) {
      console.error("Failed to load roadmap details", err);
      setRoadmaps([]);
    }
  };

  hydrateRoadmaps();
}, [userId]);

  useEffect(() => {
    if (!userId) return;
    const hydrateAssessments = async () => {
      try {
        const assignedRes = await apiGetAssignedAssessments(userId);
        const assignedList = parseAssignedAssessmentsListBody(assignedRes.data);
        const progressAssessments = Array.isArray(progress?.assessments) ? progress.assessments : [];

        const hydrated = assignedList
          .map((item: any) => {
            const flat = flattenAssignedAssessmentRow(item);
            if (!flat) return null;
            const assessmentId = String(flat.assessmentId || "").trim();
            if (!assessmentId) return null;

            const progressRow = progressAssessments.find(
              (p: { assessmentId?: string; assignmentId?: string }) =>
                String(p?.assessmentId ?? "") === assessmentId ||
                (flat.assignmentId && p?.assignmentId && String(p.assignmentId) === String(flat.assignmentId)),
            );
            const detail = flat.assessment as Record<string, unknown>;
            const status = (progressRow?.status ?? "not_started") as string;
            const submittedOnRaw = pickSubmittedAtFromProgressAssessment(progressRow);
            const dueDate = pickAssignedDueDate(item) ?? flat.dueDate ?? null;

            return {
              ...flat,
              assessmentId,
              title: (detail?.name as string) || (detail?.title as string) || "Assessment",
              description: (detail?.description as string) || "",
              bannerImage: (detail?.bannerImage as string) || (detail?.imageUrl as string) || null,
              type: (detail?.type as string) || undefined,
              totalSections: Array.isArray(detail?.sections) ? detail.sections.length : 0,
              dueDate,
              status,
              submittedOnRaw,
            };
          })
          .filter(Boolean);

        setAssessments(hydrated as any[]);
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 503) {
          console.warn("Assigned assessments temporarily unavailable (503)");
        } else {
          console.error("Failed to load assigned assessments", err);
        }
        setAssessments([]);
      }
    };
    hydrateAssessments();
  }, [progress, userId]);

  const filteredRoadmaps = roadmaps.filter((r) => roadmapMatchesFilter(r, roadmapFilter));
  const filteredAssessments = assessments.filter((a) => assessmentMatchesFilter(a, surveyFilter));

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
        <PastorHeader showFullHeader={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      </div>
    );
  }
const progressForChart = progress
  ? {
      ...progress,
      assessments: assessments.map((assessment) => ({
        assessmentId: assessment.assessmentId,
        status: assessment.status || "not_started",
      })),
    }
  : null;
  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader={true} />

      <header className="border-b border-[#8ec5eb]/25 bg-[#062946] px-4 py-5 sm:px-8 md:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4">
          <div className="flex w-full items-center gap-3">
            <Link
              href="/pastor/home"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-[#cde2f2] transition hover:border-[#8ec5eb]/40 hover:text-white"
              aria-label="Back to home"
            >
              <i className="fa-solid fa-arrow-left" />
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">My Progress</h1>
          </div>
          <div
            className="rounded-xl px-6 py-2.5 text-center text-sm font-semibold text-white shadow-[0_0_24px_rgba(142,197,235,0.18)]"
            style={{
              border: "2px solid transparent",
              background:
                "linear-gradient(#062946, #062946) padding-box, linear-gradient(120deg, #a78bfa, #6366f1, #38bdf8, #8ec5eb) border-box",
              backgroundClip: "padding-box, border-box",
            }}
          >
            {displayName}
          </div>
          {email ? <p className="text-center text-xs text-[#8ec5eb]/85">{email}</p> : null}
        </div>
      </header>

      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 sm:px-8 md:px-16 md:py-10">
        <div className="mx-auto max-w-7xl">
          {!userId && (
            <p className="mb-8 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              Please sign in again to view your progress.
            </p>
          )}

          {userId && progress && (
            <>
              <section className="mb-8 rounded-2xl border border-[#8ec5eb]/40 bg-[#041f35]/60 p-5 shadow-lg backdrop-blur-md sm:p-7">
                <h2 className="mb-6 text-base font-bold text-white sm:text-lg">
                  Overall Progress — Roadmap &amp; Assessments
                </h2>
                <OverallProgressDonut overallPercent={progress.overallProgress ?? 0} />
              </section>

              <section className="mb-10 rounded-2xl border border-[#8ec5eb]/40 bg-[#041f35]/60 p-5 shadow-lg backdrop-blur-md sm:p-7">
                <h2 className="mb-6 text-base font-bold text-white sm:text-lg">
                  Individual — Roadmap, Assessments
                </h2>
                {/* <IndividualBreakdownBarChart progress={progress} /> */}
                <IndividualBreakdownBarChart progress={progressForChart ?? progress} />
              </section>
            </>
          )}

          {userId && !progress && (
            <p className="mb-8 rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]">
              No progress records found. Once you start roadmaps or surveys, your progress will appear here.
            </p>
          )}

          <section className="mb-12">
            <div className="mb-5 flex flex-col gap-4">
              <h2 className="text-base font-bold text-white sm:text-lg">Revitalization Roadmap Progress</h2>
              <ProgressFilterSegmented active={roadmapFilter} setActive={setRoadmapFilter} />
            </div>
            {filteredRoadmaps.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]">
                No roadmaps to show for this filter.
              </p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
                {filteredRoadmaps.map((r: any) => (
                  <PastorRoadmapProgressCard
                    key={r.roadMapId}
                    roadmap={r}
                    onView={() => {
                      if (!r.roadMapId) return;
                      if (r.isPhase) {
                        router.push(`/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(r.roadMapId)}`);
                      } else {
                        router.push(`/pastor/jumpstart?id=${encodeURIComponent(r.roadMapId)}`);
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="pb-8">
            <div className="mb-5 flex flex-col gap-4">
              <h2 className="text-base font-bold text-white sm:text-lg">Survey progress</h2>
              <ProgressFilterSegmented active={surveyFilter} setActive={setSurveyFilter} />
            </div>
            {filteredAssessments.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]">
                No surveys to show for this filter.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                {filteredAssessments.map((a: any) => (
                  <PastorAssessmentProgressCard
                    key={a.assessmentId}
                    assessment={a}
                    onOpen={() => {
                      if (!a.assessmentId) return;
                      router.push(
                        `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(a.assessmentId)}`,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function formatDateShort(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function PastorRoadmapProgressCard({ roadmap, onView }: { roadmap: any; onView: () => void }) {
  const title = roadmap.title || "Roadmap";
  const desc = roadmap.description || "";
 
  const progressPct = Math.min(100, Math.max(0, Number(roadmap.percent ?? 0)));

const totalSteps = Math.max(0, Number(roadmap.totalSteps ?? 0));
const completedSteps = Math.min(
  totalSteps,
  Math.max(0, Number(roadmap.completedSteps ?? 0)),
);

const completed = `${completedSteps}/${totalSteps}`;
  const time = roadmap.timeline || "—";
  const statusLabel = formatRoadmapStatusLabel(roadmap.status);
  const chip = progressStatusChipClass(roadmap.status);
  const completedOnRaw = roadmap.completedAt ?? roadmap.roadmapCompletedAt ?? roadmap.completionDate ?? roadmap.courseCompletedAt ?? null;
  const completedOn = formatDateShort(completedOnRaw);
  const imgUrl =
    typeof roadmap.imageUrl === "string" && (roadmap.imageUrl.startsWith("http://") || roadmap.imageUrl.startsWith("https://"))
      ? roadmap.imageUrl
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(145deg,rgba(255,255,255,0.12)_0%,rgba(6,41,70,0.35)_100%)] shadow-lg backdrop-blur-md transition hover:border-[#8ec5eb]/25">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-44 w-full shrink-0 sm:h-auto sm:w-1/3 sm:min-h-[200px]">
          {imgUrl ? (
            <Image src={imgUrl} alt={title} fill className="object-cover" unoptimized />
          ) : (
            <ApiImagePlaceholder className="h-full min-h-[176px] w-full sm:min-h-[200px]" />
          )}
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h4 className="mb-1 text-[15px] font-semibold text-white">{title}</h4>
          <p className={`mb-3 ${pastorRoadmapDescriptionLineClamp2}`}>{desc || "—"}</p>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-medium text-[#8ec5eb]/90">Status</span>
            <span className={`rounded-full px-2 py-[3px] text-[11px] font-medium ${chip}`}>{statusLabel}</span>
          </div>
          {/* <p className="mb-1 text-[12px] text-[#8ec5eb]/80">Tasks</p>
          <div className="mb-1 h-2.5 w-full rounded-full bg-white/10 sm:h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#5a9ec9] to-[#8ec5eb] transition-all duration-700"
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <p className="mb-2 text-[12px] font-medium text-white">{completed}</p> */}
          <p className="mb-2 text-[12px] text-[#8ec5eb]/80">
  Progress status is synced with your roadmap page.
</p>
          <p className="text-[12px] text-[#cde2f2]/80">
            Timeline <span className="font-semibold text-[#8ec5eb]">{time}</span>
          </p>
          {completedOn && (
            <p className="mt-1 text-[12px] text-[#cde2f2]/80">
              Completed on <span className="font-semibold text-[#8ec5eb]">{completedOn}</span>
            </p>
          )}
          {/* <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onView}
              className="rounded-lg bg-[#8ec5eb] px-6 py-2 text-[12px] font-semibold text-[#062946] transition hover:bg-[#b8daf2]"
            >
              View
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

function PastorAssessmentProgressCard({ assessment, onOpen }: { assessment: any; onOpen: () => void }) {
  const isDone = assessment.status === "completed";
  const banner = assessment.bannerImage;
  const isHttp =
    typeof banner === "string" && (banner.startsWith("http://") || banner.startsWith("https://"));
  const submittedOn = formatDateShort(assessment.submittedOnRaw);

  return (
    <div className="flex min-h-[200px] gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-lg backdrop-blur-md transition hover:border-[#8ec5eb]/25">
      <div className="relative h-full min-h-[168px] w-[140px] shrink-0 overflow-hidden rounded-xl sm:w-[160px]">
        {isHttp ? (
          <Image
            src={banner}
            alt={assessment.title || "Assessment"}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <ApiImagePlaceholder className="h-full min-h-[168px] w-full" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div className="min-w-0 flex-1">
          <h4 className="mb-1 line-clamp-1 text-[15px] font-bold text-white">{assessment.title || "Assessment"}</h4>
          <p className={`mb-2 ${pastorRoadmapDescriptionLineClamp2}`}>{assessment.description || ""}</p>
          {/* <div className="mb-3">
            <div className="mb-1 flex justify-between text-[11px] text-[#8ec5eb]/80">
              <span>Sections</span>
              <span className="tabular-nums text-[#cde2f2]">
                {assessment.completedSections ?? 0}/{assessment.totalSections ?? 0}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5a9ec9] to-[#8ec5eb] transition-all duration-700"
                style={{
                  width: `${Math.min(
                    100,
                    assessment.status === "completed"
                      ? 100
                      : Number(
                          assessment.progressPercentage ??
                            (assessment.totalSections
                              ? ((assessment.completedSections ?? 0) / Math.max(1, assessment.totalSections)) * 100
                              : 0),
                        ),
                  )}%`,
                }}
              />
            </div>
          </div> */}
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg bg-[#8ec5eb]/20 px-4 py-1.5 text-[12px] font-semibold text-[#8ec5eb] transition hover:bg-[#8ec5eb]/30"
          >
            {isDone ? "View survey" : "Continue survey"}
          </button>
        </div>
        <div className="mt-3 flex justify-between text-[12px] text-[#8ec5eb]/80">
          {isDone ? (
            <>
              <span className="font-semibold text-[#cde2f2]">Submitted on</span>
              <span className="font-semibold text-[#8ec5eb]">{submittedOn || "—"}</span>
            </>
          ) : (
            <>
              <span className="font-semibold text-[#cde2f2]">Due date</span>
              <span className="font-semibold text-[#8ec5eb]">{assessment.dueDate || "—"}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
