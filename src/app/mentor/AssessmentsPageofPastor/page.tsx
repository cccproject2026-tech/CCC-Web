"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import Card4 from "@/app/Assets/card4.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import Mentor2 from "@/app/Assets/mentor2.png";
import Mentor3 from "@/app/Assets/mentor3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

type Status = "Not Started" | "Submitted" | "Completed";
type Assessment = {
  id: number;
  title: string;
  desc: string;
  thumb: any;
  status: Status;
  submittedOn?: string;
  completedOn?: string;
};

const mentors = [
  { id: 1, name: "Jacob Jones", avatar: Mentor1 },
  { id: 2, name: "John Doe", avatar: Mentor2 },
  { id: 3, name: "Robert Fox", avatar: Mentor3 },
  { id: 4, name: "Jacob Jones", avatar: Mentor1 },
  { id: 5, name: "Robert Fox", avatar: Mentor2 },
  { id: 6, name: "John Doe", avatar: Mentor3 },
];

const DATA: Assessment[] = [
  {
    id: 1,
    title: "Church Assessment Evaluation(CMA)",
    desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
    thumb: Card1,
    status: "Not Started",
  },
  {
    id: 2,
    title: "Pastoral Ministry Profile (PMP)",
    desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
    thumb: Card2,
    status: "Submitted",
    submittedOn: "20 Sep 2024",
  },
  {
    id: 3,
    title: "Pastoral Ministry Profile (PMP)",
    desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
    thumb: Card3,
    status: "Completed",
    completedOn: "20 Oct 2024",
  },
  {
    id: 4,
    title: "Pastoral Ministry Profile (PMP)",
    desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
    thumb: Card4,
    status: "Completed",
    completedOn: "20 Oct 2024",
  },
];

