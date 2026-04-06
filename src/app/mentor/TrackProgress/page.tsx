"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "@/app/Assets/progress-bg.png";
import PastorImg from "@/app/Assets/mentor1.png"; // 👤 example pastor image
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

export default function TrackProgressPage() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const router = useRouter();

  const [pastors, setPastors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPastors = async () => {
      try {
        const mentor = getMentorFromCookie();
        if (!mentor?.id) return;

        const res = await apiGetAssignedUsers(mentor.id);
        const users = res.data?.data || [];

        const results = await Promise.all(
          users.map(async (u: any) => {
            try {
              const progressRes = await apiGetUserProgress(u._id);

              return {
                id: u._id,
                name: `${u.firstName} ${u.lastName}`,
                desc: u.profileInfo || "Assigned pastor",
                img: u.profilePicture || PastorImg,
                progress: progressRes.data?.data?.overallProgress ?? 0,
              };
            } catch {
              return {
                id: u._id,
                name: `${u.firstName} ${u.lastName}`,
                desc: u.profileInfo || "Assigned pastor",
                img: u.profilePicture || PastorImg,
                progress: 0,
              };
            }
          })
        );

        setPastors(results);
      } catch (err) {
        console.error("Failed to load pastors", err);
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
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader />

      {/* HERO SECTION */}
      <section
        className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Track Progress</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">
            Monitor mentoring progress and mark completion.
          </p>
        </div>
      </section>

      {/* MAIN SECTION */}
      <main className="flex-1 px-4 md:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          {/* SEARCH BAR */}
          {/* SEARCH BAR + FILTERS */}
          <div className="mb-12 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="flex items-center w-full sm:w-[480px] rounded-xl border border-white/15 bg-white/10 overflow-hidden">
              <i className="fa-solid fa-magnifying-glass text-[#8ec5eb] px-3"></i>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-[10px] text-sm text-white placeholder:text-white/60 focus:outline-none bg-transparent"
              />
            </div>

            {/* Tabs */}
            <div className="flex rounded-xl border border-white/15 bg-white/10 overflow-hidden">
              {["All", "In-Progress", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-8 py-[8px] text-sm font-medium transition-all duration-200 rounded-md
          ${filter === tab
                      ? "bg-[#8ec5eb]/25 text-white border border-[#8ec5eb]/40 shadow-sm"
                      : "text-[#cde2f2] hover:bg-white/10"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* GRID OF CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {visible.map((pastor, index) => (
              <div
                key={pastor.id}
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/mentor/MentorProgress?userId=${pastor.id}`);
                }}
                className="rounded-2xl border border-white/15 bg-white/5 p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 shadow-sm hover:bg-white/10 transition-all duration-200"
              >
                {/* LEFT: IMAGE */}
                <Image
                  src={pastor.img}
                  alt={pastor.name}
                  width={120}
                  height={120}
                  className="rounded-xl object-cover sm:w-[150px] sm:h-[150px] border border-white/15"
                />
                {/* RIGHT: DETAILS */}
                <div className="flex-1">
                  <h4 className="text-[16px] font-semibold">{pastor.name}</h4>
                  <p className="text-sm text-[#cde2f2]/80 mt-[2px]">
                    {pastor.desc}
                  </p>

                  {/* PROGRESS SECTION */}
                  <div className="mt-4">
                    <p className="text-xs text-[#cde2f2] mb-[4px] font-medium">
                      Progress
                    </p>
                    <div className="w-full bg-white/15 h-[6px] rounded-full mb-[6px]">
                      <div
                        className="h-[6px] bg-[#8ec5eb] rounded-full"
                        style={{ width: `${pastor.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-[#cde2f2]">
                        {pastor.progress}%
                      </p>

                      {/* BUTTONS */}
                      {pastor.progress === 100 ? (
                        <button className="bg-[#8ec5eb]/25 text-[#8ec5eb] text-[12px] font-medium px-4 py-[4px] rounded-md border border-[#8ec5eb]/35">
                          Completed
                        </button>
                      ) : pastor.progress >= 90 ? (
                        <button
                          className="bg-[#8ec5eb]/90 text-[#062946] text-[12px] font-medium px-4 py-[4px] rounded-md hover:bg-[#8ec5eb] transition"
                          onClick={() => router.push(`/mentor/MentorProgress?userId=${pastor.id}`)}
                        >
                          Mark as Complete
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* ACTION ICONS */}
                  <div className="flex gap-5 text-[#8ec5eb] text-[15px] mt-3">
                    <i className="fa-regular fa-envelope cursor-pointer hover:text-white"></i>
                    <i className="fa-regular fa-comment cursor-pointer hover:text-white"></i>
                    <i className="fa-solid fa-phone cursor-pointer hover:text-white"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer hover:text-white"></i>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
