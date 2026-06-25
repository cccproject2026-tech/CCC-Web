"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense, useCallback, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorSpinner,
} from "@/app/director/directorUi";
import { DirectorFilterSection } from "@/app/director/ui";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "@/app/pastor/pastor-roadmap-dashboard-shell";
import HeroBg from "@/app/Assets/self-revitalization-hero.png";
import PhaseImg from "@/app/Assets/phase-img.png";
import { apiGetRoadmapById } from "@/app/Services/api";
import { apiGetExtras } from "@/app/Services/roadmaps.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import {
  deriveTaskStatusForList,
  unwrapProgressData,
  mergeProgressOntoRoadmaps,
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { subscribeProgressUpdated } from "@/app/utils/progress-sync";
import { pastorRoadmapDescriptionLineClamp3 } from "@/app/Components/pastor/pastor-theme";
import { resolveApiMediaUrl, isRemoteImageSrc } from "@/app/utils/image";

const filterSelectClass =
  "h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-white outline-none transition focus:border-[#3498DB]/45 focus:ring-1 focus:ring-[#3498DB]/30";

function getSessionUserId(): string {
  return getPastorUserId() || "";
}

function formatMeetingDate(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMeetingTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function readAppointmentField(appt: Record<string, any>, key: string): string {
  const metadata = appt.metadata || appt.meta || appt.context || {};
  return String(appt[key] ?? metadata?.[key] ?? "").trim();
}

function notesContainToken(notes: string, key: string, value?: string | null): boolean {
  const target = String(value ?? "").trim();
  if (!target) return false;
  return notes.includes(`${key}:${target}`) || notes.includes(`${key}=${target}`);
}

function resolveAssessmentIdFromExtra(extra: any): string | null {
  const direct = extra?.assessmentId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const pickId = (obj: any): string | null => {
    if (!obj || typeof obj !== "object") return null;
    const id = obj?._id ?? obj?.id ?? obj?.assessmentId;
    return id ? String(id).trim() : null;
  };

  return pickId(extra?.assessment) || pickId(extra?.selectedAssessment) || null;
}

function findAssessmentExtra(items: any[] | undefined): any | null {
  if (!Array.isArray(items)) return null;

  for (const item of items) {
    const type = String(item?.type || "").toUpperCase();
    if (type === "ASSESSMENT") return item;

    const fromSections = findAssessmentExtra(item?.sections);
    if (fromSections) return fromSections;

    const fromCheckboxes = findAssessmentExtra(item?.checkboxes);
    if (fromCheckboxes) return fromCheckboxes;
  }

  return null;
}

function matchAppointmentForTask(
  appointments: Record<string, any>[],
  params: {
    roadmapId: string;
    taskId: string;
    assessmentId: string;
  },
) {
  const matches = appointments
    .map((appt) => {
      const status = String(appt?.status ?? "").toLowerCase();
      if (status.includes("cancel")) return { appt, score: -1 };

      const notes = String(appt?.notes ?? "");
      let score = 0;
      const assessmentMatched =
        readAppointmentField(appt, "assessmentId") === params.assessmentId ||
        notesContainToken(notes, "assessmentId", params.assessmentId);
      const taskMatched =
        readAppointmentField(appt, "taskId") === params.taskId ||
        notesContainToken(notes, "taskId", params.taskId);

      if (assessmentMatched) {
        score += 10;
      }

      if (taskMatched) {
        score += 4;
      }

      if (!assessmentMatched && !taskMatched) {
        return { appt, score: -1 };
      }

      if (
        readAppointmentField(appt, "roadmapId") === params.roadmapId ||
        notesContainToken(notes, "roadmapId", params.roadmapId)
      ) {
        score += 4;
      }

      return { appt, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aTime = new Date(String(a.appt?.meetingDate ?? "")).getTime();
      const bTime = new Date(String(b.appt?.meetingDate ?? "")).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

  return matches[0]?.appt ?? null;
}

function SelfRevitalizationContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("id")?.trim() || null;
  const completedTaskIdParam = searchParams.get("completedTaskId")?.trim() || "";
  const sessionUserId = getSessionUserId();

  const [divisionFilter, setDivisionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({});
  const [taskMeetings, setTaskMeetings] = useState<Record<string, Record<string, any>>>({});
  const [taskUpdatedDates, setTaskUpdatedDates] = useState<Record<string, string>>({});

  const overridesStorageKey = useMemo(() => {
    const uid = String(sessionUserId || "").trim();
    const pid = String(roadmapId || "").trim();
    return uid && pid ? `ccc:phase-completed:${uid}:${pid}` : "";
  }, [sessionUserId, roadmapId]);

  const readPersistedOverrides = useCallback((): Record<string, string> => {
    if (typeof window === "undefined") return {};
    if (!overridesStorageKey) return {};
    try {
      const raw = window.localStorage.getItem(overridesStorageKey);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as string[] | Record<string, unknown>;
      const ids = Array.isArray(parsed)
        ? parsed
        : Object.keys(parsed || {});
      const out: Record<string, string> = {};
      ids.map(String).map((s) => s.trim()).filter(Boolean).forEach((id) => {
        out[id] = "Completed";
      });
      return out;
    } catch {
      return {};
    }
  }, [overridesStorageKey]);

  const persistOverrides = useCallback((next: Record<string, string>) => {
    if (typeof window === "undefined") return;
    if (!overridesStorageKey) return;
    try {
      const ids = Object.entries(next)
        .filter(([, v]) => v === "Completed")
        .map(([k]) => k);
      window.localStorage.setItem(overridesStorageKey, JSON.stringify(ids));
    } catch {
      // ignore
    }
  }, [overridesStorageKey]);

  const normalizeStatus = (status: unknown) =>
    String(status ?? "").trim().toLowerCase().replace(/[_\s]+/g, " ");

  const isCompletedStatus = (status: unknown) => {
    const s = String(status ?? "").trim().toLowerCase();
    return s === "completed" || s === "complete";
  };

  const statusLabel = (status: unknown) => {
    const s = normalizeStatus(status);
    if (!s || s === "not started") return "Not Started";
    if (s.includes("complete")) return "Completed";
    if (s.includes("progress")) return "In-progress";
    if (s.includes("due") || s.includes("overdue")) return "Due";
    return "Not Started";
  };

  /** Align cards with `/pastor/revitalization-roadmap` + jumpstart (GET /progress merge). */
  const taskStatusFromProgress = (
    item: { _id?: string; id?: string; status?: unknown; endDate?: string },
  ): string => {
    const tid = resolveNestedTemplateItemId(item);
    const ov = tid ? statusOverrides[tid] : undefined;
    if (ov) return ov;
    if (!roadmapId || !tid) return statusLabel(item.status);
    const derived: RoadmapAssignmentUi["status"] = deriveTaskStatusForList(progressData, {
      parentRoadmapId: roadmapId,
      taskId: tid,
      itemStatus: item.status != null && String(item.status).trim() !== "" ? String(item.status) : undefined,
      endDate: typeof item.endDate === "string" ? item.endDate : undefined,
    });

    if (derived === "In-progress") return "In-progress";
    return derived;
  };

  const loadRoadmapAndProgress = useCallback(async () => {
    if (!roadmapId) {
      setError("Missing roadmap link. Open this phase from Revitalization Roadmap.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const userId = getSessionUserId();
      const rmRes = await apiGetRoadmapById(roadmapId);
      const body = rmRes.data as { data?: unknown };
      let doc = body?.data ?? rmRes.data;
      if (userId) {
        try {
          const progRes = await apiGetUserProgress(userId);
          const prog = unwrapProgressData(progRes);
          setProgressData(prog);
          if (doc && typeof doc === "object" && !Array.isArray(doc) && prog) {
            const merged = mergeProgressOntoRoadmaps([doc as never], prog);
            doc = merged[0] ?? doc;
          }
        } catch {
          setProgressData(null);
        }
      } else {
        setProgressData(null);
        setError("User session not found. Please sign in again.");
      }
      setRoadmap(doc);
    } catch (err) {
      console.error("Failed to fetch roadmap", err);
      setRoadmap(null);
      setProgressData(null);
      setError("Could not load this roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [roadmapId]);

  useEffect(() => {
    void loadRoadmapAndProgress();
  }, [loadRoadmapAndProgress, pathname]);

  // Hydrate persisted "Completed" overrides for this phase (prevents flip-flopping between tasks).
  useEffect(() => {
    if (!overridesStorageKey) return;
    setStatusOverrides((prev) => ({ ...readPersistedOverrides(), ...prev }));
  }, [overridesStorageKey, readPersistedOverrides]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && roadmapId) void loadRoadmapAndProgress();
    };
    document.addEventListener("visibilitychange", onVis);
    const unsub = subscribeProgressUpdated((uid) => {
      if (uid === getSessionUserId() && roadmapId) void loadRoadmapAndProgress();
    });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      unsub();
    };
  }, [roadmapId, loadRoadmapAndProgress]);

  useEffect(() => {
    if (!completedTaskIdParam) return;
    setStatusOverrides((prev) => {
      const next = { ...prev, [completedTaskIdParam]: "Completed" };
      persistOverrides(next);
      return next;
    });
  }, [completedTaskIdParam, persistOverrides]);

  // When progress API confirms completion, keep overrides persisted (optional),
  // but also ensures we re-persist after a refetch.
  useEffect(() => {
    if (!overridesStorageKey) return;
    if (!progressData) return;
    if (!roadmapId) return;
    const current = readPersistedOverrides();
    if (!Object.keys(current).length) return;
    // If API already confirms completed, leave as-is; we just re-persist to be safe.
    persistOverrides({ ...current });
  }, [progressData, overridesStorageKey, roadmapId, readPersistedOverrides, persistOverrides]);

  const title = roadmap?.name || "Self Revitalization Phase";
  const phase = roadmap?.phase || "";
  const subtitle = String(roadmap?.roadMapDetails || roadmap?.description || "").trim();
  const nestedRoadmaps = useMemo((): any[] => unwrapNestedRoadmapsArray(roadmap), [roadmap]);

  useEffect(() => {
    if (!roadmapId || !sessionUserId || nestedRoadmaps.length === 0) {
      setTaskMeetings({});
      return;
    }

    let cancelled = false;

    const loadMeetings = async () => {
      try {
        const res = await apiGetAppointments({
          userId: sessionUserId,
          futureOnly: false,
        });
        const appointments = unwrapAppointmentsAxiosData(res) as Record<string, any>[];
        const next: Record<string, Record<string, any>> = {};

        nestedRoadmaps.forEach((item) => {
          const taskId = resolveNestedTemplateItemId(item);
          const assessmentExtra = findAssessmentExtra(item?.extras);
          const assessmentId = assessmentExtra ? resolveAssessmentIdFromExtra(assessmentExtra) : null;
          if (!taskId || !assessmentId) return;

          const match = matchAppointmentForTask(appointments, {
            roadmapId,
            taskId,
            assessmentId,
          });

          if (match) next[taskId] = match;
        });

        if (!cancelled) setTaskMeetings(next);
      } catch (err) {
        console.error("Failed to load task meetings", err);
        if (!cancelled) setTaskMeetings({});
      }
    };

    void loadMeetings();

    return () => {
      cancelled = true;
    };
  }, [roadmapId, sessionUserId, nestedRoadmaps]);

  useEffect(() => {
  if (!roadmapId || !sessionUserId || nestedRoadmaps.length === 0) {
    setTaskUpdatedDates({});
    return;
  }

  const completedTaskIds = nestedRoadmaps
    .filter((item) => taskStatusFromProgress(item) === "Completed")
    .map((item) => resolveNestedTemplateItemId(item))
    .filter(Boolean) as string[];

  if (completedTaskIds.length === 0) {
    setTaskUpdatedDates({});
    return;
  }

  let cancelled = false;

  const loadUpdatedDates = async () => {
    const results = await Promise.allSettled(
      completedTaskIds.map(async (taskId) => {
        const res = await apiGetExtras(roadmapId, sessionUserId, taskId);
        const body = (res?.data as any)?.data ?? res?.data;

        return {
          taskId,
          updatedAt: String(body?.updatedAt || ""),
        };
      }),
    );

    const next: Record<string, string> = {};

    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      if (!result.value.updatedAt) return;
      next[result.value.taskId] = result.value.updatedAt;
    });

    if (!cancelled) setTaskUpdatedDates(next);
  };

  void loadUpdatedDates();

  return () => {
    cancelled = true;
  };
}, [roadmapId, sessionUserId, nestedRoadmaps, progressData, statusOverrides]);

  const divisions = useMemo(() => {
    const raw = nestedRoadmaps
      .map((item) => String(item?.division ?? item?.phase ?? "").trim())
      .filter(Boolean);
    const cleaned = raw.map((d: unknown) => String(d ?? "").trim()).filter(Boolean);
    return cleaned
      .filter((d: string, idx: number) => cleaned.findIndex((x: string) => x.toLowerCase() === d.toLowerCase()) === idx)
      .filter((d: string) => d.toLowerCase() !== "all");
  }, [nestedRoadmaps]);
  const statusFilterOptions = ["All", "Due", "Not Started", "Completed"];

  const isValidImageUrl = (url: string) =>
    url && (url.startsWith("http://") || url.startsWith("https://"));
  const phaseBadgeText = useMemo(() => {
    const raw = String(phase || "").trim();
    if (!raw) return "";
    const num = raw.match(/\d+/)?.[0];
    return num ? `Phase ${num}` : raw;
  }, [phase]);

  const filteredCards = nestedRoadmaps.filter((item) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.roadMapDetails?.toLowerCase().includes(q);
    const mergedStatus = taskStatusFromProgress(item);
    const itemDivision = String(item.division ?? item.phase ?? "").trim();
    const hasDivisionTabs = divisions.length > 0;
    const matchesFilter =
      (divisionFilter === "All" ||
        (hasDivisionTabs && normalizeStatus(itemDivision) === normalizeStatus(divisionFilter))) &&
      (statusFilter === "All" ||
        normalizeStatus(mergedStatus) === normalizeStatus(statusFilter));
    return matchesSearch && matchesFilter;
  });

  const cardStatusBadge = (status: string) => {
    return "border-white/20 bg-[#10243a]/85 text-white shadow-md backdrop-blur-md";
  };

  const cardStatusDot = (status: string) => {
    if (isCompletedStatus(status)) return "bg-emerald-400";
    if (status === "In-progress") return "bg-amber-400";
    if (status === "Due") return "bg-rose-400";
    return "bg-rose-400";
  };

  if (loading) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  if (error) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-white/80">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={() => void loadRoadmapAndProgress()} className={directorBtnPrimary}>
                Retry
              </button>
              <button
                type="button"
                onClick={() => router.push("/pastor/revitalization-roadmap")}
                className={directorBtnSecondary}
              >
                Back
              </button>
            </div>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  const heroSubtitle =
    subtitle ||
    (roadmap?.duration ? `Completion time ${roadmap.duration}` : "Browse tasks and continue your revitalization journey.");

  return (
    <div className={pastorRoadmapDashboardPageRoot}>
      <PastorHeader showFullHeader={true} />

      <PastorRoadmapDashboardBody>
        <DirectorHero
          title={title}
          subtitle={heroSubtitle}
          image={HeroBg}
          pill={phaseBadgeText || undefined}
          breadcrumbItems={[
            { label: "Home", href: "/pastor/home" },
            { label: "Revitalization Roadmap", href: "/pastor/revitalization-roadmap" },
            { label: title },
          ]}
        />

        <main className="flex-1 pb-12">
          <div className={`${directorPageContainer} max-w-7xl px-4 sm:px-6 lg:px-8`}>
            <DirectorFilterSection bare className="!mb-6 !p-4 sm:!p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                <div className="min-w-0 w-full lg:max-w-[min(100%,28rem)] lg:flex-1">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    placeholder="Search tasks…"
                    variant="dark"
                    className="w-full"
                  />
                </div>
                <div className="flex min-w-0 w-full flex-col gap-3 sm:flex-row sm:items-end lg:ml-auto lg:w-auto lg:justify-end">
                  <div className="min-w-[180px]">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                      Division
                    </label>
                    <select
                      value={divisionFilter}
                      onChange={(e) => setDivisionFilter(e.target.value)}
                      className={filterSelectClass}
                    >
                      <option value="All" style={{ color: "#111", backgroundColor: "#fff" }}>
                        All
                      </option>
                      {divisions.map((division) => (
                        <option key={division} value={division} style={{ color: "#111", backgroundColor: "#fff" }}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="min-w-[180px]">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                      Filters
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className={filterSelectClass}
                    >
                      {statusFilterOptions.map((status) => (
                        <option key={status} value={status} style={{ color: "#111", backgroundColor: "#fff" }}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </DirectorFilterSection>

            {filteredCards.length === 0 ? (
              <div className={`${directorGlassCard} px-5 py-16 text-center text-sm text-white/65`}>
                {nestedRoadmaps.length === 0 ? "No phases found for this roadmap." : "No results match your filter."}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
                {filteredCards.map((item, index) => {
                  const taskId = resolveNestedTemplateItemId(item);
                  const meeting = taskId ? taskMeetings[taskId] : null;
                  const jumpHref =
                    taskId && roadmapId
                      ? `/pastor/jumpstart?id=${encodeURIComponent(taskId)}&parentId=${encodeURIComponent(roadmapId)}`
                      : "";
                  const resolvedImage = resolveApiMediaUrl(item.imageUrl) || "";
                  const imgSrc = isValidImageUrl(resolvedImage) ? resolvedImage : PhaseImg;
                  const status = taskStatusFromProgress(item);
const updatedAt = taskId ? taskUpdatedDates[taskId] : "";
                  return (
                    <div
                      key={taskId || `task-${index}`}
                      className={`${directorGlassCard} flex flex-col overflow-hidden sm:flex-row`}
                    >
                      <div className="relative h-44 w-full shrink-0 sm:h-auto sm:min-h-[200px] sm:w-[42%] sm:max-w-[220px]">
                        <Image
                          src={imgSrc}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 220px"
                          unoptimized={
                            typeof imgSrc === "string" && (imgSrc.startsWith("blob:") || isRemoteImageSrc(imgSrc))
                          }
                        />
                        <div className="absolute left-3 top-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${cardStatusBadge(status)}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${cardStatusDot(status)}`} aria-hidden />
                            {status}
                          </span>
                        </div>
                        {status === "Completed" ? (
  <div className="absolute bottom-3 left-3 rounded-lg border border-white/20 bg-black/45 px-3 py-2 text-[11px] font-semibold leading-5 text-white shadow-md backdrop-blur-sm">
    <p>Completed on : N/A</p>
    <p>
      Last Updated :{" "}
      {updatedAt
        ? new Date(updatedAt).toLocaleDateString(undefined, {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "—"}
    </p>
  </div>
) : null}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0 space-y-2">
                          <h3 className="text-base font-bold leading-snug text-white sm:text-lg">{item.name}</h3>
                          <p className={pastorRoadmapDescriptionLineClamp3}>
                            {item.description || item.roadMapDetails || ""}
                          </p>

                          {item.phase ? (
                            <p className="text-xs text-[#3498DB]/90">
                              Division <span className="font-semibold text-white">{item.phase}</span>
                            </p>
                          ) : null}

                          {item.duration ? (
                            <p className="text-sm text-white/75">
                              Completion time <span className="font-semibold text-white">{item.duration}</span>
                            </p>
                          ) : null}

                          {/* {meeting ? (
                            <div className="rounded-xl border border-[#3498DB]/25 bg-[#3498DB]/10 px-3 py-2.5">
                              <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#aed6f1]">
                                <i className="fa-regular fa-calendar text-[11px]" aria-hidden />
                                <span>Meeting Scheduled</span>
                              </div>
                              <p className="text-[13px] text-white/85">
                                {formatMeetingDate(meeting.meetingDate)}
                                {formatMeetingTime(meeting.meetingDate) ? (
                                  <span className="text-white/65"> at {formatMeetingTime(meeting.meetingDate)}</span>
                                ) : null}
                              </p>
                            </div>
                          ) : null} */}
                          {meeting ? (
  <div className="rounded-lg border border-yellow-300/35 bg-yellow-300/15 px-3 py-2 text-[13px] font-semibold text-yellow-100">
    Meeting Scheduled : {formatMeetingDate(meeting.meetingDate)}{" "}
    {formatMeetingTime(meeting.meetingDate)}
  </div>
) : null}
                        </div>

                        <div className="flex justify-end border-t border-white/10 pt-3 sm:border-0 sm:pt-0">
                          {jumpHref ? (
                            // <Link
                            //   href={jumpHref}
                            //   className={`${directorBtnPrimary} !px-5 !py-2.5 !text-sm no-underline`}
                            // >
                            //   View
                            // </Link>
                            <Link
  href={jumpHref}
  className={`${directorBtnPrimary} !px-5 !py-2.5 !text-sm no-underline`}
>
  {status === "Completed" ? "View" : "Start"}
</Link>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className={`${directorBtnPrimary} !px-5 !py-2.5 !text-sm disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {/* {status === "Not Started" ? "Start" : "View"} */}
                              {status === "Completed" ? "View" : "Start"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </PastorRoadmapDashboardBody>
    </div>
  );
}

export default function SelfRevitalizationPhasePage() {
  return (
    <Suspense
      fallback={
        <div className={pastorRoadmapDashboardPageRoot}>
          <div className="flex min-h-screen flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </div>
      }
    >
      <SelfRevitalizationContent />
    </Suspense>
  );
}
