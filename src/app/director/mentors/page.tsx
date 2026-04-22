"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DirectorHero from "../DirectorHero";
import {
  directorGlassCard,
  directorPageRoot,
} from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import PersonListCard from "@/app/Components/PersonListCard";
import ScheduleMeetingModal from "@/app/Components/ScheduleMeetingModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ListMenteesModal from "@/app/Components/ListMenteesModal";
import RemoveMenteesModal from "@/app/Components/RemoveMenteesModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { apiCreateAppointment } from "@/app/Services/appointments.service";
import {
  extractApiErrorMessage,
  parseSlotStartToIso,
  uiMeetingModeToPlatform,
} from "@/app/Services/appointment-utils";
import {
  apiGetAllUsers,
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
import { getCookie } from "@/app/utils/cookies";
import { parseMentorUsersListResponse } from "./parseMentorUsersResponse";

const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

export interface MentorRow {
  id: string;
  name: string;
  role: string;
  roleKey: "mentor" | "field_mentor";
  description: string;
  img: string | (typeof Mentor1);
  menteeCount: number;
  status: string;
  assignedIds: string[];
  progress?: number;
  phase?: string;
  country?: string;
  createdAt?: string;
}

type MentorSortKey =
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

function isPhaseSortKey(k: MentorSortKey): boolean {
  return (
    k.kind === "phase_self" ||
    k.kind === "phase_church" ||
    k.kind === "phase_community"
  );
}

function labelForSortKey(k: MentorSortKey): string {
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

function countryFromUserRecord(user: Record<string, unknown>): string {
  const interest = user.interest as Record<string, unknown> | undefined;
  const ch = interest?.churchDetails;
  if (Array.isArray(ch) && ch[0] && typeof ch[0] === "object" && ch[0] !== null) {
    const c = (ch[0] as { country?: string }).country;
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  const c2 = (interest as { country?: string } | undefined)?.country;
  if (typeof c2 === "string" && c2.trim()) return c2.trim();
  return "";
}

function profileImageForUser(user: Record<string, unknown>, index: number) {
  const raw = user.profilePicture;
  if (typeof raw === "string" && raw.trim()) {
    return resolveApiMediaUrl(raw) ?? raw;
  }
  return IMAGE_POOL[index % IMAGE_POOL.length];
}

async function enrichMentorUsersFromApi(
  users: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> {
  const CHUNK = 20;
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < users.length; i += CHUNK) {
    const part = users.slice(i, i + CHUNK);
    const batch = await Promise.all(
      part.map(async (u) => {
        const id = (u.id ?? u._id) as string | undefined;
        if (id == null) return u;
        try {
          const detailRes = await apiGetUserById(String(id));
          const full = unwrapUserResponse(detailRes);
          if (full) {
            const merged = { ...u, ...(full as object) } as Record<string, unknown>;
            if (Array.isArray((u as { assignedId?: string[] }).assignedId)) {
              merged.assignedId =
                (full as { assignedId?: string[] }).assignedId ??
                (u as { assignedId: string[] }).assignedId;
            }
            return merged;
          }
        } catch {
          /* keep list row */
        }
        return u;
      }),
    );
    out.push(...batch);
  }
  return out;
}

function normalizeMentorRoleKey(
  raw: string,
): "mentor" | "field_mentor" {
  const k = raw.toLowerCase().replace(/-/g, "_");
  return k === "field_mentor" ? "field_mentor" : "mentor";
}

function mapUserToMentorRow(
  user: Record<string, unknown>,
  index: number,
): MentorRow {
  const rawRole = String((user as { role?: string }).role ?? "mentor");
  const roleKey = normalizeMentorRoleKey(rawRole);
  const displayRole = roleKey === "field_mentor" ? "Field Mentor" : "Mentor";
  const rawPct = (user as { progressPercentage?: unknown }).progressPercentage;
  const seedProgress =
    typeof rawPct === "number" && Number.isFinite(rawPct) ? rawPct : undefined;
  const rawPhase = (user as { currentPhase?: unknown }).currentPhase;
  const seedPhase =
    typeof rawPhase === "string" && rawPhase.trim() ? rawPhase.trim() : undefined;
  const country = countryFromUserRecord(user);
  const createdAt =
    typeof (user as { createdAt?: string }).createdAt === "string"
      ? (user as { createdAt: string }).createdAt
      : undefined;

  const menteeCount = Array.isArray(
    (user as { assignedId?: string[] }).assignedId,
  )
    ? (user as { assignedId: string[] }).assignedId.length
    : 0;
  return {
    id: String(
      (user as { id?: string; _id?: string }).id ??
        (user as { _id?: string })._id ??
        "",
    ),
    name:
      `${String((user as { firstName?: string }).firstName ?? "").trim()} ${String((user as { lastName?: string }).lastName ?? "").trim()}`.trim() ||
      "—",
    role: displayRole,
    roleKey,
    description: `${displayRole} enrolled in mentoring program`,
    img: profileImageForUser(user, index),
    menteeCount,
    status: String((user as { status?: string }).status ?? ""),
    assignedIds:
      (user as { assignedId?: string[] }).assignedId ??
      (user as { assignedIds?: string[] }).assignedIds ??
      [],
    progress: seedProgress,
    phase: seedPhase,
    country: country || undefined,
    createdAt,
  };
}

function resolveDirectorUserId(): string {
  const fromId = getCookie("userId")?.trim();
  if (fromId) return fromId;
  try {
    const raw = getCookie("user");
    if (!raw) return "";
    const u = JSON.parse(raw) as { id?: string; _id?: string };
    return (
      (typeof u.id === "string" ? u.id : "") ||
      (typeof u._id === "string" ? u._id : "") ||
      ""
    );
  } catch {
    return "";
  }
}

export default function MyMentorsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mentorListTab, setMentorListTab] = useState<"all" | "mentor" | "field">(
    "all",
  );
  const [sortKey, setSortKey] = useState<MentorSortKey>({ kind: "latest" });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [phaseSectionOpen, setPhaseSectionOpen] = useState(true);
  const [countrySectionOpen, setCountrySectionOpen] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showListMenteesModal, setShowListMenteesModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<MentorRow | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [allMentors, setAllMentors] = useState<MentorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    setCurrentPage(1);
  }, [mentorListTab, debouncedQuery]);

  const runMentorQuery = useCallback(async () => {
    const search = debouncedQuery.length > 0 ? debouncedQuery : undefined;
    const response = await apiGetAllUsers({
      search,
      page: currentPage,
      limit: PAGE_SIZE,
      role: "mentor",
      roleMatch: "mixed",
      t: Date.now(),
    });
    const { users, total, totalPages: tp } =
      parseMentorUsersListResponse(response);
    setTotalCount(total);
    setTotalPages(tp);
    setAllMentors(users.map((u, i) => mapUserToMentorRow(u, i)));
    void enrichMentorUsersFromApi(users)
      .then((enriched) => {
        setAllMentors(enriched.map((u, i) => mapUserToMentorRow(u, i)));
      })
      .catch((e) =>
        console.warn("Mentor list: optional profile merge failed", e),
      );
  }, [debouncedQuery, currentPage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await runMentorQuery();
      } catch (error) {
        console.error("Error fetching mentors:", error);
        if (!cancelled) setAllMentors([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [runMentorQuery]);

  const mentorIdsKey = allMentors.map((m) => m.id).join(",");

  useEffect(() => {
    if (!allMentors.length) return;
    let cancelled = false;
    const hydrateProgress = async () => {
      const current = allMentors.slice();
      try {
        const results = await Promise.all(
          current.map(async (m) => {
            try {
              const res = await apiGetUserProgress(m.id);
              const pr = unwrapProgressData(res) as
                | ProgressResponse
                | null
                | undefined;
              return { id: m.id, pr, row: m };
            } catch {
              return {
                id: m.id,
                pr: null as ProgressResponse | null,
                row: m,
              };
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
        for (const { id, pr, row } of results) {
          if (!pr) continue;
          const safeProgress = deriveOverallProgressPercent(pr);
          const hasRoadmaps = Array.isArray(pr.roadmaps) && pr.roadmaps.length > 0;
          const derivedPhase = hasRoadmaps
            ? deriveCurrentRoadmapPhaseLabel(pr, nameById)
            : undefined;
          const label =
            (derivedPhase && derivedPhase.trim()) || (row.phase && row.phase.trim());
          const phase = label && label.length > 0 ? label : "Phase not assigned";
          const listProgress = row.progress;
          const finalProgress =
            !hasRoadmaps &&
            safeProgress === 0 &&
            typeof listProgress === "number" &&
            listProgress > 0
              ? listProgress
              : safeProgress;
          patch.set(id, {
            progress: finalProgress,
            phase,
          });
        }
        setAllMentors((prev) =>
          prev.map((item) => {
            const u = patch.get(item.id);
            if (!u) return item;
            return {
              ...item,
              progress: u.progress,
              phase: u.phase ?? item.phase,
            };
          }),
        );
      } catch {
        /* keep list */
      }
    };
    void hydrateProgress();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mentorIdsKey]);

  const featuredMentors = useMemo(() => allMentors.slice(0, 6), [allMentors]);
  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      featuredMentors.map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
      })),
    [featuredMentors],
  );

  const mentorTypeCount = useMemo(
    () => allMentors.filter((m) => m.id && m.roleKey === "mentor").length,
    [allMentors],
  );

  const uniqueCountries = useMemo(() => {
    const s = new Set<string>();
    for (const m of allMentors) {
      const c = m.country?.trim();
      if (c) s.add(c);
    }
    return [...s].sort((a, b) => a.localeCompare(b));
  }, [allMentors]);

  const sortedMentors = useMemo(() => {
    let list = allMentors.filter((m) => m.id.length > 0);
    if (mentorListTab === "mentor") {
      list = list.filter((m) => m.roleKey === "mentor");
    } else if (mentorListTab === "field") {
      list = list.filter((m) => m.roleKey === "field_mentor");
    }

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
  }, [allMentors, sortKey, mentorListTab]);

  const sortControlClass = (active: boolean) =>
    `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] transition sm:text-[14px] ${
      active
        ? "bg-[#e8f1f8] font-semibold text-[#0f4a76]"
        : "text-gray-700 hover:bg-gray-50"
    }`;

  const getMentorOptions = useCallback(
    (m: MentorRow) => [
      {
        icon: "fa-solid fa-users",
        label: "List of Mentees",
        color: "text-[#8ec5eb]",
        onClick: () => {
          setSelectedMentor(m);
          setShowListMenteesModal(true);
        },
      },
      {
        icon: "fa-solid fa-user-plus",
        label: "Assign New Mentee",
        color: "text-[#8ec5eb]",
        onClick: () => {
          setSelectedMentor(m);
          setShowAssignModal(true);
        },
      },
      {
        icon: "fa-solid fa-user-minus",
        label: "Remove a Mentee",
        color: "text-[#8ec5eb]",
        onClick: () => {
          setSelectedMentor(m);
          setShowRemoveModal(true);
        },
      },
      {
        icon: "fa-regular fa-calendar",
        label: "Schedule an Appointment",
        color: "text-[#8ec5eb]",
        onClick: () => {
          if (!m.id) {
            setToast({
              message: "Cannot schedule: mentor profile is missing an id.",
              type: "error",
            });
            setTimeout(() => setToast(null), 4000);
            return;
          }
          setSelectedMentor(m);
          setShowScheduleModal(true);
        },
      },
      {
        icon: "fa-regular fa-pen-to-square",
        label: "Edit Profile",
        color: "text-[#8ec5eb]",
        onClick: () => {
          router.push(
            `/director/mentors/profile/edit?id=${encodeURIComponent(m.id)}`,
          );
        },
      },
    ],
    [router],
  );

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Mentors"
        subtitle="Manage mentors and mentee assignments."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentors" },
        ]}
      />

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
                onClick={() => router.push("/director/mentors/location")}
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
              items={featuredItems}
              showDivider
              className="mb-2"
              onItemClick={(item) =>
                router.push(
                  `/director/mentors/profile/${encodeURIComponent(String(item.id))}`,
                )
              }
            />
          )}
        </div>
      </section>

      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          <div
            className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}
          >
            <button
              type="button"
              onClick={() => setMentorListTab("all")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                mentorListTab === "all"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setMentorListTab("mentor")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                mentorListTab === "mentor"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <span>Mentor</span>
              {mentorListTab === "mentor" && mentorTypeCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
                  {mentorTypeCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMentorListTab("field")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                mentorListTab === "field"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              Field Mentor
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
                            phaseSectionOpen
                              ? "fa-chevron-up"
                              : "fa-chevron-down"
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

      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
              <p className="text-lg font-medium text-white">Loading mentors…</p>
            </div>
          ) : sortedMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa-solid fa-user-group mb-4 text-5xl text-white/40" />
              <p className="text-lg font-medium text-white">No mentors found</p>
              <p className="mt-2 text-sm text-white/60">Try another search or tab.</p>
            </div>
          ) : (
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-3"
                  : "grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5"
              }
            >
              {sortedMentors.map((m) => (
                <PersonListCard
                  key={m.id}
                  id={m.id}
                  name={m.name}
                  role={m.role}
                  description={m.description}
                  image={m.img}
                  variant="glass"
                  listLayout={viewMode === "list"}
                  profileLink={`/director/mentors/profile/${m.id}`}
                  progress={
                    m.progress !== undefined
                      ? { phase: m.phase, value: m.progress }
                      : undefined
                  }
                  optionsMenu={getMentorOptions(m)}
                />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/70">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
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
                  .filter(
                    (p) =>
                      p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) {
                      acc.push("...");
                    }
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-white/60"
                      >
                        …
                      </span>
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
                    ),
                  )}
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
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

      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedMentor(null);
        }}
        onConfirm={async (meetingData) => {
          if (!selectedMentor) return;
          const directorId = resolveDirectorUserId();
          if (!directorId) {
            setToast({
              message: "You must be logged in to schedule a meeting.",
              type: "error",
            });
            setTimeout(() => setToast(null), 4000);
            return;
          }
          try {
            await apiCreateAppointment({
              userId: directorId,
              mentorId: selectedMentor.id,
              meetingDate: parseSlotStartToIso(
                meetingData.selectedYmd,
                meetingData.selectedTime,
              ),
              platform: uiMeetingModeToPlatform(meetingData.meetingOption),
              notes: [meetingData.notes, "Scheduled from director Mentors list"]
                .filter(Boolean)
                .join(" — "),
            });
            setShowScheduleModal(false);
            setSelectedMentor(null);
            setToast({ message: "Meeting scheduled successfully", type: "success" });
            setTimeout(() => setToast(null), 3000);
          } catch (e) {
            setToast({
              message: extractApiErrorMessage(e) || "Failed to schedule meeting",
              type: "error",
            });
            setTimeout(() => setToast(null), 5000);
          }
        }}
        mentor={selectedMentor}
      />

      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={(message) => {
          setToast({ message, type: "success" });
          setTimeout(() => setToast(null), 3000);
          void runMentorQuery();
        }}
        onError={(message) => {
          setToast({ message, type: "error" });
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={
          selectedMentor
            ? {
                name: selectedMentor.name,
                id: selectedMentor.id,
                assignedIds: selectedMentor.assignedIds,
              }
            : undefined
        }
      />

      <RemoveMenteesModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        mentorId={selectedMentor?.id ?? null}
        mentorName={selectedMentor?.name ?? null}
        onSuccess={(message) => {
          setToast({ message, type: "success" });
          setTimeout(() => setToast(null), 3000);
          void runMentorQuery();
        }}
        onError={(message) => {
          setToast({ message, type: "error" });
          setTimeout(() => setToast(null), 4000);
        }}
      />

      <ListMenteesModal
        isOpen={showListMenteesModal}
        onClose={() => setShowListMenteesModal(false)}
        mentorId={selectedMentor?.id || null}
        mentorName={selectedMentor?.name || null}
      />

      {toast && (
        <div className="animate-fade-in fixed right-6 top-6 z-[100]">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#041f35]/95 px-6 py-4 shadow-2xl backdrop-blur-md">
            <i
              className={`fa-solid ${
                toast.type === "success"
                  ? "fa-circle-check text-emerald-400"
                  : "fa-circle-exclamation text-red-400"
              } text-xl`}
            />
            <span className="text-[15px] font-semibold text-white">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {showSortMenu && (
        <div
          className="fixed inset-0 z-40"
          aria-hidden
          onClick={() => setShowSortMenu(false)}
        />
      )}
    </div>
  );
}
