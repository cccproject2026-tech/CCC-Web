"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import MentorHeader from "@/app/Components/MentorHeader";
import HeroBg from "../../Assets/progress-bg.png";
import {
    apiCompleteMentorshipSession,
    apiGetMentorshipSessions,
    apiGetMentorshipSessionsNormalized,
    apiRedoMentorshipSession,
} from "@/app/Services/roadmaps.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Image from "next/image";
import { parseTranscript, STATIC_SUMMARY, STATIC_TRANSCRIPT } from "./utils/transcript";
import ConfirmModal from "@/app/Components/ui/ConfirmModal";
import { useToast } from "@/app/Components/ui/Toast";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import SessionProgressHeader from "@/app/Components/mentorship-sessions/SessionProgressHeader";
import SessionStatusBadge from "@/app/Components/mentorship-sessions/SessionStatusBadge";
import { apiGenerateTranscriptSummary } from "@/app/Services/appointments.service";
import {
    appointmentPlatformLabel,
    formatMeetingIdForDisplay,
    getAppointmentJoinUrl,
    parseGoogleMeetCodeFromUrl,
    parseZoomMeetingIdFromUrl,
    truncateMiddle,
    zoomUrlHasPasscodeQuery,
} from "@/app/utils/meetingLinkDetails";
import { formatSessionTime, getNextSessionId } from "./utils/sessionFlow";

type MentoringSession = {
    sessionNumber: number;
    title: string;
    status: "COMPLETED" | "CANCELLED" | "MISSED" | "SCHEDULED";
    scheduledDate: string;
    mentorNote: string;
    pastorNote: string;
    appointmentId: string;
    pastorId: string;
    /** optional backend flag (used on mobile pastor detail accordions) */
    isRedo?: boolean;
    meetingLink?: string;
    platform?: string;
};

