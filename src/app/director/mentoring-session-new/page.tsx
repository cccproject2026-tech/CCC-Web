"use client";

import { useEffect, useMemo, useState } from "react";
import DirectorHero from "@/app/director/DirectorHero";
import { directorGlassCard, directorPageContainer, directorPageRoot, directorSpinner } from "@/app/director/directorUi";
import {
  apiGetDirectorMentoringJourneys,
  type DirectorMentoringJourney,
  type MentoringSession,
} from "@/app/Services/mentoring-sessions.service";

function getStringValue(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function unwrapJourneys(response: any): DirectorMentoringJourney[] {
  const data = response?.data?.data ?? response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.journeys)) return data.journeys;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function personName(person: unknown, fallback: string) {
  if (!person || typeof person !== "object") return fallback;
  const row = person as any;
  return getStringValue(
    row.name,
    row.fullName,
    `${row.firstName || ""} ${row.lastName || ""}`.trim(),
    row.email,
    fallback,
  );
}

function personEmail(person: unknown) {
  return person && typeof person === "object" ? getStringValue((person as any).email) : "";
}

function getSessionStatus(session: MentoringSession) {
  return getStringValue(session.status, "LOCKED").toUpperCase();
}

function statusTone(status: string) {
  if (status === "COMPLETED") return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  if (status === "MISSED") return "border-red-400/30 bg-red-500/15 text-red-100";
  if (status === "SCHEDULED") return "border-[#8ec5eb]/30 bg-[#8ec5eb]/15 text-[#d9ebf8]";
  if (status === "LOCKED") return "border-white/15 bg-white/10 text-white/60";
  return "border-white/15 bg-white/10 text-white/80";
}

function Badge({ status }: { status: string }) {
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTone(status)}`}>{status}</span>;
}

function formatDate(value?: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not scheduled";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCurrentSession(journey: DirectorMentoringJourney) {
  const sessions = [...(journey.sessions || [])].sort(
    (a, b) => Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0),
  );
  return (
    sessions.find((session) => ["MISSED", "SCHEDULED"].includes(getSessionStatus(session))) ||
    sessions.find((session) => getSessionStatus(session) !== "COMPLETED") ||
    sessions[sessions.length - 1]
  );
}

export default function DirectorMentoringSessionNewPage() {
  const [journeys, setJourneys] = useState<DirectorMentoringJourney[]>([]);
  const [expanded, setExpanded] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiGetDirectorMentoringJourneys();
        const rows = unwrapJourneys(response);
        if (!cancelled) setJourneys(rows);
      } catch (err) {
        if (!cancelled) {
          setJourneys([]);
          setError(err instanceof Error ? err.message : "Failed to load mentoring journeys.");
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

  const stats = useMemo(() => {
    const missed = journeys.filter((journey) => String(journey.status || "").toUpperCase() === "MISSED").length;
    const completed = journeys.filter((journey) => String(journey.status || "").toUpperCase() === "COMPLETED").length;
    return { total: journeys.length, missed, completed };
  }, [journeys]);

  return (
    <div className={directorPageRoot}>
      <main className={`${directorPageContainer} flex-1 px-4 py-6 sm:px-6 lg:px-8`}>
        <DirectorHero
          title="Mentoring Sessions"
          subtitle="Read-only backend mentoring journeys across pastors and mentors."
          compact
          pill="Director"
        />

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <div className={`${directorGlassCard} p-5`}>
            <p className="text-sm text-white/50">Journeys</p>
            <p className="mt-2 text-3xl font-bold">{stats.total}</p>
          </div>
          <div className={`${directorGlassCard} p-5`}>
            <p className="text-sm text-white/50">Needs Action</p>
            <p className="mt-2 text-3xl font-bold">{stats.missed}</p>
          </div>
          <div className={`${directorGlassCard} p-5`}>
            <p className="text-sm text-white/50">Completed</p>
            <p className="mt-2 text-3xl font-bold">{stats.completed}</p>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className={directorSpinner} />
          </div>
        ) : error ? (
          <div className={`${directorGlassCard} p-6 text-center text-red-200`}>{error}</div>
        ) : journeys.length === 0 ? (
          <div className={`${directorGlassCard} p-12 text-center text-white/60`}>No mentoring journeys returned yet.</div>
        ) : (
          <section className="space-y-4">
            {journeys.map((journey, index) => {
              const current = getCurrentSession(journey);
              const pastorName = personName(journey.pastor, "Pastor");
              const mentorName = personName(journey.mentor, "Mentor not assigned");
              const currentSessionNumber = journey.currentSessionNumber || current?.sessionNumber || 0;
              const completedCount =
                typeof journey.completedCount === "number"
                  ? journey.completedCount
                  : (journey.sessions || []).filter((session) => getSessionStatus(session) === "COMPLETED").length;
              const status = getStringValue(journey.status, current ? getSessionStatus(current) : "UNKNOWN").toUpperCase();
              const rowKey = getStringValue((journey.pastor as any)?._id, (journey.pastor as any)?.id, personEmail(journey.pastor), `${index}`);
              const open = expanded === rowKey;

              return (
                <article key={rowKey} className={`${directorGlassCard} p-5`}>
                  <button
                    type="button"
                    onClick={() => setExpanded((prev) => (prev === rowKey ? "" : rowKey))}
                    className="w-full text-left"
                  >
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">{pastorName}</p>
                        <p className="mt-1 truncate text-sm text-white/55">{personEmail(journey.pastor) || "Pastor email not available"}</p>
                      </div>
                      <div className="grid gap-3 text-sm text-white/70 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-white/45">Mentor</p>
                          <p className="mt-1 font-semibold text-white">{mentorName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/45">Current Session</p>
                          <p className="mt-1 font-semibold text-white">{currentSessionNumber ? `Session ${currentSessionNumber}` : "Not started"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/45">Scheduled Date</p>
                          <p className="mt-1 font-semibold text-white">{formatDate(current?.scheduledDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/45">Completed</p>
                          <p className="mt-1 font-semibold text-white">{completedCount}/10</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-3 lg:justify-end">
                        <Badge status={status} />
                        <i className={`fa-solid fa-chevron-${open ? "up" : "down"} text-white/50`} />
                      </div>
                    </div>
                  </button>

                  {open ? (
                    <div className="mt-5 border-t border-white/10 pt-5">
                      {(journey.sessions || []).length === 0 ? (
                        <p className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
                          No sessions returned for this journey.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {[...(journey.sessions || [])]
                            .sort((a, b) => Number(a.sessionNumber || 0) - Number(b.sessionNumber || 0))
                            .map((session, sessionIndex) => {
                              const sessionStatus = getSessionStatus(session);
                              const title = getStringValue(session.title, session.mentorNote, `Session ${session.sessionNumber || sessionIndex + 1}`);
                              return (
                                <div
                                  key={getStringValue((session as any)?._id, (session as any)?.id, `${sessionIndex}`)}
                                  className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                                >
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                      <p className="font-semibold text-white">{title}</p>
                                      <p className="mt-1 text-sm text-white/55">
                                        Session {session.sessionNumber || sessionIndex + 1} · {formatDate(session.scheduledDate)}
                                      </p>
                                    </div>
                                    <Badge status={sessionStatus} />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
