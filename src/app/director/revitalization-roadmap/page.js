"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import RoadmapCard from "@/app/Components/RoadmapCard";
import FeaturedAvatars from "@/app/Components/FeaturedAvatars";
import MentorCard from "@/app/Components/Card/MentorCard";
import PastorCard from "@/app/Components/Card/PastorCard";
import HeroBg from "../../Assets/roadmap-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import {
  apiGetRoadmaps,
  apiGetMentorList,
  apiGetOverallProgress,
  apiDeleteRoadmap,
} from "@/app/Services/api";
import { unwrapRoadmapsList } from "@/app/Services/roadmap-assignments";
import DirectorHero from "../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
import { DirectorFilterSection } from "../ui";
import SearchBar from "@/app/Components/SearchBar";

/** Unwrap `roadmaps` as array or `{ items: [] }` (list API). */
function roadmapChildrenList(rm) {
  const raw = rm?.roadmaps;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) return raw.items;
  return [];
}

function roadmapDetailText(raw) {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object" && raw !== null) {
    if (typeof raw.en === "string" && raw.en.trim()) return raw.en.trim();
    if (typeof raw.text === "string" && raw.text.trim()) return raw.text.trim();
  }
  const s = String(raw).trim();
  return s && s !== "[object Object]" ? s : "";
}

function firstNonEmpty(...parts) {
  for (const p of parts) {
    const t = roadmapDetailText(p);
    if (t) return t;
  }
  return "";
}

/** Best-effort display description for a library card (parent + first nested, then scan). */
function pickRoadmapDescription(item, nested0) {
  return (
    firstNonEmpty(
      nested0?.roadMapDetails,
      nested0?.description,
      nested0?.road_map_details,
    ) ||
    firstNonEmpty(item?.roadMapDetails, item?.description, item?.road_map_details) ||
    (() => {
      for (const n of roadmapChildrenList(item)) {
        const t = firstNonEmpty(n?.roadMapDetails, n?.description, n?.road_map_details);
        if (t) return t;
      }
      return "";
    })()
  );
}

function pickRoadmapTitle(item, nested0) {
  return firstNonEmpty(item?.name, item?.title, nested0?.name, nested0?.title) || "Untitled roadmap";
}

/** Dark glass dropdown panels (matches director shell). */
const glassPopover =
  "absolute z-[60] mt-2 min-w-[240px] rounded-xl border border-white/15 bg-[#041f35]/95 p-4 shadow-2xl backdrop-blur-xl";
const glassTrigger =
  "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15";

