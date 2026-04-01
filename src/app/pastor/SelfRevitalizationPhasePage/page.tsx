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
      <div className="min-h-screen flex items-center justify-center bg-[#062946]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
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
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-10 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto">

          {/* Search & Filter Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center w-[40%] rounded-xl border border-white/20 bg-white/10 overflow-hidden shadow-sm backdrop-blur">
              <i className="fa-solid fa-magnifying-glass text-[#cde2f2] px-3"></i>
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#cde2f2] focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex rounded-xl border border-white/20 bg-white/10 shadow-sm overflow-hidden p-1 backdrop-blur">
                {["All", "Due", "Not Started", "Completed"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`relative px-5 py-[7px] text-sm font-medium transition-all duration-200 ${
                      filter === tab ? "bg-white text-[#0f4a76]" : "text-[#d9ebf8] hover:bg-white/15"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <button className="h-10 w-8 flex items-center justify-center rounded-lg border border-white/20 bg-white/10 shadow-sm hover:bg-white/15">
                <i className="fa-solid fa-ellipsis-vertical text-[#d9ebf8]"></i>
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
                    className="flex overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-[0_2px_6px_rgba(0,0,0,0.05)] transition-all hover:shadow-md"
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
                    <div className="flex w-[58%] flex-col justify-between px-5 py-4 text-white">
                      <div>
                        <h3 className="text-[15px] font-semibold leading-snug mb-[6px]">
                          {item.name}
                        </h3>
                        <p className="mb-[8px] text-[13px] leading-snug text-[#cde2f2]">
                          {item.description || item.roadMapDetails || ""}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[12px] font-medium text-[#d9ebf8]">Status</span>
                          <span className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${
                            status === "Completed"
                              ? "bg-[#d8fff2] text-[#00A878] border-transparent"
                              : "bg-[#e6edff] text-[#1e40af] border-transparent"
                          }`}>
                            {status}
                          </span>
                        </div>

                        {item.duration && (
                          <p className="mt-2 text-[12px] text-[#d9ebf8]">
                            Completion Time{" "}
                            <span className="font-semibold text-white">{item.duration}</span>
                          </p>
                        )}
                      </div>

                      {/* View Button */}
                      <div className="flex justify-end mt-3">
                        <button
                          onClick={() => router.push(`/pastor/jumpstart?id=${item._id}&parentId=${roadmapId}`)}
                          className="rounded-md bg-white px-6 py-[6px] text-[12px] font-semibold text-[#0f4a76] shadow-sm transition hover:bg-[#e7f1fa]"
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
      <div className="min-h-screen flex items-center justify-center bg-[#062946]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
      </div>
    }>
      <SelfRevitalizationContent />
    </Suspense>
  );
}
