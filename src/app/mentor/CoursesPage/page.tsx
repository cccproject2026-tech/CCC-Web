"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import type { StaticImageData } from "next/image";
import MentorHeader from "@/app/Components/MentorHeader";


type Mode = "normal" | "select";

type Course = {
  id: number;
  title: string;
  desc: string;
  img: any;
};

type Mentor = {
  id: number;
  name: string;
  avatar:StaticImageData 
};

export default function CoursesPage() {
  /* ───────────────────────── State ───────────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [mode, setMode] = useState<Mode>("normal");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [showAssignDrawer, setShowAssignDrawer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [activeMentorId, setActiveMentorId] = useState<number | null>(null);

  /* ───────────────────────── Data ───────────────────────── */
  const mentors: Mentor[] = [
    { id: 1, name: "Jacob Jones", avatar: Mentor1 },
    { id: 2, name: "John Doe", avatar: Mentor2 },
    { id: 3, name: "Robert Fox", avatar: Mentor3},
    { id: 4, name: "Jacob Jones", avatar: Mentor1 },
    { id: 5, name: "Robert Fox", avatar: Mentor2 },
    { id: 6, name: "John Doe", avatar: Mentor3 },
  ];

  const courses: Course[] = [
    {
      id: 1,
      title: "Prayer and Visitation Strategy",
      desc: "Finalize the teams vision for the church",
      img: Card1,
    },
    {
      id: 2,
      title: "Calendar",
      desc: "Finalize a vision team meeting schedule through the end of the year",
      img: Card2,
    },
    {
      id: 3,
      title: "Prayer",
      desc: "Prioritize church prayer times and meet consistently for prayer with your congregation",
      img: Card3,
    },
    {
      id: 4,
      title: "Mentoring Conversations",
      desc: "Schedule two mentoring conversations with your mentor",
      img: Card4,
    },
  ];

  /* ───────────────────────── Derived ───────────────────────── */
  const filtered = useMemo(
    () =>
      courses.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [courses, searchTerm]
  );

  const toggleSelect = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAll = () => setSelectedIds(filtered.map((c) => c.id));

  const clearSelection = () => setSelectedIds([]);

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    const count = selectedIds.length;
    clearSelection();
    setToastMsg(`${count} item${count === 1 ? "" : "s"} deleted`);
    setTimeout(() => setToastMsg(""), 2200);
  };

  const openAssignToast = () => {
    setShowAssignDrawer(false);
    setToastMsg("Assigned successfully");
    setTimeout(() => setToastMsg(""), 2200);
  };

  /* ───────────────────────── UI ───────────────────────── */
  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[260px] bg-cover bg-center flex items-end pl-10 md:pl-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90" />
        <h1 className="relative z-10 text-white text-[34px] md:text-[38px] font-semibold tracking-tight">
          Courses
        </h1>
      </section>

      {/* CONTENT WRAP */}
      <main className="flex-1 bg-[#254487] px-0 pt-8 pb-20">
        <div className="w-full">

          {/* Search + Actions */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Search */}
            <div className="relative w-full md:w-[360px]">
              <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search"
                className="w-full bg-white border border-gray-200 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#103C8C]"
              />
            </div>

            {/* Right action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setMode((m) => (m === "select" ? "normal" : "select"));
                  clearSelection();
                }}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition ${
                  mode === "select"
                    ? "bg-[#103C8C] text-white border-[#103C8C]"
                    : "bg-white text-[#0B1C58] border-[#DDE2EB] hover:bg-[#F5F8FF]"
                }`}
              >
                <i className="fa-regular fa-square-check mr-2" />
                {mode === "select" ? "Cancel" : "Select"}
              </button>

              <button className="px-4 py-2 text-sm font-medium rounded-md bg-white text-[#103C8C] border border-[#DDE2EB] hover:bg-[#F5F8FF]">
                <i className="fa-solid fa-plus mr-2" />
                Add
              </button>
            </div>
          </div>

          {/* Mentor Avatars row (only in NORMAL mode) */}
          {mode === "normal" && (
            <>
              <div className="mt-6 flex items-center gap-6 overflow-x-auto pb-2">
                {mentors.map((m) => {
                  const active = activeMentorId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setActiveMentorId((id) => (id === m.id ? null : m.id))
                      }
                      className="group shrink-0 text-white text-center"
                    >
                      <div
                        className={`rounded-full p-[3px] bg-gradient-to-tr ${
                          active
                            ? "from-[#AC9CFF] via-[#6C7BFF] to-[#6DF3FF]"
                            : "from-transparent via-transparent to-transparent"
                        }`}
                      >
                        <div className="rounded-full bg-[#254487] p-[2px]">
                          <Image
                            src={m.avatar}
                            alt={m.name}
                            width={60}
                            height={60}
                            className="rounded-full bg-white object-cover"
                          />
                        </div>
                      </div>
                      <p className="text-[12px] mt-2 opacity-90">{m.name}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 h-px bg-white/20" />
            </>
          )}

          {/* Selected toolbar (only in SELECT mode) */}
          {mode === "select" && (
            <div className="mt-6 bg-white/10 text-white rounded-md px-4 py-3 flex items-center justify-between">
              <span className="text-sm">
                Selected Items:{" "}
                <strong className="font-semibold">{selectedIds.length}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="bg-white text-[#0B1C58] text-sm px-3 py-[6px] rounded-md"
                >
                  Select All
                </button>

                <button
                  onClick={() => setShowAssignDrawer(true)}
                  className="bg-white text-[#0B1C58] text-sm px-3 py-[6px] rounded-md"
                  title="Assigned to"
                >
                  <i className="fa-regular fa-user mr-2" />
                  Assigned to
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-white text-red-600 text-sm px-3 py-[6px] rounded-md"
                  title="Delete"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          )}

          {/* Cards grid */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {filtered.map((item) => {
              const checked = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`relative bg-white rounded-xl border shadow-sm flex overflow-hidden transition ${
                    checked && mode === "select"
                      ? "border-2 border-[#103C8C]"
                      : "border-transparent"
                  }`}
                >
                  {/* Checkbox in SELECT mode */}
                  {mode === "select" && (
                    <label className="absolute right-3 top-3 z-10 inline-flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSelect(item.id)}
                        className="w-5 h-5 accent-[#103C8C]"
                      />
                    </label>
                  )}

                  {/* Thumbnail */}
                  <div className="m-5 w-[170px] h-[120px] flex-shrink-0">
                    <Image
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1 pr-5 py-5 pl-0 flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-[15px] font-semibold text-[#0B1C58]">
                          {item.title}
                        </h3>
                        <p className="text-[12.5px] text-gray-600 mt-1 leading-snug">
                          {item.desc}
                        </p>
                      </div>

                      {/* 3-dot menu (normal mode) */}
                      {mode === "normal" && (
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowDropdown((d) => (d === item.id ? null : item.id))
                            }
                            className="text-gray-500 hover:text-[#103C8C] px-1 py-1"
                          >
                            <i className="fa-solid fa-ellipsis-vertical" />
                          </button>

                          {showDropdown === item.id && (
                            <div className="absolute right-0 top-6 z-20 w-40 bg-white border border-gray-200 rounded-md shadow-lg text-sm">
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  setShowDropdown(null);
                                  setShowAssignDrawer(true);
                                }}
                              >
                                <i className="fa-regular fa-user" />
                                Assign to
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => setShowDropdown(null)}
                              >
                                <i className="fa-regular fa-pen-to-square" />
                                Edit
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
                                onClick={() => {
                                  setShowDropdown(null);
                                  setMode("select");
                                  setSelectedIds([item.id]);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                <i className="fa-solid fa-trash" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                      <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-5 py-[6px] rounded-md">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>


      {/* Assign Drawer */}
      {showAssignDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-[420px] h-full bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0B1C58]">Assigned to</h3>
              <button
                onClick={() => setShowAssignDrawer(false)}
                className="text-gray-500 hover:text-[#103C8C]"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 text-sm" />
                <input
                  placeholder="Search"
                  className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-[#103C8C]"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {mentors.map((m, i) => (
                <label
                  key={m.id}
                  className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      defaultChecked={i < 2}
                      className="accent-[#103C8C]"
                    />
                    <Image
                      src={m.avatar}
                      alt={m.name}
                      width={35}
                      height={35}
                      className="rounded-full bg-gray-200"
                    />
                    <span className="text-[#0B1C58] text-sm font-medium">
                      {m.name}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            <div className="border-t px-6 py-4">
              <p className="text-xs text-gray-500 mb-2">
                John Doe, Jacob Jones and 3 others
              </p>
              <button
                onClick={openAssignToast}
                className="w-full bg-[#103C8C] hover:bg-[#0B2E72] text-white rounded-md py-2 font-medium"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-7 w-[380px] text-center shadow-lg">
            <i className="fa-solid fa-trash text-red-500 text-3xl mb-3" />
            <p className="text-[#0B1C58] font-medium mb-6">
              Are you sure you want to delete {selectedIds.length} item
              {selectedIds.length === 1 ? "" : "s"}?
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-6 py-2 rounded-md font-medium border border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-6 py-2 rounded-md font-medium bg-[#103C8C] text-white hover:bg-[#0B2E72]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-[60] bg-white border border-gray-200 shadow-lg rounded-md px-4 py-2 flex items-center gap-2 text-[#0B1C58]">
          <i className="fa-solid fa-check text-green-600" />
          <span className="text-sm">{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
