"use client";
import { useState } from "react";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";
import type { Mentor } from "@/app/Components/AssignMentorModal";

interface RemoveMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMentors: string[]) => void;
  mentors: Mentor[];
  loading?: boolean;
}

function loginNotStarted(m: Mentor): boolean {
  return !m.loginDate || m.loginDate === "Not Started yet";
}

export default function RemoveMentorModal({
  isOpen,
  onClose,
  onConfirm,
  mentors,
}: RemoveMentorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMentors, setSelectedMentors] = useState<string[]>([]);

  if (!isOpen) return null;

  const filteredMentors = mentors.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleMentor = (id: string) => {
    setSelectedMentors((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedMentors);
    setSelectedMentors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h3 className="text-[20px] font-bold text-gray-900">Remove a Mentor</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-[#2E3B8E] bg-white text-[#2E3B8E] transition hover:bg-[#2E3B8E]/10"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="border-b border-gray-200 p-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-[#2E3B8E]"
            />
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#2E3B8E]/30 border-t-[#2E3B8E]" />
              <p className="text-[13px] text-gray-600">Loading mentors…</p>
            </div>
          ) : filteredMentors.length === 0 ? (
            <p className="py-8 text-center text-[14px] text-gray-600">
              No mentors assigned to this mentee.
            </p>
          ) : (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((mentor) => {
                const selected = selectedMentors.includes(mentor.id);
                const ns = loginNotStarted(mentor);
                return (
                  <button
                    key={mentor.id}
                    type="button"
                    onClick={() => toggleMentor(mentor.id)}
                    className={`relative rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-[#2E3B8E] bg-[#f0f4ff] ring-1 ring-[#2E3B8E]/30"
                        : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded border-2 border-[#2E3B8E] bg-white"
                      aria-hidden
                    >
                      {selected ? (
                        <i className="fa-solid fa-check text-xs text-[#2E3B8E]" />
                      ) : null}
                    </span>

                    <div className="flex gap-3 pr-8">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#2E3B8E]">
                        {mentor.img ? (
                          <Image
                            src={mentor.img}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized={isRemoteImageSrc(mentor.img)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <i
                              className="fa-solid fa-user text-2xl text-white/95"
                              aria-hidden
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-[15px] font-bold text-gray-900">
                          {mentor.name}
                        </h4>
                        <p className="text-[13px] capitalize text-gray-500">
                          {mentor.role || "Mentor"}
                        </p>
                        <span className="mt-2 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                          {mentor.menteeCount} Mentors
                        </span>
                        <p className="mt-2 text-[13px] leading-snug">
                          <span className="font-bold text-gray-900">Login : </span>
                          <span
                            className={
                              ns
                                ? "font-normal text-[#0056D2]"
                                : "font-normal text-gray-900"
                            }
                          >
                            {mentor.loginDate ?? "Not Started yet"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-4">
            <p className="text-[13px] text-gray-600">
              {selectedMentors.length > 0
                ? `${filteredMentors
                    .filter((m) => selectedMentors.includes(m.id))
                    .map((m) => m.name)
                    .slice(0, 3)
                    .join(", ")}${
                    selectedMentors.length > 3
                      ? ` and ${selectedMentors.length - 3} others`
                      : ""
                  }`
                : "No mentors selected"}
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedMentors.length === 0}
              className="rounded-lg bg-[#1F2A6E] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#2E3B8E] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Remove Mentor
            </button>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
