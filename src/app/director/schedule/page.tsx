"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "@/app/utils/cookies";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageContainer, directorPageRoot } from "../directorUi";
import { DirectorFilterSection } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import ProgressBg from "../../Assets/progress-bg.jpg";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import { apiGetAppointments } from "@/app/Services/appointments.service";
import { appointmentEntityId, unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import type { AppointmentResponse, PersonInfo } from "@/app/Services/types";
import { isRemoteImageSrc } from "@/app/utils/image";

function labelPerson(p: string | PersonInfo | undefined, fallback: string): string {
  if (p == null) return fallback;
  if (typeof p === "string") return fallback;
  const n = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return n || p.email || fallback;
}

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
  );
}

export default function DirectorSchedulePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "today" | "upcoming">("all");
  const [rows, setRows] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const uid =
          typeof window !== "undefined" ? (getCookie("userId") as string | undefined) : undefined;
        let list: unknown[] = [];
        try {
          const res = await apiGetAppointments({ futureOnly: true, status: "scheduled" });
          list = unwrapAppointmentsAxiosData(res);
        } catch {
          if (!uid) throw new Error("No scope");
          const res = await apiGetAppointments({
            futureOnly: true,
            status: "scheduled",
            userId: String(uid),
          });
          list = unwrapAppointmentsAxiosData(res);
        }
        if ((!list || list.length === 0) && uid) {
          const res = await apiGetAppointments({
            futureOnly: true,
            status: "scheduled",
            userId: String(uid),
          });
          const alt = unwrapAppointmentsAxiosData(res);
          if (Array.isArray(alt) && alt.length > 0) list = alt;
        }
        const normalized = (Array.isArray(list) ? list : []) as AppointmentResponse[];
        const sorted = [...normalized].sort(
          (a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
        );
        if (!cancelled) setRows(sorted);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Could not load schedule.");
          setRows([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((a) => {
      const mentor = a.mentor ?? (typeof a.mentorId === "object" ? a.mentorId : undefined);
      const user = a.user ?? (typeof a.userId === "object" ? a.userId : undefined);
      const mentorName = labelPerson(mentor, "").toLowerCase();
      const userName = labelPerson(user, "").toLowerCase();
      const hay = `${mentorName} ${userName} ${String(a.platform)} ${a.meetingDate}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);

      const today = isToday(a.meetingDate);
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "today" && today) ||
        (activeTab === "upcoming" && !today);

      return matchesSearch && matchesTab;
    });
  }, [rows, searchQuery, activeTab]);

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Schedule"
        subtitle="Upcoming mentor–mentee sessions across your network."
        image={ProgressBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Schedule" },
        ]}
      />

      <section className="relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20">
        <div className={directorPageContainer}>
          <DirectorFilterSection className="!p-4 sm:!p-5">
            <div className="relative w-full flex-1 md:max-w-md">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, platform, or date"
                variant="dark"
                className="w-full"
              />
            </div>
            <div className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1">
              {[
                { id: "all" as const, label: "All" },
                { id: "today" as const, label: "Today" },
                { id: "upcoming" as const, label: "Upcoming" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative h-8 rounded-md px-4 text-sm font-semibold capitalize transition-all ${
                    activeTab === tab.id
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                      : "bg-transparent text-white/70 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </DirectorFilterSection>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
              <p className="text-sm text-white/60">Loading schedule…</p>
            </div>
          ) : error ? (
            <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-100">
              {error}
            </p>
          ) : null}

          {!loading && !error && (
            <div className="space-y-4">
              {filtered.map((appointment) => {
                const id = appointmentEntityId(appointment);
                const platformIcon =
                  appointment.platform === "gmeet" || appointment.platform === "google-meet"
                    ? MeetIcon
                    : DuoIcon;
                const mentor = appointment.mentor ?? (typeof appointment.mentorId === "object" ? appointment.mentorId : undefined);
                const mentee =
                  appointment.user ?? (typeof appointment.userId === "object" ? appointment.userId : undefined);
                const mentorName = labelPerson(mentor, "Mentor");
                const menteeName = labelPerson(mentee, "Mentee");
                const meetingDate = new Date(appointment.meetingDate);
                const meetingTime = meetingDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                });
                const dateLabel = meetingDate.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const menteeId =
                  typeof appointment.userId === "string"
                    ? appointment.userId
                    : appointment.userId?._id ?? appointment.user?._id;

                return (
                  <div
                    key={id}
                    className={`flex flex-col gap-4 p-5 sm:flex-row sm:items-stretch ${directorGlassCard}`}
                  >
                    <div className="flex shrink-0 justify-center sm:justify-start">
                      <div className="flex h-[100px] w-[100px] items-center justify-center rounded-2xl border border-white/15 bg-white/10 sm:h-[120px] sm:w-[120px]">
                        <Image src={platformIcon} alt="" className="h-12 w-12 sm:h-14 sm:w-14" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        {mentor?.profilePicture ? (
                          <Image
                            src={mentor.profilePicture}
                            alt=""
                            width={40}
                            height={40}
                            unoptimized={isRemoteImageSrc(mentor.profilePicture)}
                            className="rounded-full border border-white/30"
                          />
                        ) : (
                          <Image
                            src={UserProfile}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded-full border border-white/30"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-white">{mentorName}</h4>
                          <p className="text-xs capitalize text-white/60">Mentor</p>
                        </div>
                      </div>
                      <p className="text-sm text-white/85">
                        <span className="text-white/55">With </span>
                        {menteeName}
                      </p>
                      <p className="mt-2 text-sm text-[#8ec5eb]">
                        {dateLabel} · {meetingTime}
                      </p>
                      <p className="mt-1 text-xs capitalize text-white/50">{appointment.platform}</p>
                      {menteeId ? (
                        <Link
                          href={`/director/mentees/profile/${menteeId}`}
                          className="mt-3 inline-block text-sm font-medium text-[#8ec5eb] hover:text-[#b8ddf5]"
                        >
                          View mentee profile
                        </Link>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && !error && filtered.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <i className="fa-regular fa-calendar-xmark text-4xl text-white/50" />
              </div>
              <p className="text-lg text-white/80">
                {rows.length === 0
                  ? "No upcoming appointments."
                  : "No sessions match your search or filter."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
