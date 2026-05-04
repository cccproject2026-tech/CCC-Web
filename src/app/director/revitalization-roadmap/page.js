"use client";

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import Card1 from "../../Assets/card1.png";
import { apiGetRoadmaps, apiDeleteRoadmap } from "@/app/Services/api";
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

function roadmapTitleIconClass(title) {
  const t = normLower(title);
  if (t.includes("jump")) return "fa-paper-plane";
  if (t.includes("self")) return "fa-heart";
  if (t.includes("church") || t.includes("empowerment")) return "fa-church";
  if (t.includes("community")) return "fa-users";
  return "fa-route";
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

/** Gradient ring on carousel avatars (pink → purple → blue). */
const pastorGradientRing =
  "rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 p-[3px]";

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
  const isRoadmapHub =
    pathname === "/director/revitalization-roadmap" || pathname === "/director/revitalization-roadmap/";
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roadmapLibrary, setRoadmapLibrary] = useState([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [pastorProgressList, setPastorProgressList] = useState([]);
  const [loadingPastors, setLoadingPastors] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(null);
  const [libraryPage, setLibraryPage] = useState(1);
  const [metricsByRoadmapId, setMetricsByRoadmapId] = useState({});
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [filterPastorId, setFilterPastorId] = useState("all");
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [orderedIds, setOrderedIds] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [roadmapFetchError, setRoadmapFetchError] = useState("");
  const [pastorFetchError, setPastorFetchError] = useState("");
  /** Created-date ordering. */
  const [sortCreated, setSortCreated] = useState("newest");
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
    const id = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  const fetchRoadmaps = useCallback(async () => {
    try {
      setLoadingRoadmaps(true);
      setRoadmapFetchError("");
      const res = await apiGetRoadmaps("all", debouncedSearch);
      const list = unwrapRoadmapsList(res);
      const mapped = list
        .map((item) => {
          const kids = roadmapChildrenList(item);
          const nested0 = kids.length > 0 ? kids[0] : null;

          const title = pickRoadmapTitle(item, nested0);
          const desc = pickRoadmapDescription(item, nested0);
          const description = desc || "No description yet";
          const completionTime =
            (nested0 && String(nested0.duration || "").trim()) || String(item.duration || "").trim() || "—";
          const img = (nested0 && nested0.imageUrl) || item.imageUrl || Card1;
          const rid = stringifyRoadmapId(item._id ?? item.id);
          const createdRaw = extractRoadmapCreatedAtRaw(item);
          const createdAt = createdRaw;
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
  }, [debouncedSearch]);

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

  const filteredLibrary = useMemo(() => {
    let rows = [...orderedLibrary];

    if (filterPastorId !== "all") {
      rows = rows.filter((r) => {
        const m = metricsByRoadmapId[r.id];
        const set = m?.assignedUserIds;
        if (set && typeof set.has === "function") return set.has(filterPastorId);
        return false;
      });
    }

    if (!rearrangeMode) {
      rows.sort((a, b) => {
        const da = parseDate(a.createdAt)?.getTime() || 0;
        const db = parseDate(b.createdAt)?.getTime() || 0;
        return sortCreated === "newest" ? db - da : da - db;
      });
    }

    return rows;
  }, [orderedLibrary, filterPastorId, metricsByRoadmapId, sortCreated, rearrangeMode]);

  const totalPages = Math.max(1, Math.ceil(filteredLibrary.length / PAGE_SIZE));
  const clampedPage = Math.min(Math.max(1, libraryPage), totalPages);
  const pagedLibrary = filteredLibrary.slice((clampedPage - 1) * PAGE_SIZE, clampedPage * PAGE_SIZE);

  useEffect(() => {
    setLibraryPage(1);
  }, [searchQuery, debouncedSearch, filterPastorId, sortCreated]);

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
                <SearchBar
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder="Search roadmap..."
                  variant="dark"
                  className="w-full"
                />
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="relative shrink-0">
                  <button
                    ref={sortTriggerRef}
                    type="button"
                    className={glassTrigger}
                    aria-expanded={showSortMenu}
                    aria-haspopup="dialog"
                    onClick={() => setShowSortMenu((v) => !v)}
                  >
                    <span>Sort by</span>
                    <i className={`fa-solid fa-chevron-${showSortMenu ? "up" : "down"} text-xs text-white/60`} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setRearrangeMode((v) => !v)}
                  className={`${directorBtnSecondary} !px-4 !py-2.5 !text-[13px]`}
                  title="Rearrange cards"
                >
                  <i className="fa-solid fa-table-cells-large text-sm" aria-hidden />
                  <span>Rearrange</span>
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/director/revitalization-roadmap/create")}
                  className={`${directorBtnPrimary} !px-4 !py-2.5 !text-[13px]`}
                >
                  <i className="fa-solid fa-plus text-sm" />
                  <span>New Roadmap</span>
                </button>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-5" aria-hidden />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[15px] font-medium text-white/90">Select a pastor to view their roadmap.</p>
              <Link
                href="/director/mentees"
                className="text-sm font-semibold text-[#3498DB] transition hover:text-[#85c1e9] hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="rounded-xl bg-[radial-gradient(ellipse_85%_85%_at_50%_36%,rgba(52,152,219,0.16),transparent_62%)] px-1 py-4 sm:px-2 sm:py-5">
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
                  ) : (
                    pastorProgressList.map((p, idx) => {
                      const pid = extractUserIdFromOverallProgressRow(p) || String(idx);
                      const defaultImages = [Mentor1, Mentor2, Mentor3];
                      const img = p.profilePicture || defaultImages[idx % defaultImages.length];
                      const name = `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Pastor";
                      const selected = filterPastorId === pid;
                      return (
                        <button
                          key={pid}
                          type="button"
                          onClick={() => setFilterPastorId((prev) => (prev === pid ? "all" : pid))}
                          className={`group flex shrink-0 flex-col items-center px-1 py-0.5 text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3498DB]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a1128] ${
                            selected ? "opacity-100" : "opacity-[0.88] hover:opacity-100"
                          }`}
                          aria-pressed={selected}
                        >
                          <div className="relative mb-2 h-[72px] w-[72px] sm:h-[88px] sm:w-[88px]">
                            <div
                              className={`${pastorGradientRing} h-full w-full transition-shadow ${
                                selected
                                  ? "shadow-[0_0_0_2px_#0a1128,0_0_0_4px_#3498DB,0_0_18px_rgba(52,152,219,0.35)]"
                                  : "shadow-none"
                              }`}
                            >
                              <div className="relative h-full w-full overflow-hidden rounded-full bg-[#041f35]">
                                <Image
                                  src={img}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="88px"
                                  unoptimized={typeof img === "string" && isRemoteImageSrc(img)}
                                />
                              </div>
                            </div>
                          </div>
                          <span
                            className={`max-w-[130px] truncate text-[13px] font-medium ${
                              selected ? "text-white" : "text-white/85"
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

          {loadingRoadmaps ? (
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
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {pagedLibrary.map((roadmap) => {
                    const imgRaw = roadmap?.img;
                    const thumb =
                      typeof imgRaw === "string" ? resolveApiMediaUrl(imgRaw) || imgRaw : imgRaw || Card1;
                    const iconClass = roadmapTitleIconClass(roadmap.title);
                    const created = parseDate(roadmap.createdAt);
                    const creatorPic = roadmap.createdByAvatar;
                    const creatorFallback = Mentor1;
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
                        <div className="relative w-[120px] shrink-0 self-stretch sm:w-[140px]">
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
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3498DB]/18 text-[#85c1e9]">
                                  <i className={`fa-solid ${iconClass}`} aria-hidden />
                                </span>
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
                                        openRoadmapView(roadmap);
                                      }}
                                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10"
                                    >
                                      <i className="fa-regular fa-eye text-[#3498DB]" aria-hidden />
                                      View
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
                            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/65">{roadmap.description}</p>
                          </div>

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
                                    src={creatorPic || creatorFallback}
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
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredLibrary.length > 0 ? (
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
              ) : null}

              {rearrangeMode ? (
                <p className="mt-6 text-center text-xs text-white/50">
                  Drag cards to reorder for this session. Tap <strong className="text-white/70">Done</strong> on Rearrange when finished.
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
