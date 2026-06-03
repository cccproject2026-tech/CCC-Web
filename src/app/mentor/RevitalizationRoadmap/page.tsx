"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter, useSearchParams } from "next/navigation";

import DirectorHero from "@/app/director/DirectorHero";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorFilterPanel,
  mentorFilterStrip,
  mentorFilterTabActiveDashboard,
  mentorFilterTabBase,
  mentorFilterTabIdleDashboard,
  mentorGlassCardRoadmap,
  mentorPageRoot,
  mentorPrimaryCtaDashboard,
  mentorRoadmapHubMain,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import RoadmapHero from "@/app/Assets/roadmap-bg.png";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";

import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmaps } from "@/app/Services/roadmaps.service";
import {
  buildMentorRoadmapViewUrl,
  fetchMergedRoadmapsForAssignedUser,
  unwrapRoadmapsList,
  unwrapProgressData,
} from "@/app/Services/roadmap-assignments";
import { getMentorUserId } from "@/app/utils/mentor-auth";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

// type Mentee = {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   role: string;
//   profileInfo?: string;
//   profilePicture?: string;
//   country?: string;
//   progress: number;
// };
type Mentee = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  profileInfo?: string;
  profilePicture?: string;
  country?: string;
  progress: number;
};
function matchesQuery(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystack.toLowerCase().includes(q);
}

