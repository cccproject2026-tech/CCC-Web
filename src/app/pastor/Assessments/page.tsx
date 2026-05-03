"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorSearchBar from "@/app/Components/pastor/PastorSearchBar";
import PastorFilterTabGroup from "@/app/Components/pastor/PastorFilterTabGroup";
import {
  pastorContainer,
  pastorControlsRow,
  pastorEmptyPanel,
  pastorEyebrowDot,
  pastorEyebrowPill,
  pastorGlassCard,
  pastorHeroOverlay,
  pastorMainGradient,
  pastorPageRoot,
  pastorPrimaryCta,
  pastorRoadmapDescription,
  pastorSpinner,
} from "@/app/Components/pastor/pastor-theme";
import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import { getCookie } from "@/app/utils/cookies";
import { resolveApiMediaUrl } from "@/app/utils/image";
import {
  apiGetAssignedAssessments,
  parseAssignedAssessmentsListBody,
  flattenAssignedAssessmentRow,
} from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import {
  subscribePastorAssignmentsBroadcast,
  subscribeProgressUpdated,
} from "@/app/utils/progress-sync";

const ASSESSMENT_TABS = ["All", "Due", "Not Started", "Completed", "Submitted"] as const;

function assessmentTabFromSearchParam(
  raw: string | null,
): (typeof ASSESSMENT_TABS)[number] | null {
  if (!raw) return null;
  const d = decodeURIComponent(raw)
    .trim()
    .toLowerCase()
    .replace(/\+/g, " ");
  if (d === "in progress" || d === "inprogress") return "Due";
  const match = ASSESSMENT_TABS.find((t) => t.toLowerCase() === d);
  return match ?? null;
}

type Row = {
  id: string;
  title: string;
  desc: string;
  status: "Due" | "Not Started" | "Completed" | "Submitted";
  date: string;
  submittedAt?: string;
  imgUrl: string | null;
  button: string;
  meeting?: string;
};

function getAssessmentPrimaryHref(assessmentId: string, status: Row["status"]): string {
  if (status === "Completed" || status === "Submitted") {
    return `/pastor/AssessmentEvaluation?assessmentId=${encodeURIComponent(assessmentId)}`;
  }
  return `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(assessmentId)}`;
}

