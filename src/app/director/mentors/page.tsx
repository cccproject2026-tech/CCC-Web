"use client";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import PersonListCard from "@/app/Components/PersonListCard";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import ConfirmModal from "@/app/Components/ConfirmModal";
import ScheduleMeetingModal from "@/app/Components/ScheduleMeetingModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ListMenteesModal from "@/app/Components/ListMenteesModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { apiGetAllUsers, apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiCreateAppointment } from "@/app/Services/api";
import {
  extractApiErrorMessage,
  parseSlotStartToIso,
  uiMeetingModeToPlatform,
} from "@/app/Services/appointment-utils";
import { getDirectorUserId } from "@/app/utils/director-auth";
import { resolveApiMediaUrl } from "@/app/utils/image";

interface Mentor {
  id: string;
  name: string;
  role: string;
  description: string;
  img: any;
  menteeCount: number;
  isFeatured?: boolean;
  lastContact?: string;
  status: string;
  assignedIds: string[];
  email?: string;
  phoneNumber?: string;
}

/** List APIs sometimes nest `email` under `user` or `contact` (see director home). */
function getUserListEmail(
  person: Record<string, unknown> | { email?: string; contact?: unknown; user?: unknown }
): string | undefined {
  const tryStr = (v: unknown): string | undefined => {
    if (typeof v !== "string") return undefined;
    const t = v.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    return t.includes("@") && t.length > 3 ? t : undefined;
  };
  const direct = tryStr((person as { email?: string }).email);
  if (direct) return direct;
  const contact = (person as { contact?: unknown }).contact;
  if (contact && typeof contact === "object" && !Array.isArray(contact)) {
    const c = tryStr((contact as Record<string, unknown>).email);
    if (c) return c;
  }
  const user = (person as { user?: unknown }).user;
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
    const p = (u as Record<string, unknown>).phoneNumber ?? (u as Record<string, unknown>).phone;
    if (typeof p === "string" && p.trim()) return p.trim();
  }
  return undefined;
}

/** Initial count from list payload only (deduped). Do not use `menteeCount` on the user DTO — it is often stale or a different metric. */
function readListAssignedCount(user: any): number {
  const raw = user?.assignedId ?? user?.assignedIds;
  if (!Array.isArray(raw) || raw.length === 0) return 0;
  return new Set(
    raw.map((x) => String(x).trim()).filter(Boolean),
  ).size;
}

function applyMenteeCountToMentor(m: Mentor, count: number): Mentor {
  const w = count === 1 ? "mentee" : "mentees";
  return {
    ...m,
    menteeCount: count,
    description: `${m.role} with ${count} assigned ${w}`,
  };
}

function assignedIdsForMentor(user: any): string[] {
  const raw = user?.assignedId ?? user?.assignedIds;
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw.map((x) => String(x).trim()).filter(Boolean),
    ),
  ];
}

// Helper function to convert User to Mentor (index = stable fallback avatar)
const convertUserToMentor = (user: any, index: number): Mentor => {
  const defaultImages = [Mentor1, Mentor2, Mentor3];
  const rawPic = user?.profilePicture;
  const img =
    typeof rawPic === "string" && rawPic.trim()
      ? (resolveApiMediaUrl(rawPic) ?? rawPic)
      : defaultImages[index % defaultImages.length];
  const nAssigned = readListAssignedCount(user);
  const menteeWord = nAssigned === 1 ? "mentee" : "mentees";

  return {
    id: user.id || user._id,
    name: `${user.firstName} ${user.lastName}`,
    role: user.role,
    description: `${user.role} with ${nAssigned} assigned ${menteeWord}`,
    img,
    menteeCount: nAssigned,
    isFeatured: false,
    lastContact: undefined,
    status: user.status,
    assignedIds: assignedIdsForMentor(user),
    email: getUserListEmail(user) ?? undefined,
    phoneNumber: getUserListPhone(user),
  };
};

const PAGE_SIZE = 20;
const FEATURED_THUMB_LIMIT = 6;
/** Max rows pulled from `role=mentor&roleMatch=mixed` when we filter by role on the client. */
const MENTOR_LIST_CLIENT_FILTER_LIMIT = 2000;

type MentorListQuery = { search?: string; page: number; limit: number };

