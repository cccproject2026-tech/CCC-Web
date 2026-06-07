"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "@/app/director/directorUi";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  apiGetUserProgress,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

function getInitialsAvatar(firstName?: string, lastName?: string, fallback = "Pastor") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName || ""} ${lastName || ""}`.trim() || fallback
  )}&background=173653&color=ffffff`;
}

export default function MentorAssignedPastorsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
const mentorId = searchParams.get("mentorId") || "";

  const [pastors, setPastors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openPastorMenuId, setOpenPastorMenuId] = useState<string | null>(null);
  const [progressByPastorId, setProgressByPastorId] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!mentorId) return;

    const loadAssignedPastors = async () => {
      try {
        setLoading(true);
        const res = await apiGetAssignedUsers(mentorId);
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        setPastors(list);
      } catch (error) {
        console.error("Failed to load assigned pastors", error);
        setPastors([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignedPastors();
  }, [mentorId]);
  useEffect(() => {
  if (!pastors.length) return;

  let cancelled = false;

  async function loadProgress() {
    const entries = await Promise.all(
      pastors.map(async (pastor) => {
        const pastorId = String(pastor?._id ?? pastor?.id ?? "");

        if (!pastorId) return null;

        try {
          const res = await apiGetUserProgress(pastorId);
          const detail = unwrapUserProgressDetail(res);

          const roadmaps = Array.isArray(detail?.roadmaps)
            ? detail.roadmaps
            : [];

          const totalTasks = roadmaps.reduce((sum: number, roadmap: any) => {
            const nested = Array.isArray(roadmap?.nestedRoadmaps)
              ? roadmap.nestedRoadmaps
              : [];

            return sum + (nested.length || 1);
          }, 0);

          const completedTasks = roadmaps.reduce(
            (sum: number, roadmap: any) => {
              const nested = Array.isArray(roadmap?.nestedRoadmaps)
                ? roadmap.nestedRoadmaps
                : [];

              if (nested.length > 0) {
                return (
                  sum +
                  nested.filter((task: any) => {
                    const status = String(task?.status || "").toLowerCase();

                    return (
                      status.includes("complete") ||
                      Number(task?.progressPercentage || 0) >= 100
                    );
                  }).length
                );
              }

              const status = String(roadmap?.status || "").toLowerCase();

              return (
                sum +
                (status.includes("complete") ||
                Number(roadmap?.progressPercentage || 0) >= 100
                  ? 1
                  : 0)
              );
            },
            0
          );

          const progress =
            totalTasks > 0
              ? Math.round((completedTasks / totalTasks) * 100)
              : 0;

          return [pastorId, progress];
        } catch (error) {
          console.error("Failed to load pastor progress", error);
          return [pastorId, 0];
        }
      })
    );

    if (cancelled) return;

    setProgressByPastorId(
      Object.fromEntries(entries.filter(Boolean) as [string, number][])
    );
  }

  loadProgress();

  return () => {
    cancelled = true;
  };
}, [pastors]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Assigned Pastors"
        subtitle="View pastors assigned to this mentor and open their roadmaps."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          { label: "Assigned Pastors" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-[1400px]`}>
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.push("/director/revitalization-roadmap")}
              className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
            >
              <i className="fa-solid fa-arrow-left text-sm" />
              <span>Back</span>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className={directorSpinner} />
            </div>
          ) : pastors.length === 0 ? (
            <div className={`${directorGlassCard} px-5 py-14 text-center text-sm text-white/65`}>
              No pastors assigned to this mentor.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {pastors.map((pastor) => {
                const pastorId = String(pastor?._id ?? pastor?.id ?? "");
                const progress = progressByPastorId[pastorId] ?? 0;
                const name =
                  `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`.trim() ||
                  pastor?.email ||
                  "Pastor";

                const img =
                  resolveApiMediaUrl(String(pastor?.profilePicture || "").trim()) ||
                  String(pastor?.profilePicture || "").trim() ||
                  getInitialsAvatar(pastor?.firstName, pastor?.lastName, "Pastor");

                return (
                  <div
                    key={pastorId}
                    // className={`${directorGlassCard} flex min-h-[170px] gap-4 overflow-hidden p-4`}
                    className={`${directorGlassCard} relative flex min-h-[170px] gap-4 overflow-visible p-4 pr-14`}
                  >
                    <div className="relative h-[120px] w-[120px] shrink-0 overflow-hidden rounded-xl bg-white/5">
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="120px"
                        unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="truncate text-base font-bold text-white">{name}</h3>
                      {/* <p className="mt-1 truncate text-sm text-white/60">
                        {pastor?.email || "No email available"}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/55">
                        {pastor?.phoneNumber || pastor?.phone || "No phone available"}
                      </p> */}
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/60">
{(() => {
  const profileInfo =
    [
      pastor?.profileInformation,
      pastor?.profileInfo,
      pastor?.about,
      pastor?.bio,
      pastor?.description,
      pastor?.ministryExperience,
      pastor?.churchName,
    ]
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .join(" · ") || "No profile information available";

  return (
    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-white/60">
      {profileInfo}
    </p>
  );
})()}
</p>
                      <div className="absolute right-4 top-4">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setOpenPastorMenuId((prev) => (prev === pastorId ? null : pastorId));
    }}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
    title="More options"
  >
    <i className="fa-solid fa-ellipsis-vertical text-sm" />
  </button>

  {openPastorMenuId === pastorId ? (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-white/15 bg-[#0d1f33] p-2 shadow-xl"
    >
      <button
        type="button"
        onClick={() => {
          setOpenPastorMenuId(null);
          router.push(
            `/director/schedule?tab=Schedule&recipientType=pastor&pastorId=${encodeURIComponent(pastorId)}`
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
<div className="mt-4">
  <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-white/65">
    <span>Roadmap Progress</span>
    <span>{progress}%</span>
  </div>

  <div className="h-2 overflow-hidden rounded-full bg-white/10">
    <div
      className="h-full rounded-full bg-[#3498DB] transition-all duration-500"
      style={{
        width: `${Math.max(0, Math.min(100, progress))}%`,
      }}
    />
  </div>
</div>
                      {/* <div className="mt-auto flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/director/revitalization-roadmap?tab=pastor&pastorId=${encodeURIComponent(pastorId)}`
                            )
                          }
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
                        >
                          View Roadmaps
                        </button>
                      </div> */}
                      <div className="mt-auto flex items-center justify-between gap-4 pt-4">
  <div className="flex items-center gap-4 text-[17px] text-[#8ec5eb]">
    <a
      href={`mailto:${pastor?.email || ""}`}
      onClick={(e) => e.stopPropagation()}
      className="transition hover:text-white"
      title="Email"
    >
      <i className="fa-regular fa-envelope" />
    </a>

    <span className="cursor-not-allowed opacity-40">
      <i className="fa-regular fa-comment-dots" />
    </span>

    <span className="cursor-not-allowed opacity-40">
      <i className="fa-brands fa-whatsapp" />
    </span>

    <span className="cursor-not-allowed opacity-40">
      <i className="fa-solid fa-phone" />
    </span>
  </div>

  <button
    type="button"
    onClick={() =>
   
      router.push(
  `/director/revitalization-roadmap?tab=pastor&pastorId=${encodeURIComponent(
    pastorId
  )}&returnTo=${encodeURIComponent(
    `/director/revitalization-roadmap/mentor?mentorId=${mentorId}`
  )}`
)
    }
    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
  >
    View Roadmaps
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
    </div>
  );
}