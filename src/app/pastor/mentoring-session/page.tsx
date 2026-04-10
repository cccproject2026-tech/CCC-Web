"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import { apiGetMentorshipSessions } from "@/app/Services/roadmaps.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { parseTranscript, STATIC_SUMMARY, STATIC_TRANSCRIPT } from "./utils/transcript";

type MentoringSession = {
    sessionNumber: number;
    title: string;
    status: "COMPLETED" | "CANCELLED" | "SCHEDULED";
    scheduledDate: string;
    mentorNote: string;
    pastorNote: string;
    appointmentId: string;
};

type TranscriptSummary = {
    appointmentId: string;
    transcript?: string;
    summary?: string;
    generatedAt?: string;
    model?: string;
    cached?: boolean;
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
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [sessions, setSessions] = useState<MentoringSession[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<Record<string, TranscriptSummary>>({});
    const [transcriptLoading, setTranscriptLoading] = useState<Record<string, boolean>>({});
    const [activeTab, setActiveTab] = useState<"transcript" | "summary">("transcript");

    useEffect(() => {
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
                const sessionsResponse = await apiGetMentorshipSessions(pastorId);
                const pastorSessions = sessionsResponse.data || [];
                console.log("first", pastorSessions)
                setSessions(pastorSessions);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to fetch mentoring sessions";
                setError(errorMessage);
                console.error("Error fetching mentoring sessions:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

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

    // const fetchTranscriptSummary = async (appointmentId: string) => {
    //     // If already fetched, don't fetch again
    //     if (transcripts[appointmentId]) {
    //         return;
    //     }

    //     try {
    //         setTranscriptLoading(prev => ({ ...prev, [appointmentId]: true }));
    //         const response = await apiGenerateTranscriptSummary(appointmentId, false);
    //         const summary = response.data;

    //         if (!summary) {
    //             console.warn("Transcript API returned empty. Using static fallback.");
    //         }

    //         setTranscripts(prev => ({
    //             ...prev,
    //             [appointmentId]: summary ?? {
    //                 appointmentId,
    //                 transcript: STATIC_TRANSCRIPT,
    //                 summary: STATIC_SUMMARY
    //             }
    //         }));
    //     } catch (err) {
    //         console.error(`Error fetching transcript for appointment ${appointmentId}:`, err);
    //         setTranscripts(prev => ({
    //             ...prev,
    //             [appointmentId]: {
    //                 appointmentId,
    //                 summary: "Failed to load transcript summary"
    //             }
    //         }));
    //     } finally {
    //         setTranscriptLoading(prev => ({ ...prev, [appointmentId]: false }));
    //     }
    // };

    const fetchTranscriptSummary = async (appointmentId: string) => {
        // Prevent refetch
        if (transcripts[appointmentId]) return;

        try {
            setTranscriptLoading(prev => ({ ...prev, [appointmentId]: true }));

            setTranscripts(prev => ({
                ...prev,
                [appointmentId]: {
                    appointmentId,
                    transcript: STATIC_TRANSCRIPT,
                    summary: STATIC_SUMMARY,
                    cached: true
                }
            }));

        } catch (err) {
            console.error(`Static transcript load failed for ${appointmentId}`, err);
        } finally {
            setTranscriptLoading(prev => ({ ...prev, [appointmentId]: false }));
        }
    };

    const handleExpandSession = (appointmentId: string) => {
        if (expandedId === appointmentId) {
            setExpandedId(null);
        } else {
            setExpandedId(appointmentId);
            // Fetch transcript when expanding
            fetchTranscriptSummary(appointmentId);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35";
            case "CANCELLED":
                return "bg-red-500/25 text-red-300 border border-red-400/35";
            case "MISSED":
                return "bg-yellow-500/25 text-yellow-300 border border-yellow-400/35";
            case "SCHEDULED":
                return "bg-blue-500/25 text-blue-300 border border-blue-400/35";
            default:
                return "bg-white/10 text-white/70";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "COMPLETED":
                return "fas fa-check-circle text-green-600";
            case "CANCELLED":
                return "fas fa-times-circle text-red-600";
            case "MISSED":
                return "fas fa-exclamation-circle text-yellow-600";
            case "SCHEDULED":
                return "fas fa-calendar text-blue-600";
            default:
                return "fas fa-circle text-gray-600";
        }
    };

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
                        {visible.map((session) => (
                            <div
                                key={session.appointmentId}
                                className="group rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm transition hover:border-[#8ec5eb]/30 hover:bg-white/10"
                            >
                                {/* HEADER - CLICKABLE */}
                                <button
                                    onClick={() => handleExpandSession(session.appointmentId)}
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
                                                    at {new Date(session.scheduledDate).toLocaleTimeString("en-US", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    })}
                                                </p>
                                            </div>

                                            {/* STATUS BADGE */}
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                                {session.status.charAt(0).toUpperCase() + session.status.slice(1).toLowerCase()}
                                            </span>
                                        </div>

                                        {/* EXPAND ARROW */}
                                        <i
                                            className={`fas fa-chevron-down ml-4 text-[#8ec5eb] transition ${expandedId === session.appointmentId ? "rotate-180" : ""
                                                }`}
                                        />
                                    </div>
                                </button>

                                {/* EXPANDED DETAILS */}
                                {expandedId === session.appointmentId && (
                                    <div className="border-t border-white/10 px-6 py-4">
                                        {/* TAB BUTTONS */}
                                        <div className="flex gap-3 mb-6 border-b border-white/10 pb-3">
                                            <button
                                                onClick={() => setActiveTab("transcript")}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "transcript"
                                                    ? "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35"
                                                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                                    }`}
                                            >
                                                <i className="fas fa-file-alt mr-2"></i>Transcript
                                            </button>
                                            <button
                                                onClick={() => setActiveTab("summary")}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === "summary"
                                                    ? "bg-[#8ec5eb]/25 text-[#8ec5eb] border border-[#8ec5eb]/35"
                                                    : "bg-white/5 text-white/70 border border-white/10 hover:bg-white/10"
                                                    }`}
                                            >
                                                <i className="fas fa-list-check mr-2"></i>Summary
                                            </button>
                                        </div>

                                        {/* TRANSCRIPT TAB */}
                                        {activeTab === "transcript" && (
                                            <div>
                                                {transcriptLoading[session.appointmentId] ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8ec5eb] border-t-transparent"></div>
                                                    </div>
                                                ) : transcripts[session.appointmentId]?.transcript ? (
                                                    <div className="space-y-4">
                                                        {parseTranscript(transcripts[session.appointmentId].transcript || "").map((msg: any) => (
                                                            <div
                                                                key={msg.id}
                                                                className={`flex ${msg.isMentor ? "justify-start" : "justify-end"}`}
                                                            >
                                                                <div
                                                                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-md
                            ${msg.isMentor
                                                                            ? "bg-[#0f3b5f] text-white border border-[#8ec5eb]/30"
                                                                            : "bg-[#8ec5eb] text-[#062946]"
                                                                        }`}
                                                                >
                                                                    <p className="text-xs font-semibold mb-1 opacity-70">
                                                                        {msg.speaker}
                                                                    </p>
                                                                    <p className="leading-relaxed whitespace-pre-wrap">
                                                                        {msg.message}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg bg-white/5 p-4 border border-white/10 text-center">
                                                        <p className="text-sm text-white/50">
                                                            No transcript available
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* SUMMARY TAB */}
                                        {activeTab === "summary" && (
                                            <div>
                                                {transcriptLoading[session.appointmentId] ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#8ec5eb] border-t-transparent"></div>
                                                    </div>
                                                ) : transcripts[session.appointmentId]?.summary ? (
                                                    <div className="space-y-6">

                                                        {/* Overview */}
                                                        <div className="rounded-xl bg-white/5 p-4 border border-[#8ec5eb]/20">
                                                            <h4 className="font-semibold mb-2 text-[#8ec5eb]">Overview</h4>
                                                            <p className="text-sm text-white/70">
                                                                {transcripts[session.appointmentId].summary?.overview}
                                                            </p>
                                                        </div>

                                                        {/* Key Points */}
                                                        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                            <h4 className="font-semibold mb-2">Key Points</h4>
                                                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                {transcripts[session.appointmentId].summary?.keyPoints?.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Advice */}
                                                        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                            <h4 className="font-semibold mb-2">Advice</h4>
                                                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                {transcripts[session.appointmentId].summary?.advice?.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Action Items */}
                                                        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                            <h4 className="font-semibold mb-2">Action Items</h4>
                                                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                {transcripts[session.appointmentId].summary?.actionItems?.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {/* Next Focus */}
                                                        <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                            <h4 className="font-semibold mb-2">Next Focus</h4>
                                                            <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                {transcripts[session.appointmentId].summary?.nextFocus?.map((item: string, i: number) => (
                                                                    <li key={i}>{item}</li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                    </div>
                                                ) : (
                                                    <div className="rounded-lg bg-white/5 p-4 border border-white/10 text-center">
                                                        <p className="text-sm text-white/50">
                                                            No summary available
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
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
