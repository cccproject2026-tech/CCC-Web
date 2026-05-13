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
                    className={`${directorGlassCard} flex min-h-[170px] gap-4 overflow-hidden p-4`}
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
                      <p className="mt-1 truncate text-sm text-white/60">
                        {pastor?.email || "No email available"}
                      </p>
                      <p className="mt-1 truncate text-sm text-white/55">
                        {pastor?.phoneNumber || pastor?.phone || "No phone available"}
                      </p>

                      <div className="mt-auto flex justify-end pt-4">
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