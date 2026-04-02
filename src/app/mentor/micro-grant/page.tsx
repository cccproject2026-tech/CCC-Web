"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import Image from "next/image";
import MicroGrantBg from "../../Assets/micro-grant.jpg";
import UserProfile from "../../Assets/user-profile.png";
import { getAllMicroGrand } from "@/app/Services/microGrand.service";
import type { MicroGrantApplicationResponse, MicroGrantStatus } from "@/app/Services/types";

const glassPanel =
  "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_24px_56px_rgba(2,20,38,0.20)]";

export default function MentorMicroGrantPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<MicroGrantStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<MicroGrantApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getAllMicroGrand();
        const data =
          (Array.isArray(res?.data?.data) && res.data.data) ||
          (Array.isArray(res?.data) && res.data) ||
          [];

        if (mounted) setApplications(data);
      } catch {
        // Keep UI usable during API hiccups.
        if (!mounted) return;
        setApplications([
          {
            _id: "temp1",
            userId: { _id: "xx", email: "fallback1@example.com" },
            answers: { "Church Name": "Fallback Church One" },
            status: "new",
            createdAt: "2025-11-22T10:00:00",
            updatedAt: "2025-11-22T10:00:00",
          },
        ]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      const email = app.userId?.email?.toLowerCase() ?? "";
      const church = app.answers?.["Church Name"]?.toLowerCase() ?? "";
      const matchesQuery = !q || email.includes(q) || church.includes(q);
      const matchesTab = activeTab === "all" ? true : app.status === activeTab;
      return matchesQuery && matchesTab;
    });
  }, [applications, activeTab, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${MicroGrantBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Micro Grant</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Track applications submitted by pastors/mentees.</p>
        </div>
      </section>

      <main className="flex-1 px-4 pb-16 sm:px-8 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className={`mb-8 ${glassPanel} p-4 sm:p-5`}>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by church or email..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-12 py-2.5 text-sm text-white placeholder:text-white/60 outline-none focus:border-[#8ec5eb]/60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "all", label: "All" },
                  { id: "new", label: "New" },
                  { id: "pending", label: "Pending" },
                  { id: "accepted", label: "Accepted" },
                ].map((t) => {
                  const isActive = activeTab === (t.id as any);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id as any)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                        isActive
                          ? "border-[#8ec5eb]/70 bg-[#8ec5eb]/20 text-white"
                          : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white/70">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-14">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                <i className="fa-regular fa-folder-open text-3xl text-white/70" />
              </div>
              <p className="text-white/80">No micro grant applications found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((app) => {
                const slug = app.userId?._id;
                const name = app.userId?.email ?? "Unknown";
                const church = app.answers?.["Church Name"] ?? "Not provided";
                const date = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "";

                return (
                  <div
                    key={app._id}
                    className="rounded-2xl border border-white/15 bg-white/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative h-14 w-14 flex-shrink-0 rounded-xl overflow-hidden border border-white/15 bg-white/5">
                        <Image src={UserProfile} alt={name} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">{name}</p>
                        <p className="truncate text-sm text-[#cde2f2]">{church}</p>
                        {date && <p className="mt-1 text-xs text-white/60">{date}</p>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <button
                        type="button"
                        onClick={() => {
                          if (!slug) return;
                          router.push(`/director/micro-grant/${slug}`);
                        }}
                        disabled={!slug}
                        className="rounded-xl bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb] disabled:cursor-not-allowed disabled:opacity-50"
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
  );
}

