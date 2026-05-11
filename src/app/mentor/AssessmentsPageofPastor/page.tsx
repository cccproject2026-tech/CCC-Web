"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ApiAvatarPlaceholder, ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  apiGetAssignedAssessments,
  parseAssignedAssessmentsListBody,
  flattenAssignedAssessmentRow,
} from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";

type Status = "Not Started" | "Submitted" | "Completed";
type Assessment = {
  id: string;
  title: string;
  desc: string;
  /** API banner URL only when valid http(s) */
  thumbUrl: string | null;
  status: Status;
  dueOn?: string;
  submittedOn?: string;
  completedOn?: string;
};

function formatDueDate(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type PastorRow = {
  id: string;
  name: string;
  avatarUrl: string | null;
};

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

export default function PastorAssessments() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [pastors, setPastors] = useState<PastorRow[]>([]);
  const [selectedPastorId, setSelectedPastorId] = useState<string | null>(null);
  const [data, setData] = useState<Assessment[]>([]);
  const [loadingPastors, setLoadingPastors] = useState(true);
  const [loadingAssessments, setLoadingAssessments] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingPastors(true);
        const mentor = getMentorFromCookie();
        const mid = mentor?.id ?? mentor?._id;
        if (!mid) return;
        const res = await apiGetAssignedUsers(String(mid));
        const body = res.data as { data?: unknown };
        const users = Array.isArray(body?.data) ? body.data : [];
        const rows: PastorRow[] = (users as any[]).map((u) => ({
          id: String(u._id ?? u.id),
          name: [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.email || "Pastor",
          avatarUrl: isHttpUrl(u.profilePicture) ? u.profilePicture : null,
        }));
        setPastors(rows);
        if (rows[0]) setSelectedPastorId(rows[0].id);
      } catch (e) {
        console.error(e);
        setPastors([]);
      } finally {
        setLoadingPastors(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedPastorId) return;
    const load = async () => {
      try {
        setLoadingAssessments(true);
        const [assessmentRes, progressRes] = await Promise.all([
          apiGetAssignedAssessments(selectedPastorId),
          apiGetUserProgress(selectedPastorId),
        ]);
        const list = parseAssignedAssessmentsListBody(assessmentRes.data);
        const progressData = unwrapProgressData(progressRes);
        const assessmentProgress = progressData?.assessments || [];

        const mapped: Assessment[] = [];
        for (const item of list) {
          const flat = flattenAssignedAssessmentRow(item);
          if (!flat) continue;
          const { assessment, assessmentId: aid, assignmentId, dueDate, updatedAt } = flat;
          const progress = assessmentProgress.find(
            (p: { assessmentId?: string; assignmentId?: string }) =>
              String(p.assessmentId) === aid ||
              (assignmentId && p.assignmentId && String(p.assignmentId) === assignmentId),
          );
          const ps = String(progress?.status || "").toLowerCase().replace(/\s+/g, "_");
          let st: Status = "Not Started";
          if (ps === "completed" || ps === "reviewed") st = "Completed";
          else if (ps === "submitted") st = "Submitted";

          const banner = assessment?.bannerImage as string | undefined;
          const thumbUrl = isHttpUrl(banner) ? banner! : null;
          const dateSrc = updatedAt || dueDate;
          const row: Assessment = {
            id: aid,
            title: (assessment?.name as string) || "Assessment",
            desc: (assessment?.description as string) || "",
            thumbUrl,
            status: st,
            dueOn: formatDueDate(dueDate),
          };
          if (st === "Submitted") {
            row.submittedOn = new Date(dateSrc || Date.now()).toLocaleDateString();
          }
          if (st === "Completed") {
            row.completedOn = new Date(dateSrc || Date.now()).toLocaleDateString();
          }
          mapped.push(row);
        }
        setData(mapped);
      } catch (e) {
        console.error(e);
        setData([]);
      } finally {
        setLoadingAssessments(false);
      }
    };
    load();
  }, [selectedPastorId]);

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

  const filtered = useMemo(() => {
    const bySearch = data.filter((a) =>
      a.title.toLowerCase().includes(search.trim().toLowerCase())
    );
    return status === "All" ? bySearch : bySearch.filter((a) => a.status === status);
  }, [data, search, status]);

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
      <main className="flex-1 bg-[#254487] px-0 pt-8 pb-20">
        <div className="w-full">
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
                      type="button"
                      onClick={() => router.push("/mentor/MentorAssessments/create")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    >
                      <i className="fa-regular fa-square-up-right" />
                      Create and Assign
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push("/mentor/MentorAssessments")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 text-[#103C8C]"
                    >
                      <i className="fa-regular fa-folder-open" />
                      Assessment library
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pastor strip (assigned mentees) */}
          <div className="mt-7 flex items-center gap-6 overflow-x-auto pb-1">
            {loadingPastors && (
              <p className="text-sm text-white/80">Loading pastors…</p>
            )}
            {!loadingPastors &&
              pastors.map((m) => {
                const active = selectedPastorId === m.id;
                return (
                  <div key={m.id} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedPastorId(m.id)}
                      className={`rounded-full p-[3px] ${
                        active ? "bg-gradient-to-t from-[#8D5CFF] to-[#67A7FF]" : "bg-transparent"
                      }`}
                    >
                      <span className="block h-[62px] w-[62px] overflow-hidden rounded-full bg-white p-[2px]">
                        {m.avatarUrl ? (
                          <Image
                            src={m.avatarUrl}
                            alt={m.name}
                            width={58}
                            height={58}
                            className="rounded-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <ApiAvatarPlaceholder label={m.name} className="h-[58px] w-[58px] rounded-full" />
                        )}
                      </span>
                    </button>
                    <span className="mt-2 max-w-[88px] truncate text-center text-xs text-white">{m.name}</span>
                  </div>
                );
              })}
          </div>

          <hr className="border-white/20 mt-6 mb-8" />

          {/* Cards grid (2 cols) */}
          {loadingAssessments && (
            <p className="mt-8 text-center text-sm text-white/80">Loading assessments…</p>
          )}
          <div className="grid gap-7 md:grid-cols-2">
            {!loadingAssessments &&
              filtered.map((a) => (
              <div key={a.id} className="flex overflow-hidden rounded-xl bg-white shadow-md">
                {/* Thumb */}
                <div className="w-[210px] min-w-[210px] p-5">
                  <div className="h-[150px] w-full overflow-hidden rounded-lg">
                    {a.thumbUrl ? (
                      <Image
                        src={a.thumbUrl}
                        alt={a.title}
                        width={210}
                        height={150}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                    )}
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

                    {a.dueOn && (
                      <div className="mt-3 text-[12px] text-[#6B789A]">
                        Due on <span className="ml-1 font-medium text-[#0B1C58]">{a.dueOn}</span>
                      </div>
                    )}

                    {a.status === "Completed" && (
                      <>
                        <div className="mt-3 text-[12px] text-[#6B789A]">
                          Completed on :{" "}
                          <span className="ml-1 font-medium text-[#0B1C58]">{a.completedOn}</span>
                        </div>
                        <button
                          type="button"
                          disabled={!selectedPastorId}
                          className="mt-3 text-[12px] bg-[#0B1C58] text-white px-3 py-2 rounded-md disabled:opacity-50"
                          onClick={() =>
                            selectedPastorId &&
                            router.push(
                              `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(a.id)}&userId=${encodeURIComponent(selectedPastorId)}&viewOnly=1`,
                            )
                          }
                        >
                          View responses
                        </button>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!selectedPastorId}
                      onClick={() =>
                        selectedPastorId &&
                        router.push(
                          `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(a.id)}&userId=${encodeURIComponent(selectedPastorId)}&viewOnly=1`,
                        )
                      }
                      className="bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#0B2E72] transition disabled:opacity-50"
                    >
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!loadingAssessments && selectedPastorId && filtered.length === 0 && (
            <p className="mt-8 text-center text-sm text-white/80">No assessments for this pastor.</p>
          )}
        </div>
      </main>

    </div>
  );
}
