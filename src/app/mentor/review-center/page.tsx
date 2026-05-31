"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Cookies from "js-cookie";
import UserProfile from "@/app/Assets/user-profile.png";
import { apiGetAssignedUsers } from "@/app/Services/api";
import {
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";

const getMentorFromCookie = () => {
  const cookie = Cookies.get("mentor");
  if (!cookie) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie));
  } catch {
    return null;
  }
};

export default function MentorReviewCenterPage() {
  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = mentor?.id ?? mentor?._id;

    if (!mentorId) {
      setMentees([]);
      setLoading(false);
      return;
    }

    const run = async () => {
      try {
        setLoading(true);
        const res = await apiGetAssignedUsers(String(mentorId));
        const raw = res.data?.data;
        setMentees(Array.isArray(raw) ? raw : []);
      } catch (error) {
        console.error("Failed to load assigned mentees", error);
        setMentees([]);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, []);
const filteredMentees = useMemo(() => {
  const query = search.trim().toLowerCase();

  if (!query) return mentees;

  return mentees.filter((mentee) => {
    const name =
      `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
      mentee.name ||
      "";

    return name.toLowerCase().includes(query);
  });
}, [mentees, search]);
  return (
    <div className={mentorPageRoot}>
      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <Link
            href="/mentor/home"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15 hover:text-white"
          >
            <i className="fa-solid fa-chevron-left text-sm" />
          </Link>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10">
            <i className="fa-regular fa-clipboard text-sm text-[#8ec5eb]" />
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-white">
              Review Center
            </h1>
            <p className="mt-0.5 text-xs text-[#cde2f2]/65">
              {loading ? "Loading..." : `${mentees.length} pastor${mentees.length === 1 ? "" : "s"} assigned to you`}
            </p>
          </div>
        </div>

        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#cde2f2]/65">
          Your Pastors
        </p>
<div className="relative mb-4">
  <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#8ec5eb]" />
  <input
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    placeholder="Search pastor by name..."
    className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-9 pr-3 text-sm font-medium text-white outline-none placeholder:text-[#cde2f2]/45 focus:border-[#8ec5eb]/50 focus:bg-white/[0.08]"
  />
</div>
        {loading ? (
          <div className="flex justify-center py-14">
            <div className={mentorSpinner} />
          </div>
        ) : filteredMentees.length === 0 ? (
          <div className={`p-6 text-center ${mentorGlassCardFrost}`}>
            <i className="fa-regular fa-user mb-3 text-3xl text-white/25" />
            <p className="text-sm font-semibold text-white">No assigned pastors</p>
            <p className="mt-1 text-xs text-[#cde2f2]/60">
              Assigned pastors will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMentees.map((mentee) => {
              const id = String(mentee._id ?? mentee.id ?? "");
              const name =
                `${mentee.firstName ?? ""} ${mentee.lastName ?? ""}`.trim() ||
                mentee.name ||
                "Pastor";

              return (
                <Link
                  key={id || name}
                  href={`/mentor/review-center/${encodeURIComponent(id)}`}
                  className={`flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1] ${mentorGlassCardFrost}`}
                >
                  <Image
                    src={mentee.profilePicture || UserProfile}
                    alt={name}
                    width={44}
                    height={44}
                    unoptimized={Boolean(mentee.profilePicture)}
                    className="h-11 w-11 rounded-full border border-white/20 object-cover"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">
                        {name}
                      </p>

                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
                        0
                      </span>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-[#cde2f2]/65">
                      0 resubmitted · 0 roadmap · 0 assessment · 0 not started
                    </p>
                  </div>

                  <i className="fa-solid fa-chevron-right text-xs text-[#cde2f2]/55" />
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}