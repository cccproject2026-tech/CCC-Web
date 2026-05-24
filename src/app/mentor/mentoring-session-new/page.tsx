"use client";

import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import {
  apiGetMentorMentoringSessionsGrouped,
  type MentoringSession,
  type MentoringSessionGroup,
} from "@/app/Services/mentoring-sessions.service";

function getStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1] || "";
}

function parseStoredUserId(value: string) {
  if (!value) return "";
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return getStringValue(parsed?.id, parsed?._id, parsed?.userId);
  } catch {
    return "";
  }
}

function getCurrentMentorId() {
  if (typeof window === "undefined") return "";
  return (
    parseStoredUserId(readCookie("mentor")) ||
    parseStoredUserId(localStorage.getItem("mentor") || "") ||
    parseStoredUserId(readCookie("user")) ||
    parseStoredUserId(localStorage.getItem("user") || "") ||
    localStorage.getItem("mentorId") ||
    localStorage.getItem("userId") ||
    readCookie("mentorId") ||
    readCookie("userId") ||
    ""
  );
}

function unwrapGroups(response: any): MentoringSessionGroup[] {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.groups)) return data.groups;
  if (Array.isArray(data?.grouped)) return data.grouped;
  if (Array.isArray(data?.pastors)) return data.pastors;
  return [];
}

function getSessionId(session: MentoringSession) {
  const row = session as any;
  return getStringValue(row?._id, row?.id, row?.sessionId);
}

function getSessionStatus(session: MentoringSession) {
  return getStringValue(session.status, "LOCKED").toUpperCase();
}

function getPastorName(group: MentoringSessionGroup) {
  const pastor = (group as any)?.pastor;
  return getStringValue(
    group.pastorName,
    (group as any)?.name,
    `${pastor?.firstName || ""} ${pastor?.lastName || ""}`.trim(),
    pastor?.email,
    "Pastor",
  );
}

function getPastorEmail(group: MentoringSessionGroup) {
  const pastor = (group as any)?.pastor;
  return getStringValue(group.pastorEmail, (group as any)?.email, pastor?.email);
}

function getPastorId(group: MentoringSessionGroup) {
  const pastor = (group as any)?.pastor;
  return getStringValue(group.pastorId, (group as any)?.userId, pastor?._id, pastor?.id, getPastorEmail(group));
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "P";
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function sortSessions(sessions: MentoringSession[]) {
  return [...sessions].sort((a, b) => Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0));
}

export default function MentorMentoringSessionNewPage() {
  const [groups, setGroups] = useState<MentoringSessionGroup[]>([]);
  const [selectedPastorId, setSelectedPastorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const mentorId = getCurrentMentorId();
        if (!mentorId) {
          setGroups([]);
          return;
        }
        const response = await apiGetMentorMentoringSessionsGrouped(mentorId);
        const rows = unwrapGroups(response);
        if (!cancelled) {
          setGroups(rows);
          setSelectedPastorId((prev) => prev || getPastorId(rows[0] || {}));
        }
      } catch (err) {
        if (!cancelled) {
          setGroups([]);
          setError(err instanceof Error ? err.message : "Failed to load mentoring sessions.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedGroup = useMemo(
    () => groups.find((group) => getPastorId(group) === selectedPastorId) || groups[0],
    [groups, selectedPastorId],
  );
  const selectedSessions = sortSessions(selectedGroup?.sessions || []);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader />

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 md:px-10">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Backend mentoring journeys for your assigned pastors.</p>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-7xl flex-1 gap-6 px-4 py-8 lg:grid-cols-[360px_1fr] lg:px-10">
        {loading ? (
          <div className="col-span-full py-16 text-center text-white/70">Loading mentoring sessions...</div>
        ) : error ? (
          <div className="col-span-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">{error}</div>
        ) : groups.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-white/60">
            No mentoring sessions yet.
          </div>
        ) : (
          <>
            <aside className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold text-[#8ec5eb]">Assigned Pastors</h2>
              <div className="mt-5 space-y-3">
                {groups.map((group) => {
                  const pastorId = getPastorId(group);
                  const name = getPastorName(group);
                  const sessions = group.sessions || [];
                  const missed = sessions.some((session) => getSessionStatus(session) === "MISSED");
                  const completed = sessions.filter((session) => getSessionStatus(session) === "COMPLETED").length;
                  return (
                    <button
                      key={pastorId || name}
                      type="button"
                      onClick={() => setSelectedPastorId(pastorId)}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        getPastorId(selectedGroup || {}) === pastorId
                          ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/15"
                          : "border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#173653] text-sm font-bold">
                          {initials(name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate font-semibold">{name}</p>
                            <span
                              className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                                missed
                                  ? "border-red-400/30 bg-red-500/20 text-red-100"
                                  : "border-blue-400/30 bg-blue-500/20 text-blue-100"
                              }`}
                            >
                              {missed ? "Needs Action" : "Active"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-white/50">{getPastorEmail(group) || "No email"}</p>
                          <p className="mt-3 text-xs text-white/65">{completed}/10 completed</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <section className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedGroup ? getPastorName(selectedGroup) : "Pastor"}</h2>
                  <p className="mt-1 text-sm text-white/55">{selectedGroup ? getPastorEmail(selectedGroup) : ""}</p>
                </div>
                {selectedSessions.some((session) => getSessionStatus(session) === "MISSED") ? (
                  <span className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-bold text-red-100">
                    Needs Action
                  </span>
                ) : null}
              </div>

              <div className="mt-6 space-y-4">
                {selectedSessions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center text-white/60">
                    No sessions returned for this pastor.
                  </div>
                ) : (
                  selectedSessions.map((session, index) => {
                    const sessionId = getSessionId(session);
                    const status = getSessionStatus(session);
                    const locked = status === "LOCKED";
                    const title = getStringValue(session.title, session.mentorNote, `Session ${session.sessionNumber || index + 1}`);
                    return (
                      <article
                        key={sessionId || `${session.sessionNumber || index}-${title}`}
                        className={`rounded-2xl border p-5 ${locked ? "border-white/10 bg-white/[0.03] opacity-75" : "border-white/15 bg-white/[0.05]"}`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-white">{title}</h3>
                              <span className="text-xs text-white/45">Session {session.sessionNumber || index + 1}</span>
                            </div>
                            <p className="mt-2 text-sm text-white/60">
                              {session.scheduledDate ? formatDate(session.scheduledDate) : locked ? "Locked" : "Schedule pending"}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <SessionStatusBadge status={status} compact />
                            {!sessionId ? <span className="text-xs text-white/40">No detail available</span> : null}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
