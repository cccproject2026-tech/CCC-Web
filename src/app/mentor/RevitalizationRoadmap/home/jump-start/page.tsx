"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import UserProfile from "@/app/Assets/user-profile.png";
import {
  apiAddComment,
  apiGetComments,
  apiGetExtras,
  apiGetQueries,
  apiGetRoadmapById,
  apiReplyToQuery,
} from "@/app/Services/roadmaps.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { deriveTaskStatusForList, unwrapProgressData, type RoadmapAssignmentUi } from "@/app/Services/roadmap-assignments";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";
import { getMentorUserId } from "@/app/utils/mentor-auth";
import { verifyMentorPastorAccess } from "@/app/utils/mentor-pastor-link";

function JumpStartPageContent() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const [queryTab, setQueryTab] = useState("Pending");
  const [queryAnswers, setQueryAnswers] = useState<{ [key: string]: string }>({});
  const [commentSaving, setCommentSaving] = useState(false);
  const [querySaving, setQuerySaving] = useState(false);

  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const roadmapId = searchParams.get("roadmapId");

  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [extrasRows, setExtrasRows] = useState<any[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(false);
  const [progressData, setProgressData] = useState<any>(null);

  function formatDate(iso?: string) {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString();
    } catch {
      return String(iso);
    }
  }

  function unwrapCommentsFromResponse(res: { data?: unknown }): any[] {
    const body = res?.data as any;
    const thread = body?.data ?? body;
    if (thread && typeof thread === "object" && !Array.isArray(thread) && "comments" in thread) {
      return Array.isArray(thread.comments) ? thread.comments : [];
    }
    return Array.isArray(thread) ? thread : [];
  }

  function unwrapQueriesFromResponse(res: { data?: unknown }): any[] {
    const body = res?.data as any;
    const root = body?.data ?? body;
    const threads = Array.isArray(root) ? root : root ? [root] : [];
    return threads.flatMap((t: any) => (Array.isArray(t?.queries) ? t.queries : []));
  }

  function isRenderablePastorExtraRow(item: Record<string, unknown>): boolean {
    const t = String(item.type ?? "").toUpperCase();
    return t !== "" && t !== "JUMPSTART_COMPLETE";
  }

  function formatStatusLabel(status: RoadmapAssignmentUi["status"]): string {
    return status === "In-progress" ? "In Progress" : status;
  }

  function heroStatusColor(status: RoadmapAssignmentUi["status"]): "green" | "orange" | "red" | "blue" {
    if (status === "Completed") return "green";
    if (status === "Due") return "red";
    if (status === "In-progress") return "orange";
    return "blue";
  }

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setUser(null);
          return;
        }
        setAccessError(null);
        const res = await apiGetUserById(userId);
        setUser(res.data?.data || res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, [userId]);

  const userName = user ? `${user.firstName} ${user.lastName}` : "Loading...";

  useEffect(() => {
    if (!roadmapId) return;

    const fetchData = async () => {
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setRoadmap(null);
          return;
        }
        setAccessError(null);

        const roadmapRes = await apiGetRoadmapById(roadmapId);

        setRoadmap(roadmapRes.data?.data);

        await Promise.allSettled([
          fetchComments(),
          fetchQueries(),
          fetchExtras(),
          fetchProgress(),
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [roadmapId, userId, queryTab]);

  const fetchComments = async () => {
    try {
      if (!roadmapId || !userId) return;

      const res = await apiGetComments(roadmapId, userId);

      setComments(unwrapCommentsFromResponse(res));

    } catch (err) {
      console.error("Comments API missing or failing");
      setComments([]);
    }
  };

  const fetchQueries = async () => {
    try {
      if (!roadmapId || !userId) return;

      const status = queryTab === "Pending" ? "pending" : "answered";
      const res = await apiGetQueries(roadmapId, userId, status);

      setQueries(unwrapQueriesFromResponse(res));
    } catch (err) {
      console.error("Failed to fetch queries", err);
      setQueries([]);
    }
  };

  const fetchExtras = async () => {
    try {
      if (!roadmapId || !userId) return;
      setExtrasLoading(true);
      const res = await apiGetExtras(roadmapId, userId);
      const data = (res.data as { data?: unknown })?.data ?? res.data;
      const rows = (data as { extras?: unknown })?.extras;
      setExtrasRows(Array.isArray(rows) ? rows : []);
    } catch (err) {
      console.error("Failed to fetch mentor jump-start extras", err);
      setExtrasRows([]);
    } finally {
      setExtrasLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      if (!userId) return;
      const res = await apiGetUserProgress(userId);
      setProgressData(unwrapProgressData(res));
    } catch (err) {
      console.error("Failed to fetch mentor jump-start progress", err);
      setProgressData(null);
    }
  };

  const handleSendComment = async () => {

    if (!newComment.trim()) return;

    if (!roadmapId || !userId) return;

    try {
      const mentorId = getMentorUserId();
      if (!mentorId) {
        console.warn("No mentor session; cannot post comment.");
        return;
      }
      setCommentSaving(true);

      await apiAddComment(roadmapId, {
        text: newComment.trim(),
        userId,
        mentorId,
      });

      setNewComment("");

      await fetchComments();
      console.debug("[mentor/jump-start] comment posted", { roadmapId, userId });

    } catch (err) {
      console.error("Failed to add comment", err);
    } finally {
      setCommentSaving(false);
    }
  };

  const handleSendAnswer = async (queryId: string) => {

    const answer = queryAnswers[queryId];

    if (!answer?.trim()) return;

    if (!roadmapId || !userId) return;

    try {
      const mentorId = getMentorUserId();
      if (!mentorId) {
        console.warn("No mentor session; cannot reply.");
        return;
      }
      setQuerySaving(true);

      await apiReplyToQuery(roadmapId, queryId, {
        repliedAnswer: answer.trim(),
        repliedMentorId: mentorId,
      });

      setQueryAnswers(prev => ({
        ...prev,
        [queryId]: ""
      }));

      await fetchQueries();
      console.debug("[mentor/jump-start] query replied", { roadmapId, userId, queryId });

    } catch (err) {
      console.error("Failed to reply query", err);
    } finally {
      setQuerySaving(false);
    }

  };

  const handleAnswerChange = (queryId: string, value: string) => {

    setQueryAnswers(prev => ({
      ...prev,
      [queryId]: value
    }));

  };

  const descriptionPoints = roadmap?.roadmaps || [];
  const derivedStatus: RoadmapAssignmentUi["status"] = roadmapId
    ? deriveTaskStatusForList(progressData, {
        parentRoadmapId: roadmapId,
        taskId: roadmapId,
        itemStatus: roadmap?.status,
        endDate: roadmap?.endDate ?? roadmap?.dueDate,
      })
    : "Not Started";
  const progressRow = Array.isArray(progressData?.roadmaps)
    ? progressData.roadmaps.find((row: any) => String(row?.roadMapId ?? "").trim() === String(roadmapId ?? "").trim())
    : null;
  const completionTime = roadmap?.duration ? `Months ${roadmap.duration}` : undefined;
  const commentBadgeCount = comments.length;
  const queryBadgeCount = queries.length;

  if (loading) {
    return <div className="text-white p-10">Loading roadmap...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <MentorHeader showFullHeader={true} />
      <JumpStartHero
        backgroundImageUrl={JumpStartBg.src}
        title={roadmap?.name}
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/mentor/RevitalizationRoadmap",
          },
          { label: userName, href: `/mentor/RevitalizationRoadmap/home?userId=${userId}` },
          {
            label: "Revitalization Roadmap",
            href: `/mentor/RevitalizationRoadmap/home?userId=${userId}`,
          },
          { label: roadmap?.name },
        ]}
        status={{ label: formatStatusLabel(derivedStatus), color: heroStatusColor(derivedStatus) }}
        completionTime={completionTime}
        heightClasses="h-[280px]"
      />

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="w-full">
          {accessError ? (
            <div className="mb-6 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              {accessError}
            </div>
          ) : null}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column - Module Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-[#2E3B8E] text-white px-6 py-4 font-bold">
                  Over View
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() => setActiveTab("overview")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${activeTab === "overview"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    Over View
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${activeTab === "comments"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <span>Comments</span>
                    <span className="bg-blue-100 text-[#2E3B8E] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {commentBadgeCount}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("queries")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${activeTab === "queries"
                      ? "bg-[#2E3B8E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    <span>Queries</span>
                    <span className="bg-blue-100 text-[#2E3B8E] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {queryBadgeCount}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="lg:col-span-3">
              {activeTab === "overview" && (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-white text-2xl font-bold">Over View</h2>
                    <button className="text-white hover:text-white/80 transition-all">
                      <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/20 mb-6"></div>

                  {/* Roadmap Section */}
                  <div className="mb-6">
                    <label className="block text-white font-bold text-sm mb-2">
                      Roadmap
                    </label>
                    <input
                      type="text"
                      value={roadmap?.roadMapDetails || ""}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-white/10 focus:outline-none focus:border-white/50 placeholder-white/50"
                    />
                  </div>

                  {/* Description Section */}
                  <div className="mb-6">
                    <label className="block text-white font-bold text-sm mb-4">
                      Description
                    </label>
                    <ol className="space-y-2 list-decimal list-inside">
                      {descriptionPoints.map((step: any) => (
                        <li key={step._id}>
                          {step.name || step.description}
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="mb-6">
                    <label className="block text-white font-bold text-sm mb-4">
                      Pastor Response
                    </label>
                    {extrasLoading ? (
                      <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-6 text-white/80">
                        Loading responses...
                      </div>
                    ) : extrasRows.filter(isRenderablePastorExtraRow).length === 0 ? (
                      <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-6 text-white/80">
                        No responses submitted yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {extrasRows.filter(isRenderablePastorExtraRow).map((item: any, idx: number) => {
                          const label = String(item.name ?? item.key ?? `Item ${idx + 1}`);
                          const value =
                            item.signatureData !== undefined
                              ? item.signatureData
                              : item.value !== undefined
                                ? item.value
                                : "";
                          const rendered =
                            typeof value === "object" ? JSON.stringify(value, null, 2) : String(value || "");
                          return (
                            <div
                              key={`${label}-${idx}`}
                              className="rounded-lg border border-white/20 bg-white/10 px-4 py-3"
                            >
                              <p className="text-xs font-bold uppercase tracking-wide text-white/70">{label}</p>
                              <p className="mt-2 whitespace-pre-wrap text-sm text-white">
                                {rendered || "No answer submitted."}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="mb-6">
                    <label className="block text-white font-bold text-sm mb-2">
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Write Your Notes here..."
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-white/10 focus:outline-none focus:border-white/50 resize-none placeholder-white/50"
                    />
                  </div>

                  {/* Session Date Section */}
                  <div>
                    <label className="block text-white font-bold text-sm mb-2">
                      Progress
                    </label>
                    <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white">
                      <div className="flex items-center justify-between gap-4">
                        <span>Status</span>
                        <span className="font-semibold">{formatStatusLabel(derivedStatus)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-4 text-sm text-white/80">
                        <span>Completed steps</span>
                        <span>
                          {Number(progressRow?.completedSteps ?? 0)} / {Number(progressRow?.totalSteps ?? 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === "comments" && (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-white text-2xl font-bold">Comments</h2>
                    <button className="bg-[#B8E6FF] text-[#2E3B8E] px-4 py-2 rounded-lg font-semibold hover:bg-[#A0D9FF] transition-all flex items-center gap-2">
                      <i className="fa-solid fa-pencil"></i>
                      Edit
                    </button>
                  </div>

                  {/* Add Comment Section */}
                  <div className="mb-8">
                    <label className="block text-white font-bold text-sm mb-2">
                      Add Comment
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Write Your Comment here..."
                        className="flex-1 px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-[#2E3B8E] focus:outline-none focus:border-white/50 placeholder-white/50"
                      />
                      <button
                        onClick={handleSendComment}
                        disabled={commentSaving}
                        className="w-12 h-12 bg-[#B8E6FF] text-[#2E3B8E] rounded-full flex items-center justify-center hover:bg-[#A0D9FF] transition-all"
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment: any, idx: number) => {
                      const c = comment as {
                        _id?: string;
                        text?: string;
                        addedDate?: string;
                        createdAt?: string;
                        mentorId?: { firstName?: string; lastName?: string; profilePicture?: string };
                        user?: { firstName?: string; lastName?: string; profileImage?: string };
                      };
                      const author = c.mentorId ?? c.user;
                      const name =
                        author ? `${author.firstName ?? ""} ${author.lastName ?? ""}`.trim() : "";
                      const authorAv =
                        author as
                          | { profilePicture?: string; profileImage?: string }
                          | null
                          | undefined;
                      const avatar = authorAv?.profilePicture ?? authorAv?.profileImage;
                      const isHttp = typeof avatar === "string" && /^https?:\/\//i.test(avatar);
                      const date = c.addedDate ?? c.createdAt;
                      return (
                        <div
                          key={String(c._id ?? `comment-${idx}`)}
                          className="bg-white rounded-lg shadow-sm p-5 relative"
                        >
                          <div className="flex gap-4">
                            <Image
                              src={avatar && isHttp ? avatar : UserProfile}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                              unoptimized={Boolean(avatar && isHttp)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-gray-800">
                                  {name || "Mentor"}
                                </h4>
                                {date ? (
                                  <span className="text-xs text-gray-500">{formatDate(date)}</span>
                                ) : null}
                              </div>
                              <p className="text-sm text-gray-700">{c.text ?? ""}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {activeTab === "queries" && (
                <>
                  {/* Header */}
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-white text-2xl font-bold">Queries</h2>
                    <div className="flex items-center gap-3">
                      <button className="bg-white text-[#2E3B8E] px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2">
                        <i className="fa-solid fa-pencil"></i>
                        Edit
                      </button>
                      {/* Tab Switch Container */}
                      <div className="bg-white rounded-lg shadow-sm flex p-1">
                        <button
                          onClick={() => setQueryTab("Pending")}
                          className={`px-4 py-2 rounded-md font-semibold transition-all ${queryTab === "Pending"
                            ? "bg-[#2E3B8E] text-white"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => setQueryTab("Answered")}
                          className={`px-4 py-2 rounded-md font-semibold transition-all ${queryTab === "Answered"
                            ? "bg-[#2E3B8E] text-white"
                            : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                          Answered
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="h-px bg-[#B8E6FF] mb-6"></div>

                  {/* Queries List */}
                  <div className="space-y-0">
                    {queries.map((query, index) => {
                      const qid = String((query as any)?._id ?? "").trim();
                      if (!qid) return null;
                      return (
                      <div key={qid}>
                        <div className="pb-5">
                          {/* User Query Section */}
                          <div className="flex gap-4 mb-4">
                            <Image
                              src={UserProfile}
                              alt=""
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-white">
                                  {userName}
                                </h4>
                                <span className="text-xs text-white/70">
                                  {formatDate((query as any)?.createdDate ?? (query as any)?.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-white">{(query as any)?.actualQueryText ?? ""}</p>
                            </div>
                          </div>

                          {/* Answer Section - Conditional Rendering */}
                          {queryTab === "Pending" ? (
                            /* Answer Input Section for Pending */
                            <div className="flex gap-2 border border-[#7489ae] rounded-lg bg-[#375a96] p-1">
                              <input
                                type="text"
                                value={queryAnswers[qid] || ""}
                                onChange={(e) => handleAnswerChange(qid, e.target.value)}
                                placeholder="Write Your Answer here..."
                                className="flex-1 px-4 py-3 bg-[#375a96] text-white rounded-md focus:outline-none placeholder-gray-400"
                              />
                              <button
                                onClick={() => handleSendAnswer(qid)}
                                disabled={querySaving}
                                className="w-12 h-12 bg-[#1e366f] border border-[#7489ae] rounded-lg flex items-center justify-center hover:bg-[#1a2e5c] transition-all"
                              >
                                <i className="fa-regular fa-paper-plane text-white"></i>
                              </button>
                            </div>
                          ) : (
                            /* Mentor Answer Section for Answered */
                            ((query as any)?.repliedAnswer || (query as any)?.answer) && (
                              <div className="ml-14 mb-4">
                                <div className="bg-[#375a96] rounded-lg p-4">
                                  <div className="flex gap-4 mb-4">

                                    <Image
                                      src={UserProfile}
                                      alt=""
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />

                                    <div className="flex-1">

                                      <div className="flex items-center gap-2 mb-1">

                                        <h4 className="font-semibold text-sm text-white">
                                          Mentor
                                        </h4>

                                        <span className="text-xs text-white/70">
                                          {formatDate((query as any)?.repliedDate ?? (query as any)?.updatedAt)}
                                        </span>

                                      </div>

                                      <p className="text-sm text-white">
                                        {(query as any)?.repliedAnswer ?? (query as any)?.answer ?? ""}
                                      </p>

                                    </div>

                                  </div>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        {/* Horizontal Ruler between queries */}
                        {index < queries.length - 1 && (
                          <div className="h-px bg-gray-400 mb-5"></div>
                        )}
                      </div>
                    );})}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JumpStartPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <JumpStartPageContent />
    </Suspense>
  );
}
