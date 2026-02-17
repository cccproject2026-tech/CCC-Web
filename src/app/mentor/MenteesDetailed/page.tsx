"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/mentees-hero.png";
import MapImg from "@/app/Assets/map-view.png"; // 🗺️ your static map image
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
const IMAGE_POOL = [Mentor1, Mentor2, Mentor3];

export default function MyMenteesPage() {
  const [filter, setFilter] = useState("In-Progress");
  const [sortBy, setSortBy] = useState("Phase");
  const [isMapView, setIsMapView] = useState(false); // 👈 toggle map mode

  const [mentees, setMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyMentees = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("mentor") || "null");
        if (!storedUser?.id) return;

        // 1️⃣ get assigned mentees
        const res = await apiGetAssignedUsers(storedUser.id);

        const menteeUsers = res.data.data;
        // 2️⃣ map to UI model
        const mapped = menteeUsers.map((u: any, i: number) => ({
          id: u.id ?? u._id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          desc: "Assigned mentee in mentoring program",
          img: u.profilePicture || IMAGE_POOL[i % IMAGE_POOL.length],
          progress: 0,
          phase: undefined,
        }));

        setMentees(mapped);
      } catch (err) {
        console.error("Failed to load mentees", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyMentees();
  }, []);

  useEffect(() => {
    if (!mentees.length) return;

    const hydrateProgress = async () => {
      const results = await Promise.allSettled(
        mentees.map((m) =>
          apiGetUserProgress(m.id).then((res) => ({
            userId: m.id,
            progress: res.data.data?.overallProgress ?? 0,
            phase: res.data.data?.currentPhase,
            completed: res.data.data?.overallCompleted ?? false,
          }))
        )
      );

      setMentees((prev) =>
        prev.map((m) => {
          const match = results.find(
            (r) => r.status === "fulfilled" && r.value.userId === m.id
          ) as PromiseFulfilledResult<any> | undefined;

          if (!match) return m;

          return {
            ...m,
            progress: match.value.progress,
            phase: match.value.phase,
          };
        })
      );
    };

    hydrateProgress();
  }, [mentees.length]);

  const processedMentees = useMemo(() => {
    let list = [...mentees];

    if (filter !== "All") {
      list = list.filter((m) => {
        if (filter === "Completed") return m.progress === 100;

        if (filter === "In-Progress") return m.progress < 100;

        return true;
      });
    }

    if (sortBy === "Name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === "Progress") {
      list = [...list].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    }

    if (sortBy === "Phase") {
      list = [...list].sort((a, b) =>
        (a.phase || "").localeCompare(b.phase || "")
      );
    }

    return list;
  }, [mentees, filter, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <MentorHeader showFullHeader={true} />

      {/* 🟦 HERO SECTION */}
      <section
        className="relative h-[280px] bg-cover bg-center flex flex-col justify-end px-4 md:px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0F1E44]/80 via-[#0F4A85]/50 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-semibold">My Mentees</h1>
        </div>
      </section>

      {/* 🟩 MAIN SECTION */}
      <main className="flex-1 px-4 md:px-20 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">
          {/* 🔍 SEARCH + ICONS */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center w-full sm:w-[360px] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              {/* Location Toggle */}
              <button
                onClick={() => setIsMapView(true)}
                className={`bg-white rounded-lg w-9 h-9 flex items-center justify-center shadow-sm transition hover:bg-gray-50 ${isMapView ? "ring-2 ring-[#FFD84E]" : ""
                  }`}
              >
                <i className="fa-solid fa-location-dot text-[#103C8C]"></i>
              </button>

              {/* Grid View */}
              <button
                onClick={() => setIsMapView(false)}
                className={`bg-white rounded-lg w-9 h-9 flex items-center justify-center shadow-sm transition hover:bg-gray-50 ${!isMapView ? "ring-2 ring-[#FFD84E]" : ""
                  }`}
              >
                <i className="fa-solid fa-grip text-[#103C8C]"></i>
              </button>

              {/* List Icon (optional placeholder for now) */}
              <button className="bg-white rounded-lg w-9 h-9 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <i className="fa-solid fa-list text-[#103C8C]"></i>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6 mb-10 overflow-x-auto pb-2">
            {mentees.slice(0, 6).map((mentee) => (
              <div key={mentee.id} className="flex flex-col items-center min-w-[80px]">
                <div className="relative">
                  <Image
                    src={mentee.img || Mentor1} // fallback image
                    alt={mentee.name}
                    width={70}
                    height={70}
                    className="rounded-full border-4 border-[#9D8CFF] shadow-md object-cover"
                  />

                  {/* online indicator (optional logic later) */}
                  <div className="absolute -bottom-1 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                </div>

                <p className="text-sm mt-2 text-center truncate w-[80px]">
                  {mentee.name}
                </p>
              </div>
            ))}
          </div>

          {/* CONDITIONAL VIEW */}
          {isMapView ? (
            <>
              {/* MAP VIEW */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold">In-progress</h2>
                <button
                  onClick={() => setIsMapView(false)}
                  className="text-sm bg-white text-[#0F4A85] font-medium px-4 py-[6px] rounded-md hover:bg-gray-100"
                >
                  <i className="fa-solid fa-xmark mr-1"></i> Close
                </button>
              </div>

              <div className="rounded-xl overflow-hidden shadow-lg border border-white/20">
                <Image
                  src={MapImg}
                  alt="Map View"
                  className="w-full h-[480px] object-cover"
                />
              </div>
            </>
          ) : (
            <>
              {/* CARD VIEW */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div className="flex bg-white rounded-lg shadow-sm overflow-hidden">
                  {["All", "In-Progress", "Completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFilter(tab)}
                      className={`px-6 py-[8px] text-sm font-medium transition-all duration-200 ${filter === tab
                        ? "bg-[#103C8C] text-white"
                        : "text-gray-600 hover:text-[#103C8C]"
                        }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/80">Sort By</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent border border-white/40 text-white rounded-md px-3 py-1 text-sm focus:outline-none"
                  >
                    <option className="text-black">Phase</option>
                    <option className="text-black">Progress</option>
                    <option className="text-black">Name</option>
                  </select>
                </div>
              </div>
              {loading && (
                <div className="text-center py-20 text-white/80">
                  Loading mentees...
                </div>
              )}

              {!loading && processedMentees.length === 0 && (
                <div className="text-center py-20 text-white/80">
                  No mentees found in this category.
                </div>
              )}
              {/* GRID OF CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {processedMentees.map((mentee, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl text-[#0B1C58] p-4 shadow-md hover:shadow-lg transition-all duration-200 relative"
                  >
                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-3">
                      <Image
                        src={mentee.img}
                        alt={mentee.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="text-[15px] font-semibold">
                          {mentee.name}
                        </h4>
                        <p className="text-sm text-gray-500">{mentee.role}</p>
                        <p className="text-[12px] text-gray-400 mt-1">
                          {mentee.desc}
                        </p>
                      </div>
                      <button className="absolute top-4 right-4 text-gray-400 hover:text-[#103C8C]">
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                    </div>

                    {/* PHASE */}
                    <div className="text-[12px] bg-[#F0F5FF] inline-block px-3 py-[3px] rounded-full text-[#103C8C] font-medium mb-3">
                      Phase : {mentee.phase}
                    </div>

                    {/* PROGRESS BAR */}
                    <div className="flex flex-col gap-1 mb-3">
                      <p className="text-xs text-gray-500">Progress</p>
                      <div className="w-full bg-gray-200 h-[6px] rounded-full">
                        <div
                          className="h-[6px] bg-[#00B16A] rounded-full"
                          style={{ width: `${mentee.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-right text-gray-500">
                        {mentee.progress}%
                      </p>
                    </div>

                    {/* ACTIONS */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-4 text-[#103C8C] text-[14px]">
                        <i className="fa-regular fa-envelope cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]"></i>
                      </div>

                      {mentee.progress === 100 && (
                        <button className="bg-[#103C8C] text-white text-[12px] font-medium px-4 py-[5px] rounded-md hover:bg-[#0B2F6A] transition">
                          Mark as Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