export default function RevitalizationRoadmapPage() {
  // const router = useRouter();

  // const [activeTab, setActiveTab] = useState("Pastor");
  const router = useRouter();
const searchParams = useSearchParams();

const [activeTab, setActiveTab] = useState(
  searchParams.get("tab") === "Library" ? "Library" : "Pastor"
);

useEffect(() => {
  if (searchParams.get("tab") === "Library") {
    setActiveTab("Library");
  }
}, [searchParams]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "progress">("default");

  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [openPastorMenuId, setOpenPastorMenuId] = useState<string | null>(null);
  const libraryFetchedRef = useRef(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const mentorId = getMentorUserId();
        if (!mentorId) {
          setSessionMissing(true);
          setMentees([]);
          return;
        }
        setSessionMissing(false);

        const usersRes = await apiGetAssignedUsers(mentorId);
        const body = usersRes.data as { data?: unknown };
        const users = Array.isArray(body?.data) ? body.data : [];

        const progressResults = await Promise.all(
          users.map(async (u: any) => {
            const uid = u._id ?? u.id;
            try {
              const p = await apiGetUserProgress(uid);
              const prog = unwrapProgressData(p);
              return {
                userId: uid,
                progress: prog?.overallRoadmapProgress ?? 0,
              };
            } catch {
              return { userId: uid, progress: 0 };
            }
          }),
        );

        const merged: Mentee[] = users.map((u: any) => {
          const uid = u._id ?? u.id;
          const found = progressResults.find((p) => p.userId === uid);

          return {
            _id: uid,
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            role: u.role,
            profileInfo: u.profileInfo,
            phoneNumber: u.phoneNumber || u.phone || u.mobileNumber || "",
            // profilePicture: u.profilePicture,
            // progress: found?.progress ?? 0,
            profilePicture: u.profilePicture,
country: u.country || u.interest?.country || u.churchCountry || u.interest?.churchCountry || "",
progress: found?.progress ?? 0,
          };
        });

        setMentees(merged);
      } catch (err) {
        console.error("Fetch failed →", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    if (activeTab !== "Library" || libraryFetchedRef.current) return;

    const fetchRoadmaps = async () => {
      try {
        setRoadmapLoading(true);
        libraryFetchedRef.current = true;
        const res = await apiGetRoadmaps();
        setRoadmaps(unwrapRoadmapsList(res));
      } catch (err) {
        console.error("Failed to fetch roadmaps", err);
        libraryFetchedRef.current = false;
      } finally {
        setRoadmapLoading(false);
      }
    };

    fetchRoadmaps();
  }, [activeTab]);

  const handleUserClick = async (clickedUserId: string) => {
    try {
      const list = await fetchMergedRoadmapsForAssignedUser(clickedUserId);
      if (list.length === 1) {
        const url = buildMentorRoadmapViewUrl(clickedUserId, list[0]);
        if (url) {
          router.push(url);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to resolve mentor roadmap redirect", e);
    }
    router.push(
      `/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(clickedUserId)}`,
    );
  };

  // const filteredPastors = useMemo(() => {
  //   const q = searchQuery.trim();
  //   if (!q) return mentees;
  //   return mentees.filter((m) => {
  //     const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim();
  //     return (
  //       matchesQuery(fullName, q) ||
  //       matchesQuery(m.email || "", q) ||
  //       matchesQuery(m.role || "", q) ||
  //       matchesQuery(m.profileInfo || "", q)
  //     );
  //   });
  // }, [mentees, searchQuery]);
  const filteredPastors = useMemo(() => {
  const q = searchQuery.trim();

  let list = !q
    ? mentees
    : mentees.filter((m) => {
        const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim();
        return (
          matchesQuery(fullName, q) ||
          matchesQuery(m.email || "", q) ||
          matchesQuery(m.role || "", q) ||
          matchesQuery(m.profileInfo || "", q) ||
          matchesQuery(m.country || "", q)
        );
      });

  if (sortBy === "progress") {
    list = [...list].sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0));
  }

  // if (sortBy === "country") {
  //   list = [...list].sort((a, b) =>
  //     String(a.country || "").localeCompare(String(b.country || ""))
  //   );
  // }

  return list;
}, [mentees, searchQuery, sortBy]);

  const filteredRoadmaps = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return roadmaps;
    return roadmaps.filter((r: any) => {
      const name = String(r.name ?? "");
      const details = String(r.roadMapDetails ?? r.description ?? "");
      const extra = String(r.category ?? r.slug ?? "");
      return matchesQuery(name, q) || matchesQuery(details, q) || matchesQuery(extra, q);
    });
  }, [roadmaps, searchQuery]);

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <DirectorHero
        title="Revitalization Roadmap"
        subtitle="Open a pastor&apos;s assigned roadmaps or browse templates from the library."
        image={RoadmapHero}
        className="mb-6"
      />

      <main className={mentorRoadmapHubMain}>
        <div className="py-6 md:py-8">
          <div className={`${mentorFilterPanel} mb-8`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
            <MentorSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={activeTab === "Pastor" ? "Search pastors…" : "Search roadmaps…"}
              aria-label={activeTab === "Pastor" ? "Search pastors" : "Search roadmap library"}
              className="max-w-none lg:max-w-md"
            />

            <div className={mentorFilterStrip}>
              <button
                type="button"
                onClick={() => setActiveTab("Pastor")}
                className={`${mentorFilterTabBase} border px-4 py-2 sm:px-4 ${
                  activeTab === "Pastor" ? mentorFilterTabActiveDashboard : mentorFilterTabIdleDashboard
                }`}
              >
                Pastor&apos;s roadmaps
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("Library")}
                className={`${mentorFilterTabBase} border px-4 py-2 sm:px-4 ${
                  activeTab === "Library" ? mentorFilterTabActiveDashboard : mentorFilterTabIdleDashboard
                }`}
              >
                Roadmap library
              </button>
            </div>
                   </div>

          {activeTab === "Pastor" && !loading && filteredPastors.length > 0 ? (
            <div className="mt-5 border-t border-white/10 pt-5">
              <div className="flex items-center gap-7 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filteredPastors.map((mentee) => {
                  const fullName = `${mentee.firstName || ""} ${mentee.lastName || ""}`.trim();
                  const initials =
                    `${mentee.firstName?.[0] ?? ""}${mentee.lastName?.[0] ?? ""}`.toUpperCase() || "P";

                  return (
                    <button
                      key={`thumb-${mentee._id}`}
                      type="button"
                      onClick={() => handleUserClick(mentee._id)}
                      className="group flex min-w-[92px] flex-col items-center gap-2 text-center"
                    >
                      <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border-2 border-[#3498DB]/50 bg-[#173653] transition group-hover:scale-105 group-hover:border-[#8ec5eb]">
                        {mentee.profilePicture ? (
                          <Image
                            src={mentee.profilePicture}
                            alt={fullName}
                            fill
                            className="object-cover"
                            unoptimized={isHttpUrl(mentee.profilePicture)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-white">
                            {initials}
                          </div>
                        )}
                      </div>

                      <span className="max-w-[90px] truncate text-xs font-semibold text-[#cde2f2] group-hover:text-white">
                        {fullName || "Pastor"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          </div>

          {activeTab === "Pastor" && (
            <>
              {loading && (
                <div className="flex justify-center py-16">
                  <div className={mentorSpinner} />
                </div>
              )}
              {!loading && sessionMissing && (
                <div className="py-16 text-center">
                  <p className="text-sm text-[#cde2f2]">
                    Sign in as a mentor to see assigned pastors and their roadmap progress.
                  </p>
                  <Link
                    href="/mentor/login?returnUrl=%2Fmentor%2FRevitalizationRoadmap"
                    className="mt-4 inline-block rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/20 px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3498DB]/32"
                  >
                    Mentor sign in
                  </Link>
                </div>
              )}
              {!loading && !sessionMissing && mentees.length === 0 && (
                <p className="py-16 text-center text-sm text-[#cde2f2]">No assigned pastors yet.</p>
              )}
              {!loading && mentees.length > 0 && filteredPastors.length === 0 && (
                <p className="py-16 text-center text-sm text-[#cde2f2]">
                  No pastors match your search. Try another name, email, or role.
                </p>
              )}
      <div className="mb-5 flex justify-end">
  {activeTab === "Pastor" ? (
    <select
      value={sortBy}
      onChange={(e) =>
        setSortBy(e.target.value as "default" | "progress")
      }
      className="h-11 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white outline-none transition hover:bg-white/15 lg:w-[220px] [&>option]:bg-[#0d1f33] [&>option]:text-white"
    >
      <option value="default">Sort by</option>
      <option value="progress">Progress: High to Low</option>
    </select>
  ) : null}
</div>
              
              <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
                {!loading &&
                  filteredPastors.map((mentee) => (
                    // <button
                    //   key={mentee._id}
                    //   type="button"
                    //   onClick={() => handleUserClick(mentee._id)}
                    //   className={`text-left ${mentorGlassCardRoadmap}`}
                    // >
                    <div
  key={mentee._id}
  onClick={() => handleUserClick(mentee._id)}
  className={`relative cursor-pointer text-left ${mentorGlassCardRoadmap}`}
>
  <div className="absolute right-4 top-4 z-20">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setOpenPastorMenuId((prev) => (prev === mentee._id ? null : mentee._id));
    }}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 hover:bg-white/15"
    aria-label="Pastor actions"
  >
    <i className="fa-solid fa-ellipsis-vertical text-sm" />
  </button>

  {openPastorMenuId === mentee._id ? (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-white/15 bg-[#0d1f33] p-2 shadow-xl"
    >
      <button
        type="button"
        onClick={() => {
          setOpenPastorMenuId(null);
          router.push(
            `/mentor/MentorSchedule?tab=Schedule&recipientType=pastor&pastorId=${encodeURIComponent(mentee._id)}`
          );
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/85 hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar-plus text-xs" />
        Schedule Meeting
      </button>
    </div>
  ) : null}
</div>
                      <div className="relative m-4 h-[180px] w-full shrink-0 sm:h-[200px] sm:w-[200px]">
                        {isHttpUrl(mentee.profilePicture) ? (
                          <Image
                            src={mentee.profilePicture!}
                            alt={`${mentee.firstName} ${mentee.lastName}`.trim()}
                            width={200}
                            height={200}
                            className="h-full w-full rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                        <div>
                          <h3 className="mb-1 text-base font-semibold text-white md:text-[17px]">
                            {mentee.firstName} {mentee.lastName}
                          </h3>
                          {/* <p className="mb-3 text-sm text-[#cde2f2]">
                            {mentee.profileInfo || mentee.role || "Pastor"}
                          </p> */}
                          <p className="mb-3 max-w-[360px] truncate text-sm text-[#cde2f2]">
  {mentee.profileInfo || mentee.role || "Pastor"}
</p>
                          <div className="mb-3 inline-flex w-fit items-center rounded-full bg-[#8ec5eb]/15 px-3 py-1 text-xs font-semibold text-[#8ec5eb]">
  Phase :&nbsp;
</div>


                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-medium text-[#d9ebf8]">Overall progress</span>
                            <span className="rounded-full border border-[#3498DB]/35 bg-[#3498DB]/15 px-2 py-[2px] text-xs font-semibold text-[#aed6f1]">
                              {Math.min(100, Math.round(mentee.progress))}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full max-w-xs rounded-full bg-white/15">
                            <div
                              className="h-1.5 rounded-full bg-[#3498DB]"
                              style={{ width: `${Math.min(100, mentee.progress)}%` }}
                            />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-4 sm:mt-0">
  <div className="flex items-center gap-4 text-[18px] text-[#8ec5eb]">
    <a
      href={`mailto:${mentee.email}`}
      onClick={(e) => e.stopPropagation()}
      className="transition hover:text-white"
      title="Email"
    >
      <i className="fa-regular fa-envelope" />
    </a>

   <a
  href={mentee.phoneNumber ? `sms:${String(mentee.phoneNumber).replace(/[^\d+]/g, "")}` : undefined}
  onClick={(e) => e.stopPropagation()}
  className="transition hover:text-white"
  title="Message"
>
  <i className="fa-regular fa-comment-dots" />
</a>

<a
  href={
    mentee.phoneNumber
      ? `https://wa.me/${String(mentee.phoneNumber).replace(/[^\d]/g, "")}`
      : undefined
  }
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="transition hover:text-white"
  title="WhatsApp"
>
  <i className="fa-brands fa-whatsapp" />
</a>

<a
  href={mentee.phoneNumber ? `tel:${String(mentee.phoneNumber).replace(/[^\d+]/g, "")}` : undefined}
  onClick={(e) => e.stopPropagation()}
  className="transition hover:text-white"
  title="Call"
>
  <i className="fa-solid fa-phone" />
</a>
  </div>

  <span className={mentorPrimaryCtaDashboard}>View roadmaps</span>
</div>
                      </div>
                    </div>
                  ))}
              </div>
            </>
          )}

          {activeTab === "Library" && (
            
            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2">
              {roadmapLoading && (
                <div className="col-span-full flex justify-center py-12">
                  <div className={mentorSpinner} />
                </div>
              )}
              {!roadmapLoading && roadmaps.length > 0 && filteredRoadmaps.length === 0 && (
                <p className="col-span-full py-12 text-center text-sm text-[#cde2f2]">
                  No roadmaps match your search.
                </p>
              )}
              {!roadmapLoading && roadmaps.length === 0 && (
                <p className="col-span-full py-16 text-center text-sm text-[#cde2f2]">
                  No roadmap templates in the library yet.
                </p>
              )}
              {!roadmapLoading &&
                filteredRoadmaps.map((roadmap: any) => {
                  const rid = String(roadmap._id ?? roadmap.id ?? "");
                  const imgOk = isHttpUrl(roadmap.imageUrl);
                  return (
                    // <div key={rid || roadmap.name} className={mentorGlassCardRoadmap}>
                    <div key={rid || roadmap.name} className={`${mentorGlassCardRoadmap} relative pb-10`}>
                      <div className="relative m-4 h-[180px] w-full shrink-0 sm:h-[200px] sm:w-[200px]">
                        {imgOk ? (
                          <Image
                            src={roadmap.imageUrl}
                            alt={roadmap.name || "Roadmap"}
                            width={200}
                            height={200}
                            className="h-full w-full rounded-lg object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                        <div>
                          <h3 className="mb-1 text-base font-semibold text-white md:text-[17px]">
                            {roadmap.name}
                          </h3>
                          <p className="line-clamp-3 text-sm text-[#cde2f2]">
                            {roadmap.roadMapDetails || roadmap.description || "—"}
                          </p>
                          {/* <p className="mt-3 text-xs text-[#d9ebf8]">
                            Steps: {roadmap.totalSteps ?? roadmap.roadmaps?.length ?? "—"}
                          </p> */}
   {/* <div className="mt-auto flex justify-end pt-4"> */}
   <div className="absolute bottom-4 right-5">
  <button
    type="button"
    onClick={() => {
  const roadmapType = String(roadmap.type || "").toLowerCase();
  const isPhaseRoadmap = roadmapType === "phase" || roadmapType.includes("phase");

  if (isPhaseRoadmap) {
    router.push(
      `/mentor/RevitalizationRoadmap/phase-list?roadmapId=${encodeURIComponent(rid)}&pastorView=true`
    );
    return;
  }

  const firstNested = Array.isArray(roadmap.roadmaps) ? roadmap.roadmaps[0] : null;

  const qp = new URLSearchParams();
  qp.set("roadmapId", rid);
  qp.set("type", "single");
  qp.set("isEditMode", "true");
  qp.set("viewOnly", "true");

  if (firstNested?._id) qp.set("nestedRoadmapId", String(firstNested._id));

  qp.set("name", String(firstNested?.name || firstNested?.title || roadmap.name || ""));
  qp.set("subheading", String(firstNested?.roadMapDetails || firstNested?.description || roadmap.roadMapDetails || ""));
  qp.set("longDescription", String(firstNested?.description || firstNested?.roadMapDetails || roadmap.description || ""));
  qp.set("completionTime", String(firstNested?.duration || roadmap.duration || ""));
  qp.set("selectedDivision", String(firstNested?.phase || "All"));
  qp.set("bannerImage", String(firstNested?.imageUrl || roadmap.imageUrl || ""));

  router.push(`/mentor/RevitalizationRoadmap/roadmap-form?${qp.toString()}`);
}}
    className={mentorPrimaryCtaDashboard}
  >
    View
  </button>
</div>
                        </div>
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
