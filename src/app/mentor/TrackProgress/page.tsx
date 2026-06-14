"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import HeroBg from "@/app/Assets/progress-bg.png";
import PastorImg from "@/app/Assets/mentor1.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorBodyText,
  mentorEmptyPanel,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorFilterPanel,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";
import {
  apiGetOverallProgress,
  apiGetUserProgress,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
} from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { isRemoteImageSrc } from "@/app/utils/image";
import {
  apiGetAssignedAssessments,
  apiGetAssessments,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import {
  collapseRoadmapAssignmentsToParents,
  fetchRoadmapAssignmentsForUser,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";

function numFromApi(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}
const getInitialsAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=173653&color=ffffff`;

function normalizeProgressStatus(raw: unknown): string {
  return String(raw || "").toLowerCase().replace(/\s+/g, "_");
}

function isCompletedAssessmentStatus(raw: unknown): boolean {
  const status = normalizeProgressStatus(raw);
  return status === "completed" || status === "reviewed";
}

function assessmentIdFromItem(item: unknown): string {
  const flat = flattenAssignedAssessmentRow(item);
  return String(flat?.assessmentId || "").trim();
}

function buildAssignedAssessmentRowsForUser(
  assignedBody: unknown,
  allAssessments: any[],
  userId: string,
): unknown[] {
  let rows = parseAssignedAssessmentsListBody(assignedBody);

  const assignmentRows = allAssessments
    .map((assessment: any) => {
      const assignment = Array.isArray(assessment?.assignments)
        ? assessment.assignments.find((row: any) => String(row?.userId) === String(userId))
        : null;

      if (!assignment) return null;

      return {
        assessment,
        assessmentId: assessment?._id || assessment?.id,
        assignmentId: assignment?._id,
        dueDate: assignment?.dueDate,
        assignedDueDate: assignment?.dueDate,
        updatedAt: assignment?.assignedAt || assessment?.updatedAt,
      };
    })
    .filter(Boolean);

  const existingIds = new Set(rows.map(assessmentIdFromItem).filter(Boolean));
  const missingRows = assignmentRows.filter((item: any) => {
    const id = String(item?.assessmentId || "").trim();
    return id && !existingIds.has(id);
  });

  rows = [...rows, ...missingRows];
  return rows;
}

function countAssignedAssessments(rows: unknown[], progressData: any): { done: number; total: number } {
  const uniqueIds = rows.map(assessmentIdFromItem).filter(Boolean);
  const assignedIds = [...new Set(uniqueIds)];
  const assessmentProgress = Array.isArray(progressData?.assessments) ? progressData.assessments : [];

  const completedIds = new Set<string>();
  for (const id of assignedIds) {
    const progressRow = assessmentProgress.find(
      (row: any) => String(row?.assessmentId ?? "") === id,
    );
    if (isCompletedAssessmentStatus(progressRow?.status)) {
      completedIds.add(id);
    }
  }

  return {
    done: completedIds.size,
    total: assignedIds.length,
  };
}

async function getPastorProgressCounts(userId: string, allAssessments: any[]) {
  const [roadmapResult, assignedAssessmentsResult, progressResult] = await Promise.allSettled([
    fetchRoadmapAssignmentsForUser(userId),
    apiGetAssignedAssessments(userId),
    apiGetUserProgress(userId),
  ]);

  const parentRoadmaps =
    roadmapResult.status === "fulfilled"
      ? collapseRoadmapAssignmentsToParents(roadmapResult.value)
      : [];
  const roadmapDone = parentRoadmaps.filter(
    (roadmap) => String(roadmap.status || "").toLowerCase() === "completed",
  ).length;

  const progressData =
    progressResult.status === "fulfilled" ? unwrapProgressData(progressResult.value) : null;
  const assignedRows =
    assignedAssessmentsResult.status === "fulfilled"
      ? buildAssignedAssessmentRowsForUser(assignedAssessmentsResult.value.data, allAssessments, userId)
      : buildAssignedAssessmentRowsForUser([], allAssessments, userId);
  const assessmentCounts = countAssignedAssessments(assignedRows, progressData);

  return {
    roadmapDone,
    roadmapTotal: parentRoadmaps.length,
    assessmentDone: assessmentCounts.done,
    assessmentTotal: assessmentCounts.total,
  };
}

export default function TrackProgressPage() {
  const [filter, setFilter] = useState<"All" | "In-Progress" | "Completed">("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const router = useRouter();

  const [pastors, setPastors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        setLoadError(null);
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) {
          setLoadError("Sign in as a mentor to track assigned pastors.");
          setPastors([]);
          return;
        }

        const res = await apiGetAssignedUsers(String(mentorId));
        const users = Array.isArray(res.data?.data) ? res.data.data : [];

        const [overallRes, allAssessmentsRes] = await Promise.allSettled([
          apiGetOverallProgress(),
          apiGetAssessments(),
        ]);
        if (overallRes.status !== "fulfilled") {
          throw overallRes.reason;
        }
        const allAssessments =
          allAssessmentsRes.status === "fulfilled"
            ? parseAssessmentsListPayload(allAssessmentsRes.value.data)
            : [];
        const rows = unwrapOverallProgressList(overallRes.value as unknown as { data?: unknown });
        const byUserId = new Map<string, Record<string, unknown>>();
        for (const row of rows) {
          const rowObj = row as unknown as Record<string, unknown>;
          const userId = extractUserIdFromOverallProgressRow(rowObj);
          if (!userId) continue;
          byUserId.set(userId, rowObj);
        }

        const results = (
          await Promise.all(
            users.map(async (u: any) => {
            const uid = u._id ?? u.id;
            if (uid == null || String(uid).trim() === "") {
              return null;
            }
            const id = String(uid);
            const row = byUserId.get(id);
            const counts = await getPastorProgressCounts(id, allAssessments);
  //           return {
  //             id,
  //             name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pastor",
  //             desc: u.profileInfo || "Assigned pastor",
  //             // img: u.profilePicture || PastorImg,
  //             img:
  // u.profilePicture ||
  // getInitialsAvatar(`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()),
  //             progress: Math.min(100, Math.max(0, numFromApi(row?.overallProgress ?? row?.overall_progress))),
  //             roadmapDone: counts.roadmapDone,
  //             roadmapTotal: counts.roadmapTotal,
  //             assessmentDone: counts.assessmentDone,
  //             assessmentTotal: counts.assessmentTotal,
  //           };
  return {
  id,
  name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pastor",
  desc: u.profileInfo || "Assigned pastor",
  img:
    u.profilePicture ||
    getInitialsAvatar(`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()),
  email: u.email || "",
  phoneNumber: u.phoneNumber || u.phone || u.mobileNumber || "",
  progress: Math.min(100, Math.max(0, numFromApi(row?.overallProgress ?? row?.overall_progress))),
  roadmapDone: counts.roadmapDone,
  roadmapTotal: counts.roadmapTotal,
  assessmentDone: counts.assessmentDone,
  assessmentTotal: counts.assessmentTotal,
};
          })
          )
        ).filter((p): p is NonNullable<typeof p> => p != null && Boolean(p.id));

        setPastors(results);
      } catch (err) {
        console.error("Failed to load pastors", err);
        setLoadError("Could not load progress. Please try again.");
        setPastors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastors();
  }, []);

  const filtered = pastors.filter((p) => {
    if (filter === "In-Progress") return p.progress < 100;
    if (filter === "Completed") return p.progress === 100;
    return true;
  });

  const visible = filtered.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pagedVisible = visible.slice(pageStart, pageStart + PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-6 lg:px-8"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Track Progress</h1>
          <p className={`mt-2 ${mentorBodyText}`}>
            Monitor mentoring progress and mark completion.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 sm:px-6 lg:px-8`}>
        <div className="mx-auto w-full max-w-[1180px]">
          {loadError ? <div className={`mb-6 ${mentorWarningPanel}`}>{loadError}</div> : null}

          <div className={`${mentorFilterPanel} mb-10`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <MentorSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search pastors…"
                aria-label="Search pastors"
                className="w-full max-w-none lg:max-w-md"
              />
              <MentorFilterTabGroup
                tabs={["All", "In-Progress", "Completed"] as const}
                active={filter}
                onChange={setFilter}
                aria-label="Progress filter"
                className="w-full lg:w-auto"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading progress…</p>
            </div>
          ) : null}

          {!loading && !loadError && visible.length === 0 ? (
            <div className={mentorEmptyPanel}>
              {pastors.length === 0
                ? "No pastors are assigned to you yet."
                : search.trim()
                  ? "No pastors match your search."
                  : "No pastors in this filter."}
            </div>
          ) : null}

          {!loading && visible.length > 0 ? (
            <>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              {pagedVisible.map((pastor) => (
                <div
                  key={pastor.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open progress for ${pastor.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/mentor/MentorProgress?userId=${pastor.id}`);
                    }
                  }}
                  onClick={() => router.push(`/mentor/MentorProgress?userId=${pastor.id}`)}
                  className={`${mentorGlassCardRoadmap} cursor-pointer flex-col items-stretch gap-4 p-5 text-left sm:flex-row sm:items-center sm:gap-6`}
                >
                  <div className="relative mx-auto shrink-0 sm:mx-0">
                    <Image
                      src={pastor.img}
                      alt={pastor.name}
                      width={120}
                      height={120}
                      unoptimized={isRemoteImageSrc(pastor.img)}
                      className="h-[88px] w-[88px] rounded-xl border border-white/20 object-cover sm:h-[120px] sm:w-[120px]"
                      // className="h-[88px] w-[88px] rounded-full border border-white/20 object-cover sm:h-[120px] sm:w-[120px]" use if want rounded image
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <h4 className="text-base font-semibold text-white">{pastor.name}</h4>
                    <p className="mt-0.5 text-sm text-[#cde2f2]/90">{pastor.desc}</p>

                    {/* Roadmap & Assessment stats */}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {/* <span className="inline-flex items-center gap-1.5 rounded-md border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-2.5 py-1 text-[11px] font-medium text-[#cde2f2]">
                        <i className="fa-solid fa-map-signs text-[#8ec5eb]" aria-hidden />
                        Roadmaps&nbsp;
                        <span className="font-bold text-white tabular-nums">
                          {pastor.roadmapDone}/{pastor.roadmapTotal}
                        </span>
                      </span> */}
                      <button
  type="button"
  // onClick={(e) => {
  //   e.stopPropagation();
  //   router.push(`/mentor/MentorProgress?userId=${pastor.id}#roadmaps`);
  // }}
  onMouseDown={(e) => e.stopPropagation()}
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  router.push(`/mentor/MentorProgress?userId=${pastor.id}&section=roadmaps`);
}}
  className="inline-flex items-center gap-1.5 rounded-md border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-2.5 py-1 text-[11px] font-medium text-[#cde2f2] transition hover:bg-[#8ec5eb]/20"
>
  <i className="fa-solid fa-map-signs text-[#8ec5eb]" aria-hidden />
  Roadmaps&nbsp;
  <span className="font-bold text-white tabular-nums">
    {pastor.roadmapDone}/{pastor.roadmapTotal}
  </span>
</button>
                      {/* <span className="inline-flex items-center gap-1.5 rounded-md border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-2.5 py-1 text-[11px] font-medium text-[#cde2f2]">
                        <i className="fa-solid fa-clipboard-list text-[#8ec5eb]" aria-hidden />
                        Assessments&nbsp;
                        <span className="font-bold text-white tabular-nums">
                          {pastor.assessmentDone}/{pastor.assessmentTotal}
                        </span>
                      </span> */}
                      <button
  type="button"
  // onClick={(e) => {
  //   e.stopPropagation();
  //   router.push(`/mentor/MentorProgress?userId=${pastor.id}#assessments`);
  // }}
  onMouseDown={(e) => e.stopPropagation()}
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
  router.push(`/mentor/MentorProgress?userId=${pastor.id}&section=assessments`);
}}
  className="inline-flex items-center gap-1.5 rounded-md border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-2.5 py-1 text-[11px] font-medium text-[#cde2f2] transition hover:bg-[#8ec5eb]/20"
>
  <i className="fa-solid fa-clipboard-list text-[#8ec5eb]" aria-hidden />
  Assessments&nbsp;
  <span className="font-bold text-white tabular-nums">
    {pastor.assessmentDone}/{pastor.assessmentTotal}
  </span>
</button>
                    </div>

                    <div className="mt-4">
                      <p className="mb-1 text-xs font-medium text-[#cde2f2]">Progress</p>
                      <div className="mb-1.5 h-1.5 w-full rounded-full bg-white/15">
                        <div
                          className="h-1.5 rounded-full bg-[#8ec5eb]"
                          style={{ width: `${Math.min(100, pastor.progress)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[#cde2f2]">{pastor.progress}%</p>
                        {pastor.progress === 100 ? (
                          <button
                            type="button"
                            className={`${mentorPrimaryCta} px-4 py-1.5 text-xs`}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/mentor/MentorProgress?userId=${pastor.id}`);
                            }}
                          >
                            Mark as Complete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {(() => {
  const email = String(pastor.email || "").trim();
  const phoneRaw = String(pastor.phoneNumber || "").trim();
  const phoneHref = phoneRaw.replace(/[^\d+]/g, "");
  const whatsappHref = phoneRaw.replace(/[^\d]/g, "");
  const hasPhone = /\d/.test(phoneRaw);

  const activeIconClass = "transition hover:text-white";
  const disabledIconClass = "cursor-not-allowed text-white/30";

  return (
    <div className="mt-3 flex gap-4 text-[15px] text-[#8ec5eb]">
      {email ? (
        <a
          href={`mailto:${email}`}
          onClick={(e) => e.stopPropagation()}
          className={activeIconClass}
          title="Email"
          aria-label={`Email ${pastor.name}`}
        >
          <i className="fa-regular fa-envelope" aria-hidden />
        </a>
      ) : (
        <span className={disabledIconClass} title="No email available">
          <i className="fa-regular fa-envelope" aria-hidden />
        </span>
      )}

      {hasPhone ? (
        <a
          href={`sms:${phoneHref}`}
          onClick={(e) => e.stopPropagation()}
          className={activeIconClass}
          title="Message"
          aria-label={`Message ${pastor.name}`}
        >
          <i className="fa-regular fa-comment" aria-hidden />
        </a>
      ) : (
        <span className={disabledIconClass} title="No phone number available">
          <i className="fa-regular fa-comment" aria-hidden />
        </span>
      )}

      {hasPhone ? (
        <a
          href={`tel:${phoneHref}`}
          onClick={(e) => e.stopPropagation()}
          className={activeIconClass}
          title="Call"
          aria-label={`Call ${pastor.name}`}
        >
          <i className="fa-solid fa-phone" aria-hidden />
        </a>
      ) : (
        <span className={disabledIconClass} title="No phone number available">
          <i className="fa-solid fa-phone" aria-hidden />
        </span>
      )}

      {hasPhone ? (
        <a
          href={`https://wa.me/${whatsappHref}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={activeIconClass}
          title="WhatsApp"
          aria-label={`WhatsApp ${pastor.name}`}
        >
          <i className="fa-brands fa-whatsapp" aria-hidden />
        </a>
      ) : (
        <span className={disabledIconClass} title="No phone number available">
          <i className="fa-brands fa-whatsapp" aria-hidden />
        </span>
      )}
    </div>
  );
})()}
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#cde2f2] sm:flex-row">
                <p>
                  Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, visible.length)} of {visible.length}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-white">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
