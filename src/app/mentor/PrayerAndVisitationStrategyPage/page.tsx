"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/jumpstart-hero.png"; // replace if you have a dedicated hero
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

type Tab = "overview" | "comments" | "queries";

export default function PrayerAndVisitationStrategyPage() {
  /* ───────── State ───────── */
  const [tab, setTab] = useState<Tab>("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [assignedDrawer, setAssignedDrawer] = useState(false);
  const [toast, setToast] = useState("");

  // form model
  const [task, setTask] = useState("Create a prayer and visitation strategy");
  const [description, setDescription] = useState(
    "Develop a prayer and visitation strategy and upload document"
  );
  const [file, setFile] = useState<File | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const breadcrumb = useMemo(
    () => [
      { label: "Assignments", href: "/assignments" },
      { label: "Prayer and Visitation Strategy" },
    ],
    []
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const save = () => {
    // integrate API here
    setIsEditing(false);
    setToast("Saved successfully");
    setTimeout(() => setToast(""), 2200);
  };

  const cancel = () => {
    setIsEditing(false);
    setToast("Changes discarded");
    setTimeout(() => setToast(""), 1800);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[300px] md:h-[320px] bg-center bg-cover flex flex-col justify-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 px-8 md:px-20 pb-6 md:pb-8 text-white">
          {/* breadcrumb */}
          <nav className="text-[12px] opacity-80 mb-3">
            {breadcrumb.map((b, i) => (
              <span key={i}>
                {i > 0 && <span className="mx-2">›</span>}
                {b.href ? (
                  <a href={b.href} className="hover:underline">
                    {b.label}
                  </a>
                ) : (
                  <span>{b.label}</span>
                )}
              </span>
            ))}
          </nav>

          <h1 className="text-[28px] md:text-[32px] font-semibold leading-tight">
            Prayer and Visitation Strategy
          </h1>
          <p className="text-white/80 text-sm mt-1">
            Completion Time Months 10 – 12
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] pb-24">
        <div className="max-w-7xl mx-auto px-8 md:px-20">
          {/* Top actions */}
          <div className="flex items-center justify-end gap-3 pt-6 pb-5">
            {!isEditing ? (
                <a href="/mentor/EditPrayerCoursePage">
                    <button
                className="inline-flex items-center gap-2 text-sm font-medium bg-white text-[#103C8C] border border-[#DDE2EB] rounded-md px-4 py-2 hover:bg-[#F5F8FF]"
              >
                <i className="fa-regular fa-pen-to-square" />
                Edit
              </button>
                </a>
             
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancel}
                  className="inline-flex items-center gap-2 text-sm font-medium bg-transparent text-white border border-white/60 rounded-md px-4 py-2 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  className="inline-flex items-center gap-2 text-sm font-medium bg-[#FFD84E] text-[#0B1C58] rounded-md px-4 py-2 hover:brightness-95"
                >
                  Save
                </button>
              </div>
            )}

            <button
              onClick={() => setAssignedDrawer(true)}
              className="inline-flex items-center gap-2 text-sm font-medium bg-white text-[#103C8C] border border-[#DDE2EB] rounded-md px-4 py-2 hover:bg-[#F5F8FF]"
            >
              <i className="fa-regular fa-user" />
              Assigned to
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
            {/* LEFT CARD (tabs) */}
            <aside className="bg-white rounded-xl shadow-sm p-4 h-[200px]">
              {[
                { key: "overview", label: "Over View" },
                { key: "comments", label: "Comments", count: 2 },
                { key: "queries", label: "Queries", count: 3 },
              ].map((t) => {
                const active = tab === (t.key as Tab);
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key as Tab)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-md text-sm font-medium transition ${
                      active
                        ? "bg-[#103C8C] text-white"
                        : "bg-[#F7FAFF] text-[#637094] hover:bg-[#E9EEFF]"
                    } ${t.key !== "overview" ? "mt-2" : ""}`}
                  >
                    <span>{t.label}</span>
                    {t.count ? (
                      <span
                        className={`text-xs px-2 py-[2px] rounded-full ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white border border-[#D0DAF9] text-[#103C8C]"
                        }`}
                      >
                        {t.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </aside>

            {/* RIGHT PANE */}
            <section className="text-white">
              {tab === "overview" ? (
                <>
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <div className="mt-2 h-px bg-white/40" />

                  {/* Task */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Task</h3>

                    {!isEditing ? (
                      <div className="border border-[#5A8DCB] rounded-md px-4 py-3 text-sm text-white/90">
                        {task}
                      </div>
                    ) : (
                      <input
                        value={task}
                        onChange={(e) => setTask(e.target.value)}
                        placeholder="Enter task"
                        className="w-full border border-[#5A8DCB] bg-transparent rounded-md px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FFD84E]"
                      />
                    )}
                  </div>

                  {/* Description */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-2">Description</h3>

                    {!isEditing ? (
                      <div className="border border-[#5A8DCB] rounded-md px-4 py-3 text-sm text-white/90">
                        {description}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Enter description"
                        className="w-full border border-[#5A8DCB] bg-transparent rounded-md px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#FFD84E]"
                      />
                    )}
                  </div>

                  {/* Upload Strategy */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <i className="fa-regular fa-file-arrow-up text-white/85 text-[14px]" />
                      Upload Strategy
                    </h3>

                    <label
                      htmlFor="file-upload"
                      className="h-[170px] border-2 border-dashed border-[#5A8DCB] rounded-md flex flex-col items-center justify-center text-center cursor-pointer hover:bg-white/5 transition"
                    >
                      <input
                        id="file-upload"
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        onChange={onFileChange}
                      />
                      <i className="fa-solid fa-plus text-white text-lg mb-2" />
                      <p className="text-sm text-white/85">
                        Drag & Drop or Click here to choose file
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        Max file size : 10 MB
                      </p>
                    </label>

                    {file && (
                      <div className="mt-4 bg-white text-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between gap-4 max-w-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#E9F0FF] text-[#103C8C] rounded-md p-2">
                            <i className="fa-regular fa-file-lines" />
                          </div>
                          <div>
                            <div className="text-sm font-medium">
                              {file.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <i className="fa-solid fa-check text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* Bottom buttons (view screen keeps one button; edit shows Save/Cancel on top already) */}
                  {!isEditing && (
                    <div className="mt-8 flex justify-end">
                      <button
                        className="bg-transparent border border-[#A6B8E8] text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md hover:bg-[#103C8C] hover:text-white transition"
                        onClick={() => inputRef.current?.click()}
                      >
                        {file ? "Upload New Strategy" : "Upload Strategy"}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-10 text-white/75 text-sm">
                  Under Construction
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

     

      {/* Assign Drawer */}
      {assignedDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-[420px] h-full bg-white shadow-2xl flex flex-col">
            <div className="px-6 py-5 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[#0B1C58]">Assigned to</h3>
              <button
                onClick={() => setAssignedDrawer(false)}
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
              {["John Doe", "Jacob Jones", "Robert Fox", "John Ross", "Jane"].map(
                (n, i) => (
                  <label
                    key={n}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        defaultChecked={i < 2}
                        className="accent-[#103C8C]"
                      />
                      <Image
                        src={"/user.png"}
                        alt={n}
                        width={35}
                        height={35}
                        className="rounded-full bg-gray-200"
                      />
                      <span className="text-[#0B1C58] text-sm font-medium">
                        {n}
                      </span>
                    </span>
                  </label>
                )
              )}
            </div>

            <div className="border-t px-6 py-4">
              <p className="text-xs text-gray-500 mb-2">
                John Doe, Jacob Jones and 3 others
              </p>
              <button
                onClick={() => {
                  setAssignedDrawer(false);
                  setToast("Assigned successfully");
                  setTimeout(() => setToast(""), 2000);
                }}
                className="w-full bg-[#103C8C] hover:bg-[#0B2E72] text-white rounded-md py-2 font-medium"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[60] bg-white border border-gray-200 shadow-lg rounded-md px-4 py-2 flex items-center gap-2 text-[#0B1C58]">
          <i className="fa-solid fa-check text-green-600" />
          <span className="text-sm">{toast}</span>
        </div>
      )}
    </div>
  );
}
