"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import DirectorHero from "../DirectorHero";
import { directorBtnSecondary, directorPageContainer, directorPageRoot } from "../directorUi";
import { DirectorFilterSection } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import MicroGrantCard from "@/app/Components/Card/MicroGrantCard";
import MicroGrantBg from "../../Assets/micro-grant.jpg";
import UserProfile from "@/app/Assets/user-profile.png";
import {
  getAllMicroGrand,
  getMicroGrantApplicantEmail,
  microGrantListDetailSlug,
  unwrapMicroGrantApplicationsList,
} from "@/app/Services/microGrand.service";
import type { MicroGrantApplicationResponse } from "@/app/Services/types";

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

function applicantProfileImage(app: MicroGrantApplicationResponse): string {
  const user = app.userId as any;

  if (user && typeof user === "object" && user.profilePicture) {
    return String(user.profilePicture);
  }

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    applicantDisplayName(app) || "User"
  )}&background=173653&color=ffffff`;
}

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("new");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [applications, setApplications] = useState<MicroGrantApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();

  const tabs = useMemo(() => {
    const counts = applications.reduce(
      (acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
    return [
      { id: "new", label: "New", count: counts.new ?? 0 },
      { id: "pending", label: "Pending", count: counts.pending ?? 0 },
      { id: "accepted", label: "Accepted", count: counts.accepted ?? 0 },
    ];
  }, [applications]);

  useEffect(() => {
    let cancelled = false;
    async function fetchApplications() {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await getAllMicroGrand();
        const list = unwrapMicroGrantApplicationsList(res);
        if (!cancelled) setApplications(list);
      } catch (e) {
        console.error("Micro grant applications fetch failed", e);
        if (!cancelled) {
          setApplications([]);
          setFetchError("Could not load applications. Try again later.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchApplications();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return applications.filter((app) => {
      const email = getMicroGrantApplicantEmail(app)?.toLowerCase() || "";
      const church = churchLabel(app).toLowerCase();
      const name = applicantDisplayName(app).toLowerCase();
      const matchesSearch = !q || email.includes(q) || church.includes(q) || name.includes(q);
      const matchesTab = app.status === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [applications, activeTab, searchQuery]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Micro Grant"
        subtitle="Manage and track micro grant applications."
        image={MicroGrantBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Micro Grant" },
        ]}
      />

      <section className="relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20">
        <div className={directorPageContainer}>
          <DirectorFilterSection className="!mb-8 !p-4 sm:!p-5">
            <div className="relative w-full flex-1 md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, email, or church"
                variant="dark"
                className="w-full"
              />
            </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex h-10 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1">
                  {tabs.map((tab, index) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative h-8 rounded-md px-4 text-sm font-semibold capitalize transition-all ${
                        activeTab === tab.id
                          ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                          : "bg-transparent text-white/70 hover:text-white"
                      } ${index === 0 ? "rounded-l-lg" : ""} ${index === tabs.length - 1 ? "rounded-r-lg" : ""}`}
                    >
                      {tab.label}
                      {tab.count > 0 ? (
                        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#8ec5eb]/90 px-1 text-[10px] font-bold text-[#041f35]">
                          {tab.count > 99 ? "99+" : tab.count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/director/micro-grant/edit")}
                  className={`${directorBtnSecondary} h-10 px-4 py-0 text-sm`}
                >
                  <i className="fa-solid fa-pencil text-sm"></i>
                  Edit form
                </button>
              </div>
          </DirectorFilterSection>

          {fetchError ? (
            <p className="mb-4 rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {fetchError}
            </p>
          ) : null}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
              <p className="text-sm text-white/60">Loading applications…</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {filteredCards.map((app) => {
  const viewSlug = microGrantListDetailSlug(app);
  const user =
    app.userId && typeof app.userId === "object" ? (app.userId as any) : null;

  return (
    <MicroGrantCard
      key={app._id}
      variant="directorGlass"
      // image={UserProfile}
      image={applicantProfileImage(app)}
      name={user?.email || "Unknown"}
      role={churchLabel(app) ? `Church: ${churchLabel(app)}` : "Church: Not provided"}
      date={app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "—"}
      slug={viewSlug}
    />
  );
})}
              </div>

              {filteredCards.length === 0 ? (
                <div className="py-14 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
                    <i className="fa-regular fa-folder-open text-4xl text-white/50"></i>
                  </div>
                  <p className="text-lg text-white/80">
                    {applications.length === 0
                      ? "No applications yet."
                      : "No applications match your search or tab."}
                  </p>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Page;
