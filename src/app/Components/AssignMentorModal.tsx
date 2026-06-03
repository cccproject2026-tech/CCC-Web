"use client";
import { useState } from "react";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";

export interface Mentor {
  id: string;
  name: string;
  role: string;
  menteeCount: number;
  loginDate?: string;
  img: any;
}

interface AssignMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMentors: string[]) => void;
  mentors: Mentor[];
  /** True while mentor list + per-user details are loading */
  loading?: boolean;
}

export default function AssignMentorModal({
  isOpen,
  onClose,
  onConfirm,
  mentors,
  loading = false,
}: AssignMentorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  // const [selectedMentors, setSelectedMentors] = useState<string[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>("");

  if (!isOpen) return null;

  const filteredMentors = mentors.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // const toggleMentor = (id: string) => {
  //   setSelectedMentors((prev) =>
  //     prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id],
  //   );
  // };
  const toggleMentor = (id: string) => {
  setSelectedMentor((prev) => (prev === id ? "" : id));
};

  // const handleConfirm = () => {
  //   onConfirm(selectedMentors);
  //   setSelectedMentors([]);
  //   onClose();
  // };
  const handleConfirm = () => {
  if (!selectedMentor) return;
  onConfirm([selectedMentor]);
  setSelectedMentor("");
  onClose();
};

  const loginDisplay = (m: Mentor) => m.loginDate ?? "Not Started yet";
  const loginIsNotStarted = (m: Mentor) =>
    !m.loginDate || m.loginDate === "Not Started yet";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
     <div className="flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.96)_0%,rgba(7,34,56,0.98)_100%)] shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/15 px-6 py-5">
          <h3 className="text-xl font-bold text-white">Assign New Mentor</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="border-b border-white/15 px-6 py-5">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-sm text-white placeholder:text-[#cde2f2]/55 outline-none transition focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
            />
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#8ec5eb]" />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 py-12">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
              <p className="text-[13px] text-[#cde2f2]/75">Loading mentors…</p>
            </div>
          ) : (
          <>
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMentors.map((mentor) => {
              // const selected = selectedMentors.includes(mentor.id);
              const selected = selectedMentor === mentor.id;
              return (
                <button
                  key={mentor.id}
                  type="button"
                  onClick={() => toggleMentor(mentor.id)}
                  className={`relative rounded-xl border p-4 text-left transition ${
                    selected
  ? "border-[#8ec5eb]/60 bg-[#8ec5eb]/15 ring-1 ring-[#8ec5eb]/35"
  : "border-white/10 bg-white/[0.06] hover:border-[#8ec5eb]/35 hover:bg-white/[0.1]"
                  }`}
                >
                  <span
                    className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded border ${
  selected ? "border-[#8ec5eb] bg-[#8ec5eb]" : "border-white/25 bg-white/10"
}`}
                    aria-hidden
                  >
                    {selected ? (
                      <i className="fa-solid fa-check text-xs text-[#062946]" />
                    ) : null}
                  </span>

                  <div className="flex gap-3 pr-8">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10 ring-1 ring-white/15">
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
                          <i className="fa-solid fa-user text-2xl text-white/95" aria-hidden />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-[15px] font-bold text-white">{mentor.name}</h4>
                      <p className="text-[13px] capitalize text-[#cde2f2]/70">{mentor.role || "Mentor"}</p>
                      <span className="mt-2 inline-block rounded-full bg-amber-400/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200">
                        {mentor.menteeCount} Mentors
                      </span>
                      <p className="mt-2 text-[13px] leading-snug">
                        <span className="font-bold text-gray-900">Login : </span>
                        <span
                          className={
                            loginIsNotStarted(mentor)
                              ? "font-normal text-[#0056D2]"
                              : "font-normal text-gray-900"
                          }
                        >
                          {loginDisplay(mentor)}
                        </span>
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-4">
            {/* <p className="text-[13px] text-gray-600">
              {selectedMentors.length > 0
                ? `${filteredMentors
                    .filter((m) => selectedMentors.includes(m.id))
                    .map((m) => m.name)
                    .slice(0, 3)
                    .join(", ")}${
                    selectedMentors.length > 3 ? ` and ${selectedMentors.length - 3} others` : ""
                  }`
                : "No mentors selected"}
            </p> */}
            <p className="text-[13px] text-gray-600">
  {selectedMentor
    ? filteredMentors.find((m) => m.id === selectedMentor)?.name
    : "No mentor selected"}
</p>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedMentor}
              className="rounded-xl bg-[#8ec5eb] px-7 py-3 text-sm font-bold text-[#062946] transition hover:bg-[#a9d5f2] disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-white/40"
            >
              Assign Mentor
            </button>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
