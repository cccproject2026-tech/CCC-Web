"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import { apiGetMentorshipSessionsNormalized } from "@/app/Services/roadmaps.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import SessionProgressHeader from "@/app/Components/mentorship-sessions/SessionProgressHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import { formatSessionTime, getNextSessionId } from "./utils/sessionFlow";
import { useRouter } from "next/navigation";

type MentoringSession = {
    id: string;
    sessionNumber: number;
    title: string;
    status: "COMPLETED" | "CANCELLED" | "SCHEDULED";
    scheduledDate: string;
    mentorNote: string;
    pastorNote: string;
    appointmentId: string;
};

const SESSION_FLOW = [
    {
        phaseName: "Self Revitalization Phase",
        totalSessions: 1,
    },
    {
        phaseName: "Church Empowerment Phase",
        totalSessions: 5,
    },
    {
        phaseName: "Community Revitalization and Multiplication Phase",
        totalSessions: 4,
    }
];

export default function PastorMentoringSessionPage() {
    const router = useRouter();
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [sessions, setSessions] = useState<MentoringSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refetchTick, setRefetchTick] = useState(0);

    useEffect(() => {
        let mounted = true;
        const fetchSessions = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get pastor data from cookie
                const pastorCookie = Cookies.get("user");
                if (!pastorCookie) {
                    setError("Pastor information not found");
                    setLoading(false);
                    return;
                }

                const pastorData = JSON.parse(decodeURIComponent(pastorCookie));
                const pastorId = pastorData?.id;

                if (!pastorId) {
                    setError("Pastor is not found");
                    setLoading(false);
                    return;
                }

                // Fetch sessions for this pastor
                const pastorSessions = await apiGetMentorshipSessionsNormalized(pastorId);
                if (mounted) setSessions(pastorSessions as any as MentoringSession[]);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch mentoring sessions";
                if (mounted) setError(errorMessage);
                console.error("Error fetching mentoring sessions:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchSessions();
        const onFocus = () => setRefetchTick((x) => x + 1);
        window.addEventListener("focus", onFocus);
        return () => {
            mounted = false;
            window.removeEventListener("focus", onFocus);
        };
    }, [refetchTick]);

    const filteredSessions = sessions.filter((session) => {
        if (filterStatus === "Completed") return session.status === "COMPLETED";
        if (filterStatus === "Cancelled") return session.status === "CANCELLED";
        if (filterStatus === "Scheduled") return session.status === "SCHEDULED";
        return true;
    });

    const visible = filteredSessions.filter((s) =>
        s.mentorNote.toLowerCase().includes(search.toLowerCase())
    );

    const getPhaseInfo = (sessionNumber: number) => {
        let currentSession = 0;
        for (const phase of SESSION_FLOW) {
            currentSession += phase.totalSessions;
            if (sessionNumber <= currentSession) {
                return phase.phaseName;
            }
        }
        return "Unknown Phase";
    };

    const sortedSessions = [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber);
    const nextSessionId = getNextSessionId(
        sortedSessions.map((s) => ({ id: s.id, status: s.status as any, scheduledDate: s.scheduledDate })),
    );

    return (
        <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
            <PastorHeader showFullHeader />

            {/* HERO SECTION */}
            <section
                className="relative overflow-hidden bg-cover bg-top px-4 pb-10 pt-4 sm:px-8 lg:px-20"
                style={{ backgroundImage: `url(${HeroBg.src})` }}
            >
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />

                <div className="relative z-10 mx-auto w-full max-w-6xl">
                    <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
                    <p className="mt-2 text-sm text-[#cde2f2]">
                        Monitor your mentoring appointment history and session details.
                    </p>
                </div>
            </section>

            {/* MAIN SECTION */}
            <main className="flex-1 px-4 md:px-20 py-10">
                {/* SEARCH BAR */}
                <div className="mb-6">
                    <div className="relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#8ec5eb]" />
                        <input
                            type="text"
                            placeholder="Search by mentor note..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-white/50 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/25"
                        />
                    </div>
                </div>

                {/* FILTER TABS */}
                <div className="mb-8 flex flex-wrap gap-2">
                    {["All", "Scheduled", "Completed", "Cancelled"].map((status) => (
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
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <div className="mb-4 inline-block">
                                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
                            </div>
                            <p className="text-white/70">Loading mentoring sessions...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                        <i className="fas fa-exclamation-circle mb-3 block text-2xl text-red-400" />
                        <p className="text-red-300">{error}</p>
                    </div>
                ) : visible.length > 0 ? (
                    <div className="space-y-4">
                        <SessionProgressHeader sessions={sortedSessions as any} />
                        {visible.map((session) => (
                            <div
                                key={session.id}
                                className="group rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
                            >
                                <button
                                    onClick={() => router.push(`/pastor/mentoring-session/${encodeURIComponent(session.id)}`)}
                                    className="w-full px-6 py-4 text-left"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* SESSION INFO */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-base">
                                                        {session.mentorNote}
                                                    </h3>
                                                    <span className="text-xs text-white/40">
                                                        Session {session.sessionNumber}
                                                    </span>
                                                    {session.id === nextSessionId ? (
                                                        <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 border border-yellow-400/30">
                                                            Current
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-xs text-white/50 mb-2">
                                                    {getPhaseInfo(session.sessionNumber)}
                                                </p>
                                                <p className="text-sm text-white/60">
                                                    {new Date(session.scheduledDate).toLocaleDateString("en-US", {
                                                        weekday: "short",
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                    })}{" "}
                                                    · {formatSessionTime(session.scheduledDate) || "Time TBD"}
                                                </p>
                                            </div>

                                            {/* STATUS BADGE */}
                                            <SessionStatusBadge status={session.status} compact />
                                        </div>

                                        <i className="fas fa-chevron-right ml-4 text-white/40" />
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
            </main>
        </div>
    );
}
