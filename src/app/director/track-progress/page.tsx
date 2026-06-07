"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ProgressCard from "@/app/Components/Card/ProgressCard";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import FeaturedAvatars, {
  FeaturedAvatarItem,
} from "@/app/Components/FeaturedAvatars";
import ProgressBg from "../../Assets/progress-bg.jpg";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { resolveApiMediaUrl, isRemoteImageSrc } from "@/app/utils/image";
import {
  apiGetOverallProgress,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
} from "@/app/Services/progress.service";
import { apiGetAllUsers, apiGetAssignedUsers } from "@/app/Services/users.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import type { UserOverallProgress } from "@/app/Services/types";



type MenteeItem = {
  userId: string;
  fullName: string;
  role: string;
  progress: number;
  roadmapDone: number;
  roadmapTotal: number;
  assessmentDone: number;
  assessmentTotal: number;
  // profileImage: string | (typeof PLACEHOLDER_IMAGES)[number];
  profileImage: string;
};

type MentorGroup = {
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  // mentorImage: string | (typeof PLACEHOLDER_IMAGES)[number];
  mentorImage: string;
  mentees: MenteeItem[];
  expanded: boolean;
};

type MentorListItem = {
  mentorId: string;
  mentorName: string;
  mentorRole: string;
  // mentorImage: string | (typeof PLACEHOLDER_IMAGES)[number];
  mentorImage: string;
};

// type ProgressListItem = {
//   userId: string;
//   fullName: string;
//   role: string;
//   progress: number;
//   // profileImage: string | (typeof PLACEHOLDER_IMAGES)[number];
//   profileImage: string;
// };
type ProgressListItem = {
  userId: string;
  fullName: string;
  role: string;
  progress: number;
  profileImage: string;
  email?: string;
};

function numFromApi(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}
function getInitialsAvatar(name: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || fallback
  )}&background=173653&color=ffffff`;
}

function imageForItem(profilePicture: string | undefined, name: string): string {
  if (typeof profilePicture === "string" && profilePicture.trim()) {
    return resolveApiMediaUrl(profilePicture) ?? profilePicture;
  }
  return getInitialsAvatar(name);
}

function normalizeRow(
  item: UserOverallProgress,
  index: number,
): ProgressListItem | null {
  const userId = extractUserIdFromOverallProgressRow(item);
  if (!userId) return null;
  const fullName =
    `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
    item.email ||
    "Unknown";

  return {
  userId,
  fullName,
  role: item.role ?? "—",
  progress: Math.round(
    Math.min(100, Math.max(0, item.overallProgress ?? 0)),
  ),
  profileImage: imageForItem(item.profilePicture, fullName),
  email: item.email || "",
};
}

function isMenteeRole(role: string | undefined): boolean {
  const r = (role ?? "").toLowerCase();
  return r.includes("pastor") || r.includes("mentee");
}

