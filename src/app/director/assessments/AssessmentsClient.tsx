"use client";
import { useState, useEffect, useMemo, useRef, Suspense } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../DirectorHero";
import FeaturedAvatars, { type FeaturedAvatarItem } from "@/app/Components/FeaturedAvatars";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorListCardRadius,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
  directorToastClass,
} from "../directorUi";
import { DirectorFilterSection, DirectorSlideOver } from "../ui";
import { mentorFilterPanel } from "@/app/Components/mentor/mentor-theme";
import SearchBar from "@/app/Components/SearchBar";
import ConfirmModal from "@/app/Components/ConfirmModal";
import AssessmentBg from "../../Assets/assessment-bg.png";
import Thumb1 from "../../Assets/thumb1.png";
import Mentor1 from "../../Assets/mentor1.png";
import {
  apiGetAssignedAssessments,
  apiGetAssessmentById,
  apiAssignAssessmentViaModule,
  apiDeleteAssessments,
  flattenAssignedAssessmentRow,
  apiGetAssessments,
  parseAssignedAssessmentsListBody,
  parseAssessmentDetailPayload,
  parseAssessmentsListPayload,
  apiGetSectionRecommendations,
  apiGetUserAnswers,
} from "@/app/Services/assessment.service";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { emitPastorAssignmentsChanged } from "@/app/utils/progress-sync";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";

function getApiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: Record<string, unknown> } }).response?.data;
    const msg = data?.message ?? data?.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (Array.isArray(msg) && msg.length && typeof msg[0] === "string") return msg[0];
  }
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  return fallback;
}

type AssignUserRow = {
  id: string;
  name: string;
  role?: string;
  avatar: string;
};

type AssessmentCardRow = {
  id: string;
  title: string;
  description: string;
  image: string | typeof Thumb1;
  type?: unknown;
  progressStatus?: "not_started" | "submitted" | "completed";
  dueDate?: string;
  createdOn?: string;
  createdBy?: string;
  pastorsAssigned?: number;
  appointmentId?: string;
  meetingDateLabel?: string;
  meetingActive?: boolean;
  hasCdp?: boolean;
};

