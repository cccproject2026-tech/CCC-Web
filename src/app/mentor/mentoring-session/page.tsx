"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import { apiGetMentorshipSessions } from "@/app/Services/roadmaps.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Image from "next/image";
import { parseTranscript, STATIC_SUMMARY, STATIC_TRANSCRIPT } from "./utils/transcript";

type MentoringSession = {
    sessionNumber: number;
    title: string;
    status: "COMPLETED" | "CANCELLED" | "MISSED" | "SCHEDULED";
    scheduledDate: string;
    mentorNote: string;
    pastorNote: string;
    appointmentId: string;
    pastorId: string;
};

type TranscriptSummary = {
    appointmentId: string;
    transcript?: string;
    summary?: string;
    generatedAt?: string;
    model?: string;
    cached?: boolean;
};

type PastorSessions = {
    pastorId: string;
    pastorName: string;
    pastorEmail: string;
    sessions: MentoringSession[];
};

export default function MentorMentoringSessionPage() {
    const [filterStatus, setFilterStatus] = useState("All");
    const [search, setSearch] = useState("");
    const [groupedSessions, setGroupedSessions] = useState<PastorSessions[]>([]);
    const [selectedPastorId, setSelectedPastorId] = useState<string | null>(null);
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

                // Get mentor data from cookie
                const mentorCookie = Cookies.get("mentor");
                if (!mentorCookie) {
                    setError("Mentor information not found");
                    setLoading(false);
                    return;
                }

                const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
                const mentorId = mentorData?.id;

                if (!mentorId) {
                    setError("Mentor ID not found");
                    setLoading(false);
                    return;
                }

                // Fetch assigned users (pastors) details
                const assignedUsersResponse = await apiGetAssignedUsers(mentorId);
                const assignedPastors = assignedUsersResponse.data?.data || [];
                if (!assignedPastors || assignedPastors.length === 0) {
                    setGroupedSessions([]);
                    setLoading(false);
                    return;
                }

                // Fetch sessions for each assigned pastor and group by pastor
                const groupedData: PastorSessions[] = [];
                for (const pastor of assignedPastors) {
                    if (pastor._id) {
                        try {
                            const sessionsResponse = await apiGetMentorshipSessions(pastor._id);
                            const pastorSessions = (sessionsResponse.data || []).map((session: any) => ({
                                ...session,
                                pastorId: pastor._id
                            }));
                            if (pastorSessions.length > 0) {
                                groupedData.push({
                                    pastorId: pastor._id,
                                    pastorName: `${pastor.firstName} ${pastor.lastName}`,
                                    pastorEmail: pastor.email,
                                    sessions: pastorSessions
                                });
                            }
                        } catch (err) {
                            console.error(`Error fetching sessions for pastor ${pastor._id}:`, err);
                        }
                    }
                }
                console.log(groupedData)
                setGroupedSessions(groupedData);
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

    const filteredGroupedSessions = groupedSessions.map(group => ({
        ...group,
        sessions: group.sessions.filter((session) => {
            const statusMatch = filterStatus === "All" ||
                (filterStatus === "Completed" && session.status === "COMPLETED") ||
                (filterStatus === "Missed" && session.status === "MISSED") ||
                (filterStatus === "Cancelled" && session.status === "CANCELLED");

            const searchMatch = session.title.toLowerCase().includes(search.toLowerCase());
            return statusMatch && searchMatch;
        })
    })).filter(group => group.sessions.length > 0);

    // const fetchTranscriptSummary = async (appointmentId: string) => {
    //     // If already fetched, don't fetch again
    //     if (transcripts[appointmentId]) {
    //         return;
    //     }

    //     try {
    //         setTranscriptLoading(prev => ({ ...prev, [appointmentId]: true }));
    //         const response = await apiGenerateTranscriptSummary(appointmentId, false);
    //         const summary = response.data?.data;

    //         setTranscripts(prev => ({
    //             ...prev,
    //             [appointmentId]: summary
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
        if (transcripts[appointmentId]) return;

        try {
            setTranscriptLoading(prev => ({ ...prev, [appointmentId]: true }));

            // 🔴 TEMP STATIC DATA
            setTranscripts(prev => ({
                ...prev,
                [appointmentId]: {
                    appointmentId,
                    transcript: STATIC_TRANSCRIPT,
                    summary: STATIC_SUMMARY,
                    generatedAt: new Date().toISOString(),
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
                    <h1 className="text-2xl font-semibold sm:text-3xl">Mentoring Sessions</h1>
                    <p className="mt-2 text-sm text-[#cde2f2]">
                        Monitor your mentoring appointment history and session details.
                    </p>
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
                ) : error ? (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
                        <i className="fas fa-exclamation-circle mb-3 block text-2xl text-red-400" />
                        <p className="text-red-300">{error}</p>
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
                                                    setExpandedId(null);
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
                                            No assigned pastors
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
                                                            {/* HEADER - CLICKABLE */}
                                                            <button
                                                                onClick={() => handleExpandSession(session.appointmentId)}
                                                                className="w-full px-6 py-4 text-left"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        {/* SESSION INFO */}
                                                                        <div className="flex-1">
                                                                            <h3 className="font-semibold text-base">
                                                                                {session.title}
                                                                            </h3>
                                                                            <p className="mt-1 text-sm text-white/60">
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
                                                                                    <p className="text-sm text-white/50">No transcript available</p>
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

                                                                                    <div className="rounded-xl bg-white/5 p-4 border border-[#8ec5eb]/20">
                                                                                        <h4 className="font-semibold mb-2 text-[#8ec5eb]">Overview</h4>
                                                                                        <p className="text-sm text-white/70">
                                                                                            {transcripts[session.appointmentId].summary?.overview}
                                                                                        </p>
                                                                                    </div>

                                                                                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                                                        <h4 className="font-semibold mb-2">Key Points</h4>
                                                                                        <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                                            {transcripts[session.appointmentId].summary?.keyPoints?.map((item: string, i: number) => (
                                                                                                <li key={i}>{item}</li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>

                                                                                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                                                        <h4 className="font-semibold mb-2">Advice</h4>
                                                                                        <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                                            {transcripts[session.appointmentId].summary?.advice?.map((item: string, i: number) => (
                                                                                                <li key={i}>{item}</li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>

                                                                                    <div className="rounded-xl bg-white/5 p-4 border border-white/10">
                                                                                        <h4 className="font-semibold mb-2">Action Items</h4>
                                                                                        <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                                                                                            {transcripts[session.appointmentId].summary?.actionItems?.map((item: string, i: number) => (
                                                                                                <li key={i}>{item}</li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    </div>

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
                                                                                    <p className="text-sm text-white/50">No summary available</p>
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
