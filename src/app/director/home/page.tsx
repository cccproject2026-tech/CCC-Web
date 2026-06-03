"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import { setCookie, getCookie } from "@/app/utils/cookies";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";
import MentorCard from "@/app/Components/Card/MentorCard";
import {
  directorGlassCard,
  directorGlassCardHover,
  directorInputClass,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
import HeroBg from "../../Assets/hero-bg.png";
import Book from "../../Assets/book.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import ZoomIcon from "../../Assets/zoom.png";
import UserProfile from "../../Assets/user-profile.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import {
  CreateUserDto,
  apiGetDirectorOverview,
  DirectorOverviewDto,
  apiGetTodaysAppointments,
  apiGetAppointments,
  apiGetAllInterests,
  apiGetMentors,
  apiGetFieldMentors,
  apiGetPastors,
  apiCreateUser,
  apiGetUserById,
  apiGetAllUsers,
  apiGetOverallProgress,
   apiAssignUsers,
  unwrapDirectorOverview,
  unwrapOverallProgressList,
  aggregateDirectorOverviewFromUsers,
  mergeDirectorOverviewWithUserAggregate,
  extractUserIdFromOverallProgressRow,
  Appointment,
  Interest,
  MentorPastor,
  User,
} from "@/app/Services/api";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  apiGetAssignedAssessments,
  flattenAssignedAssessmentRow,
  parseAssignedAssessmentsListBody,
} from "@/app/Services/assessment.service";
// import { unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import {
  appointmentEntityId,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import type { UserRole } from "@/app/Services/types/users.types";
import type { UserOverallProgress } from "@/app/Services/types/progress.types";
import { getPastorMedia } from "@/app/Services/pastor.service";
import { getGreeting } from "@/app/Services/utils/helpers";
import MapCard, { type MapMarker } from "@/app/Components/MapCard";
import { parseMentorUsersListResponse } from "@/app/director/mentors/parseMentorUsersResponse";
import { resolveApiMediaUrl } from "@/app/utils/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

function parseUserCookie(): {
  firstName?: string;
  lastName?: string;
  id?: string;
  _id?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = getCookie("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isTransientServiceError(error: unknown): boolean {
  return isAxiosError(error) && (error.response?.status === 503 || error.code === "ECONNABORTED");
}

function logApiFailure(label: string, error: unknown): void {
  if (isTransientServiceError(error)) {
    console.warn(`${label} temporarily unavailable (503/timeout).`);
    return;
  }
  console.error(label, error);
}

function readArrayFromApiBody(res: { data: unknown } | null | undefined): unknown[] {
  if (!res?.data) return [];
  const body = res.data as unknown[] | Record<string, unknown> | null;
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const d = (body as { data?: unknown }).data;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object" && "data" in d && Array.isArray((d as { data: unknown[] }).data)) {
    return (d as { data: unknown[] }).data;
  }
  return [];
}

/** List APIs sometimes nest `email` under `user` or `contact`. */
function getUserListEmail(person: Record<string, unknown> | MentorPastor): string | undefined {
  const tryStr = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    return t.includes("@") && t.length > 3 ? t : undefined;
  };
  const direct = tryStr(person.email);
  if (direct) return direct;
  const contact = person.contact;
  if (contact && typeof contact === "object" && !Array.isArray(contact)) {
    const c = tryStr((contact as Record<string, unknown>).email);
    if (c) return c;
  }
  const user = person.user;
  if (user && typeof user === "object" && !Array.isArray(user)) {
    const u = tryStr((user as Record<string, unknown>).email);
    if (u) return u;
  }
  return undefined;
}

function readUsersPage(res: { data: unknown } | null | undefined): { users: MentorPastor[]; total?: number } {
  if (!res?.data) return { users: [] };
  const body = res.data as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return { users: [] };
  const inner = body.data;
  if (Array.isArray(inner)) return { users: inner as MentorPastor[] };
  if (inner && typeof inner === "object") {
    const u = (inner as { users?: unknown; total?: number }).users;
    if (Array.isArray(u)) {
      return { users: u as MentorPastor[], total: (inner as { total?: number }).total };
    }
    const nested = (inner as { data?: { users?: unknown; total?: number } }).data;
    if (nested?.users && Array.isArray(nested.users)) {
      return { users: nested.users as MentorPastor[], total: nested.total };
    }
  }
  return { users: [] };
}

function readUserPayload(res: { data: unknown } | null | undefined): User | null {
  if (!res?.data) return null;
  const body = res.data as Record<string, unknown> | null;
  if (!body || typeof body !== "object") return null;
  if ("_id" in body && (body.firstName != null || body.email)) {
    return body as unknown as User;
  }
  const d = body.data;
  if (d && typeof d === "object" && ("_id" in d || "email" in d)) {
    return d as User;
  }
  if (d && typeof d === "object" && (d as { data?: User }).data) {
    return (d as { data: User }).data;
  }
  return null;
}

const getMediaThumbnail = (item: { mediaFiles?: { thumbnail?: string }[]; heading?: string }) => {
  const url = item?.mediaFiles?.[0]?.thumbnail;
  if (url && url.trim() !== "") return url;
  return Book;
};

type ChartRangeId = "p3" | "p6" | "p12" | "n3" | "n6";

function chartMonthCountFromRange(id: ChartRangeId): 3 | 6 | 12 {
  if (id === "p3" || id === "n3") return 3;
  if (id === "p12") return 12;
  return 6;
}

/** Forward-looking month labels (current month first); completions are typically zero until work lands. */
function buildUpcomingMonthsPlaceholderChart(
  count: 3 | 6,
  ref: Date,
): { pastor: number; mentor: number; monthName: string; year: number; month: number }[] {
  const out: {
    pastor: number;
    mentor: number;
    monthName: string;
    year: number;
    month: number;
  }[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(ref.getFullYear(), ref.getMonth() + i, 1);
    out.push({
      pastor: 0,
      mentor: 0,
      monthName: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth() + 1,
    });
  }
  return out;
}

/** Google embed: SF Bay area (same base as /director/mentors/location). */
const BAY_AREA_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31568.68148787118!2d-122.356!3d37.7799!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x808f7fd1d5f8d9f1%3A0x3e1f9a5c95f9a!2sSan%20Francisco%20Bay%20Area!5e0!3m2!1sen!2sus!4v1710000000000&zoom=10";

/** Percent positions on the static embed until API provides lat/lng per user. */
const NETWORK_MAP_OVERLAY_SLOTS: { top: string; left: string }[] = [
  { top: "20%", left: "26%" },
  { top: "18%", left: "46%" },
  { top: "20%", left: "66%" },
  { top: "36%", left: "20%" },
  { top: "34%", left: "40%" },
  { top: "36%", left: "58%" },
  { top: "34%", left: "78%" },
  { top: "50%", left: "28%" },
  { top: "50%", left: "50%" },
  { top: "50%", left: "72%" },
  { top: "66%", left: "36%" },
  { top: "64%", left: "54%" },
  { top: "68%", left: "74%" },
  { top: "44%", left: "12%" },
  { top: "58%", left: "88%" },
];
const MAX_NETWORK_MAP_MARKERS = 15;
const directorQuickLinks = [
  {
    title: "Mentor-Mentee Mapping",
    icon: "fa-solid fa-users",
    route: "/director/mentees",
  },
  {
    title: "Monthly Appointments",
    icon: "fa-regular fa-calendar-check",
    route: "/director/schedule",
  },
  {
    title: "Pastors Roadmap",
    icon: "fa-solid fa-route",
    route: "/director/pastor-assignments",
  },
  {
    title: "Assign Mentors",
    icon: "fa-solid fa-user-plus",
    route: "/director/pastor-assignments",
  },
  {
  title: "Assign Mentee",
  icon: "fa-solid fa-user-check",
  action: "assignMentee",
},
  {
    title: "Customized Development Plan",
    icon: "fa-solid fa-clipboard-list",
    route: "/director/revitalization-roadmap",
  },
 
];

const directorExploreCards = [
  {
    title: "Revitalization Roadmap",
    desc: "Plan and execute regional development roadmaps efficiently.",
    icon: "fa-solid fa-pen-clip",
    route: "/director/revitalization-roadmap",
  },
{
  title: "Assessments",
  desc: "Create, manage, and review assessments across your network.",
  icon: "fa-regular fa-clipboard",
  route: "/director/assessments",
},
  {
    title: "Track Progress",
    desc: "Track growth and celebrate milestones across your network.",
    icon: "fa-solid fa-chart-simple",
    route: "/director/track-progress",
  },
  {
    title: "Schedule",
    desc: "View and coordinate schedules across mentors and mentees.",
    icon: "fa-regular fa-clipboard",
    route: "/director/schedule",
  },
  
];
function getPersonProfilePicture(person: any): string {
  const raw =
    person?.profilePicture ||
    person?.profileImage ||
    person?.image ||
    person?.avatar ||
    person?.user?.profilePicture ||
    person?.assignedUser?.profilePicture;

  if (typeof raw !== "string" || !raw.trim()) return "";

  return resolveApiMediaUrl(raw.trim()) ?? raw.trim();
}
function getInitialsAvatar(firstName?: string, lastName?: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName || ""} ${lastName || ""}`.trim() || fallback
  )}&background=173653&color=ffffff`;
}

// function QuickLinkAvatar({
//   person,
//   icon = "fa-solid fa-user",
// }: {
//   person: any;
//   icon?: string;
// }) {
//   const [failed, setFailed] = useState(false);
//   const src = getPersonProfilePicture(person);

//   if (src && !failed) {
//     return (
//       <Image
//         src={src}
//         alt="Profile"
//         width={64}
//         height={64}
//         unoptimized={isRemoteImageSrc(src)}
//         onError={() => setFailed(true)}
//         className="h-11 w-11rounded-full border border-white/15 object-cover"
//       />
//     );
//   }

