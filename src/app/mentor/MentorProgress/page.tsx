"use client";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import card from "@/app/Assets/card1.png";
import { apiAddFinalComment, apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetUserById } from "@/app/Services/users.service";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import { apiGetAssessmentById, parseAssessmentDetailPayload } from "@/app/Services/assessment.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
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
import {
  mentorGlassCardFrost,
  mentorGlassCardRoadmap,
  mentorMainGradient,
  mentorPageRoot,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";

function PastorProgressPageContent() {
  const router = useRouter();
  const [roadmapFilter, setRoadmapFilter] = useState<RoadmapFilterTab>("All");
  const [surveyFilter, setSurveyFilter] = useState<RoadmapFilterTab>("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("comments");
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [pastorUser, setPastorUser] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
  } | null>(null);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const isCompleted = progress?.finalComments?.length > 0;

  const fromProfile =
    pastorUser && `${pastorUser.firstName ?? ""} ${pastorUser.lastName ?? ""}`.trim();
  const fromProgressUser =
    progress?.user?.firstName || progress?.user?.lastName
      ? `${progress?.user?.firstName ?? ""} ${progress?.user?.lastName ?? ""}`.trim()
      : "";
  const pastorDisplayName =
    fromProfile ||
    fromProgressUser ||
    (userId && !userProfileLoaded ? "Loading…" : "Pastor");

  useEffect(() => {
    if (!userId) {
      setPastorUser(null);
      setUserProfileLoaded(true);
      return;
    }

    let cancelled = false;
    setUserProfileLoaded(false);
    apiGetUserById(userId)
      .then((res) => {
        const u = res.data?.data ?? res.data;
        if (!cancelled && u && typeof u === "object") {
          setPastorUser(u as { firstName?: string; lastName?: string; email?: string });
        }
      })
      .catch(() => {
        if (!cancelled) setPastorUser(null);
      })
      .finally(() => {
        if (!cancelled) setUserProfileLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      try {
        const res = await apiGetUserProgress(userId);
        setProgress(unwrapProgressData(res));
      } catch (err) {
        console.error("Failed to fetch progress", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);

  useEffect(() => {
    if (!progress?.roadmaps?.length) return;

    const hydrateRoadmaps = async () => {
      try {
        const results = await Promise.allSettled(
          progress.roadmaps.map(async (r: any) => {
            const rid = r.roadMapId ?? r.roadmapId ?? r._id;
            const res = await apiGetRoadmapById(rid);
            const roadmap = res.data?.data;
            const percent = r.progressPercentage ?? 0;
            return {
              ...r,
              roadMapId: rid,
              title: roadmap?.name,
              description: roadmap?.description,
              timeline: roadmap?.timeline,
              imageUrl: roadmap?.imageUrl,
              percent,
            };
          }),
        );
        const valid = results.filter((r) => r.status === "fulfilled").map((r: any) => r.value);

        setRoadmaps(valid);
      } catch (err) {
        console.error("Failed to load roadmap details", err);
      }
    };

    hydrateRoadmaps();
  }, [progress]);

  useEffect(() => {
    if (!progress?.assessments?.length) return;
    const hydrateAssessments = async () => {
      try {
        const results = await Promise.allSettled(
          progress.assessments.map(async (a: any) => {
            const res = await apiGetAssessmentById(a.assessmentId);
            const assessment = parseAssessmentDetailPayload(res.data);

            return {
              ...a,
              title: assessment?.name,
              description: assessment?.description,
              bannerImage: assessment?.bannerImage,
              type: assessment?.type,
              totalSections: assessment?.sections?.length || 0,
              dueDate: a.dueDate,
              status: a.status,
            };
          }),
        );
        const valid = results.filter((r) => r.status === "fulfilled").map((r: any) => r.value);

        setAssessments(valid);
      } catch (err) {
        console.error("Failed to load assessments", err);
      }
    };

    hydrateAssessments();
  }, [progress]);

  const handleMarkComplete = async () => {
    try {
      const mentor = getMentorFromCookie();
      if (!mentor?.id) return;

      await apiAddFinalComment({
        userId: userId as string,
        commentorId: mentor.id,
        comment: comment,
      });

      const res = await apiGetUserProgress(userId as string);
      setProgress(unwrapProgressData(res));

      setIsDrawerOpen(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to submit final comment", err);
    }
  };

  const filteredRoadmaps = roadmaps.filter((r) => roadmapMatchesFilter(r, roadmapFilter));

  const filteredAssessments = assessments.filter((a) => assessmentMatchesFilter(a, surveyFilter));
useEffect(() => {
  const section = searchParams.get("section");
  if (!section || loading) return;

  const timeout = window.setTimeout(() => {
    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, 300);

  return () => window.clearTimeout(timeout);
}, [searchParams, loading, filteredRoadmaps.length, filteredAssessments.length]);
  if (loading) {
    return (
      <div className={mentorPageRoot}>
        <MentorHeader showFullHeader={true} />
        <div className="flex flex-1 items-center justify-center">
          <div className={mentorSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <header className="border-b border-[#8ec5eb]/25 bg-[#062946] px-0 py-5">
        <div className="flex w-full flex-col items-center gap-4">
          <div className="flex w-full items-center gap-3">
            <Link
              href="/mentor/TrackProgress"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 text-[#cde2f2] transition hover:border-[#8ec5eb]/40 hover:text-white"
              aria-label="Back to track progress"
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
            {pastorDisplayName}
          </div>
          {pastorUser?.email ? (
            <p className="text-center text-xs text-[#8ec5eb]/85">{pastorUser.email}</p>
          ) : null}
        </div>
      </header>

      <main className={`relative z-10 flex-1 px-0 py-8 sm:py-8 md:py-10 ${mentorMainGradient}`}>
        <div className="w-full">
          {!userId && (
            <p className={`mb-8 ${mentorWarningPanel}`}>
              Missing <code className="rounded bg-white/10 px-1">userId</code> in the URL. Open a pastor from Track
              progress first.
            </p>
          )}

          {userId && (
            <>
              <section className={`mb-8 p-5 sm:p-7 ${mentorGlassCardFrost}`}>
                <h2 className="mb-6 text-base font-bold text-white sm:text-lg">
                  Overall Progress — Roadmap &amp; Assessments
                </h2>
                <OverallProgressDonut overallPercent={progress?.overallProgress ?? 0} />
              </section>

              <section className={`mb-10 p-5 sm:p-7 ${mentorGlassCardFrost}`}>
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <h2 className="text-base font-bold text-white sm:text-lg">
                    Individual — Roadmap, Assessments
                  </h2>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {/* {!isCompleted ? (
                      <button
                        type="button"
                        onClick={() => setIsDrawerOpen(true)}
                        className="rounded-xl bg-[#8ec5eb] px-4 py-2 text-xs font-semibold text-[#062946] transition hover:bg-[#b8daf2]"
                      >
                        Add final comments
                      </button>
                    ) : ( */}
                    {!isCompleted ? (
  <button
    type="button"
    disabled={(progress?.overallProgress ?? 0) < 100}
    onClick={() => {
      if ((progress?.overallProgress ?? 0) < 100) return;
      setIsDrawerOpen(true);
    }}
    className="rounded-xl bg-[#8ec5eb] px-4 py-2 text-xs font-semibold text-[#062946] transition hover:bg-[#b8daf2] disabled:cursor-not-allowed disabled:opacity-50"
  >
    Add final comments
  </button>
) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsDrawerOpen(true);
                          setActiveTab("comments");
                        }}
                        className="rounded-xl border border-[#8ec5eb]/50 bg-white/10 px-4 py-2 text-xs font-semibold text-[#cde2f2] transition hover:bg-white/15"
                      >
                        View final comments
                      </button>
                    )}
                  </div>
                </div>
                <IndividualBreakdownBarChart progress={progress} />
              </section>
            </>
          )}

          {/* Roadmaps */}
          <section id="roadmaps" className="mb-12 scroll-mt-28">
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
                  <MentorRoadmapProgressCard
                    key={r.roadMapId}
                    roadmap={r}
                    onView={() => {
                      if (!userId || !r.roadMapId) return;
                      router.push(
                        `/mentor/RevitalizationRoadmap/home/jump-start?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(r.roadMapId)}`,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Surveys */}
          <section id="assessments" className="pb-8 scroll-mt-28">
            <div className="mb-5 flex flex-col gap-4">
              <h2 className="text-base font-bold text-white sm:text-lg">Assessment progress</h2>
              <ProgressFilterSegmented active={surveyFilter} setActive={setSurveyFilter} />
            </div>

            {filteredAssessments.length === 0 ? (
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]">
                No Assessments to show for this filter.
              </p>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 md:gap-8">
                {filteredAssessments.map((a: any) => (
                  <MentorAssessmentProgressCard
                    key={a.assessmentId}
                    assessment={a}
                    onOpen={() => {
                      if (!userId || !a.assessmentId) return;
                      router.push(
                        `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(a.assessmentId)}&userId=${encodeURIComponent(userId)}&viewOnly=1`,
                      );
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      {isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            role="presentation"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full bg-[#0a3558] text-[#cde2f2] shadow-2xl sm:w-[460px] sm:border-l sm:border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {isCompleted ? "Final comments & summary" : "Final comments"}
                </h2>
                <p className="mt-1 text-sm text-[#8ec5eb]/90">{pastorDisplayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#cde2f2]/70 transition hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            {isCompleted && (
              <div className="flex border-b border-white/10">
                {["comments", "summary"].map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 text-sm font-medium capitalize transition ${activeTab === tab
                        ? "border-b-2 border-[#8ec5eb] text-white"
                        : "text-[#cde2f2]/80 hover:text-white"
                      }`}
                  >
                    {tab === "comments" ? "Final comments" : "Programme summary"}
                  </button>
                ))}
              </div>
            )}

            <div className="p-6">
              {!isCompleted ? (
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write your comments here…"
                  className="h-[260px] w-full rounded-lg border border-white/15 bg-[#062946]/80 p-3 text-sm text-white placeholder:text-[#8ec5eb]/50 focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/40"
                />
              ) : (
                <div className="max-h-[260px] space-y-3 overflow-y-auto">
                  {progress?.finalComments?.map((c: any) => (
                    <div key={c._id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <p className="text-sm text-[#cde2f2]">{c.comment}</p>
                      <p className="mt-1 text-[11px] text-[#8ec5eb]/70">
                        {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {isCompleted && activeTab === "summary" && (
                <div className="text-sm text-[#cde2f2]">
                  <p className="mb-2 font-medium text-white">Programme completion summary</p>
                  <p>
                    The participant has completed the recorded phases of the revitalization programme. Final mentor
                    comments are listed in the other tab.
                  </p>
                </div>
              )}
            </div>

            {!isCompleted && (
              <div className="absolute bottom-0 left-0 flex w-full justify-end gap-3 border-t border-white/10 bg-[#0a3558] p-5">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="rounded-lg border border-[#8ec5eb]/50 px-6 py-2 text-[13px] font-medium text-[#cde2f2] transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  className="rounded-lg bg-[#8ec5eb] px-8 py-2 text-[13px] font-semibold text-[#062946] transition hover:bg-[#b8daf2]"
                >
                  Mark programme as completed
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {showSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-[#0a3558] px-8 py-5 shadow-xl">
            <div className="text-2xl text-emerald-400">✔</div>
            <p className="text-[15px] font-medium text-white">This programme has been marked as completed.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function MentorRoadmapProgressCard({ roadmap, onView }: { roadmap: any; onView: () => void }) {
  const title = roadmap.title || "Roadmap";
  const desc = roadmap.description || "";
  const progressPct = Number(roadmap.percent ?? 0);
  const completed = `${roadmap.completedSteps ?? 0}/${roadmap.totalSteps ?? 0}`;
  const time = roadmap.timeline || "—";
  const status = roadmap.status;
  const imgUrl =
    typeof roadmap.imageUrl === "string" && (roadmap.imageUrl.startsWith("http://") || roadmap.imageUrl.startsWith("https://"))
      ? roadmap.imageUrl
      : null;

  const getStatusBadgeStyle = () => {
    const s = String(status || "").toLowerCase().trim();
    if (s === "completed" || s === "complete") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
    if (s === "in_progress" || s === "in-progress") return "border-amber-400/40 bg-amber-500/15 text-amber-100";
    if (s === "overdue" || s === "over_due") return "border-red-400/40 bg-red-500/15 text-red-100";
    return "border-[#8ec5eb]/35 bg-[#8ec5eb]/10 text-[#cde9f7]";
  };

  const statusLabel = formatRoadmapStatusLabel(status);

  return (
    <div className={`flex overflow-hidden rounded-2xl border border-white/12 ${mentorGlassCardRoadmap}`}>
      <div className="relative w-1/3 shrink-0">
        <Image
          src={imgUrl || card}
          alt={title}
          fill
          className="object-cover"
          unoptimized={!!imgUrl}
        />
        {status && String(status).toLowerCase().includes("completed") && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative h-14 w-14">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/80" />
              <div className="absolute inset-[6px] flex items-center justify-center rounded-full bg-emerald-500">
                <i className="fa-solid fa-check text-sm font-bold text-white"></i>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mb-4 text-sm text-white/65">{desc || "—"}</p>
        </div>
        <div className="flex flex-col gap-3">
          <span className={`w-fit rounded-md border px-3 py-1 text-xs font-semibold ${getStatusBadgeStyle()}`}>
            Status: {statusLabel}
          </span>
          <div className="flex flex-col gap-1">
            <div className="h-2 w-full rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-[#5a9ec9] to-[#8ec5eb] transition-all duration-700"
                style={{ width: `${Math.min(100, progressPct)}%` }}
              />
            </div>
            <span className="text-xs text-white/55">Tasks: {completed}</span>
          </div>
          <span className="text-xs text-white/70">
            Timeline: <span className="font-semibold text-[#8ec5eb]">{time}</span>
          </span>
          <span className="text-xs text-white/70">
            Completion time: <span className="font-semibold text-[#8ec5eb]">{roadmap.completionDate || "—"}</span>
          </span>
          {/* <button
            type="button"
            onClick={onView}
            className="mt-2 inline-flex w-fit rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
          >
            View Details
          </button> */}
        </div>
      </div>
    </div>
  );
}

function MentorAssessmentProgressCard({ assessment, onOpen }: { assessment: any; onOpen: () => void }) {
  const isDone = assessment.status === "completed";
  const banner = assessment.bannerImage;
  const isHttp =
    typeof banner === "string" && (banner.startsWith("http://") || banner.startsWith("https://"));

  return (
    <div className={`${mentorGlassCardRoadmap} min-h-[200px] gap-4 p-4`}>
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
          <p className="mb-2 line-clamp-2 text-[13px] text-[#cde2f2]/90">{assessment.description || ""}</p>
          <div className="mb-3">
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
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-lg bg-[#8ec5eb]/20 px-4 py-1.5 text-[12px] font-semibold text-[#8ec5eb] transition hover:bg-[#8ec5eb]/30"
          >
            Open Assessment (read-only)
          </button>
        </div>
        <div className="mt-3 flex justify-between text-[12px] text-[#8ec5eb]/80">
          {isDone ? (
            <span className="font-semibold text-white">Submitted</span>
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

export default function PastorProgressPage() {
  return (
    <Suspense
      fallback={
        <div className={mentorPageRoot}>
          <MentorHeader showFullHeader={true} />
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-[#cde2f2]">
            <div className={mentorSpinner} />
            <span className="text-sm">Loading…</span>
          </div>
        </div>
      }
    >
      <PastorProgressPageContent />
    </Suspense>
  );
}
