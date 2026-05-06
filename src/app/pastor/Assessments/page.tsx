"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorSearchBar from "@/app/Components/pastor/PastorSearchBar";
import PastorFilterTabGroup from "@/app/Components/pastor/PastorFilterTabGroup";
import { apiGetAppointments } from "@/app/Services/appointments.service";
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

// type Row = {
//   id: string;
//   title: string;
//   desc: string;
//   status: "Due" | "Not Started" | "Completed" | "Submitted";
//   dueDate: string;
//   submittedAt?: string;
//   completedAt?: string;
//   imgUrl: string | null;
//   button: string;
//   createdOn?: string;
//   createdBy?: string;
// };
type Row = {
  id: string;
  title: string;
  desc: string;
  status: "Due" | "Not Started" | "Completed" | "Submitted";
  dueDate: string;
  submittedAt?: string;
  completedAt?: string;
  imgUrl: string | null;
  button: string;
  createdOn?: string;
  createdBy?: string;
  meeting?: {
    id: string;
    mentorName: string;
    meetingDate: string;
    platform: string;
    notes?: string;
  };
};

function isDueNowOrPast(dueDateRaw?: string): boolean {
  if (!dueDateRaw) return false;
  const due = new Date(dueDateRaw);
  if (Number.isNaN(due.getTime())) return false;
  // Treat the whole due day as valid by comparing against local end-of-day.
  due.setHours(23, 59, 59, 999);
  return Date.now() > due.getTime();
}

