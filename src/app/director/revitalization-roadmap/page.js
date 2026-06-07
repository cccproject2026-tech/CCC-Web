"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import {
  apiGetRoadmaps,
  apiDeleteRoadmap,
  apiGetAllUsers,
  apiReorderRoadmaps,
} from "@/app/Services/api";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
  apiGetOverallProgress,
  apiGetUserProgress,
  unwrapUserProgressDetail,
} from "@/app/Services/progress.service";
import { unwrapRoadmapsList } from "@/app/Services/roadmap-assignments";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import DirectorHero from "../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
import SearchBar from "@/app/Components/SearchBar";
import AssignRoadmapModal from "@/app/Components/AssignRoadmapModal";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

/** Stable carousel id: real user id when API provides it (matches progress metrics), else strip index. */
function pastorCarouselRowKey(row, carouselIndex) {
  const id = extractUserIdFromOverallProgressRow(row);
  if (id != null && String(id).trim() !== "") return String(id).trim();
  return String(carouselIndex);
}

/** API may return `_id` as string, `id`, or Mongo `{ $oid }` — progress assign needs string ids. */
function stringifyRoadmapId(raw) {
  if (raw == null) return "";
  if (typeof raw === "object" && raw !== null) {
    if ("$oid" in raw) return String(raw.$oid).trim();
    const o = raw;
    if (o._id != null) return stringifyRoadmapId(o._id);
    if (o.id != null) return stringifyRoadmapId(o.id);
    const s = String(raw).trim();
    return s === "[object Object]" ? "" : s;
  }
  const s = String(raw).trim();
  return s === "[object Object]" ? "" : s;
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

/** Match overall-progress pastor row against search (name variants, email, nested `user`). */
function pastorProgressRowMatchesQuery(row, qNorm) {
  if (!qNorm || !row || typeof row !== "object") return false;
  const r = row;
  const u = r.user && typeof r.user === "object" ? r.user : null;
  const parts = [
    r.firstName,
    r.first_name,
    r.lastName,
    r.last_name,
    r.name,
    r.fullName,
    r.full_name,
    r.displayName,
    r.display_name,
    typeof r.email === "string" ? r.email : "",
    u?.firstName,
    u?.lastName,
    u?.first_name,
    u?.last_name,
    u?.name,
    u?.fullName,
    u?.full_name,
    typeof u?.email === "string" ? u.email : "",
  ];
  const hay = normLower(parts.filter((x) => x != null && String(x).trim() !== "").join(" "));
  if (!hay) return false;
  if (hay.includes(qNorm)) return true;
  const words = qNorm.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return true;
  return false;
}

/** Display name for pastor overview row (first/last, nested user, or fallbacks). */
function pastorRowDisplayName(p) {
  if (!p || typeof p !== "object") return "Pastor";
  const fn = String(p.firstName ?? p.first_name ?? "").trim();
  const ln = String(p.lastName ?? p.last_name ?? "").trim();
  const combined = `${fn} ${ln}`.trim();
  if (combined) return combined;
  const u = p.user && typeof p.user === "object" ? p.user : null;
  if (u) {
    const ufn = String(u.firstName ?? u.first_name ?? "").trim();
    const uln = String(u.lastName ?? u.last_name ?? "").trim();
    const uc = `${ufn} ${uln}`.trim();
    if (uc) return uc;
  }
  const fallbacks = [
    p.name,
    p.fullName,
    p.full_name,
    p.displayName,
    p.display_name,
    u?.name,
    u?.fullName,
    u?.full_name,
  ];
  for (const x of fallbacks) {
    if (typeof x === "string" && x.trim()) return x.trim();
  }
  return "Pastor";
}

/** Match roadmap card fields (title, description, creator) against search. */
function roadmapRowMatchesTextQuery(row, qNorm) {
  if (!qNorm) return true;
  const hay = normLower(`${row.title ?? ""} ${row.description ?? ""} ${row.createdBy ?? ""}`);
  if (hay.includes(qNorm)) return true;
  const words = qNorm.split(/\s+/).filter(Boolean);
  if (words.length > 1 && words.every((w) => hay.includes(w))) return true;
  return false;
}

function parseDate(raw) {
  if (raw == null || raw === "") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatShortDate(d) {
  if (!d) return "";
  try {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/** First API-defined string among camel/snake variants (created metadata). */
function firstDefinedString(...vals) {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}
function getInitialsAvatar(firstName, lastName, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName || ""} ${lastName || ""}`.trim() || fallback
  )}&background=173653&color=ffffff`;
}

/** Pull ISO-ish created timestamp from roadmap list/detail payloads. */
function extractRoadmapCreatedAtRaw(item) {
  if (!item || typeof item !== "object") return null;
  const raw =
    item.createdAt ??
    item.created_at ??
    item.createdDate ??
    item.created_date ??
    item.createdOn ??
    item.created_on ??
    item.dateCreated ??
    item.date_created;
  if (raw == null || raw === "") return null;
  return raw;
}

function extractRoadmapDueDateRaw(item) {
  if (!item || typeof item !== "object") return null;

  const raw =
    item.endDate ??
    item.end_date ??
    item.dueDate ??
    item.due_date ??
    item.dueOn ??
    item.due_on ??
    item.deadline ??
    item.targetDate ??
    item.target_date;

  if (raw == null || raw === "") return null;
  return raw;
}

function progressNestedRows(rm) {
  const raw = rm?.nestedRoadmaps;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) return raw.items;
  return [];
}

function isProgressRowCompleted(row) {
  if (!row || typeof row !== "object") return false;

  const status = String(row.status || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .trim();

  const progressPercentage = Number(row.progressPercentage || 0);
  const totalSteps = Number(row.totalSteps || 0);
  const completedSteps = Number(row.completedSteps || 0);

  if (status.includes("complete")) return true;
  if (progressPercentage >= 100) return true;
  if (totalSteps > 0 && completedSteps >= totalSteps) return true;

  return false;
}

function getProgressTaskStats(progressRoadmap) {
  const nested = progressNestedRows(progressRoadmap);

  if (nested.length > 0) {
    return {
      total: nested.length,
      completed: nested.filter(isProgressRowCompleted).length,
    };
  }

  return {
    total: isProgressRowCompleted(progressRoadmap) ? 1 : 0,
    completed: isProgressRowCompleted(progressRoadmap) ? 1 : 0,
  };
}
/** Creator display name + avatar from populated user, string name fields, or snake_case API. */
function extractRoadmapCreator(item) {
  if (!item || typeof item !== "object") return { name: "", avatar: null };

  const plainName = firstDefinedString(
    item.createdByName,
    item.created_by_name,
    item.creatorName,
    item.createdPersonName,
    item.created_person_name,
    item.createdByFullName,
    item.created_by_full_name,
  );
  const rootAvatar =
    item.createdByAvatar ??
    item.created_by_avatar ??
    item.creatorAvatar ??
    item.creator_avatar ??
    null;
  if (plainName) return { name: plainName, avatar: rootAvatar };

  const cb =
    item.createdBy ??
    item.created_by ??
    item.creator ??
    item.createdByUser ??
    item.created_by_user;

  if (cb && typeof cb === "object") {
    const fn = firstDefinedString(cb.firstName, cb.first_name, cb.givenName);
    const ln = firstDefinedString(cb.lastName, cb.last_name, cb.familyName);
    const combined = `${fn} ${ln}`.trim();
    if (combined) {
      return {
        name: combined,
        avatar:
          cb.profilePicture ??
          cb.profile_picture ??
          cb.avatar ??
          cb.imageUrl ??
          cb.image ??
          null,
      };
    }
    const full = firstDefinedString(cb.fullName, cb.full_name, cb.name);
    if (full) {
      return {
        name: full,
        avatar:
          cb.profilePicture ??
          cb.profile_picture ??
          cb.avatar ??
          cb.imageUrl ??
          cb.image ??
          null,
      };
    }
    const email = typeof cb.email === "string" ? cb.email.trim() : "";
    if (email) {
      return {
        name: email,
        avatar:
          cb.profilePicture ??
          cb.profile_picture ??
          cb.avatar ??
          cb.imageUrl ??
          cb.image ??
          null,
      };
    }
    return { name: "", avatar: null };
  }

  if (typeof cb === "string" && cb.trim()) {
    return { name: "", avatar: null };
  }

  return { name: "", avatar: null };
}

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

const SORT_MENU_WIDTH = 272;

const glassPopoverPanel =
  "min-w-[260px] rounded-xl border border-white/15 bg-[#0d1f33]/98 p-4 shadow-[0_16px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl";
const glassTrigger =
  "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-white/15";

function SortRadio({ checked, onSelect, label, className = "" }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-1 py-2 text-left text-sm text-white/90 transition hover:bg-white/[0.06] ${className}`}
    >
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? "border-[#3498DB] bg-[#3498DB]" : "border-white/35 bg-transparent"
        }`}
        aria-hidden
      >
        {checked ? <span className="h-[5px] w-[5px] rounded-full bg-white shadow-sm" /> : null}
      </span>
      {label}
    </button>
  );
}

export default function RevitalizationRoadmapPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isRoadmapHub =
    pathname === "/director/revitalization-roadmap" || pathname === "/director/revitalization-roadmap/";
  const [searchQuery, setSearchQuery] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");
const [mentorSearch, setMentorSearch] = useState("");
const [pastorSearch, setPastorSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roadmapLibrary, setRoadmapLibrary] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [pastorProgressList, setPastorProgressList] = useState([]);
  const [loadingPastors, setLoadingPastors] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [assignModalRoadmap, setAssignModalRoadmap] = useState(null);
  const [libraryPage, setLibraryPage] = useState(1);
  const [metricsByRoadmapId, setMetricsByRoadmapId] = useState({});
  const [pastorProgressDetails, setPastorProgressDetails] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [filterPastorId, setFilterPastorId] = useState("all");
  const [deleteConfirmRoadmap, setDeleteConfirmRoadmap] = useState(null);
  const [selectedPastorModalId, setSelectedPastorModalId] = useState(null);
  const [activeTab, setActiveTab] = useState("library");
  // const [roadmapSubmissionView, setRoadmapSubmissionView] = useState("today");
  useEffect(() => {
  const tab = searchParams.get("tab");
  const pastorId = searchParams.get("pastorId");

  if (tab === "pastor") {
    setActiveTab("pastor");

    if (pastorId) {
      setFilterPastorId(pastorId);
      setSelectedPastorModalId(pastorId);
    }
  }
}, [searchParams]);
  const [mentorList, setMentorList] = useState([]);
const [mentorListLoading, setMentorListLoading] = useState(false);
const [selectedMentor, setSelectedMentor] = useState(null);
const [selectedMentorPastors, setSelectedMentorPastors] = useState([]);
const [selectedMentorPastorsLoading, setSelectedMentorPastorsLoading] = useState(false);
const [openMentorMenuId, setOpenMentorMenuId] = useState(null);
  const [rearrangeMode, setRearrangeMode] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
const [selectedRoadmapIds, setSelectedRoadmapIds] = useState([]);
  const [orderedIds, setOrderedIds] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [roadmapFetchError, setRoadmapFetchError] = useState("");
  const [pastorFetchError, setPastorFetchError] = useState("");
  /** Created-date ordering. */
  const [sortCreated, setSortCreated] = useState("oldest");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, left: 0 });
  const [browserMounted, setBrowserMounted] = useState(false);
  const sortMenuRef = useRef(null);
  const sortTriggerRef = useRef(null);
  const pastorScrollRef = useRef(null);

  const PAGE_SIZE = 4;

  useEffect(() => {
    setBrowserMounted(true);
  }, []);

  const updateSortMenuPosition = useCallback(() => {
    const el = sortTriggerRef.current;
    if (!el || typeof window === "undefined") return;
    const r = el.getBoundingClientRect();
    const left = Math.max(
      12,
      Math.min(r.right - SORT_MENU_WIDTH, window.innerWidth - SORT_MENU_WIDTH - 12),
    );
    setSortMenuPos({ top: r.bottom + 8, left });
  }, []);

  useLayoutEffect(() => {
    if (!showSortMenu) return;
    updateSortMenuPosition();
    const onReflow = () => updateSortMenuPosition();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [showSortMenu, updateSortMenuPosition]);


  useEffect(() => {
  const activeSearch =
    activeTab === "mentor"
      ? mentorSearch
      : activeTab === "pastor"
        ? pastorSearch
        : librarySearch;

  const id = setTimeout(() => setDebouncedSearch(activeSearch.trim()), 350);
  return () => clearTimeout(id);
}, [activeTab, librarySearch, mentorSearch, pastorSearch]);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoadingRoadmaps(true);
      setRoadmapFetchError("");
      // Load full library; pastor names are filtered client-side (API `search` only matches roadmap fields).
      const res = await apiGetRoadmaps("all", "");
      const list = unwrapRoadmapsList(res);
      const mapped = list
        .map((item) => {
          const kids = roadmapChildrenList(item);
          const nested0 = kids.length > 0 ? kids[0] : null;

          const title = pickRoadmapTitle(item, nested0);
          const desc = pickRoadmapDescription(item, nested0);
          const description = desc || "No description yet";
          // const completionTime =
          //   (nested0 && String(nested0.duration || "").trim()) || String(item.duration || "").trim() || "—";
          const completionTime =
  String(item.duration || "").trim() ||
  (nested0 && String(nested0.duration || "").trim()) ||
  "—";
          // const img = (nested0 && nested0.imageUrl) || item.imageUrl || Card1;
          const img = item.imageUrl || Card1;
          const rid = stringifyRoadmapId(item._id ?? item.id);
          const createdRaw = extractRoadmapCreatedAtRaw(item);
          const createdAt = createdRaw;
          const dueDate = extractRoadmapDueDateRaw(item) || extractRoadmapDueDateRaw(nested0);
          const updatedAt = item.updatedAt ?? item.updated_at;
          const { name: createdBy, avatar: createdByAvatar } = extractRoadmapCreator(item);
          return {
            id: rid,
            title,
            description,
            completionTime,
            img,
            raw: item,
            nested0,
            createdAt,
            dueDate,
            updatedAt,
            createdBy,
            createdByAvatar,
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

  useEffect(() => {
    if (!roadmapLibrary.length) {
      setMetricsByRoadmapId({});
      setLoadingMetrics(false);
      return;
    }
    if (loadingPastors) return;
    if (!pastorProgressList.length) {
      setMetricsByRoadmapId({});
      setLoadingMetrics(false);
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
      // const bump = (rid, userId, pct, status) => {
        const bump = (rid, userId, pct, status, taskStats) => {
        if (!rid || !userId) return;
        const uid = String(userId).trim();
        if (!uid) return;
        const cur = aggregate[rid] || {
          assignedUserIds: new Set(),
          progressSum: 0,
          progressN: 0,
          statuses: [],
          sampleAvatarUrls: [],
          taskStatsByUserId: {},
        };
        cur.assignedUserIds.add(uid);
        if (typeof pct === "number" && !Number.isNaN(pct)) {
          cur.progressSum += Math.min(100, Math.max(0, pct));
          cur.progressN += 1;
        }
        if (status) cur.statuses.push(normLower(status));
        const av = avatarByUserId.get(userId);
        if (av && cur.sampleAvatarUrls.length < 6) cur.sampleAvatarUrls.push(av);
        if (taskStats) {
  cur.taskStatsByUserId[uid] = taskStats;
}
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
  getProgressTaskStats(rm),
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
  taskStatsByUserId: cur.taskStatsByUserId,
};
      }
      setMetricsByRoadmapId(out);
      setLoadingMetrics(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [pastorProgressList, roadmapIdsKey, loadingPastors, roadmapLibrary.length]);


  useEffect(() => {
    if (!showSortMenu) return;
    const handlePointerDown = (event) => {
      const t = event.target;
      if (sortMenuRef.current?.contains(t)) return;
      if (sortTriggerRef.current?.contains(t)) return;
      setShowSortMenu(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [showSortMenu]);

  useEffect(() => {
    if (!showSortMenu) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowSortMenu(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSortMenu]);

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

  const roadmapType = String(rm?.type || row?.raw?.type || "").toLowerCase();

const isPhaseLibrary =
  roadmapType === "phase" ||
  roadmapType.includes("phase") ||
  Array.isArray(rm?.roadmaps);
    const roadmapId = row?.id;
    if (!roadmapId) return;


if (isPhaseLibrary) {
  const pastorId =
    selectedPastorModalId != null
      ? String(selectedPastorModalId)
      : filterPastorId !== "all"
        ? String(filterPastorId)
        : "";

  const qp = new URLSearchParams();
  qp.set("roadmapId", roadmapId);

  if (pastorId) {
    qp.set("pastorView", "true");
    qp.set("userId", pastorId);
    qp.set("pastorId", pastorId);
  }

  router.push(`/director/revitalization-roadmap/phase-list?${qp.toString()}`);
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

  const roadmapById = useMemo(() => {
    const m = new Map();
    for (const r of roadmapLibrary) m.set(r.id, r);
    return m;
  }, [roadmapLibrary]);

  const orderedLibrary = useMemo(() => {
    const list = orderedIds.map((id) => roadmapById.get(id)).filter(Boolean);
    if (list.length === roadmapLibrary.length) return list;
    return roadmapLibrary;
  }, [orderedIds, roadmapById, roadmapLibrary]);

  /** Pastors shown in the carousel: all when search empty; otherwise name/email matches only. */
  const pastorsForCarousel = useMemo(() => {
    const qNorm = normLower(debouncedSearch);
    if (!qNorm) return pastorProgressList;
    return pastorProgressList.filter((p) => pastorProgressRowMatchesQuery(p, qNorm));
  }, [debouncedSearch, pastorProgressList]);

  const filteredLibrary = useMemo(() => {
    let rows = [...orderedLibrary];
if (activeTab === "mentor") {
  rows = rows.filter(
    (r) =>
      String(r.raw?.assignedRole || "")
        .toLowerCase()
        .includes("mentor")
  );
}

if (activeTab === "pastor") {
  rows = rows.filter(
    (r) =>
      String(r.raw?.assignedRole || "")
        .toLowerCase()
        .includes("pastor")
  );
}
    const qNorm = normLower(debouncedSearch);
    const matchingPastorIds = new Set();
    if (qNorm) {
      for (const p of pastorProgressList) {
        const pid = extractUserIdFromOverallProgressRow(p);
        if (!pid) continue;
        if (pastorProgressRowMatchesQuery(p, qNorm)) matchingPastorIds.add(pid);
      }
    }

    // if (filterPastorId !== "all") {
    if (false) {
      rows = rows.filter((r) => {
        const m = metricsByRoadmapId[r.id];
        const set = m?.assignedUserIds;
        if (set && typeof set.has === "function")
          return set.has(filterPastorId) || set.has(String(filterPastorId));
        return false;
      });
      if (qNorm && matchingPastorIds.size === 0) {
        rows = rows.filter((r) => roadmapRowMatchesTextQuery(r, qNorm));
      }
    } else if (qNorm && matchingPastorIds.size === 0) {
      rows = rows.filter((r) => roadmapRowMatchesTextQuery(r, qNorm));
    }


    if (!rearrangeMode && activeTab !== "library") {
  rows.sort((a, b) => {
    const da = parseDate(a.createdAt)?.getTime() || 0;
    const db = parseDate(b.createdAt)?.getTime() || 0;
    return sortCreated === "newest" ? db - da : da - db;
  });
}

    return rows;
 }, [
  activeTab,
  orderedLibrary,
  filterPastorId,
  metricsByRoadmapId,
  sortCreated,
  rearrangeMode,
  debouncedSearch,
  pastorProgressList,
]);

  const selectedPastorHeading = useMemo(() => {
    if (filterPastorId === "all") return "";
    const fid = String(filterPastorId);
    const hit = pastorsForCarousel.find((p, idx) => String(pastorCarouselRowKey(p, idx)) === fid);
    return hit ? pastorRowDisplayName(hit) : "";
  }, [filterPastorId, pastorsForCarousel]);

  const totalPages = Math.max(1, Math.ceil(filteredLibrary.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, libraryPage), totalPages);
  // const pagedLibrary = filteredLibrary.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);
const pagedLibrary = filteredLibrary;
  useEffect(() => {
    setLibraryPage(1);
  // }, [searchQuery, debouncedSearch, filterPastorId, sortCreated]);
  }, [debouncedSearch, filterPastorId, sortCreated]);

  /** Clear pastor selection if they disappear from the filtered carousel (e.g. search changed). */
  useEffect(() => {
    if (filterPastorId === "all") return;
    const visibleIds = new Set(pastorsForCarousel.map((p, idx) => String(pastorCarouselRowKey(p, idx))));
    if (!visibleIds.has(String(filterPastorId))) setFilterPastorId("all");
  }, [filterPastorId, pastorsForCarousel]);

  const scrollPastors = (delta) => {
    const el = pastorScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: "smooth" });
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

  const paginationNumbers = useMemo(() => {
    const total = totalPages;
    const cur = clampedPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = new Set([1, total, cur, cur - 1, cur + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const out = [];
    let prev = 0;
    for (const p of sorted) {
      if (prev && p - prev > 1) out.push("ellipsis");
      out.push(p);
      prev = p;
    }
    return out;
  }, [totalPages, clampedPage]);
const selectedPastorRoadmaps =
  selectedPastorModalId == null
    ? []
    : orderedLibrary.filter((r) => {
        const m = metricsByRoadmapId[r.id];
        const set = m?.assignedUserIds;
        return set && typeof set.has === "function"
          ? set.has(String(selectedPastorModalId))
          : false;
      });

const selectedPastorNameForModal = (() => {
  if (selectedPastorModalId == null) return "";

  const hit = pastorsForCarousel.find(
    (p, idx) =>
      String(pastorCarouselRowKey(p, idx)) === String(selectedPastorModalId)
  );

  return hit ? pastorRowDisplayName(hit) : "Pastor";
})();

const loadMentorsForTab = useCallback(async () => {
  try {
    setMentorListLoading(true);

    const res = await apiGetAllUsers({
      role: "mentor",
      roleMatch: "mixed",
      page: 1,
      limit: 100,
      t: Date.now(),
    });

    const data = res?.data?.data;
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data?.users)
        ? data.users
        : [];

    setMentorList(list);
  } catch (error) {
    console.error("Failed to load mentors", error);
    setMentorList([]);
  } finally {
    setMentorListLoading(false);
  }
}, []);
useEffect(() => {
  if (activeTab !== "mentor") return;
  loadMentorsForTab();
}, [activeTab, loadMentorsForTab]);

const handleSelectMentor = async (mentor) => {
  const mentorId = String(mentor?._id ?? mentor?.id ?? "");
  if (!mentorId) return;

  setSelectedMentor(mentor);
  setSelectedMentorPastors([]);
  setSelectedMentorPastorsLoading(true);

  try {
    const res = await apiGetAssignedUsers(mentorId);
    const list = Array.isArray(res?.data?.data) ? res.data.data : [];
    setSelectedMentorPastors(list);
  } catch (error) {
    console.error("Failed to load assigned pastors", error);
    setSelectedMentorPastors([]);
  } finally {
    setSelectedMentorPastorsLoading(false);
  }
};
const filteredMentorList = useMemo(() => {
  const q = normLower(mentorSearch);

  if (!q) return mentorList;

  return mentorList.filter((mentor) => {
    const name = `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim();
    const hay = normLower(`${name} ${mentor?.email ?? ""}`);

    return hay.includes(q);
  });
}, [mentorList, mentorSearch]);

// const isSameDay = (value) => {
//   const d = parseDate(value);
//   if (!d) return false;

//   const today = new Date();
//   return (
//     d.getDate() === today.getDate() &&
//     d.getMonth() === today.getMonth() &&
//     d.getFullYear() === today.getFullYear()
//   );
// };

// const isWithinLast7Days = (value) => {
//   const d = parseDate(value);
//   if (!d) return false;

//   const now = new Date();
//   const sevenDaysAgo = new Date();
//   sevenDaysAgo.setDate(now.getDate() - 7);

//   return d >= sevenDaysAgo && d <= now;
// };

// const getTaskSubmittedDate = (task) =>
//   task?.submittedAt ||
//   task?.submitted_at ||
//   task?.completedAt ||
//   task?.completed_at ||
//   task?.updatedAt ||
//   task?.updated_at ||
//   null;

// const roadmapSubmissions = useMemo(() => {
//   const rows = [];

//   for (const pastor of pastorProgressDetails) {
//     // const pastorId = extractUserIdFromOverallProgressRow(pastor);
//     // if (!pastorId) continue;

//     // const pastorName = pastorRowDisplayName(pastor);
//     const pastorId = pastor.pastorId;
// const pastorName = pastor.pastorName;
//     const userMetrics = Object.entries(metricsByRoadmapId);

//     for (const [roadmapId, metric] of userMetrics) {
//       const taskStats = metric?.taskStatsByUserId?.[String(pastorId)];
//       if (!taskStats) continue;

//       const roadmap = roadmapById.get(roadmapId);
//       if (!roadmap) continue;

//       const progressRoadmap =
//   pastor.roadmaps?.find?.(
//           (rm) =>
//             stringifyRoadmapId(rm?.roadMapId ?? rm?.roadmapId ?? rm?._id) ===
//             String(roadmapId),
//         ) || null;

//       const tasks = progressNestedRows(progressRoadmap);
//       console.log("TASK DATE DEBUG:", {
//   pastorId,
//   pastorName,
//   roadmapId,
//   roadmapName: roadmap?.title,
//   progressRoadmap,
//   tasks,
//   taskDates: tasks.map((task) => ({
//     name: task?.name || task?.title || task?.taskName,
//     status: task?.status,
//     submittedAt: task?.submittedAt,
//     completedAt: task?.completedAt,
//     updatedAt: task?.updatedAt,
//     createdAt: task?.createdAt,
//   })),
// });

//       for (const task of tasks) {
//         if (!isProgressRowCompleted(task)) continue;

//         const submittedAt = getTaskSubmittedDate(task);
//         if (!submittedAt) continue;

//         if (!isSameDay(submittedAt) && !isWithinLast7Days(submittedAt)) continue;

//         rows.push({
//           pastorId,
//           pastorName,
//           roadmapId,
//           roadmapName: roadmap.title || "Roadmap",
//           phaseName:
//             task?.phaseName ||
//             task?.phase ||
//             task?.sectionTitle ||
//             roadmap?.nested0?.phase ||
//             "Phase",
//           taskId: String(task?._id ?? task?.id ?? task?.nestedRoadMapItemId ?? ""),
//           taskName:
//             task?.name ||
//             task?.title ||
//             task?.taskName ||
//             task?.roadMapDetails ||
//             "Submitted task",
//           submittedAt,
//           isToday: isSameDay(submittedAt),
//         });
//       }
//     }
//   }

//   return rows.sort(
//     (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
//   );
// }, [pastorProgressDetails, metricsByRoadmapId, roadmapById]);
// console.log("ROADMAP SUBMISSIONS:", roadmapSubmissions);
// console.log("PASTOR PROGRESS RAW:", pastorProgressList);
// console.log("METRICS RAW:", metricsByRoadmapId);

// const todaysRoadmapSubmissions = roadmapSubmissions.filter((item) => item.isToday);
// const previousRoadmapSubmissions = roadmapSubmissions.filter((item) => !item.isToday);

// const visibleRoadmapSubmissions =
//   roadmapSubmissionView === "today"
//     ? todaysRoadmapSubmissions
//     : previousRoadmapSubmissions;
  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Revitalization Roadmap"
        subtitle="Plan and execute strategic development roadmap initiatives."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Revitalization Roadmap" },
        ]}
      />

      {(roadmapFetchError || pastorFetchError) && (
        <div
          className={`${directorGlassCard} mx-auto mb-6 flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}
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
          <div className={`${directorPageContainer} max-w-[1400px]`}>
            {browserMounted &&
              showSortMenu &&
              createPortal(
                <div
                  ref={sortMenuRef}
                  role="dialog"
                  aria-label="Sort roadmaps"
                  className={`fixed z-[300] ${glassPopoverPanel}`}
                  style={{
                    top: sortMenuPos.top,
                    left: sortMenuPos.left,
                    width: SORT_MENU_WIDTH,
                  }}
                >
                  <div className="space-y-1" role="radiogroup" aria-label="Created date">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[#7eb8ea]">
                      Created Date
                    </p>
                    <SortRadio
                      checked={sortCreated === "newest"}
                      onSelect={() => setSortCreated("newest")}
                      label="Newest First"
                    />
                    <SortRadio
                      checked={sortCreated === "oldest"}
                      onSelect={() => setSortCreated("oldest")}
                      label="Oldest First"
                    />
                  </div>
                </div>,
                document.body,
              )}
<div className={`${directorGlassCard} mb-8 overflow-visible p-4 sm:p-6`}>
  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
    <div className="min-w-0 w-full lg:max-w-xl lg:flex-1">
      {/* <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search pastors or roadmap titles…"
        variant="dark"
        className="w-full"
      /> */}
      <SearchBar
  value={
    activeTab === "mentor"
      ? mentorSearch
      : activeTab === "pastor"
        ? pastorSearch
        : librarySearch
  }
  onChange={
    activeTab === "mentor"
      ? setMentorSearch
      : activeTab === "pastor"
        ? setPastorSearch
        : setLibrarySearch
  }
  placeholder={
    activeTab === "mentor"
      ? "Search mentors..."
      : activeTab === "pastor"
        ? "Search pastors..."
        : "Search roadmap titles..."
  }
  variant="dark"
  className="w-full"
/>
    </div>
    <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1">
  <button
    type="button"
    onClick={() => {
  setActiveTab("library");
  setFilterPastorId("all");
  setSelectedPastorModalId(null);
}}
    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeTab === "library"
        ? "bg-[#3498DB] text-white"
        : "text-white/70 hover:text-white"
    }`}
  >
    Roadmap Library
  </button>

  <button
    type="button"
    onClick={() => {
  setActiveTab("mentor");
  setFilterPastorId("all");
  setSelectedPastorModalId(null);
}}
    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeTab === "mentor"
        ? "bg-[#3498DB] text-white"
        : "text-white/70 hover:text-white"
    }`}
  >
    Mentor 
  </button>

  <button
    type="button"
    onClick={() => setActiveTab("pastor")}
    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeTab === "pastor"
        ? "bg-[#3498DB] text-white"
        : "text-white/70 hover:text-white"
    }`}
  >
    Pastor Roadmaps
  </button>
</div>
    <button
  type="button"
  onClick={() => router.push("/director/revitalization-roadmap/create")}
  className={`${directorBtnPrimary} !px-4 !py-2.5 !text-[13px]`}
>
  <i className="fa-solid fa-plus text-sm" />
  <span>New Roadmap</span>
</button>
  </div>

  {/* <div className="mt-5 border-t border-white/10 pt-5" aria-hidden /> */}
  <div className="mt-5 border-t border-white/10 pt-5">
  {activeTab === "mentor" ? (
    <p className="mb-4 text-sm font-medium text-[#cde2f2]/85">
      Select a mentor to view their assigned pastors, then open a pastor to review their roadmaps.
    </p>
  ) : activeTab === "pastor" ? (
    <p className="mb-4 text-sm font-medium text-[#cde2f2]/85">
      View roadmaps for all pastors, or select a pastor to review their assigned roadmaps.
    </p>
  ) : null}
</div>
  {activeTab === "mentor" && (
  <div className="pt-1">
    <div className="relative px-4 py-5">
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
          onClick={() => pastorScrollRef.current?.scrollBy({ left: -280, behavior: "smooth" })}
        >
          <i className="fa-solid fa-chevron-left text-sm" />
        </button>

        <div
          ref={pastorScrollRef}
          className="scrollbar-hide flex flex-1 gap-7 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {mentorListLoading ? (
            <div className="flex min-h-[120px] flex-1 items-center justify-center py-4">
              <div className={directorSpinner} />
            </div>
          ) : filteredMentorList.length === 0 ? (
            <div className="flex min-h-[120px] flex-1 items-center justify-center text-sm text-white/60">
              No mentors found.
            </div>
          ) : (
            filteredMentorList.map((mentor, idx) => {
              const mentorId = String(mentor?._id ?? mentor?.id ?? idx);
              const name =
                `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim() ||
                mentor?.email ||
                "Mentor";

              const img =
                String(mentor?.profilePicture || "").trim() ||
                getInitialsAvatar(mentor?.firstName, mentor?.lastName, "Mentor");

              const selected =
                selectedMentor &&
                String(selectedMentor?._id ?? selectedMentor?.id ?? "") === mentorId;

              return (
                <button
                  key={mentorId}
                  type="button"
                  onClick={() => handleSelectMentor(mentor)}
                  className={`group flex shrink-0 flex-col items-center px-2 py-1 text-center transition ${
                    selected ? "opacity-100" : "opacity-[0.82] hover:opacity-100"
                  }`}
                >
                  <div className={`relative mb-2 h-[72px] w-[72px] rounded-full ${selected ? "scale-[1.05]" : ""}`}>
                    <div className="h-full w-full rounded-full bg-gradient-to-b from-[#5dade2] to-[#2874a6] p-[3px]">
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-[#041f35]">
                        <Image
                          src={img}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="72px"
                          unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                        />
                      </div>
                    </div>
                  </div>

                  <span className="max-w-[130px] truncate text-[13px] font-medium text-white/75 group-hover:text-white">
                    {name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
          onClick={() => pastorScrollRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
        >
          <i className="fa-solid fa-chevron-right text-sm" />
        </button>
      </div>
    </div>
  </div>
)}
{activeTab === "pastor" && (
  <div className="pt-1">
    <div className="relative px-4 py-5">
      <div className="relative flex items-center gap-3">
        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
          aria-label="Scroll pastors left"
          onClick={() => scrollPastors(-280)}
        >
          <i className="fa-solid fa-chevron-left text-sm" />
        </button>

        <div
          ref={pastorScrollRef}
          className="scrollbar-hide flex flex-1 gap-7 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {loadingPastors ? (
            <div className="flex min-h-[120px] flex-1 items-center justify-center py-4">
              <div className={directorSpinner} />
            </div>
          ) : pastorsForCarousel.length === 0 ? (
            <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-1 px-4 py-6 text-center text-sm text-white/60">
              <p>{normLower(debouncedSearch) ? "No pastors match your search." : "No pastors yet."}</p>
            </div>
          ) : (
            pastorsForCarousel.map((p, idx) => {
              const pid = pastorCarouselRowKey(p, idx);
              const img =
                String(p.profilePicture || "").trim() || getInitialsAvatar(p.firstName, p.lastName, "Pastor");
              const name = pastorRowDisplayName(p);
              const selected = filterPastorId !== "all" && String(filterPastorId) === String(pid);

              return (
                <button
                  key={`${pid}-${idx}`}
                  type="button"
                  onClick={() => {
                    setSelectedPastorModalId(pid);
                    // setFilterPastorId(pid);
                  }}
                  className={`group flex shrink-0 flex-col items-center px-2 py-1 text-center transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3498DB]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1128] ${
                    selected ? "opacity-100" : "opacity-[0.82] hover:opacity-100"
                  }`}
                  aria-pressed={selected}
                >
                  <div
                    className={`relative mb-2 h-[60px] w-[60px] shrink-0 transition-transform duration-200 ease-out sm:h-[72px] sm:w-[72px] ${
                      selected ? "z-[1] scale-[1.05]" : "scale-100"
                    }`}
                  >
                    <div
                      className={`box-border h-full w-full rounded-full transition-all duration-200 ${
                        selected
                          ? "bg-gradient-to-b from-[#5dade2] to-[#2874a6] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_28px_rgba(52,152,219,0.42)]"
                          : "bg-white/[0.06] p-[2px] ring-1 ring-white/[0.14] hover:bg-white/[0.1] hover:ring-white/25"
                      }`}
                    >
                      <div
                        className={`relative h-full w-full min-h-0 overflow-hidden rounded-full bg-[#041f35] ${
                          selected ? "ring-2 ring-[#0a1128]/90" : "ring-1 ring-black/40"
                        }`}
                      >
                        <Image
                          src={img}
                          alt=""
                          fill
                          className={`object-cover transition-[filter,opacity] duration-200 ${
                            selected ? "brightness-[1.02] saturate-[1.06]" : "brightness-[0.96] saturate-[0.92]"
                          }`}
                          sizes="(max-width: 640px) 72px, 88px"
                          unoptimized={typeof img === "string" && (img.startsWith("blob:") || isRemoteImageSrc(img))}
                        />
                      </div>
                    </div>
                  </div>

                  <span
                    className={`max-w-[130px] truncate text-[13px] transition-all duration-200 ${
                      selected
                        ? "font-semibold text-[#aed6f1] underline decoration-[#3498DB] decoration-2 underline-offset-4"
                        : "font-medium text-white/65 group-hover:text-white/85"
                    }`}
                  >
                    {name}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
          aria-label="Scroll pastors right"
          onClick={() => scrollPastors(280)}
        >
          <i className="fa-solid fa-chevron-right text-sm" />
        </button>
      </div>
    </div>
  </div>
  )}
</div>
{/* {activeTab === "pastor" && (
  <section className={`${directorGlassCard} mb-6 p-5`}>
    <div className="mb-4 flex items-center justify-between gap-4">
      <div>
        <h3 className="text-lg font-semibold text-white">
          {roadmapSubmissionView === "today"
            ? "Today's Roadmap Submissions"
            : "Previous Roadmap Submissions"}
        </h3>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/director/revitalization-roadmap/submissions?view=${roadmapSubmissionView}`,
            )
          }
          className="mt-1 text-xs font-semibold text-[#8ec5eb] hover:underline"
        >
          View all
        </button>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-[#cde2f2]/70">
          {roadmapSubmissionView === "today"
            ? "Go to previous submissions"
            : "Go to today’s submissions"}
        </span>

        <button
          type="button"
          onClick={() =>
            setRoadmapSubmissionView((prev) =>
              prev === "today" ? "previous" : "today",
            )
          }
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 text-white transition hover:bg-[#8ec5eb]/25"
        >
          <i
            className={`fa-solid ${
              roadmapSubmissionView === "today"
                ? "fa-arrow-right"
                : "fa-arrow-left"
            }`}
          />
        </button>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {visibleRoadmapSubmissions.slice(0, 2).map((item, idx) => (
        <div
          key={`${item.roadmapId}-${item.taskId}-${idx}`}
          className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
        >
          <p className="text-sm font-semibold text-white">
            {item.roadmapName}
          </p>

          <p className="mt-1 text-xs text-[#cde2f2]/75">
            Phase: {item.phaseName}
          </p>

          <p className="mt-1 text-xs font-semibold text-amber-200">
            Submitted task: {item.taskName}
          </p>

          <p className="mt-1 text-xs font-semibold text-[#8ec5eb]">
            Pastor: {item.pastorName}
          </p>

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/director/revitalization-roadmap/phase-list?roadmapId=${item.roadmapId}&pastorView=true&userId=${item.pastorId}&pastorId=${item.pastorId}`,
                )
              }
              className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
            >
              View Roadmap
            </button>
          </div>
        </div>
      ))}

      {visibleRoadmapSubmissions.length === 0 && (
        <p className="col-span-full py-6 text-sm text-[#cde2f2]/70">
          No{" "}
          {roadmapSubmissionView === "today"
            ? "roadmap submissions today"
            : "previous roadmap submissions"}{" "}
          found.
        </p>
      )}
    </div>
  </section>
)} */}
          <div className="mb-5 mt-2 flex items-center justify-between gap-3">
  {/* <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
    {filterPastorId === "all"
      ? "All roadmaps"
      : selectedPastorHeading
        ? `${selectedPastorHeading}'s roadmap`
        : "Pastor's roadmap"}
  </h2> */}
  <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
  {activeTab === "library"
    ? "Roadmap Library"
    : activeTab === "mentor"
      ? "Mentors"
      : filterPastorId === "all"
        ? "Pastor Roadmaps"
        : selectedPastorHeading
          ? `${selectedPastorHeading}'s roadmap`
          : "Pastor's roadmap"}
</h2>
{/* {activeTab == "library" ? (
  <div className="flex flex-wrap items-center justify-end gap-2">
    <button
  type="button"
  onClick={() => {
    setSelectMode((v) => !v);
    setSelectedRoadmapIds([]);
  }}
  className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
>
  <i className="fa-regular fa-square-check text-sm" />
  <span>{selectMode ? "Cancel Select" : "Select"}</span>
</button>
    <button
      type="button"
      onClick={() => setRearrangeMode((v) => !v)}
      className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
      title="Rearrange cards"
    >
      <i className="fa-solid fa-table-cells-large text-sm" aria-hidden />
      <span>Rearrange</span>
    </button>

    {/* <button
      type="button"
      onClick={() => router.push("/director/revitalization-roadmap/create")}
      className={`${directorBtnPrimary} !px-4 !py-2.5 !text-[13px]`}
    >
      <i className="fa-solid fa-plus text-sm" />
      <span>New Roadmap</span>
    </button> */}
  {/* </div>
  ) : nul */}
  {activeTab === "library" || activeTab === "pastor" ? (
  <div className="flex flex-wrap items-center justify-end gap-2">

    {activeTab === "pastor" && selectedPastorModalId ? (
      <button
        type="button"
        onClick={() =>
          router.push(
            `/director/revitalization-roadmap/completed-tasks?userId=${selectedPastorModalId}`
          )
        }
        className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
      >
        <i className="fa-solid fa-check-double text-sm" />
        <span>Completed Tasks</span>
      </button>
    ) : null}

    {activeTab === "library" ? (
      <>
        <button
          type="button"
          onClick={() => {
            setSelectMode((v) => !v);
            setSelectedRoadmapIds([]);
          }}
          className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
        >
          <i className="fa-regular fa-square-check text-sm" />
          <span>{selectMode ? "Cancel Select" : "Select"}</span>
        </button>

        <button
          type="button"
          // onClick={() => setRearrangeMode((v) => !v)}
 onClick={async () => {
  if (rearrangeMode) {
    try {
      await apiReorderRoadmaps(orderedIds);
      await fetchRoadmaps();
    } catch (error) {
      console.error("Failed to save roadmap order", error);
    }
  }

  setRearrangeMode((v) => !v);
}}
          className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
          title="Rearrange cards"
        >
          <i className="fa-solid fa-table-cells-large text-sm" aria-hidden />
          <span>{rearrangeMode ? "Done" : "Rearrange"}</span>
        </button>
      </>
    ) : null}

  </div>
) : null}
</div>
{activeTab === "library" && selectMode && selectedRoadmapIds.length > 0 ? (
  <div className="mb-5 flex justify-end gap-2">
    <button
      type="button"
      onClick={() => {
        const firstSelected = roadmapLibrary.find(
          (r) => r.id === selectedRoadmapIds[0]
        );

        if (firstSelected) {
          setAssignModalRoadmap({
            id: firstSelected.id,
            name: firstSelected.title || "Roadmap",
          });
        }
      }}
      className={`${directorBtnPrimary} !px-4 !py-2.5 !text-[13px]`}
    >
      Assign selected
    </button>

    <button
      type="button"
      // onClick={async () => {
      //   for (const id of selectedRoadmapIds) {
      //     await handleDeleteRoadmap(id);
      //   }

      //   setSelectedRoadmapIds([]);
      //   setSelectMode(false);
      // }}
      onClick={() => {
  const firstSelected = roadmapLibrary.find(
    (r) => r.id === selectedRoadmapIds[0]
  );

  if (firstSelected) {
    setDeleteConfirmRoadmap(firstSelected);
  }
}}
      className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
    >
      Delete selected
    </button>
  </div>
) : null}

         {activeTab === "pastor" && filterPastorId === "all" ? (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
    {pastorsForCarousel.map((pastor, idx) => {
      const pastorId = String(pastorCarouselRowKey(pastor, idx));
      const name = pastorRowDisplayName(pastor);

      const img =
        String(pastor?.profilePicture || "").trim() ||
        getInitialsAvatar(pastor?.firstName, pastor?.lastName, "Pastor");

      const progress = Number(
        pastor?.overallProgress ??
          pastor?.progressPercentage ??
          pastor?.progress ??
          0
      );

      return (
        <div
          key={`${pastorId}-${idx}`}
          className={`${directorGlassCard} flex min-h-[150px] gap-4 overflow-hidden p-4`}
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
            <p className="text-sm text-white/60">Pastor</p>

            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-xs font-semibold text-white/75">
                <span>Tasks Completed</span>
                <span>{Number.isFinite(progress) ? progress : 0}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400"
                  style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
                />
              </div>
            </div>

            <div className="mt-auto flex justify-end pt-4">
              <button
                type="button"
                // onClick={() => {
                //   setFilterPastorId(pastorId);
                //   setSelectedPastorModalId(pastorId);
                // }}
                onClick={() => {
  setSelectedPastorModalId(pastorId);
}}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
              >
                View
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
) : activeTab === "mentor" ? (
  <div className="space-y-5">
    {mentorListLoading ? (
      <div className="flex justify-center py-20">
        <div className={directorSpinner} />
      </div>
    ) : filteredMentorList.length === 0 ? (
      <div className={`${directorGlassCard} px-5 py-14 text-center text-sm text-white/65`}>
        No mentors found.
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredMentorList.map((mentor) => {
          const mentorId = String(mentor?._id ?? mentor?.id ?? "");
          const name =
            `${mentor?.firstName ?? ""} ${mentor?.lastName ?? ""}`.trim() ||
            mentor?.email ||
            "Mentor";

          const img =
            String(mentor?.profilePicture || "").trim() ||
            getInitialsAvatar(mentor?.firstName, mentor?.lastName, "Mentor");

          return (
            // <button
            //   key={mentorId}
            //   type="button"
            //   onClick={() => router.push(`/director/revitalization-roadmap/mentor?mentorId=${encodeURIComponent(mentorId)}`)}
            //   className={`${directorGlassCard} flex items-center gap-4 p-4 text-left transition hover:border-[#3498DB]/40`}
            // >
            <div
  key={mentorId}
  onClick={() =>
    router.push(`/director/revitalization-roadmap/mentor?mentorId=${encodeURIComponent(mentorId)}`)
  }
  className={`${directorGlassCard} relative flex cursor-pointer items-center gap-4 p-4 text-left transition hover:border-[#3498DB]/40`}
>
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover"
                  unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                />
              </div>

              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{name}</h3>
                <p className="truncate text-xs text-white/55">{mentor?.email || "Mentor"}</p>
              </div>
              {/* <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    router.push(
      `/director/schedule?mentorId=${encodeURIComponent(mentorId)}`
    );
  }}
  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
  title="Schedule meeting"
>
  <i className="fa-solid fa-ellipsis-vertical text-sm" />
</button> */}
<div className="absolute right-4 top-4">
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      setOpenMentorMenuId((prev) => (prev === mentorId ? null : mentorId));
    }}
    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
    title="More options"
  >
    <i className="fa-solid fa-ellipsis-vertical text-sm" />
  </button>

  {openMentorMenuId === mentorId ? (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-0 top-11 z-30 w-48 rounded-xl border border-white/15 bg-[#0d1f33] p-2 shadow-xl"
    >
      <button
        type="button"
        onClick={() => {
          setOpenMentorMenuId(null);
          router.push(
            `/director/schedule?tab=Schedule&recipientType=mentor&mentorId=${encodeURIComponent(mentorId)}`
          );
        }}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-white/85 hover:bg-white/10"
      >
        <i className="fa-regular fa-calendar-plus text-xs" />
        Schedule Meeting
      </button>
    </div>
  ) : null}
</div>
            </div>
          );
        })}
      </div>
    )}

    {/* {selectedMentor ? (
      <div className={`${directorGlassCard} p-5`}>
        <h3 className="mb-4 text-base font-semibold text-white">Assigned pastors</h3>

        {selectedMentorPastorsLoading ? (
          <div className="flex justify-center py-10">
            <div className={directorSpinner} />
          </div>
        ) : selectedMentorPastors.length === 0 ? (
          <p className="text-sm text-white/60">No pastors assigned to this mentor.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {selectedMentorPastors.map((pastor) => {
              const pastorId = String(pastor?._id ?? pastor?.id ?? "");
              const name =
                `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`.trim() ||
                pastor?.email ||
                "Pastor";

              const img =
                String(pastor?.profilePicture || "").trim() ||
                getInitialsAvatar(pastor?.firstName, pastor?.lastName, "Pastor");

              return (
                <button
                  key={pastorId}
                  type="button"
                  onClick={() => {
                    setActiveTab("pastor");
                    setFilterPastorId(pastorId);
                    setSelectedPastorModalId(pastorId);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:border-[#3498DB]/35 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-full border border-white/15">
                      <Image
                        src={img}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{name}</p>
                      <p className="truncate text-xs text-white/55">{pastor?.email || "Pastor"}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    ) : null} */}
  </div>
) : loadingRoadmaps ? (
            <div className="flex justify-center py-20">
              <div className={directorSpinner} />
            </div>
          ) : (
            <>
              {pagedLibrary.length === 0 ? (
                <div className={`${directorGlassCard} px-5 py-14 text-center text-sm text-white/65`}>
                  {roadmapLibrary.length === 0 ? (
                    "No roadmaps yet. Create one with New Roadmap."
                  ) : filterPastorId !== "all" && (loadingMetrics || loadingPastors) ? (
                    <span>Loading roadmaps for this pastor…</span>
                  ) : (
                    "No roadmaps match your search or pastor filter."
                  )}
                </div>
              ) : (
                // <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* {pagedLibrary.map((roadmap) => { */}
                  {pagedLibrary.map((roadmap, index) => {
                    const imgRaw = roadmap?.img;
                    const thumb =
                      typeof imgRaw === "string" ? resolveApiMediaUrl(imgRaw) || imgRaw : imgRaw || Card1;
                    const created = parseDate(roadmap.createdAt);
                    // const creatorPic = roadmap.createdByAvatar;
                    // const creatorFallback = Mentor1;
                    const isPastorSelected = filterPastorId !== "all";
// const due = parseDate(roadmap.dueDate);
// const roadmapMetrics = metricsByRoadmapId[roadmap.id];
// const progressPercent = Math.max(
//   0,
//   Math.min(100, Number(roadmapMetrics?.avgProgress || 0)),
// );
// const completedText =
//   progressPercent > 0 ? `${progressPercent}% completed` : "0% completed";
const due = parseDate(roadmap.dueDate);
const roadmapMetrics = metricsByRoadmapId[roadmap.id];

const selectedTaskStats =
  roadmapMetrics?.taskStatsByUserId?.[String(filterPastorId)] || null;

const roadmapTaskCount = roadmapChildrenList(roadmap.raw).length;
const totalTasks = selectedTaskStats?.total || roadmapTaskCount || 0;
const completedTasks = selectedTaskStats?.completed || 0;

const progressPercent =
  totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

const completedText =
  totalTasks > 0
    ? `${completedTasks}/${totalTasks} tasks completed`
    : "0 tasks completed";
                    const creatorPic = roadmap.createdByAvatar;
const creatorInitials = getInitialsAvatar("", "", roadmap.createdBy || "Director");

// const selectedPastorRoadmaps =
//   selectedPastorModalId == null
//     ? []
//     : orderedLibrary.filter((r) => {
//         const m = metricsByRoadmapId[r.id];
//         const set = m?.assignedUserIds;
//         return set && typeof set.has === "function"
//           ? set.has(String(selectedPastorModalId))
//           : false;
//       });

// const selectedPastorNameForModal = (() => {
//   if (selectedPastorModalId == null) return "";
//   const hit = pastorsForCarousel.find((p, idx) => String(pastorCarouselRowKey(p, idx)) === String(selectedPastorModalId));
//   return hit ? pastorRowDisplayName(hit) : "Pastor";
// })();
                    return (
                      <div
                        key={roadmap.id}
                        draggable={rearrangeMode}
                        onDragStart={(e) => handleDragStart(e, roadmap.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDropOn(e, roadmap.id)}
                        className={`${directorGlassCard} flex min-h-[148px] overflow-hidden ${
                          rearrangeMode ? "cursor-grab ring-1 ring-[#3498DB]/40" : ""
                        }`}
                      >
                        {/* <div className="relative w-[120px] shrink-0 self-stretch sm:w-[140px]">
                          <Image
                            src={thumb}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="140px"
                            unoptimized={
                              typeof thumb === "string" &&
                              (thumb.startsWith("blob:") || isRemoteImageSrc(thumb))
                            }
                          />
                        </div> */}
                        <div className="relative w-[120px] shrink-0 self-stretch sm:w-[140px]">
                          {selectMode ? (
  <label className="absolute left-3 top-3 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/25 bg-black/45 backdrop-blur">
    <input
      type="checkbox"
      checked={selectedRoadmapIds.includes(roadmap.id)}
      onChange={(e) => {
        setSelectedRoadmapIds((prev) =>
          e.target.checked
            ? [...prev, roadmap.id]
            : prev.filter((id) => id !== roadmap.id)
        );
      }}
      className="h-4 w-4 accent-[#3498DB]"
    />
  </label>
) : null}
  <Image
    src={thumb}
    alt=""
    fill
    className="object-cover"
    sizes="140px"
    unoptimized={
      typeof thumb === "string" &&
      (thumb.startsWith("blob:") || isRemoteImageSrc(thumb))
    }
  />

{index > 0 && index <= 3 ? (
  <span className="absolute bottom-3 left-3 rounded-full bg-yellow-400 px-3 py-1 text-[11px] font-bold text-[#1f2937] shadow-lg">
    Phase {index}
  </span>
) : null}
</div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <h3 className="truncate text-base font-bold text-white sm:text-lg">{roadmap.title}</h3>
                              </div>
                              <div className="relative roadmap-options-menu shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowOptionsMenu(showOptionsMenu === roadmap.id ? null : roadmap.id)
                                  }
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/10"
                                  aria-label="More options"
                                >
                                  <i className="fa-solid fa-ellipsis-vertical" aria-hidden />
                                </button>
                                {showOptionsMenu === roadmap.id ? (
                                  <div className="absolute right-0 z-[120] mt-2 min-w-[11rem] rounded-xl border border-white/15 bg-[#041f35]/98 py-2 shadow-2xl backdrop-blur-xl">
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        setShowOptionsMenu(null);
                                        setAssignModalRoadmap({
                                          id: roadmap.id,
                                          name: roadmap.title || "Roadmap",
                                        });
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                    >
                                      <i className="fa-solid fa-user-plus text-[#3498DB]" aria-hidden />
                                      Assign to
                                    </button> */}
                                    {filterPastorId === "all" && (
  <button
    type="button"
    onClick={() => {
      setShowOptionsMenu(null);
      setAssignModalRoadmap({
        id: roadmap.id,
        name: roadmap.title || "Roadmap",
      });
    }}
    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
  >
    <i className="fa-solid fa-user-plus text-[#3498DB]" aria-hidden />
    Assign to
  </button>
)}
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        setShowOptionsMenu(null);
                                        openRoadmapEdit(roadmap);
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                    >
                                      <i className="fa-regular fa-pen-to-square text-[#3498DB]" aria-hidden />
                                      Edit
                                    </button> */}
                                    {/* <button
                                      type="button"
                                      onClick={() => {
                                        setShowOptionsMenu(null);
                                        openRoadmapView(roadmap);
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                    >
                                      <i className="fa-regular fa-eye text-[#3498DB]" aria-hidden />
                                      View
                                    </button> */}
                                    <button
                                      type="button"
                                      // onClick={() => {
                                      //   setShowOptionsMenu(null);
                                      //   handleDeleteRoadmap(roadmap.id);
                                      // }}
                                      onClick={() => {
  setShowOptionsMenu(null);
  setDeleteConfirmRoadmap(roadmap);
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
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65">{roadmap.description}</p>
                          </div>
{/* 
                          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-3 text-xs text-white/55 sm:grid-cols-3">
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
                                <i className="fa-regular fa-calendar text-[#3498DB]" aria-hidden />
                                Created on
                              </span>
                              <span className="pl-5 text-[13px] text-white/90">{formatShortDate(created) || "—"}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
                                <i className="fa-regular fa-user text-[#3498DB]" aria-hidden />
                                Created by
                              </span>
                              <span className="flex items-center gap-2 pl-5 text-[13px] text-white/90">
                                <span className="relative inline-block h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
                                  <Image
                                    // src={creatorPic || creatorFallback}
                                    src={creatorPic || creatorInitials}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    sizes="28px"
                                    unoptimized={
                                      typeof creatorPic === "string" && creatorPic ? isRemoteImageSrc(creatorPic) : false
                                    }
                                  />
                                </span>
                                <span className="min-w-0 truncate">{roadmap.createdBy || "—"}</span>
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
                                <i className="fa-regular fa-clock text-[#3498DB]" aria-hidden />
                                Completion time
                              </span>
                              <span className="pl-5 text-[13px] text-white/90">{roadmap.completionTime}</span>
                            </div>
                          </div> */}

                          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-3 text-xs text-white/55 sm:grid-cols-3">
  {isPastorSelected ? (
    <>
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
          <i className="fa-regular fa-calendar-check text-[#3498DB]" aria-hidden />
          Due on
        </span>
        <span className="pl-5 text-[13px] text-white/90">
          {formatShortDate(due) || "—"}
        </span>
      </div>

      <div className="flex flex-col gap-1 sm:col-span-1">
        <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
          <i className="fa-solid fa-list-check text-[#3498DB]" aria-hidden />
          Tasks completed
        </span>
        <div className="pl-5">
          <div className="mb-1 text-[13px] font-semibold text-white/90">
            {completedText}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#3498DB] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </>
  ) : (
    <>
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
          <i className="fa-regular fa-calendar text-[#3498DB]" aria-hidden />
          Created on
        </span>
        <span className="pl-5 text-[13px] text-white/90">
          {formatShortDate(created) || "—"}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
          <i className="fa-regular fa-user text-[#3498DB]" aria-hidden />
          Created by
        </span>
        <span className="flex items-center gap-2 pl-5 text-[13px] text-white/90">
          <span className="relative inline-block h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/20">
            <Image
              src={creatorPic || creatorInitials}
              alt=""
              fill
              className="object-cover"
              sizes="28px"
              unoptimized={
                typeof creatorPic === "string" && creatorPic
                  ? isRemoteImageSrc(creatorPic)
                  : false
              }
            />
          </span>
          <span className="min-w-0 truncate">{roadmap.createdBy || "—"}</span>
        </span>
      </div>
    </>
  )}

  <div className="flex flex-col gap-1">
    <span className="inline-flex items-center gap-1.5 font-semibold text-white/70">
      <i className="fa-regular fa-clock text-[#3498DB]" aria-hidden />
      Completion time
    </span>
    <span className="pl-5 text-[13px] text-white/90">
      {roadmap.completionTime}
    </span>
  </div>
</div>
                          <div className="mt-4 flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openRoadmapView(roadmap)}
                              className="inline-flex items-center rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
                            >
                              View
                            </button>
                            {/* <button
                              type="button"
                              onClick={() => openRoadmapEdit(roadmap)}
                              className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                            >
                              Edit
                            </button> */}
                            {!isPastorSelected && (
  <button
    type="button"
    onClick={() => openRoadmapEdit(roadmap)}
    className="inline-flex items-center rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
  >
    Edit
  </button>
)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* {filteredLibrary.length > 0 ? (
                <div className="mt-10 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLibraryPage((p) => Math.max(1, p - 1))}
                      disabled={clampedPage <= 1}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Previous page"
                    >
                      <i className="fa-solid fa-chevron-left text-sm" />
                    </button>
                    {paginationNumbers.map((item, idx) =>
                      item === "ellipsis" ? (
                        <span key={`e-${idx}`} className="px-2 text-white/45">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setLibraryPage(item)}
                          className={`min-w-[40px] rounded-lg px-3 py-2 text-sm font-semibold transition ${
                            clampedPage === item
                              ? "border border-[#3498DB]/45 bg-[#3498DB]/25 text-white shadow-inner"
                              : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={() => setLibraryPage((p) => Math.min(totalPages, p + 1))}
                      disabled={clampedPage >= totalPages}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Next page"
                    >
                      <i className="fa-solid fa-chevron-right text-sm" />
                    </button>
                  </div>
                  <p className="text-xs text-white/45">
                    Showing {(clampedPage - 1) * PAGE_SIZE + 1}–
                    {Math.min(clampedPage * PAGE_SIZE, filteredLibrary.length)} of {filteredLibrary.length}
                  </p>
                </div>
              ) : null} */}
{/* <div className="mb-4">
              <p className="text-[15px] font-medium text-white/90">
                Select a pastor below to view their assigned roadmap.
              </p>
            </div>

            <div className="rounded-xl bg-[radial-gradient(ellipse_85%_85%_at_50%_36%,rgba(52,152,219,0.16),transparent_62%)] px-1 py-4 sm:px-2 sm:py-5"> */}
            {/* <div className="mt-10 border-t border-white/10 pt-7">
  <p className="mb-5 text-sm font-semibold text-white/80">
    Select a pastor to view their assigned roadmaps.
  </p>

 <div className="relative rounded-2xl bg-white/[0.025] px-4 py-5">
              <div className="relative flex items-center gap-3">
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
                  aria-label="Scroll pastors left"
                  onClick={() => scrollPastors(-280)}
                >
                  <i className="fa-solid fa-chevron-left text-sm" />
                </button>
                <div
                  ref={pastorScrollRef}
                  className="scrollbar-hide flex flex-1 gap-7 overflow-x-auto pb-1 pt-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                  {loadingPastors ? (
                    <div className="flex min-h-[120px] flex-1 items-center justify-center py-4">
                      <div className={directorSpinner} />
                    </div>
                  ) : pastorsForCarousel.length === 0 ? (
                    <div className="flex min-h-[120px] flex-1 flex-col items-center justify-center gap-1 px-4 py-6 text-center text-sm text-white/60">
                      <p>{normLower(debouncedSearch) ? "No pastors match your search." : "No pastors yet."}</p>
                    </div>
                  ) : (
                    pastorsForCarousel.map((p, idx) => {
                      const pid = pastorCarouselRowKey(p, idx);
                      const img =
                        String(p.profilePicture || "").trim() || getInitialsAvatar(p.firstName, p.lastName, "Pastor");
                      const name = pastorRowDisplayName(p);
                      const selected = filterPastorId !== "all" && String(filterPastorId) === String(pid);
                      return (
                        <button
                          key={`${pid}-${idx}`}
                          type="button"
                          // onClick={() => setFilterPastorId((prev) => (String(prev) === String(pid) ? "all" : pid))}
                          onClick={() => {
  setSelectedPastorModalId(pid);
  setFilterPastorId(pid);
}}
                          className={`group flex shrink-0 flex-col items-center px-2 py-1 text-center transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3498DB]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1128] ${
                            selected
                              ? "opacity-100"
                              : "opacity-[0.82] hover:opacity-100"
                          }`}
                          aria-pressed={selected}
                        >
                          <div
                            className={`relative mb-2 h-[60px] w-[60px] shrink-0 sm:h-[72px] sm:w-[72px] transition-transform duration-200 ease-out ${
                              selected ? "z-[1] scale-[1.05]" : "scale-100"
                            }`}
                          >
                            <div
                              className={`box-border h-full w-full rounded-full transition-all duration-200 ${
                                selected
                                  ? "bg-gradient-to-b from-[#5dade2] to-[#2874a6] p-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_8px_28px_rgba(52,152,219,0.42)]"
                                  : "bg-white/[0.06] p-[2px] ring-1 ring-white/[0.14] hover:bg-white/[0.1] hover:ring-white/25"
                              }`}
                            >
                              <div
                                className={`relative h-full w-full min-h-0 overflow-hidden rounded-full bg-[#041f35] ${
                                  selected ? "ring-2 ring-[#0a1128]/90" : "ring-1 ring-black/40"
                                }`}
                              >
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className={`object-cover transition-[filter,opacity] duration-200 ${
                                    selected
                                      ? "brightness-[1.02] saturate-[1.06]"
                                      : "brightness-[0.96] saturate-[0.92]"
                                  }`}
                                  sizes="(max-width: 640px) 72px, 88px"
                                  unoptimized={
                                    typeof img === "string" && (img.startsWith("blob:") || isRemoteImageSrc(img))
                                  }
                                />
                              </div>
                            </div>
                          </div>
                          <span
                            className={`max-w-[130px] truncate text-[13px] transition-all duration-200 ${
                              selected
                                ? "font-semibold text-[#aed6f1] underline decoration-[#3498DB] decoration-2 underline-offset-4"
                                : "font-medium text-white/65 group-hover:text-white/85"
                            }`}
                          >
                            {name}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
                <button
                  type="button"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#8ec5eb] shadow-sm transition hover:bg-white/15"
                  aria-label="Scroll pastors right"
                  onClick={() => scrollPastors(280)}
                >
                  <i className="fa-solid fa-chevron-right text-sm" />
                </button>
              </div>
            </div>
            </div> */}
              {rearrangeMode ? (
                <p className="mt-6 text-center text-xs text-white/50">
                  Drag cards to reorder for this session. Tap <strong className="text-white/70">Done</strong> on Rearrange when finished.
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
      {/* {selectedPastorModalId != null ? ( */}
      {browserMounted && selectedPastorModalId != null
  ? createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#07172b]/95 p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {selectedPastorNameForModal}'s roadmaps
          </h2>
       
          <p className="mt-1 text-xs text-white/50">
            Assigned roadmap list
          </p>
        </div>
      

          <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() =>
        router.push(
          `/director/revitalization-roadmap/completed-tasks?userId=${selectedPastorModalId}`,
        )
      }
      className="rounded-xl border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
    >
      Completed Tasks
    </button>

    <button
      type="button"
          // onClick={() => {
          //   setSelectedPastorModalId(null);
          //   // setFilterPastorId("all");
          // }}
//           onClick={() => {
//   const returnTo = searchParams.get("returnTo");

//   if (returnTo) {
//     router.push(returnTo);
//     return;
//   }

//   setSelectedPastorModalId(null);
//   // setFilterPastorId("all");
// }}
onClick={() => {
  const returnTo = searchParams.get("returnTo");

  if (returnTo) {
    router.push(returnTo);
    return;
  }

  setSelectedPastorModalId(null);
  setFilterPastorId("all");
}}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/75 transition hover:bg-white/15 hover:text-white"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark" />
        </button>
          </div>
      </div>

      {/* <div className="max-h-[520px] space-y-4 overflow-y-auto pr-1"> */}
      <div className="custom-scrollbar max-h-[520px] space-y-4 overflow-y-auto pr-1">
        {selectedPastorRoadmaps.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center text-sm text-white/60">
            No assigned roadmaps found for this pastor.
          </div>
        ) : (

          selectedPastorRoadmaps.map((roadmap) => {
  const due = parseDate(roadmap.dueDate);
  const roadmapMetrics = metricsByRoadmapId[roadmap.id];

  const selectedTaskStats =
    roadmapMetrics?.taskStatsByUserId?.[String(selectedPastorModalId)] || null;

  const roadmapTaskCount = roadmapChildrenList(roadmap.raw).length;
  const totalTasks = selectedTaskStats?.total || roadmapTaskCount || 0;
  const completedTasks = selectedTaskStats?.completed || 0;

  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div
      key={`modal-${roadmap.id}`}
      className="flex min-h-[130px] overflow-hidden rounded-2xl border border-white/12 bg-white/[0.04]"
    >
      <div className="relative w-[110px] shrink-0 self-stretch">
        <Image
          src={
            typeof roadmap.img === "string"
              ? resolveApiMediaUrl(roadmap.img) || roadmap.img
              : roadmap.img || Card1
          }
          alt=""
          fill
          className="object-cover"
          sizes="110px"
          unoptimized={typeof roadmap.img === "string" && isRemoteImageSrc(roadmap.img)}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="truncate text-base font-semibold text-white">{roadmap.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/60">{roadmap.description}</p>
        </div>

        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="grid flex-1 grid-cols-1 gap-2 text-xs text-white/55 sm:grid-cols-3">
            <span>
              Due on: <span className="text-white/85">{formatShortDate(due) || "—"}</span>
            </span>

            <span>
              Tasks:{" "}
              <span className="text-white/85">
                {totalTasks > 0 ? `${completedTasks}/${totalTasks} completed` : "0 tasks completed"}
              </span>
            </span>

            <span>
              Completion time: <span className="text-white/85">{roadmap.completionTime}</span>
            </span>
          </div>

          {/* <button
            type="button"
            onClick={() => openRoadmapView(roadmap)}
            className="rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
          >
            View
          </button> */}
          <button
  type="button"
  onClick={() => {
    const qp = new URLSearchParams();

    qp.set("roadmapId", roadmap.id);
    qp.set("pastorView", "true");
    qp.set("userId", String(selectedPastorModalId));
    qp.set("pastorId", String(selectedPastorModalId));

    router.push(`/director/revitalization-roadmap/phase-list?${qp.toString()}`);
  }}
  className="rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/18 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#3498DB]/28"
>
  View
</button>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#3498DB] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
})
        )}
      </div>
    </div>
  </div>
// ) : null}
,
document.body
)
: null}
      {/* <AssignRoadmapModal
        isOpen={Boolean(assignModalRoadmap?.id)}
        onClose={() => setAssignModalRoadmap(null)}
        roadmapIds={assignModalRoadmap?.id ? [String(assignModalRoadmap.id)] : []}
        roadmapName={assignModalRoadmap?.name || "Roadmap"}
        onSuccess={() => setAssignModalRoadmap(null)}
      /> */}
      <AssignRoadmapModal
  isOpen={Boolean(assignModalRoadmap)}
  onClose={() => setAssignModalRoadmap(null)}
  roadmapIds={
    selectedRoadmapIds.length > 0
      ? selectedRoadmapIds
      : assignModalRoadmap?.id
        ? [assignModalRoadmap.id]
        : []
  }
  roadmapName={assignModalRoadmap?.name || "Selected roadmap"}
  onSuccess={() => {
    setSelectedRoadmapIds([]);
    setSelectMode(false);
    fetchRoadmaps();
    reloadPastors();
  }}
/>
{selectedMentor ? (
  <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
    <div className="max-h-[85vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-white/15 bg-[#101a33] p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Assigned Pastors</h2>
          {/* <p className="mt-1 text-sm text-white/60">Pastors Roadmap Under</p> */}
          <p className="mt-1 text-sm text-white/60">
          Pastors Roadmap Under  {`${selectedMentor?.firstName ?? ""} ${selectedMentor?.lastName ?? ""}`.trim() ||
              selectedMentor?.email ||
              "Selected mentor"}

          </p>

        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedMentor(null);
            setSelectedMentorPastors([]);
          }}
          className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/15"
        >
          ✕
        </button>
      </div>

      {selectedMentorPastorsLoading ? (
        <div className="flex justify-center py-16">
          <div className={directorSpinner} />
        </div>
      ) : selectedMentorPastors.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h3 className="text-lg font-bold text-white">No assigned pastors found</h3>
          <p className="mt-2 text-sm text-white/60">
            This mentor does not have assigned pastors yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {selectedMentorPastors.map((pastor) => {
            const pastorId = String(pastor?._id ?? pastor?.id ?? "");
            const name =
              `${pastor?.firstName ?? ""} ${pastor?.lastName ?? ""}`.trim() ||
              pastor?.email ||
              "Pastor";

            const img =
              String(pastor?.profilePicture || "").trim() ||
              getInitialsAvatar(pastor?.firstName, pastor?.lastName, "Pastor");

            return (
              <div
                key={pastorId}
                className="flex min-h-[210px] flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-white/15">
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                    />
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-white">{name}</h3>
                    <p className="truncate text-sm text-white/60">
                      {pastor?.email || "Pastor"}
                    </p>
                  </div>
                </div>
{/* 
                <div className="mt-5 flex justify-end">
                  <button
                    type="button"
                  onClick={() => {
  setSelectedMentor(null);
  setSelectedMentorPastors([]);
  setActiveTab("pastor");
  setSelectedPastorModalId(pastorId);
}}
                    className="rounded-2xl bg-[#3498DB] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5dade2]"
                  >
                    View Roadmap
                  </button>
                </div> */}
                <div className="mt-5 flex justify-end gap-3">
  {pastor?.email ? (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        window.location.href = `mailto:${pastor.email}`;
      }}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/75 transition hover:bg-[#3498DB]/25 hover:text-white"
      title={`Email ${pastor.email}`}
    >
      <i className="fa-regular fa-envelope text-sm" />
    </button>
  ) : null}

  <button
    type="button"
    onClick={() => {
      setSelectedMentor(null);
      setSelectedMentorPastors([]);
      setActiveTab("pastor");
      setSelectedPastorModalId(pastorId);
    }}
    className="rounded-2xl bg-[#3498DB] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#5dade2]"
  >
    View Roadmap
  </button>
</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
) : null}
{deleteConfirmRoadmap ? (
  <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#061f35] p-6 shadow-xl">
      <h2 className="text-lg font-bold text-white">Delete roadmap?</h2>

      <p className="mt-3 text-sm text-white/70">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">
          {deleteConfirmRoadmap.title}
        </span>
        ? This action cannot be undone.
      </p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setDeleteConfirmRoadmap(null)}
          className={directorBtnSecondary}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={async () => {
            await handleDeleteRoadmap(deleteConfirmRoadmap.id);
            setDeleteConfirmRoadmap(null);
            setSelectedRoadmapIds([]);
            setSelectMode(false);
          }}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
) : null}
    </div>
  );
}
