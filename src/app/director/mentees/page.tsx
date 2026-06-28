"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import SearchBar from "@/app/Components/SearchBar";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import PersonListCard from "@/app/Components/PersonListCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import AssignMentorModal, { Mentor } from "@/app/Components/AssignMentorModal";
import RemoveMentorModal from "@/app/Components/RemoveMentorModal";

import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";

import {
  apiAssignUsers,
  apiGetAllUsers,
  apiGetAssignedUsers,
  apiGetUserById,
  apiRemoveAssignedUsers,
  unwrapUserResponse,
} from "@/app/Services/users.service";
import {
  apiGetOverallProgress,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
} from "@/app/Services/progress.service";
import { resolveApiMediaUrl } from "@/app/utils/image";
import { formatUserLastLoginDisplay } from "@/app/utils/last-login-display";

export interface Mentee {
  id: string;
  name: string;
  role?: string;
  description: string;
  img: any;
  status: "active" | "completed" | "pending";
  progress?: number;
  phase?: string;
  assignedId: string[];
  assignedLoaded: boolean;
  createdAt?: string;
  country?: string;
  email?: string;
  phoneNumber?: string;
}

type MenteeSortKey =
  | { kind: "latest" }
  | { kind: "name_az" | "name_za" | "progress_low" | "progress_high" };

function sortByCreatedDesc(a?: string, b?: string) {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return tb - ta;
}

function labelForSortKey(k: MenteeSortKey): string {
  switch (k.kind) {
    case "latest":
      return "Latest Join";
    case "name_az":
      return "Name A–Z";
    case "name_za":
      return "Name Z–A";
    case "progress_low":
      return "Progress Low–High";
    case "progress_high":
      return "Progress High–Low";
    default:
      return "Latest Join";
  }
}

function normalizeQueryValue(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s\-_–—]+/g, "");
}

function parseSortKeyFromQuery(value: string | null): MenteeSortKey {
  switch (normalizeQueryValue(value)) {
    case "nameaz":
      return { kind: "name_az" };
    case "nameza":
      return { kind: "name_za" };
    case "progresslowhigh":
      return { kind: "progress_low" };
    case "progresshighlow":
      return { kind: "progress_high" };
    case "latestjoin":
    default:
      return { kind: "latest" };
  }
}

function parseActiveTabFromQuery(value: string | null): "all" | "active" | "completed" {
  switch (normalizeQueryValue(value)) {
    case "inprogress":
    case "active":
      return "active";
    case "completed":
      return "completed";
    case "all":
    default:
      return "all";
  }
}

function parseViewModeFromQuery(value: string | null): "grid" | "list" {
  return normalizeQueryValue(value) === "list" ? "list" : "grid";
}