function getAssessmentPrimaryHref(assessmentId: string, status: Row["status"]): string {
  if (status === "Completed" || status === "Submitted") {
    return `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(assessmentId)}&readOnly=1`;
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
  const [selectedMeeting, setSelectedMeeting] = useState<Row["meeting"] | null>(null);

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
        // const [assessmentRes, progressRes] = await Promise.all([
        //   apiGetAssignedAssessments(sessionUserId),
        //   apiGetUserProgress(sessionUserId),
        // ]);
        const [assessmentRes, progressRes, appointmentsRes] = await Promise.all([
  apiGetAssignedAssessments(sessionUserId),
  apiGetUserProgress(sessionUserId),
  apiGetAppointments({ userId: sessionUserId, futureOnly: false } as any),
]);

        const list = parseAssignedAssessmentsListBody(assessmentRes.data);

        const progressData = unwrapProgressData(progressRes);
        const assessmentProgress = progressData?.assessments || [];
const appointmentsBody: any = appointmentsRes?.data;
const appointmentsList: any[] = Array.isArray(appointmentsBody)
  ? appointmentsBody
  : Array.isArray(appointmentsBody?.data)
    ? appointmentsBody.data
    : Array.isArray(appointmentsBody?.data?.data)
      ? appointmentsBody.data.data
      : [];
        const mapped = (await Promise.all(
          list.map(async (item) => {
            const flat = flattenAssignedAssessmentRow(item);
            if (!flat) return null;
           
            // const { assessment, assessmentId: aid, assignmentId, dueDate, updatedAt } = flat;
            const { assessment, assessmentId: aid, assignmentId, updatedAt } = flat;

const rawItem: any = item;
const rawFlat: any = flat;

const dueDate =
  rawFlat.dueDate ??
  rawFlat.deadline ??
  rawFlat.endDate ??
  rawFlat.assignedDueDate ??
  rawItem.dueDate ??
  rawItem.deadline ??
  rawItem.endDate ??
  rawItem.assignedDueDate ??
  rawItem.assignment?.dueDate ??
  rawItem.assignment?.deadline ??
  "";
            const progress = assessmentProgress.find(
              (p: { assessmentId?: string; assignmentId?: string }) =>
                String(p.assessmentId) === aid ||
                (assignmentId && p.assignmentId && String(p.assignmentId) === assignmentId),
            );

            const ps = String(progress?.status || "").toLowerCase().replace(/\s+/g, "_");
            let status: Row["status"] = "Not Started";
            if (ps === "completed" || ps === "reviewed") {
              status = "Completed";
            } else if (ps === "submitted") {
              status = "Submitted";
            } else if (
              ps === "in_progress" ||
              ps === "inprogress" ||
              ps === "due"
            ) {
              status = "Due";
            } else if (isDueNowOrPast(dueDate)) {
              status = "Due";
            }

            const a = assessment as Record<string, unknown>;
            // const rawBanner =
            //   (typeof a.bannerImage === "string" && a.bannerImage) ||
            //   (typeof a.imageUrl === "string" && a.imageUrl) ||
            //   (typeof a.image === "string" && a.image) ||
            //   undefined;
            // const imgUrl = resolveApiMediaUrl(rawBanner);

            // return {
            //   id: aid,
            const rawBanner =
  (typeof a.bannerImage === "string" && a.bannerImage) ||
  (typeof a.imageUrl === "string" && a.imageUrl) ||
  (typeof a.image === "string" && a.image) ||
  undefined;

const imgUrl = resolveApiMediaUrl(rawBanner);

const linkedMeeting = appointmentsList.find((appointment: any) => {
  const notes = String(appointment?.notes ?? "");
  return notes.includes(`assessmentId=${aid}`);
});

const meeting = linkedMeeting
  ? {
      id: String(linkedMeeting._id ?? linkedMeeting.id ?? ""),
      mentorName:
        `${linkedMeeting?.mentor?.firstName ?? ""} ${linkedMeeting?.mentor?.lastName ?? ""}`.trim() ||
        linkedMeeting?.mentor?.email ||
        "Mentor",
      // meetingDate: linkedMeeting.meetingDate
      //   ? new Date(linkedMeeting.meetingDate).toLocaleString()
      //   : "N/A",
      meetingDate: linkedMeeting.meetingDate
  ? new Date(linkedMeeting.meetingDate).toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  : "N/A",
      platform: linkedMeeting.platform || "N/A",
      notes: linkedMeeting.notes,
    }
  : undefined;

return {
  id: aid,
              title: (assessment?.name as string) || "Assessment",
              desc: (assessment?.description as string) || "",
              status,
              dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : "",
              submittedAt: updatedAt ? new Date(updatedAt).toLocaleDateString() : undefined,
              completedAt:
                status === "Completed" && updatedAt
                  ? new Date(updatedAt).toLocaleDateString()
                  : undefined,
              imgUrl,
              button:
                status === "Completed"
                  ? "View Results"
                  : status === "Submitted"
                    ? "View submission"
                    : "Start Now",
              createdOn: typeof a.createdAt === "string" ? new Date(a.createdAt).toLocaleDateString() : undefined,
              // createdBy: (typeof a.createdBy === "string" ? a.createdBy : undefined) || "Admin",
              createdBy: (() => {
  const rawItem = item as any;
  const rawFlat = flat as any;

  const assignedBy =
    rawFlat.assignedBy ??
    rawFlat.assignedByUser ??
    rawFlat.createdBy ??
    rawItem.assignedBy ??
    rawItem.assignedByUser ??
    rawItem.createdBy ??
    a.assignedBy ??
    a.createdBy;

  if (typeof assignedBy === "string") return assignedBy;

  if (assignedBy && typeof assignedBy === "object") {
    const firstName = assignedBy.firstName ?? "";
    const lastName = assignedBy.lastName ?? "";
    const fullName = `${firstName} ${lastName}`.trim();

    return fullName || assignedBy.email || assignedBy.name;
  }

  return undefined;
})(),
meeting,
            };
          }),
        )).filter((r): r is NonNullable<typeof r> => r != null);

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
              {/* {filtered.map((item) => (
                <div
                  key={item.id}
                  className={`${pastorGlassCard} md:flex-row`}
                > */}
                {filtered.map((item) => {
  const hasMeeting = Boolean(item.meeting?.id);

  const displayStatus =
    item.status === "Completed" && !hasMeeting ? "Submitted" : item.status;

  const primaryButtonText =
    item.status === "Completed" && !hasMeeting ? "Schedule Meeting" : item.button;

  return (
    <div
      key={item.id}
      className={`${pastorGlassCard} md:flex-row`}
    >
                  {/* <div className="relative m-4 h-[180px] w-full flex-shrink-0 md:m-5 md:h-[200px] md:w-[200px]">
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
                    {(item.status === "Due" || item.status === "Not Started") && item.dueDate ? (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-[#fff6d8] px-2 py-[3px] text-xs font-semibold text-[#d38a00]">
                        <i className="fa-regular fa-calendar text-xs" />
                        Due: {item.dueDate}
                      </div>
                    ) : null}
                  </div> */}

                  <div className="m-4 flex w-full flex-shrink-0 flex-col gap-3 md:m-5 md:w-[200px]">
  <div className="relative h-[180px] w-full md:h-[200px]">
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

    {(item.status === "Due" || item.status === "Not Started") && item.dueDate ? (
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-[#fff6d8] px-2 py-[3px] text-xs font-semibold text-[#d38a00]">
        <i className="fa-regular fa-calendar text-xs" />
        Due: {item.dueDate}
      </div>
    ) : null}
  </div>
{/* 
  <div className="space-y-1 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs text-[#d9ebf8]">
    <p>
      <span className="font-medium text-white">Assigned by :</span>{" "}
      {item.createdBy || "N/A"}
    </p>

    <p>
      <span className="font-medium text-white">Due date :</span>{" "}
      {item.dueDate || "N/A"}
    </p>

    <p>
      <span className="font-medium text-white">Completed on :</span>{" "}
      {item.completedAt ?? item.submittedAt ?? ""}
    </p>
  </div> */}
  <div className="text-xs text-[#d9ebf8]">
  <p>
    <span className="font-medium text-white">Completed on :</span>{" "}
    {item.completedAt ?? item.submittedAt ?? "N/A"}
  </p>
</div>
</div>

                  <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="mb-1 text-[15px] font-semibold leading-tight text-white md:text-[17px]">
                        {item.title}
                      </h3>
                      <p className={`mb-3 ${pastorRoadmapDescription}`}>{item.desc}</p>

                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-medium text-[#d9ebf8]">Status</span>
                        {/* <span
                          className={`rounded px-2 py-[2px] text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span> */}
                        <span
  className={`rounded px-2 py-[2px] text-xs font-medium ${getStatusColor(displayStatus)}`}
>
  {displayStatus}
</span>
                      </div>
{/* <div className="mb-3 space-y-1 text-xs text-[#d9ebf8]">
  <p>
    <span className="font-medium">Assigned by :</span>{" "}
    {item.createdBy || "N/A"}
  </p>

  <p>
    <span className="font-medium">Due date :</span>{" "}
    {item.dueDate || "N/A"}
  </p>
</div> */}
                      {/* {item.dueDate && (
                        <p className="mb-2 text-xs text-[#d9ebf8]">Due on : {item.dueDate}</p>
                      )} */}

                      {item.status === "Submitted" && (
                        <p className="mb-2 text-xs text-[#d9ebf8]">Submitted on : {item.submittedAt ?? item.dueDate}</p>
                      )}

                      {/* {item.status === "Completed" && (
                        <p className="mt-2 text-xs text-[#d9ebf8]">Completed on : {item.completedAt ?? item.submittedAt ?? item.dueDate}</p>
                      )} */}
                    </div>

                    {/* <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="grid grid-cols-3 gap-8 flex-1">
                        <div className="text-center">
                          <p className="text-xs text-[#d9ebf8]/60 mb-1">Created on</p>
                          <p className="text-sm font-semibold text-white">{item.createdOn || "N/A"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#d9ebf8]/60 mb-1">Created by</p>
                          <p className="text-sm font-semibold text-white">{item.createdBy || "Admin"}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-[#d9ebf8]/60 mb-1">Status</p>
                          <p className="text-sm font-semibold text-white">{item.status}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
                        className={`${pastorPrimaryCta} shrink-0 px-4 text-xs md:px-5 md:text-sm`}
                      >
                        {item.button}
                      </button>
                    </div> */}
                    {/* <div className="mt-4 flex justify-end">
  <button
    type="button"
    onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
    className={`${pastorPrimaryCta} shrink-0 px-4 text-xs md:px-5 md:text-sm`}
  >
    {item.button}
  </button>
</div> */}
{/* <div className="mt-4 flex justify-end gap-3">

  {item.meeting?.id && (
  <button
    type="button"
    onClick={() =>
      router.push(
        `/pastor/mentoring-session/${encodeURIComponent(item.meeting!.id)}`
      )
    }
    className="shrink-0 rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25 md:px-5 md:text-sm"
  >
    Meeting
  </button>
)}

  <button
    type="button"
    onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
    className={`${pastorPrimaryCta} shrink-0 px-4 text-xs md:px-5 md:text-sm`}
  >
    {item.button}
  </button>
</div> */}
{/* 
<div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="min-h-[44px]">
    {item.meeting?.id ? (
      <div className="flex items-center gap-3">
        <p className="text-xs font-medium text-[#d9ebf8] md:text-sm">
          Meeting fixed on :
          <span className="ml-1 text-white">
            {item.meeting.meetingDate || "N/A"}
          </span>
        </p>

        <button
          type="button"
          onClick={() =>
            router.push(
               `/pastor/Appointments/${encodeURIComponent(item.meeting!.id)}`
            )
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/25 hover:text-white"
          title="View meeting"
        >
          <i className="fa-solid fa-arrow-right" />
        </button>
      </div>
    ) : null}
  </div>

  <button
    type="button"
    onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
    className={`${pastorPrimaryCta} shrink-0 px-4 text-xs md:px-5 md:text-sm`}
  >
    {item.button}
  </button>
</div> */}
<div className="mt-4 flex flex-col gap-3">
  <div className="flex justify-end">
    {/* <button
      type="button"
      onClick={() => router.push(getAssessmentPrimaryHref(item.id, item.status))}
      className={`${pastorPrimaryCta} shrink-0 whitespace-nowrap px-4 text-xs md:px-5 md:text-sm`}
    >
      {item.button}
    </button> */}
    <button
  type="button"
  // onClick={() => {
  //   if (item.status === "Completed" && !hasMeeting) {
  //     router.push(
  //       `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(item.id)}&readOnly=1&scheduleMeeting=1`
  //     );
  //     return;
  //   }

  //   router.push(getAssessmentPrimaryHref(item.id, item.status));
  // }}
  onClick={() => {
  if (item.status === "Completed" && !hasMeeting) {
    router.push(
      `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(item.id)}&readOnly=1&scheduleMeeting=1`
    );
    return;
  }

  if (item.status === "Completed" && hasMeeting) {
    router.push(
      `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(item.id)}`
    );
    return;
  }

  router.push(getAssessmentPrimaryHref(item.id, item.status));
}}
  className={`${pastorPrimaryCta} shrink-0 whitespace-nowrap px-4 text-xs md:px-5 md:text-sm`}
>
  {primaryButtonText}
</button>
  </div>

  {item.meeting?.id && (
    <div className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8ec5eb]">
          Meeting fixed on
        </p>

        <p className="mt-1 truncate text-xs font-semibold text-white md:text-sm">
          {item.meeting.meetingDate || "N/A"}
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          router.push(
            `/pastor/Appointments/${encodeURIComponent(item.meeting!.id)}`
          )
        }
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/25 hover:text-white"
        title="View meeting"
        aria-label="View meeting"
      >
        <i className="fa-solid fa-arrow-right" />
      </button>
    </div>
  )}
</div>
                  </div>
                </div>
                            );
            })}
            </div>
          )}
        </div>
      {/* </main>
    </div>
  );
} */}
      </main>

      {selectedMeeting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#062946] p-6 text-white shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Meeting Details</h3>

              <button
                type="button"
                onClick={() => setSelectedMeeting(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 hover:bg-white/15"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[#d9ebf8]">
              <p>
                <span className="font-semibold text-white">Mentor:</span>{" "}
                {selectedMeeting.mentorName}
              </p>

              <p>
                <span className="font-semibold text-white">Date & Time:</span>{" "}
                {selectedMeeting.meetingDate}
              </p>

              <p>
                <span className="font-semibold text-white">Platform:</span>{" "}
                <span className="capitalize">{selectedMeeting.platform}</span>
              </p>

              {selectedMeeting.notes && (
                <p>
                  <span className="font-semibold text-white">Notes:</span>{" "}
                  {selectedMeeting.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
