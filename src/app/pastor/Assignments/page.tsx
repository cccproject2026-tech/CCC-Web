"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import { getCookie } from "@/app/utils/cookies";
import {
  fetchRoadmapAssignmentsForUser,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

export default function PastorAssignments() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"New" | "Due" | "Completed">("New");
  const [searchTerm, setSearchTerm] = useState("");
  const [assignments, setAssignments] = useState<RoadmapAssignmentUi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = getCookie("user");
        if (!raw) {
          setError("Not signed in.");
          return;
        }
        const user = JSON.parse(raw) as { id?: string; _id?: string };
        const userId = user.id || user._id;
        if (!userId) {
          setError("User id missing.");
          return;
        }
        const rows = await fetchRoadmapAssignmentsForUser(String(userId));
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#062946] text-white">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_20%_10%,rgba(141,211,243,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex h-[250px] items-end justify-start bg-cover bg-center px-4 pb-6 sm:px-8 sm:pb-8 md:px-16 md:pb-12"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(141,211,243,0.2),transparent_35%),linear-gradient(180deg,rgba(4,31,53,0.74)_0%,rgba(6,41,70,0.9)_100%)]" />
        <h1 className="relative z-10 mb-1 text-2xl font-semibold text-white sm:text-4xl">Assignments</h1>
      </section>

      <main className="flex-1 bg-transparent px-4 pb-20 pt-10 md:px-10 md:pt-16 lg:px-16">
        <div className="mx-auto max-w-7xl">
          {error && (
            <p className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </p>
          )}

          <div className="mb-10 flex flex-col items-stretch justify-between gap-5 md:flex-row md:items-center">
            <div className="relative w-full md:w-[350px]">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 transform text-sm text-[#cde2f2]" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white shadow-sm outline-none placeholder:text-[#cde2f2] focus:ring-2 focus:ring-[#8ec5eb]"
              />
            </div>

            <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm">
              {(["New", "Due", "Completed"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-[#8ec5eb] text-[#062946]"
                      : "text-[#cde2f2] hover:bg-white/10"
                  }`}
                >
                  {tab}
                  {tab === "Due" && <span className="ml-1 text-[13px]">🟡</span>}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#cde2f2]">
              No assignments match this filter. Roadmap tasks from the API will appear here.
            </p>
          ) : (
            <div className="flex flex-wrap justify-between gap-y-8">
              {filtered.map((item) => {
                const hasImg = isHttpUrl(item.imageUrl);
                return (
                  <div
                    key={`${item.parentRoadmapId}-${item.id}`}
                    className="flex w-full flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:shadow-lg md:w-[48%] md:flex-row"
                  >
                    <div className="relative m-3 h-[150px] w-full flex-shrink-0 sm:m-5 md:m-3 md:h-[200px] md:w-[200px]">
                      {hasImg ? (
                        <Image
                          src={item.imageUrl!}
                          alt=""
                          width={200}
                          height={200}
                          className="h-full w-full rounded-lg object-cover"
                          unoptimized
                        />
                      ) : (
                        <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                      )}
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5 sm:p-3">
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
                          {item.parentRoadmapName}
                        </p>
                        <h3 className="mb-1 text-[17px] font-semibold leading-tight text-white sm:text-base">
                          {item.title}
                        </h3>
                        <p className="mb-3 text-sm text-[#cde2f2] sm:text-xs">{item.desc}</p>

                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-xs font-medium text-[#cde2f2] sm:text-[10px]">Status</span>
                          <span className="rounded bg-[#8ec5eb]/20 px-2 py-[2px] text-xs font-medium text-[#d9ebf8] sm:text-[10px]">
                            {item.status}
                          </span>
                        </div>

                        {item.meetings && item.meetings.length > 0 && (
                          <div className="mb-3 flex flex-wrap gap-4">
                            {item.meetings.map((date, i) => (
                              <div key={i} className="flex flex-col">
                                <p className="text-[12px] text-[#cde2f2] sm:text-[10px]">
                                  Meeting {i + 1}
                                </p>
                                <div className="mt-1 min-w-[120px] rounded-md border border-white/20 bg-white/10 px-3 py-[6px] text-center text-[12px] text-[#e4f1fb] sm:min-w-[100px] sm:text-[10px]">
                                  {date}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div>
                          <p className="text-[12px] text-[#cde2f2] sm:text-[10px]">Completion Time</p>
                          <p className="text-sm font-medium text-white sm:text-xs">Months {item.months}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => router.push(`/pastor/jumpstart?id=${item.id}`)}
                          className="rounded-lg bg-[#8ec5eb] px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2] sm:px-4 sm:text-xs"
                        >
                          View
                        </button>
                      </div>
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
  );
}