function parsePageFromQuery(value: string | null): number {
  const raw = Number.parseInt(String(value ?? "").trim(), 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

function sortKeyToQueryValue(key: MenteeSortKey): string {
  switch (key.kind) {
    case "name_az":
      return "Name A-Z";
    case "name_za":
      return "Name Z-A";
    case "progress_low":
      return "Progress Low-High";
    case "progress_high":
      return "Progress High-Low";
    case "latest":
    default:
      return "Latest Join";
  }
}

function activeTabToQueryValue(tab: "all" | "active" | "completed"): string {
  switch (tab) {
    case "active":
      return "In-Progress";
    case "completed":
      return "Completed";
    case "all":
    default:
      return "All";
  }
}


const getInitialsAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=173653&color=ffffff`;

const PAGE_SIZE = 10;
const FEATURED_THUMB_LIMIT = 500;
const FULL_LIST_LIMIT = 9999;

function getUserListEmail(person: {
  email?: string;
  contact?: unknown;
  user?: unknown;
}): string | undefined {
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

function getUserListPhone(user: any): string | undefined {
  const direct = user?.phoneNumber ?? user?.phone;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const c = user?.contact;
  if (c && typeof c === "object" && !Array.isArray(c)) {
    const p = (c as Record<string, unknown>).phone;
    if (typeof p === "string" && p.trim()) return p.trim();
  }
  const u = user?.user;
  if (u && typeof u === "object" && !Array.isArray(u)) {
    const p =
      (u as Record<string, unknown>).phoneNumber ??
      (u as Record<string, unknown>).phone;
    if (typeof p === "string" && p.trim()) return p.trim();
  }
  return undefined;
}


function profileImageForUser(user: any) {
  const raw = user.profilePicture;
  if (typeof raw === "string" && raw.trim()) {
    return resolveApiMediaUrl(raw) ?? raw;
  }

  return getInitialsAvatar(
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
  );
}

function buildMenteeListParams(
  activeTab: "all" | "active" | "completed",
  search: string | undefined,
  page: number,
  limit: number,
) {
  const params: Record<string, unknown> = {
    role: "pastor",
    roleMatch: "mixed",
    search,
    page,
    limit,
    status: "accepted",
  };
  if (activeTab === "active") {
    params.hasCompleted = false;
    // params.status = "accepted";
  } else if (activeTab === "completed") {
    params.hasCompleted = true;
  }
  return params;
}

const mapUserToMentee = (user: any, index: number): Mentee => ({
  id: user.id ?? user._id,
  name: `${user.firstName} ${user.lastName}`,
  role: user.role,
  description: `${user.role} enrolled in mentoring program`,
  // img: profileImageForUser(user, index),
  img: profileImageForUser(user),
  status: user.hasCompleted
    ? "completed"
    : user.status === "pending"
      ? "pending"
      : "active",
  progress:
    typeof user.progressPercentage === "number" && Number.isFinite(user.progressPercentage)
      ? user.progressPercentage
      : undefined,
  phase: user.currentPhase ?? undefined,
  assignedId: [],
  assignedLoaded: false,
  createdAt: typeof user.createdAt === "string" ? user.createdAt : undefined,
  country:
    user.interest?.churchDetails?.[0]?.country?.trim() ||
    user.interest?.country?.trim() ||
    "",
  email: getUserListEmail(user) ?? undefined,
  phoneNumber: getUserListPhone(user),
});

export default function MenteesPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParamsString = searchParams.toString();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [featuredMentees, setFeaturedMentees] = useState<Mentee[]>([]);
  const [currentPage, setCurrentPage] = useState(() =>
    parsePageFromQuery(searchParams.get("page")),
  );
  const [tabCounts, setTabCounts] = useState({
  active: 0,
  completed: 0,
});
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    () => parseActiveTabFromQuery(searchParams.get("filter")),
  );
  const [sortKey, setSortKey] = useState<MenteeSortKey>(() =>
    parseSortKeyFromQuery(searchParams.get("sortBy")),
  );
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">(() =>
    parseViewModeFromQuery(searchParams.get("view") ?? searchParams.get("viewMode")),
  );
  const [query, setQuery] = useState(() => searchParams.get("search") ?? "");
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get("search") ?? "");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showAssignedMentorsModal, setShowAssignedMentorsModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [assignedMentorList, setAssignedMentorList] = useState<Mentor[]>([]);

  /* ---------------- LOAD ASSIGNED USERS ---------------- */

  const loadAssignedUsers = async (menteeId: string) => {
    const res = await apiGetAssignedUsers(menteeId);

   
    const assignedUsers = res.data.data ?? [];

const assignedIds = assignedUsers.map((u: any) => u.id ?? u._id);

setAssignedMentorList(
  assignedUsers.map((u: any): Mentor => ({
    id: u.id ?? u._id,
    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    role: u.role ?? "Mentor",
    menteeCount: Array.isArray(u.assignedId) ? u.assignedId.length : 0,
    img: profileImageForUser(u),
    loginDate: formatUserLastLoginDisplay(u),
  }))
);

    setMentees((prev) =>
      prev.map((m) =>
        m.id === menteeId
          ? { ...m, assignedId: assignedIds, assignedLoaded: true }
          : m
      )
    );
  };

  /* ---------------- SEARCH DEBOUNCE ---------------- */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const menteesReturnTo = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", sortKeyToQueryValue(sortKey));
    params.set("filter", activeTabToQueryValue(activeTab));
    params.set("page", String(currentPage));
    const trimmedSearch = query.trim();
    if (trimmedSearch) {
      params.set("search", trimmedSearch);
    }
    params.set("view", viewMode);
    return `${pathname}?${params.toString()}`;
  }, [activeTab, currentPage, pathname, query, sortKey, viewMode]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    nextParams.set("sortBy", sortKeyToQueryValue(sortKey));
    nextParams.set("filter", activeTabToQueryValue(activeTab));
    nextParams.set("page", String(currentPage));
    const trimmedSearch = query.trim();
    if (trimmedSearch) {
      nextParams.set("search", trimmedSearch);
    }
    nextParams.set("view", viewMode);

    const nextQuery = nextParams.toString();
    if (nextQuery !== searchParamsString) {
      router.replace(`${pathname}?${nextQuery}`, { scroll: false });
    }
  }, [activeTab, currentPage, pathname, query, router, searchParamsString, sortKey, viewMode]);

  /* ---------------- FETCH MENTEES ---------------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [sortKey.kind]);

  useEffect(() => {
    const fetchMentees = async () => {
      setLoading(true);
      try {
        const search = debouncedQuery.length > 0 ? debouncedQuery : undefined;
        const res = await apiGetAllUsers(
          buildMenteeListParams(activeTab, search, 1, FULL_LIST_LIMIT) as any,
        );
        const users = Array.isArray(res?.data?.data?.users) ? res.data.data.users : [];
        const baseMentees = users.map((u: any, i: number) => mapUserToMentee(u, i));
        let progressRows: any[] = [];
        try {
          const progressRes = await apiGetOverallProgress("pastor");
          progressRows = unwrapOverallProgressList(progressRes) ?? [];
        } catch (progressError) {
          console.warn("Failed to load mentee overall progress", progressError);
        }

        if (progressRows.length) {
          const progressById = new Map<string, { progress: number; completed?: boolean }>();
          for (const row of progressRows) {
            const id = extractUserIdFromOverallProgressRow(row);
            if (!id) continue;
            const rawProgress = Number(row?.overallProgress);
            const progress = Number.isFinite(rawProgress)
              ? Math.min(100, Math.max(0, rawProgress))
              : undefined;
            if (progress === undefined) continue;
            progressById.set(id, {
              progress,
              completed: Boolean(row?.overallCompleted),
            });
          }

          setMentees(
            baseMentees.map((m) => {
              const detail = progressById.get(m.id);
              if (!detail) return m;
              return {
                ...m,
                progress: detail.progress,
                ...(detail.completed ? { status: "completed" as const } : {}),
              };
            }),
          );
          return;
        }

        setMentees(baseMentees);
      } catch (e) {
        console.error("Failed to load mentees", e);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentees();
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    let cancelled = false;

    const fetchTabCounts = async () => {
      try {
        const search = debouncedQuery.length > 0 ? debouncedQuery : undefined;

        const [activeRes, completedRes] = await Promise.all([
          apiGetAllUsers(buildMenteeListParams("active", search, 1, 1) as any),
          apiGetAllUsers(buildMenteeListParams("completed", search, 1, 1) as any),
        ]);

        if (cancelled) return;

        setTabCounts({
          active: Number(activeRes.data?.data?.total ?? 0),
          completed: Number(completedRes.data?.data?.total ?? 0),
        });
      } catch (error) {
        console.error("Failed to load mentee tab counts", error);
        if (!cancelled) {
          setTabCounts({ active: 0, completed: 0 });
        }
      }
    };

    void fetchTabCounts();

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  // First 6 profile thumbnails: page 1 for current search + tab (not paged / client sort)
  useEffect(() => {
    let cancelled = false;
    const loadFeatured = async () => {
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;
        const res = await apiGetAllUsers(
          buildMenteeListParams(activeTab, search, 1, FEATURED_THUMB_LIMIT) as any,
        );
        const { users } = res.data.data;
        if (cancelled) return;
        setFeaturedMentees(
          users.map((u: any, i: number) => mapUserToMentee(u, i)),
        );
      } catch (e) {
        console.error("Failed to load featured mentees", e);
        if (!cancelled) setFeaturedMentees([]);
      }
    };
    void loadFeatured();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, activeTab]);

  /* ---------------- FETCH MENTORS (assign / remove modals) ---------------- */

  const loadMentorsForAssignModal = useCallback(async () => {
    setMentorsLoading(true);
    try {
      const res = await apiGetAllUsers({
        role: "mentor",
        roleMatch: "mixed",
        page: 1,
        limit: 500,
      });
      const rows = res.data.data.users ?? [];

      /** GET /users list often omits `lastLogin`; merge GET /users/:id for each mentor. */
      const CHUNK = 20;
      const enriched: any[] = [];
      for (let i = 0; i < rows.length; i += CHUNK) {
        const part = rows.slice(i, i + CHUNK);
        const batch = await Promise.all(
          part.map(async (u: any) => {
            const id = u.id ?? u._id;
            if (!id) return u;
            try {
              const detailRes = await apiGetUserById(id);
              const full = unwrapUserResponse(detailRes as { data?: unknown });
              if (full && typeof full === "object") {
                const merged = { ...u, ...full } as Record<string, unknown>;
                if (Array.isArray((u as { assignedId?: string[] }).assignedId)) {
                  merged.assignedId =
                    (full as { assignedId?: string[] }).assignedId ??
                    (u as { assignedId?: string[] }).assignedId;
                }
                return merged;
              }
              return u;
            } catch {
              return u;
            }
          }),
        );
        enriched.push(...batch);
      }

      setMentors(
        enriched.map((u: any): Mentor => ({
          id: u.id ?? u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          menteeCount: u.assignedId?.length ?? 0,
          img: profileImageForUser(u),
          loginDate: formatUserLastLoginDisplay(u),
        })),
      );
    } catch (e) {
      console.error("Failed to load mentors", e);
      setMentors([]);
    } finally {
      setMentorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showAssignModal && !showRemoveModal) return;
    void loadMentorsForAssignModal();
  }, [showAssignModal, showRemoveModal, loadMentorsForAssignModal]);

  /* ---------------- ASSIGN ---------------- */

  const handleAssignMentors = async (newMentorIds: string[]) => {
    if (!selectedMentee) return;

    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee) return;

    const merged = Array.from(
      new Set([...mentee.assignedId, ...newMentorIds])
    );

    await apiAssignUsers(selectedMentee, merged);

    setMentees((prev) =>
      prev.map((m) =>
        m.id === selectedMentee
          ? { ...m, assignedId: merged }
          : m
      )
    );

    setShowAssignModal(false);
    setToast("Mentors assigned successfully");
    setTimeout(() => setToast(null), 3000);
  };

  /* ---------------- MARK COMPLETE ---------------- */

  const handleMarkComplete = () => setToast("Marked as complete");

  /* ---------------- REMOVE ---------------- */

 
  const handleRemoveMentors = async (mentorIdsToRemove: string[]) => {
  if (!selectedMentee || mentorIdsToRemove.length === 0) return;

  const mentee = mentees.find((m) => m.id === selectedMentee);
  if (!mentee?.assignedLoaded) return;

  await apiRemoveAssignedUsers(selectedMentee, mentorIdsToRemove);

  const updated = mentee.assignedId.filter(
    (id) => !mentorIdsToRemove.includes(id)
  );

  setMentees((prev) =>
    prev.map((m) =>
      m.id === selectedMentee
        ? { ...m, assignedId: updated }
        : m
    )
  );

  setShowRemoveModal(false);
  setToast("Mentor removed successfully");
  setTimeout(() => setToast(null), 3000);
};

  /* ---------------- DERIVED ---------------- */

  const assignedMentors = useMemo(() => {
    if (!selectedMentee) return [];
    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee?.assignedLoaded) return [];
    return mentors.filter((mentor) =>
      mentee.assignedId.includes(mentor.id)
    );
  }, [selectedMentee, mentees, mentors]);

  const sortedMentees = useMemo(() => {
    const arr = [...mentees];

    if (sortKey.kind === "name_az") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey.kind === "name_za") {
      arr.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortKey.kind === "progress_low") {
      arr.sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
    } else if (sortKey.kind === "progress_high") {
      arr.sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    } else {
      arr.sort((a, b) => sortByCreatedDesc(a.createdAt, b.createdAt));
    }

    return arr;
  }, [mentees, sortKey]);

  const totalCount = sortedMentees.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const pagedMentees = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedMentees.slice(start, start + PAGE_SIZE);
  }, [currentPage, sortedMentees]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      featuredMentees.map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
        href: `/director/mentees/profile/${m.id}`,
      })),
    [featuredMentees],
  );

//   const getMenteeOptions = (menteeId: string) => [
//     {
//       icon: "fa-solid fa-route",
//       label: "Revitalization Roadmap",
//       color: "text-[#8ec5eb]",
//       onClick: () =>
       
//   router.push(
//   `/director/revitalization-roadmap?tab=pastor&pastorId=${encodeURIComponent(
//     menteeId
//   )}&returnTo=${encodeURIComponent("/director/mentees")}`
// )
//     },
//     {
//       icon: "fa-solid fa-clipboard-check",
//       label: "Assessments",
//       color: "text-[#8ec5eb]",
//       onClick: () =>
//         router.push(
//           // `/director/assessments?assignUser=${encodeURIComponent(menteeId)}`
//           `/director/assessments?tab=pastors&pastorId=${encodeURIComponent(menteeId)}`
//         ),
//     },


//     {
//   icon: "fa-solid fa-user-group",
//   label: "Assigned Mentors",
//   color: "text-[#8ec5eb]",
//   onClick: async () => {
//     setSelectedMentee(menteeId);
//     await loadAssignedUsers(menteeId);
//     setShowAssignedMentorsModal(true);
//   },
// },
//     {
//       icon: "fa-solid fa-user-plus",
//       label: "Assign New Mentor",
//       color: "text-[#8ec5eb]",
//       onClick: () => {
//         setSelectedMentee(menteeId);
//         setShowAssignModal(true);
//       },
//     },
//     {
//       icon: "fa-solid fa-user-minus",
//       label: "Remove a Mentor",
//       color: "text-red-400",
//       onClick: async () => {
//         setSelectedMentee(menteeId);
//         await loadAssignedUsers(menteeId);
//         setShowRemoveModal(true);
//       },
//     },
//   ];

const getMenteeOptions = (mentee: Mentee) => {
  const menteeId = mentee.id;
  const isCompleted = mentee.status === "completed" || Number(mentee.progress ?? 0) >= 100;

  return [
    {
      icon: "fa-solid fa-route",
      label: "Revitalization Roadmap",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/revitalization-roadmap?tab=pastor&pastorId=${encodeURIComponent(
            menteeId,
          )}&returnTo=${encodeURIComponent(menteesReturnTo)}`,
        ),
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/assessments?tab=pastors&pastorId=${encodeURIComponent(menteeId)}`,
        ),
    },
    {
      icon: "fa-solid fa-user-group",
      label: "Assigned Mentors",
      color: "text-[#8ec5eb]",
      onClick: async () => {
        setSelectedMentee(menteeId);
        await loadAssignedUsers(menteeId);
        setShowAssignedMentorsModal(true);
      },
    },
    ...(!isCompleted
      ? [
          {
            icon: "fa-solid fa-user-plus",
            label: "Assign New Mentor",
            color: "text-[#8ec5eb]",
            onClick: () => {
              setSelectedMentee(menteeId);
              setShowAssignModal(true);
            },
          },
          {
            icon: "fa-solid fa-user-minus",
            label: "Remove a Mentor",
            color: "text-red-400",
            onClick: async () => {
              setSelectedMentee(menteeId);
              await loadAssignedUsers(menteeId);
              setShowRemoveModal(true);
            },
          },
        ]
      : []),
  ];
};

  // const activeCount = mentees.filter((m) => m.status === "active").length;
  const sortControlClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition sm:text-[14px] ${
      active
        ? "bg-[#e8f1f8] font-semibold text-[#0f4a76]"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentees"
        subtitle="Pastors and leaders in your network."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentees" },
        ]}
      />

      {/* Search + Featured */}
      <section className="relative py-4 md:py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 w-full sm:max-w-[min(420px,100%)]">
              <SearchBar
                value={query}
                onChange={setQuery}
                placeholder="Search by name or email…"
                className="w-full"
                variant="dark"
              />
            </div>
            <div className="flex shrink-0 justify-end gap-2 sm:pl-2">
              <button
                type="button"
                onClick={() => router.push("/director/mentees/location")}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15"
                aria-label="Map view"
              >
                <i className="fa-solid fa-location-dot" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border text-[#8ec5eb] transition hover:bg-white/15 ${
                  viewMode === "grid"
                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/20"
                    : "border-white/15 bg-white/10"
                }`}
                aria-label="Grid view"
              >
                <i className="fa-solid fa-table-cells" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border text-[#8ec5eb] transition hover:bg-white/15 ${
                  viewMode === "list"
                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/20"
                    : "border-white/15 bg-white/10"
                }`}
                aria-label="List view"
              >
                <i className="fa-solid fa-list" />
              </button>
            </div>
          </div>

          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars
              key={`featured-${activeTab}-${debouncedQuery}`}
              items={featuredItems}
              showDivider
              className="mb-2"
            />
          )}
        </div>
      </section>

      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "all"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "active"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              <span>In-Progress</span>
              {/* {activeTab === "active" && activeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
                  {activeCount}
                </span>
              )} */}
              {tabCounts.active > 0 && (
  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
    {tabCounts.active}
  </span>
)}
            </button>
            {/* <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "completed"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              Completed
            </button> */}
            <button
  type="button"
  onClick={() => setActiveTab("completed")}
  className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "completed"
    ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
    : "text-white/65 hover:text-white"
    }`}
>
  <span>Completed</span>
  {tabCounts.completed > 0 && (
    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
      {tabCounts.completed}
    </span>
  )}
</button>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 lg:shrink-0">
            <span className="text-[14px] font-semibold whitespace-nowrap text-white sm:text-[15px]">
              Sort By
            </span>
            <div className="relative w-full sm:w-auto sm:min-w-[240px]">
              <button
                type="button"
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex w-full min-w-[160px] items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:min-w-[220px] sm:text-[14px]"
              >
                <span className="truncate">{labelForSortKey(sortKey)}</span>
                <i className="fa-solid fa-chevron-down text-[10px]" />
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,320px)] rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
                  <div className="mx-2 space-y-1">
                    {(
                      [
                        { kind: "latest" as const, label: "Latest Join" },
                        { kind: "name_az" as const, label: "Name A–Z" },
                        { kind: "name_za" as const, label: "Name Z–A" },
                        { kind: "progress_low" as const, label: "Progress Low–High" },
                        { kind: "progress_high" as const, label: "Progress High–Low" },
                      ] as const
                    ).map(({ kind, label }) => {
                      const active = sortKey.kind === kind;

                      return (
                        <button
                          key={kind}
                          type="button"
                          onClick={() => {
                            setSortKey({ kind });
                            setShowSortMenu(false);
                          }}
                          className={sortControlClass(active)}
                        >
                          <span
                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                              active
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300"
                            }`}
                          >
                            {active ? (
                              <i className="fa-solid fa-check text-[9px] text-white" />
                            ) : null}
                          </span>
                          <span>{label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
            <p className="text-lg font-medium text-white">Loading mentees…</p>
          </div>
        ) : sortedMentees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <i className="fa-solid fa-user-group mb-4 text-5xl text-white/40" />
            <p className="text-lg font-medium text-white">No mentees found</p>
            <p className="mt-2 text-sm text-white/60">
              Try another search or tab.
            </p>
          </div>
        ) : (
        <div
          className={
            viewMode === "list"
              ? "flex flex-col gap-3"
              : "grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5"
          }
        >
          {pagedMentees.map((m) => (
            <PersonListCard
              key={m.id}
              id={m.id}
              name={m.name}
              role={m.role}
              description={m.description}
              image={m.img}
              variant="glass"
              listLayout={viewMode === "list"}
              profileLink={`/director/mentees/profile/${m.id}`}
              email={m.email}
              phoneNumber={m.phoneNumber}
              showProgress={viewMode !== "list"}
              showInlineEmail={viewMode === "list"}
              progress={
                m.progress !== undefined
                  ? { value: m.progress }
                  : undefined
              }
              showPhase={false}
              optionsMenu={getMenteeOptions(m)}
              actionButton={
                activeTab === "active" && m.progress === 100
                  ? { text: "Mark as Complete", onClick: handleMarkComplete }
                  : undefined
              }
            />
          ))}
        </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/70">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-white/60">…</span>
                  ) : (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setCurrentPage(item as number)}
                      className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                        currentPage === item
                          ? "bg-[#8ec5eb]/30 text-white shadow ring-1 ring-[#8ec5eb]/40"
                          : "border border-white/15 bg-white/10 text-[#8ec5eb] hover:bg-white/15"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          </div>
        )}
        </div>
      </section>

      <AssignMentorModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignMentors}
        mentors={mentors}
        loading={mentorsLoading}
      />

      <RemoveMentorModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveMentors}
        mentors={assignedMentors}
        loading={mentorsLoading}
      />
      {showAssignedMentorsModal && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
    <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#062946] p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Assigned Mentors</h3>
        <button
          type="button"
          onClick={() => setShowAssignedMentorsModal(false)}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      {/* {assignedMentors.length === 0 ? (
        <p className="text-white/70">No mentors assigned.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {assignedMentors.map((mentor) => ( */}
          {assignedMentorList.length === 0 ? (
  <p className="text-white/70">No mentors assigned.</p>
) : (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {assignedMentorList.map((mentor) => (
            <button
              key={mentor.id}
              type="button"
              onClick={() =>
                router.push(`/director/mentors/profile/${mentor.id}`)
              }
              className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.06] p-4 text-left hover:bg-white/[0.1]"
            >
              <img
                src={typeof mentor.img === "string" ? mentor.img : ""}
                alt=""
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div>
                <h4 className="font-bold text-white">{mentor.name}</h4>
                <p className="text-sm text-white/60">{mentor.role || "Mentor"}</p>
                <p className="mt-1 text-xs text-[#8ec5eb]">View profile</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  </div>
)}
{toast && (
  <div className="fixed right-6 top-6 z-[100] animate-fade-in">
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#041f35]/95 px-6 py-4 shadow-2xl backdrop-blur-md">
      <i className="fa-solid fa-circle-check text-xl text-emerald-400" />
      <span className="text-[15px] font-semibold text-white">
        {toast}
      </span>
    </div>
  </div>
)}
      {(showSortMenu) && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
}