function toDateInputValue(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickAssignedDueDate(rawItem: any, flat: any): string | undefined {
  const candidates = [
    flat?.dueDate,
    flat?.deadline,
    flat?.endDate,
    flat?.assignedDueDate,
    rawItem?.dueDate,
    rawItem?.deadline,
    rawItem?.endDate,
    rawItem?.assignedDueDate,
    rawItem?.assignment?.dueDate,
    rawItem?.assignment?.deadline,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
}

function formatCreatedDate(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCreatedBy(value: unknown): string {
  if (!value) return "Director";

  if (typeof value === "string") {
    return value.trim() || "Director";
  }

  if (typeof value === "object") {
    const row = value as {
      firstName?: string;
      lastName?: string;
      name?: string;
      email?: string;
      role?: string;
    };

    const fullName = `${row.firstName ?? ""} ${row.lastName ?? ""}`.trim();

    if (fullName) return fullName;
    if (row.name?.trim()) return row.name.trim();
    if (row.email?.trim()) return row.email.trim();
    if (row.role?.trim()) return row.role.trim();
  }

  return "Director";
}

function formatMeetingDateTime(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function isMeetingStillActive(meetingDate: unknown, status: unknown): boolean {
  const s = String(status || "").toLowerCase();
  if (s === "completed" || s === "cancelled" || s === "missed") return false;
  if (typeof meetingDate !== "string" || !meetingDate.trim()) return true;
  const when = new Date(meetingDate).getTime();
  if (Number.isNaN(when)) return true;
  return when >= Date.now();
}

function countPastorsAssigned(item: any): number {
  // If the backend provides pastorsAssigned directly, use it
  if (typeof item.pastorsAssigned === "number") {
    return item.pastorsAssigned;
  }

  // Otherwise, count unique userIds from assignments array
  if (Array.isArray(item.assignments) && item.assignments.length > 0) {
    const uniqueUserIds = new Set<string>();
    for (const assignment of item.assignments) {
      if (typeof assignment?.userId === "string" && assignment.userId.trim()) {
        uniqueUserIds.add(assignment.userId);
      }
    }
    return uniqueUserIds.size;
  }

  return 0;
}

function hasCdpPayload(body: any): boolean {
  const data = body?.data ?? body;

  if (Array.isArray(data)) {
    return data.some((row) => {
      if (row?.sent === true || row?.status === "sent") return true;

      const recs = Array.isArray(row?.recommendations)
        ? row.recommendations
        : [];

      return recs.some((x: any) => String(x || "").trim() !== "");
    });
  }

  const sections = Array.isArray(data?.sections) ? data.sections : [];

  return sections.some((section: any) => {
    const recs = Array.isArray(section?.recommendations)
      ? section.recommendations
      : [];

    return recs.some((rec: any) => {
      if (typeof rec === "string") return rec.trim() !== "";
      return (
        rec?.sent === true ||
        rec?.status === "sent" ||
        String(rec?.message || rec?.text || "").trim() !== ""
      );
    });
  });
}
function normalizeAssessmentStatus(raw: unknown): "not_started" | "submitted" | "completed" {
  const s = String(raw || "").toLowerCase().replace(/\s+/g, "_");
  if (s === "submitted") return "submitted";
  if (s === "completed" || s === "reviewed") return "completed";
  return "not_started";
}

function extractAssessmentIdFromProgressRow(row: any): string {
  const direct = row?.assessmentId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  if (direct && typeof direct === "object") {
    const nested = String((direct as { _id?: string; id?: string })._id ?? (direct as { _id?: string; id?: string }).id ?? "").trim();
    if (nested) return nested;
  }
  const nested = String(row?.assessment?._id ?? row?.assessment?.id ?? "").trim();
  if (nested) return nested;
  return "";
}

function assessmentStatusLabel(status: AssessmentCardRow["progressStatus"]): string {
  if (status === "completed") return "Completed";
  if (status === "submitted") return "Submitted";
  return "Not Started";
}

function assessmentStatusChipClass(status: AssessmentCardRow["progressStatus"]): string {
  if (status === "completed") return "border-emerald-300/35 bg-emerald-500/20 text-emerald-100";
  if (status === "submitted") return "border-amber-300/35 bg-amber-500/20 text-amber-100";
  return "border-white/20 bg-white/10 text-[#cde2f2]";
}
function getInitialsAvatar(name: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || fallback
  )}&background=173653&color=ffffff`;
}

const mapUserToAssignUser = (user: any): AssignUserRow => {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";

  return {
    id: String(user.id ?? user._id ?? ""),
    name,
    role: user.role,
    avatar:
      String(user.profilePicture || "").trim() ||
      getInitialsAvatar(name, "Pastor"),
  };
};

function AssessmentsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const assignUserFromQuery = searchParams.get("assignUser");
  const tabFromQuery = searchParams.get("tab");
const pastorIdFromQuery = searchParams.get("pastorId");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<AssessmentCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AssignUserRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [loadingAssessments, setLoadingAssessments] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [listRefetchKey, setListRefetchKey] = useState(0);
  const [featuredItems, setFeaturedItems] = useState<FeaturedAvatarItem[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(false);

  const [selectedMenteeId, setSelectedMenteeId] = useState<string | null>(
  pastorIdFromQuery || assignUserFromQuery
);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name_asc" | "name_desc">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "not_started" | "submitted" | "completed">("all");

const [activeTab, setActiveTab] = useState<
  "assessments" | "mentors" | "pastors"
>(tabFromQuery === "pastors" ? "pastors" : "assessments");

const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
const [selectedMentorName, setSelectedMentorName] = useState("");

const [mentorItems, setMentorItems] = useState<FeaturedAvatarItem[]>([]);
const [mentorPastors, setMentorPastors] = useState<FeaturedAvatarItem[]>([]);
const [mentorRows, setMentorRows] = useState<any[]>([]);
const [allPastorRows, setAllPastorRows] = useState<any[]>([]);
const [mentorPastorRows, setMentorPastorRows] = useState<any[]>([]);
  const lastAssignBootstrap = useRef<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (pathname !== "/director/assessments") return;

    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);
        setListError(null);

        const res = await apiGetAssessments({
          search: activeTab === "assessments" ? debouncedSearch || undefined : undefined,
          _t: Date.now(),
        });

        const body = res?.data;
        const list = parseAssessmentsListPayload(body);
        const mapped: AssessmentCardRow[] = [];
        for (const item of list) {
          const rawItem = item as {
            
            _id?: unknown;
            id?: unknown;
            bannerImage?: unknown;
            name?: unknown;
            title?: unknown;
            description?: unknown;
            type?: unknown;
            createdAt?: unknown;
            createdBy?: unknown;
            pastorsAssigned?: unknown;
          };
          console.log("Assessment creator debug:", {
  title: rawItem.name || rawItem.title,
  createdBy: rawItem.createdBy,
  createdByType: typeof rawItem.createdBy,
  fullItem: rawItem,
});
          const rawId = rawItem._id ?? rawItem.id;
          const id = rawId != null && String(rawId).trim() !== "" ? String(rawId) : "";
          if (!id) continue;

          const raw = rawItem.bannerImage;
          const resolved =
            (typeof raw === "string" ? resolveApiMediaUrl(raw) ?? raw : null) || Thumb1;
          const titleRaw =
            (typeof rawItem.name === "string" && rawItem.name.trim() ? rawItem.name : null) ??
            (typeof rawItem.title === "string" && rawItem.title.trim() ? rawItem.title : null);
          mapped.push({
            id,
            title: titleRaw ?? "Untitled",
            description: typeof rawItem.description === "string" ? rawItem.description : "",
            image: resolved,
            type: rawItem.type,
            createdOn: typeof rawItem.createdAt === "string" ? rawItem.createdAt : undefined,
            // createdBy: typeof rawItem.createdBy === "string" ? rawItem.createdBy : undefined,
            createdBy: formatCreatedBy(rawItem.createdBy),
            pastorsAssigned: countPastorsAssigned(rawItem),
          });
        }

        if (selectedMenteeId) {
          try {
           
            const [assignedRes, allAssessmentsRes, progRes, appointmentsRes] = await Promise.all([
  apiGetAssignedAssessments(selectedMenteeId),
  apiGetAssessments(),
  apiGetUserProgress(selectedMenteeId),
  apiGetAppointments({ userId: selectedMenteeId, futureOnly: false } as any),
]);

let assignedRows = parseAssignedAssessmentsListBody(assignedRes.data);
const allAssessmentsBody: any = allAssessmentsRes?.data;

const allAssessments = Array.isArray(allAssessmentsBody?.data)
  ? allAssessmentsBody.data
  : Array.isArray(allAssessmentsBody)
    ? allAssessmentsBody
    : [];

const assignmentList = allAssessments
  .map((assessment: any) => {
    const assignment = Array.isArray(assessment?.assignments)
      ? assessment.assignments.find(
          (row: any) => String(row?.userId) === String(selectedMenteeId),
        )
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

const existingIds = new Set(
  assignedRows
    .map((item: any) => flattenAssignedAssessmentRow(item)?.assessmentId)
    .filter(Boolean),
);

const missingFromAssignedApi = assignmentList.filter((item: any) => {
  const id = String(item?.assessmentId || "");
  return id && !existingIds.has(id);
});

assignedRows = [...assignedRows, ...missingFromAssignedApi];
            const pr = unwrapProgressData(progRes);
            const rows = pr?.assessments ?? [];
            const appointmentsBody: any = appointmentsRes?.data;
            const appointmentsList: any[] = Array.isArray(appointmentsBody)
              ? appointmentsBody
              : Array.isArray(appointmentsBody?.data)
                ? appointmentsBody.data
                : Array.isArray(appointmentsBody?.data?.data)
                  ? appointmentsBody.data.data
                  : [];
            const appointmentById = new Map<string, any>();
           
            const appointmentsByAssessmentId = new Map<string, any[]>();

for (const appt of appointmentsList) {
  const id = String(appt?._id ?? appt?.id ?? "").trim();
  if (id) appointmentById.set(id, appt);

  const notes = String(appt?.notes ?? "");
  const metadata = appt?.metadata || appt?.meta || {};

  const fromMetadata = String(metadata?.assessmentId ?? "").trim();

  const fromNotes =
    notes.match(/assessmentId\s*[:=]\s*([^|\s,]+)/i)?.[1]?.trim() || "";

  const linkedAssessmentId = fromMetadata || fromNotes;

  if (linkedAssessmentId) {
    const prev = appointmentsByAssessmentId.get(linkedAssessmentId) || [];
    prev.push(appt);
    appointmentsByAssessmentId.set(linkedAssessmentId, prev);
  }
}
         
            const assigned = (await Promise.all(
  assignedRows.map(async (item) => {
                const flat = flattenAssignedAssessmentRow(item);
                if (!flat) return null;

                const detailObj = flat.assessment as {
                  _id?: string;
                  id?: string;
                  bannerImage?: string;
                  name?: string;
                  description?: string;
                  type?: unknown;
                  createdAt?: string;
                  createdBy?: string;
                  pastorsAssigned?: number;
                  appointmentId?: string;
                };

                const raw = detailObj.bannerImage;
                const image =
                  (typeof raw === "string" ? resolveApiMediaUrl(raw) ?? raw : null) || Thumb1;
                const assessmentId = String(detailObj._id ?? detailObj.id ?? flat.assessmentId);
                const assignmentId = String(flat.assignmentId ?? "").trim();
                const appointmentId = String((item as any)?.appointmentId ?? detailObj?.appointmentId ?? "").trim();
                const apptFromId = appointmentId ? appointmentById.get(appointmentId) : null;
                const apptFromAssessment = (appointmentsByAssessmentId.get(assessmentId) || [])
                  .slice()
                  .sort((a, b) => {
                    const ta = new Date(String(a?.meetingDate ?? 0)).getTime();
                    const tb = new Date(String(b?.meetingDate ?? 0)).getTime();
                    return tb - ta;
                  })[0];
                const appt = apptFromId || apptFromAssessment || null;
                const resolvedAppointmentRaw = appt?._id ?? appt?.id ?? appointmentId ?? "";
                const resolvedAppointmentId = String(resolvedAppointmentRaw).trim();
                const progressRow = rows.find((p: any) => {
                  const rowAssessmentId = extractAssessmentIdFromProgressRow(p);
                  const rowAssignmentId = String(p?.assignmentId ?? "").trim();
                  return (
                    (rowAssessmentId && rowAssessmentId === assessmentId) ||
                    (assignmentId && rowAssignmentId && rowAssignmentId === assignmentId)
                  );
                });
    
            const rawProgressStatus = normalizeAssessmentStatus(progressRow?.status);
const resolvedDueDate = pickAssignedDueDate(item, flat);

const storedCdp = getStoredRecommendationsForPastorAssessment(
  selectedMenteeId,
  assessmentId,
);
let hasCdp = storedCdp.some((rec) => rec.sent === true);

try {
  const recRes = await apiGetSectionRecommendations(assessmentId, selectedMenteeId);
  hasCdp = hasCdp || hasCdpPayload(recRes.data);
} catch {
  // Keep stored CDP result.
}
const hasActiveMeeting = Boolean(resolvedAppointmentId || appt?.meetingDate);

const progressStatus =
  hasCdp || hasActiveMeeting
    ? "completed"
    : rawProgressStatus === "completed"
      ? "submitted"
      : rawProgressStatus;

return {
                  
                  id: assessmentId,
                  hasCdp,
                  title: String(detailObj.name || "Untitled"),
                  description: String(detailObj.description || ""),
                  image,
                  type: detailObj.type,
                  progressStatus,
                  dueDate: resolvedDueDate,
                  createdOn: detailObj.createdAt,
                  // createdBy: detailObj.createdBy,
                  createdBy: formatCreatedBy(detailObj.createdBy),
                  pastorsAssigned: countPastorsAssigned(flat.assessment),
                  appointmentId: resolvedAppointmentId || undefined,
                  meetingDateLabel: formatMeetingDateTime(appt?.meetingDate) || undefined,
                  meetingActive: resolvedAppointmentId
                    ? isMeetingStillActive(appt?.meetingDate, appt?.status)
                    : false,
                } satisfies AssessmentCardRow;
              // })
              // .filter((item): item is NonNullable<typeof item> => item != null);
                })
)).filter((item): item is NonNullable<typeof item> => item != null);

            if (assigned.length === 0) {
              setAssessments([]);
            } else {
              if (!debouncedSearch) {
                setAssessments(assigned);
              } else {
                const q = debouncedSearch.toLowerCase();
                setAssessments(
                  assigned.filter((a) =>
                    `${a.title} ${a.description}`.toLowerCase().includes(q),
                  ),
                );
              }
            }
          } catch (e) {
            console.error("Failed to load pastor assessment assignments", e);
            setAssessments([]);
          }
        } else {
          setAssessments(mapped);
        }
      } catch (error) {
        console.error("Failed to fetch assessments", error);
        setAssessments([]);
        setListError(getApiErrorMessage(error, "Could not load assessments. Check your connection and try again."));
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, [pathname, debouncedSearch, selectedMenteeId, listRefetchKey, activeTab]);

  useEffect(() => {
    if (pathname !== "/director/assessments") return;

    const fetchFeaturedPastors = async () => {
      try {
        setFeaturedLoading(true);
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          page: 1,
          limit: 100,
        });

        const inner = res?.data?.data;
        let listUsers: unknown[] = [];
        if (inner && typeof inner === "object") {
          const payload = inner as { users?: unknown[]; rows?: unknown[] };
          if (Array.isArray(payload.users)) listUsers = payload.users;
          else if (Array.isArray(payload.rows)) listUsers = payload.rows;
        }
setAllPastorRows(listUsers as any[]);
        setFeaturedItems(
          listUsers
            .map((user) => {
              const row = mapUserToAssignUser(user as Record<string, unknown>);
              return {
                id: row.id,
                name: row.name,
                img: resolveApiMediaUrl(typeof row.avatar === "string" ? row.avatar : "") || row.avatar,
              } satisfies FeaturedAvatarItem;
            })
            .filter((item) => String(item.id).trim() !== ""),
        );
      } catch (error) {
        console.error("Failed to fetch featured pastors", error);
        setFeaturedItems([]);
      } finally {
        setFeaturedLoading(false);
      }
    };

    void fetchFeaturedPastors();
  }, [pathname]);
useEffect(() => {
  if (pathname !== "/director/assessments") return;

  const fetchMentors = async () => {
    try {
      const res = await apiGetAllUsers({
        role: "mentor",
        roleMatch: "mixed",
        page: 1,
        limit: 20,
      });

      const inner = res?.data?.data;
      let listUsers: unknown[] = [];

      if (inner && typeof inner === "object") {
        const payload = inner as { users?: unknown[]; rows?: unknown[] };
        if (Array.isArray(payload.users)) listUsers = payload.users;
        else if (Array.isArray(payload.rows)) listUsers = payload.rows;
      }
      setMentorRows(listUsers as any[]);

      setMentorItems(
        listUsers
          .map((user) => {
            const row = mapUserToAssignUser(user as Record<string, unknown>);
            return {
              id: row.id,
              name: row.name,
              img:
                resolveApiMediaUrl(typeof row.avatar === "string" ? row.avatar : "") ||
                row.avatar,
            } satisfies FeaturedAvatarItem;
          })
          .filter((item) => String(item.id).trim() !== "")
      );
    } catch (error) {
      console.error("Failed to fetch mentors", error);
      setMentorItems([]);
    }
  };

  void fetchMentors();
}, [pathname]);
  useEffect(() => {
    if (pathname !== "/director/assessments") return;
    const onVis = () => {
      if (document.visibilityState === "visible") setListRefetchKey((k) => k + 1);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [pathname]);

  useEffect(() => {

     if (!assignUserFromQuery || pastorIdFromQuery) return;
    if (lastAssignBootstrap.current === assignUserFromQuery) return;
    lastAssignBootstrap.current = assignUserFromQuery;
    setSelectedMenteeId(assignUserFromQuery);
    setSelectedUsers([assignUserFromQuery]);
    setIsSelectionMode(true);
  
    setToast("Select assessments, then tap Assign.");
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [assignUserFromQuery]);

  useEffect(() => {
    if (!showAssignModal) return;

    const fetchPastors = async () => {
      try {
        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          search: userSearch || undefined,
          page: 1,
         limit: 100,
        });

        const inner = res?.data?.data;
        let listUsers: unknown[] = [];
        if (inner && typeof inner === "object") {
          const o = inner as { users?: unknown[]; rows?: unknown[] };
          if (Array.isArray(o.users)) listUsers = o.users;
          else if (Array.isArray(o.rows)) listUsers = o.rows;
        }
        setUsers(listUsers.map(mapUserToAssignUser).filter((u) => u.id));
      } catch (err) {
        console.error("Failed to fetch pastors", err);
        setUsers([]);
      }
    };

    fetchPastors();
  }, [showAssignModal, userSearch]);

  useEffect(() => {
    if (!showAssignModal) {
      setAssignDueDate("");
    }
  }, [showAssignModal]);

  const handleSelectAssessment = (id: string) => {
    setSelectedAssessments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedAssessments(
      selectedAssessments.length === assessments.length
        ? []
        : assessments.map((a) => a.id)
    );
  };

  const handleSelectMode = () => {
    setIsSelectionMode(true);
    setSelectedAssessments([]);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssessments([]);
  };

  const handleAssign = async () => {
    const userIds = selectedUsers.map(String).filter(Boolean);
    const assessmentIds = selectedAssessments.map(String).filter(Boolean);
    if (!userIds.length || !assessmentIds.length) {
      setToast("Select at least one user and one assessment");
      return;
    }

    try {
      setLoading(true);

      for (const assessmentId of assessmentIds) {
        await apiAssignAssessmentViaModule(assessmentId, {
          userIds,
          dueDate: assignDueDate ? new Date(`${assignDueDate}T23:59:59`).toISOString() : undefined,
        });
      }

      emitPastorAssignmentsChanged(userIds);

      setShowAssignModal(false);
      setIsSelectionMode(false);
      setAssignDueDate("");
      setSelectedUsers([]);
      setSelectedAssessments([]);

      setToast("Assessment assigned successfully");
    } catch (error) {
      console.error("Assignment failed", error);
      setToast(getApiErrorMessage(error, "Failed to assign assessment"));
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssessments.length) return;

    try {
      setLoading(true);

      await apiDeleteAssessments(selectedAssessments);

      setAssessments((prev) => prev.filter((a) => !selectedAssessments.includes(a.id)));

      setToast(`${selectedAssessments.length} assessment(s) deleted`);
      setShowDeleteModal(false);
      setIsSelectionMode(false);
      setSelectedAssessments([]);
    } catch (err) {
      console.error(err);
      setToast(getApiErrorMessage(err, "Failed to delete assessments"));
    } finally {
      setLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

 
  const filteredAssessments = useMemo(() => {
  const q = searchQuery.toLowerCase();

  const filtered = assessments.filter((assessment) => {
    const matchesSearch = String(assessment.title ?? "").toLowerCase().includes(q);
    const matchesStatus =
      !selectedMenteeId ||
      statusFilter === "all" ||
      assessment.progressStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });
    const list = [...filtered];
    if (sortBy === "name_asc") {
      return list.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? "")));
    }
    if (sortBy === "name_desc") {
      return list.sort((a, b) => String(b.title ?? "").localeCompare(String(a.title ?? "")));
    }
    if (sortBy === "oldest") {
      return list.sort(
        (a, b) =>
          new Date(String(a.createdOn ?? 0)).getTime() - new Date(String(b.createdOn ?? 0)).getTime(),
      );
    }
    return list.sort(
      (a, b) =>
        new Date(String(b.createdOn ?? 0)).getTime() - new Date(String(a.createdOn ?? 0)).getTime(),
    );
 
  }, [assessments, searchQuery, sortBy, selectedMenteeId, statusFilter]);

  const filteredFeaturedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return featuredItems;
    return featuredItems.filter((item) =>
      String(item?.name || "").toLowerCase().includes(q),
    );
  }, [featuredItems, searchQuery]);
const filteredMentorRows = useMemo(() => {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return mentorRows;

  return mentorRows.filter((mentor: any) => {
    const row = mapUserToAssignUser(mentor);
    return `${row.name} ${mentor.email || ""}`.toLowerCase().includes(q);
  });
}, [mentorRows, searchQuery]);
  const selectedPastorName = useMemo(() => {
    const row = featuredItems.find((item) => String(item.id) === String(selectedMenteeId || ""));
    return row?.name || "Pastor";
  }, [featuredItems, selectedMenteeId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
    };

    if (showOptionsMenu !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Assessments Library"
        subtitle={
          selectedMenteeId
            ? "Assessments assigned to the selected pastor."
            : "Create, edit, and assign assessments to pastors."
        }
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments" },
        ]}
      />

      <section className="relative py-8">
        <div className={directorPageContainer}>
          <div className={`${directorGlassCard} mb-6 p-5`}>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
    <div className="relative w-full lg:max-w-xl">
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={
  activeTab === "mentors"
    ? "Search mentors..."
    : activeTab === "pastors"
      ? "Search pastors..."
      : "Search assessments..."
}
        variant="dark"
        className="w-full"
      />

      {listError ? (
        <p className="mt-3 rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-2 text-sm text-red-100">
          {listError}
        </p>
      ) : null}
    </div>

    {/* <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1"> */}
   <div className="ml-auto flex shrink-0 flex-wrap items-center gap-3">
     {activeTab === "assessments" && !isSelectionMode && (
      <button
        type="button"
        onClick={() => router.push("/director/assessments/create")}
        className="inline-flex h-[44px] items-center justify-center gap-2 rounded-xl border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 px-5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
      >
        <i className="fa-solid fa-plus" />
        Add
      </button>
    )}
  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
      <button
        type="button"
       onClick={() => {
  setActiveTab("assessments");
  setSearchQuery("");
  setDebouncedSearch("");
  setSelectedMentorId(null);
  setSelectedMenteeId(null);
}}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
          activeTab === "assessments"
            ? "bg-[#3498DB] text-white"
            : "text-white/75 hover:bg-white/10"
        }`}
      >
        Assessments Library
      </button>

      <button
        type="button"
      onClick={() => {
  setActiveTab("mentors");
  setSearchQuery("");
  setDebouncedSearch("");
  setSelectedMenteeId(null);
}}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
          activeTab === "mentors"
            ? "bg-[#3498DB] text-white"
            : "text-white/75 hover:bg-white/10"
        }`}
      >
        Mentor
      </button>

      <button
        type="button"
        onClick={() => {
  setActiveTab("pastors");
  setSearchQuery("");
  setDebouncedSearch("");
  setSelectedMentorId(null);
}}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
          activeTab === "pastors"
            ? "bg-[#3498DB] text-white"
            : "text-white/75 hover:bg-white/10"
        }`}
  
        >
        Pastor Assessments
      </button>
    </div>

    
  </div>
