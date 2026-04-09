"use client";

import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import MicroGrantBg from "../../Assets/micro-grant.jpg";
import UserProfile from "../../Assets/user-profile.png";
import {
  getAllMicroGrand,
  microGrantListDetailSlug,
  unwrapMicroGrantApplicationsList,
} from "@/app/Services/microGrand.service";
import type { MicroGrantApplicationResponse } from "@/app/Services/types/microgrant.types";
import MicroGrantCard from "@/app/Components/Card/MicroGrantCard";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import {
  mentorBodyText,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorSpinner,
  mentorFilterPanel,
  mentorEmptyPanel,
  mentorSearchAbsoluteShell,
  mentorSearchIconAbsolute,
  mentorSearchInputAbsolute,
} from "@/app/Components/mentor/mentor-theme";

function applicantDisplayName(app: MicroGrantApplicationResponse): string {
  const u = app.userId;
  if (u && typeof u === "object") {
    const fn = u.firstName?.trim();
    const ln = u.lastName?.trim();
    if (fn || ln) return [fn, ln].filter(Boolean).join(" ");
    if (u.email) return u.email;
  }
  return "Unknown";
}

function churchLabel(app: MicroGrantApplicationResponse): string {
  const a = app.answers ?? {};
  return (
    a["Church Name"] ||
    a["Name of the church"] ||
    a["name of the church"] ||
    Object.values(a)[0] ||
    "Not provided"
  );
}

const TAB_LABELS = ["All", "New", "Pending", "Accepted"] as const;
type MentorMgTab = (typeof TAB_LABELS)[number];

export default function MentorMicroGrantPage() {
  const [activeTab, setActiveTab] = useState<MentorMgTab>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<MicroGrantApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await getAllMicroGrand();
        const list = unwrapMicroGrantApplicationsList(res);
        if (!cancelled) setApplications(list);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setApplications([]);
          setFetchError("Could not load applications. Try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      const email = app.userId?.email?.toLowerCase() ?? "";
      const church = churchLabel(app).toLowerCase();
      const name = applicantDisplayName(app).toLowerCase();
      const matchesQuery = !q || email.includes(q) || church.includes(q) || name.includes(q);
      const matchesTab =
        activeTab === "All" ? true : app.status === activeTab.toLowerCase();
      return matchesQuery && matchesTab;
    });
  }, [applications, activeTab, searchQuery]);

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-end bg-cover bg-top px-4 pb-10 pt-10 sm:min-h-[240px] md:px-20"
        style={{ backgroundImage: `url(${MicroGrantBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Micro grant</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            Review applications submitted by pastors and mentees. Open <strong className="font-semibold text-white">View</strong>{" "}
            to see the full cover sheet and reporting notes.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 pb-16 pt-8 md:px-16 lg:px-20`}>
        <div className="mx-auto max-w-7xl">
          <div className={`${mentorFilterPanel} mb-8`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className={`${mentorSearchAbsoluteShell} lg:max-w-md`}>
                <i className={mentorSearchIconAbsolute} />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or church…"
                  className={mentorSearchInputAbsolute}
                  aria-label="Search applications"
                />
              </div>
              <MentorFilterTabGroup
                tabs={TAB_LABELS}
                active={activeTab}
                onChange={(id) => setActiveTab(id)}
                aria-label="Filter by status"
                className="w-full lg:w-auto"
              />
            </div>
          </div>

          {fetchError ? (
            <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {fetchError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading applications…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={mentorEmptyPanel}>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/5">
                <i className="fa-regular fa-folder-open text-3xl text-[#8ec5eb]/80" />
              </div>
              <p className={mentorBodyText}>
                {applications.length === 0
                  ? "No micro grant applications yet."
                  : "No applications match your search or filter."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((app) => {
                const viewSlug = microGrantListDetailSlug(app);
                return (
                  <MicroGrantCard
                    key={app._id}
                    image={UserProfile}
                    name={applicantDisplayName(app)}
                    role={churchLabel(app)}
                    date={app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}
                    slug={viewSlug}
                    detailBasePath="/mentor/micro-grant"
                    appearance="navy"
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