//   return (
//     <div className="flex h-11 w-11shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#8ec5eb]/15">
//       <i className={`${icon} text-xl text-[#8ec5eb]`} />
//     </div>
//   );
// }
function QuickLinkAvatar({
  person,
  icon = "fa-solid fa-user",
}: {
  person: any;
  icon?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = getPersonProfilePicture(person);

  if (src && !failed) {
    return (
      <Image
        src={src}
        alt="Profile"
        width={44}
        height={44}
        unoptimized={isRemoteImageSrc(src)}
        onError={() => setFailed(true)}
        className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#8ec5eb]/15">
      <i className={`${icon} text-xl text-[#8ec5eb]`} />
    </div>
  );
}
async function hydrateUsersWithProfilePictures(users: any[]) {
  return Promise.all(
    users.map(async (user) => {
      const id = String(user?._id ?? user?.id ?? "");

      if (!id || user?.profilePicture) return user;

      try {
        const res = await apiGetUserById(id);
        const fullUser = readUserPayload(res);

        return {
          ...user,
          profilePicture: fullUser?.profilePicture ?? user?.profilePicture,
        };
      } catch {
        return user;
      }
    })
  );
}

export default function DirectorHome() {
  const router = useRouter();
  const [resolvedUserId, setResolvedUserId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<"mentors" | "pastors">("mentors");
  // const [fullName, setFullName] = useState("");
  const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
  const [userForm, setUserForm] = useState({
    email: "",
    role: "",
  });
  
  const [showQuickAssignModal, setShowQuickAssignModal] = useState(false);
const [quickAssignPastors, setQuickAssignPastors] = useState<any[]>([]);
const [quickAssignMentors, setQuickAssignMentors] = useState<any[]>([]);
const [quickAssignLoading, setQuickAssignLoading] = useState(false);
const [quickAssignSaving, setQuickAssignSaving] = useState(false);
const [selectedQuickPastorId, setSelectedQuickPastorId] = useState("");
const [selectedQuickMentorId, setSelectedQuickMentorId] = useState("");
const [quickAssignToast, setQuickAssignToast] = useState<{
  message: string;
  type: "success" | "error";
} | null>(null);

const [quickAssignMentorSearch, setQuickAssignMentorSearch] = useState("");
const [quickAssignPastorSearch, setQuickAssignPastorSearch] = useState("");

const [showPastorRoadmapModal, setShowPastorRoadmapModal] = useState(false);
const [roadmapPastors, setRoadmapPastors] = useState<any[]>([]);
const [roadmapPastorsLoading, setRoadmapPastorsLoading] = useState(false);
const [roadmapPastorSearch, setRoadmapPastorSearch] = useState("");

const [showMonthlyAppointmentsModal, setShowMonthlyAppointmentsModal] = useState(false);
const [monthlyAppointments, setMonthlyAppointments] = useState<Appointment[]>([]);
const [monthlyAppointmentsLoading, setMonthlyAppointmentsLoading] = useState(false);
const [monthlyAppointmentDate, setMonthlyAppointmentDate] = useState("");

const [showMentorMenteeModal, setShowMentorMenteeModal] = useState(false);
const [mappingMentors, setMappingMentors] = useState<any[]>([]);
const [mappingMentees, setMappingMentees] = useState<any[]>([]);
const [mappingLoading, setMappingLoading] = useState(false);
const [mappingMenteesLoading, setMappingMenteesLoading] = useState(false);
const [selectedMappingMentorId, setSelectedMappingMentorId] = useState("");
const [mappingMentorSearch, setMappingMentorSearch] = useState("");
const [selectedMappingMentorName, setSelectedMappingMentorName] = useState("");
const [showCdpModal, setShowCdpModal] = useState(false);
const [cdpPastors, setCdpPastors] = useState<any[]>([]);
const [cdpAssessments, setCdpAssessments] = useState<any[]>([]);
const [cdpPastorsLoading, setCdpPastorsLoading] = useState(false);
const [cdpAssessmentsLoading, setCdpAssessmentsLoading] = useState(false);
const [selectedCdpPastorId, setSelectedCdpPastorId] = useState("");
const [selectedCdpPastorName, setSelectedCdpPastorName] = useState("");
const [cdpPastorSearch, setCdpPastorSearch] = useState("");

const [showAssignMenteeModal, setShowAssignMenteeModal] = useState(false);
const [assignMenteeMentors, setAssignMenteeMentors] = useState<any[]>([]);
const [assignMenteePastors, setAssignMenteePastors] = useState<any[]>([]);
const [assignMenteeLoading, setAssignMenteeLoading] = useState(false);
const [assignMenteeSaving, setAssignMenteeSaving] = useState(false);
const [selectedAssignMentorId, setSelectedAssignMentorId] = useState("");
const [selectedAssignPastorId, setSelectedAssignPastorId] = useState("");
const [assignMenteeMentorSearch, setAssignMenteeMentorSearch] = useState("");
const [assignMenteePastorSearch, setAssignMenteePastorSearch] = useState("");
const [assignMenteeToast, setAssignMenteeToast] = useState<{
  message: string;
  type: "success" | "error";
} | null>(null);

const hasOpenQuickLinkModal =
  showQuickAssignModal ||
  showPastorRoadmapModal ||
  showMonthlyAppointmentsModal ||
  showMentorMenteeModal ||
  showAssignMenteeModal ||
  showCdpModal;

useEffect(() => {
  if (!hasOpenQuickLinkModal) return;

  const previousOverflow = document.body.style.overflow;
  const previousPaddingRight = document.body.style.paddingRight;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  document.body.style.overflow = "hidden";

  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
  }

  return () => {
    document.body.style.overflow = previousOverflow;
    document.body.style.paddingRight = previousPaddingRight;
  };
}, [hasOpenQuickLinkModal]);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [mentors, setMentors] = useState<MentorPastor[]>([]);
  const [pastors, setPastors] = useState<MentorPastor[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [directorOverview, setDirectorOverview] = useState<DirectorOverviewDto | null>(null);

  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [interestsLoading, setInterestsLoading] = useState(true);
  const [mentorsLoading, setMentorsLoading] = useState(true);
  const [pastorsLoading, setPastorsLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [completedPastorsCount, setCompletedPastorsCount] = useState<number | null>(null);
  const [networkMapPeople, setNetworkMapPeople] = useState<
    // { id: string; name: string; img: string | typeof Mentor1; kind: "mentor" | "pastor" }[]
    { id: string; name: string; img: string | typeof Mentor1; kind: "mentor" | "pastor" | "field-mentor" }[]
  >([]);
  const [networkMapLoading, setNetworkMapLoading] = useState(true);
  const [networkMapRefreshing, setNetworkMapRefreshing] = useState(false);
  const [mapSearch, setMapSearch] = useState("");
 const [mapRoleFilter, setMapRoleFilter] = useState<"all" | "mentor" | "pastor" | "field-mentor">("all");
  const [debouncedMapSearch, setDebouncedMapSearch] = useState("");
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mediaList, setMediaList] = useState<
    {
      _id: string;
      heading?: string;
      subheading?: string;
      description?: string;
      createdAt?: string;
      mediaFiles?: { thumbnail?: string }[];
    }[]
  >([]);
  const [cookieUser, setCookieUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [chartRangeId, setChartRangeId] = useState<ChartRangeId>("p6");

  useEffect(() => {
    const idFromCookie = getCookie("userId")?.trim() ?? "";
    const u = parseUserCookie();
    const fromUser =
      (typeof u?.id === "string" && u.id.trim()) ||
      (typeof u?._id === "string" && u._id.trim()) ||
      "";
    const uid = idFromCookie || fromUser;
    if (!idFromCookie && fromUser) {
      setCookie("userId", fromUser);
    }
    setResolvedUserId(uid);
    setCookieUser(u ? { firstName: u.firstName, lastName: u.lastName } : null);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedMapSearch(mapSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [mapSearch]);

  const networkMapRequestId = useRef(0);
  const networkMapFirstLoadDone = useRef(false);

  const loadNetworkMap = useCallback(async (silent: boolean) => {
    const req = ++networkMapRequestId.current;
    if (!silent) {
      setNetworkMapLoading(true);
    } else {
      setNetworkMapRefreshing(true);
    }
    const pool = [Mentor1, Mentor2, Mentor3];
    const mapUserToPin = (
      u: Record<string, unknown>,
     kind: "mentor" | "pastor" | "field-mentor",
      i: number,
    // ): { id: string; name: string; img: string | typeof Mentor1; kind: "mentor" | "pastor" } => {
    ): {
  id: string;
  name: string;
  img: string | typeof Mentor1;
  kind: "mentor" | "pastor" | "field-mentor";
} => {
      const id = String(u._id ?? u.id ?? `${kind}-${i}`);
      const fn = String(u.firstName ?? "");
      const ln = String(u.lastName ?? "");
      const name = `${fn} ${ln}`.trim() || (kind === "mentor" ? "Mentor" : "Pastor");
      const raw = u.profilePicture;
      if (typeof raw === "string" && raw.trim()) {
        return { id, name, img: (resolveApiMediaUrl(raw) ?? raw) as string, kind };
      }
      // return { id, name, img: pool[i % pool.length], kind };
      return { id, name, img: getInitialsAvatar(fn, ln, kind === "pastor" ? "Pastor" : "Mentor"), kind };
    };
    try {
      const ts = Date.now();
      const [mRes, pRes, fmRes] = await Promise.allSettled([
        apiGetAllUsers({
          role: "mentor",
          roleMatch: "mixed",
          page: 1,
          limit: 40,
          t: ts,
        }),
        apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          page: 1,
          limit: 40,
          t: ts,
        }),
        apiGetFieldMentors({
  page: 1,
  limit: 40,
  t: ts,
}),
//         apiGetAllUsers({
//   role: "field-mentor",
//   roleMatch: "mixed",
//   page: 1,
//   limit: 40,
//   t: ts,
// }),
      ]);
      if (req !== networkMapRequestId.current) return;
      // const { users: mu } = parseMentorUsersListResponse(mRes);
      // const { users: pu } = parseMentorUsersListResponse(pRes);
      // const { users: fmu } = parseMentorUsersListResponse(fmRes);
      const { users: mu } =
  mRes.status === "fulfilled" ? parseMentorUsersListResponse(mRes.value) : { users: [] };

const { users: pu } =
  pRes.status === "fulfilled" ? parseMentorUsersListResponse(pRes.value) : { users: [] };

const { users: fmu } =
  fmRes.status === "fulfilled" ? parseMentorUsersListResponse(fmRes.value) : { users: [] };
      const mentors = mu.map((u, i) => mapUserToPin(u, "mentor", i));
      const pastors = pu.map((u, i) => mapUserToPin(u, "pastor", i));
      const fieldMentors = fmu.map((u, i) => mapUserToPin(u, "field-mentor", i));
      const interleaved: typeof mentors = [];
      // const maxL = Math.max(mentors.length, pastors.length);
      // for (let i = 0; i < maxL; i++) {
      //   if (i < mentors.length) interleaved.push(mentors[i]);
      //   if (i < pastors.length) interleaved.push(pastors[i]);
      // }
      const maxL = Math.max(mentors.length, pastors.length, fieldMentors.length);
      // const maxL = Math.max(mentors.length, pastors.length);

for (let i = 0; i < maxL; i++) {
  if (i < pastors.length) interleaved.push(pastors[i]);
  if (i < mentors.length) interleaved.push(mentors[i]);
  if (i < fieldMentors.length) interleaved.push(fieldMentors[i]);
}
      setNetworkMapPeople(interleaved);
    } catch (e) {
      console.error(e);
      if (req === networkMapRequestId.current) setNetworkMapPeople([]);
    } finally {
      // Always clear *both* flags when the latest in-flight request finishes. If we only
      // clear `refreshing` for silent follow-up calls, a superseded first load can leave
      // `networkMapLoading` stuck true (race: two requests, higher req wins, first never clears).
      if (req === networkMapRequestId.current) {
        setNetworkMapLoading(false);
        setNetworkMapRefreshing(false);
      }
    }
  }, []);
//compls
  useEffect(() => {
    const silent = networkMapFirstLoadDone.current;
    networkMapFirstLoadDone.current = true;
    void loadNetworkMap(silent);
  }, [resolvedUserId, loadNetworkMap]);
//compls
  useEffect(() => {
    let onVisible: () => void;
    // Defer so the first paint does not fire `visibilitychange` at the same time as the
    // initial fetch (avoids two in-flight requests that used to leave the loader stuck).
    const arm = window.setTimeout(() => {
      onVisible = () => {
        if (document.visibilityState === "visible") {
          void loadNetworkMap(true);
        }
      };
      document.addEventListener("visibilitychange", onVisible);
    }, 800);
    return () => {
      clearTimeout(arm);
      if (onVisible) document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadNetworkMap]);
//compls
  useEffect(() => {
    const id = window.setInterval(() => {
      void loadNetworkMap(true);
    }, 5 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [loadNetworkMap]);

  useEffect(() => {
    async function fetchMedia() {
      try {
        const res = await getPastorMedia();
        setMediaList(
          readArrayFromApiBody(res) as {
            _id: string;
            heading?: string;
            subheading?: string;
            description?: string;
            createdAt?: string;
            mediaFiles?: { thumbnail?: string }[];
          }[],
        );
      } catch (err) {
        console.error("Error fetching media:", err);
      }
    }
    fetchMedia();
  }, []);

  const formattedTime = currentTime.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const fetchMentors = useCallback(async () => {
    try {
      setMentorsLoading(true);
      // const response = await apiGetMentors({ limit: 4, roleMatch: "mixed" });
      const response = await apiGetAllUsers({
  role: "mentor",
  roleMatch: "mixed",
  page: 1,
  limit: 4,
  t: Date.now(),
});
      setMentors(readUsersPage(response).users);
    } catch (error) {
      console.error('Error fetching mentors:', error);
      setMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  const fetchPastors = useCallback(async () => {
    try {
      setPastorsLoading(true);
      // const response = await apiGetPastors({ limit: 4, roleMatch: "mixed" });
      const response = await apiGetAllUsers({
  role: "pastor",
  roleMatch: "mixed",
  page: 1,
  limit: 4,
  t: Date.now(),
});
      setPastors(readUsersPage(response).users);
    } catch (error) {
      console.error('Error fetching pastors:', error);
      setPastors([]);
    } finally {
      setPastorsLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      const uid = resolvedUserId;

      const results = await Promise.allSettled([
        // apiGetTodaysAppointments(uid || undefined),
        apiGetAppointments({ futureOnly: true }),
        apiGetAllInterests({ status: 'new' }),
        
        // apiGetMentors({ limit: 4, roleMatch: "mixed" }),
        // apiGetPastors({ limit: 4, roleMatch: "mixed" }),
      apiGetAllUsers({ role: "mentor", roleMatch: "mixed", page: 1, limit: 20, t: Date.now() }),
apiGetAllUsers({ role: "pastor", roleMatch: "mixed", page: 1, limit: 20, t: Date.now() }),
        
        apiGetDirectorOverview({
          period: "yearly",
          year: new Date().getFullYear(),
          includeUsers: true,
        }),
        uid ? apiGetUserById(uid) : Promise.resolve(null),
        apiGetAllUsers({ role: "pastor", hasCompleted: true, limit: 1 }),
        apiGetOverallProgress(["mentor", "pastor"]),
      
      ]);

      // Handle appointments (envelope shapes vary — same as schedule / mentor pages)
      // if (results[0].status === "fulfilled") {
      //   setAppointments((unwrapAppointmentsAxiosData(results[0].value) || []) as Appointment[]);
      // } else {
      //   console.error("Error fetching appointments:", results[0].reason);
      //   setAppointments([]);
      // }
      // setAppointmentsLoading(false);
      if (results[0].status === "fulfilled") {
  const list = (unwrapAppointmentsAxiosData(results[0].value) || []) as Appointment[];

  const today = new Date();

  const todaysAppointments = list
    .filter((appointment) => {
      const meetingDate = new Date(appointment.meetingDate);
      return (
        meetingDate.getDate() === today.getDate() &&
        meetingDate.getMonth() === today.getMonth() &&
        meetingDate.getFullYear() === today.getFullYear() &&
        meetingDate.getTime() >= Date.now()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime()
    );

  setAppointments(todaysAppointments);
} else {
  if (isTransientServiceError(results[0].reason)) {
    console.warn("Appointments service temporarily unavailable (503/timeout).");
  } else {
    console.error("Error fetching appointments:", results[0].reason);
  }
  setAppointments([]);
}
setAppointmentsLoading(false);

      // Handle interests
      // if (results[1].status === "fulfilled") {
      //   const intRes = results[1].value;
      //   const raw = intRes?.data as Record<string, unknown> | undefined;
      //   const list = Array.isArray(raw?.data)
      //     ? raw.data
      //     : Array.isArray(raw)
      //       ? raw
      //       : [];
      //   setInterests((list || []) as Interest[]);
      // } else {
      //   console.error("Error fetching interests:", results[1].reason);
      //   setInterests([]);
      // }
      // setInterestsLoading(false);

      // Handle interests
// if (results[1].status === "fulfilled") {
if (results[1].status === "fulfilled" && results[1].value) {
  // const intRes = results[1].value;
  // const body: any = intRes?.data;
  const intRes: any = results[1].value;
const body: any = intRes?.data;
  const raw: any = body?.data;

  const list: Interest[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.interests)
      ? raw.interests
      : Array.isArray(raw?.items)
        ? raw.items
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(body)
            ? body
            : [];

  const newOnly = list.filter(
    (item: any) => String(item?.status || "").trim().toLowerCase() === "new"
  );

  setInterests(newOnly);
} else {
  logApiFailure("Error fetching interests:", (results[1] as any).reason);
  setInterests([]);
}
setInterestsLoading(false);

      // Handle mentors / pastors — use same unwrap as fetchMentors / fetchPastors (users list or array)
      if (results[2].status === "fulfilled") {
        setMentors(readUsersPage(results[2].value).users);
      } else {
        logApiFailure("Error fetching mentors:", results[2].reason);
        setMentors([]);
      }
      setMentorsLoading(false);

      if (results[3].status === "fulfilled") {
        setPastors(readUsersPage(results[3].value).users);
      } else {
        logApiFailure("Error fetching pastors:", results[3].reason);
        setPastors([]);
      }
      setPastorsLoading(false);

      // Director overview + merge with per-user `/progress/overview/all` when API returns zeros
      let overviewFromApi: DirectorOverviewDto | null = null;
      if (results[4].status === "fulfilled") {
        overviewFromApi = unwrapDirectorOverview(results[4].value);
      } else {
        logApiFailure("Error fetching director overview:", results[4].reason);
      }

      let progressRows: UserOverallProgress[] = [];
      // if (results[7].status === "fulfilled") {
      if (results[7].status === "fulfilled" && results[7].value) {
        // progressRows = unwrapOverallProgressList(results[7].value);
        const progressRes: any = results[7].value;
progressRows = unwrapOverallProgressList(progressRes);
      } else {
        // console.warn("Error fetching overall progress (mentor/pastor):", results[7].reason);
        console.warn("Error fetching overall progress (mentor/pastor):", (results[7] as any).reason);
      }

      // Director overview may include a `users` list not present on `/overview/all`
      const fromOverviewUsers = overviewFromApi?.users;
      if (Array.isArray(fromOverviewUsers) && fromOverviewUsers.length > 0) {
        const seen = new Set(
          progressRows
            .map((r) => extractUserIdFromOverallProgressRow(r))
            .filter((id): id is string => Boolean(id)),
        );
        for (const u of fromOverviewUsers) {
          const id = extractUserIdFromOverallProgressRow(u);
          if (id && !seen.has(id)) {
            progressRows.push(u);
            seen.add(id);
          }
        }
      }

      const synthetic =
        progressRows.length > 0 ? aggregateDirectorOverviewFromUsers(progressRows) : null;
      setDirectorOverview(mergeDirectorOverviewWithUserAggregate(overviewFromApi, synthetic));
      setOverviewLoading(false);

      // Handle user details
      if (results[5].status === "fulfilled" && results[5].value) {
        setUser(readUserPayload(results[5].value));
        if (uid) {
          setCookie("userId", uid);
        }
      } else if (results[5].status === "rejected") {
        logApiFailure("Error fetching user details:", results[5].reason);
        setUser(null);
      }

      // Completed-course count (pastors marked completed)
      // if (results[6].status === 'fulfilled') {
      if (results[6].status === "fulfilled" && results[6].value) {
        // const body = results[6].value.data?.data;
        const completedRes: any = results[6].value;
const body = completedRes?.data?.data;
        const total =
          typeof body?.total === 'number'
            ? body.total
            : Array.isArray(body?.users)
              ? body.users.length
              : 0;
        setCompletedPastorsCount(total);
      } else {
        logApiFailure("Error fetching completed pastors count:", (results[6] as any).reason);
        setCompletedPastorsCount(null);
      }
    };

    fetchAllData();
  }, [resolvedUserId]);

  const chartData = useMemo(() => {
    if (chartRangeId === "n3" || chartRangeId === "n6") {
      const n = chartRangeId === "n3" ? 3 : 6;
      return buildUpcomingMonthsPlaceholderChart(n, currentTime);
    }
    const n = chartMonthCountFromRange(chartRangeId);
    const months = (directorOverview?.monthlyData ?? []).slice(-n);
    return months.map((month) => ({
      pastor: month.pastorsCompleted,
      mentor: month.mentorsCompleted,
      year: month.year,
      month: month.month,
      monthName:
        month.monthName?.trim() ||
        (month.month && month.year
          ? new Date(month.year, month.month - 1, 1).toLocaleString("en-US", { month: "short" })
          : ""),
    }));
  }, [directorOverview?.monthlyData, chartRangeId, currentTime]);

  // const filteredNetworkMapPeople = useMemo(() => {
  //   if (!debouncedMapSearch) return networkMapPeople;
  //   return networkMapPeople.filter(
  //     (p) =>
  //       p.name.toLowerCase().includes(debouncedMapSearch) ||
  //       p.id.toLowerCase().includes(debouncedMapSearch),
  //   );
  // }, [networkMapPeople, debouncedMapSearch]);
  const filteredNetworkMapPeople = useMemo(() => {
  return networkMapPeople.filter((p) => {
    const matchesSearch =
      !debouncedMapSearch ||
      p.name.toLowerCase().includes(debouncedMapSearch) ||
      p.id.toLowerCase().includes(debouncedMapSearch);

    const matchesRole =
      mapRoleFilter === "all" || p.kind === mapRoleFilter;

    return matchesSearch && matchesRole;
  });
}, [networkMapPeople, debouncedMapSearch, mapRoleFilter]);

  const networkMapMarkers: MapMarker[] = useMemo(() => {
    const list = filteredNetworkMapPeople.slice(0, MAX_NETWORK_MAP_MARKERS);
    return list.map((p, i) => {
      const slot = NETWORK_MAP_OVERLAY_SLOTS[i % NETWORK_MAP_OVERLAY_SLOTS.length] ?? {
        top: "50%",
        left: "50%",
      };
      return {
        id: p.id,
        name: p.name,
        img: p.img,
        top: slot.top,
        left: slot.left,
        kind: p.kind,
      };
    });
  }, [filteredNetworkMapPeople]);

  const donutChartData = useMemo(() => {
    if (!directorOverview) return null;

    let completed = Number(directorOverview.overallCombinedProgress);
    if (!Number.isFinite(completed)) completed = 0;
    completed = Math.min(100, Math.max(0, completed));
    const remaining = 100 - completed;
    const completedDegrees = (completed / 100) * 360;

    return { completed, remaining, completedDegrees };
  }, [directorOverview]);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // const nameParts = fullName.trim().split(/\s+/);
    // const firstName = nameParts[0] || "";
    // const lastName = nameParts.slice(1).join(" ") || "";

    // if (!firstName) {
    //   alert("Please enter a full name");
    //   return;
    // }
    const trimmedFirstName = firstName.trim();
const trimmedLastName = lastName.trim();

if (!trimmedFirstName) {
  alert("Please enter first name");
  return;
}

if (!trimmedLastName) {
  alert("Please enter last name");
  return;
}

    // const userData: CreateUserDto = {
    //   firstName,
    //   lastName,
    //   email: userForm.email,
    //   role: userForm.role as UserRole,
    // };
    const userData: CreateUserDto = {
  firstName: trimmedFirstName,
  lastName: trimmedLastName,
  email: userForm.email,
  role: userForm.role as UserRole,
};

    try {
      setAddUserLoading(true);
      await apiCreateUser(userData);
      // setFullName("");
      setFirstName("");
setLastName("");
      setUserForm({ email: "", role: "" });

      fetchMentors();
      fetchPastors();

      alert("User added successfully!");
    } catch (error: any) {
      console.error("Failed to add user:", error);
      alert(error.response?.data?.message || "Failed to add user. Please try again.");
    } finally {
      setAddUserLoading(false);
    }
  // }, [fullName, userForm, fetchMentors, fetchPastors]);
  }, [firstName, lastName, userForm, fetchMentors, fetchPastors]);

  // Get current data based on active tab
  const currentData = useMemo(() => activeTab === "mentors" ? mentors : pastors, [activeTab, mentors, pastors]);
  const currentLoading = useMemo(() => activeTab === "mentors" ? mentorsLoading : pastorsLoading, [activeTab, mentorsLoading, pastorsLoading]);

//   const formatAppointment = useCallback((appointment: Appointment) => {
//     const p = (appointment.platform || "").toLowerCase();
//  const platformIcon =
//   p === "zoom" || p.includes("zoom")
//     ? ZoomIcon
//     : p === "gmeet" || p === "google-meet" || p.includes("google")
//       ? MeetIcon
//       : DuoIcon;
//     const mentorName = appointment.mentor
//       ? `${appointment.mentor.firstName || ''} ${appointment.mentor.lastName || ''}`.trim()
//       : 'Mentor';
//     const mentorRole = appointment.mentor?.role || 'mentor';
//     const meetingDate = new Date(appointment.meetingDate);
//     const meetingTime = meetingDate.toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: true
//     });

//     return { platformIcon, mentorName, mentorRole, meetingDate, meetingTime };
//   }, []);
const formatAppointment = useCallback((appointment: Appointment) => {
  const p = (appointment.platform || "").toLowerCase();

  const platformIcon =
    p === "zoom" || p.includes("zoom")
      ? ZoomIcon
      : p === "gmeet" || p === "google-meet" || p.includes("google")
        ? MeetIcon
        : DuoIcon;

  // const mentor = appointment.mentor;
  // const attendee = appointment.user;
  const mentor =
  appointment.mentor ??
  (typeof (appointment as any).mentorId === "object"
    ? (appointment as any).mentorId
    : undefined);

const attendee =
  appointment.user ??
  (typeof (appointment as any).userId === "object"
    ? (appointment as any).userId
    : undefined);

  const mentorName =
    `${mentor?.firstName || ""} ${mentor?.lastName || ""}`.trim() ||
    mentor?.email ||
    "Mentor";

  const mentorRole = mentor?.role || "mentor";

  const attendeeName =
    `${attendee?.firstName || ""} ${attendee?.lastName || ""}`.trim() ||
    attendee?.email ||
    "Participant";

  const attendeeRole = attendee?.role || "pastor";

  const meetingDate = new Date(appointment.meetingDate);
  const meetingTime = meetingDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    platformIcon,
    mentorName,
    mentorRole,
    attendeeName,
    attendeeRole,
    meetingDate,
    meetingTime,
  };
}, []);

  const displayName =
    user?.firstName || cookieUser?.firstName
      ? `${user?.firstName ?? cookieUser?.firstName ?? ""} ${user?.lastName ?? cookieUser?.lastName ?? ""}, Welcome Aboard!`
      : "Welcome Aboard!";
      const openQuickAssignMentors = async () => {
  try {
    setShowQuickAssignModal(true);
    setQuickAssignLoading(true);
    setSelectedQuickPastorId("");
    setSelectedQuickMentorId("");
    setQuickAssignMentorSearch("");
    setQuickAssignPastorSearch("");

    const [pastorsRes, mentorsRes] = await Promise.all([
      apiGetAllUsers({
        role: "pastor",
        roleMatch: "mixed",
        page: 1,
        limit: 100,
        t: Date.now(),
      }),
      apiGetAllUsers({
        role: "mentor",
        roleMatch: "mixed",
        page: 1,
        limit: 100,
        t: Date.now(),
      }),
    ]);

    const pastorsData: any = pastorsRes?.data?.data;
    const mentorsData: any = mentorsRes?.data?.data;

    const pastorsList = Array.isArray(pastorsData)
      ? pastorsData
      : Array.isArray(pastorsData?.users)
        ? pastorsData.users
        : [];

    const mentorsList = Array.isArray(mentorsData)
      ? mentorsData
      : Array.isArray(mentorsData?.users)
        ? mentorsData.users
        : [];

    // setQuickAssignPastors(pastorsList);
    // setQuickAssignMentors(mentorsList);
    const [hydratedPastors, hydratedMentors] = await Promise.all([
  hydrateUsersWithProfilePictures(pastorsList),
  hydrateUsersWithProfilePictures(mentorsList),
]);

setQuickAssignPastors(hydratedPastors);
setQuickAssignMentors(hydratedMentors);
  } catch (error) {
    console.error("Failed to load pastors/mentors", error);
    alert("Could not load pastors and mentors.");
  } finally {
    setQuickAssignLoading(false);
  }
};

const openAssignMenteeModal = async () => {
  try {
    setShowAssignMenteeModal(true);
    setAssignMenteeLoading(true);
    setSelectedAssignMentorId("");
    setSelectedAssignPastorId("");
    setAssignMenteeMentorSearch("");
    setAssignMenteePastorSearch("");

    const [mentorsRes, pastorsRes] = await Promise.all([
      apiGetAllUsers({
        role: "mentor",
        roleMatch: "mixed",
        page: 1,
        limit: 100,
        t: Date.now(),
      }),
      apiGetAllUsers({
        role: "pastor",
        roleMatch: "mixed",
        page: 1,
        limit: 100,
        t: Date.now(),
      }),
    ]);

    const mentorsData: any = mentorsRes?.data?.data;
    const pastorsData: any = pastorsRes?.data?.data;

    const mentorsList = Array.isArray(mentorsData)
      ? mentorsData
      : Array.isArray(mentorsData?.users)
        ? mentorsData.users
        : [];

    const pastorsList = Array.isArray(pastorsData)
      ? pastorsData
      : Array.isArray(pastorsData?.users)
        ? pastorsData.users
        : [];

    const [hydratedMentors, hydratedPastors] = await Promise.all([
      hydrateUsersWithProfilePictures(mentorsList),
      hydrateUsersWithProfilePictures(pastorsList),
    ]);

    setAssignMenteeMentors(hydratedMentors);
    setAssignMenteePastors(hydratedPastors);
  } catch (error) {
    console.error("Failed to load mentors and mentees", error);
    alert("Could not load mentors and mentees.");
  } finally {
    setAssignMenteeLoading(false);
  }
};

const handleAssignMentee = async () => {
  if (!selectedAssignMentorId || !selectedAssignPastorId) {
    setAssignMenteeToast({
      message: "Please select one mentor and one mentee.",
      type: "error",
    });
    setTimeout(() => setAssignMenteeToast(null), 3000);
    return;
  }

  try {
    setAssignMenteeSaving(true);

    await apiAssignUsers(selectedAssignMentorId, [selectedAssignPastorId]);

    setShowAssignMenteeModal(false);
    setSelectedAssignMentorId("");
    setSelectedAssignPastorId("");

    setAssignMenteeToast({
      message: "Mentee assigned successfully.",
      type: "success",
    });
    setTimeout(() => setAssignMenteeToast(null), 3500);
  } catch (error) {
    console.error("Failed to assign mentee", error);

    setAssignMenteeToast({
      message: "Failed to assign mentee. Please try again.",
      type: "error",
    });
    setTimeout(() => setAssignMenteeToast(null), 3500);
  } finally {
    setAssignMenteeSaving(false);
  }
};

const handleQuickAssignMentor = async () => {
  if (!selectedQuickPastorId || !selectedQuickMentorId) {
    setQuickAssignToast({
  message: "Please select one pastor and one mentor.",
  type: "error",
});
    setTimeout(() => setQuickAssignToast(null), 3000);
    return;
  }

  const selectedPastor = quickAssignPastors.find(
    (pastor) => String(pastor._id ?? pastor.id ?? "") === selectedQuickPastorId
  );

  const selectedMentor = quickAssignMentors.find(
    (mentor) => String(mentor._id ?? mentor.id ?? "") === selectedQuickMentorId
  );

  const pastorName =
    `${selectedPastor?.firstName ?? ""} ${selectedPastor?.lastName ?? ""}`.trim() ||
    selectedPastor?.email ||
    "Pastor";

  const mentorName =
    `${selectedMentor?.firstName ?? ""} ${selectedMentor?.lastName ?? ""}`.trim() ||
    selectedMentor?.email ||
    "Mentor";

  // try {
  //   setQuickAssignSaving(true);

  //   await apiAssignUsers(selectedQuickPastorId, [selectedQuickMentorId]);

  //   setShowQuickAssignModal(false);
  //   setSelectedQuickPastorId("");
  //   setSelectedQuickMentorId("");

  //   setQuickAssignToast(`${mentorName} assigned to ${pastorName} successfully.`);
  //   setTimeout(() => setQuickAssignToast(null), 3500);
  // } catch (error) {
  try {
  setQuickAssignSaving(true);

  const assignedRes = await apiGetAssignedUsers(selectedQuickPastorId);

  const alreadyAssignedUsers = Array.isArray(assignedRes?.data?.data)
    ? assignedRes.data.data
    : [];

  const isMentorAlreadyAssigned = alreadyAssignedUsers.some((user: any) => {
    const assignedUserId = String(
      user?._id ??
        user?.id ??
        user?.userId ??
        user?.mentorId ??
        user?.assignedUser?._id ??
        user?.assignedUser?.id ??
        ""
    );

    return assignedUserId === selectedQuickMentorId;
  });

  if (isMentorAlreadyAssigned) {
    setQuickAssignToast({
  message: `${mentorName} is already assigned to ${pastorName}.`,
  type: "error",
});
    setTimeout(() => setQuickAssignToast(null), 3500);
    return;
  }

  await apiAssignUsers(selectedQuickPastorId, [selectedQuickMentorId]);

  setShowQuickAssignModal(false);
  setSelectedQuickPastorId("");
  setSelectedQuickMentorId("");

  setQuickAssignToast({
  message: `${mentorName} assigned to ${pastorName} successfully.`,
  type: "success",
});
  setTimeout(() => setQuickAssignToast(null), 3500);
} catch (error) {
    console.error("Failed to assign mentor", error);
    setQuickAssignToast({
  message: "Failed to assign mentor. Please try again.",
  type: "error",
});
    setTimeout(() => setQuickAssignToast(null), 3500);
  } finally {
    setQuickAssignSaving(false);
  }
};

const openPastorsRoadmapModal = async () => {
  try {
    setShowPastorRoadmapModal(true);
    setRoadmapPastorsLoading(true);
    setRoadmapPastorSearch("");

    const res = await apiGetAllUsers({
      role: "pastor",
      roleMatch: "mixed",
      page: 1,
      limit: 100,
      t: Date.now(),
    });

    const data: any = res?.data?.data;

    const pastorsList = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : [];

    // setRoadmapPastors(pastorsList);
    setRoadmapPastors(await hydrateUsersWithProfilePictures(pastorsList));
  } catch (error) {
    console.error("Failed to load pastors for roadmap", error);
    setRoadmapPastors([]);
  } finally {
    setRoadmapPastorsLoading(false);
  }
};
const openMonthlyAppointmentsModal = async () => {
  try {
    setShowMonthlyAppointmentsModal(true);
    setMonthlyAppointmentsLoading(true);
    setMonthlyAppointmentDate("");

    const res = await apiGetAppointments({
      futureOnly: false,
      t: Date.now(),
    } as any);

    const list = (unwrapAppointmentsAxiosData(res) || []) as Appointment[];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // const thisMonthAppointments = list
    //   .filter((appointment) => {
    //     const meetingDate = new Date(appointment.meetingDate);
    //     return (
    //       meetingDate.getMonth() === currentMonth &&
    //       meetingDate.getFullYear() === currentYear
    //     );
    //   })
    const startOfToday = new Date(
  now.getFullYear(),
  now.getMonth(),
  now.getDate()
);

const thisMonthAppointments = list
  .filter((appointment) => {
    const meetingDate = new Date(appointment.meetingDate);

    return (
      meetingDate >= startOfToday &&
      meetingDate.getMonth() === currentMonth &&
      meetingDate.getFullYear() === currentYear
    );
  })
      .sort(
        (a, b) =>
          new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime()
      );

    setMonthlyAppointments(thisMonthAppointments);
  } catch (error) {
    console.error("Failed to load monthly appointments", error);
    setMonthlyAppointments([]);
  } finally {
    setMonthlyAppointmentsLoading(false);
  }
};

const filteredMonthlyAppointments = monthlyAppointmentDate
  ? monthlyAppointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.meetingDate)
        .toISOString()
        .slice(0, 10);

      return appointmentDate === monthlyAppointmentDate;
    })
  : monthlyAppointments;

  const selectedQuickPastor = quickAssignPastors.find(
  (pastor) => String(pastor._id ?? pastor.id ?? "") === selectedQuickPastorId
);

const selectedQuickPastorName =
  `${selectedQuickPastor?.firstName ?? ""} ${selectedQuickPastor?.lastName ?? ""}`.trim() ||
  selectedQuickPastor?.email ||
  "Selected pastor";

  const openMentorMenteeMappingModal = async () => {
  try {
    setShowMentorMenteeModal(true);
    setMappingLoading(true);
    setSelectedMappingMentorId("");
    setMappingMentees([]);
setMappingMentorSearch("");
    const res = await apiGetAllUsers({
      role: "mentor",
      roleMatch: "mixed",
      page: 1,
      limit: 100,
      t: Date.now(),
    });

    const data: any = res?.data?.data;

    const mentorsList = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : [];

    // setMappingMentors(mentorsList);
    setMappingMentors(await hydrateUsersWithProfilePictures(mentorsList));
  } catch (error) {
    console.error("Failed to load mentors", error);
    setMappingMentors([]);
  } finally {
    setMappingLoading(false);
  }
};

const loadMenteesForMentor = async (mentorId: string) => {
  try {
    setSelectedMappingMentorId(mentorId);
    const selectedMentor = mappingMentors.find(
  (mentor) => String(mentor._id ?? mentor.id ?? "") === mentorId
);

setSelectedMappingMentorName(
  `${selectedMentor?.firstName ?? ""} ${selectedMentor?.lastName ?? ""}`.trim() ||
    selectedMentor?.email ||
    "This mentor"
);
    setMappingMenteesLoading(true);
    setMappingMentees([]);

    const res = await apiGetAssignedUsers(mentorId);
    const assignedUsers = Array.isArray(res?.data?.data) ? res.data.data : [];

    setMappingMentees(assignedUsers);
  } catch (error) {
    console.error("Failed to load assigned mentees", error);
    setMappingMentees([]);
  } finally {
    setMappingMenteesLoading(false);
  }
};

const openCdpModal = async () => {
  try {
    setShowCdpModal(true);
    setCdpPastorsLoading(true);
    setSelectedCdpPastorId("");
    setSelectedCdpPastorName("");
    setCdpAssessments([]);
setCdpPastorSearch("");
    const res = await apiGetAllUsers({
      role: "pastor",
      roleMatch: "mixed",
      page: 1,
      limit: 100,
      t: Date.now(),
    });

    const data: any = res?.data?.data;

    const pastorsList = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : [];

    // setCdpPastors(pastorsList);
    setCdpPastors(await hydrateUsersWithProfilePictures(pastorsList));
  } catch (error) {
    console.error("Failed to load pastors for CDP", error);
    setCdpPastors([]);
  } finally {
    setCdpPastorsLoading(false);
  }
};

const loadCdpAssessmentsForPastor = async (pastor: any) => {
  const pastorId = String(pastor._id ?? pastor.id ?? "");
  const pastorName =
    `${pastor.firstName ?? ""} ${pastor.lastName ?? ""}`.trim() ||
    pastor.email ||
    "Selected pastor";

  if (!pastorId) return;

  try {
    setSelectedCdpPastorId(pastorId);
    setSelectedCdpPastorName(pastorName);
    setCdpAssessmentsLoading(true);
    setCdpAssessments([]);

    const res = await apiGetAssignedAssessments(pastorId);
    const rows = parseAssignedAssessmentsListBody(res.data);
    

    const completedWithCdp = rows
      .map((item: any) => {
        // const flat = flattenAssignedAssessmentRow(item);
        // if (!flat) return null;

        // const assessment: any = flat.assessment ?? {};
        const flatRaw = flattenAssignedAssessmentRow(item);
if (!flatRaw) return null;

const flat: any = flatRaw;
const rawItem: any = item;

const assessment: any = flat.assessment ?? {};
        const assessmentId = String(
          assessment._id ?? assessment.id ?? flat.assessmentId ?? ""
        );

        const status = String(
          flat.status ??
            flat.progressStatus ??
            item?.status ??
            item?.progressStatus ??
            ""
        )
          .toLowerCase()
          .trim();

        const hasCdp =
          Boolean(flat.customizedDevelopmentPlan) ||
          Boolean(flat.customizedDevelopmentPlanId) ||
          Boolean(flat.cdp) ||
          Boolean(flat.recommendation) ||
          Boolean(flat.recommendations) ||
          Boolean(item?.customizedDevelopmentPlan) ||
          Boolean(item?.customizedDevelopmentPlanId) ||
          Boolean(item?.cdp) ||
          Boolean(item?.recommendation) ||
          Boolean(item?.recommendations);

        // const isCompleted =
        //   status === "completed" ||
        //   status === "reviewed" ||
        //   status === "submitted";
        const hasRecommendations =
  Array.isArray(assessment?.sections) &&
  assessment.sections.some((section: any) =>
    Array.isArray(section?.recommendations) &&
    section.recommendations.length > 0
  );

const isCompleted =
  status === "completed" ||
  status === "reviewed" ||
  status === "submitted" ||
  hasRecommendations;

        // if (!assessmentId || !isCompleted || !hasCdp) return null;
        if (!assessmentId || !isCompleted) return null;

        return {
          id: assessmentId,
          title: assessment.name || assessment.title || "Untitled assessment",
          description: assessment.description || "",
        };
      })
      .filter(Boolean);

    setCdpAssessments(completedWithCdp);
  } catch (error) {
    console.error("Failed to load CDP assessments", error);
    setCdpAssessments([]);
  } finally {
    setCdpAssessmentsLoading(false);
  }
};

const filteredQuickAssignMentors = quickAssignMentors.filter((mentor) => {
  const fullName = `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(mentor?.email ?? "").toLowerCase();
  const search = quickAssignMentorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const filteredQuickAssignPastors = quickAssignPastors.filter((pastor) => {
  const fullName = `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(pastor?.email ?? "").toLowerCase();
  const search = quickAssignPastorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const filteredRoadmapPastors = roadmapPastors.filter((pastor) => {
  const fullName = `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(pastor?.email ?? "").toLowerCase();
  const search = roadmapPastorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const filteredCdpPastors = cdpPastors.filter((pastor) => {
  const fullName = `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(pastor?.email ?? "").toLowerCase();
  const search = cdpPastorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const filteredMappingMentors = mappingMentors.filter((mentor) => {
  const fullName = `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(mentor?.email ?? "").toLowerCase();
  const search = mappingMentorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});
const filteredAssignMenteeMentors = assignMenteeMentors.filter((mentor) => {
  const fullName = `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(mentor?.email ?? "").toLowerCase();
  const search = assignMenteeMentorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const filteredAssignMenteePastors = assignMenteePastors.filter((pastor) => {
  const fullName = `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`
    .trim()
    .toLowerCase();

  const email = String(pastor?.email ?? "").toLowerCase();
  const search = assignMenteePastorSearch.trim().toLowerCase();

  if (!search) return true;

  return fullName.includes(search) || email.includes(search);
});

const selectedAssignMentor = assignMenteeMentors.find(
  (mentor) => String(mentor._id ?? mentor.id ?? "") === selectedAssignMentorId
);

const selectedAssignMentorName =
  `${selectedAssignMentor?.firstName ?? ""} ${selectedAssignMentor?.lastName ?? ""}`.trim() ||
  selectedAssignMentor?.email ||
  "Selected mentor";


  return (
    <div className={directorPageRoot}>
      {/* Hero — mentor / pastor glass + image */}
      <section className={`relative overflow-hidden rounded-3xl border border-white/10 ${directorGlassCard}`}>
        <div className="relative h-[240px] sm:h-[300px] lg:h-[340px]">
          <Image
            src={HeroBg}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#062946] via-[#062946]/75 to-[#0a3558]/50" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/90 via-transparent to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-full space-y-2 lg:max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
                {getGreeting()}
              </p>
              <h1 className="text-xl font-semibold leading-snug sm:text-3xl lg:text-4xl">
                Cultivate Spiritual, Professional, Social, And Community
                <br className="hidden sm:block" />
                Engagement Developments
              </h1>
              <p className="text-sm text-white/80">{formattedTime}</p>
              <p className="text-xs text-white/60 sm:text-sm">{formattedDate}</p>
            </div>

            {/* <button
              type="button"
              onClick={() => router.push("/director/profile")}
              className="mt-4 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md transition hover:bg-white/15 lg:mt-0 lg:w-auto"
            >
              <Image
                src={UserProfile}
                alt=""
                width={48}
                height={48}
                className="rounded-full border-2 border-white/30"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{displayName}</p>
              </div>
            </button> */}
            <div className="mt-4 flex w-full max-w-sm items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-left backdrop-blur-md lg:mt-0 lg:w-auto">
  {/* <Image
    src={UserProfile}
    alt=""
    width={48}
    height={48}
    className="rounded-full border-2 border-white/30"
  /> */}
  <Image
  src={
    getPersonProfilePicture(user) ||
    getInitialsAvatar(user?.firstName, user?.lastName, "Director")
  }
  alt=""
  width={48}
  height={48}
  unoptimized
  className="rounded-full border-2 border-white/30 object-cover"
/>
  <div className="min-w-0 flex-1">
    <p className="text-sm font-semibold text-white">{displayName}</p>
  </div>
</div>
          </div>
        </div>
      </section>

      {/* Continue watching */}
      {/* <section className="mt-10 flex flex-col items-start justify-between gap-10 py-10 lg:flex-row">
        <div className="flex flex-col justify-center lg:w-1/4">
          <h2 className="mb-4 text-3xl font-semibold leading-tight text-white">
            Continue <br /> Watching{" "}
            <span className="text-[#8ec5eb] underline decoration-[#8ec5eb]/40 decoration-2 underline-offset-4">
              Course
            </span>
          </h2>
        </div>

        <div className="relative w-full lg:w-3/4">
          <Swiper
            modules={[Navigation, Pagination]}
            spaceBetween={24}
            slidesPerView={3}
            pagination={{ clickable: true }}
            loop={mediaList.length > 3}
            className="pb-12 [&_.swiper-pagination-bullet]:bg-white/40 [&_.swiper-pagination-bullet-active]:bg-[#8ec5eb]"
            breakpoints={{
              0: { slidesPerView: 1 },
              768: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
          >
            {mediaList.map((item) => (
              <SwiperSlide key={item._id}>
                <div className={`overflow-hidden rounded-xl text-left ${directorGlassCard} ${directorGlassCardHover}`}>
                  <div className="relative">
                    <Image
                      src={getMediaThumbnail(item)}
                      alt={item.heading || "Media thumbnail"}
                      width={400}
                      height={200}
                      className="h-[160px] w-full object-cover sm:h-[180px]"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <button
                        type="button"
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 transition hover:scale-110"
                      >
                        <i className="fa-solid fa-play text-sm text-[#0f4a76]" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="mb-1 text-xs font-semibold text-[#8ec5eb]">
                      {item.subheading || "Introduction"}
                    </p>
                    <h4 className="mb-1 text-sm font-semibold text-white">{item.heading}</h4>
                    <p className="mb-3 text-xs leading-snug text-white/65">{item.description}</p>
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                      </span>
                      <button
                        type="button"
                        className="rounded-md border border-[#8ec5eb]/50 p-[6px] text-[#8ec5eb] transition hover:bg-[#8ec5eb]/15"
                      >
                        <i className="fa-solid fa-arrow-up-right-from-square text-[10px]" />
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section> */}

      {/* Today's Appointments + New Interests */}
<section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
  {/* Today's Appointments */}
  <div className={`${directorGlassCard} p-5 sm:p-6`}>
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-white sm:text-lg">
        Today's Appointments
      </h2>

      <Link
        href="/director/schedule"
        className="text-xs font-semibold text-[#8ec5eb] hover:text-[#b8ddf5]"
      >
        See all
      </Link>
    </div>

    {appointmentsLoading ? (
      <p className="py-8 text-center text-sm text-white/55">
        Loading appointments…
      </p>
    ) : appointments.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-center text-sm text-white/55">
        No appointments scheduled for today.
      </div>
    ) : (
      <div className="h-[455px] space-y-4 overflow-y-auto pr-3 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8ec5eb]/35 hover:[&::-webkit-scrollbar-thumb]:bg-[#8ec5eb]/55">
        {/* {appointments.slice(0, 2).map((appointment) => {
          const { platformIcon, mentorName, mentorRole, meetingTime } =
            formatAppointment(appointment);

          return ( */}
          {appointments.map((appointment) => {
            const appointmentId = appointmentEntityId(appointment);
  // const { platformIcon, meetingTime } = formatAppointment(appointment);
const {
  platformIcon,
  mentorName,
  mentorRole,
  attendeeName,
  attendeeRole,
  meetingTime,
} = formatAppointment(appointment);
  // const mentor =
  //   appointment.mentor ??
  //   (typeof (appointment as any).mentorId === "object"
  //     ? (appointment as any).mentorId
  //     : undefined);

  // const attendee =
  //   appointment.user ??
  //   (typeof (appointment as any).userId === "object"
  //     ? (appointment as any).userId
  //     : undefined);

  // const mentorName =
  //   `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim() ||
  //   mentor?.email ||
  //   "Director";

  // const attendeeName =
  //   `${attendee?.firstName ?? ""} ${attendee?.lastName ?? ""}`.trim() ||
  //   attendee?.email ||
  //   "Participant";

  // const attendeeRole = attendee?.role || "Pastor";
  // const attendeeEmail = attendee?.email || "";
  const attendeeEmail =
  appointment.user?.email ||
  ((appointment as any).userId && typeof (appointment as any).userId === "object"
    ? (appointment as any).userId.email
    : "") ||
  "";

  return (
            <div
              key={appointment.id}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10">
                  <Image
                    src={platformIcon}
                    alt={appointment.platform}
                    className="h-10 w-10"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  {/* <h4 className="text-sm font-semibold text-white">
                    {mentorName}
                  </h4>

                  <p className="mt-0.5 text-xs capitalize text-white/60">
                    {mentorRole}
                  </p> */}
                  <h4 className="text-sm font-semibold text-white">
  {mentorName}
</h4>

{/* <p className="mt-0.5 text-xs capitalize text-white/60">
  Director
</p> */}
<p className="mt-0.5 text-xs capitalize text-white/60">
  {mentorRole}
</p>

<p className="mt-2 text-sm font-semibold text-white">
  {attendeeName}
</p>

<p className="mt-0.5 text-xs capitalize text-white/60">
  {attendeeRole}
</p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    {/* <span className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-100">
                      <i className="fa-solid fa-circle mr-1 text-[7px]" />
                      In discussion
                    </span> */}
                    <span className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-2 py-1 text-emerald-100">
  <i className="fa-solid fa-circle mr-1 text-[7px]" />
  {appointment.status
    ? appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)
    : "Scheduled"}
</span>

                    <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/80">
                      <i className="fa-regular fa-clock mr-1 text-[#8ec5eb]" />
                      {meetingTime}
                    </span>
                  </div>

                  {/* <div className="mt-2 flex gap-4 text-sm text-white/70">
                    <i className="fa-solid fa-phone" />
                    <i className="fa-regular fa-comment" />
                    <i className="fa-brands fa-whatsapp" />
                  </div> */}
         <div className="mt-2 flex gap-4 text-sm text-white/70">
  <button
    type="button"
    disabled={!attendeeEmail}
    className="hover:text-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-40"
    aria-label={`Email ${attendeeEmail || attendeeName}`}
    onClick={() => {
      if (!attendeeEmail) return;

      const subject = encodeURIComponent("Community Change Appointment");
      window.location.href = `mailto:${attendeeEmail}?subject=${subject}`;
    }}
  >
    <i className="fa-regular fa-envelope" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Call disabled"
    title="Call disabled"
  >
    <i className="fa-solid fa-phone" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Chat disabled"
    title="Chat disabled"
  >
    <i className="fa-regular fa-comment" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="WhatsApp disabled"
    title="WhatsApp disabled"
  >
    <i className="fa-brands fa-whatsapp" />
  </button>
</div>
                </div>

                {/* <button
                  type="button"
                  onClick={() => router.push("/director/schedule")}
                  className="self-end rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Details
                </button> */}
                <button
  type="button"
  disabled={!appointmentId}
  onClick={() => {
    if (!appointmentId) return;
    router.push(`/director/schedule/${encodeURIComponent(appointmentId)}`);
  }}
  className="self-end rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
>
  Details
</button>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>

  {/* New Interests */}
  <div className={`${directorGlassCard} p-5 sm:p-6`}>
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h2 className="text-base font-semibold text-white sm:text-lg">
          New Interests
        </h2>

        <p className="mt-1 max-w-md text-xs leading-relaxed text-white/60">
          Review the details of the newly submitted interest and take the next
          steps to guide and support.
        </p>
      </div>

      <Link
        href="/director/interest-list"
        className="shrink-0 text-xs font-semibold text-[#8ec5eb] hover:text-[#b8ddf5]"
      >
        See all
      </Link>
    </div>

    {interestsLoading ? (
      <p className="py-8 text-center text-sm text-white/55">
        Loading interests…
      </p>
    ) : interests.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-8 text-center text-sm text-white/55">
        No new interests
      </div>
    ) : (
      <div className="space-y-3">
        {interests.slice(0, 4).map((interest) => (
          <div
            key={interest._id}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#8ec5eb]/20">
              <i className="fa-solid fa-user text-sm text-[#8ec5eb]" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-white">
                {interest.firstName} {interest.lastName}
              </h4>

              <p className="mt-0.5 truncate text-xs text-white/55">
                {interest.title || "No title"}
              </p>
            </div>
{/* 
            <div className="flex items-center gap-4 text-[#8ec5eb]">
              <button type="button" className="hover:opacity-80" aria-label="Email">
                <i className="fa-solid fa-envelope text-sm" />
              </button>

              <button type="button" className="hover:opacity-80" aria-label="Chat">
                <i className="fa-regular fa-comment text-sm" />
              </button>

              <button type="button" className="hover:opacity-80" aria-label="Call">
                <i className="fa-solid fa-phone text-sm" />
              </button>
            </div> */}

         <div className="flex items-center gap-4 text-[#8ec5eb]">
  <button
    type="button"
    className="hover:opacity-80"
    aria-label={`Email ${interest.email}`}
    onClick={() => {
      if (!interest.email) return;

      const subject = encodeURIComponent("Community Change Interest Form");
      window.location.href = `mailto:${interest.email}?subject=${subject}`;
    }}
  >
    <i className="fa-solid fa-envelope text-sm" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Chat disabled"
    title="Chat disabled"
  >
    <i className="fa-regular fa-comment text-sm" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Call disabled"
    title="Call disabled"
  >
    <i className="fa-solid fa-phone text-sm" />
  </button>
</div>

            <button
              type="button"
              onClick={() => router.push(`/director/interest-list/${interest._id}`)}
              className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              View
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
</section>

      {/* Today's Appointments */}
      {/* <section className="relative mt-10 overflow-hidden py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold sm:text-xl">Today&apos;s Appointments</h2>
          <Link
            href="/director/schedule"
            className="text-sm font-medium text-[#8ec5eb] hover:text-[#b8ddf5]"
          >
            See all
          </Link>
        </div>

        {appointmentsLoading ? (
          <p className="text-sm text-white/55">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <div className={`p-8 text-center text-sm text-white/55 ${directorGlassCard}`}>
            No appointments scheduled for today.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {appointments.slice(0, 2).map((appointment) => {
              const { platformIcon, mentorName, mentorRole, meetingDate, meetingTime } =
                formatAppointment(appointment);

              return (
                <div
                  key={appointment.id}
                  className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${directorGlassCard}`}
                >
                  <div className="flex shrink-0 justify-center sm:justify-start">
                    <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:h-[120px] sm:w-[120px]">
                      <Image
                        src={platformIcon}
                        alt={appointment.platform}
                        className="h-12 w-12 sm:h-14 sm:w-14"
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="mb-3 flex items-center justify-center gap-3 sm:justify-start">
                      {appointment.mentor?.profilePicture ? (
                        <Image
                          src={appointment.mentor.profilePicture}
                          alt={mentorName}
                          width={40}
                          height={40}
                          unoptimized={isRemoteImageSrc(
                            appointment.mentor.profilePicture,
                          )}
                          className="rounded-full border border-white/30"
                        />
                      ) : (
                        <Image src={UserProfile} alt="User" width={40} height={40} className="rounded-full border border-white/30" />
                      )}
                      <div>
                        <h4 className="font-semibold text-white">{mentorName}</h4>
                        <p className="text-xs capitalize text-white/60">{mentorRole}</p>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap justify-center gap-2 text-xs sm:justify-start">
                      <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                        <i className="fa-regular fa-calendar mr-1 text-[#e3d247]" />
                        {meetingDate.toLocaleDateString()}
                      </span>
                      <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/85">
                        <i className="fa-regular fa-clock mr-1 text-[#5ee0d0]" />
                        {meetingTime}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:items-end">
                      <div>
                        <div className="mt-2 flex gap-4 text-sm text-white/80">
                          <i className="fa-solid fa-phone" />
                          <i className="fa-regular fa-comment" />
                          <i className="fa-brands fa-whatsapp" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push("/director/schedule")}
                        className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm text-white transition hover:bg-white/15"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section> */}

      {/* New Interests Section */}
      {/* <section className="mt-10 py-10">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 className="mb-4 text-2xl font-semibold sm:text-3xl md:text-[32px]">New Interests</h2>
            <p className="mb-6 text-base leading-relaxed text-white/70">
              Review the details of the newly submitted interest and take the
              next steps to guide and support the process effectively.
            </p>
            <button
              type="button"
              onClick={() => router.push("/director/interest-list")}
              className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-8 py-3 font-semibold text-white transition hover:bg-[#8ec5eb]/25"
            >
              See All
            </button>
          </div>

          <div className="space-y-4">
            {interestsLoading ? (
              <div className="py-8 text-center text-white/55">Loading interests…</div>
            ) : interests.length === 0 ? (
              <div className={`py-8 text-center text-sm text-white/55 ${directorGlassCard}`}>No new interests</div>
            ) : (
              interests.slice(0, 4).map((interest) => (
                <div
                  key={interest._id}
                  className={`flex flex-col items-start justify-between gap-4 rounded-xl p-4 sm:flex-row sm:items-center sm:p-5 ${directorGlassCard}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full border border-white/15 bg-[#8ec5eb]/20">
                      <i className="fa-solid fa-user text-xl text-[#8ec5eb]" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white">
                        {interest.firstName} {interest.lastName}
                      </h4>
                      <p className="text-sm text-white/55">{interest.title || "No title"}</p>
                    </div>
                  </div>

                  <div className="flex w-full items-center justify-end gap-3 sm:w-auto">
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-solid fa-envelope text-lg" />
                    </button>
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-regular fa-comment text-lg" />
                    </button>
                    <button type="button" className="text-[#8ec5eb] hover:opacity-80">
                      <i className="fa-solid fa-phone text-lg" />
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push(`/director/interest-list/${interest._id}`)}
                      className="rounded-md border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-[#8ec5eb]/25 sm:px-6"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section> */}

      {/* Add User Section */}
     
      <section className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
      
       <div className={`p-5 sm:p-6 ${directorGlassCard}`}>
         <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[0.75fr_1.25fr] lg:gap-8">
            {/* Left side */}
            <div className="flex h-full flex-col justify-center text-white lg:max-w-[260px]">
  <h2 className="mb-2 text-2xl font-bold sm:text-[28px]">
    Add User
  </h2>
  <p className="text-sm leading-relaxed text-white/75">
    Add pastors and mentors.
  </p>
</div>

            {/* Right side - Form */}
            <form onSubmit={handleAddUser} className="space-y-4">
             
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
  <div>
    <label className="text-white text-sm mb-2 block">
      First Name
    </label>
    <input
      type="text"
      placeholder="Enter first name"
      value={firstName}
      onChange={(e) => setFirstName(e.target.value)}
      required
      className="w-full rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
    />
  </div>

  <div>
    <label className="text-white text-sm mb-2 block">
      Last Name
    </label>
    <input
      type="text"
      placeholder="Enter last name"
      value={lastName}
      onChange={(e) => setLastName(e.target.value)}
      required
     className="w-full rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
    />
  </div>
</div>

              <div>
                <label className="text-white text-sm mb-2 block">
                  Email ID
                </label>
                <input
                  type="email"
                  placeholder="Enter e-mail ID"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                 className="w-full rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-sm placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
                />
              </div>

              <div>
                <label className="text-white text-sm mb-2 block">Title</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                 className="w-full rounded-md border border-white/30 bg-white/10 px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option className="text-black" value="">Select Title</option>
                  <option className="text-black" value="pastor">Pastor</option>
                  <option className="text-black" value="lay leader">Lay Leader</option>
                  <option className="text-black" value="seminarian">Seminarian</option>
                  <option className="text-black" value="mentor">Mentor</option>
                  <option className="text-black" value="field-mentor">Field Mentor</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="mt-2 rounded-md border border-white/30 bg-white/95 px-10 py-3 font-semibold text-[#062946] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {addUserLoading ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
        

         {/* Quick Links */}
{/* <section className="mt-8 py-8"> */}
<section className="m-0">
  <div className={`${directorGlassCard} p-4 sm:p-5`}>
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-base font-semibold text-white sm:text-lg">
        Quick Links
      </h2>

      {/* <button
        type="button"
        className="text-xs font-semibold text-[#8ec5eb] hover:text-[#b8ddf5]"
      >
        See all
      </button> */}
    </div>

    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-5">
      {directorQuickLinks.map((item) => (
        <button
          key={item.title}
          type="button"
          // onClick={() => router.push(item.route)}
//   onClick={() => {

//   if (item.title === "Assign Mentors") {
//     void openQuickAssignMentors();
//     return;
//   }

//   if (item.title === "Pastors Roadmap") {
//     void openPastorsRoadmapModal();
//     return;
//   }
//     if (item.title === "Monthly Appointments") {
//     void openMonthlyAppointmentsModal();
//     return;
//   }
// if (item.title === "Mentor-Mentee Mapping") {
//   void openMentorMenteeMappingModal();
//   return;
// }
// if (item.title === "Customized Development Plan") {
//   void openCdpModal();
//   return;
// }
// if ((link as any).action === "assignMentee") {
//   openAssignMenteeModal();
//   return;
// }
//   router.push(item.route);
// }}
onClick={() => {
  if (item.title === "Assign Mentors") {
    void openQuickAssignMentors();
    return;
  }

  if (item.title === "Assign Mentee") {
    void openAssignMenteeModal();
    return;
  }

  if (item.title === "Pastors Roadmap") {
    void openPastorsRoadmapModal();
    return;
  }

  if (item.title === "Monthly Appointments") {
    void openMonthlyAppointmentsModal();
    return;
  }

  if (item.title === "Mentor-Mentee Mapping") {
    void openMentorMenteeMappingModal();
    return;
  }

  if (item.title === "Customized Development Plan") {
    void openCdpModal();
    return;
  }

 const route = (item as { route?: string }).route;

if (route) {
  router.push(route);
}
}}
          className="group flex min-h-[120px] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-5 text-center transition hover:border-[#8ec5eb]/35 hover:bg-[#8ec5eb]/10"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#8ec5eb]/10 text-[#8ec5eb] transition group-hover:bg-[#8ec5eb]/20">
            <i className={`${item.icon} text-xl`} />
          </span>

          <span className="text-xs font-semibold leading-snug text-white/90 sm:text-sm">
            {item.title}
          </span>
        </button>
      ))}
    </div>
  </div>
</section>
</section>


        {/* Mentors/Pastors Section */}
      <div className="mt-10 sm:mt-12">
          <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex w-full gap-2 rounded-[20px] border border-white/10 bg-white/5 p-2 sm:w-auto sm:gap-4">
              <button
                type="button"
                onClick={() => setActiveTab("mentors")}
                className={`flex-1 rounded-[16px] px-6 py-3 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-8 md:px-10 sm:text-[16px] ${
                  activeTab === "mentors"
                    ? "bg-[#8ec5eb]/25 text-white shadow-md"
                    : "bg-transparent text-white/50 hover:text-white/85"
                }`}
              >
                Mentors
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("pastors")}
                className={`flex-1 rounded-[16px] px-6 py-3 text-sm font-semibold transition-all duration-300 sm:flex-none sm:px-8 md:px-10 sm:text-[16px] ${
                  activeTab === "pastors"
                    ? "bg-[#8ec5eb]/25 text-white shadow-md"
                    : "bg-transparent text-white/50 hover:text-white/85"
                }`}
              >
                Pastors
              </button>
            </div>
            <Link
              href={activeTab === "mentors" ? "/director/mentors" : "/director/mentees"}
              className="text-sm font-semibold text-[#8ec5eb] hover:text-[#b8ddf5] sm:text-[15px]"
            >
              See all
            </Link>
          </div>

          {currentLoading ? (
            <div className="py-8 text-center text-white/55">Loading…</div>
          ) : currentData.length === 0 ? (
            <div className="py-8 text-center text-white/55">No data available</div>
          ) : (
            // <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4 xl:gap-6">
<div className="flex w-full max-w-full gap-6 overflow-x-auto overflow-y-hidden pb-5 pr-4 [scrollbar-width:thin] [scrollbar-color:#8ec5eb55_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#8ec5eb]/40">
              {currentData.map((person) => {
                const personId = (person as any).id || person._id;
                const menteeCount = person.assignedId?.length || person.menteeCount || 0;
                const isMentor = activeTab === "mentors";
                // return (
                //   <MentorCard
                return (
 <div key={personId} className="w-[300px]  shrink-0">
  <MentorCard
                    variant="glass"
                    // image={person?.profilePicture ? person.profilePicture : Mentor1}
                    image={
  getPersonProfilePicture(person) ||
  getInitialsAvatar(person?.firstName, person?.lastName, activeTab === "mentors" ? "Mentor" : "Pastor")
}
                    name={`${person.firstName} ${person.lastName}`}
                    role={person.role}
                    menteeCount={menteeCount}
                    email={getUserListEmail(person as Record<string, unknown>) ?? person.email}
                    // phoneNumber={person.phoneNumber}
                    phoneNumber=""
                    onViewDetails={() =>
                      isMentor
                        ? router.push(`/director/mentors/profile/${personId}`)
                        : router.push(`/director/mentees/profile/${personId}`)
                    }
                 />
  </div>
                );
              })}
            </div>
          )}
        </div>
      
     
      {/* Explore CCC */}
      <section className="py-8">
        <h2 className="mb-10 text-[22px] font-semibold text-white">Explore CCC</h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {directorExploreCards.map((item) => (
            <div
              key={item.route}
              role="button"
              tabIndex={0}
              onClick={() => router.push(item.route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(item.route);
              }}
              className={`flex min-h-[200px] cursor-pointer flex-col justify-between rounded-xl p-6 text-white transition hover:scale-[1.02] ${directorGlassCard} ${directorGlassCardHover}`}
            >
              <i className={`${item.icon} mb-4 text-2xl text-[#8ec5eb]`} />
              <div>
                <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-white/75">{item.desc}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="flex items-center gap-2 text-sm text-[#8ec5eb] hover:text-[#b8ddf5]">
                  More
                  <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overview + roadmap & assessment progress (matches director / track-progress language) */}
      <section className="py-12 sm:py-8">
        <div className={directorPageContainer}>
          <h2 className="text-lg font-semibold text-white sm:text-xl">Overview</h2>
          <p className="mt-1 text-sm text-white/55">Network headcount and completions at a glance.</p>

          <div className="mb-10 mt-6 grid grid-cols-1 gap-4 sm:mb-12 sm:grid-cols-3 sm:gap-6">
            {overviewLoading ? (
              <div className="col-span-3 flex justify-center py-12">
                <div className={directorSpinner} role="status" aria-label="Loading" />
              </div>
            ) : directorOverview ? (
              <>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10">
                    <i className="fa-solid fa-user-tie text-[#8ec5eb]" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Total mentors</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.totalMentors}
                  </h3>
                </div>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10">
                    <i className="fa-solid fa-users text-[#8ec5eb]" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Total pastors</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.totalPastors}
                  </h3>
                </div>
                <div
                  className={`${directorGlassCard} p-6 sm:p-7`}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10">
                    <i className="fa-solid fa-circle-check text-emerald-300" aria-hidden />
                  </div>
                  <p className="text-sm text-white/60">Pastors completed</p>
                  <h3 className="mt-1 text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                    {directorOverview.completedPastors}
                  </h3>
                </div>
              </>
            ) : (
              <div className="col-span-3 rounded-2xl border border-white/10 bg-white/[0.03] py-10 text-center text-sm text-white/55">
                No overview data available
              </div>
            )}
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white sm:text-xl">Overall progress</h2>
              <p className="mt-1 max-w-xl text-sm text-white/55">
                Roadmap and assessment completion (combined). Open Track Progress for per-person detail.
              </p>
            </div>
            <Link
              href="/director/track-progress"
              className="shrink-0 text-sm font-semibold text-[#8ec5eb] transition hover:text-[#b8ddf5]"
            >
              View track progress
              <i className="fa-solid fa-arrow-up-right-from-square ml-1.5 text-xs opacity-80" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            <div className={`${directorGlassCard} p-5 sm:p-8`}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">Roadmap &amp; assessments</h3>
                  <p className="mt-1 text-xs text-white/50">Network-wide combined completion</p>
                </div>
                <div className="flex flex-wrap gap-3 text-xs sm:text-sm">
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#8ec5eb]" />
                    Done
                  </span>
                  <span className="inline-flex items-center gap-2 text-white/70">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#f9c74f]" />
                    Remaining
                  </span>
                </div>
              </div>

              <div className="flex min-h-[240px] flex-col items-center justify-center gap-6 py-2 sm:min-h-[280px]">
                {overviewLoading ? (
                  <div className={directorSpinner} role="status" aria-label="Loading" />
                ) : donutChartData ? (
                  <>
                    <div className="relative h-[200px] w-[200px] sm:h-[220px] sm:w-[220px]">
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `conic-gradient(
                            #8ec5eb 0deg ${donutChartData.completedDegrees}deg,
                            #f9c74f ${donutChartData.completedDegrees}deg 360deg
                          )`,
                        }}
                      />
                      <div className="absolute left-1/2 top-1/2 h-[60%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#041f35] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-3xl font-bold tabular-nums text-[#8ec5eb] sm:text-4xl">
                          {donutChartData.completed.toFixed(1)}%
                        </span>
                        <span className="mt-0.5 text-xs text-white/50">complete</span>
                      </div>
                    </div>
                    <div className="flex w-full max-w-sm justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm">
                      <div>
                        <p className="text-white/50">Completed</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-[#8ec5eb]">
                          {donutChartData.completed.toFixed(1)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/50">Remaining</p>
                        <p className="mt-0.5 font-semibold tabular-nums text-[#f9c74f]">
                          {donutChartData.remaining.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-white/50">No progress data available</p>
                )}
              </div>
            </div>

            <div className={`${directorGlassCard} p-5 sm:p-8`}>
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-white sm:text-lg">Monthly completions</h3>
                  <p className="mt-1 text-xs text-white/50">
                    {chartRangeId.startsWith("n")
                      ? "Upcoming months on the calendar; bars fill as completions are recorded through the program."
                      : `Pastors and mentors — last ${chartMonthCountFromRange(chartRangeId)} months, rolling with today’s date.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#8ec5eb]" />
                    <span className="text-white/70">Pastor</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#5ee0d0]" />
                    <span className="text-white/70">Mentor</span>
                  </div>
                  <select
                    value={chartRangeId}
                    onChange={(e) => setChartRangeId(e.target.value as ChartRangeId)}
                    className={`${directorInputClass} !py-2 !text-sm cursor-pointer`}
                    aria-label="Time range for monthly completions chart"
                    title="Last months show historical data; next months are the forward calendar view."
                  >
                    <option className="bg-[#0a3558]" value="p3">
                      Last 3 months
                    </option>
                    <option className="bg-[#0a3558]" value="p6">
                      Last 6 months
                    </option>
                    <option className="bg-[#0a3558]" value="p12">
                      Last 12 months
                    </option>
                    <option className="bg-[#0a3558]" value="n3">
                      Next 3 months
                    </option>
                    <option className="bg-[#0a3558]" value="n6">
                      Next 6 months
                    </option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#041f35]/50 p-3 sm:p-4">
                <div className="flex h-[200px] items-end justify-between gap-1.5 sm:h-[240px] sm:gap-3">
                  {overviewLoading ? (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className={directorSpinner} role="status" aria-label="Loading chart" />
                    </div>
                  ) : chartData.length > 0 ? (
                    chartData.map((data) => {
                      const maxValue = Math.max(
                        ...chartData.map((d) => Math.max(d.pastor, d.mentor)),
                        1,
                      );
                      const pastorHeight = maxValue > 0 ? (data.pastor / maxValue) * 100 : 0;
                      const mentorHeight = maxValue > 0 ? (data.mentor / maxValue) * 100 : 0;
                      const pastorH =
                        data.pastor > 0 ? `${Math.max(pastorHeight, 1)}%` : "0%";
                      const mentorH =
                        data.mentor > 0 ? `${Math.max(mentorHeight, 1)}%` : "0%";
                      return (
                        <div
                          key={`${data.year}-${data.month}`}
                          className="flex min-w-0 flex-1 flex-col items-center gap-2"
                        >
                          <div className="flex h-[160px] w-full max-w-[48px] items-end justify-center gap-0.5 self-center sm:h-[200px] sm:max-w-none sm:gap-1">
                            <div
                              className="w-[46%] max-w-[22px] rounded-t-md bg-gradient-to-t from-[#6eb6e0] to-[#8ec5eb] shadow-sm sm:max-w-[28px]"
                              style={{ height: pastorH, minHeight: data.pastor > 0 ? undefined : 0 }}
                              title={`Pastors: ${data.pastor}`}
                            />
                            <div
                              className="w-[46%] max-w-[22px] rounded-t-md bg-gradient-to-t from-[#3ec9b8] to-[#5ee0d0] shadow-sm sm:max-w-[28px]"
                              style={{ height: mentorH, minHeight: data.mentor > 0 ? undefined : 0 }}
                              title={`Mentors: ${data.mentor}`}
                            />
                          </div>
                          <span className="max-w-full truncate text-center text-[10px] text-white/55 sm:text-xs">
                            {data.monthName}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-white/50">
                      No chart data for this period
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Completed & Invite */}
      <section className="py-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
          <button
            type="button"
            onClick={() => router.push("/director/course-completed")}
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${directorGlassCard} ${directorGlassCardHover}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <i className="fa-solid fa-award text-2xl text-[#8ec5eb]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold sm:text-xl">Course Completed</h3>
                <div className="mt-1 flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-sm font-bold text-[#0f4a76]">
                  {completedPastorsCount == null ? "—" : completedPastorsCount}
                </div>
              </div>
            </div>
            <span className="self-end text-[#8ec5eb] hover:opacity-80 sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => router.push("/director/course-completed")}
            className={`flex w-full flex-col items-start justify-between gap-4 rounded-xl p-6 text-left text-white sm:flex-row sm:items-center sm:p-8 ${directorGlassCard} ${directorGlassCardHover}`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10">
                <i className="fa-solid fa-user-plus text-2xl text-[#8ec5eb]" />
              </div>
              <h3 className="text-lg font-semibold sm:text-xl">Invite to be a Field Mentor</h3>
            </div>
            <span className="self-end text-[#8ec5eb] hover:opacity-80 sm:self-auto">
              <i className="fa-solid fa-arrow-up-right-from-square text-xl" />
            </span>
          </button>
        </div>
      </section>

      {/* Map */}
      <section className="py-16">
       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
  <div className="flex flex-wrap items-center gap-3">
    <h2 className="text-[22px] font-semibold text-white">Network map</h2>

    <button
      type="button"
      onClick={() => void loadNetworkMap(true)}
      disabled={networkMapLoading || networkMapRefreshing}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
      title="Refresh map"
    >
      <i className={`fa-solid fa-rotate ${networkMapRefreshing ? "animate-spin" : ""}`} />
    </button>
  </div>

  <div className="flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
    <div className="flex flex-wrap items-center gap-4 text-xs text-white/55">
      <button
        type="button"
        onClick={() => setMapRoleFilter((prev) => (prev === "pastor" ? "all" : "pastor"))}
        className={`inline-flex items-center gap-2 transition ${
          mapRoleFilter === "pastor" ? "text-white" : "text-white/55 hover:text-white/80"
        }`}
      >
        <span
  className={`h-3 w-3 rounded-full ring-2 ring-[#8ec5eb]/90 ${
    mapRoleFilter === "pastor" ? "bg-[#8ec5eb]" : "bg-transparent"
  }`}
/>
        Pastor
      </button>

      <button
        type="button"
        onClick={() => setMapRoleFilter((prev) => (prev === "mentor" ? "all" : "mentor"))}
        className={`inline-flex items-center gap-2 transition ${
          mapRoleFilter === "mentor" ? "text-white" : "text-white/55 hover:text-white/80"
        }`}
      >
        <span
  className={`h-3 w-3 rounded-full ring-2 ring-[#ef4444]/90 ${
    mapRoleFilter === "mentor" ? "bg-[#ef4444]" : "bg-transparent"
  }`}
/>
        Mentor
      </button>

      <button
        type="button"
        onClick={() =>
          setMapRoleFilter((prev) => (prev === "field-mentor" ? "all" : "field-mentor"))
        }
        className={`inline-flex items-center gap-2 transition ${
          mapRoleFilter === "field-mentor" ? "text-white" : "text-white/55 hover:text-white/80"
        }`}
      >
        <span
  className={`h-3 w-3 rounded-full ring-2 ring-[#f59e0b]/90 ${
    mapRoleFilter === "field-mentor" ? "bg-[#f59e0b]" : "bg-transparent"
  }`}
/>
        Field Mentor
      </button>
    </div>

    <input
      type="search"
      value={mapSearch}
      onChange={(e) => setMapSearch(e.target.value)}
      placeholder="Filter by name..."
      className="w-full rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-[#8ec5eb]/40 sm:max-w-xs"
      aria-label="Filter people on the network map"
    />
  </div>
</div>
        {networkMapLoading ? (
          <div
            className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-white/10 bg-[#041f35]/50 md:h-[480px]"
            role="status"
            aria-live="polite"
          >
            <div className={directorSpinner} aria-label="Loading map" />
          </div>
        ) : (
          <div className="relative">
            {networkMapRefreshing ? (
              <div
                className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-2 rounded-lg border border-white/15 bg-[#062946]/85 px-2.5 py-1.5 text-xs text-white/90 shadow-lg backdrop-blur-sm"
                role="status"
                aria-live="polite"
              >
                <div className={`${directorSpinner} !h-4 !w-4`} aria-hidden />
                Updating…
              </div>
            ) : null}
            <MapCard
              iframeSrc={BAY_AREA_MAP_EMBED}
              height="h-[420px] md:h-[480px]"
              markers={networkMapMarkers}
            />
          </div>
        )}
        {/* <p className="mt-3 text-center text-xs text-white/50">
          Live data: refetches when you return to this tab, every 5 minutes, and when you press refresh.
          Showing up to {MAX_NETWORK_MAP_MARKERS} people. For GPS-accurate pins, add coordinates in your
          API.
        </p> */}
        {/* <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-white/55">
          <span>
            <span className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-[#8ec5eb]/90" /> Mentor
          </span>
          <span>
            <span className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-[#5ee0d0]/90" /> Pastor
          </span>
        </div> */}
      </section>
           {showQuickAssignModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b18]/75 px-4 backdrop-blur-md">
    {/* <div className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}> */}
    <div
  className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}
  onWheel={(e) => e.stopPropagation()}
>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {selectedQuickPastorId ? "Assign Mentor" : "Select Pastor"}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {selectedQuickPastorId
              ? `Choose a mentor to assign to ${selectedQuickPastorName}.`
              : "Select a pastor first, then assign a mentor."}
          </p>
        </div>

       <div className="flex items-center gap-3">
  {selectedQuickPastorId && (
    <button
      type="button"
      onClick={() => {
        setSelectedQuickPastorId("");
        setSelectedQuickMentorId("");
      }}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
      aria-label="Back to pastors"
    >
      <i className="fa-solid fa-arrow-left" />
    </button>
  )}

  <button
    type="button"
    onClick={() => {
      setShowQuickAssignModal(false);
      setSelectedQuickPastorId("");
      setSelectedQuickMentorId("");
    }}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
    aria-label="Close"
  >
    <i className="fa-solid fa-xmark" />
  </button>
</div>
      </div>

      {quickAssignLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto bg-[#07172a]/30 p-6">
          {!selectedQuickPastorId ? (
            <>
              {/* <h4 className="mb-4 text-sm font-semibold text-[#8ec5eb]">
                Pastors
              </h4> */}
<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h4 className="text-sm font-semibold text-[#8ec5eb]">
    Pastors
  </h4>

  <div className="relative w-full sm:w-[260px]">
    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />

    <input
      type="text"
      value={quickAssignPastorSearch}
      onChange={(e) => setQuickAssignPastorSearch(e.target.value)}
      placeholder="Search pastor"
      className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
    />
  </div>
</div>
              {filteredQuickAssignPastors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No pastors found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredQuickAssignPastors.map((pastor) => {
                    const pastorId = String(pastor._id ?? pastor.id ?? "");
                    const pastorName =
                      `${pastor.firstName ?? ""} ${pastor.lastName ?? ""}`.trim() ||
                      pastor.email ||
                      "Unnamed pastor";

                    return (
                      <button
                        key={pastorId}
                        type="button"
                        onClick={() => {
                          setSelectedQuickPastorId(pastorId);
                          setSelectedQuickMentorId("");
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                      >
                        {/* <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-solid fa-user" />
                        </span> */}
                        <QuickLinkAvatar person={pastor} icon="fa-solid fa-user" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {pastorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {pastor.email ?? "Pastor"}
                          </span>
                        </span>

                        <span className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-1.5 text-xs font-semibold text-white">
                          Assign mentor
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                    Selected Pastor
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {selectedQuickPastorName}
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedQuickPastorId("");
                    setSelectedQuickMentorId("");
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Change Pastor
                </button>
              </div> */}

              {/* <h4 className="mb-4 text-sm font-semibold text-[#8ec5eb]">
                Select Mentor
              </h4> */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h4 className="text-sm font-semibold text-[#8ec5eb]">
    Select Mentor
  </h4>

  <div className="relative w-full sm:w-[260px]">
    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />

    <input
      type="text"
    value={quickAssignMentorSearch}
onChange={(e) => setQuickAssignMentorSearch(e.target.value)}
      placeholder="Search mentor"
      className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
    />
  </div>
</div>
         

              {/* {quickAssignMentors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No mentors found.
                </p>
              ) : ( */}
           {filteredQuickAssignMentors.length === 0 ? (
  <p className="...">
    No mentors found.
  </p>
) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                 {filteredQuickAssignMentors.map((mentor) => {
                    const mentorId = String(mentor._id ?? mentor.id ?? "");
                    const mentorName =
                      `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() ||
                      mentor.email ||
                      "Unnamed mentor";

                    const selected = selectedQuickMentorId === mentorId;

                    return (
                      <button
                        key={mentorId}
                        type="button"
       onClick={() => setSelectedQuickMentorId(mentorId)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                          selected
                            ? "border-[#8ec5eb]/70 bg-[#8ec5eb]/20"
                            : "border-white/10 bg-[#132a42]/80 hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                        }`}
                      >
                        {/* <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-solid fa-user-tie" />
                        </span> */}
                        <QuickLinkAvatar person={mentor} icon="fa-solid fa-user-tie" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {mentorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {mentor.email ?? "Mentor"}
                          </span>
                        </span>

                        {selected && (
                          <i className="fa-solid fa-circle-check text-[#8ec5eb]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-white/10 bg-white/[0.03] px-6 py-4">
        <button
          type="button"
          onClick={() => {
            setShowQuickAssignModal(false);
            setSelectedQuickPastorId("");
            setSelectedQuickMentorId("");
          }}
          className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
        >
          Cancel
        </button>

        {selectedQuickPastorId && (
          <button
            type="button"
            onClick={handleQuickAssignMentor}
            disabled={quickAssignSaving || !selectedQuickMentorId}
            className="rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {quickAssignSaving ? "Assigning..." : "Assign Mentor"}
          </button>
        )}
      </div>
    </div>
  </div>
)}
      {/* {quickAssignToast && (
  <div className="fixed left-1/2 top-24 z-[120] -translate-x-1/2 px-4">
    <div className={`${directorGlassCard} flex items-center gap-3 px-5 py-3 text-sm font-semibold text-white shadow-2xl`}>
      <i
        className={`fa-solid ${
          quickAssignToast.toLowerCase().includes("failed") ||
          quickAssignToast.toLowerCase().includes("please")
            ? "fa-circle-exclamation text-amber-300"
            : "fa-circle-check text-emerald-300"
        }`}
      />
      <span>{quickAssignToast}</span>
    </div>
  </div>
)} */}
{quickAssignToast && (
  <div
    className={`fixed bottom-6 right-6 z-[120] flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-2xl ${
      quickAssignToast.type === "success"
        ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
        : "border-red-400/30 bg-red-500/15 text-red-100"
    }`}
  >
    <i
      className={`fa-solid ${
        quickAssignToast.type === "success"
          ? "fa-circle-check text-emerald-300"
          : "fa-circle-exclamation text-red-300"
      }`}
    />
    <span>{quickAssignToast.message}</span>
  </div>
)}

{showPastorRoadmapModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b18]/75 px-4 backdrop-blur-md">
  <div className={`${directorGlassCard} w-full max-w-3xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Pastors Roadmap</h3>
          <p className="mt-1 text-sm text-white/60">
            Select a pastor to view assigned roadmaps.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPastorRoadmapModal(false)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {roadmapPastorsLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#8ec5eb]/40 scrollbar-track-white/5">
  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <h4 className="text-sm font-semibold text-[#8ec5eb]">
      Pastors
    </h4>

    <div className="relative w-full sm:w-[260px]">
      <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />

      <input
        type="text"
        value={roadmapPastorSearch}
        onChange={(e) => setRoadmapPastorSearch(e.target.value)}
        placeholder="Search pastor"
        className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
      />
    </div>
  </div>

  {filteredRoadmapPastors.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
              No pastors found.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredRoadmapPastors.map((pastor) => {
                const pastorId = String(pastor._id ?? pastor.id ?? "");
                const pastorName =
                  `${pastor.firstName ?? ""} ${pastor.lastName ?? ""}`.trim() ||
                  pastor.email ||
                  "Unnamed pastor";

                return (
                  <button
                    key={pastorId}
                    type="button"
                    onClick={() => {
                      if (!pastorId) return;

                      setShowPastorRoadmapModal(false);
                      // router.push(
                      //   `/director/pastor-assignments?assignUser=${encodeURIComponent(
                      //     pastorId
                      //   )}`
                      // );
                      router.push(
  `/director/revitalization-roadmap?tab=pastor&pastorId=${encodeURIComponent(
    pastorId
  )}&returnTo=${encodeURIComponent("/director/home")}`
);
                    }}
                   className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                  >
                    {/* <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                      <i className="fa-solid fa-user" />
                    </span> */}
                    <QuickLinkAvatar person={pastor} icon="fa-solid fa-user" />

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">
                        {pastorName}
                      </span>
                      <span className="block truncate text-xs text-white/55">
                        {pastor.email ?? "Pastor"}
                      </span>
                    </span>

                    <i className="fa-solid fa-arrow-right ml-auto text-xs text-[#8ec5eb]" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
{showMonthlyAppointmentsModal && (
  // <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b18]/70 px-4 backdrop-blur-md">
  <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#020b18]/70 px-4 backdrop-blur-md">
  {/* <div className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}> */}
  <div
  className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}
  onWheel={(e) => e.stopPropagation()}
>
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Monthly Appointments
          </h3>
          <p className="mt-1 text-sm text-white/60">
            View this month&apos;s appointments and filter by date.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowMonthlyAppointmentsModal(false)}
         className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="border-b border-white/10 px-6 py-4">
        <label className="block text-sm font-semibold text-white">
          Search by date
        </label>

        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            type="date"
            value={monthlyAppointmentDate}
            onChange={(e) => setMonthlyAppointmentDate(e.target.value)}
           className="w-full rounded-xl border border-white/15 bg-[#17334d]/80 px-4 py-2.5 text-sm text-white outline-none [color-scheme:dark] placeholder:text-white/45 focus:border-[#8ec5eb]/60 sm:max-w-xs"
          />

          {monthlyAppointmentDate && (
            <button
              type="button"
              onClick={() => setMonthlyAppointmentDate("")}
              className="rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              Clear date
            </button>
          )}
        </div>
      </div>

      {monthlyAppointmentsLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto bg-[#07172a]/30 p-6">
          {filteredMonthlyAppointments.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
              No appointments found for this month or selected date.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredMonthlyAppointments.map((appointment) => {
                const appointmentId = appointmentEntityId(appointment);

                const mentor =
                  appointment.mentor ??
                  (typeof (appointment as any).mentorId === "object"
                    ? (appointment as any).mentorId
                    : undefined);

                const attendee =
                  appointment.user ??
                  (typeof (appointment as any).userId === "object"
                    ? (appointment as any).userId
                    : undefined);

                const mentorName =
                  `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim() ||
                  mentor?.email ||
                  "Mentor";

                const attendeeName =
                  `${attendee?.firstName ?? ""} ${attendee?.lastName ?? ""}`.trim() ||
                  attendee?.email ||
                  "Participant";

                const meetingDate = new Date(appointment.meetingDate);

                const dateText = meetingDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const timeText = meetingDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });

                return (
                  <div
                    key={appointmentId || appointment.id}
                    className="rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* <div className="min-w-0"> */}
                      <div className="flex min-w-0 items-start gap-3">
  <QuickLinkAvatar
    person={
      (appointment as any).user ||
      (typeof (appointment as any).userId === "object"
        ? (appointment as any).userId
        : null) ||
      (appointment as any).participant
    }
  />

  <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-white">
                          {attendeeName}
                        </h4>

                        <p className="mt-1 text-xs text-white/60">
                          Mentor:{" "}
                          <span className="text-[#cde2f2]">{mentorName}</span>
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                          <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/80">
                            <i className="fa-regular fa-calendar mr-1 text-[#8ec5eb]" />
                            {dateText}
                          </span>

                          <span className="rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-white/80">
                            <i className="fa-regular fa-clock mr-1 text-[#8ec5eb]" />
                            {timeText}
                          </span>

                        </div>
                      </div>
</div>
                      <button
                        type="button"
                        disabled={!appointmentId}
                        onClick={() => {
                          if (!appointmentId) return;
                          setShowMonthlyAppointmentsModal(false);
                          // router.push(
                          //   `/director/schedule/${encodeURIComponent(appointmentId)}`
                          // );
                          router.push(
  `/director/schedule/${encodeURIComponent(
    appointmentId
  )}?returnTo=${encodeURIComponent("/director/home")}`
);
                        }}
                        className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  </div>
)}
{showMentorMenteeModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b18]/75 px-4 backdrop-blur-md">
    {/* <div className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}> */}
    <div
  className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}
  onWheel={(e) => e.stopPropagation()}
>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {/* {selectedMappingMentorId ? "Assigned Mentees" : "Mentor-Mentee Mapping"} */}
            {selectedMappingMentorId
  ? `${selectedMappingMentorName || "This mentor"}'s Assigned Mentees`
  : "Mentor-Mentee Mapping"}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {selectedMappingMentorId
              ? "View mentees assigned to the selected mentor."
              : "Select a mentor to view assigned mentees."}
          </p>
        </div>

     <div className="flex items-center gap-3">
  {selectedMappingMentorId && (
    <button
      type="button"
      onClick={() => {
        setSelectedMappingMentorId("");
        setSelectedMappingMentorName("");
        setMappingMentees([]);
      }}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
      aria-label="Back to mentors"
    >
      <i className="fa-solid fa-arrow-left" />
    </button>
  )}

  <button
    type="button"
    // onClick={() => {
    //   setShowMentorMenteeModal(false);
    //   setSelectedMappingMentorId("");
    //   setMappingMentees([]);
    // }}
    onClick={() => {
  setShowMentorMenteeModal(false);
  setSelectedMappingMentorId("");
  setSelectedMappingMentorName("");
  setMappingMentees([]);
}}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
    aria-label="Close"
  >
    <i className="fa-solid fa-xmark" />
  </button>
</div>
      </div>

      {mappingLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto bg-[#07172a]/30 p-6">
          {!selectedMappingMentorId ? (
            <>
              {/* <h4 className="mb-4 text-sm font-semibold text-[#8ec5eb]">
                Mentors
              </h4> */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h4 className="text-sm font-semibold text-[#8ec5eb]">
    Select Mentor
  </h4>

  <div className="relative w-full sm:w-[260px]">
    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />

  <input
  type="text"
  value={mappingMentorSearch}
  onChange={(e) => setMappingMentorSearch(e.target.value)}
  placeholder="Search mentor"
  className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
/>
  </div>
</div>

              {filteredMappingMentors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No mentors found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredMappingMentors.map((mentor) => {
                    const mentorId = String(mentor._id ?? mentor.id ?? "");
                    const mentorName =
                      `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() ||
                      mentor.email ||
                      "Unnamed mentor";

                    return (
                      <button
                        key={mentorId}
                        type="button"
                        onClick={() => {
                          if (!mentorId) return;
                          void loadMenteesForMentor(mentorId);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                      >
                        {/* <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-solid fa-user-tie" />
                        </span> */}
                        <QuickLinkAvatar person={mentor} icon="fa-solid fa-user-tie" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {mentorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {mentor.email ?? "Mentor"}
                          </span>
                        </span>

                        <span className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-1.5 text-xs font-semibold text-white">
                          View mentees
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {/* <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                    Assigned Mentees
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    Selected mentor
                  </h4> */}
                  {/* <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
  This mentor&apos;s assigned mentees
</p> */}
<h4 className="mt-1 text-base font-semibold text-white">
  {selectedMappingMentorName || "Selected mentor"}
</h4>
                </div>

                {/* <button
                  type="button"
                  onClick={() => {
                    setSelectedMappingMentorId("");
                    setMappingMentees([]);
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Change Mentor
                </button> */}
              </div>

              {mappingMenteesLoading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
                </div>
              ) : mappingMentees.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
                  No mentees assigned to this mentor.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {mappingMentees.map((mentee) => {
                    const menteeId = String(mentee._id ?? mentee.id ?? "");
                    const menteeName =
                      `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
                      mentee.email ||
                      "Unnamed mentee";

                    return (
                      // <div
                      //   key={menteeId}
                      //   className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 shadow-sm"
                      // >
                      <button
  type="button"
  key={menteeId}
  onClick={() => {
    if (!menteeId) return;
    setShowMentorMenteeModal(false);
    router.push(`/director/mentees/profile/${encodeURIComponent(menteeId)}`);
  }}
  className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#173653]/90"
>
                        {/* <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-solid fa-user" />
                        </span> */}
                        <QuickLinkAvatar person={mentee} icon="fa-solid fa-user" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {menteeName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {mentee.email ?? "Mentee"}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  </div>
)}
{showCdpModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020b18]/75 px-4 backdrop-blur-md">
    {/* <div className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}> */}
    <div
  className={`${directorGlassCard} w-full max-w-4xl overflow-hidden border border-white/15 bg-[#10243a]/95 shadow-2xl`}
  onWheel={(e) => e.stopPropagation()}
>
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {selectedCdpPastorId ? "Customized Development Plan" : "Select Pastor"}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {selectedCdpPastorId
              ? `Showing completed assessments with CDP for ${selectedCdpPastorName}.`
              : "Select a pastor to view completed assessments with customized development plans."}
          </p>
        </div>

       <div className="flex items-center gap-3">
  {selectedCdpPastorId && (
    <button
      type="button"
      onClick={() => {
        setSelectedCdpPastorId("");
        setSelectedCdpPastorName("");
        setCdpAssessments([]);
      }}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
      aria-label="Back to pastors"
    >
      <i className="fa-solid fa-arrow-left" />
    </button>
  )}

  <button
    type="button"
    onClick={() => {
      setShowCdpModal(false);
      setSelectedCdpPastorId("");
      setSelectedCdpPastorName("");
      setCdpAssessments([]);
    }}
    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
    aria-label="Close"
  >
    <i className="fa-solid fa-xmark" />
  </button>
</div>
      </div>

      {cdpPastorsLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto bg-[#07172a]/30 p-6">
          {!selectedCdpPastorId ? (
            <>
              {/* <h4 className="mb-4 text-sm font-semibold text-[#8ec5eb]">
                Pastors
              </h4> */}
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <h4 className="text-sm font-semibold text-[#8ec5eb]">
    Pastors
  </h4>

  <div className="relative w-full sm:w-[260px]">
    <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />

    <input
      type="text"
      value={cdpPastorSearch}
      onChange={(e) => setCdpPastorSearch(e.target.value)}
      placeholder="Search pastor"
      className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
    />
  </div>
</div>

              {filteredCdpPastors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No pastors found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredCdpPastors.map((pastor) => {
                    const pastorId = String(pastor._id ?? pastor.id ?? "");
                    const pastorName =
                      `${pastor.firstName ?? ""} ${pastor.lastName ?? ""}`.trim() ||
                      pastor.email ||
                      "Unnamed pastor";

                    return (
                      <button
                        key={pastorId}
                        type="button"
                        onClick={() => void loadCdpAssessmentsForPastor(pastor)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                      >
                        {/* <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                          <i className="fa-solid fa-user" />
                        </span> */}
                        <QuickLinkAvatar person={pastor} icon="fa-solid fa-user" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {pastorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {pastor.email ?? "Pastor"}
                          </span>
                        </span>

                        <span className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-1.5 text-xs font-semibold text-white">
                          View CDP
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                    Selected Pastor
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {selectedCdpPastorName}
                  </h4>
                </div>

                {/* <button
                  type="button"
                  onClick={() => {
                    setSelectedCdpPastorId("");
                    setSelectedCdpPastorName("");
                    setCdpAssessments([]);
                  }}
                  className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Change Pastor
                </button> */}
              </div>

              {cdpAssessmentsLoading ? (
                <div className="flex min-h-[220px] items-center justify-center">
                  <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
                </div>
              ) : cdpAssessments.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/60">
                  No completed assessments with customized development plan found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {cdpAssessments.map((assessment) => (
                    <button
                      key={assessment.id}
                      type="button"
                      onClick={() => {
                        setShowCdpModal(false);
                        router.push(
                          `/director/assessments/result?assessmentId=${encodeURIComponent(
                            assessment.id
                          )}&userId=${encodeURIComponent(selectedCdpPastorId)}`
                        );
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                    >
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8ec5eb]/20 text-[#8ec5eb]">
                        <i className="fa-solid fa-clipboard-check" />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {assessment.title}
                        </span>
                        <span className="block truncate text-xs text-white/55">
                          Completed assessment with CDP
                        </span>
                      </span>

                      <i className="fa-solid fa-arrow-right text-xs text-[#8ec5eb]" />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  </div>
)}
{showAssignMenteeModal && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
    onClick={() => {
      setShowAssignMenteeModal(false);
      setSelectedAssignMentorId("");
      setSelectedAssignPastorId("");
    }}
  >
    <div
      className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/15 bg-[#07172a] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-6 py-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {selectedAssignMentorId ? "Assign Mentee" : "Select Mentor"}
          </h3>
          <p className="mt-1 text-sm text-white/60">
            {selectedAssignMentorId
              ? `Choose a mentee to assign to ${selectedAssignMentorName}.`
              : "Select a mentor first, then assign a mentee."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedAssignMentorId && (
            <button
              type="button"
              onClick={() => {
                setSelectedAssignMentorId("");
                setSelectedAssignPastorId("");
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
              aria-label="Back to mentors"
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowAssignMenteeModal(false);
              setSelectedAssignMentorId("");
              setSelectedAssignPastorId("");
            }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      {assignMenteeLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
        </div>
      ) : (
        <div className="max-h-[65vh] overflow-y-auto bg-[#07172a]/30 p-6">
          {!selectedAssignMentorId ? (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="text-sm font-semibold text-[#8ec5eb]">
                  Mentors
                </h4>

                <div className="relative w-full sm:w-[260px]">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />
                  <input
                    type="text"
                    value={assignMenteeMentorSearch}
                    onChange={(e) => setAssignMenteeMentorSearch(e.target.value)}
                    placeholder="Search mentor"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
                  />
                </div>
              </div>

              {filteredAssignMenteeMentors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No mentors found.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAssignMenteeMentors.map((mentor) => {
                    const mentorId = String(mentor._id ?? mentor.id ?? "");
                    const mentorName =
                      `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() ||
                      mentor.email ||
                      "Unnamed mentor";

                    return (
                      <button
                        key={mentorId}
                        type="button"
                        onClick={() => {
                          setSelectedAssignMentorId(mentorId);
                          setSelectedAssignPastorId("");
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-[#132a42]/80 px-4 py-4 text-left shadow-sm transition hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                      >
                        <QuickLinkAvatar person={mentor} icon="fa-solid fa-user" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {mentorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {mentor.email ?? "Mentor"}
                          </span>
                        </span>

                        <span className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-1.5 text-xs font-semibold text-white">
                          Assign
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8ec5eb]">
                    Selected Mentor
                  </p>
                  <h4 className="mt-1 text-base font-semibold text-white">
                    {selectedAssignMentorName}
                  </h4>
                </div>

                <div className="relative w-full sm:w-[260px]">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/45" />
                  <input
                    type="text"
                    value={assignMenteePastorSearch}
                    onChange={(e) => setAssignMenteePastorSearch(e.target.value)}
                    placeholder="Search mentee"
                    className="h-10 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm font-medium text-white outline-none transition placeholder:text-white/45 focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
                  />
                </div>
              </div>

              {filteredAssignMenteePastors.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/60">
                  No mentees found.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredAssignMenteePastors.map((pastor) => {
                    const pastorId = String(pastor._id ?? pastor.id ?? "");
                    const pastorName =
                      `${pastor.firstName ?? ""} ${pastor.lastName ?? ""}`.trim() ||
                      pastor.email ||
                      "Unnamed mentee";

                    const isSelected = selectedAssignPastorId === pastorId;

                    return (
                      <button
                        key={pastorId}
                        type="button"
                        onClick={() => setSelectedAssignPastorId(pastorId)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left shadow-sm transition ${
                          isSelected
                            ? "border-[#8ec5eb]/70 bg-[#8ec5eb]/15"
                            : "border-white/10 bg-[#132a42]/80 hover:border-[#8ec5eb]/45 hover:bg-[#17334d]/80"
                        }`}
                      >
                        <QuickLinkAvatar person={pastor} icon="fa-solid fa-user" />

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-white">
                            {pastorName}
                          </span>
                          <span className="block truncate text-xs text-white/55">
                            {pastor.email ?? "Mentee"}
                          </span>
                        </span>

                        <span className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-1.5 text-xs font-semibold text-white">
                          {isSelected ? "Selected" : "Select"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selectedAssignMentorId && (
        <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-white/[0.03] px-6 py-4">
          <button
            type="button"
            onClick={() => {
              setShowAssignMenteeModal(false);
              setSelectedAssignMentorId("");
              setSelectedAssignPastorId("");
            }}
            className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!selectedAssignPastorId || assignMenteeSaving}
            onClick={handleAssignMentee}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-[#062946] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {assignMenteeSaving ? "Assigning..." : "Assign Mentee"}
          </button>
        </div>
      )}
    </div>
  </div>
)}

{assignMenteeToast && (
  <div className="fixed right-6 top-24 z-[70] w-[320px] rounded-2xl border border-white/15 bg-[#07172a] p-4 shadow-2xl backdrop-blur-xl">
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          assignMenteeToast.type === "success"
            ? "bg-emerald-500/15 text-emerald-300"
            : "bg-red-500/15 text-red-300"
        }`}
      >
        <i
          className={`fa-solid ${
            assignMenteeToast.type === "success"
              ? "fa-check"
              : "fa-triangle-exclamation"
          }`}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          {assignMenteeToast.type === "success" ? "Done" : "Action needed"}
        </p>
        <p className="mt-1 text-sm text-white/65">
          {assignMenteeToast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setAssignMenteeToast(null)}
        className="text-white/45 transition hover:text-white"
        aria-label="Close notification"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  </div>
)}
    </div>
  );
}