</div>

  {/* {activeTab === "assessments" && (
  <div className="mt-4 flex w-full flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
    {!isSelectionMode && (
      <>
        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc")
          }
          className="h-[42px] min-w-[170px] rounded-lg border border-white/20 bg-white/10 px-3 text-sm font-medium text-white outline-none transition focus:border-[#8ec5eb]/55 focus:ring-2 focus:ring-[#8ec5eb]/30 [&>option]:bg-[#062946] [&>option]:text-white"
          aria-label="Sort assessments"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A-Z</option>
          <option value="name_desc">Name Z-A</option>
        </select>

        <button type="button" onClick={handleSelectMode} className={directorBtnSecondary}>
          <i className="fa-solid fa-check-square"></i>
          Select
        </button>

        <button
          type="button"
          onClick={() => router.push("/director/assessments/create")}
          className={directorBtnPrimary}
        >
          <i className="fa-solid fa-plus"></i>
          Add
        </button>
      </>
    )}
  </div>
)} */}
{/* {activeTab === "assessments" && !isSelectionMode && (
  <div className="mt-4 flex w-full flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
    <select
      value={sortBy}
      onChange={(e) =>
        setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc")
      }
      className="h-[44px] min-w-[170px] rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none [&>option]:bg-[#062946] [&>option]:text-white"
      aria-label="Sort assessments"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="name_asc">Name A-Z</option>
      <option value="name_desc">Name Z-A</option>
    </select>

    <button
      type="button"
      onClick={handleSelectMode}
      className="inline-flex h-[44px] min-w-[170px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
    >
      <i className="fa-solid fa-check-square" />
      Select
    </button>
  </div>
)} */}
</div>
        

          {isSelectionMode && (
            <div className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-5 ${directorGlassCard}`}>
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-semibold text-white">
                  {selectedAssessments.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
                >
                  Select All
                </button>
              </div>
              {/* <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedAssessments.length === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div> */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedAssessments.length === 0) {
                      setToast("Select at least one assessment first.");
                      setTimeout(() => setToast(null), 3500);
                      return;
                    }
                    setShowAssignModal(true);
                  }}
                  disabled={selectedAssessments.length === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-4 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-user-plus text-xs"></i>
                  Assign
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedAssessments.length === 0}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-400/40 bg-red-500/20 text-red-200 hover:bg-red-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>

                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          {loadingAssessments ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className={directorSpinner} />
                <p className="font-semibold text-white">Loading assessments…</p>
              </div>
            </div>
          ) : (
            <>
            {activeTab === "mentors" && mentorItems.length > 0 && (
  <div className={`mb-6 ${mentorFilterPanel} px-4 py-4 sm:px-5`}>
    <p className="mb-4 text-sm leading-snug text-[#cde2f2]/90">
      Select a mentor below to view their assigned pastors.
    </p>

    <FeaturedAvatars
      items={mentorItems}
      showDivider={false}
      className="mb-0"
      gapClass="gap-6 sm:gap-8"
      selectedId={selectedMentorId}
      onItemClick={(item) => {
        const mentorId = String(item.id);
        setSelectedMentorId(mentorId);
        setSelectedMentorName(item.name);
        setSelectedMenteeId(null);

        const assignedPastors = allPastorRows.filter((pastor: any) => {
          const assignedIds = Array.isArray(pastor.assignedId)
            ? pastor.assignedId.map(String)
            : [];

          return assignedIds.includes(mentorId);
        });

        setMentorPastorRows(assignedPastors);
      }}
    />
  </div>
)}
     {activeTab === "mentors" && !selectedMentorId && (
  <div className="mb-6">
    <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
      Mentors
    </h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {filteredMentorRows.map((mentor: any) => {
        const row = mapUserToAssignUser(mentor);

        return (
          <button
            key={row.id}
            type="button"
   
            onClick={() => {
  router.push(`/director/assessments/mentor?mentorId=${row.id}`);
}}
            className={`${directorGlassCard} flex items-center gap-4 p-4 text-left transition hover:border-[#8ec5eb]/45 hover:bg-white/[0.08]`}
          >
            <Image
              src={row.avatar}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized={
                typeof row.avatar === "string" && isRemoteImageSrc(row.avatar)
              }
            />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-white">
                {row.name}
              </h3>
              <p className="truncate text-sm text-white/60">
                {mentor.email || "Mentor"}
              </p>
            </div>

            <i className="fa-solid fa-chevron-right text-white/45" />
          </button>
        );
      })}
    </div>
  </div>
)}

