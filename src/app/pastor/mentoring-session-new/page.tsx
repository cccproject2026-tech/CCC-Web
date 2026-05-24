"use client";

import { useEffect, useMemo, useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import {
  apiGetPastorMentoringSessions,
  apiRequestMentoringSessionReschedule,
  type MentoringSession,
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

function getCurrentPastorId() {
  if (typeof window === "undefined") return "";
  return (
    parseStoredUserId(readCookie("user")) ||
    parseStoredUserId(localStorage.getItem("user") || "") ||
    localStorage.getItem("userId") ||
    readCookie("userId") ||
    ""
  );
}

function unwrapSessions(response: any): MentoringSession[] {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.sessions)) return data.sessions;
  if (Array.isArray(response?.data?.sessions)) return response.data.sessions;
  return [];
}

function getSessionId(session: MentoringSession) {
  const row = session as any;
  return getStringValue(row?._id, row?.id, row?.sessionId);
}

function getSessionStatus(session: MentoringSession) {
  return getStringValue(session.status, "LOCKED").toUpperCase();
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

function statusLabel(status: string) {
  if (status === "MISSED") return "Needs Action";
  if (status === "SCHEDULED") return "Upcoming";
  if (status === "COMPLETED") return "Completed";
  if (status === "LOCKED") return "Locked";
  return status;
}

export default function PastorMentoringSessionNewPage() {
  const [sessions, setSessions] = useState<MentoringSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requestingId, setRequestingId] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const pastorId = getCurrentPastorId();
        if (!pastorId) {
          setSessions([]);
          return;
        }
        const response = await apiGetPastorMentoringSessions(pastorId);
        const rows = unwrapSessions(response).sort(
          (a, b) => Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0),
        );
        if (!cancelled) setSessions(rows);
      } catch (err) {
        if (!cancelled) {
          setSessions([]);
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

  const completedCount = useMemo(
    () => sessions.filter((session) => getSessionStatus(session) === "COMPLETED").length,
    [sessions],
  );

  const requestReschedule = async (session: MentoringSession) => {
    const sessionId = getSessionId(session);
    if (!sessionId) {
      alert("This session is not available for reschedule yet.");
      return;
    }
    try {
      setRequestingId(sessionId);
      await apiRequestMentoringSessionReschedule(sessionId);
      alert("Reschedule request sent to your mentor.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to request reschedule.");
    } finally {
      setRequestingId("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader />

      <section className="border-b border-white/10 bg-[linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 md:px-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
          <p className="mt-2 text-sm text-[#cde2f2]">Your 10-session mentoring journey from the backend.</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">
        <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur">
          <p className="text-sm text-white/55">Progress</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-xl font-semibold">{completedCount}/10 completed</p>
            <p className="text-sm text-white/55">{sessions.length} sessions returned</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#8ec5eb]" style={{ width: `${Math.min(100, completedCount * 10)}%` }} />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-white/70">Loading mentoring sessions...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">{error}</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 py-14 text-center text-white/60">
            No mentoring sessions yet. Complete Jumpstart to begin.
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session, index) => {
              const sessionId = getSessionId(session);
              const status = getSessionStatus(session);
              const locked = status === "LOCKED";
              const missed = status === "MISSED";
              const title = getStringValue(session.title, session.mentorNote, `Session ${session.sessionNumber || index + 1}`);
              return (
                <article
                  key={sessionId || `${session.sessionNumber || index}-${title}`}
                  className={`rounded-2xl border p-5 backdrop-blur ${
                    locked ? "border-white/10 bg-white/[0.03] opacity-75" : "border-white/15 bg-white/5"
                  }`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-semibold text-white">{title}</h2>
                        <span className="text-xs text-white/45">Session {session.sessionNumber || index + 1}</span>
                      </div>
                      <p className="mt-2 text-sm text-white/60">
                        {session.scheduledDate ? formatDate(session.scheduledDate) : locked ? "Locked" : "Schedule pending"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <SessionStatusBadge status={status} compact />
                      <span className="text-xs font-semibold text-white/60">{statusLabel(status)}</span>
                      {missed ? (
                        <button
                          type="button"
                          onClick={() => void requestReschedule(session)}
                          disabled={!sessionId || requestingId === sessionId}
                          className="rounded-xl bg-[#8ec5eb] px-4 py-2 text-xs font-bold text-[#062946] transition hover:bg-[#b7def6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {requestingId === sessionId ? "Sending..." : "Request reschedule"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