export default function RevitalizationRoadmapPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState("roadmap-library");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("least-mentees");
  const [filterCount, setFilterCount] = useState(3);
  const [showSortPopup, setShowSortPopup] = useState(false);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filters, setFilters] = useState({
    country: true,
    state: true,
    conference: true,
  });
  const [roadmapLibrary, setRoadmapLibrary] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [mentorsList, setMentorsList] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [pastorProgressList, setPastorProgressList] = useState([]);
  const [loadingPastors, setLoadingPastors] = useState(false);

  useEffect(() => {
    setShowSortPopup(false);
    setShowFilterPopup(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "mentors" || mentorsList.length > 0) return;
    const fetchMentors = async () => {
      try {
        setLoadingMentors(true);
        const res = await apiGetMentorList({ status: "active", limit: 9999 });
        const raw = res.data?.data?.users || res.data?.data?.mentors || [];
        const data = raw.filter((m) => {
          if (m?.isDeleted === true || m?.deletedAt) return false;
          const s = String(m?.status || "").toLowerCase();
          if (s === "inactive" || s === "deleted") return false;
          return true;
        });
        setMentorsList(data);
      } catch (err) {
        console.error("Error fetching mentors:", err);
      } finally {
        setLoadingMentors(false);
      }
    };
    fetchMentors();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== "pastor-roadmaps" || pastorProgressList.length > 0) return;
    const fetchPastors = async () => {
      try {
        setLoadingPastors(true);
        const res = await apiGetOverallProgress("pastor");
        const data = res.data?.data || [];
        setPastorProgressList(data);
      } catch (err) {
        console.error("Error fetching pastor progress:", err);
      } finally {
        setLoadingPastors(false);
      }
    };
    fetchPastors();
  }, [activeTab]);

  const sortPopupRef = useRef(null);
  const filterPopupRef = useRef(null);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoadingRoadmaps(true);
      const res = await apiGetRoadmaps();
      const list = unwrapRoadmapsList(res);
      const mapped = list.map((item) => {
        const kids = roadmapChildrenList(item);
        const nested0 = kids.length > 0 ? kids[0] : null;

        const title = pickRoadmapTitle(item, nested0);
        const desc = pickRoadmapDescription(item, nested0);
        const description = desc || "No description yet";
        const completionTime =
          (nested0 && String(nested0.duration || "").trim()) || String(item.duration || "").trim() || "N/A";
        const img = (nested0 && nested0.imageUrl) || item.imageUrl || Card1;

        return {
          id: item._id,
          title,
          description,
          completionTime,
          img,
          raw: item,
        };
      });
      setRoadmapLibrary(mapped);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
    } finally {
      setLoadingRoadmaps(false);
    }
  }, []);

  useEffect(() => {
    if (pathname !== "/director/revitalization-roadmap") return;
    fetchRoadmaps();
  }, [pathname, fetchRoadmaps]);

  // When returning to this tab (back navigation / restored state), refetch so newly created roadmaps appear.
  useEffect(() => {
    const onFocus = () => fetchRoadmaps();
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchRoadmaps();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchRoadmaps]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortPopupRef.current && !sortPopupRef.current.contains(event.target)) {
        setShowSortPopup(false);
      }
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target)) {
        setShowFilterPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggleFilter = (filterKey) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [filterKey]: !prev[filterKey],
      };
      const activeFilters = Object.values(newFilters).filter(Boolean).length;
      setFilterCount(activeFilters);
      return newFilters;
    });
  };

  const handleClearSort = () => {
    setSortBy("least-mentees");
    setShowSortPopup(false);
  };

  const handleDeleteRoadmap = async (id) => {
    try {
      await apiDeleteRoadmap(id);
      setRoadmapLibrary((prev) => prev.filter((r) => r.id !== id));
      router.push("/director/revitalization-roadmap");
    } catch (err) {
      console.error("Error deleting roadmap:", err);
    }
  };

  /** Browse phases (phase roadmap library card). */
  const openRoadmapView = (row) => {
    const rm = row?.raw || {};
    const t = String(rm.type || "").toLowerCase();
    const isPhaseLibrary = t === "phase" || t.includes("phase");
    const roadmapId = row?.id;
    if (!roadmapId) return;

    if (isPhaseLibrary) {
      router.push(`/director/revitalization-roadmap/phase-list?roadmapId=${encodeURIComponent(roadmapId)}`);
      return;
    }

    const firstNested = roadmapChildrenList(rm)[0] || null;
    const nestedId = firstNested?._id != null ? String(firstNested._id) : "";

    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("type", "single");
    qp.set("isEditMode", "true");
    qp.set("viewOnly", "true");
    if (nestedId) qp.set("nestedRoadmapId", nestedId);
    qp.set("name", String(pickRoadmapTitle(rm, firstNested) || row?.title || ""));
    const subView = pickRoadmapDescription(rm, firstNested);
    if (subView) qp.set("subheading", subView);
    qp.set(
      "completionTime",
      String((firstNested && firstNested.duration) || rm.duration || row?.completionTime || ""),
    );
    const banner =
      (firstNested && firstNested.imageUrl) || rm.imageUrl || row?.img || "";
    if (banner) qp.set("bannerImage", String(banner));
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  };

  /**
   * Edit: phase → roadmap-creation (card) then tasks on roadmap-form; single (e.g. Jump-Start) → same.
   */
  const openRoadmapEdit = (row) => {
    const rm = row?.raw || {};
    const t = String(rm.type || "").toLowerCase();
    const isPhaseLibrary = t === "phase" || t.includes("phase");
    const roadmapId = row?.id;
    if (!roadmapId) return;

    if (isPhaseLibrary) {
      const first = roadmapChildrenList(rm)[0] || null;
      const nestedId = first?._id != null ? String(first._id) : "";
      const qp = new URLSearchParams();
      qp.set("roadmapId", roadmapId);
      qp.set("type", "phase");
      qp.set("isEditMode", "true");
      if (nestedId) qp.set("nestedRoadmapId", nestedId);
      if (first) {
        const nameForPhase = firstNonEmpty(first.name, first.title, rm.name, rm.title);
        if (nameForPhase) qp.set("name", nameForPhase);
        const sub = pickRoadmapDescription(rm, first);
        if (sub) qp.set("subheading", sub);
        if (first.duration) qp.set("completionTime", String(first.duration));
        qp.set("selectedDivision", String(first.phase || "All"));
        if (first.imageUrl) qp.set("bannerImage", String(first.imageUrl));
      }
      router.push(`/director/revitalization-roadmap/roadmap-creation?${qp.toString()}`);
      return;
    }

    /** Single (e.g. Jump-Start): same as phase — edit library card on roadmap-creation, then tasks on roadmap-form. */
    const firstSingle = roadmapChildrenList(rm)[0] || null;
    const nestedIdSingle = firstSingle?._id != null ? String(firstSingle._id) : "";
    const qpSingle = new URLSearchParams();
    qpSingle.set("roadmapId", roadmapId);
    qpSingle.set("type", "single");
    qpSingle.set("isEditMode", "true");
    if (nestedIdSingle) qpSingle.set("nestedRoadmapId", nestedIdSingle);
    qpSingle.set("name", String(pickRoadmapTitle(rm, firstSingle) || row?.title || ""));
    const subSingle = pickRoadmapDescription(rm, firstSingle);
    if (subSingle) qpSingle.set("subheading", subSingle);
    qpSingle.set(
      "completionTime",
      String((firstSingle && firstSingle.duration) || rm.duration || row?.completionTime || ""),
    );
    qpSingle.set("selectedDivision", String((firstSingle && firstSingle.phase) || "All"));
    const bannerSingle = (firstSingle && firstSingle.imageUrl) || rm.imageUrl || "";
    if (bannerSingle) qpSingle.set("bannerImage", String(bannerSingle));
    router.push(`/director/revitalization-roadmap/roadmap-creation?${qpSingle.toString()}`);
  };

  const handleClearFilter = () => {
    setFilters({
      country: false,
      state: false,
      conference: false,
    });
    setFilterCount(0);
    setShowFilterPopup(false);
  };

  const tabBtn = (isActive) =>
    isActive
      ? "border-[#8ec5eb]/40 bg-[#8ec5eb]/20 text-white ring-1 ring-[#8ec5eb]/35"
      : "border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10";

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Revitalization Roadmap"
        subtitle="Library, mentors, and pastor progress — unified for directors."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap" },
        ]}
      />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-7xl`}>
          <DirectorFilterSection className="!p-5 sm:!p-6">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="min-w-0 w-full md:max-w-[min(100%,24rem)] md:flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search roadmaps, mentors, or pastors…"
                  variant="dark"
                  className="w-full"
                />
              </div>

              <div className="flex min-w-0 w-full flex-nowrap items-center justify-end gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] md:ml-auto md:w-auto [&::-webkit-scrollbar]:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab("roadmap-library")}
                  className={`shrink-0 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all sm:px-4 sm:text-[14px] ${tabBtn(activeTab === "roadmap-library")}`}
                >
                  Roadmap library
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mentors")}
                  className={`shrink-0 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all sm:px-4 sm:text-[14px] ${tabBtn(activeTab === "mentors")}`}
                >
                  Mentors
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pastor-roadmaps")}
                  className={`shrink-0 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all sm:px-4 sm:text-[14px] ${tabBtn(activeTab === "pastor-roadmaps")}`}
                >
                  Pastor roadmaps
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/director/pastor-assignments")}
                  className={`${directorBtnSecondary} shrink-0 !px-4 !py-2.5 !text-[13px] sm:!px-5 sm:!text-[14px]`}
                >
                  <i className="fa-solid fa-share-nodes text-sm" />
                  <span>Assign</span>
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/director/revitalization-roadmap/create")}
                  className={`${directorBtnPrimary} shrink-0 !px-4 !py-2.5 !text-[13px] sm:!px-5 sm:!text-[14px]`}
                >
                  <i className="fa-solid fa-plus text-sm" />
                  <span>New roadmap</span>
                </button>
              </div>
            </div>
          </DirectorFilterSection>

          {activeTab === "roadmap-library" && (
            <div>
              {loadingRoadmaps ? (
                <div className="flex justify-center py-16">
                  <div className={directorSpinner} />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                  {roadmapLibrary
                    .filter((r) => {
                      const q = (searchQuery || "").trim().toLowerCase();
                      if (!q) return true;
                      return (
                        r.title.toLowerCase().includes(q) ||
                        r.description.toLowerCase().includes(q)
                      );
                    })
                    .map((roadmap) => (
                      <RoadmapCard
                        key={roadmap.id}
                        variant="directorGlass"
                        id={roadmap.id}
                        img={roadmap.img}
                        title={roadmap.title}
                        description={roadmap.description}
                        completionTime={roadmap.completionTime}
                        onView={() => openRoadmapView(roadmap)}
                        onEdit={() => openRoadmapEdit(roadmap)}
                        onDelete={() => handleDeleteRoadmap(roadmap.id)}
                      />
                    ))}
                  {roadmapLibrary.filter((r) => {
                    const q = (searchQuery || "").trim().toLowerCase();
                    if (!q) return true;
                    return (
                      r.title.toLowerCase().includes(q) ||
                      r.description.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <p className="col-span-2 py-8 text-center text-[15px] text-white/70">
                      {roadmapLibrary.length === 0
                        ? "No roadmaps yet. Create one with New roadmap."
                        : "No roadmaps match your search."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "mentors" && (
            <div>
              {loadingMentors ? (
                <div className="flex justify-center py-16">
                  <div className={directorSpinner} />
                </div>
              ) : (
                <>
                  <FeaturedAvatars
                    items={mentorsList.map((mentor, idx) => {
                      const defaultImages = [Mentor1, Mentor2, Mentor3];
                      return {
                        id: mentor._id || mentor.id,
                        name: `${mentor.firstName} ${mentor.lastName}`,
                        img: mentor.profilePicture || defaultImages[idx % defaultImages.length],
                      };
                    })}
                    gapClass="gap-4"
                    nameClass="text-sm text-white/90"
                    className="mb-6"
                    showGradientBorder={false}
                  />

                  <div
                    className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${directorGlassCard} p-4 sm:p-5`}
                  >
                    <div className="relative flex items-center gap-3" ref={sortPopupRef}>
                      <button
                        type="button"
                        onClick={() => setShowSortPopup(!showSortPopup)}
                        className={glassTrigger}
                      >
                        <span>
                          {sortBy === "least-mentees" ? "Least mentees" : "Most mentees"}
                        </span>
                        <i className="fa-solid fa-chevron-down text-xs text-white/60" />
                      </button>

                      {showSortPopup && (
                        <div className={`${glassPopover} left-0 top-full`}>
                          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#8ec5eb]">
                            Sort by mentee count
                          </h3>
                          <div className="mb-4 space-y-3">
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                type="radio"
                                name="sort"
                                value="least-mentees"
                                checked={sortBy === "least-mentees"}
                                onChange={(e) => {
                                  setSortBy(e.target.value);
                                  setShowSortPopup(false);
                                }}
                                className="h-4 w-4 border-white/30 bg-white/10 text-[#8ec5eb] focus:ring-[#8ec5eb]/40"
                              />
                              <span className="text-[14px] text-white/90">Least mentees</span>
                            </label>
                            <label className="flex cursor-pointer items-center gap-3">
                              <input
                                type="radio"
                                name="sort"
                                value="most-mentees"
                                checked={sortBy === "most-mentees"}
                                onChange={(e) => {
                                  setSortBy(e.target.value);
                                  setShowSortPopup(false);
                                }}
                                className="h-4 w-4 border-white/30 bg-white/10 text-[#8ec5eb] focus:ring-[#8ec5eb]/40"
                              />
                              <span className="text-[14px] text-white/90">Most mentees</span>
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearSort}
                            className="text-[13px] font-semibold text-[#8ec5eb] transition hover:text-white"
                          >
                            Clear sort
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative sm:ml-auto" ref={filterPopupRef}>
                      <button
                        type="button"
                        onClick={() => setShowFilterPopup(!showFilterPopup)}
                        className={glassTrigger}
                      >
                        <i className="fa-solid fa-filter text-[#8ec5eb]" />
                        <span>Filter</span>
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/20 px-1.5 text-[11px] font-bold text-[#cde2f2]">
                          {filterCount}
                        </span>
                        <i className="fa-solid fa-chevron-down text-xs text-white/60" />
                      </button>

                      {showFilterPopup && (
                        <div className={`${glassPopover} right-0 top-full`}>
                          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#8ec5eb]">
                            Filter
                          </h3>
                          <div className="mb-4 space-y-3">
                            {["country", "state", "conference"].map((key) => (
                              <label
                                key={key}
                                className="flex cursor-pointer items-center justify-between gap-4"
                              >
                                <span className="text-[14px] capitalize text-white/90">{key}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFilter(key)}
                                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                    filters[key]
                                      ? "border-[#8ec5eb] bg-[#8ec5eb]/40"
                                      : "border-white/25 bg-white/5"
                                  }`}
                                >
                                  {filters[key] && (
                                    <i className="fa-solid fa-check text-[10px] text-white" />
                                  )}
                                </button>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleClearFilter}
                            className="text-[13px] font-semibold text-[#8ec5eb] transition hover:text-white"
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {mentorsList
                      .filter((m) =>
                        `${m.firstName} ${m.lastName}`
                          .toLowerCase()
                          .includes((searchQuery || "").toLowerCase())
                      )
                      .sort((a, b) => {
                        const aC = a.assignedId?.length || 0;
                        const bC = b.assignedId?.length || 0;
                        return sortBy === "most-mentees" ? bC - aC : aC - bC;
                      })
                      .map((mentor, idx) => {
                        const defaultImages = [Mentor1, Mentor2, Mentor3];
                        const fallback = defaultImages[idx % defaultImages.length];
                        return (
                          <MentorCard
                            key={mentor._id || mentor.id}
                            variant="glass"
                            image={mentor.profilePicture || fallback}
                            name={`${mentor.firstName} ${mentor.lastName}`}
                            role={mentor.role || "Mentor"}
                            menteeCount={mentor.assignedId?.length || 0}
                            onViewDetails={() =>
                              router.push(`/director/mentors/profile/${mentor._id || mentor.id}`)
                            }
                          />
                        );
                      })}
                    {mentorsList.length === 0 && (
                      <p className="col-span-full py-8 text-center text-white/70">No mentors found.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "pastor-roadmaps" && (
            <div>
              {loadingPastors ? (
                <div className="flex justify-center py-16">
                  <div className={directorSpinner} />
                </div>
              ) : (
                <>
                  <FeaturedAvatars
                    items={pastorProgressList.map((pastor, idx) => {
                      const defaultImages = [Mentor1, Mentor2, Mentor3];
                      return {
                        id: pastor.userId,
                        name: `${pastor.firstName} ${pastor.lastName}`,
                        img: pastor.profilePicture || defaultImages[idx % defaultImages.length],
                      };
                    })}
                    gapClass="gap-4"
                    nameClass="text-sm text-white/90"
                    className="mb-6"
                    showGradientBorder={false}
                  />

                  <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="mb-6 flex justify-end">
                    <div className="relative" ref={filterPopupRef}>
                      <button
                        type="button"
                        onClick={() => setShowFilterPopup(!showFilterPopup)}
                        className={glassTrigger}
                      >
                        <i className="fa-solid fa-filter text-[#8ec5eb]" />
                        <span>Filter</span>
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/20 px-1.5 text-[11px] font-bold text-[#cde2f2]">
                          {filterCount}
                        </span>
                        <i className="fa-solid fa-chevron-down text-xs text-white/60" />
                      </button>

                      {showFilterPopup && (
                        <div className={`${glassPopover} right-0 top-full`}>
                          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#8ec5eb]">
                            Filter
                          </h3>
                          <div className="mb-4 space-y-3">
                            {["country", "state", "conference"].map((key) => (
                              <label
                                key={key}
                                className="flex cursor-pointer items-center justify-between gap-4"
                              >
                                <span className="text-[14px] capitalize text-white/90">{key}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFilter(key)}
                                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                    filters[key]
                                      ? "border-[#8ec5eb] bg-[#8ec5eb]/40"
                                      : "border-white/25 bg-white/5"
                                  }`}
                                >
                                  {filters[key] && (
                                    <i className="fa-solid fa-check text-[10px] text-white" />
                                  )}
                                </button>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleClearFilter}
                            className="text-[13px] font-semibold text-[#8ec5eb] transition hover:text-white"
                          >
                            Clear filter
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                    {pastorProgressList
                      .filter((p) =>
                        `${p.firstName} ${p.lastName}`
                          .toLowerCase()
                          .includes((searchQuery || "").toLowerCase())
                      )
                      .map((pastor, idx) => {
                        const defaultImages = [Mentor1, Mentor2, Mentor3];
                        const fallback = defaultImages[idx % defaultImages.length];
                        const pid = pastor.userId || pastor._id || pastor.id;
                        return (
                          <PastorCard
                            key={pid || idx}
                            variant="glass"
                            image={pastor.profilePicture || fallback}
                            name={`${pastor.firstName} ${pastor.lastName}`}
                            description={`${pastor.completedRoadmaps || 0}/${pastor.totalRoadmaps || 0} roadmaps completed`}
                            phase="Roadmap progress"
                            progress={pastor.overallRoadmapProgress || 0}
                            onViewDetails={() => {
                              if (pid) {
                                router.push(`/director/mentees/profile/${pid}`);
                              }
                            }}
                          />
                        );
                      })}
                    {pastorProgressList.length === 0 && (
                      <p className="col-span-2 py-8 text-center text-white/70">
                        No pastor progress found.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
