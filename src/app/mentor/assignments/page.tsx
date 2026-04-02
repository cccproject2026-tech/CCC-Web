"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import {
  fetchRoadmapAssignmentsForUser,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";

const glassPanel =
  "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_24px_56px_rgba(2,20,38,0.18)]";

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
        const rows = await fetchRoadmapAssignmentsForUser(String(mentorId));
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#062946] font-[Albert_Sans] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />

      <div className="relative z-10">
        <MentorHeader showFullHeader={true} />

        <section
          className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
          style={{ backgroundImage: `url(${HeroBg.src})` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.75)_0%,rgba(6,41,70,0.6)_45%,rgba(6,41,70,1)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <h1 className="text-2xl font-semibold sm:text-3xl">Assignments</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">Roadmap tasks from your assigned program (API).</p>
          </div>
        </section>

        <main className="flex-1 px-4 pb-16 sm:px-8 lg:px-20">
          <div className="mx-auto max-w-7xl">
            {error && (
              <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                {error}
              </p>
            )}

            <div className={`mb-8 ${glassPanel} p-4 sm:p-5`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="relative md:w-[380px]">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search assignments..."
                    className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/60 focus:border-[#8ec5eb]/60"
                  />
                </div>

                <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm">
                  {(["New", "Due", "Completed"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          isActive ? "bg-[#8ec5eb]/20 text-white" : "text-[#cde2f2] hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {loading && (
              <div className="py-16 text-center text-sm text-[#cde2f2]">Loading assignments…</div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="py-14 text-center text-white/80">No assignments found for this filter.</div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filtered.map((a) => {
                  const hasImg = isHttpUrl(a.imageUrl);
                  return (
                    <div
                      key={`${a.parentRoadmapId}-${a.id}`}
                      className="rounded-2xl border border-white/15 bg-white/5 p-5 transition hover:bg-white/10"
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
                          className="rounded-xl bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
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
        <PastorFooter />
      </div>
    </div>
  );
}
