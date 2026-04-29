"use client";
import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import SessionProgressHeader from "@/app/Components/mentorship-sessions/SessionProgressHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import { formatSessionTime, getNextSessionId } from "./utils/sessionFlow";
import { useRouter, useSearchParams } from "next/navigation";
import { useMentorGroupedSessionsQuery, type MentorSession } from "./hooks/useMentorshipQueries";

export default function MentorMentoringSessionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pastorIdFromQuery = searchParams.get("pastorId") || "";
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [selectedPastorId, setSelectedPastorId] = useState<string | null>(null);
    const { data: groupedSessions = [], isLoading: loading, error } = useMentorGroupedSessionsQuery();

    const groupedError = error instanceof Error ? error.message : null;

    useEffect(() => {
        if (!groupedSessions.length) return;

        // Mobile-like: if we navigated back after an action, preserve pastor context via query param.
        if (pastorIdFromQuery && groupedSessions.some((g) => g.pastorId === pastorIdFromQuery)) {
            setSelectedPastorId(pastorIdFromQuery);
            return;
        }

        // If nothing selected (first load), auto-select the first pastor with sessions.
        setSelectedPastorId((prev) => (prev && groupedSessions.some((g) => g.pastorId === prev) ? prev : groupedSessions[0].pastorId));
    }, [groupedSessions, pastorIdFromQuery]);

    const handleViewDetails = (session: MentorSession) => {
        router.push(`/mentor/mentoring-session/${encodeURIComponent(session.id)}?pastorId=${encodeURIComponent(session.pastorId)}`);
    };

    const selectedGroup = selectedPastorId ? groupedSessions.find(g => g.pastorId === selectedPastorId) : undefined;
    const sessionsForPastor = selectedGroup?.sessions ?? [];
    const sortedSessions = useMemo(() => [...sessionsForPastor].sort((a, b) => a.sessionNumber - b.sessionNumber), [sessionsForPastor]);
    const nextSessionId = getNextSessionId(
        sortedSessions.map((s) => ({ id: s.id, status: s.status, scheduledDate: s.scheduledDate })),
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
            <MentorHeader showFullHeader />

            {/* HERO SECTION */}
            <section
                className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

                <div className="relative z-10 mx-auto w-full max-w-6xl">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
                            <p className="mt-2 text-sm text-[#cde2f2]">
                                Monitor your mentoring appointment history and session details.
                            </p>
                        </div>
                        <a
                            href="/mentor/mentoring-session/insights"
                            className="mt-1 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
                        >
                            <i className="fas fa-chart-line" />
                            Insights
                        </a>
                    </div>
                </div>
            </section>

            {/* MAIN SECTION - TWO PANEL LAYOUT */}
            <main className="flex-1 px-4 md:px-20 py-10">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="mb-4 inline-block">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
                            </div>
                            <p className="text-white/70">Loading mentoring sessions...</p>
                        </div>
                    </div>
                ) : groupedError ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                        <i className="fas fa-exclamation-circle mb-3 block text-2xl text-red-400" />
                        <p className="text-red-300">{groupedError}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* LEFT PANEL - PASTOR LIST */}
                        <div className="lg:col-span-1">
                            <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
                                <h2 className="text-lg font-semibold text-[#8ec5eb] mb-4">
                                    Assigned Pastors
                                </h2>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                    {groupedSessions.length > 0 ? (
                                        groupedSessions.map((group) => (
                                            <button
                                                key={group.pastorId}
                                                onClick={() => {
                                                    setSelectedPastorId(group.pastorId);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition border ${selectedPastorId === group.pastorId
                                                    ? "bg-[#8ec5eb]/25 border-[#8ec5eb]/35 text-white"
                                                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-sm">{group.pastorName}</p>
                                                        <p className="text-xs text-white/50 mt-1 truncate">
                                                            {group.pastorEmail}
                                                        </p>
                                                    </div>
                                                    <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#8ec5eb]/30 text-xs font-semibold">
                                                        {group.sessions.length}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-sm text-white/50 text-center py-6">
                                            No mentoring sessions yet
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT PANEL - SESSION HISTORY */}
                        <div className="lg:col-span-2">
                            {selectedPastorId ? (
                                (() => {
                                    const selectedGroup = groupedSessions.find(g => g.pastorId === selectedPastorId);
                                    if (!selectedGroup) return null;

                                    const filteredSessions = selectedGroup.sessions.filter((session) => {
                                        const statusMatch = filterStatus === "All" ||
                                            (filterStatus === "Scheduled" && session.status === "SCHEDULED") ||
                                            (filterStatus === "Completed" && session.status === "COMPLETED") ||
                                            (filterStatus === "Missed" && session.status === "MISSED") ||
                                            (filterStatus === "Cancelled" && session.status === "CANCELLED");

                                        const searchMatch = session.title.toLowerCase().includes(search.toLowerCase());
                                        return statusMatch && searchMatch;
                                    });

                                    return (
                                        <div>
                                            {/* HEADER WITH PASTOR INFO */}
                                            <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-6">
                                                <h2 className="text-xl font-semibold text-[#8ec5eb] mb-2">
                                                    {selectedGroup.pastorName}
                                                </h2>
                                                <p className="text-sm text-white/60 mb-1">{selectedGroup.pastorEmail}</p>
                                                <p className="text-xs text-white/50">
                                                    Session History ({filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''})
                                                </p>
                                            </div>

                                            {/* PROGRESS HEADER (Mobile parity) */}
                                            <SessionProgressHeader sessions={sortedSessions as any} />

                                            {/* SEARCH BAR */}
                                            <div className="mb-6">
                                                <div className="relative">
                                                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#8ec5eb]" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search by session title..."
                                                        value={search}
                                                        onChange={(e) => setSearch(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/25"
                                                    />
                                                </div>
                                            </div>

                                            {/* FILTER TABS */}
                                            <div className="mb-8 flex flex-wrap gap-2">
                                                {["All", "Scheduled", "Completed", "Missed", "Cancelled"].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => setFilterStatus(status)}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium transition ${filterStatus === status
                                                            ? "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35"
                                                            : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                                            }`}
                                                    >
                                                        {status}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* SESSIONS LIST */}
                                            {filteredSessions.length > 0 ? (
                                                <div className="space-y-4">
                                                    {filteredSessions.map((session) => (
                                                        <div
                                                            key={session.appointmentId}
                                                            className="group rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
                                                        >
                                                            <button onClick={() => handleViewDetails(session)} className="w-full px-6 py-4 text-left">
                                                                <div className="flex items-center justify-between gap-4">
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <h3 className="truncate font-semibold text-base">{session.title}</h3>
                                                                            {session.id === nextSessionId ? (
                                                                                <span className="shrink-0 rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 border border-yellow-400/30">
                                                                                    Current
                                                                                </span>
                                                                            ) : null}
                                                                        </div>
                                                                        <p className="mt-1 text-sm text-white/60">
                                                                            {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                                                                weekday: "short",
                                                                                year: "numeric",
                                                                                month: "short",
                                                                                day: "numeric",
                                                                            })}{" "}
                                                                            · {formatSessionTime(session.scheduledDate) || "Time TBD"}
                                                                        </p>
                                                                    </div>
                                                                    <div className="shrink-0 flex items-center gap-3">
                                                                        <SessionStatusBadge status={session.status} compact />
                                                                        <i className="fas fa-chevron-right text-white/40" />
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-white/10 bg-white/5 py-12 text-center">
                                                    <i className="fas fa-inbox mb-4 block text-3xl text-white/40" />
                                                    <p className="text-sm text-white/60">
                                                        No mentoring sessions found
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            ) : (
                                <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-12 text-center">
                                    <i className="fas fa-arrow-left mb-4 block text-4xl text-white/40" />
                                    <p className="text-sm text-white/60">
                                        Select a pastor from the list to view their session history
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