function readSessionUserId(): string | null {
  try {
    const userCookie = getCookie("user");
    if (!userCookie) return null;
    const user = JSON.parse(userCookie) as { id?: string; _id?: string };
    const id = user.id || user._id;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export default function PastorAssessments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<(typeof ASSESSMENT_TABS)[number]>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionUserId] = useState<string | null>(() => readSessionUserId());

  useLayoutEffect(() => {
    const t = assessmentTabFromSearchParam(searchParams.get("tab"));
    if (t) setActiveTab(t);
  }, [searchParams]);

  const loadAssessments = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!sessionUserId) {
        setLoading(false);
        return;
      }
      if (!opts?.silent) setLoading(true);
      try {
        const [assessmentRes, progressRes] = await Promise.all([
          apiGetAssignedAssessments(sessionUserId),
          apiGetUserProgress(sessionUserId),
        ]);

        const list = parseAssignedAssessmentsListBody(assessmentRes.data);

        const progressData = unwrapProgressData(progressRes);
        const assessmentProgress = progressData?.assessments || [];
        const mapped = list
          .map((item) => {
            const flat = flattenAssignedAssessmentRow(item);
            if (!flat) return null;
            const { assessment, assessmentId: aid, assignmentId, dueDate, meetingDate, updatedAt } = flat;
            const progress = assessmentProgress.find(
              (p: { assessmentId?: string; assignmentId?: string }) =>
                String(p.assessmentId) === aid ||
                (assignmentId && p.assignmentId && String(p.assignmentId) === assignmentId),
            );

            const ps = String(progress?.status || "").toLowerCase().replace(/\s+/g, "_");
            let status: Row["status"] = "Not Started";
            if (ps === "completed" || ps === "reviewed") {
              status = meetingDate && new Date(meetingDate).getTime() < Date.now() ? "Completed" : "Submitted";
            }
            else if (ps === "submitted") status = "Submitted";
            else if (
              ps === "in_progress" ||
              ps === "inprogress" ||
              ps === "assigned" ||
              ps === "due"
            )
              status = "Due";

            const a = assessment as Record<string, unknown>;
            const rawBanner =
              (typeof a.bannerImage === "string" && a.bannerImage) ||
              (typeof a.imageUrl === "string" && a.imageUrl) ||
              (typeof a.image === "string" && a.image) ||
              undefined;
            const imgUrl = resolveApiMediaUrl(rawBanner);

            return {
              id: aid,
              title: (assessment?.name as string) || "Assessment",
              desc: (assessment?.description as string) || "",
              status,
              date: dueDate ? new Date(dueDate).toLocaleDateString() : "",
              submittedAt: updatedAt ? new Date(updatedAt).toLocaleDateString() : undefined,
              imgUrl,
              button:
                status === "Completed"
                  ? "View Results"
                  : status === "Submitted"
                    ? "View submission"
                    : "Start Now",
              meeting: meetingDate ? new Date(meetingDate).toLocaleDateString() : undefined,
            };
          })
          .filter((r): r is NonNullable<typeof r> => r != null);

        setAssessments(mapped as Row[]);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
      } finally {
        setLoading(false);
      }
    },
    [sessionUserId],
  );

  useEffect(() => {
    void loadAssessments();
  }, [loadAssessments]);

  useEffect(() => {
    if (!sessionUserId) return;

    const refetch = () => void loadAssessments({ silent: true });

    const unsubProgress = subscribeProgressUpdated((uid) => {
      if (uid === sessionUserId) refetch();
    });
    const unsubBc = subscribePastorAssignmentsBroadcast((ids) => {
      if (ids.includes(sessionUserId)) refetch();
    });
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      unsubProgress();
      unsubBc();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [sessionUserId, loadAssessments]);

  const filtered = assessments.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (a.title || "").toLowerCase().includes(q);
    if (activeTab === "All") return matchesSearch;
    return a.status === activeTab && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Due":
        return "bg-yellow-100 text-yellow-700";
      case "Not Started":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Submitted":
        return "bg-[#E0EAFF] text-[#1D4ED8]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className={pastorPageRoot}>
        <PastorHeader showFullHeader={true} />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20">
          <div className={pastorSpinner} />
          <p className="text-sm text-[#cde2f2]">Loading assessments…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={pastorPageRoot}>
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex h-[200px] items-end justify-start bg-cover bg-center px-4 pb-8 md:h-[250px] md:px-8 md:pb-12 lg:px-16"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={pastorHeroOverlay} />
        <div className="relative z-10">
          <p className={pastorEyebrowPill}>
            <span className={pastorEyebrowDot} />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white md:text-4xl">Assessments</h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Complete assigned assessments and monitor your submission status.
          </p>
        </div>
      </section>

      <main className={pastorMainGradient}>
        <div className={pastorContainer}>
          <div className={`${pastorControlsRow} md:mb-10`}>
            <PastorSearchBar
              variant="absolute"
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search assessments…"
              aria-label="Search assessments"
              className="lg:w-[350px]"
            />

            <PastorFilterTabGroup
              tabs={ASSESSMENT_TABS}
              active={activeTab}
              onChange={setActiveTab}
              className="w-full lg:w-auto"
            />
          </div>

          {filtered.length === 0 ? (
            <div className={pastorEmptyPanel}>No assessments to show.</div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`${pastorGlassCard} md:flex-row`}
                >
                  <div className="relative m-4 h-[180px] w-full flex-shrink-0 md:m-5 md:h-[200px] md:w-[200px]">
                    {item.imgUrl ? (
                      <Image
                        src={item.imgUrl}
                        alt=""
                        width={200}
                        height={200}
                        className="h-full w-full rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                    )}
                    {(item.status === "Due" || item.status === "Not Started") && item.date ? (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-[#fff6d8] px-2 py-[3px] text-xs font-semibold text-[#d38a00]">
                        <i className="fa-regular fa-calendar text-xs" />
                        Due: {item.date}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                    <div>
                      <h3 className="mb-1 text-[15px] font-semibold leading-tight text-white md:text-[17px]">
                        {item.title}
                      </h3>
                      <p className={`mb-3 ${pastorRoadmapDescription}`}>{item.desc}</p>

                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-medium text-[#d9ebf8]">Status</span>
                        <span
                          className={`rounded px-2 py-[2px] text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {item.status === "Submitted" && (
                        <>
                          <p className="mb-2 text-xs text-[#d9ebf8]">Submitted on : {item.submittedAt ?? item.date}</p>
                          {item.meeting ? (
                            <p className="inline-block rounded-md bg-white/15 px-3 py-2 text-xs font-medium text-[#d9ebf8]">
                              Meeting: {item.meeting}
                            </p>
                          ) : null}
                        </>
                      )}

                      {item.status === "Completed" && (
                        <p className="mt-2 text-xs text-[#d9ebf8]">Completed on : {item.meeting ?? item.date}</p>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
                        className={`${pastorPrimaryCta} px-4 text-xs md:px-5 md:text-sm`}
                      >
                        {item.button}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