function normalizeRoleKey(role: string | undefined): string {
  return String(role ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

/** Some APIs return display strings like "Field Mentor"; /users?role=field-mentor may return nothing. */
function isFieldMentorUser(user: { role?: string } | null | undefined): boolean {
  const r = String(user?.role ?? "").trim();
  if (!r) return false;
  const n = normalizeRoleKey(r);
  if (n === "fieldmentor") return true;
  if (n.includes("field") && n.includes("mentor") && n !== "mentor") return true;
  return false;
}

/** Core mentor (not field mentor) — `role` is exactly the base `mentor` value. */
function isStandardMentorOnly(user: { role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (isFieldMentorUser(user)) return false;
  return normalizeRoleKey(user.role) === "mentor";
}

/**
 * Tries `GET /users?role=field-mentor&roleMatch=mixed` first. If the list is empty, loads
 * `role=mentor&roleMatch=mixed` and keeps users whose `role` is a field mentor (fallback).
 */
async function fetchFieldMentorPage(base: {
  search?: string;
  page: number;
  limit: number;
}): Promise<{ users: any[]; total: number; totalPages: number }> {
  const direct = await apiGetAllUsers({
    search: base.search,
    page: base.page,
    limit: base.limit,
    role: "field-mentor",
    roleMatch: "mixed",
  });
  const d = direct.data.data;
  const dUsers = d.users ?? [];
  const dTotal = d.total ?? 0;
  if (dUsers.length > 0 || dTotal > 0) {
    const onlyField = dUsers.filter((u) => isFieldMentorUser(u));
    return {
      users: onlyField,
      total: dTotal,
      totalPages:
        d.totalPages ??
        Math.max(1, Math.ceil((dTotal || 0) / base.limit) || 1),
    };
  }

  const broad = await apiGetAllUsers({
    search: base.search,
    page: 1,
    limit: MENTOR_LIST_CLIENT_FILTER_LIMIT,
    role: "mentor",
    roleMatch: "mixed",
    t: Date.now(),
  });
  const all = (broad.data.data.users ?? []) as any[];
  const fieldOnes = all.filter((u) => isFieldMentorUser(u));
  const total = fieldOnes.length;
  const start = (base.page - 1) * base.limit;
  return {
    users: fieldOnes.slice(start, start + base.limit),
    total,
    totalPages: Math.max(1, Math.ceil(total / base.limit) || 1),
  };
}

/** Core `mentor` role only (excludes field mentor), from mixed list + client filter + slice. */
async function fetchMentorOnlyPage(base: {
  search?: string;
  page: number;
  limit: number;
}): Promise<{ users: any[]; total: number; totalPages: number }> {
  const broad = await apiGetAllUsers({
    search: base.search,
    page: 1,
    limit: MENTOR_LIST_CLIENT_FILTER_LIMIT,
    role: "mentor",
    roleMatch: "mixed",
    t: Date.now(),
  });
  const all = (broad.data.data.users ?? []) as any[];
  const standard = all.filter((u) => isStandardMentorOnly(u));
  const total = standard.length;
  const start = (base.page - 1) * base.limit;
  return {
    users: standard.slice(start, start + base.limit),
    total,
    totalPages: Math.max(1, Math.ceil(total / base.limit) || 1),
  };
}

function buildMentorListRequest(
  activeFilter: string,
  base: MentorListQuery
) {
  if (activeFilter === "All") {
    return apiGetAllUsers({
      ...base,
      role: "mentor",
      roleMatch: "mixed",
    });
  }
  // "Mentors" → fetchMentorOnlyPage(); "Field Mentor" → fetchFieldMentorPage()
  return apiGetAllUsers({
    ...base,
    role: "mentor",
    roleMatch: "mixed",
  });
}

export default function MyMentorsPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Mentors");
  const [sortBy, setSortBy] = useState("Least Mentees");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showListMenteesModal, setShowListMenteesModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [allMentors, setAllMentors] = useState<Mentor[]>([]);
  const [featuredMentors, setFeaturedMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  /** When mentor ids are unchanged but assignments change (e.g. assign modal), re-run assigned GETs. */
  const [mentorMenteeHydrateNonce, setMentorMenteeHydrateNonce] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, debouncedQuery]);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;

        if (activeFilter === "Field Mentor") {
          const { users, total, totalPages: tp } = await fetchFieldMentorPage({
            search,
            page: currentPage,
            limit: PAGE_SIZE,
          });
          setAllMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
          setTotalCount(total);
          setTotalPages(tp);
        } else if (activeFilter === "Mentors") {
          const { users, total, totalPages: tp } = await fetchMentorOnlyPage({
            search,
            page: currentPage,
            limit: PAGE_SIZE,
          });
          setAllMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
          setTotalCount(total);
          setTotalPages(tp);
        } else {
          const response = await buildMentorListRequest(activeFilter, {
            search,
            page: currentPage,
            limit: PAGE_SIZE,
          });
          const { users, total, totalPages: tp } = response.data.data;
          setAllMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
          setTotalCount(total);
          setTotalPages(tp);
        }
      } catch (error) {
        console.error("Error fetching mentors:", error);
        setAllMentors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMentors();
  }, [activeFilter, debouncedQuery, currentPage]);

  // First 6 profile thumbnails always match the current search/filter (page 1),
  // not the paged list — so they stay in sync when searching and when you're on page 2+.
  useEffect(() => {
    let cancelled = false;
    const loadFeatured = async () => {
      try {
        const search =
          debouncedQuery.length > 0 ? debouncedQuery : undefined;
        if (activeFilter === "Field Mentor") {
          const { users } = await fetchFieldMentorPage({
            search,
            page: 1,
            limit: FEATURED_THUMB_LIMIT,
          });
          if (cancelled) return;
          setFeaturedMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
        } else if (activeFilter === "Mentors") {
          const { users } = await fetchMentorOnlyPage({
            search,
            page: 1,
            limit: FEATURED_THUMB_LIMIT,
          });
          if (cancelled) return;
          setFeaturedMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
        } else {
          const response = await buildMentorListRequest(activeFilter, {
            search,
            page: 1,
            limit: FEATURED_THUMB_LIMIT,
          });
          const { users } = response.data.data;
          if (cancelled) return;
          setFeaturedMentors(
            users.map((u: any, i: number) => convertUserToMentor(u, i))
          );
        }
      } catch (error) {
        console.error("Error fetching featured mentors:", error);
        if (!cancelled) setFeaturedMentors([]);
      }
    };
    loadFeatured();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, debouncedQuery]);
  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      featuredMentors.map((m) => ({
        id: m.id,
        name: m.name,
        img: m.img,
        href: `/director/mentors/profile/${m.id}`,
      })),
    [featuredMentors]
  );

  /** Authoritative count from `GET /users/:id/assigned` (avoids list DTO `menteeCount` drift). */
  const mentorAssignedFetchKey = useMemo(
    () =>
      `${mentorMenteeHydrateNonce}|${[...new Set([...allMentors, ...featuredMentors].map((m) => m.id))]
        .filter(Boolean)
        .sort()
        .join(",")}`,
    [allMentors, featuredMentors, mentorMenteeHydrateNonce],
  );

  const assignMenteeCountGen = useRef(0);

  useEffect(() => {
    const ids = mentorAssignedFetchKey.split(",").filter(Boolean);
    if (ids.length === 0) return;

    const myGen = ++assignMenteeCountGen.current;
    let cancelled = false;

    (async () => {
      const pairs: [string, number | null][] = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await apiGetAssignedUsers(id);
            const list = res.data?.data;
            const n = Array.isArray(list) ? list.length : 0;
            return [id, n] as [string, number | null];
          } catch {
            return [id, null] as [string, number | null];
          }
        }),
      );
      if (cancelled) return;
      if (myGen !== assignMenteeCountGen.current) return;

      const map = new Map<string, number>();
      for (const [id, n] of pairs) {
        if (n !== null) map.set(id, n);
      }

      setAllMentors((prev) =>
        prev.map((m) =>
          map.has(m.id) ? applyMenteeCountToMentor(m, map.get(m.id)!) : m,
        ),
      );
      setFeaturedMentors((prev) =>
        prev.map((m) =>
          map.has(m.id) ? applyMenteeCountToMentor(m, map.get(m.id)!) : m,
        ),
      );
      setSelectedMentor((prev) => {
        if (!prev) return null;
        const n = map.get(prev.id);
        return n === undefined ? prev : applyMenteeCountToMentor(prev, n);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [mentorAssignedFetchKey]);

  const filteredMentors = useMemo(() => {
    const filtered = [...allMentors];

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "Least Mentees":
          return a.menteeCount - b.menteeCount;
        case "Most Mentees":
          return b.menteeCount - a.menteeCount;
        case "Name A-Z":
          return a.name.localeCompare(b.name);
        case "Name Z-A":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allMentors, sortBy]);

  const sortOptions = [
    "Least Mentees",
    "Most Mentees",
    "Name A-Z",
    "Name Z-A",
    "Last Contacted",
  ];

  const filterOptions = [
    { label: "All", value: "All" },
    { label: "Mentors", value: "Mentors" },
    { label: "Field Mentor", value: "Field Mentor" },
  ];

  const handleScheduleMeeting = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowScheduleModal(true);
  }, []);

  const handleAssignMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowAssignModal(true);
  }, []);

  const handleRemoveMentee = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowRemoveModal(true);
  }, []);

  const handleListMentees = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setShowListMenteesModal(true);
  }, []);

  const getMentorOptions = (mentor: Mentor) => [
    {
      icon: "fa-solid fa-users",
      label: "List of Mentees",
      color: "text-[#8ec5eb]",
      onClick: () => handleListMentees(mentor),
    },
    {
      icon: "fa-solid fa-user-plus",
      label: "Assign New Mentee",
      color: "text-[#8ec5eb]",
      onClick: () => handleAssignMentees(mentor),
    },
    {
      icon: "fa-solid fa-user-minus",
      label: "Remove a Mentee",
      color: "text-red-400",
      onClick: () => handleRemoveMentee(mentor),
    },
    {
      icon: "fa-regular fa-calendar",
      label: "Schedule an Appointment",
      color: "text-[#8ec5eb]",
      onClick: () => handleScheduleMeeting(mentor),
    },
    {
      icon: "fa-regular fa-pen-to-square",
      label: "Edit Profile",
      color: "text-[#8ec5eb]",
      onClick: () =>
        router.push(`/director/mentors/profile/edit?id=${mentor.id}`),
    },
  ];

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

      {/* Search and Featured Mentors Section */}
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
          </div>

          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars
              key={`featured-${activeFilter}-${debouncedQuery}`}
              items={featuredItems}
              showDivider
              className="mb-2"
            />
          )}
        </div>
      </section>

      {/* Filters and Sort Section */}
      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          {/* Filter Tabs */}
          <div
            className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}
          >
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${activeFilter === option.value
                  ? "bg-[#8ec5eb]/25 text-white shadow-sm ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3 lg:shrink-0">
            <span className="text-[14px] font-semibold whitespace-nowrap text-white sm:text-[15px]">
              Sort By
            </span>
            <div className="relative w-full sm:w-auto sm:min-w-[200px]">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex min-w-[160px] w-full items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:w-auto sm:min-w-[180px] sm:text-[14px]"
              >
                <span className="truncate">{sortBy}</span>
                <i className="fa-solid fa-chevron-down text-[10px]"></i>
              </button>

              {showSortMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 px-1 shadow-2xl backdrop-blur-md">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[13px] transition-all sm:text-[14px] ${sortBy === option
                        ? "bg-[#8ec5eb]/20 font-semibold text-white"
                        : "text-white/80 hover:bg-white/10"
                        }`}
                    >
                      <span
                        className={`flex h-[18px] w-[18px] flex-shrink-0 items-center justify-center rounded-full border-2 ${sortBy === option
                          ? "border-[#8ec5eb] bg-[#8ec5eb]/40"
                          : "border-white/30"
                          }`}
                      >
                        {sortBy === option && (
                          <i className="fa-solid fa-check text-[9px] text-white"></i>
                        )}
                      </span>
                      {option}
                    </button>
                  ))}
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
          ) : filteredMentors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa-solid fa-users mb-4 text-5xl text-white/40" />
              <p className="text-lg font-medium text-white">No mentors found</p>
              <p className="mt-2 text-sm text-white/60">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5">
              {filteredMentors.map((mentor) => (
                <PersonListCard
                  key={mentor.id}
                  id={mentor.id}
                  name={mentor.name}
                  role={mentor.role}
                  description={mentor.description}
                  image={mentor.img}
                  variant="glass"
                  profileLink={`/director/mentors/profile/${mentor.id}`}
                  menteeCount={mentor.menteeCount}
                  optionsMenu={getMentorOptions(mentor)}
                  email={mentor.email}
                  phoneNumber={mentor.phoneNumber}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <p className="text-white/70 text-sm">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-left text-xs"></i>
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
                      <span key={`ellipsis-${idx}`} className="text-white/60 px-1">…</span>
                    ) : (
                      <button
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 disabled:opacity-40"
                >
                  <i className="fa-solid fa-chevron-right text-xs"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        onConfirm={async (data) => {
          const directorId = getDirectorUserId();
          if (!directorId) {
            setToast({ message: "Session expired. Please sign in again.", type: "error" });
            setTimeout(() => setToast(null), 4000);
            throw new Error("No session");
          }
          if (!selectedMentor) {
            setToast({ message: "No mentor selected.", type: "error" });
            setTimeout(() => setToast(null), 4000);
            throw new Error("No mentor");
          }
          try {
            const meetingDate = parseSlotStartToIso(
              data.dateYmd,
              data.timeSlot.replace(/\u2013/g, "-")
            );
            await apiCreateAppointment({
              userId: directorId,
              mentorId: selectedMentor.id,
              meetingDate,
              platform: uiMeetingModeToPlatform(data.meetingOption),
              notes: data.notes || "Scheduled from Director Mentors",
            });
            setToast({ message: "Meeting scheduled successfully", type: "success" });
            setTimeout(() => setToast(null), 3000);
          } catch (e) {
            setToast({
              message: extractApiErrorMessage(e) || "Failed to schedule meeting",
              type: "error",
            });
            setTimeout(() => setToast(null), 4000);
            throw e;
          }
        }}
        mentor={
          selectedMentor
            ? {
                id: selectedMentor.id,
                name: selectedMentor.name,
                img: selectedMentor.img,
                menteeCount: selectedMentor.menteeCount,
              }
            : null
        }
      />

      {/* Assign Mentees Modal */}
      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSuccess={(message) => {
          setToast({ message, type: 'success' });
          setTimeout(() => setToast(null), 3000);
          // Refresh list + featured thumbnails (mentee counts)
          const fetchMentors = async () => {
            try {
              const search =
                debouncedQuery.length > 0 ? debouncedQuery : undefined;
              if (activeFilter === "Field Mentor") {
                const [list, feat] = await Promise.all([
                  fetchFieldMentorPage({
                    search,
                    page: currentPage,
                    limit: PAGE_SIZE,
                  }),
                  fetchFieldMentorPage({
                    search,
                    page: 1,
                    limit: FEATURED_THUMB_LIMIT,
                  }),
                ]);
                setAllMentors(
                  list.users.map((u: any, i: number) => convertUserToMentor(u, i))
                );
                setTotalCount(list.total);
                setTotalPages(list.totalPages);
                setFeaturedMentors(
                  feat.users.map((u: any, i: number) => convertUserToMentor(u, i))
                );
              } else if (activeFilter === "Mentors") {
                const [list, feat] = await Promise.all([
                  fetchMentorOnlyPage({
                    search,
                    page: currentPage,
                    limit: PAGE_SIZE,
                  }),
                  fetchMentorOnlyPage({
                    search,
                    page: 1,
                    limit: FEATURED_THUMB_LIMIT,
                  }),
                ]);
                setAllMentors(
                  list.users.map((u: any, i: number) => convertUserToMentor(u, i))
                );
                setTotalCount(list.total);
                setTotalPages(list.totalPages);
                setFeaturedMentors(
                  feat.users.map((u: any, i: number) => convertUserToMentor(u, i))
                );
              } else {
                const [listRes, featRes] = await Promise.all([
                  buildMentorListRequest(activeFilter, {
                    search,
                    page: currentPage,
                    limit: PAGE_SIZE,
                  }),
                  buildMentorListRequest(activeFilter, {
                    search,
                    page: 1,
                    limit: FEATURED_THUMB_LIMIT,
                  }),
                ]);
                const { users, total, totalPages: tp } = listRes.data.data;
                setAllMentors(
                  users.map((u: any, i: number) => convertUserToMentor(u, i))
                );
                setTotalCount(total);
                setTotalPages(tp);
                const featUsers = featRes.data.data.users;
                setFeaturedMentors(
                  featUsers.map((u: any, i: number) => convertUserToMentor(u, i))
                );
              }
              setMentorMenteeHydrateNonce((n) => n + 1);
            } catch (error) {
              console.error("Error refreshing mentors:", error);
            }
          };
          fetchMentors();
        }}
        onError={(message) => {
          setToast({ message, type: 'error' });
          setTimeout(() => setToast(null), 3000);
        }}
        mentor={selectedMentor ? {
          name: selectedMentor.name,
          id: selectedMentor.id,
          assignedIds: selectedMentor.assignedIds
        } : undefined}
      />

      {/* Remove Mentee Modal */}
      <ConfirmModal
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={() => {
          setToast({ message: "Mentee Removed Successfully", type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
        title="Remove a Mentee"
        message={`Remove a mentee from ${selectedMentor?.name}. This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-solid fa-user-minus"
        iconColor="text-red-500 bg-red-100"
      />

      {/* List Mentees Modal */}
      <ListMenteesModal
        isOpen={showListMenteesModal}
        onClose={() => setShowListMenteesModal(false)}
        mentorId={selectedMentor?.id || null}
        mentorName={selectedMentor?.name || null}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed right-6 top-6 z-[100] animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#041f35]/95 px-6 py-4 shadow-2xl backdrop-blur-md">
            <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check text-emerald-400' : 'fa-circle-exclamation text-red-400'} text-xl`}></i>
            <span className="text-[15px] font-semibold text-white">
              {toast.message}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close menus */}
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
