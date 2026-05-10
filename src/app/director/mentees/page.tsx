"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  unwrapUserResponse,
} from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import {
  deriveCurrentRoadmapPhaseLabel,
  fetchRoadmapTitlesForIds,
} from "@/app/utils/roadmap-phase-from-progress";
import { deriveOverallProgressPercent } from "@/app/utils/user-progress-display";
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
  | { kind: "phase_self" | "phase_church" | "phase_community" }
  | { kind: "country"; country: string }
  | { kind: "name_az" | "name_za" | "progress" };

function phaseFilterMatches(
  phase: string | undefined,
  sub: "self" | "church" | "community",
): boolean {
  const p = (phase || "").toLowerCase();
  if (sub === "self")
    return p.includes("self") && p.includes("revitalization");
  if (sub === "church")
    return p.includes("church") && p.includes("empowerment");
  return p.includes("community") || p.includes("multiplication");
}

function sortByCreatedDesc(a?: string, b?: string) {
  const ta = a ? new Date(a).getTime() : 0;
  const tb = b ? new Date(b).getTime() : 0;
  return tb - ta;
}

function isPhaseSortKey(k: MenteeSortKey): boolean {
  return (
    k.kind === "phase_self" ||
    k.kind === "phase_church" ||
    k.kind === "phase_community"
  );
}

function labelForSortKey(k: MenteeSortKey): string {
  switch (k.kind) {
    case "latest":
      return "Latest Join";
    case "phase_self":
      return "Self Revitalization";
    case "phase_church":
      return "Church Empowerment";
    case "phase_community":
      return "Community Revitalization and Multiplication";
    case "country":
      return `Country · ${k.country}`;
    case "name_az":
      return "Name A–Z";
    case "name_za":
      return "Name Z–A";
    case "progress":
      return "Progress";
    default:
      return "Latest Join";
  }
}

