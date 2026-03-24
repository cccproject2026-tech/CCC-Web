"use client";
import Image from "next/image";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/self-revitalization-hero.png";
import PhaseImg from "@/app/Assets/phase-img.png";
import { apiGetRoadmapById } from "@/app/Services/api";

function SelfRevitalizationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roadmapId = searchParams.get("id");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!roadmapId) return;
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        const res = await apiGetRoadmapById(roadmapId);
        setRoadmap(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [roadmapId]);

  const title = roadmap?.name || "Self Revitalization Phase";
  const phase = roadmap?.phase || "";
  const nestedRoadmaps: any[] = roadmap?.roadmaps || [];

  const isValidImageUrl = (url: string) =>
    url && (url.startsWith("http://") || url.startsWith("https://"));

  const filteredCards = nestedRoadmaps.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(search.toLowerCase());
    const status = item.status || "Not Started";
    const matchesFilter = filter === "All" || status.toLowerCase() === filter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F4A85]">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">{title}</span>
          </p>
          <div className="flex items-center gap-2">
            {phase && (
              <span className="bg-[#FFD84E] text-[#0B1C58] text-xs font-semibold px-3 py-[3px] rounded-md">
                {phase}
              </span>
            )}
            <h1 className="text-3xl font-semibold">{title}</h1>
          </div>
          {roadmap?.duration && (
            <p className="text-white/70 text-sm mt-1">Completion Time {roadmap.duration}</p>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white">
        <div className="max-w-7xl mx-auto">

          {/* Search & Filter Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center w-[40%] bg-white rounded-md overflow-hidden shadow-sm">
              <i className="fa-solid fa-magnifying-glass text-gray-400 px-3"></i>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm text-gray-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-lg shadow-sm overflow-hidden p-1">
                {["All", "Due", "Not Started", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`relative px-5 py-[7px] text-sm font-medium transition-all duration-200 ${
                      filter === tab ? "bg-[#103C8C] text-white" : "text-gray-500 hover:text-[#103C8C]"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button className="bg-white rounded-lg w-8 h-10 flex items-center justify-center shadow-sm hover:bg-gray-50">
                <i className="fa-solid fa-ellipsis-vertical text-[#103C8C]"></i>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredCards.length === 0 ? (
            <div className="text-center py-20 text-white/60">
              {nestedRoadmaps.length === 0 ? "No phases found for this roadmap." : "No results match your filter."}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCards.map((item, index) => {
                const imgSrc = isValidImageUrl(item.imageUrl) ? item.imageUrl : PhaseImg;
                const status = item.status || "Not Started";

                return (
                  <div
                    key={item._id || index}
                    className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Left Image */}
                    <div className="relative w-[42%] h-[200px] shrink-0 m-3">
                      <Image
                        src={imgSrc}
                        alt={item.name}
                        fill
                        className="object-cover rounded-l-2xl"
                      />
                    </div>

                    {/* Right Content */}
                    <div className="flex flex-col justify-between w-[58%] px-5 py-4 text-[#0B1C58]">
                      <div>
                        <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
                          {item.name}
                        </h3>
                        <p className="text-[13px] text-[#6B7280] leading-snug mb-[8px]">
                          {item.description || item.roadMapDetails || ""}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[12px] text-[#6B7280] font-medium">Status</span>
                          <span className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${
                            status === "Completed"
                              ? "bg-[#E0EDFF] text-[#103C8C] border-[#C3D4FF]"
                              : "bg-[#EFF6FF] text-[#6B7280] border-[#E5E7EB]"
                          }`}>
                            {status}
                          </span>
                        </div>

                        {item.duration && (
                          <p className="text-[12px] text-[#6B7280] mt-2">
                            Completion Time{" "}
                            <span className="font-semibold text-[#0B1C58]">{item.duration}</span>
                          </p>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => router.push(`/pastor/jumpstart?id=${item._id}`)}
                          className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-[12px] font-medium px-6 py-[6px] rounded-md shadow-sm"
                        >
                          View
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

      <PastorFooter />
    </div>
  );
}

export default function SelfRevitalizationPhasePage() {

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F4A85]">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SelfRevitalizationContent />
    </Suspense>
  );
}
