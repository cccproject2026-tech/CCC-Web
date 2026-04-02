"use client";

import { useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Image from "next/image";

const glassPanel =
  "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_24px_56px_rgba(2,20,38,0.18)]";

type Assignment = {
  id: number;
  title: string;
  desc: string;
  status: "Not Started" | "Due" | "Completed";
  months: string;
  img: any;
};

export default function MentorAssignmentsPage() {
  const [activeTab, setActiveTab] = useState<"New" | "Due" | "Completed">("New");
  const [searchTerm, setSearchTerm] = useState("");

  const assignments: Assignment[] = useMemo(
    () => [
      {
        id: 1,
        title: "Prayer and Visitation Strategy",
        desc: "Finalize the teams vision for the church",
        status: "Not Started",
        months: "10 – 12",
        img: null,
      },
      {
        id: 2,
        title: "Calendar",
        desc: "Finalize a vision team meeting schedule through the end of the year",
        status: "Due",
        months: "10 – 12",
        img: null,
      },
      {
        id: 3,
        title: "Prayer",
        desc: "Prioritize church prayer times and meet consistently for prayer with your congregation",
        status: "Not Started",
        months: "10 – 12",
        img: null,
      },
      {
        id: 4,
        title: "Mentoring Conversations",
        desc: "Schedule two mentoring conversations with your mentor",
        status: "Not Started",
        months: "10 – 12",
        img: null,
      },
    ],
    [],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const tab = activeTab;
    return assignments.filter((a) => {
      const matchesQ = !q || a.title.toLowerCase().includes(q) || a.desc.toLowerCase().includes(q);
      const matchesTab =
        tab === "New"
          ? a.status === "Not Started"
          : tab === "Due"
            ? a.status === "Due"
            : a.status === "Completed";
      return matchesQ && matchesTab;
    });
  }, [assignments, activeTab, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />

      <div className="relative z-10">
        <MentorHeader showFullHeader={true} />

        <section
          className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
          style={{ backgroundImage: `url(${HeroBg.src})` }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.75)_0%,rgba(6,41,70,0.6)_45%,rgba(6,41,70,1)_100%)]" />
          <div className="relative z-10 mx-auto w-full max-w-7xl">
            <h1 className="text-2xl font-semibold sm:text-3xl">Assignments</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">
              Track your mentoring tasks and next steps.
            </p>
          </div>
        </section>

        <main className="flex-1 px-4 pb-16 sm:px-8 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className={`mb-8 ${glassPanel} p-4 sm:p-5`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative md:w-[380px]">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-white/60" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search assignments..."
                    className="w-full rounded-xl border border-white/20 bg-white/10 pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-white/60 outline-none focus:border-[#8ec5eb]/60"
                  />
                </div>

                <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 shadow-sm">
                  {(["New", "Due", "Completed"] as const).map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-semibold transition ${
                          isActive
                            ? "bg-[#8ec5eb]/20 text-white"
                            : "text-[#cde2f2] hover:bg-white/10"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-14 text-white/80">
                No assignments found.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {filtered.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-2xl border border-white/15 bg-white/5 p-5 hover:bg-white/10 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold">{a.title}</h3>
                        <p className="mt-1 text-sm text-[#cde2f2]">{a.desc}</p>
                      </div>
                      <span className="rounded-xl border border-white/15 bg-white/5 px-3 py-1 text-xs text-[#cde2f2] whitespace-nowrap">
                        {a.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-white/60">Months {a.months}</p>
                      <button
                        type="button"
                        className="rounded-xl bg-[#8ec5eb]/90 px-4 py-2 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
                        onClick={() => {
                          // Placeholder action; wire to real details later.
                        }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
        <PastorFooter />
      </div>
    </div>
  );
}

