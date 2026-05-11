"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "@/app/Assets/assignments-bg.png";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorBodyText,
  mentorControlsRow,
  mentorFilterPanel,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSpinner,
  mentorWarningPanel,
  mentorEmptyPanel,
} from "@/app/Components/mentor/mentor-theme";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import {
  fetchRoadmapAssignmentsForUser,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

export default function MentorAssignmentsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"New" | "Due" | "Completed">("New");
  const [searchTerm, setSearchTerm] = useState("");
  const [assignments, setAssignments] = useState<RoadmapAssignmentUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentorUserId, setMentorUserId] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) {
          setError("Sign in as a mentor to see assignments.");
          return;
        }
        setMentorUserId(String(mentorId));
        const rows = await fetchRoadmapAssignmentsForUser(String(mentorId), {
          mode: "mentor-catalog",
        });
        setAssignments(rows);
      } catch (e) {
        console.error(e);
        setError("Could not load assignments.");
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return assignments.filter((a) => {
      const matchesQ =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.desc.toLowerCase().includes(q) ||
        a.parentRoadmapName.toLowerCase().includes(q);
      const matchesTab =
        activeTab === "New"
          ? a.status === "Not Started"
          : activeTab === "Due"
            ? a.status === "Due"
            : a.status === "Completed";
      return matchesQ && matchesTab;
    });
  }, [assignments, activeTab, searchTerm]);

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-0 pb-10 pt-4"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 w-full">
          <h1 className="text-2xl font-semibold sm:text-3xl">Assignments</h1>
          <p className={`mt-2 ${mentorBodyText}`}>Roadmap tasks from your assigned program (API).</p>
        </div>
      </section>

      <main className={`flex-1 px-0 pb-16 ${mentorMainGradient}`}>
        <div className="w-full">
          {error && <p className={`mb-4 ${mentorWarningPanel}`}>{error}</p>}

          <div className={`${mentorFilterPanel} mb-8`}>
            <div className={mentorControlsRow}>
              <MentorSearchBar
                variant="absolute"
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search assignments..."
                aria-label="Search assignments"
                className="w-full md:max-w-md"
              />
              <MentorFilterTabGroup
                tabs={["New", "Due", "Completed"] as const}
                active={activeTab}
                onChange={setActiveTab}
                aria-label="Assignment status"
                className="w-full md:w-auto"
              />
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading assignments…</p>
            </div>
          )}

            {!loading && filtered.length === 0 && (
              <div className={mentorEmptyPanel}>No assignments found for this filter.</div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filtered.map((a) => {
                  const hasImg = isHttpUrl(a.imageUrl);
                  return (
                    <div
                      key={`${a.parentRoadmapId}-${a.id}`}
                      className={`${mentorGlassCardRoadmap} flex-col p-5 sm:flex-col`}
                    >
                      <div className="flex gap-4">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-white/15">
                          {hasImg ? (
                            <Image
                              src={a.imageUrl!}
                              alt=""
                              width={80}
                              height={80}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            <ApiImagePlaceholder className="h-full w-full rounded-xl" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
                            {a.parentRoadmapName}
                          </p>
                          <h3 className="text-lg font-semibold">{a.title}</h3>
                          <p className="mt-1 line-clamp-3 text-sm text-[#cde2f2]">{a.desc}</p>
                          <span className="mt-2 inline-block rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-[#cde2f2]">
                            {a.status}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-white/60">Months {a.months}</p>
                        <button
                          type="button"
                          className={`${mentorPrimaryCta} px-4 py-2 text-sm`}
                          onClick={() =>
                            router.push(
                              `/mentor/RevitalizationRoadmap/task?roadmapId=${encodeURIComponent(a.parentRoadmapId)}&taskId=${encodeURIComponent(a.id)}&userId=${encodeURIComponent(mentorUserId)}`,
                            )
                          }
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </main>
    </div>
  );
}