type TranscriptSummary = {
    appointmentId: string;
    transcript?: string;
    summary?: {
        overview?: string;
        keyPoints?: string[];
        advice?: string[];
        actionItems?: string[];
        nextFocus?: string[];
    };
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
    const toast = useToast();
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
    const [actionLoading, setActionLoading] = useState<Record<string, "complete" | "redo" | null>>({});
    const [confirm, setConfirm] = useState<{ kind: "complete" | "redo"; session: MentoringSession } | null>(null);

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
                            const pastorSessions = (await apiGetMentorshipSessionsNormalized(pastor._id)).map((s) => ({
                                ...s,
                                pastorId: pastor._id,
                            })) as any as MentoringSession[];
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

    const refreshPastorSessions = async (pastorId: string) => {
        const pastorSessions = (await apiGetMentorshipSessionsNormalized(pastorId)).map((s) => ({
            ...s,
            pastorId,
        })) as any as MentoringSession[];
        setGroupedSessions((prev) =>
            prev.map((g) => (g.pastorId === pastorId ? { ...g, sessions: pastorSessions } : g)),
        );
    };

    const withActionLoading = async (
        appointmentId: string,
        kind: "complete" | "redo",
        fn: () => Promise<void>,
    ) => {
        setActionLoading((prev) => ({ ...prev, [appointmentId]: kind }));
        try {
            await fn();
        } finally {
            setActionLoading((prev) => ({ ...prev, [appointmentId]: null }));
        }
    };

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

            const res = await apiGenerateTranscriptSummary(appointmentId, false);
            const data = res.data?.data ?? res.data;
            setTranscripts(prev => ({
                ...prev,
                [appointmentId]: {
                    appointmentId,
                    transcript: data?.transcript ?? STATIC_TRANSCRIPT,
                    summary: data?.summary ?? STATIC_SUMMARY,
                    generatedAt: data?.generatedAt ?? new Date().toISOString(),
                    model: data?.model,
                    cached: !!data?.cached,
                }
            }));

        } catch (err) {
            toast.show({ kind: "error", title: "Failed to load transcript", subtitle: extractApiErrorMessage(err) });
            setTranscripts(prev => ({
                ...prev,
                [appointmentId]: {
                    appointmentId,
                    transcript: STATIC_TRANSCRIPT,
                    summary: STATIC_SUMMARY,
                    cached: true
                }
            }));
        } finally {
            setTranscriptLoading(prev => ({ ...prev, [appointmentId]: false }));
        }
    };

    const handleExpandSession = (appointmentId: string, maybeFetchForAppointmentId?: string) => {
        if (expandedId === appointmentId) {
            setExpandedId(null);
        } else {
            setExpandedId(appointmentId);
            // Fetch transcript when expanding
            if (maybeFetchForAppointmentId) fetchTranscriptSummary(maybeFetchForAppointmentId);
        }
    };

    const selectedGroup = selectedPastorId ? groupedSessions.find(g => g.pastorId === selectedPastorId) : undefined;
    const sessionsForPastor = selectedGroup?.sessions ?? [];
    const sortedSessions = [...sessionsForPastor].sort((a, b) => a.sessionNumber - b.sessionNumber);
    const nextSessionId = getNextSessionId(
        sortedSessions.map((s) => ({ id: s.appointmentId ?? `${s.sessionNumber}`, status: s.status, scheduledDate: s.scheduledDate })),
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
                <ConfirmModal
                    open={!!confirm}
                    kind={confirm?.kind ?? "complete"}
                    title={confirm?.kind === "redo" ? "Redo this session?" : "Complete this session?"}
                    body={confirm?.kind === "redo"
                        ? "This marks the session for redo. You can continue when ready."
                        : "Mark this session as completed? This cannot be undone from here."}
                    confirmText={confirm?.kind === "redo" ? "Redo" : "Complete"}
                    onCancel={() => setConfirm(null)}
                    onConfirm={async () => {
                        if (!confirm) return;
                        const { kind, session } = confirm;
                        setConfirm(null);
                        const apptId = session.appointmentId;
                        if (!apptId) {
                            toast.show({ kind: "error", title: "Missing appointment ID" });
                            return;
                        }
                        if (kind === "complete") {
                            await withActionLoading(apptId, "complete", async () => {
                                await apiCompleteMentorshipSession(apptId);
                                toast.show({ kind: "success", title: "Session completed" });
                                await refreshPastorSessions(session.pastorId);
                            }).catch((err) => {
                                toast.show({ kind: "error", title: "Cannot complete session", subtitle: extractApiErrorMessage(err) });
                            });
                        } else {
                            await withActionLoading(apptId, "redo", async () => {
                                await apiRedoMentorshipSession(apptId);
                                toast.show({ kind: "success", title: "Redo scheduled" });
                                setExpandedId(null);
                                await refreshPastorSessions(session.pastorId);
                            }).catch((err) => {
                                toast.show({ kind: "error", title: "Cannot redo session", subtitle: extractApiErrorMessage(err) });
                            });
                        }
                    }}
                    busy={false}
                />

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

                                            {/* PROGRESS HEADER (Mobile parity) */}
                                            <SessionProgressHeader sessions={sortedSessions.map((s) => ({ ...s, id: s.appointmentId ?? `${s.sessionNumber}` })) as any} />

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
                                                                onClick={() => handleExpandSession(session.appointmentId, session.appointmentId)}
                                                                className="w-full px-6 py-4 text-left"
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-4 flex-1">
                                                                        {/* SESSION INFO */}
                                                                        <div className="flex-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <h3 className="font-semibold text-base">
                                                                                    {session.title}
                                                                                </h3>
                                                                                {session.isRedo ? (
                                                                                    <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-400/30">
                                                                                        Redo
                                                                                    </span>
                                                                                ) : null}
                                                                                {(session.appointmentId ?? `${session.sessionNumber}`) === nextSessionId ? (
                                                                                    <span className="rounded-md bg-yellow-500/20 px-2 py-0.5 text-[10px] font-bold text-yellow-200 border border-yellow-400/30">
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
                                                                                at {new Date(session.scheduledDate).toLocaleTimeString("en-US", {
                                                                                    hour: "2-digit",
                                                                                    minute: "2-digit",
                                                                                    hour12: true
                                                                                })}
                                                                            </p>
                                                                        </div>

                                                                        {/* STATUS BADGE */}
                                                                        <SessionStatusBadge status={session.status} compact />
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
                                                                    {/* ACTIONS (Mobile parity) */}
                                                                    <div className="mb-6 flex flex-wrap gap-3">
                                                                        <button
                                                                            onClick={async () => {
                                                                                setConfirm({ kind: "complete", session });
                                                                            }}
                                                                            disabled={session.status === "COMPLETED" || actionLoading[session.appointmentId] != null}
                                                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition border ${session.status === "COMPLETED"
                                                                                ? "bg-white/5 text-white/40 border-white/10 cursor-not-allowed"
                                                                                : "bg-green-500/20 text-green-200 border-green-400/30 hover:bg-green-500/25"
                                                                                } ${actionLoading[session.appointmentId] != null ? "opacity-60 cursor-not-allowed" : ""}`}
                                                                        >
                                                                            {actionLoading[session.appointmentId] === "complete" ? (
                                                                                <>
                                                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-transparent" />
                                                                                    Completing...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <i className="fas fa-check" />
                                                                                    {session.status === "COMPLETED" ? "Completed" : "Mark as Completed"}
                                                                                </>
                                                                            )}
                                                                        </button>

                                                                        <button
                                                                            onClick={async () => {
                                                                                setConfirm({ kind: "redo", session });
                                                                            }}
                                                                            disabled={actionLoading[session.appointmentId] != null}
                                                                            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition border bg-white/5 text-white/80 border-white/15 hover:bg-white/10 ${actionLoading[session.appointmentId] != null ? "opacity-60 cursor-not-allowed" : ""}`}
                                                                        >
                                                                            {actionLoading[session.appointmentId] === "redo" ? (
                                                                                <>
                                                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/70 border-t-transparent" />
                                                                                    Scheduling...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <i className="fas fa-rotate-right" />
                                                                                    Schedule Repeat Session
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    </div>

                                                                    {/* JOIN MEETING (Mobile parity) */}
                                                                    {(() => {
                                                                        const meetingLink = session.meetingLink || (session.platform ? getAppointmentJoinUrl({ meetingLink: session.meetingLink, platform: session.platform } as any) : null);
                                                                        const link = meetingLink?.trim() || "";
                                                                        if (!link) return null;
                                                                        const platform = (session.platform || "zoom") as any;
                                                                        const zoomId = platform === "zoom" ? parseZoomMeetingIdFromUrl(link) : undefined;
                                                                        const meetCode = platform === "google-meet" ? parseGoogleMeetCodeFromUrl(link) : undefined;
                                                                        const hasZoomPasscode = platform === "zoom" && zoomUrlHasPasscodeQuery(link);
                                                                        return (
                                                                            <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                                                                                <div className="text-xs font-semibold text-white/60 mb-2">Meeting details</div>
                                                                                <div className="space-y-2 text-sm">
                                                                                    <div className="flex justify-between gap-3">
                                                                                        <span className="text-white/60">Platform</span>
                                                                                        <span className="text-white/90">{appointmentPlatformLabel(platform)}</span>
                                                                                    </div>
                                                                                    {zoomId ? (
                                                                                        <div className="flex justify-between gap-3">
                                                                                            <span className="text-white/60">Meeting ID</span>
                                                                                            <span className="text-white/90 font-mono">{formatMeetingIdForDisplay(zoomId)}</span>
                                                                                        </div>
                                                                                    ) : null}
                                                                                    {meetCode ? (
                                                                                        <div className="flex justify-between gap-3">
                                                                                            <span className="text-white/60">Meet code</span>
                                                                                            <span className="text-white/90 font-mono">{meetCode}</span>
                                                                                        </div>
                                                                                    ) : null}
                                                                                    {hasZoomPasscode ? (
                                                                                        <div className="text-xs text-white/50">Passcode included — will be applied automatically</div>
                                                                                    ) : null}
                                                                                    <div className="flex items-start justify-between gap-3">
                                                                                        <span className="text-white/60">Link</span>
                                                                                        <span className="text-white/80 break-all text-right">{truncateMiddle(link, 56)}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                                                                                    className="mt-3 w-full rounded-xl bg-white text-[#062946] py-2 font-semibold hover:bg-white/90"
                                                                                >
                                                                                    Join meeting
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })()}

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