// const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];
const getInitialsAvatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || "User"
  )}&background=173653&color=ffffff`;

const PAGE_SIZE = 10;
const FEATURED_THUMB_LIMIT = 6;

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

// function profileImageForUser(user: any, index: number) {
//   const raw = user.profilePicture;
//   if (typeof raw === "string" && raw.trim()) {
//     return resolveApiMediaUrl(raw) ?? raw;
//   }
//   return IMAGE_POOL[index % IMAGE_POOL.length];
// }
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
  };
  if (activeTab === "active") {
    params.hasCompleted = false;
    params.status = "accepted";
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
  progress: user.progressPercentage ?? 0,
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
  const router = useRouter();

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [featuredMentees, setFeaturedMentees] = useState<Mentee[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">(
    "active"
  );
  const [sortKey, setSortKey] = useState<MenteeSortKey>({ kind: "latest" });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [phaseSectionOpen, setPhaseSectionOpen] = useState(true);
  const [countrySectionOpen, setCountrySectionOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<string | null>(null);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentorsLoading, setMentorsLoading] = useState(false);

  /* ---------------- LOAD ASSIGNED USERS ---------------- */

  const loadAssignedUsers = async (menteeId: string) => {
    const res = await apiGetAssignedUsers(menteeId);

    const assignedIds = res.data.data.map(
      (u: any) => u.id ?? u._id
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

  /* ---------------- FETCH MENTEES ---------------- */

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, activeTab]);

  useEffect(() => {
    const fetchMentees = async () => {
      setLoading(true);
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;
        const res = await apiGetAllUsers(
          buildMenteeListParams(activeTab, search, currentPage, PAGE_SIZE) as any,
        );
        const { users, total, totalPages: tp } = res.data.data;
        setMentees(users.map((u: any, i: number) => mapUserToMentee(u, i)));
        setTotalCount(total);
        setTotalPages(tp);
      } catch (e) {
        console.error("Failed to load mentees", e);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentees();
  }, [debouncedQuery, currentPage, activeTab]);

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

  /* ---------------- PROGRESS ---------------- */

  // Stable key: changes whenever the set of users on the current page changes
  const menteeIdsKey = mentees.map((m) => m.id).join(",");

  useEffect(() => {
    if (!mentees.length) return;

    let cancelled = false;

    const hydrateProgress = async () => {
      const currentMentees = mentees.slice();
      try {
        const results = await Promise.all(
          currentMentees.map(async (m) => {
            try {
              const res = await apiGetUserProgress(m.id);
              const pr = unwrapProgressData(res) as ProgressResponse | null | undefined;
              return { id: m.id, pr };
            } catch {
              return { id: m.id, pr: null as ProgressResponse | null };
            }
          }),
        );
        if (cancelled) return;

        const roadMapIds: string[] = [];
        for (const r of results) {
          const list = r.pr?.roadmaps;
          if (!list?.length) continue;
          for (const row of list) {
            if (row.roadMapId) roadMapIds.push(String(row.roadMapId));
          }
        }
        const nameById = await fetchRoadmapTitlesForIds(roadMapIds);
        if (cancelled) return;

        const patch = new Map<
          string,
          { progress: number; phase?: string; markCompleted?: boolean }
        >();
        for (const { id, pr } of results) {
          if (!pr) continue;
          const safeProgress = deriveOverallProgressPercent(pr);
          const completed = Boolean(pr.overallCompleted);
          const hasRoadmaps = Array.isArray(pr.roadmaps) && pr.roadmaps.length > 0;
          const phase = hasRoadmaps
            ? deriveCurrentRoadmapPhaseLabel(pr, nameById)
            : "Phase not assigned";
          patch.set(id, {
            progress: safeProgress,
            phase: phase ?? "Phase not assigned",
            ...(completed ? { markCompleted: true as const } : {}),
          });
        }

        setMentees((prev) =>
          prev.map((item) => {
            const u = patch.get(item.id);
            if (!u) return item;
            return {
              ...item,
              progress: u.progress,
              phase: u.phase ?? item.phase,
              ...(u.markCompleted ? { status: "completed" as const } : {}),
            };
          }),
        );
      } catch {
        // keep list without progress
      }
    };

    void hydrateProgress();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menteeIdsKey]);

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
        enriched.map((u: any, i: number): Mentor => ({
          id: u.id ?? u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          menteeCount: u.assignedId?.length ?? 0,
          img: profileImageForUser(u, i),
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
  };

  /* ---------------- MARK COMPLETE ---------------- */

  const handleMarkComplete = () => setToast("Marked as complete");

  /* ---------------- REMOVE ---------------- */

  const handleRemoveMentors = async (mentorIdsToRemove: string[]) => {
    if (!selectedMentee) return;

    const mentee = mentees.find((m) => m.id === selectedMentee);
    if (!mentee?.assignedLoaded) return;

    const updated = mentee.assignedId.filter(
      (id) => !mentorIdsToRemove.includes(id)
    );

    await apiAssignUsers(selectedMentee, updated);

    setMentees((prev) =>
      prev.map((m) =>
        m.id === selectedMentee
          ? { ...m, assignedId: updated }
          : m
      )
    );

    setShowRemoveModal(false);
    setToast("Mentors removed successfully");
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

  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    for (const m of mentees) {
      const c = m.country?.trim();
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [mentees]);

  const sortedMentees = useMemo(() => {
    let list = [...mentees];

    if (sortKey.kind === "phase_self") {
      list = list.filter((m) => phaseFilterMatches(m.phase, "self"));
    } else if (sortKey.kind === "phase_church") {
      list = list.filter((m) => phaseFilterMatches(m.phase, "church"));
    } else if (sortKey.kind === "phase_community") {
      list = list.filter((m) => phaseFilterMatches(m.phase, "community"));
    } else if (sortKey.kind === "country") {
      const want = sortKey.country.trim().toLowerCase();
      list = list.filter(
        (m) => (m.country || "").trim().toLowerCase() === want,
      );
    }

    const arr = [...list];
    if (sortKey.kind === "name_az") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortKey.kind === "name_za") {
      arr.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortKey.kind === "progress") {
      arr.sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
    } else {
      arr.sort((a, b) => sortByCreatedDesc(a.createdAt, b.createdAt));
    }
    return arr;
  }, [mentees, sortKey]);

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

  const getMenteeOptions = (menteeId: string) => [
    {
      icon: "fa-solid fa-route",
      label: "Revitalization Roadmap",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/pastor-assignments?assignUser=${encodeURIComponent(menteeId)}`
        ),
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(
          `/director/assessments?assignUser=${encodeURIComponent(menteeId)}`
        ),
    },
    // {
    //   icon: "fa-solid fa-chart-line",
    //   label: "Track Progress",
    //   color: "text-red-500",
    //   onClick: handleTrackProgress,
    // },

    {
  icon: "fa-solid fa-user-group",
  label: "Assigned Mentors",
  color: "text-[#8ec5eb]",
  onClick: async () => {
    setSelectedMentee(menteeId);
    await loadAssignedUsers(menteeId);
    setShowRemoveModal(true);
  },
},
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
  ];

  const activeCount = mentees.filter((m) => m.status === "active").length;
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
              {activeTab === "active" && activeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
                  {activeCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeTab === "completed"
                ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                : "text-white/65 hover:text-white"
                }`}
            >
              Completed
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
                  {/* Phase */}
                  <div
                    className={`mx-2 rounded-lg ${
                      isPhaseSortKey(sortKey)
                        ? "bg-[#e8f0f8]"
                        : "bg-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setPhaseSectionOpen(!phaseSectionOpen)}
                      className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                            isPhaseSortKey(sortKey)
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isPhaseSortKey(sortKey) ? (
                            <i className="fa-solid fa-check text-[9px] text-white" />
                          ) : null}
                        </span>
                        <span className="text-[14px] font-semibold text-gray-900">
                          Phase
                        </span>
                      </span>
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded border ${
                          isPhaseSortKey(sortKey)
                            ? "border-[#2E3B8E] bg-[#2E3B8E] text-white"
                            : "border-[#2E3B8E] bg-white text-[#2E3B8E]"
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            phaseSectionOpen ? "fa-chevron-up" : "fa-chevron-down"
                          } text-xs`}
                        />
                      </span>
                    </button>
                    {phaseSectionOpen ? (
                      <div className="border-t border-gray-200/80 pb-2 pl-4 pr-2 pt-1">
                        {(
                          [
                            {
                              key: "phase_self" as const,
                              label: "Self Revitalization",
                            },
                            {
                              key: "phase_church" as const,
                              label: "Church Empowerment",
                            },
                            {
                              key: "phase_community" as const,
                              label:
                                "Community Revitalization and Multiplication",
                            },
                          ] as const
                        ).map(({ key, label }) => {
                          const active = sortKey.kind === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                setSortKey({ kind: key });
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
                    ) : null}
                  </div>

                  {/* Country */}
                  <div className="mx-2 mt-1 rounded-lg border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCountrySectionOpen(!countrySectionOpen)
                      }
                      className="flex w-full items-center justify-between gap-2 px-2 py-2 text-left"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                            sortKey.kind === "country"
                              ? "border-emerald-500 bg-emerald-500"
                              : "border-gray-300"
                          }`}
                        >
                          {sortKey.kind === "country" ? (
                            <i className="fa-solid fa-check text-[9px] text-white" />
                          ) : null}
                        </span>
                        <span className="text-[14px] font-semibold text-gray-900">
                          Country
                        </span>
                      </span>
                      <span className="flex h-8 w-8 items-center justify-center rounded border border-[#2E3B8E] bg-white text-[#2E3B8E]">
                        <i
                          className={`fa-solid ${
                            countrySectionOpen
                              ? "fa-chevron-up"
                              : "fa-chevron-down"
                          } text-xs`}
                        />
                      </span>
                    </button>
                    {countrySectionOpen ? (
                      <div className="max-h-48 overflow-y-auto border-t border-gray-200/80 py-1 pl-4 pr-2">
                        {uniqueCountries.length === 0 ? (
                          <p className="px-2 py-2 text-[13px] text-gray-500">
                            No countries on this page.
                          </p>
                        ) : (
                          uniqueCountries.map((c) => {
                            const active =
                              sortKey.kind === "country" &&
                              sortKey.country === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setSortKey({ kind: "country", country: c });
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
                                <span>{c}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="mx-2 mt-1 border-t border-gray-100 pt-2">
                    {(
                      [
                        { kind: "name_az" as const, label: "Name A–Z" },
                        { kind: "name_za" as const, label: "Name Z–A" },
                        { kind: "progress" as const, label: "Progress" },
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

                  <div className="mx-2 mt-1 border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSortKey({ kind: "latest" });
                        setShowSortMenu(false);
                      }}
                      className={sortControlClass(sortKey.kind === "latest")}
                    >
                      <span
                        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                          sortKey.kind === "latest"
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-gray-300"
                        }`}
                      >
                        {sortKey.kind === "latest" ? (
                          <i className="fa-solid fa-check text-[9px] text-white" />
                        ) : null}
                      </span>
                      <span>Clear Slot</span>
                    </button>
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
          {sortedMentees.map((m) => (
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
              progress={
                m.progress !== undefined
                  ? { phase: m.phase, value: m.progress }
                  : undefined
              }
              optionsMenu={getMenteeOptions(m.id)}
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
