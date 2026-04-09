"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import HeroBg from "@/app/Assets/progress-bg.png";
import PastorImg from "@/app/Assets/mentor1.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import MentorSearchBar from "@/app/Components/mentor/MentorSearchBar";
import {
  mentorBodyText,
  mentorEmptyPanel,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorFilterPanel,
  mentorSpinner,
  mentorWarningPanel,
} from "@/app/Components/mentor/mentor-theme";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { isRemoteImageSrc } from "@/app/utils/image";

export default function TrackProgressPage() {
  const [filter, setFilter] = useState<"All" | "In-Progress" | "Completed">("All");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const [pastors, setPastors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        setLoadError(null);
        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) {
          setLoadError("Sign in as a mentor to track assigned pastors.");
          setPastors([]);
          return;
        }

        const res = await apiGetAssignedUsers(String(mentorId));
        const users = Array.isArray(res.data?.data) ? res.data.data : [];

        const results = await Promise.all(
          users.map(async (u: any) => {
            const uid = u._id ?? u.id;
            if (uid == null || String(uid).trim() === "") {
              return null;
            }
            try {
              const progressRes = await apiGetUserProgress(String(uid));

              return {
                id: String(uid),
                name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pastor",
                desc: u.profileInfo || "Assigned pastor",
                img: u.profilePicture || PastorImg,
                progress: progressRes.data?.data?.overallProgress ?? 0,
              };
            } catch {
              return {
                id: String(uid),
                name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "Pastor",
                desc: u.profileInfo || "Assigned pastor",
                img: u.profilePicture || PastorImg,
                progress: 0,
              };
            }
          }),
        );

        setPastors(
          results.filter((p): p is NonNullable<typeof p> => p != null && Boolean(p.id)),
        );
      } catch (err) {
        console.error("Failed to load pastors", err);
        setLoadError("Could not load progress. Please try again.");
        setPastors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPastors();
  }, []);

  const filtered = pastors.filter((p) => {
    if (filter === "In-Progress") return p.progress < 100;
    if (filter === "Completed") return p.progress === 100;
    return true;
  });

  const visible = filtered.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader />

      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Track Progress</h1>
          <p className={`mt-2 ${mentorBodyText}`}>
            Monitor mentoring progress and mark completion.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 py-10 md:px-20`}>
        <div className="mx-auto max-w-7xl">
          {loadError ? <div className={`mb-6 ${mentorWarningPanel}`}>{loadError}</div> : null}

          <div className={`${mentorFilterPanel} mb-10`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <MentorSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search pastors…"
                aria-label="Search pastors"
                className="w-full max-w-none lg:max-w-md"
              />
              <MentorFilterTabGroup
                tabs={["All", "In-Progress", "Completed"] as const}
                active={filter}
                onChange={setFilter}
                aria-label="Progress filter"
                className="w-full lg:w-auto"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading progress…</p>
            </div>
          ) : null}

          {!loading && !loadError && visible.length === 0 ? (
            <div className={mentorEmptyPanel}>
              {pastors.length === 0
                ? "No pastors are assigned to you yet."
                : search.trim()
                  ? "No pastors match your search."
                  : "No pastors in this filter."}
            </div>
          ) : null}

          {!loading && visible.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
              {visible.map((pastor) => (
                <div
                  key={pastor.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`Open progress for ${pastor.name}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/mentor/MentorProgress?userId=${pastor.id}`);
                    }
                  }}
                  onClick={() => router.push(`/mentor/MentorProgress?userId=${pastor.id}`)}
                  className={`${mentorGlassCardRoadmap} cursor-pointer flex-col items-stretch gap-4 p-5 text-left sm:flex-row sm:items-center sm:gap-6`}
                >
                  <div className="relative mx-auto shrink-0 sm:mx-0">
                    <Image
                      src={pastor.img}
                      alt={pastor.name}
                      width={120}
                      height={120}
                      unoptimized={isRemoteImageSrc(pastor.img)}
                      className="h-[88px] w-[88px] rounded-xl border border-white/20 object-cover sm:h-[120px] sm:w-[120px]"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col text-left">
                    <h4 className="text-base font-semibold text-white">{pastor.name}</h4>
                    <p className="mt-0.5 text-sm text-[#cde2f2]/90">{pastor.desc}</p>

                    <div className="mt-4">
                      <p className="mb-1 text-xs font-medium text-[#cde2f2]">Progress</p>
                      <div className="mb-1.5 h-1.5 w-full rounded-full bg-white/15">
                        <div
                          className="h-1.5 rounded-full bg-[#8ec5eb]"
                          style={{ width: `${Math.min(100, pastor.progress)}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-[#cde2f2]">{pastor.progress}%</p>
                        {pastor.progress === 100 ? (
                          <span className="rounded-md border border-[#8ec5eb]/35 bg-[#8ec5eb]/25 px-3 py-1 text-xs font-medium text-[#8ec5eb]">
                            Completed
                          </span>
                        ) : pastor.progress >= 90 ? (
                          <button
                            type="button"
                            className={`${mentorPrimaryCta} px-4 py-1.5 text-xs`}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/mentor/MentorProgress?userId=${pastor.id}`);
                            }}
                          >
                            Mark as Complete
                          </button>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-4 text-[15px] text-[#8ec5eb]">
                      <i className="fa-regular fa-envelope pointer-events-none" aria-hidden />
                      <i className="fa-regular fa-comment pointer-events-none" aria-hidden />
                      <i className="fa-solid fa-phone pointer-events-none" aria-hidden />
                      <i className="fa-brands fa-whatsapp pointer-events-none" aria-hidden />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
