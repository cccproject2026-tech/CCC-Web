"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiAssignRoadmap } from "@/app/Services/api";
import { parseMentorUsersListResponse } from "@/app/director/mentors/parseMentorUsersResponse";
import { emitPastorAssignmentsChanged } from "@/app/utils/progress-sync";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

/** Match filter tabs to API roles ("lay leader" vs "lay-leader", case, etc.). */
function normalizeRoleKey(role: string): string {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function extractUserId(u: { id?: unknown; _id?: unknown }): string {
  const rawId = u.id ?? u._id;
  if (rawId != null && typeof rawId === "object" && rawId !== null && "$oid" in rawId) {
    return String((rawId as { $oid: string }).$oid);
  }
  return rawId != null ? String(rawId) : "";
}

function formatAssignRoadmapError(err: unknown): string {
  const e = err as {
    response?: { status?: number; data?: { message?: unknown } };
    message?: string;
  };
  const status = e?.response?.status;
  const raw = e?.response?.data?.message;
  const msg =
    raw == null
      ? ""
      : Array.isArray(raw)
        ? raw.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")
        : String(raw);
  const text = msg.trim() || e?.message || "Failed to assign roadmap.";
  if (
    status === 409 ||
    /\balready\b|duplicate|assigned already|has already been assigned|already assigned/i.test(text)
  ) {
    return "This roadmap is already assigned to the selected user(s).";
  }
  return text;
}

function getUserInitials(user: any): string {
  const firstName = String(user?.firstName ?? user?.first_name ?? "").trim();
  const lastName = String(user?.lastName ?? user?.last_name ?? "").trim();
  const fullName = String(user?.name ?? user?.fullName ?? "").trim();

  const value = `${firstName} ${lastName}`.trim() || fullName || "User";

  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return initials || "U";
}

function getUserAvatarUrl(user: any): string {
  const raw =
    user?.profilePicture ??
    user?.profile_picture ??
    user?.profileImage ??
    user?.profile_image ??
    user?.avatar ??
    user?.imageUrl ??
    user?.image ??
    user?.img ??
    user?.user?.profilePicture ??
    user?.user?.profile_picture ??
    user?.user?.avatar ??
    "";

  if (typeof raw !== "string") return "";

  const trimmed = raw.trim();
  if (!trimmed) return "";

  return resolveApiMediaUrl(trimmed) ?? trimmed;
}

const ROLE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pastors", value: "pastor" },
  { label: "Lay Leaders", value: "lay-leader" },
  { label: "Seminarians", value: "seminarian" },
];

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  img?: string;
  [key: string]: any;
}

interface AssignRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  roadmapIds: string[];
  roadmapName: string;
  onSuccess?: () => void;
  /** When set (e.g. deep link from mentees list), this user is pre-selected in the list. */
  initialUserId?: string | null;
}

