"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../../directorUi";
import AssessmentBg from "../../../Assets/assessment-bg.png";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

function getInitialsAvatar(name: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || fallback
  )}&background=173653&color=ffffff`;
}

function mapUserToCardUser(user: any) {
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "User";

  return {
    id: String(user.id ?? user._id ?? ""),
    name,
    email: String(user.email ?? ""),
    role: String(user.role ?? "Pastor"),
    avatar:
      resolveApiMediaUrl(String(user.profilePicture || "")) ||
      String(user.profilePicture || "") ||
      getInitialsAvatar(name, "Pastor"),
  };
}

function MentorAssessmentPastorsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("mentorId");

  const [pastors, setPastors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        setLoading(true);

        const res = await apiGetAllUsers({
          role: "pastor",
          roleMatch: "mixed",
          page: 1,
          limit: 100,
        });

        const inner = res?.data?.data;
        let listUsers: any[] = [];

        if (inner && typeof inner === "object") {
          const payload = inner as { users?: any[]; rows?: any[] };
          if (Array.isArray(payload.users)) listUsers = payload.users;
          else if (Array.isArray(payload.rows)) listUsers = payload.rows;
        }

        setPastors(listUsers);
      } catch (error) {
        console.error("Failed to fetch assigned pastors", error);
        setPastors([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchPastors();
  }, []);

  const assignedPastors = useMemo(() => {
    if (!mentorId) return [];

    return pastors.filter((pastor: any) => {
      const assignedIds = Array.isArray(pastor.assignedId)
        ? pastor.assignedId.map(String)
        : [];

      return assignedIds.includes(String(mentorId));
    });
  }, [pastors, mentorId]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Assigned Pastors"
        subtitle="View pastors assigned to the selected mentor and open their assigned assessments."
        image={AssessmentBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Assessments", href: "/director/assessments" },
          { label: "Mentor Pastors" },
        ]}
      />

      <section className="relative py-8">
        <div className={directorPageContainer}>
          <div className="mb-6 flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/director/assessments")}
              className={directorBtnSecondary}
            >
              Back to Assessments
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className={directorSpinner} />
                <p className="font-semibold text-white">Loading pastors…</p>
              </div>
            </div>
          ) : assignedPastors.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {assignedPastors.map((pastor: any) => {
                const row = mapUserToCardUser(pastor);

                return (
                  <div key={row.id} className={`${directorGlassCard} relative flex gap-5 p-5`}>
     <div className="absolute right-4 top-4">
  <button
    type="button"
    onClick={() =>
      setOpenMenuId((current) => (current === row.id ? null : row.id))
    }
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 hover:bg-white/15"
  >
    <i className="fa-solid fa-ellipsis-vertical" />
  </button>

  {openMenuId === row.id && (
    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-white/15 bg-[#041f35] py-2 shadow-xl">
      <button
        type="button"
        onClick={() => {
          setOpenMenuId(null);
          router.push(`/director/schedule?tab=schedule&recipientType=pastor&pastorId=${row.id}`);
        }}
        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-white/90 hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar-plus text-[#8ec5eb]" />
        Schedule Meeting
      </button>
    </div>
  )}
</div>
                    <Image
                      src={row.avatar}
                      alt={row.name}
                      width={150}
                      height={150}
                      className="h-32 w-32 rounded-xl object-cover"
                      unoptimized={
                        typeof row.avatar === "string" && isRemoteImageSrc(row.avatar)
                      }
                    />

                    <div className="flex min-w-0 flex-1 flex-col">
                      <h3 className="text-lg font-bold text-white">{row.name}</h3>
                      <p className="mt-1 truncate text-sm text-white/60">{row.email}</p>
                      <p className="mt-1 text-sm text-[#cde2f2]">{row.role}</p>
                      <div className="mt-4 flex items-center gap-2">
  <a
    href={`mailto:${row.email}?subject=Community Change Assessment`}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-[#8ec5eb]"
    aria-label="Email pastor"
  >
    <i className="fa-regular fa-envelope" />
  </a>

  <button
    type="button"
    disabled
    className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30"
  >
    <i className="fa-solid fa-phone" />
  </button>

  <button
    type="button"
    disabled
    className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30"
  >
    <i className="fa-brands fa-whatsapp" />
  </button>

  <button
    type="button"
    disabled
    className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/30"
  >
    <i className="fa-regular fa-comment-dots" />
  </button>
</div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/director/assessments?assignUser=${row.id}`)
                        }
                        className={`${directorBtnPrimary} mt-auto self-end`}
                      >
                        View Assessments
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`${directorGlassCard} px-8 py-14 text-center`}>
              <p className="text-lg font-semibold text-white">
                No assigned pastors found for this mentor.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function MentorAssessmentPastorsPage() {
  return (
    <Suspense fallback={null}>
      <MentorAssessmentPastorsContent />
    </Suspense>
  );
}