{activeTab === "mentors" && selectedMentorId && (
  <div className="mb-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Assigned Pastors
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Showing pastors assigned to{" "}
          <span className="font-semibold text-white">{selectedMentorName}</span>
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          setSelectedMentorId(null);
          setSelectedMentorName("");
          setMentorPastorRows([]);
          setSelectedMenteeId(null);
        }}
        className={directorBtnSecondary}
      >
        Back to Mentors
      </button>
    </div>

    {mentorPastorRows.length > 0 ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mentorPastorRows.map((pastor: any) => {
          const row = mapUserToAssignUser(pastor);

          return (
            <div key={row.id} className={`${directorGlassCard} p-4`}>
              <div className="flex items-center gap-4">
                <Image
                  src={row.avatar}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover"
                  unoptimized={
                    typeof row.avatar === "string" && isRemoteImageSrc(row.avatar)
                  }
                />

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-white">
                    {row.name}
                  </h3>
                  <p className="truncate text-sm text-white/60">
                    {pastor.email || "Pastor"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMenteeId(row.id)}
                className={`${directorBtnPrimary} mt-4 w-full justify-center`}
              >
                View Assessments
              </button>
            </div>
          );
        })}
      </div>
    ) : (
      <div className={`${directorGlassCard} px-8 py-12 text-center text-sm text-white/60`}>
        No assigned pastors found for this mentor.
      </div>
    )}
  </div>
)}

              {/* {!featuredLoading && filteredFeaturedItems.length > 0 && ( */}
              {activeTab === "pastors" && !featuredLoading && filteredFeaturedItems.length > 0 && (
                <div className={`mb-6 ${mentorFilterPanel} px-4 py-4 sm:px-5`}>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-[#cde2f2]/90">
                        Select a pastor below to view their assigned assessments.
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center justify-start gap-2 sm:justify-end">
                      {selectedMenteeId && (
                        <button
                          type="button"
                          onClick={() => setSelectedMenteeId(null)}
                          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/15"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </div>
                  <FeaturedAvatars
                    items={filteredFeaturedItems}
                    showDivider={false}
                    className="mb-0"
                    gapClass="gap-6 sm:gap-8"
                    selectedId={selectedMenteeId}
                    onItemClick={(item) => setSelectedMenteeId(String(item.id))}
                  />
                </div>
              )}
              {/* {activeTab === "pastors" && !selectedMenteeId && (
  <div className="mb-6">
    <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
      Pastor Profiles
    </h2>

    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {allPastorRows.map((pastor: any) => {
        const row = mapUserToAssignUser(pastor);

        return (
          <button
            key={row.id}
            type="button"
            onClick={() => setSelectedMenteeId(row.id)}
            className={`${directorGlassCard} flex items-center gap-4 p-4 text-left transition hover:border-[#8ec5eb]/45 hover:bg-white/[0.08]`}
          >
            <Image
              src={row.avatar}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized={
                typeof row.avatar === "string" && isRemoteImageSrc(row.avatar)
              }
            />

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold text-white">
                {row.name}
              </h3>
              <p className="truncate text-sm text-white/60">
                {pastor.email || "Pastor"}
              </p>
            </div>

            <span className="rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white">
              View Assessments
            </span>
          </button>
        );
      })}
    </div>
  </div>
)} */}
{activeTab === "pastors" && !selectedMenteeId && (
  <div className="mb-6">
    <h2 className="mb-4 text-lg font-semibold text-white sm:text-xl">
      Pastor Profiles
    </h2>

    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {allPastorRows
  .filter((pastor: any) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;

    const row = mapUserToAssignUser(pastor);
    const email = String(pastor?.email || "").toLowerCase();

    return `${row.name} ${email}`.toLowerCase().includes(q);
  })
  .map((pastor: any) => {
        const row = mapUserToAssignUser(pastor);

        return (
          // <div key={row.id} className={`${directorGlassCard} relative flex gap-5 p-5`}>
          <div
  key={row.id}
  className={`${directorGlassCard} relative flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5`}
>
            <div className="options-menu-container absolute right-4 top-4">
  <button
    type="button"
    onClick={() =>
      setShowOptionsMenu(showOptionsMenu === row.id ? null : row.id)
    }
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 hover:bg-white/15"
  >
    <i className="fa-solid fa-ellipsis-vertical" />
  </button>

  {showOptionsMenu === row.id && (
    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-white/15 bg-[#041f35] py-2 shadow-xl">
      <button
        type="button"
        onClick={() => {
  setShowOptionsMenu(null);
  router.push(`/director/schedule?tab=schedule&recipientType=pastor&pastorId=${row.id}`);
}}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar-plus text-[#8ec5eb]" />
        Schedule Meeting
      </button>
    </div>
  )}
</div>
            <Image
              src={row.avatar}
              alt=""
              width={150}
              height={150}
              // className="h-32 w-32 rounded-xl object-cover"
              className="h-28 w-full rounded-xl object-cover sm:h-32 sm:w-32"
              unoptimized={typeof row.avatar === "string" && isRemoteImageSrc(row.avatar)}
            />

            <div className="flex min-w-0 flex-1 flex-col">
             <h3 className="truncate pr-10 text-lg font-bold text-white">{row.name}</h3>
              <p className="text-sm text-white/60">Pastor</p>
              <div className="mt-4 flex items-center gap-2">
  <a
    href={`mailto:${pastor.email || ""}?subject=Community Change Assessment`}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
    aria-label="Email pastor"
  >
    <i className="fa-regular fa-envelope" />
  </a>

  <button type="button" disabled className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
    <i className="fa-solid fa-phone" />
  </button>

  <button type="button" disabled className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
    <i className="fa-brands fa-whatsapp" />
  </button>

  <button type="button" disabled className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30">
    <i className="fa-regular fa-comment-dots" />
  </button>
</div>

              <button
                type="button"
                onClick={() => setSelectedMenteeId(row.id)}
                className={`${directorBtnPrimary} mt-4 w-full justify-center sm:mt-auto sm:w-auto sm:self-end`}
              >
                View Assessments
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
              {/* <div className="mb-4">
                <h2 className="text-lg font-semibold text-white sm:text-xl">
                  
                  {selectedMenteeId
  ? `${selectedPastorName}'s Assessments`
  : activeTab === "mentors"
    ? "Mentors"
    : activeTab === "pastors"
      ? "Pastor Assessments"
      : "All Assessments"}
                </h2>
              </div> */}
              {/* {(activeTab === "assessments" || selectedMenteeId) && (
  <div className="mb-4">
    <h2 className="text-lg font-semibold text-white sm:text-xl">
      {selectedMenteeId
        ? `${selectedPastorName}'s Assessments`
        : activeTab === "pastors"
          ? "Pastor Assessments"
          : "All Assessments"}
    </h2>
  </div>
)} */}
{(activeTab === "assessments" || selectedMenteeId) && (
  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
    <h2 className="text-lg font-semibold text-white sm:text-xl">
      {selectedMenteeId
        ? `${selectedPastorName}'s Assessments`
        : activeTab === "pastors"
          ? "Pastor Assessments"
          : "Assessments Library"}
    </h2>
{activeTab === "assessments" && !selectedMenteeId && !isSelectionMode && (
  <div className="ml-auto flex flex-wrap items-center gap-3">
    <select
      value={sortBy}
      onChange={(e) =>
        setSortBy(e.target.value as "newest" | "oldest" | "name_asc" | "name_desc")
      }
      className="h-[42px] min-w-[160px] rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none [&>option]:bg-[#062946] [&>option]:text-white"
      aria-label="Sort assessments"
    >
      <option value="newest">Newest</option>
      <option value="oldest">Oldest</option>
      <option value="name_asc">Name A-Z</option>
      <option value="name_desc">Name Z-A</option>
    </select>

    <button
      type="button"
      onClick={handleSelectMode}
      className="inline-flex h-[42px] min-w-[150px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15"
    >
      <i className="fa-solid fa-check-square" />
      Select
    </button>
  </div>
)}
    {selectedMenteeId && (
      <select
        value={statusFilter}
        onChange={(e) =>
          setStatusFilter(
            e.target.value as "all" | "not_started" | "submitted" | "completed",
          )
        }
        className="h-[42px] min-w-[170px] rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none [&>option]:bg-[#062946] [&>option]:text-white"
      >
        <option value="all">All</option>
        <option value="not_started">Not Started</option>
        <option value="submitted">Submitted</option>
        <option value="completed">Completed</option>
      </select>
    )}
  </div>
)}
              {(activeTab === "assessments" || selectedMenteeId) && filteredAssessments.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredAssessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className={`relative ${directorListCardRadius} transition-all ${directorGlassCard} ${selectedAssessments.includes(assessment.id) ? "bg-[#f59e0b]/15 border-transparent" : "border border-white/10"
                    }`}
                >
                  {isSelectionMode && (
                    <div className="absolute left-4 top-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedAssessments.includes(assessment.id)}
                        onChange={() => handleSelectAssessment(assessment.id)}
                        className="h-5 w-5 cursor-pointer rounded accent-[#8ec5eb] focus:ring-2 focus:ring-[#8ec5eb]/50"
                      />
                    </div>
                  )}

                  {!isSelectionMode && (
                    <div className="options-menu-container absolute right-4 top-4 z-[60]">
                      <button
                        type="button"
                        onClick={() =>
                          setShowOptionsMenu(
                            showOptionsMenu === assessment.id ? null : assessment.id
                          )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                      {showOptionsMenu === assessment.id && (
                        <div className="absolute right-0 z-[200] mt-2 w-48 animate-slide-down rounded-lg border border-white/15 bg-[#041f35]/98 py-2 shadow-xl backdrop-blur-md">
                          {selectedMenteeId ? (
                            <>
                              <button
                                type="button"
                                disabled={!assessment.appointmentId || !assessment.meetingActive}
                                onClick={() => {
                                  setShowOptionsMenu(null);
                                  if (!assessment.appointmentId || !assessment.meetingActive) return;
                                  router.push(`/director/schedule/${encodeURIComponent(assessment.appointmentId)}`);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40 disabled:hover:bg-transparent"
                              >
                                <i className="fa-regular fa-calendar-check text-[#8ec5eb]" />
                                View Meeting
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowOptionsMenu(null);
                                  router.push(`/director/assessments/${assessment.id}?viewUser=${selectedMenteeId}`);
                                }}
                                className="flex w-full items-center gap-3 border-t border-white/10 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                              >
                                <i className="fa-regular fa-eye text-[#8ec5eb]" />
                                View Details
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssessments([assessment.id]);
                                  setShowAssignModal(true);
                                  setShowOptionsMenu(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                              >
                                <i className="fa-solid fa-user-plus text-[#8ec5eb]"></i>
                                Assign to
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowOptionsMenu(null);
                                  router.push(`/director/assessments/${assessment.id}`);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-white/90 hover:bg-white/10"
                              >
                                <i className="fa-solid fa-pen text-[#8ec5eb]"></i>
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAssessments([assessment.id]);
                                  setShowDeleteModal(true);
                                  setShowOptionsMenu(null);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-2 text-left text-red-300 hover:bg-red-500/10"
                              >
                                <i className="fa-solid fa-trash"></i>
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col gap-0 p-0">
                    {/* Row 1: Image + Title + Description */}
                    <div className="flex gap-4 p-6 pb-4">
                      <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-white/10">
                        <Image
                          src={assessment.image || Thumb1}
                          alt={assessment.title}
                          fill
                          className="object-cover"
                          unoptimized={
                            typeof assessment.image === "string" &&
                            (assessment.image.startsWith("blob:") || isRemoteImageSrc(assessment.image))
                          }
                        />
                        {selectedMenteeId && (
                          <div className="absolute bottom-1.5 left-1.5 inline-flex max-w-[120px] items-center gap-1 truncate rounded-md bg-[#fff6d8] px-1.5 py-[2px] text-[10px] font-semibold text-[#d38a00]">
                            <i className="fa-regular fa-calendar text-[10px]" />
                            Due: {formatDueDate(assessment.dueDate) || "N/A"}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                        <h3 className="mb-2 text-lg font-bold text-white">{assessment.title}</h3>

<p className="line-clamp-2 min-h-[44px] text-sm leading-[22px] text-white/65">
  {assessment.description || "No description available."}
</p>

{selectedMenteeId && (
  <span
    className={`mt-3 inline-flex w-fit rounded-lg border px-3 py-1 text-sm font-bold ${assessmentStatusChipClass(
      assessment.progressStatus,
    )}`}
  >
    {assessmentStatusLabel(assessment.progressStatus)}
  </span>
)}
                        </div>
                      </div>
                    </div>

                    {selectedMenteeId ? (
                      <div className="w-full border-t border-white/10">
                        <div className="flex items-center justify-end px-6 py-4">
                          {/* <span
                            className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${assessmentStatusChipClass(
                              assessment.progressStatus,
                            )}`}
                          >
                            {assessmentStatusLabel(assessment.progressStatus)}
                          </span> */}
                          <div className="ml-auto flex items-center gap-2">
                            {(assessment.progressStatus === "submitted" ||
                              assessment.progressStatus === "completed") && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/director/assessments/result?assessmentId=${assessment.id}&userId=${selectedMenteeId}`,
                                    )
                                  }
                                  className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                                >
                                  View Result
                                </button>
                              )}
                            {/* CDP flow intentionally disabled for Director for now.
                                Keep this block commented to restore quickly when needed.
                            {(assessment.progressStatus === "submitted" ||
                              assessment.progressStatus === "completed") && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      `/director/assessments/result?assessmentId=${assessment.id}&userId=${selectedMenteeId}&editRecommendation=1`,
                                    )
                                  }
                                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                                >
                                  Send CDP
                                </button>
                              )} */}
                            {/* <button
                              type="button"
                              onClick={() =>
                                router.push(`/director/assessments/${assessment.id}?viewUser=${selectedMenteeId}`)
                              }
                              className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                            >
                              View
                            </button> */}
                           {/* {(assessment.progressStatus === "submitted" ||
  assessment.progressStatus === "completed") && ( */}
  {assessment.hasCdp === true && (
    <button
      type="button"
      onClick={() =>
        router.push(
          `/director/assessments/result/cdp?assessmentId=${assessment.id}&userId=${selectedMenteeId}`,
        )
      }
      className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
    >
      Customized Development Plan
    </button>
  )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Row 2: Metadata + Button */}
                        <div className="flex items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
                          <div className="grid grid-cols-3 gap-8 flex-1">
                            <div className="text-center">
                              <p className="text-xs text-white/60 mb-1">Created on</p>
                              <p className="text-sm font-semibold text-white">{formatCreatedDate(assessment.createdOn) || "N/A"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-white/60 mb-1">Created by</p>
                              <p className="text-sm font-semibold text-white">{assessment.createdBy || "Director"}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-white/60 mb-1">Pastors Assigned</p>
                              <p className="text-sm font-semibold text-white">{assessment.pastorsAssigned || 0}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/director/assessments/${assessment.id}`)}
                            className="shrink-0 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                          >
                            View / Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            ) : activeTab === "assessments" || selectedMenteeId ? (
  <div className={`mx-auto max-w-md px-8 py-14 text-center ${directorGlassCard}`}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-white/10">
                <i className="fa-regular fa-folder-open text-2xl text-[#8ec5eb]" />
              </div>
              <p className="text-lg font-semibold text-white">
                {selectedMenteeId
                  ? "No assessments assigned to this pastor."
                  : "No assessments found"}
              </p>
              <p className="mt-2 text-sm text-white/60">
                {selectedMenteeId
                  ? "Assign assessments from the full list when needed."
                  : "Try another search or create an assessment with Add."}
              </p>
          </div>
) : null}
</>
)}
        </div>
      </section>

      {showAssignModal ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setShowAssignModal(false)}
          role="presentation"
        >
          <div
            className="flex w-full max-w-md max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-assessment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 id="assign-assessment-title" className="text-lg font-bold text-gray-900">
                  Assign to pastors
                </h2>
                <p className="mt-0.5 text-sm text-gray-600">
                  Choose pastors and assign selected assessments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close assign popup"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </header>

            <div className="border-b border-gray-100 px-6 py-4">
              <SearchBar
                value={userSearch}
                onChange={setUserSearch}
                placeholder="Search pastors…"
                variant="light"
                className="w-full"
              />
              <label className="mt-4 block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Due date</span>
                <input
                  type="date"
                  value={toDateInputValue(assignDueDate) || assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#2E3B8E] focus:ring-2 focus:ring-[#2E3B8E]/20"
                />
              </label>
            </div>

            <div className="flex-1 overflow-auto px-6 py-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="h-5 w-5 rounded text-[#2E3B8E] focus:ring-2 focus:ring-[#2E3B8E]"
                    />
                    <Image
                      src={user.avatar}
                      alt=""
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized={typeof user.avatar === "string" && isRemoteImageSrc(user.avatar)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="truncate text-sm text-gray-600">{user.role}</div>
                    </div>
                  </label>
                ))}
                {users.length === 0 ? (
                  <p className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    No pastors found.
                  </p>
                ) : null}
              </div>
            </div>

            <footer className="border-t border-gray-200 px-6 py-4">
              <p className="mb-3 text-center text-sm text-gray-600">
                {selectedUsers.length === 0
                  ? "Select one or more pastors."
                  : `${selectedUsers.length} pastor${selectedUsers.length === 1 ? "" : "s"} selected`}
              </p>
              <button
                type="button"
                onClick={handleAssign}
                disabled={selectedUsers.length === 0 || loading}
                className="w-full rounded-lg bg-[#2E3B8E] px-6 py-3 font-semibold text-white transition hover:bg-[#1F2A6E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Assigning…" : "Assign"}
              </button>
            </footer>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete assessments?"
        message="The selected assessments will be removed. This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        icon="fa-solid fa-trash"
        iconColor="text-red-600 bg-red-50"
        confirmColor="bg-red-600 hover:bg-red-700"
        pendingConfirmText="Deleting…"
      />

      {toast && (
        <div className="fixed right-6 top-6 z-[110] animate-fade-in">
          <div className={directorToastClass}>
            <i className="fa-solid fa-circle-check text-xl text-green-500" />
            <span className="font-semibold text-gray-800">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AssessmentsClient() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
            <div className={directorSpinner} />
            <p className="font-semibold text-white">Loading…</p>
          </div>
        </div>
      }
    >
      <AssessmentsPageContent />
    </Suspense>
  );
}