function AssignUserAvatar({ user }: { user: any }) {
  const [failed, setFailed] = useState(false);
  const imageSrc = getUserAvatarUrl(user);
  const initials = getUserInitials(user);

  if (!imageSrc || failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#173653] text-xs font-bold uppercase text-[#8ec5eb]">
        {initials}
      </span>
    );
  }

  return (
    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-white/10 bg-[#173653]">
      <Image
        src={imageSrc}
        alt={initials}
        fill
        sizes="40px"
        unoptimized={isRemoteImageSrc(imageSrc)}
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

export default function AssignRoadmapModal({
  isOpen,
  onClose,
  roadmapIds,
  roadmapName,
  onSuccess,
  initialUserId,
}: AssignRoadmapModalProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(initialUserId ? [initialUserId] : []);
    setQuery("");
    setRoleFilter("all");
    setAssignSuccess(null);
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialUserId]);

  useEffect(() => {
    if (!assignSuccess) return;
    const t = window.setTimeout(() => {
      setAssignSuccess(null);
      onClose();
    }, 2800);
    return () => window.clearTimeout(t);
  }, [assignSuccess, onClose]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    // Do not send `status: "active"` — backend uses values like "accepted" for enrolled pastors
    // (see director mentees + AssignMenteesModal, which omit status).
    const base = {
      roleMatch: "mixed" as const,
      limit: 9999,
      t: Date.now(),
    };
    const roleQueries = [
      apiGetAllUsers({ ...base, role: "pastor" }),
      apiGetAllUsers({ ...base, role: "lay leader" }),
      apiGetAllUsers({ ...base, role: "seminarian" }),
    ];
    try {
      const settled = await Promise.allSettled(roleQueries);
      const combined: any[] = [];
      for (const s of settled) {
        if (s.status === "fulfilled")
          combined.push(...parseMentorUsersListResponse(s.value).users);
      }
      if (settled.every((s) => s.status === "rejected")) {
        setError("Failed to load users. Please try again.");
        setPeople([]);
        return;
      }
      if (settled.some((s) => s.status === "rejected")) {
        // Partial failure: still show whoever loaded; no blocking banner
        console.warn("Some user list requests failed", settled);
      }

      const byId = new Map<string, any>();
      for (const u of combined) {
        const id = extractUserId(u);
        if (id) byId.set(id, u);
      }

      const allUsers = [...byId.values()].filter((u: any) => {
        if (u?.isDeleted === true || u?.deletedAt) return false;
        const st = String(u?.status || "").toLowerCase();
        if (st === "inactive" || st === "deleted") return false;
        return true;
      });

      setPeople(
        allUsers.map((u: any) => ({
          ...u,
          id: extractUserId(u),
          name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "User",
          email: u.email ?? "",
          role: u.role,
          img: getUserAvatarUrl(u),
        })).filter((p: Person) => p.id.length > 0)
      );
    } catch {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter((p) => {
    const matchesRole =
      roleFilter === "all" ||
      p.role === roleFilter ||
      normalizeRoleKey(p.role) === roleFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.email.toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const roadMapIdsSafe = roadmapIds
    .map((x) => {
      if (x == null) return "";
      if (typeof x === "object" && x !== null && "$oid" in (x as object)) {
        return String((x as { $oid: string }).$oid);
      }
      return String(x).trim();
    })
    .filter(Boolean);

  const handleAssign = async () => {
    if (selected.length === 0) return;
    if (roadMapIdsSafe.length === 0) {
      setError(
        "Missing roadmap id. Close this dialog and use Assign from the roadmap card menu again.",
      );
      return;
    }
    setAssigning(true);
    setError(null);
    try {
      await apiAssignRoadmap({ userIds: selected, roadMapIds: roadMapIdsSafe });
      emitPastorAssignmentsChanged(selected);
      onSuccess?.();
      setAssignSuccess("Roadmap assigned successfully.");
    } catch (err: unknown) {
      setError(formatAssignRoadmapError(err));
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      {assignSuccess ? (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[110] max-w-[min(100%,24rem)] -translate-x-1/2 rounded-xl border border-emerald-200/90 bg-emerald-50 px-5 py-3.5 text-center text-sm font-semibold text-emerald-950 shadow-xl"
          role="status"
        >
          <i className="fa-solid fa-circle-check mr-2 text-emerald-600" aria-hidden />
          {assignSuccess}
        </div>
      ) : null}
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-[18px] font-bold text-gray-900">Assign Roadmap</h2>
            <p className="text-[13px] text-gray-500 mt-0.5">Assign <span className="font-medium text-[#2E3B8E]">{roadmapName}</span> to users</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
          >
            <i className="fa-solid fa-xmark text-gray-600"></i>
          </button>
        </div>

        <div className="p-5 flex-1 overflow-auto space-y-4">
          {/* Search */}
          <div className="relative">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]/30 focus:border-[#2E3B8E]"
            />
          </div>

          {/* Role filter tabs */}
          <div className="flex gap-1.5 bg-gray-100 rounded-xl p-1">
            {ROLE_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRoleFilter(f.value)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleFilter === f.value
                    ? "bg-[#2E3B8E] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-[#2E3B8E] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* People list */}
          {!loading && filteredPeople.length === 0 && (
            <div className="text-center py-10">
              <i className="fa-solid fa-users text-gray-300 text-4xl mb-3"></i>
              <p className="text-gray-500 text-sm">No users found</p>
            </div>
          )}

          {!loading && filteredPeople.length > 0 && (
            <div className="space-y-2">
              {filteredPeople.map((person) => {
                const checked = selected.includes(person.id);
                return (
                  <div
                    key={person.id}
                    onClick={() => toggleSelect(person.id)}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition border border-gray-100"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition ${
                        checked ? "bg-[#2E3B8E] border-[#2E3B8E]" : "bg-white border-gray-300"
                      }`}
                    >
                      {checked && <i className="fa-solid fa-check text-white text-[9px]"></i>}
                    </div>
                    <AssignUserAvatar user={person} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-900 truncate">{person.name}</p>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium capitalize whitespace-nowrap">
                          {person.role}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{person.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {selected.length > 0 ? (
              <span className="text-[#2E3B8E] font-medium">{selected.length} selected</span>
            ) : (
              "No users selected"
            )}
          </p>
          <button
            onClick={handleAssign}
            disabled={
              selected.length === 0 ||
              assigning ||
              Boolean(assignSuccess) ||
              roadMapIdsSafe.length === 0
            }
            className="px-6 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-sm font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
