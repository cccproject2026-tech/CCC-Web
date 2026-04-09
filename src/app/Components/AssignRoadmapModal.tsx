"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";
import { apiGetAllUsers } from "@/app/Services/users.service";
import { apiAssignRoadmap } from "@/app/Services/api";
import { emitPastorAssignmentsChanged } from "@/app/utils/progress-sync";

const ROLE_FILTERS = [
  { label: "All", value: "all" },
  { label: "Pastors", value: "pastor" },
  { label: "Lay Leaders", value: "lay-leader" },
  { label: "Seminarians", value: "seminarian" },
];

const DEFAULT_IMAGES = [Mentor1, Mentor2, Mentor3];

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
  img: any;
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

  useEffect(() => {
    if (!isOpen) return;
    setSelected(initialUserId ? [initialUserId] : []);
    setQuery("");
    setRoleFilter("all");
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetAllUsers({ role: "pastor", roleMatch: "mixed", limit: 9999 });
      const allUsers = res.data?.data?.users || [];

      setPeople(
        allUsers.map((u: any, i: number) => ({
          id: u.id || u._id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          img: u.profilePicture || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length],
        }))
      );
    } catch {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = people.filter((p) => {
    const matchesRole = roleFilter === "all" || p.role === roleFilter;
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

  const handleAssign = async () => {
    if (!roadmapIds.length || selected.length === 0) return;
    setAssigning(true);
    try {
      await apiAssignRoadmap({ userIds: selected, roadMapIds: roadmapIds });
      emitPastorAssignmentsChanged(selected);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to assign roadmap.");
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
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
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={person.img}
                        alt={person.name}
                        width={36}
                        height={36}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
            disabled={selected.length === 0 || assigning}
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
