"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import PhaseImg from "@/app/Assets/phase-img.png";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { apiGetRoadmapsByUser } from "../../Services/api";
import { getCookie } from "@/app/utils/cookies";

interface Phase {
  id: string;
  title: string;
  description: string;
  phase: string;
  months: string;
  status: string;
  sessionDate?: string;
  isPhase: boolean;
  imageUrl: string;
}

export default function RevitalizationRoadmap() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch API
  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(getCookie("user") || "{}");
        const userId = user?.id || user?._id;
        if (!userId) {
          setError("User session not found. Please log in again.");
          return;
        }

        const res = await apiGetRoadmapsByUser(userId);
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const mappedPhases = data.map((item: any) => {
          const isValidImageUrl = (url: string) => {
            return (
              url && (url.startsWith("http://") || url.startsWith("https://"))
            );
          };

          return {
            id: item._id,
            title: item.name,
            description:
              item.description || item.roadMapDetails || "No description",
            phase: item.phase || "N/A",
            months: item.duration || "N/A",
            status:
              item.status?.toLowerCase() === "in progress"
                ? "In-progress"
                : item.status
                ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                : "Not Started",
            sessionDate:
              item.extras?.find((ex: any) => ex.name === "Session Date")
                ?.date || "",
            isPhase: item.type === "Phase" || item.haveNextedRoadMaps === true || (item.roadmaps && item.roadmaps.length > 0),
            imageUrl: isValidImageUrl(item.imageUrl)
              ? item.imageUrl
              : PhaseImg.src,
          };
        });

        setPhases(mappedPhases);
      } catch (err: any) {
        console.error(err);
        setPhases([]);
        setError(err?.response?.data?.message || "Unable to fetch roadmap data from API.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoadmaps();
  }, []);

  const filteredPhases = phases.filter((phase) => {
    const matchesSearch = phase.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesTab =
      activeTab === "All" || phase.status === activeTab.replace("-", " ");
    return matchesSearch && matchesTab;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#062946]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#062946] text-white">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="
          relative bg-cover bg-bottom text-white 
          h-[180px] sm:h-[200px] md:h-[250px]
          flex items-end 
          pb-6 sm:pb-8 md:pb-10 
          px-6 sm:px-10 md:px-20
        "
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">
            Revitalization Roadmap
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Follow your phase-by-phase roadmap and track active milestones.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 sm:px-8 md:px-16 py-8 md:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Top Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
            {/* Search Bar */}
            <div className="flex items-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 shadow-sm backdrop-blur w-full lg:max-w-md">
              <i className="fa-solid fa-magnifying-glass mr-3 text-[#cde2f2]"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none"
              />
            </div>

            {/* Tabs and Menu Container */}
            <div className="flex items-center gap-3 w-full lg:w-auto">
              {/* Tabs */}
              <div className="flex items-center rounded-xl border border-white/20 bg-white/10 px-2 py-1 overflow-x-auto shadow-sm backdrop-blur flex-1 lg:flex-none">
                {["All", "Due", "Not Started", "Completed", "In-progress"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 lg:px-4 py-1.5 whitespace-nowrap text-xs lg:text-sm font-medium rounded-md transition-all ${
                        activeTab === tab
                          ? "bg-white text-[#0f4a76]"
                          : "text-[#d9ebf8] hover:bg-white/15"
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>

              {/* Right Icons */}
              <button className="h-9 w-9 shrink-0 rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] shadow-sm transition hover:bg-white/20">
                <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {filteredPhases.map((phase) => (
              <div
                key={phase.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row"
              >
                {/* Left Image */}
                <div className="relative w-full sm:w-[180px] md:w-[200px] h-[180px] md:h-[200px] flex-shrink-0 m-4">
                  <Image
                    src={phase.imageUrl}
                    alt={phase.title}
                    width={200}
                    height={200}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>

                {/* Right Content */}
                <div className="flex flex-col justify-between flex-1 p-4 md:p-5">
                  <div>
                    <h3 className="mb-1 text-[16px] font-semibold text-white md:text-[17px]">
                      {phase.title}
                    </h3>
                    <p className="mb-3 text-sm text-[#cde2f2]">
                      {phase.description}
                    </p>

                    {/* Status */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-[#d9ebf8]">
                        Status
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-[2px] rounded ${
                          phase.status === "Completed"
                            ? "bg-[#d8fff2] text-[#00A878]"
                            : phase.status === "In-progress"
                            ? "bg-[#fff6d8] text-[#d38a00]"
                            : "bg-[#e6edff] text-[#1e40af]"
                        }`}
                      >
                        {phase.status}
                      </span>
                    </div>

                    {/* Session Date */}
                    {phase.sessionDate && (
                      <div className="flex items-center gap-2 mb-3">
                        <i className="fa-regular fa-calendar text-[#8ec5eb] text-sm"></i>
                        <input
                          type="text"
                          value={phase.sessionDate}
                          readOnly
                          className="w-[140px] rounded-md border border-white/20 bg-white/10 px-2 py-1 text-xs text-[#d9ebf8] focus:outline-none sm:w-[150px]"
                        />
                      </div>
                    )}

                    {/* Completion Time */}
                    <div>
                      <p className="text-[12px] text-[#d9ebf8]">
                        Completion Time
                      </p>
                      <p className="text-sm font-medium text-white">
                        {phase.months}
                      </p>
                    </div>
                  </div>

                  {/* View Button */}
                  <div className="flex justify-end mt-3 sm:mt-0">
                    <button
                      onClick={() =>
                        phase.isPhase
                          ? router.push(`/pastor/SelfRevitalizationPhasePage?id=${phase.id}`)
                          : router.push(`/pastor/jumpstart?id=${phase.id}`)
                      }
                      className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PastorFooter />
    </div>
  );
}