export default function TrackProgressPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "completed">(
    "all",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list" | "by-mentor">("grid");
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null);
  const [flatPage, setFlatPage] = useState(1);
  const [mentorList, setMentorList] = useState<MentorListItem[]>([]);
  const [mentorGroupCache, setMentorGroupCache] = useState<Record<string, MentorGroup>>({});
  const [byMentorPage, setByMentorPage] = useState(1);
  const [byMentorLoading, setByMentorLoading] = useState(false);
  const [byMentorPageLoading, setByMentorPageLoading] = useState(false);
  const [byMentorError, setByMentorError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [progressData, setProgressData] = useState<ProgressListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const FLAT_PAGE_SIZE = 12;
  const BY_MENTOR_PAGE_SIZE = 6;
  const pastorProgressByIdRef = useRef<Map<string, Record<string, unknown>>>(new Map());

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetOverallProgress(["pastor"]);
      const rows = unwrapOverallProgressList(res);
      setProgressData(
        rows
          .map((r, i) => normalizeRow(r, i))
          .filter((x): x is ProgressListItem => x != null && isMenteeRole(x.role)),
      );
    } catch (err) {
      console.error(err);
      setError(
        extractApiErrorMessage(err) || "Could not load progress. Try again.",
      );
      setProgressData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const loadByMentor = useCallback(async () => {
    setByMentorLoading(true);
    setByMentorError(null);
    try {
      // Fetch all mentor/field-mentor users
      const mentorRes = await apiGetAllUsers({
        role: "field-mentor",
        roleMatch: "mixed",
        limit: 500,
      });
      let mentorUsers: any[] = mentorRes.data?.data?.users ?? [];
      // Fallback: also try broad mentor role if field-mentor returns nothing
      if (mentorUsers.length === 0) {
        const broadRes = await apiGetAllUsers({ role: "mentor", roleMatch: "mixed", limit: 500 });
        mentorUsers = broadRes.data?.data?.users ?? [];
      }

      const overallRes = await apiGetOverallProgress(["pastor"]);
      const overallRows = unwrapOverallProgressList(overallRes as unknown as { data?: unknown });
      const progressByUserId = new Map<string, Record<string, unknown>>();
      for (const row of overallRows) {
        const rowObj = row as unknown as Record<string, unknown>;
        const uid = extractUserIdFromOverallProgressRow(rowObj);
        if (!uid) continue;
        progressByUserId.set(uid, rowObj);
      }
      pastorProgressByIdRef.current = progressByUserId;

      const mentors: MentorListItem[] = mentorUsers
        .map((mentor: any, idx: number) => {
          const mentorId = String(mentor._id ?? mentor.id ?? "");
          if (!mentorId) return null;
          const rawPic = mentor?.profilePicture;

          const mentorName = `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor";
const mentorImage =
  typeof rawPic === "string" && rawPic.trim()
    ? (resolveApiMediaUrl(rawPic) ?? rawPic)
    : getInitialsAvatar(mentorName, "Mentor");
          return {
            mentorId,
            // mentorName: `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor",
            mentorName,
            mentorRole: mentor.role ?? "Field Mentor",
            mentorImage,
          };
        })
        .filter((m): m is MentorListItem => m != null)
        .sort((a, b) => a.mentorName.localeCompare(b.mentorName));

      setMentorList(mentors);
      setMentorGroupCache({});
      setByMentorPage(1);
    } catch (err) {
      setByMentorError(extractApiErrorMessage(err) || "Could not load grouped data.");
    } finally {
      setByMentorLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mentorList.length === 0 && !byMentorLoading) {
      void loadByMentor();
    }
  }, [mentorList.length, byMentorLoading, loadByMentor]);

  const inProgressCount = useMemo(
    () => progressData.filter((p) => p.progress < 100).length,
    [progressData],
  );

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return progressData.filter((item) => {
      const matchesSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        item.userId.toLowerCase().includes(q);
      const matchesFilter =
        activeTab === "all" ||
        (activeTab === "in-progress" && item.progress < 100) ||
        (activeTab === "completed" && item.progress === 100);
      return matchesSearch && matchesFilter;
    });
  }, [progressData, activeTab, searchQuery]);

  const mentorAvatarItems: FeaturedAvatarItem[] = useMemo(
    () =>
      mentorList.map((m) => ({
        id: m.mentorId,
        name: m.mentorName,
        img: m.mentorImage,
      })),
    [mentorList],
  );

  const filteredMentors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const base = selectedMentorId
      ? mentorList.filter((g) => g.mentorId === selectedMentorId)
      : mentorList;
    return base.filter((g) => {
      if (!q) return true;
      return (
        g.mentorName.toLowerCase().includes(q) ||
        g.mentorRole.toLowerCase().includes(q)
      );
    });
  }, [mentorList, searchQuery, selectedMentorId]);

  const byMentorTotalPages = Math.max(
    1,
    Math.ceil(filteredMentors.length / BY_MENTOR_PAGE_SIZE),
  );
  const byMentorCurrentPage = Math.min(byMentorPage, byMentorTotalPages);
  const byMentorStart = (byMentorCurrentPage - 1) * BY_MENTOR_PAGE_SIZE;
  const visibleMentorSlice = filteredMentors.slice(
    byMentorStart,
    byMentorStart + BY_MENTOR_PAGE_SIZE,
  );

  const visibleMentorGroups = useMemo(
    () =>
      visibleMentorSlice.map((mentor) =>
        mentorGroupCache[mentor.mentorId] ?? {
          ...mentor,
          mentees: [],
          expanded: true,
        },
      ),
    [visibleMentorSlice, mentorGroupCache],
  );

  const visibleMentorGroupsWithFilters = useMemo(() => {
    const menteeQuery = selectedMentorId ? searchQuery.trim().toLowerCase() : "";
    return visibleMentorGroups.map((group) => ({
      ...group,
      mentees: group.mentees.filter((mentee) => {
        const matchesTab =
          activeTab === "all" ||
          (activeTab === "in-progress" && mentee.progress < 100) ||
          (activeTab === "completed" && mentee.progress === 100);
        const matchesQuery =
          !menteeQuery ||
          mentee.fullName.toLowerCase().includes(menteeQuery) ||
          mentee.role.toLowerCase().includes(menteeQuery) ||
          mentee.userId.toLowerCase().includes(menteeQuery);
        return matchesTab && matchesQuery;
      }),
    }));
  }, [visibleMentorGroups, selectedMentorId, searchQuery, activeTab]);

  const flatTotalPages = Math.max(1, Math.ceil(filteredData.length / FLAT_PAGE_SIZE));
  const flatCurrentPage = Math.min(flatPage, flatTotalPages);
  const flatStart = (flatCurrentPage - 1) * FLAT_PAGE_SIZE;
  const flatVisible = filteredData.slice(flatStart, flatStart + FLAT_PAGE_SIZE);

  const loadByMentorPage = useCallback(async (mentorsToLoad: MentorListItem[]) => {
    if (mentorsToLoad.length === 0) return;
    setByMentorPageLoading(true);
    try {
      const next: Record<string, MentorGroup> = {};
      for (const mentor of mentorsToLoad) {
        let assignedUsers: any[] = [];
        try {
          const assignedRes = await apiGetAssignedUsers(mentor.mentorId);
          assignedUsers = Array.isArray(assignedRes.data?.data) ? assignedRes.data.data : [];
        } catch {
          assignedUsers = [];
        }

        const mentees: MenteeItem[] = assignedUsers
          .map((u: any, ui: number) => {
            const uid = String(u._id ?? u.id ?? "");
            if (!uid) return null;
            const name = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pastor";
            const rawPastor = u?.profilePicture;

            const profileImage =
  typeof rawPastor === "string" && rawPastor.trim()
    ? (resolveApiMediaUrl(rawPastor) ?? rawPastor)
    : getInitialsAvatar(name, "Pastor");
            const pd = pastorProgressByIdRef.current.get(uid);
            return {
              userId: uid,
              fullName: name,
              role: u.role ?? "pastor",
              progress: Math.round(
                Math.min(100, Math.max(0, numFromApi(pd?.overallProgress ?? pd?.overall_progress))),
              ),
              roadmapDone: numFromApi(pd?.completedRoadmaps ?? pd?.completed_roadmaps),
              roadmapTotal: numFromApi(pd?.totalRoadmaps ?? pd?.total_roadmaps),
              assessmentDone: numFromApi(pd?.completedAssessments ?? pd?.completed_assessments),
              assessmentTotal: numFromApi(pd?.totalAssessments ?? pd?.total_assessments),
              profileImage,
            };
          })
          .filter((m): m is MenteeItem => m != null);

        next[mentor.mentorId] = {
          ...mentor,
          mentees,
          expanded: true,
        };
      }

      setMentorGroupCache((prev) => {
        const merged = { ...prev };
        for (const [mentorId, group] of Object.entries(next)) {
          const existing = prev[mentorId];
          merged[mentorId] = {
            ...group,
            expanded: existing?.expanded ?? true,
          };
        }
        return merged;
      });
    } finally {
      setByMentorPageLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode !== "by-mentor") return;
    setByMentorPage(1);
  }, [searchQuery, viewMode]);

  useEffect(() => {
    if (viewMode === "by-mentor") {
      setFlatPage(1);
      return;
    }
    setFlatPage(1);
  }, [searchQuery, activeTab, viewMode]);

  useEffect(() => {
    if (viewMode === "by-mentor") {
      setByMentorPage(1);
    }
  }, [selectedMentorId, viewMode]);

  useEffect(() => {
    if (viewMode !== "by-mentor" && selectedMentorId) {
      setSelectedMentorId(null);
    }
  }, [viewMode, selectedMentorId]);

  useEffect(() => {
    if (viewMode !== "by-mentor" || byMentorLoading) return;
    const missing = visibleMentorSlice.filter((m) => !mentorGroupCache[m.mentorId]);
    if (missing.length === 0) return;
    void loadByMentorPage(missing);
  }, [
    viewMode,
    byMentorLoading,
    visibleMentorSlice,
    mentorGroupCache,
    loadByMentorPage,
  ]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Track Progress"
        subtitle="Monitor mentor and pastor completion across roadmaps and assessments."
        image={ProgressBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Track Progress" },
        ]}
      />

      <section className="relative py-4 md:py-6">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 w-full sm:max-w-[min(420px,100%)]">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, role, or email…"
                className="w-full"
                variant="dark"
              />
            </div>
            <div className="flex shrink-0 justify-end gap-2 sm:pl-2">
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
              <button
                type="button"
                onClick={() => setViewMode("by-mentor")}
                aria-pressed={viewMode === "by-mentor"}
                className={`flex h-11 w-11 items-center justify-center rounded-lg border text-[#8ec5eb] transition hover:bg-white/15 ${
                  viewMode === "by-mentor"
                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/20"
                    : "border-white/15 bg-white/10"
                }`}
                aria-label="Group by mentor"
                title="Group by mentor"
              >
                <i className="fa-solid fa-sitemap" />
              </button>
            </div>
          </div>

          {!byMentorLoading && mentorAvatarItems.length > 0 ? (
            <div className="mb-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm text-white/75">Mentors</p>
                {selectedMentorId ? (
                  <button
                    type="button"
                    onClick={() => setSelectedMentorId(null)}
                    className="rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Clear filter
                  </button>
                ) : null}
              </div>
              <FeaturedAvatars
                items={mentorAvatarItems}
                selectedId={selectedMentorId}
                showDivider
                className="mb-2"
                onItemClick={(item) => {
                  const id = String(item.id);
                  setSelectedMentorId((prev) => (prev === id ? null : id));
                  setViewMode("by-mentor");
                }}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="relative pb-6 pt-2 md:pb-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-stretch gap-4">
          <div
            className={`scrollbar-hide flex gap-1.5 overflow-x-auto rounded-xl p-1.5 sm:gap-2 ${directorGlassCard}`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                activeTab === "all"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("in-progress")}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                activeTab === "in-progress"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              <span>In-Progress</span>
              {activeTab === "in-progress" && inProgressCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FFD700] px-1.5 text-[11px] font-bold text-[#0f4a76]">
                  {inProgressCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("completed")}
              className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[13px] font-semibold transition-all duration-200 sm:px-7 sm:text-[14px] ${
                activeTab === "completed"
                  ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                  : "text-white/65 hover:text-white"
              }`}
            >
              Completed
            </button>
          </div>
        </div>
      </section>

      <section className="py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">

          {/* ── By-Mentor grouped view ── */}
          {viewMode === "by-mentor" ? (
            byMentorLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
                <p className="text-lg font-medium text-white">Loading mentor groups…</p>
              </div>
            ) : byMentorError ? (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-4 text-center">
                <p className="text-sm text-red-100">{byMentorError}</p>
                <button
                  type="button"
                  onClick={() => void loadByMentor()}
                  className="mt-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Retry
                </button>
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className={`${directorGlassCard} mx-auto max-w-lg px-8 py-14 text-center`}>
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">
                  <i className="fa-solid fa-sitemap text-3xl text-[#8ec5eb]/80" aria-hidden />
                </div>
                <p className="text-base font-semibold text-white sm:text-lg">
                  {mentorList.length === 0 ? "No mentors found" : "No matching mentors"}
                </p>
                <p className="mt-2 text-sm text-white/55">
                  {mentorList.length === 0
                    ? "No field mentors with assigned mentees yet."
                    : "Try a different search term."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {byMentorPageLoading ? (
                  <p className="text-sm text-white/65">Loading mentors for this page…</p>
                ) : null}
                {visibleMentorGroupsWithFilters.map((group) => (
                    <div
                      key={group.mentorId}
                      className={`overflow-hidden rounded-2xl border border-white/15 ${directorGlassCard}`}
                    >
                      {/* Mentor header */}
                      <button
                        type="button"
                        className="flex w-full items-center gap-4 p-5 text-left transition hover:bg-white/5"
                        onClick={() =>
                          setMentorGroupCache((prev) => ({
                            ...prev,
                            [group.mentorId]: {
                              ...group,
                              expanded: !group.expanded,
                            },
                          }))
                        }
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/15">
                          {typeof group.mentorImage === "string" ? (
                            <Image
                              src={group.mentorImage}
                              alt={group.mentorName}
                              fill
                              className="object-cover"
                              unoptimized={isRemoteImageSrc(group.mentorImage)}
                            />
                          ) : (
                            <Image
                              src={group.mentorImage}
                              alt={group.mentorName}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-semibold text-white">{group.mentorName}</p>
                          <p className="text-sm capitalize text-[#8ec5eb]/80">{group.mentorRole}</p>
                        </div>
                        <span className="mr-2 rounded-full border border-[#8ec5eb]/30 bg-[#8ec5eb]/15 px-3 py-1 text-xs font-semibold text-[#cde2f2]">
                          {group.mentees.length} mentee{group.mentees.length !== 1 ? "s" : ""}
                        </span>
                        <i
                          className={`fa-solid fa-chevron-down text-[#8ec5eb]/70 transition-transform duration-200 ${
                            group.expanded ? "rotate-180" : ""
                          }`}
                          aria-hidden
                        />
                      </button>

                      {/* Mentee list */}
                      {group.expanded && (
                        <div className="border-t border-white/10 px-5 pb-5 pt-4">
                          {group.mentees.length === 0 ? (
                            <p className="py-4 text-center text-sm text-white/40">No mentees assigned yet.</p>
                          ) : (
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                              {group.mentees.map((mentee) => (
                                <div
                                  key={mentee.userId}
                                  role="button"
                                  tabIndex={0}
                                  aria-label={`View ${mentee.fullName}'s progress`}
                                  onClick={() =>
                                    router.push(
                                      `/director/track-progress/${encodeURIComponent(mentee.userId)}`,
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      router.push(
                                        `/director/track-progress/${encodeURIComponent(mentee.userId)}`,
                                      );
                                    }
                                  }}
                                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
                                >
                                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10">
                                    {typeof mentee.profileImage === "string" ? (
                                      <Image
                                        src={mentee.profileImage}
                                        alt={mentee.fullName}
                                        fill
                                        className="object-cover"
                                        unoptimized={isRemoteImageSrc(mentee.profileImage)}
                                      />
                                    ) : (
                                      <Image
                                        src={mentee.profileImage}
                                        alt={mentee.fullName}
                                        fill
                                        className="object-cover"
                                      />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">
                                      {mentee.fullName}
                                    </p>
                                    <p className="truncate text-xs capitalize text-[#8ec5eb]/70">
                                      {mentee.role}
                                    </p>
                                    {/* Progress bar */}
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <div className="h-1.5 flex-1 rounded-full bg-white/10">
                                        <div
                                          className="h-1.5 rounded-full bg-[#38bdf8] transition-all duration-500"
                                          style={{ width: `${mentee.progress}%` }}
                                        />
                                      </div>
                                      <span className="text-[11px] font-bold tabular-nums text-white">
                                        {mentee.progress}%
                                      </span>
                                    </div>
                                    {/* Stat pills */}
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                      <span className="inline-flex items-center gap-1 rounded border border-[#8ec5eb]/20 bg-[#8ec5eb]/10 px-1.5 py-0.5 text-[10px] text-[#cde2f2]">
                                        <i className="fa-solid fa-map-signs text-[9px] text-[#8ec5eb]" aria-hidden />
                                        Roadmaps {mentee.roadmapDone}/{mentee.roadmapTotal}
                                      </span>
                                      <span className="inline-flex items-center gap-1 rounded border border-[#8ec5eb]/20 bg-[#8ec5eb]/10 px-1.5 py-0.5 text-[10px] text-[#cde2f2]">
                                        <i className="fa-solid fa-clipboard-list text-[9px] text-[#8ec5eb]" aria-hidden />
                                        Surveys {mentee.assessmentDone}/{mentee.assessmentTotal}
                                      </span>
                                    </div>
                                  </div>
                                  <i className="fa-solid fa-chevron-right text-xs text-white/30" aria-hidden />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                {byMentorTotalPages > 1 ? (
                  <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#cde2f2] sm:flex-row">
                    <p>
                      Showing {byMentorStart + 1}-
                      {Math.min(byMentorStart + BY_MENTOR_PAGE_SIZE, filteredMentors.length)} of {filteredMentors.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={byMentorCurrentPage <= 1}
                        onClick={() => setByMentorPage((p) => Math.max(1, p - 1))}
                        className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-semibold text-white">
                        Page {byMentorCurrentPage} / {byMentorTotalPages}
                      </span>
                      <button
                        type="button"
                        disabled={byMentorCurrentPage >= byMentorTotalPages}
                        onClick={() => setByMentorPage((p) => Math.min(byMentorTotalPages, p + 1))}
                        className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
              <p className="text-lg font-medium text-white">Loading progress…</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-4 text-center">
              <p className="text-sm text-red-100">{error}</p>
              <button
                type="button"
                onClick={() => void loadProgress()}
                className="mt-3 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Retry
              </button>
            </div>
          ) : filteredData.length === 0 ? (
            <div
              className={`${directorGlassCard} mx-auto max-w-lg px-8 py-14 text-center`}
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06]">
                <i
                  className="fa-solid fa-chart-line text-3xl text-[#8ec5eb]/80"
                  aria-hidden
                />
              </div>
              <p className="text-base font-semibold text-white sm:text-lg">
                {progressData.length === 0
                  ? "No progress data yet"
                  : "No matching users"}
              </p>
              <p className="mt-2 text-sm text-white/55">
                {progressData.length === 0
                  ? "When mentors and pastors have activity, their completion will appear here."
                  : "Try a different search or switch the filter above."}
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-4"
                  : "grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5"
              }
            >
              {flatVisible.map((item) => (
                <div
                  key={item.userId}
                  className={viewMode === "list" ? "min-w-0" : "h-full min-w-0"}
                >
                  <ProgressCard
                    variant="directorGlass"
                    image={item.profileImage}
                    name={item.fullName}
                    description={item.role}
                    progress={item.progress}
                    slug={item.userId}
                    showCompleteButton={false}
                    // onEmailClick={(e) => e.stopPropagation()}
                    // onMessageClick={(e) => e.stopPropagation()}
                    // onWhatsAppClick={(e) => e.stopPropagation()}
                    // onPhoneClick={(e) => e.stopPropagation()}
                    onEmailClick={(e) => {
  e.stopPropagation();
  if (!item.email) return;

window.location.href = `mailto:${item.email}?subject=${encodeURIComponent(
  "Community Change Progress",
)}`;
}}
                  />
                </div>
              ))}
            </div>
          )}
          {viewMode !== "by-mentor" && !loading && filteredData.length > 0 && flatTotalPages > 1 ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#cde2f2] sm:flex-row">
              <p>
                Showing {flatStart + 1}-{Math.min(flatStart + FLAT_PAGE_SIZE, filteredData.length)} of {filteredData.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={flatCurrentPage <= 1}
                  onClick={() => setFlatPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-white">
                  Page {flatCurrentPage} / {flatTotalPages}
                </span>
                <button
                  type="button"
                  disabled={flatCurrentPage >= flatTotalPages}
                  onClick={() => setFlatPage((p) => Math.min(flatTotalPages, p + 1))}
                  className="rounded-md border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] transition hover:bg-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
