"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import FeaturedAvatars from "@/app/Components/FeaturedAvatars";
import PastorCard from "@/app/Components/Card/PastorCard";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import { apiGetRoadmaps, apiGetOverallProgress, apiDeleteRoadmap } from "@/app/Services/api";
import {
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
  apiGetUserProgress,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import { unwrapRoadmapsList } from "@/app/Services/roadmap-assignments";
import DirectorHero from "../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorInputClass,
  directorLabelClass,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
import { DirectorFilterSection } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

/** API may return `_id` as string, `id`, or Mongo `{ $oid }` — progress assign needs string ids. */
function stringifyRoadmapId(raw) {
  if (raw == null) return "";
  if (typeof raw === "object" && raw !== null && "$oid" in raw) {
    return String(raw.$oid);
  }
  return String(raw).trim();
}

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

function pickRoadmapDescription(item, nested0) {
  return (
    firstNonEmpty(nested0?.roadMapDetails, nested0?.description, nested0?.road_map_details) ||
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

function normLower(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

function parseDate(raw) {
  if (raw == null || raw === "") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfWeekMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeekSunday(d) {
  const s = startOfWeekMonday(d);
  const e = new Date(s);
  e.setDate(e.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}

function formatShortDate(d) {
  if (!d) return "";
  try {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function badgeClasses(kind) {
  switch (kind) {
    case "active":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
    case "in progress":
      return "border-sky-400/35 bg-sky-500/15 text-sky-100";
    case "draft":
      return "border-white/20 bg-white/10 text-white/85";
    case "completed":
      return "border-emerald-400/40 bg-emerald-500/20 text-emerald-50";
    case "overdue":
      return "border-red-400/45 bg-red-500/15 text-red-100";
    default:
      return "border-white/20 bg-white/10 text-white/85";
  }
}

function ProgressRing({ pct, size = 52 }) {
  const p = Math.max(0, Math.min(100, Math.round(Number(pct) || 0)));
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (p / 100) * c;
  return (
    <div className="relative h-[52px] w-[52px] shrink-0">
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" className="stroke-white/15" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-[#3498DB]"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white">{p}%</div>
    </div>
  );
}

/** Dark glass dropdown panels (matches director shell). */
const glassPopover =
  "absolute z-[60] mt-2 min-w-[240px] rounded-xl border border-white/15 bg-[#041f35]/95 p-4 shadow-2xl backdrop-blur-xl";
const glassTrigger =
  "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15";

const selectClass = `${directorInputClass} !py-2.5 !text-sm cursor-pointer`;

async function mapLimit(items, limit, fn) {
  const out = [];
  for (let i = 0; i < items.length; i += limit) {
    const chunk = items.slice(i, i + limit);
    const settled = await Promise.allSettled(chunk.map(fn));
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value != null) out.push(s.value);
    }
  }
  return out;
}

function fetchErrorMessage(err) {
  const r = err?.response?.data;
  if (r && typeof r === "object") {
    const m = r.message ?? r.error;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) return m.map(String).join(" ");
  }
  if (typeof err?.message === "string") return err.message;
  return "Something went wrong while loading data.";
}

export default function RevitalizationRoadmapPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isRoadmapHub =
    pathname === "/director/revitalization-roadmap" || pathname === "/director/revitalization-roadmap/";
  const [activeTab, setActiveTab] = useState("roadmap-library");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCount, setFilterCount] = useState(3);
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  const [filters, setFilters] = useState({
    country: true,
    state: true,
    conference: true,
  });
  const [roadmapLibrary, setRoadmapLibrary] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [pastorProgressList, setPastorProgressList] = useState([]);
  const [loadingPastors, setLoadingPastors] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [libraryPage, setLibraryPage] = useState(1);
  const [metricsByRoadmapId, setMetricsByRoadmapId] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPhase, setFilterPhase] = useState("all");
  const [filterPastorId, setFilterPastorId] = useState("all");
  const [filterDue, setFilterDue] = useState("all");
  const [filterCreatedBy, setFilterCreatedBy] = useState("all");
  const [showPastorSidebar, setShowPastorSidebar] = useState(true);
  const [sortBy, setSortBy] = useState("updated");
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [orderedIds, setOrderedIds] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [roadmapFetchError, setRoadmapFetchError] = useState("");
  const [pastorFetchError, setPastorFetchError] = useState("");

  const PAGE_SIZE = 6;

  useEffect(() => {
    setShowFilterPopup(false);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "mentors") setActiveTab("roadmap-library");
  }, [activeTab]);

  const filterPopupRef = useRef(null);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoadingRoadmaps(true);
      setRoadmapFetchError("");
      const res = await apiGetRoadmaps();
      const list = unwrapRoadmapsList(res);
      const mapped = list
        .map((item) => {
          const kids = roadmapChildrenList(item);
          const nested0 = kids.length > 0 ? kids[0] : null;

          const title = pickRoadmapTitle(item, nested0);
          const desc = pickRoadmapDescription(item, nested0);
          const description = desc || "No description yet";
          const completionTime =
            (nested0 && String(nested0.duration || "").trim()) || String(item.duration || "").trim() || "N/A";
          const img = (nested0 && nested0.imageUrl) || item.imageUrl || Card1;
          const rid = stringifyRoadmapId(item._id ?? item.id);
          const endDateRaw = nested0?.endDate || item.endDate || nested0?.completedOn || item.completedOn;
          const createdAt = item.createdAt;
          const updatedAt = item.updatedAt;
          const createdBy =
            item.createdBy?.firstName != null
              ? `${item.createdBy.firstName} ${item.createdBy.lastName || ""}`.trim()
              : typeof item.createdBy === "string"
                ? item.createdBy
                : "";

          return {
            id: rid,
            title,
            description,
            completionTime,
            img,
            raw: item,
            nested0,
            endDateRaw,
            createdAt,
            updatedAt,
            createdBy,
          };
        })
        .filter((row) => Boolean(row.id));
      setRoadmapLibrary(mapped);
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
      setRoadmapFetchError(fetchErrorMessage(err));
    } finally {
      setLoadingRoadmaps(false);
    }
  }, []);

  useEffect(() => {
    if (!isRoadmapHub) return;
    fetchRoadmaps();
  }, [isRoadmapHub, fetchRoadmaps]);

  const reloadPastors = useCallback(async () => {
    try {
      setLoadingPastors(true);
      setPastorFetchError("");
      const res = await apiGetOverallProgress("pastor");
      setPastorProgressList(unwrapOverallProgressList(res));
    } catch (err) {
      console.error("Error fetching pastor progress:", err);
      setPastorProgressList([]);
      setPastorFetchError(fetchErrorMessage(err));
    } finally {
      setLoadingPastors(false);
    }
  }, []);

  useEffect(() => {
    if (!isRoadmapHub) return;
    reloadPastors();
  }, [isRoadmapHub, reloadPastors]);

  useEffect(() => {
    if (!isRoadmapHub) return;
    const onFocus = () => {
      fetchRoadmaps();
      reloadPastors();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRoadmaps();
        reloadPastors();
      }
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchRoadmaps, reloadPastors, isRoadmapHub]);

  /** Keep manual ordering in sync when library ids change (unless rearranging). */
  useEffect(() => {
    const ids = roadmapLibrary.map((r) => r.id).filter(Boolean);
    setOrderedIds((prev) => {
      if (rearrangeMode && prev.length) return prev;
      if (!prev.length) return ids;
      const setPrev = new Set(prev);
      const merged = [...prev.filter((id) => ids.includes(id)), ...ids.filter((id) => !setPrev.has(id))];
      return merged;
    });
  }, [roadmapLibrary, rearrangeMode]);

  const roadmapIdsKey = useMemo(() => roadmapLibrary.map((r) => r.id).sort().join("|"), [roadmapLibrary]);

  /** Aggregate per-roadmap assignment + avg progress from pastors' detailed progress. */
  useEffect(() => {
    if (!roadmapLibrary.length) {
      setMetricsByRoadmapId({});
      return;
    }
    if (loadingPastors) return;
    if (!pastorProgressList.length) {
      setMetricsByRoadmapId({});
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingMetrics(true);
      const pastorRows = pastorProgressList;
      const avatarByUserId = new Map();
      for (const row of pastorRows) {
        const uid = extractUserIdFromOverallProgressRow(row);
        if (!uid) continue;
        avatarByUserId.set(uid, row.profilePicture || null);
      }

      const ids = pastorRows.map((row) => extractUserIdFromOverallProgressRow(row)).filter(Boolean);

      const aggregate = {};
      const bump = (rid, userId, pct, status) => {
        if (!rid || !userId) return;
        const cur = aggregate[rid] || {
          assignedUserIds: new Set(),
          progressSum: 0,
          progressN: 0,
          statuses: [],
          sampleAvatarUrls: [],
        };
        cur.assignedUserIds.add(userId);
        if (typeof pct === "number" && !Number.isNaN(pct)) {
          cur.progressSum += Math.min(100, Math.max(0, pct));
          cur.progressN += 1;
        }
        if (status) cur.statuses.push(normLower(status));
        const av = avatarByUserId.get(userId);
        if (av && cur.sampleAvatarUrls.length < 6) cur.sampleAvatarUrls.push(av);
        aggregate[rid] = cur;
      };

      await mapLimit(ids, 8, async (userId) => {
        try {
          const res = await apiGetUserProgress(userId);
          const pr = unwrapUserProgressDetail(res);
          if (!pr || !Array.isArray(pr.roadmaps)) return null;
          for (const rm of pr.roadmaps) {
            const rid = stringifyRoadmapId(rm.roadMapId ?? rm.roadmapId ?? rm._id);
            if (!rid) continue;
            bump(
              rid,
              userId,
              typeof rm.progressPercentage === "number" ? rm.progressPercentage : Number(rm.progressPercentage),
              rm.status,
            );
          }
          return true;
        } catch (e) {
          console.warn("progress fetch failed for", userId, e);
          return null;
        }
      });

      if (cancelled) return;

      const out = {};
      for (const [rid, cur] of Object.entries(aggregate)) {
        const nAssign = cur.assignedUserIds.size;
        const avg = cur.progressN > 0 ? Math.round(cur.progressSum / cur.progressN) : 0;
        out[rid] = {
          assignedCount: nAssign,
          avgProgress: avg,
          sampleAvatarUrls: cur.sampleAvatarUrls,
          assignedUserIds: cur.assignedUserIds,
        };
      }
      setMetricsByRoadmapId(out);
      setLoadingMetrics(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pastorProgressList, roadmapIdsKey, loadingPastors]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterPopupRef.current && !filterPopupRef.current.contains(event.target)) {
        setShowFilterPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      if (!target?.closest?.(".roadmap-options-menu")) {
        setShowOptionsMenu(null);
      }
    };
    if (showOptionsMenu != null) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showOptionsMenu]);

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

  const handleDeleteRoadmap = async (id) => {
    try {
      await apiDeleteRoadmap(id);
      setRoadmapLibrary((prev) => prev.filter((r) => r.id !== id));
      router.push("/director/revitalization-roadmap");
    } catch (err) {
      console.error("Error deleting roadmap:", err);
    }
  };

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
    const banner = (firstNested && firstNested.imageUrl) || rm.imageUrl || row?.img || "";
    if (banner) qp.set("bannerImage", String(banner));
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  };

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

  const deriveRowUi = useCallback(
    (row) => {
      const rm = row.raw || {};
      const typeStr = normLower(rm.type || "");
      const isPhase = typeStr === "phase" || typeStr.includes("phase");
      const parentStatus = normLower(rm.status || "");
      const nestedSt = normLower(row.nested0?.status || "");
      const m = metricsByRoadmapId[row.id];
      const avg = m?.avgProgress ?? 0;
      const end = parseDate(row.endDateRaw);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let badgeKey = "active";
      let label = "Active";

      if (parentStatus === "completed" || nestedSt === "completed" || avg >= 99) {
        badgeKey = "completed";
        label = "Completed";
      } else if (end && end < today && avg < 95) {
        badgeKey = "overdue";
        label = "Overdue";
      } else if (nestedSt === "not started" || (avg === 0 && parentStatus !== "completed")) {
        badgeKey = "draft";
        label = "Draft";
      } else if (nestedSt === "in progress" || parentStatus === "in progress" || (avg > 0 && avg < 99)) {
        badgeKey = "in progress";
        label = "In Progress";
      }

      let overdueDays = null;
      if (badgeKey === "overdue" && end) {
        overdueDays = Math.max(0, Math.ceil((today - end) / 86400000));
      }

      const weekStart = startOfWeekMonday(new Date());
      const weekEnd = endOfWeekSunday(new Date());
      const dueThisWeek = Boolean(end && end >= weekStart && end <= weekEnd && badgeKey !== "completed");

      return {
        typeLabel: isPhase ? "Phase" : "Single",
        isPhase,
        progressPct: avg,
        badgeKey,
        label,
        end,
        dueThisWeek,
        overdueDays,
      };
    },
    [metricsByRoadmapId],
  );

  const roadmapById = useMemo(() => {
    const m = new Map();
    for (const r of roadmapLibrary) m.set(r.id, r);
    return m;
  }, [roadmapLibrary]);

  const creatorFilterOptions = useMemo(() => {
    const labels = new Map();
    for (const r of roadmapLibrary) {
      const raw = (r.createdBy || "").trim();
      const key = raw || "__none__";
      const label = raw || "Unknown";
      labels.set(key, label);
    }
    return [...labels.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [roadmapLibrary]);

  const orderedLibrary = useMemo(() => {
    const list = orderedIds.map((id) => roadmapById.get(id)).filter(Boolean);
    if (list.length === roadmapLibrary.length) return list;
    return roadmapLibrary;
  }, [orderedIds, roadmapById, roadmapLibrary]);

  const filteredLibrary = useMemo(() => {
    let rows = orderedLibrary.map((r) => ({ ...r, ui: deriveRowUi(r) }));

    const q = (searchQuery || "").trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q));
    }

    if (filterPhase === "phase") rows = rows.filter((r) => r.ui.isPhase);
    if (filterPhase === "single") rows = rows.filter((r) => !r.ui.isPhase);

    if (filterStatus !== "all") {
      const want = filterStatus;
      rows = rows.filter((r) => {
        if (want === "active") return r.ui.badgeKey === "active";
        if (want === "in progress") return r.ui.badgeKey === "in progress";
        if (want === "draft") return r.ui.badgeKey === "draft";
        if (want === "completed") return r.ui.badgeKey === "completed";
        if (want === "overdue") return r.ui.badgeKey === "overdue";
        return true;
      });
    }

    if (filterPastorId !== "all") {
      rows = rows.filter((r) => {
        const m = metricsByRoadmapId[r.id];
        const set = m?.assignedUserIds;
        if (set && typeof set.has === "function") return set.has(filterPastorId);
        return Array.isArray(m?.assignedUserIdList) ? m.assignedUserIdList.includes(filterPastorId) : false;
      });
    }

    if (filterDue === "week") {
      rows = rows.filter((r) => r.ui.dueThisWeek);
    } else if (filterDue === "overdue") {
      rows = rows.filter((r) => r.ui.badgeKey === "overdue");
    }

    if (filterCreatedBy !== "all") {
      if (filterCreatedBy === "__none__") {
        rows = rows.filter((r) => !(r.createdBy || "").trim());
      } else {
        rows = rows.filter((r) => (r.createdBy || "").trim() === filterCreatedBy);
      }
    }

    rows.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return (b.ui.progressPct || 0) - (a.ui.progressPct || 0);
      const da = parseDate(a.updatedAt || a.createdAt)?.getTime() || 0;
      const db = parseDate(b.updatedAt || b.createdAt)?.getTime() || 0;
      return db - da;
    });

    return rows;
  }, [
    orderedLibrary,
    searchQuery,
    filterPhase,
    filterStatus,
    filterPastorId,
    filterDue,
    sortBy,
    deriveRowUi,
    metricsByRoadmapId,
    filterCreatedBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredLibrary.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, libraryPage), totalPages);
  const pagedLibrary = filteredLibrary.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  useEffect(() => {
    setLibraryPage(1);
  }, [searchQuery, activeTab, filterStatus, filterPhase, filterPastorId, filterDue, sortBy, filterCreatedBy]);

  const dashboardStats = useMemo(() => {
    const rows = roadmapLibrary.map((r) => ({ ...r, ui: deriveRowUi(r) }));
    const total = rows.length;
    const active = rows.filter((r) => r.ui.badgeKey === "active" || r.ui.badgeKey === "in progress").length;
    const dueWeek = rows.filter((r) => r.ui.dueThisWeek).length;
    const overdue = rows.filter((r) => r.ui.badgeKey === "overdue").length;
    const pastorsAssigned = Object.values(metricsByRoadmapId).reduce((acc, m) => acc + (m?.assignedCount || 0), 0);
    return { total, active, dueWeek, overdue, pastorsAssigned };
  }, [roadmapLibrary, deriveRowUi, metricsByRoadmapId]);

  const analytics = useMemo(() => {
    const rows = roadmapLibrary.map((r) => ({ ...r, ui: deriveRowUi(r) }));
    const avg =
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((s, r) => s + (r.ui.progressPct || 0), 0) / rows.length);
    let mostAssigned = { title: "—", n: 0 };
    let mostCompleted = { title: "—", pct: -1 };
    let leastEngaged = { title: "—", pct: 101 };
    for (const r of rows) {
      const m = metricsByRoadmapId[r.id];
      const n = m?.assignedCount ?? 0;
      if (n > mostAssigned.n) mostAssigned = { title: r.title, n };
      const p = r.ui.progressPct || 0;
      if (p > mostCompleted.pct) mostCompleted = { title: r.title, pct: p };
      if (p < leastEngaged.pct) leastEngaged = { title: r.title, pct: p };
    }
    return { avg, mostAssigned, mostCompleted, leastEngaged };
  }, [roadmapLibrary, deriveRowUi, metricsByRoadmapId]);

  const suggestions = useMemo(() => {
    const rows = roadmapLibrary.map((r) => ({ ...r, ui: deriveRowUi(r) }));
    const overdueN = rows.filter((r) => r.ui.badgeKey === "overdue").length;
    const weekN = rows.filter((r) => r.ui.dueThisWeek).length;
    return { overdueN, weekN };
  }, [roadmapLibrary, deriveRowUi]);

  const tabBtn = (isActive) =>
    isActive
      ? "border-[#3498DB]/40 bg-[#3498DB]/20 text-white ring-1 ring-[#3498DB]/35"
      : "border-white/15 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10";

  const statStrip = (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className={`${directorGlassCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3498DB]/15 text-[#85c1e9]">
            <i className="fa-solid fa-map text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Total roadmaps</p>
            <p className="text-2xl font-bold text-white">{dashboardStats.total}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">All created roadmaps.</p>
      </div>
      <div className={`${directorGlassCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2ECC71]/15 text-[#a9dfbf]">
            <i className="fa-solid fa-circle-check text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Active roadmaps</p>
            <p className="text-2xl font-bold text-white">{dashboardStats.active}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">In progress.</p>
      </div>
      <div className={`${directorGlassCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F39C12]/15 text-[#f8c471]">
            <i className="fa-regular fa-calendar text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Due this week</p>
            <p className="text-2xl font-bold text-white">{dashboardStats.dueWeek}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">Based on roadmap due dates.</p>
      </div>
      <div className={`${directorGlassCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E74C3C]/15 text-[#f5b7b1]">
            <i className="fa-regular fa-clock text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Overdue roadmaps</p>
            <p className="text-2xl font-bold text-white">{dashboardStats.overdue}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">Past due date &amp; not completed.</p>
      </div>
      <div className={`${directorGlassCard} p-5`}>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#9B59B6]/15 text-[#d7bde2]">
            <i className="fa-solid fa-users text-lg" aria-hidden />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/55">Pastor assignments</p>
            <p className="text-2xl font-bold text-white">{dashboardStats.pastorsAssigned}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-white/55">Sum of pastors on roadmaps (from progress).</p>
      </div>
    </div>
  );

  const clearAllFilters = () => {
    setFilterStatus("all");
    setFilterPhase("all");
    setFilterPastorId("all");
    setFilterDue("all");
    setFilterCreatedBy("all");
    setSearchQuery("");
    setSortBy("updated");
  };

  const handleDragStart = (e, id) => {
    if (!rearrangeMode) return;
    setDragId(id);
    try {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
    } catch {
      /* ignore */
    }
  };

  const handleDragOver = (e) => {
    if (!rearrangeMode) return;
    e.preventDefault();
  };

  const handleDropOn = (e, targetId) => {
    if (!rearrangeMode || !dragId) return;
    e.preventDefault();
    if (dragId === targetId) return;
    setOrderedIds((prev) => {
      const idxFrom = prev.indexOf(dragId);
      const idxTo = prev.indexOf(targetId);
      if (idxFrom < 0 || idxTo < 0) return prev;
      const next = [...prev];
      next.splice(idxFrom, 1);
      next.splice(idxTo, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  const sidebarPastors = useMemo(() => {
    const list = [...pastorProgressList];
    list.sort((a, b) => (b.overallRoadmapProgress || 0) - (a.overallRoadmapProgress || 0));
    return list.slice(0, 5);
  }, [pastorProgressList]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Revitalization Roadmap"
        subtitle="Library and pastor progress — unified for directors."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap" },
        ]}
      />

      {(roadmapFetchError || pastorFetchError) && (
        <div
          className={`${directorGlassCard} mb-6 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}
          role="alert"
        >
          <div className="text-sm text-amber-100">
            {roadmapFetchError && <p>Roadmaps: {roadmapFetchError}</p>}
            {pastorFetchError && <p>Pastor progress: {pastorFetchError}</p>}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {roadmapFetchError ? (
              <button type="button" onClick={() => fetchRoadmaps()} className={directorBtnSecondary}>
                Retry roadmaps
              </button>
            ) : null}
            {pastorFetchError ? (
              <button type="button" onClick={() => reloadPastors()} className={directorBtnSecondary}>
                Retry pastors
              </button>
            ) : null}
          </div>
        </div>
      )}

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-7xl`}>
          {activeTab === "roadmap-library" ? statStrip : null}

          <DirectorFilterSection className="!p-5 sm:!p-6">
            <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
              <div className="min-w-0 w-full md:max-w-[min(100%,28rem)] md:flex-1">
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={activeTab === "roadmap-library" ? "Search roadmaps…" : "Search pastors…"}
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

            {activeTab === "roadmap-library" ? (
              <div className="mt-5 flex flex-col gap-4 border-t border-white/10 pt-5">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 lg:items-end">
                  <div className="lg:col-span-2">
                    <label className={`${directorLabelClass} !mb-1`}>Status</label>
                    <select className={selectClass} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="in progress">In Progress</option>
                      <option value="draft">Draft</option>
                      <option value="completed">Completed</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className={`${directorLabelClass} !mb-1`}>Phase</label>
                    <select className={selectClass} value={filterPhase} onChange={(e) => setFilterPhase(e.target.value)}>
                      <option value="all">All</option>
                      <option value="phase">Phase</option>
                      <option value="single">Single</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className={`${directorLabelClass} !mb-1`}>Pastor</label>
                    <select
                      className={selectClass}
                      value={filterPastorId}
                      onChange={(e) => setFilterPastorId(e.target.value)}
                    >
                      <option value="all">All</option>
                      {pastorProgressList.map((p, idx) => {
                        const pid = extractUserIdFromOverallProgressRow(p) || String(idx);
                        const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Pastor";
                        return (
                          <option key={pid} value={pid}>
                            {name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className={`${directorLabelClass} !mb-1`}>Due date</label>
                    <select className={selectClass} value={filterDue} onChange={(e) => setFilterDue(e.target.value)}>
                      <option value="all">All</option>
                      <option value="week">This week</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div className="lg:col-span-3">
                    <label className={`${directorLabelClass} !mb-1`}>Created by</label>
                    <select
                      className={selectClass}
                      value={filterCreatedBy}
                      onChange={(e) => setFilterCreatedBy(e.target.value)}
                    >
                      <option value="all">All</option>
                      {creatorFilterOptions.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#3498DB] transition hover:text-white"
                  >
                    <i className="fa-solid fa-rotate-left text-xs" aria-hidden />
                    Clear filters
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-white/55">Sort by</span>
                      <select className={`${selectClass} !w-[200px]`} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="updated">Recently updated</option>
                        <option value="progress">Highest progress</option>
                        <option value="title">Title (A–Z)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={showPastorSidebar}
                      onClick={() => setShowPastorSidebar((v) => !v)}
                      title={showPastorSidebar ? "Hide pastors sidebar" : "Show pastors sidebar"}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                        showPastorSidebar
                          ? "border-[#3498DB]/35 bg-[#3498DB]/15 text-white"
                          : "border-white/15 bg-white/5 text-white/75 hover:bg-white/10"
                      }`}
                    >
                      <span
                        className={`relative h-5 w-9 rounded-full transition-colors ${showPastorSidebar ? "bg-[#3498DB]" : "bg-white/25"}`}
                      >
                        <span
                          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                            showPastorSidebar ? "left-[18px]" : "left-0.5"
                          }`}
                        />
                      </span>
                      Pastor roadmaps
                    </button>
                    <button
                      type="button"
                      onClick={() => setRearrangeMode((v) => !v)}
                      className={`${directorBtnSecondary} !px-4 !py-2 !text-sm`}
                    >
                      <i className="fa-solid fa-grip-vertical mr-2 text-xs" aria-hidden />
                      {rearrangeMode ? "Done" : "Rearrange"}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </DirectorFilterSection>

          {activeTab === "roadmap-library" && (
            <div
              className={`mt-6 ${showPastorSidebar ? "lg:flex lg:flex-row-reverse lg:items-start lg:gap-6" : ""}`}
            >
              <div className="min-w-0 flex-1">
                {loadingRoadmaps ? (
                  <div className="flex justify-center py-16">
                    <div className={directorSpinner} />
                  </div>
                ) : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Roadmaps ({filteredLibrary.length})
                          {loadingMetrics || loadingPastors ? (
                            <span className="ml-2 text-xs font-normal text-white/45">Updating metrics…</span>
                          ) : null}
                        </p>
                        <p className="text-xs text-white/55">
                          {rearrangeMode ? "Drag cards to reorder (saved for this session)." : "Click View to open details."}
                        </p>
                      </div>
                    </div>

                    {pagedLibrary.length === 0 ? (
                      <div className={`${directorGlassCard} px-5 py-12 text-center text-sm text-white/65`}>
                        {roadmapLibrary.length === 0
                          ? "No roadmaps yet. Create one with New roadmap."
                          : "No roadmaps match filters."}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        {pagedLibrary.map((roadmap) => {
                          const imgRaw = roadmap?.img;
                          const img =
                            typeof imgRaw === "string" ? resolveApiMediaUrl(imgRaw) || imgRaw : imgRaw || Card1;
                          const m = metricsByRoadmapId[roadmap.id] || {};
                          const avatars = (m.sampleAvatarUrls || []).slice(0, 4);
                          const extra = Math.max(0, (m.assignedCount || 0) - avatars.length);
                          const ui = roadmap.ui;
                          const updated = parseDate(roadmap.updatedAt || roadmap.createdAt);
                          const created = parseDate(roadmap.createdAt);
                          return (
                            <div
                              key={roadmap.id}
                              draggable={rearrangeMode}
                              onDragStart={(e) => handleDragStart(e, roadmap.id)}
                              onDragOver={handleDragOver}
                              onDrop={(e) => handleDropOn(e, roadmap.id)}
                              className={`${directorGlassCard} overflow-hidden ${rearrangeMode ? "cursor-grab ring-1 ring-[#3498DB]/35" : ""}`}
                            >
                              <div className="relative h-40 w-full overflow-hidden">
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  unoptimized={typeof img === "string" && (img.startsWith("blob:") || isRemoteImageSrc(img))}
                                />
                                <div className="absolute left-3 top-3">
                                  <span
                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeClasses(ui.badgeKey)}`}
                                  >
                                    {ui.label}
                                  </span>
                                </div>
                                <div className="absolute right-3 top-3 rounded-full bg-black/35 p-1 backdrop-blur-sm">
                                  <ProgressRing pct={ui.progressPct} />
                                </div>
                                {ui.badgeKey === "overdue" && ui.overdueDays != null ? (
                                  <div className="absolute bottom-3 left-3 rounded-lg bg-red-600/85 px-2 py-1 text-[11px] font-semibold text-white shadow">
                                    Overdue by {ui.overdueDays} day{ui.overdueDays === 1 ? "" : "s"}
                                  </div>
                                ) : null}
                              </div>

                              <div className="space-y-3 p-5">
                                <div>
                                  <p className="line-clamp-2 text-base font-bold text-white">{roadmap.title}</p>
                                  <p className="mt-2 line-clamp-3 text-sm text-white/65">{roadmap.description}</p>
                                </div>

                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Pastors assigned</p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                      {avatars.map((url, i) => (
                                        <div
                                          key={`${roadmap.id}-av-${i}`}
                                          className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-[#041f35]"
                                        >
                                          <Image
                                            src={url || Mentor1}
                                            alt=""
                                            fill
                                            className="object-cover"
                                            unoptimized={typeof url === "string" && isRemoteImageSrc(url)}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                    <span className="text-sm font-semibold text-white/85">
                                      {m.assignedCount ? `${m.assignedCount} pastors` : "0 pastors"}
                                      {extra > 0 ? (
                                        <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/80">
                                          +{extra}
                                        </span>
                                      ) : null}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-sm text-white/70">
                                  <div className="flex items-center gap-2">
                                    <i className="fa-regular fa-calendar text-[#3498DB]" aria-hidden />
                                    {ui.badgeKey === "completed" ? (
                                      <span>Completed {formatShortDate(parseDate(roadmap.endDateRaw)) || "—"}</span>
                                    ) : (
                                      <span>Due {formatShortDate(ui.end) || "—"}</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-white/45">
                                    Duration: {roadmap.completionTime || "—"}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                  <p className="text-xs text-white/45">
                                    Created{" "}
                                    <span className="text-white/65">
                                      {roadmap.createdBy || "—"}
                                      {created ? ` • ${formatShortDate(created)}` : ""}
                                    </span>
                                    {updated ? (
                                      <>
                                        {" "}
                                        · Updated <span className="text-white/65">{formatShortDate(updated)}</span>
                                      </>
                                    ) : null}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openRoadmapView(roadmap)}
                                      className={`${directorBtnPrimary} !px-4 !py-2 !text-sm`}
                                    >
                                      View
                                    </button>
                                    <div className="relative roadmap-options-menu">
                                      <button
                                        type="button"
                                        onClick={() => setShowOptionsMenu(showOptionsMenu === roadmap.id ? null : roadmap.id)}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/10"
                                        aria-label="More"
                                      >
                                        <i className="fa-solid fa-ellipsis-vertical" aria-hidden />
                                      </button>
                                      {showOptionsMenu === roadmap.id ? (
                                        <div className="absolute right-0 z-[120] mt-2 min-w-[11rem] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 shadow-2xl backdrop-blur-xl">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowOptionsMenu(null);
                                              router.push(
                                                `/director/pastor-assignments?roadmapId=${encodeURIComponent(roadmap.id)}`,
                                              );
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                          >
                                            <i className="fa-solid fa-user-plus text-[#3498DB]" aria-hidden />
                                            Assign to
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowOptionsMenu(null);
                                              openRoadmapEdit(roadmap);
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                          >
                                            <i className="fa-regular fa-pen-to-square text-[#3498DB]" aria-hidden />
                                            Edit
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setShowOptionsMenu(null);
                                              handleDeleteRoadmap(roadmap.id);
                                            }}
                                            className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-200 hover:bg-red-500/10"
                                          >
                                            <i className="fa-solid fa-trash" aria-hidden />
                                            Delete
                                          </button>
                                        </div>
                                      ) : null}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {filteredLibrary.length > 0 ? (
                      <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row">
                        <p className="text-xs text-white/50">
                          Showing{" "}
                          <span className="font-semibold text-white/70">
                            {(clampedPage - 1) * PAGE_SIZE + 1}–{Math.min(clampedPage * PAGE_SIZE, filteredLibrary.length)}
                          </span>{" "}
                          of <span className="font-semibold text-white/70">{filteredLibrary.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                            disabled={clampedPage <= 1}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Prev
                          </button>
                          <span className="text-xs font-semibold text-white/70">
                            {clampedPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLibraryPage((p) => Math.min(totalPages, p + 1))}
                            disabled={clampedPage >= totalPages}
                            className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
                      <div className={`${directorGlassCard} p-5`}>
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-white">Roadmap analytics</p>
                          <span className="text-xs text-white/45">This month overview</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Avg. completion</p>
                            <p className="mt-2 text-2xl font-bold text-white">{analytics.avg}%</p>
                            <p className="mt-1 text-xs text-white/45">Across visible roadmap templates</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Most assigned</p>
                            <p className="mt-2 text-sm font-semibold text-white line-clamp-2">{analytics.mostAssigned.title}</p>
                            <p className="mt-1 text-xs text-white/45">{analytics.mostAssigned.n} pastors</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Most completed</p>
                            <p className="mt-2 text-sm font-semibold text-white line-clamp-2">{analytics.mostCompleted.title}</p>
                            <p className="mt-1 text-xs text-white/45">{analytics.mostCompleted.pct}% avg progress</p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Least engaged</p>
                            <p className="mt-2 text-sm font-semibold text-white line-clamp-2">{analytics.leastEngaged.title}</p>
                            <p className="mt-1 text-xs text-white/45">{analytics.leastEngaged.pct}% avg progress</p>
                          </div>
                        </div>
                      </div>

                      <div className={`${directorGlassCard} p-5`}>
                        <p className="mb-4 text-sm font-semibold text-white">Suggestions</p>
                        <div className="space-y-3">
                          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-100">
                              <i className="fa-regular fa-clock" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {suggestions.overdueN} roadmap{suggestions.overdueN === 1 ? "" : "s"} overdue
                              </p>
                              <p className="mt-1 text-xs text-white/55">Review assignments and due dates.</p>
                            </div>
                          </div>
                          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-100">
                              <i className="fa-regular fa-calendar" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white">
                                {suggestions.weekN} roadmap{suggestions.weekN === 1 ? "" : "s"} due this week
                              </p>
                              <p className="mt-1 text-xs text-white/55">Follow up with pastors before deadlines.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border border-[#3498DB]/25 bg-[#3498DB]/10 px-4 py-3 text-sm text-white/85">
                      <span className="font-semibold text-[#aed6f1]">Tip:</span> Use rearrange to prioritize roadmaps by your ministry focus.
                      <span className="float-right text-xs text-white/55">
                        Rearrange mode is {rearrangeMode ? "ON" : "OFF"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {showPastorSidebar ? (
              <aside className="mt-8 w-full shrink-0 lg:mt-0 lg:w-[340px]">
                <div className={`${directorGlassCard} p-5`}>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Pastors roadmaps</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("pastor-roadmaps")}
                      className="text-xs font-semibold text-[#3498DB] hover:underline"
                    >
                      View all
                    </button>
                  </div>
                  {loadingPastors ? (
                    <div className="flex justify-center py-10">
                      <div className={directorSpinner} />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sidebarPastors.map((p, idx) => {
                        const pid = extractUserIdFromOverallProgressRow(p) || String(idx);
                        const img = p.profilePicture || [Mentor1, Mentor2, Mentor3][idx % 3];
                        const pct = Math.round(p.overallRoadmapProgress || 0);
                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() =>
                              router.push(`/director/pastor-assignments?assignUser=${encodeURIComponent(String(pid))}`)
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.06]"
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                              <Image
                                src={img}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">
                                {`${p.firstName || ""} ${p.lastName || ""}`.trim()}
                              </p>
                              <p className="text-xs text-white/45">
                                {p.completedRoadmaps || 0}/{p.totalRoadmaps || 0} roadmaps
                              </p>
                              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-[#3498DB]" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                            <span className="shrink-0 text-xs font-bold text-white/80">{pct}%</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => router.push("/director/all-pastors")}
                        className={`${directorBtnSecondary} mt-2 w-full !justify-center !py-3`}
                      >
                        <i className="fa-solid fa-users mr-2 text-sm" aria-hidden />
                        View all pastors
                      </button>
                    </div>
                  )}
                </div>
              </aside>
              ) : null}
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
                    onItemClick={(item) => {
                      if (item?.id) {
                        router.push(`/director/pastor-assignments?assignUser=${encodeURIComponent(String(item.id))}`);
                      }
                    }}
                  />

                  <div className="mb-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <div className="mb-6 flex justify-end">
                    <div className="relative" ref={filterPopupRef}>
                      <button type="button" onClick={() => setShowFilterPopup(!showFilterPopup)} className={glassTrigger}>
                        <i className="fa-solid fa-filter text-[#3498DB]" />
                        <span>Filter</span>
                        <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[#3498DB]/35 bg-[#3498DB]/20 px-1.5 text-[11px] font-bold text-[#aed6f1]">
                          {filterCount}
                        </span>
                        <i className="fa-solid fa-chevron-down text-xs text-white/60" />
                      </button>

                      {showFilterPopup && (
                        <div className={`${glassPopover} right-0 top-full`}>
                          <h3 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-[#3498DB]">Filter</h3>
                          <div className="mb-4 space-y-3">
                            {["country", "state", "conference"].map((key) => (
                              <label key={key} className="flex cursor-pointer items-center justify-between gap-4">
                                <span className="text-[14px] capitalize text-white/90">{key}</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleFilter(key)}
                                  className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
                                    filters[key] ? "border-[#3498DB] bg-[#3498DB]/40" : "border-white/25 bg-white/5"
                                  }`}
                                >
                                  {filters[key] && <i className="fa-solid fa-check text-[10px] text-white" />}
                                </button>
                              </label>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={handleClearFilter}
                            className="text-[13px] font-semibold text-[#3498DB] transition hover:text-white"
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
                        `${p.firstName} ${p.lastName}`.toLowerCase().includes((searchQuery || "").toLowerCase()),
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
                                router.push(`/director/pastor-assignments?assignUser=${encodeURIComponent(String(pid))}`);
                              }
                            }}
                          />
                        );
                      })}
                    {pastorProgressList.length === 0 && (
                      <p className="col-span-2 py-8 text-center text-white/70">No pastor progress found.</p>
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
