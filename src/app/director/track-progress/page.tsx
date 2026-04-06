"use client";
import { useEffect, useMemo, useState } from "react";
import ProgressCard from "@/app/Components/Card/ProgressCard";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorInputClass, directorPageRoot } from "../directorUi";
import ProgressBg from "../../Assets/progress-bg.jpg";
import Mentor1 from "../../Assets/mentor1.png";
import {
  apiGetOverallProgress,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
} from "@/app/Services/progress.service";
import type { UserOverallProgress } from "@/app/Services/types";

type ProgressListItem = {
  userId: string;
  fullName: string;
  role: string;
  progress: number;
  profileImage?: string;
};

function normalizeRow(item: UserOverallProgress): ProgressListItem | null {
  const userId = extractUserIdFromOverallProgressRow(item);
  if (!userId) return null;
  const fullName = `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() || item.email || "Unknown";
  return {
    userId,
    fullName,
    role: item.role ?? "—",
    progress: Math.round(Math.min(100, Math.max(0, item.overallProgress ?? 0))),
    profileImage: item.profilePicture,
  };
}

export default function TrackProgressPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [progressData, setProgressData] = useState<ProgressListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiGetOverallProgress()
      .then((res) => {
        const rows = unwrapOverallProgressList(res);
        const normalized = rows.map(normalizeRow).filter((x): x is ProgressListItem => x != null);
        if (!cancelled) setProgressData(normalized);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Could not load progress.");
          setProgressData([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

      <section className="relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1400px]">
          <div className={`mb-8 p-4 sm:p-5 ${directorGlassCard}`}>
            <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
              <div className="relative w-full flex-1 md:max-w-md">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70" />
                <input
                  type="text"
                  placeholder="Search by name, role, or id"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${directorInputClass} pl-11`}
                />
              </div>

              <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1">
                {[
                  { id: "all", label: "All" },
                  { id: "in-progress", label: "In progress" },
                  { id: "completed", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative h-8 rounded-md px-4 text-sm font-semibold capitalize transition-all ${
                      activeTab === tab.id
                        ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                        : "bg-transparent text-white/70 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
              <p className="text-sm text-white/60">Loading progress…</p>
            </div>
          ) : error ? (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">{error}</p>
          ) : null}

          {!loading && !error && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filteredData.map((item) => (
                <ProgressCard
                  key={item.userId}
                  variant="directorGlass"
                  image={item.profileImage || Mentor1}
                  name={item.fullName}
                  description={item.role}
                  progress={item.progress}
                  slug={item.userId}
                  showCompleteButton={item.progress === 100}
                  onCompleteClick={(e) => {
                    e.stopPropagation();
                  }}
                  onEmailClick={(e) => {
                    e.stopPropagation();
                  }}
                  onMessageClick={(e) => {
                    e.stopPropagation();
                  }}
                  onWhatsAppClick={(e) => {
                    e.stopPropagation();
                  }}
                  onPhoneClick={(e) => {
                    e.stopPropagation();
                  }}
                />
              ))}
            </div>
          )}

          {!loading && !error && filteredData.length === 0 && (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <i className="fa-regular fa-folder-open text-4xl text-white/50"></i>
              </div>
              <p className="text-lg text-white/80">
                {progressData.length === 0 ? "No progress data yet." : "No entries match your search or filter."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
