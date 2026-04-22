"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";
import { apiGetAssignedUsers, apiRemoveAssignedUsers } from "@/app/Services/users.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { isRemoteImageSrc } from "@/app/utils/image";

interface RemoveMenteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string | null;
  mentorName: string | null;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

interface Mentee {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
}

function unwrapAssignedUsersList(res: { data?: unknown }): Mentee[] {
  const top = res?.data as Record<string, unknown> | any[] | undefined;
  if (top == null) return [];
  if (Array.isArray(top)) return top as Mentee[];
  const inner = (top as { data?: unknown }).data;
  if (Array.isArray(inner)) return inner as Mentee[];
  if (inner && typeof inner === "object" && Array.isArray((inner as { data?: unknown }).data)) {
    return (inner as { data: Mentee[] }).data;
  }
  return [];
}

export default function RemoveMenteesModal({
  isOpen,
  onClose,
  mentorId,
  mentorName,
  onSuccess,
  onError,
}: RemoveMenteesModalProps) {
  const [query, setQuery] = useState("");
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const defaultImages = [Mentor1, Mentor2, Mentor3];

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelected([]);
      setError(null);
      return;
    }
    if (mentorId) void fetchMentees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mentorId]);

  const fetchMentees = async () => {
    if (!mentorId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiGetAssignedUsers(mentorId);
      setMentees(unwrapAssignedUsersList(response));
    } catch (err) {
      console.error(err);
      setError(extractApiErrorMessage(err) || "Failed to load mentees");
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = mentees.filter((m) => {
    const q = query.toLowerCase();
    const name = `${m.firstName} ${m.lastName}`.toLowerCase();
    return name.includes(q) || m.email.toLowerCase().includes(q);
  });

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleRemove = async () => {
    if (!mentorId || selected.length === 0) return;
    setRemoving(true);
    try {
      await apiRemoveAssignedUsers(mentorId, selected);
      onSuccess(
        selected.length === 1
          ? "Mentee removed from this mentor."
          : `${selected.length} mentees removed from this mentor.`,
      );
      setSelected([]);
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      onError(e?.response?.data?.message || "Could not remove mentee(s). Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Remove a Mentee</h2>
            {mentorName ? (
              <p className="mt-1 text-[13px] text-gray-500">From {mentorName}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="relative mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search mentees..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]/30"
            />
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2E3B8E]/30 border-t-[#2E3B8E]" />
              <p className="text-[13px] text-gray-600">Loading mentees…</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="mb-3 text-[15px] font-medium text-gray-900">{error}</p>
              <button
                type="button"
                onClick={() => void fetchMentees()}
                className="text-[14px] font-semibold text-[#2E3B8E] hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-[14px] text-gray-600">
              {mentees.length === 0
                ? "No mentees are assigned to this mentor yet."
                : "No mentees match your search."}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((m, index) => {
                const id = String(m._id ?? m.id ?? "");
                if (!id) return null;
                const checked = selected.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle(id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                      checked
                        ? "border-[#2E3B8E] bg-[#f0f4ff] ring-1 ring-[#2E3B8E]/25"
                        : "border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        checked ? "border-[#2E3B8E] bg-[#2E3B8E]" : "border-gray-300 bg-white"
                      }`}
                    >
                      {checked ? (
                        <i className="fa-solid fa-check text-[10px] text-white" />
                      ) : null}
                    </span>
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-gray-200">
                      <Image
                        src={m.profilePicture || defaultImages[index % defaultImages.length]}
                        alt=""
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                        unoptimized={isRemoteImageSrc(m.profilePicture)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold text-gray-900">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="truncate text-[12px] text-gray-500">{m.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-6">
          <p className="text-[13px] text-gray-600">
            {selected.length > 0 ? `${selected.length} selected` : "Select mentees to remove"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.length === 0 || removing}
              onClick={() => void handleRemove()}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removing ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
