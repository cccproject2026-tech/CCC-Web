"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { resolveApiMediaUrl } from "@/app/utils/image";
import {
  apiGetOverallProgress,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
} from "@/app/Services/progress.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import type { UserOverallProgress } from "@/app/Services/types";

const PLACEHOLDER_IMAGES = [Mentor1, Mentor2, Mentor3] as const;

type ProgressListItem = {
  userId: string;
  fullName: string;
  role: string;
  progress: number;
  profileImage: string | (typeof PLACEHOLDER_IMAGES)[number];
};

function imageForItem(
  profilePicture: string | undefined,
  index: number,
): string | (typeof PLACEHOLDER_IMAGES)[number] {
  if (typeof profilePicture === "string" && profilePicture.trim()) {
    return resolveApiMediaUrl(profilePicture) ?? profilePicture;
  }
  return PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
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
    profileImage: imageForItem(item.profilePicture, index),
  };
}

export default function TrackProgressPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "in-progress" | "completed">(
    "in-progress",
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [progressData, setProgressData] = useState<ProgressListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetOverallProgress(["mentor", "pastor"]);
      const rows = unwrapOverallProgressList(res);
      setProgressData(
        rows
          .map((r, i) => normalizeRow(r, i))
          .filter((x): x is ProgressListItem => x != null),
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

  const featuredItems: FeaturedAvatarItem[] = useMemo(
    () =>
      progressData.slice(0, 6).map((m) => ({
        id: m.userId,
        name: m.fullName,
        img: m.profileImage,
      })),
    [progressData],
  );

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
            </div>
          </div>

          {!loading && featuredItems.length > 0 && (
            <FeaturedAvatars
              items={featuredItems}
              showDivider
              className="mb-2"
              onItemClick={(item) =>
                router.push(
                  `/director/track-progress/${encodeURIComponent(String(item.id))}`,
                )
              }
            />
          )}
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
          {loading ? (
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
              {filteredData.map((item) => (
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
                    onEmailClick={(e) => e.stopPropagation()}
                    onMessageClick={(e) => e.stopPropagation()}
                    onWhatsAppClick={(e) => e.stopPropagation()}
                    onPhoneClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