export default function PastorAssessments() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [activeMentor, setActiveMentor] = useState<number | null>(1);

  /* Add dropdown */
  const [openAdd, setOpenAdd] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      if (!addRef.current) return;
      if (!addRef.current.contains(e.target as Node)) setOpenAdd(false);
    };
    window.addEventListener("click", onClickAway);
    return () => window.removeEventListener("click", onClickAway);
  }, []);

  /* View → modal flow */
  const [viewing, setViewing] = useState<Assessment | null>(null);
  const [modalStep, setModalStep] = useState<"guidelines" | "questions">("guidelines");
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");

  const openView = (a: Assessment) => {
    setViewing(a);
    setModalStep("guidelines");
  };
  const closeView = () => {
    setViewing(null);
    setModalStep("guidelines");
    setQ1(""); setQ2(""); setQ3("");
  };

  const filtered = useMemo(() => {
    const bySearch = DATA.filter((a) =>
      a.title.toLowerCase().includes(search.trim().toLowerCase())
    );
    return status === "All" ? bySearch : bySearch.filter((a) => a.status === status);
  }, [search, status]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <MentorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[250px] flex items-end px-16 pb-10 bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90" />
        <h1 className="relative z-10 text-4xl font-semibold text-white">Assessments</h1>
      </section>

      {/* MAIN */}
      <main className="flex-1 bg-[#254487] pt-8 pb-20 px-10 md:px-20">
        <div className="max-w-7xl mx-auto">
          {/* Search + Filters + Add */}
          <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6 justify-between">
            {/* Search */}
            <div className="relative w-full lg:w-[370px]">
              <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full bg-white border border-[#E6E9F3] rounded-md pl-10 pr-4 py-2 text-sm text-gray-700 shadow-sm outline-none focus:ring-2 focus:ring-[#103C8C]"
              />
            </div>

            {/* Segmented Filter + Add */}
            <div className="flex items-center gap-3">
              <div className="flex bg-white rounded-md border border-[#E6E9F3] overflow-hidden">
                {(["All", "Not Started", "Completed", "Submitted"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setStatus(t)}
                    className={`px-4 py-2 text-sm font-medium transition ${
                      status === t
                        ? "bg-[#103C8C] text-white"
                        : "text-[#43507A] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Add dropdown */}
              <div className="relative" ref={addRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenAdd((s) => !s);
                  }}
                  className="bg-white text-[#103C8C] text-sm font-medium px-4 py-2 rounded-md border border-[#E6E9F3] hover:bg-[#F5F8FF] flex items-center gap-2"
                >
                  <i className="fa-regular fa-square-plus" />
                  Add
                </button>

                {openAdd && (
                  <div className="absolute right-0 mt-2 w-[280px] bg-white rounded-md shadow-xl border border-gray-200 z-20">
                    <button
                      onClick={() => router.push("/pastor/assessments/create")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    >
                      <i className="fa-regular fa-square-up-right" />
                      Create and Assign
                    </button>
                    <button
                      onClick={() => router.push("/pastor/assessments/library")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    >
                      <i className="fa-regular fa-folder-open" />
                      Choose from Library
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mentor strip */}
          <div className="mt-7 flex items-center gap-6 overflow-x-auto pb-1">
            {mentors.map((m) => {
              const active = activeMentor === m.id;
              return (
                <div key={m.id} className="flex flex-col items-center">
                  <button
                    onClick={() => setActiveMentor(m.id)}
                    className={`rounded-full p-[3px] ${
                      active ? "bg-gradient-to-t from-[#8D5CFF] to-[#67A7FF]" : "bg-transparent"
                    }`}
                  >
                    <span className="block bg-white rounded-full p-[2px]">
                      <Image
                        src={m.avatar}
                        alt={m.name}
                        width={58}
                        height={58}
                        className="rounded-full"
                      />
                    </span>
                  </button>
                  <span className="text-white text-xs mt-2">{m.name}</span>
                </div>
              );
            })}
          </div>

          <hr className="border-white/20 mt-6 mb-8" />

          {/* Cards grid (2 cols) */}
          <div className="grid md:grid-cols-2 gap-7">
            {filtered.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow-md overflow-hidden flex">
                {/* Thumb */}
                <div className="w-[210px] min-w-[210px] p-5">
                  <div className="w-full h-[150px] rounded-lg overflow-hidden">
                    <Image src={a.thumb} alt={a.title} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pr-5 pl-0 py-5 flex flex-col">
                  <div className="flex-1">
                    <h3 className="text-[15px] font-semibold text-[#0B1C58] leading-tight">
                      {a.title}
                    </h3>
                    <p className="text-[12px] text-[#6B789A] mt-1">{a.desc}</p>

                    {/* Status row */}
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <span className="text-[#8A94B3]">Status</span>
                      {a.status === "Not Started" && (
                        <span className="px-2 py-[2px] rounded bg-[#F4F6FB] text-[#6C78A1] border border-[#E6E9F3]">
                          Not Started
                        </span>
                      )}
                      {a.status === "Submitted" && (
                        <span className="px-2 py-[2px] rounded bg-[#F4F6FB] text-[#6C78A1] border border-[#E6E9F3]">
                          Submitted
                        </span>
                      )}
                      {a.status === "Completed" && (
                        <span className="px-2 py-[2px] rounded bg-[#E8FFF1] text-[#149B55] border border-[#BDE8CF]">
                          Completed
                        </span>
                      )}
                    </div>

                    {a.status === "Submitted" && (
                      <div className="mt-3 text-[12px] text-[#6B789A]">
                        Submitted on{" "}
                        <span className="inline-block ml-1 px-3 py-[6px] rounded border border-[#E6E9F3] bg-[#F4F6FB] text-[#4B587E]">
                          {a.submittedOn}
                        </span>
                      </div>
                    )}

                    {a.status === "Completed" && (
                      <>
                        <div className="mt-3 text-[12px] text-[#6B789A]">
                          Completed on :{" "}
                          <span className="ml-1 font-medium text-[#0B1C58]">{a.completedOn}</span>
                        </div>
                        <button
                          className="mt-3 text-[12px] bg-[#0B1C58] text-white px-3 py-2 rounded-md"
                          onClick={() => router.push("/pastor/assessments/customized-plan")}
                        >
                          Customized Development Plans
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => openView(a)}
                      className="bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0B2E72] transition"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ------- VIEW MODALS ------- */}
      {viewing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeView} />
          <div className="relative max-w-[880px] w-[92vw] mx-auto mt-20 bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* gradient header bar like screenshot */}
            <div className="relative h-[110px] bg-gradient-to-r from-[#1235A0] via-[#2857D1] to-[#0A2D8A]">
              <button
                onClick={closeView}
                className="absolute right-4 top-4 h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 text-white grid place-items-center"
              >
                <i className="fa-solid fa-xmark" />
              </button>
              <div className="absolute left-0 right-0 bottom-3 px-7">
                <h3 className="text-white text-[22px] font-semibold">
                  {viewing.title}
                </h3>
                <p className="text-white/70 text-xs">
                  This survey is about your current personal well being
                </p>
              </div>
            </div>

            {/* body */}
            {modalStep === "guidelines" ? (
              <div className="px-7 py-6">
                <h4 className="text-[#0B1C58] font-semibold mb-3">Survey Guidelines</h4>
                <div className="border border-[#E6E9F3] rounded-lg p-4">
                  <ul className="space-y-3 text-[14px] text-[#3E4B78]">
                    <li className="flex items-start gap-3">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#1A4AD9]" />
                      Please complete the survey in a single session without taking breaks.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#1A4AD9]" />
                      If there is a power outage or loss of internet connection, the survey will
                      restart from the beginning.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#1A4AD9]" />
                      You will not be able to return to previous sections.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#1A4AD9]" />
                      This survey consists of 5 sections to complete.
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-[7px] h-2 w-2 rounded-full bg-[#1A4AD9]" />
                      The survey should take approximately 45 minutes to complete.
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setModalStep("questions")}
                    className="bg-[#103C8C] text-white px-6 py-2 rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-7 py-6">
                <h4 className="text-[#0B1C58] font-semibold mb-4">
                  Please Answer the Questions :
                </h4>

                <label className="block text-[#6A769B] text-sm mb-2">
                  What is your current church membership ?
                </label>
                <input
                  value={q1}
                  onChange={(e) => setQ1(e.target.value)}
                  className="w-full border border-[#E1E6F3] rounded-md px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#103C8C]"
                />

                <label className="block text-[#6A769B] text-sm mb-2">
                  How many active members do you have currently?
                </label>
                <input
                  value={q2}
                  onChange={(e) => setQ2(e.target.value)}
                  className="w-full border border-[#E1E6F3] rounded-md px-4 py-2 mb-4 outline-none focus:ring-2 focus:ring-[#103C8C]"
                />

                <label className="block text-[#6A769B] text-sm mb-2">
                  How many baptisms in the last two years ?
                </label>
                <input
                  value={q3}
                  onChange={(e) => setQ3(e.target.value)}
                  className="w-full border border-[#E1E6F3] rounded-md px-4 py-2 mb-6 outline-none focus:ring-2 focus:ring-[#103C8C]"
                />

                <div className="flex justify-end">
                  <button
                    onClick={() => router.push("/mentor/cma")}
                    className="bg-[#103C8C] text-white px-6 py-2 rounded-md"
                  >
                    View Survey
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
