"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";

import HeroBg from "@/app/Assets/roadmap-bg.png";
import UserProfile from "@/app/Assets/user-profile.png";

import {
  apiGetRoadmapById,
  apiGetNestedRoadmapItem,
  apiGetExtras,
  apiGetComments,
  apiAddComment,
  apiGetQueries,
  apiReplyToQuery,
} from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";
import { getMentorUserId } from "@/app/utils/mentor-auth";
import { verifyMentorPastorAccess } from "@/app/utils/mentor-pastor-link";

const glassPanel =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.88)_0%,rgba(10,53,88,0.95)_100%)] shadow-md backdrop-blur-sm";

const inputDark =
  "rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[#cde2f2]/60 outline-none focus:border-[#8ec5eb]/50";

/** Unwraps GET roadmap / nested-item bodies (same as pastor jumpstart). */
function extractRoadmapDocumentFromResponse(res: { data?: unknown }): Record<string, unknown> | null {
  const unwrap = (input: unknown): unknown => {
    if (input == null || typeof input !== "object" || Array.isArray(input)) return input;
    const o = input as Record<string, unknown>;
    if (o.success === false) return null;
    if ("data" in o && o.data !== undefined) return unwrap(o.data);
    return o;
  };
  const doc = unwrap(res?.data);
  if (doc == null || typeof doc !== "object" || Array.isArray(doc)) return null;
  return doc as Record<string, unknown>;
}

function findNestedTaskById(nodes: unknown[], id: string): Record<string, unknown> | null {
  const target = String(id);
  for (const node of nodes) {
    if (!node || typeof node !== "object" || Array.isArray(node)) continue;
    const n = node as Record<string, unknown>;
    if (String(n._id ?? n.id) === target) return n;
    const children = n.roadmaps;
    if (Array.isArray(children)) {
      const found = findNestedTaskById(children as unknown[], id);
      if (found) return found;
    }
  }
  return null;
}

function unwrapCommentsFromResponse(res: { data?: unknown }): Record<string, unknown>[] {
  const axiosBody = res.data as { data?: unknown } | undefined;
  const thread = axiosBody?.data ?? axiosBody;
  if (thread && typeof thread === "object" && !Array.isArray(thread) && "comments" in thread) {
    const list = (thread as { comments?: unknown }).comments;
    return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
  }
  if (Array.isArray(thread)) return thread as Record<string, unknown>[];
  return [];
}

function unwrapQueriesFromResponse(res: { data?: unknown }): Record<string, unknown>[] {
  const axiosBody = res.data as { data?: unknown } | undefined;
  const body = axiosBody?.data ?? axiosBody;
  const threads = Array.isArray(body) ? body : body ? [body] : [];
  return threads.flatMap((t) => {
    if (!t || typeof t !== "object") return [];
    const q = (t as { queries?: unknown[] }).queries;
    return Array.isArray(q) ? q : [];
  }) as Record<string, unknown>[];
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return String(iso);
  }
}

/** Skip internal rows; same filter as pastor jumpstart when merging extras. */
function isRenderablePastorExtraRow(item: Record<string, unknown>): boolean {
  const t = String(item.type ?? "").toUpperCase();
  return t !== "" && t !== "JUMPSTART_COMPLETE";
}

function TaskPageContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const roadmapId = searchParams.get("roadmapId");
  const userId = searchParams.get("userId");

  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [phaseName, setPhaseName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"pastorResponse" | "comments" | "queries">("pastorResponse");

  const [pastorExtrasRows, setPastorExtrasRows] = useState<Record<string, unknown>[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(false);

  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [queries, setQueries] = useState<Record<string, unknown>[]>([]);
  const [newComment, setNewComment] = useState("");

  const [queryAnswers, setQueryAnswers] = useState<Record<string, string>>({});
  const [queryTab, setQueryTab] = useState<"Pending" | "Answered">("Pending");

  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadUser = async () => {
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setUser(null);
          return;
        }
        setAccessError(null);
        const res = await apiGetUserById(userId);
        const body = res.data as { data?: unknown };
        setUser((body?.data ?? res.data) as { firstName?: string; lastName?: string });
      } catch (e) {
        console.error("Failed to fetch user", e);
      }
    };

    loadUser();
  }, [userId]);

  const fetchComments = useCallback(async () => {
    if (!roadmapId || !userId) return;
    try {
      const res = await apiGetComments(roadmapId, userId);
      setComments(unwrapCommentsFromResponse(res));
    } catch {
      setComments([]);
    }
  }, [roadmapId, userId]);

  const fetchQueries = useCallback(async () => {
    if (!roadmapId || !userId) return;
    const status = queryTab === "Pending" ? "pending" : "answered";
    try {
      const res = await apiGetQueries(roadmapId, userId, status);
      setQueries(unwrapQueriesFromResponse(res));
    } catch {
      setQueries([]);
    }
  }, [roadmapId, userId, queryTab]);

  useEffect(() => {
    if (!roadmapId || !taskId) {
      setLoading(false);
      setTask(null);
      setPhaseName(null);
      setLoadError(!roadmapId || !taskId ? "Missing roadmap or task in the URL." : null);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const access = await verifyMentorPastorAccess(userId);
        if (!access.ok) {
          setAccessError(access.reason);
          setTask(null);
          setPhaseName(null);
          return;
        }
        setAccessError(null);
        let taskDoc: Record<string, unknown> | null = null;
        let phaseTitle: string | null = null;

        const phaseRes = await apiGetRoadmapById(roadmapId);
        const raw = phaseRes.data as { data?: unknown };
        const phase = (raw?.data ?? phaseRes.data) as {
          name?: string;
          roadmaps?: Record<string, unknown>[];
        } | null;
        phaseTitle = phase?.name ?? null;

        try {
          const nestedRes = await apiGetNestedRoadmapItem(roadmapId, taskId);
          taskDoc = extractRoadmapDocumentFromResponse(nestedRes);
        } catch {
          /* fall back to embedded roadmaps tree */
        }

        if (!taskDoc && phase?.roadmaps?.length) {
          taskDoc = findNestedTaskById(phase.roadmaps as unknown[], taskId);
        }

        if (cancelled) return;

        setPhaseName(phaseTitle);
        setTask(taskDoc);
        if (!taskDoc) {
          setLoadError(
            "This task could not be loaded. It may have moved — open it again from the phase list.",
          );
        }

        await fetchComments();
      } catch (e) {
        console.error("Failed to load task", e);
        if (!cancelled) {
          setTask(null);
          setLoadError("Could not load this task. Try again or open it from the phase list.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, taskId, fetchComments]);

  useEffect(() => {
    if (!roadmapId || !userId) return;
    void fetchQueries();
  }, [queryTab, roadmapId, userId, fetchQueries]);

  useEffect(() => {
    if (!roadmapId || !userId || !taskId) return;

    let cancelled = false;

    const loadPastorExtras = async () => {
      setExtrasLoading(true);
      try {
        const res = await apiGetExtras(roadmapId, userId, taskId);
        const data = (res.data as { data?: unknown })?.data ?? res.data;
        const rows = (data as { extras?: unknown })?.extras;
        if (!cancelled) {
          setPastorExtrasRows(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
        }
      } catch (e) {
        console.error("Failed to load pastor extras", e);
        if (!cancelled) setPastorExtrasRows([]);
      } finally {
        if (!cancelled) setExtrasLoading(false);
      }
    };

    void loadPastorExtras();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, userId, taskId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !roadmapId || !userId) return;
    const mentorId = getMentorUserId();
    if (!mentorId) {
      console.warn("No mentor session; cannot post comment.");
      return;
    }

    try {
      await apiAddComment(roadmapId, {
        text: newComment.trim(),
        userId,
        mentorId,
      });
      setNewComment("");
      await fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendAnswer = async (queryId: string) => {
    const answer = queryAnswers[queryId];
    if (!answer?.trim() || !roadmapId) return;
    const mentorId = getMentorUserId();
    if (!mentorId) {
      console.warn("No mentor session; cannot reply.");
      return;
    }

    try {
      await apiReplyToQuery(roadmapId, queryId, {
        repliedAnswer: answer,
        repliedMentorId: mentorId,
      });
      setQueryAnswers((prev) => ({ ...prev, [queryId]: "" }));
      await fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerChange = (qid: string, value: string) => {
    setQueryAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Pastor"
    : userId
      ? "…"
      : "Pastor";

  const taskTitle = String(task?.name ?? "Task");
  const taskDescription = String(task?.description ?? "");

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
        <MentorHeader showFullHeader={true} />
        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-end bg-cover bg-bottom px-6 pb-8 pt-8 text-white sm:min-h-[240px] sm:px-10 sm:pb-10 md:px-20 md:pb-12"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <nav className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[#d9ebf8]">
            <Link href="/mentor/RevitalizationRoadmap" className="hover:text-white">
              Revitalization Roadmap
            </Link>
            <span className="opacity-70">&gt;</span>
            {userId ? (
              <>
                <Link
                  href={`/mentor/RevitalizationRoadmap/home?userId=${encodeURIComponent(userId)}`}
                  className="hover:text-white"
                >
                  {userName}
                </Link>
                <span className="opacity-70">&gt;</span>
              </>
            ) : null}
            {userId && roadmapId && phaseName ? (
              <>
                <Link
                  href={`/mentor/RevitalizationRoadmap/phase?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(roadmapId)}`}
                  className="hover:text-white"
                >
                  {phaseName}
                </Link>
                <span className="opacity-70">&gt;</span>
              </>
            ) : null}
            <span className="font-semibold text-white">{task ? taskTitle : "Task"}</span>
          </nav>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl md:text-4xl">{task ? taskTitle : "Task"}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#cde2f2] md:text-base">
            Read this pastor&apos;s submitted responses, add comments, and reply to queries.
          </p>
        </div>
      </section>

      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 sm:px-8 md:px-16 md:py-10">
        <div className="mx-auto max-w-7xl">
          {loadError && (
            <div className="mb-8 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              {loadError}
            </div>
          )}

          {accessError && (
            <div className="mb-8 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              {accessError}
            </div>
          )}

          {!task && !loadError ? (
            <p className="text-center text-sm text-[#cde2f2]">Nothing to show.</p>
          ) : null}

          {task && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <div className={`overflow-hidden ${glassPanel}`}>
                  <div className="border-b border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white">
                    Sections
                  </div>
                  <div className="space-y-1 p-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("pastorResponse")}
                      className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                        activeTab === "pastorResponse"
                          ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
                          : "text-[#cde2f2] hover:bg-white/10"
                      }`}
                    >
                      Pastor response
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("comments")}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                        activeTab === "comments"
                          ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
                          : "text-[#cde2f2] hover:bg-white/10"
                      }`}
                    >
                      <span>Comments</span>
                      <span className="rounded-full bg-[#e6edff] px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
                        {comments.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("queries")}
                      className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
                        activeTab === "queries"
                          ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
                          : "text-[#cde2f2] hover:bg-white/10"
                      }`}
                    >
                      <span>Queries</span>
                      <span className="rounded-full bg-[#e6edff] px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
                        {queries.length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {activeTab === "pastorResponse" && (
                  <div className={`${glassPanel} p-6 sm:p-8`}>
                    <h2 className="mb-2 text-lg font-semibold text-white sm:text-xl">Pastor response</h2>
                    <p className="mb-6 text-sm text-[#cde2f2]">
                      Answers and progress saved by {userName} for this task.
                    </p>

                    {taskDescription.trim() ? (
                      <details className="mb-6 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3">
                        <summary className="cursor-pointer text-sm font-semibold text-[#d9ebf8]">
                          Task instructions
                        </summary>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
                          {taskDescription}
                        </p>
                      </details>
                    ) : null}

                    {extrasLoading ? (
                      <div className="flex justify-center py-12">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
                      </div>
                    ) : (
                      <>
                        {pastorExtrasRows.filter(isRenderablePastorExtraRow).length === 0 ? (
                          <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]/90">
                            No responses submitted for this task yet.
                          </p>
                        ) : (
                          <div className="space-y-1">
                            {pastorExtrasRows.filter(isRenderablePastorExtraRow).map((item, idx) => {
                              const t = String(item.type ?? "").toUpperCase();
                              const label = String(item.name ?? item.key ?? `Item ${idx + 1}`);
                              const sig =
                                item.signatureData !== undefined ? item.signatureData : undefined;
                              const val = item.value !== undefined ? item.value : sig;

                              if (t === "TEXT_DISPLAY") {
                                return (
                                  <div
                                    key={`${label}-${idx}`}
                                    className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                                  >
                                    <p className="text-sm leading-relaxed text-[#cde2f2]">{label}</p>
                                  </div>
                                );
                              }

                              const empty =
                                val === undefined ||
                                val === null ||
                                (typeof val === "string" && val.trim() === "");

                              if (empty) {
                                return (
                                  <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                      {label}
                                    </p>
                                    <p className="mt-1 text-sm text-[#cde2f2]/65">No answer submitted.</p>
                                  </div>
                                );
                              }

                              if (typeof val === "boolean") {
                                return (
                                  <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                      {label}
                                    </p>
                                    <p className="mt-1 text-sm text-white">{val ? "Yes" : "No"}</p>
                                  </div>
                                );
                              }

                              const str =
                                typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

                              if (
                                t === "SIGNATURE" &&
                                typeof str === "string" &&
                                (str.startsWith("http://") ||
                                  str.startsWith("https://") ||
                                  str.startsWith("data:image"))
                              ) {
                                return (
                                  <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                      {label}
                                    </p>
                                    <div className="mt-3">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={str}
                                        alt=""
                                        className="max-h-48 max-w-full rounded-lg border border-white/15 object-contain"
                                      />
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                                    {label}
                                  </p>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
                                    {str}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {activeTab === "comments" && (
                  <div className={`${glassPanel} p-6 sm:p-8`}>
                    <h2 className="mb-6 text-lg font-semibold text-white sm:text-xl">Comments</h2>

                    <div className="mb-8">
                      <label className="mb-2 block text-sm font-semibold text-[#d9ebf8]">Add comment</label>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write your comment…"
                          className={`flex-1 ${inputDark}`}
                        />
                        <button
                          type="button"
                          onClick={handleSendComment}
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8ec5eb] text-[#062946] transition hover:bg-[#a9d5f2] sm:h-auto sm:w-14"
                          aria-label="Send comment"
                        >
                          <i className="fa-solid fa-paper-plane" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {comments.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[#cde2f2]/80">No comments yet.</p>
                      ) : null}
                      {comments.map((comment, cIdx) => {
                        const c = comment as {
                          _id?: string;
                          text?: string;
                          addedDate?: string;
                          mentorId?: {
                            firstName?: string;
                            lastName?: string;
                            profilePicture?: string;
                            role?: string;
                          };
                        };
                        const mentor = c.mentorId;
                        const name = mentor
                          ? `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor"
                          : "Mentor";
                        const avatar = mentor?.profilePicture;
                        const isHttp =
                          typeof avatar === "string" &&
                          (avatar.startsWith("http://") || avatar.startsWith("https://"));

                        return (
                          <div
                            key={String(c._id ?? `comment-${cIdx}`)}
                            className="rounded-xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm"
                          >
                            <div className="flex gap-4">
                              {avatar ? (
                                <Image
                                  src={avatar}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                                  unoptimized={isHttp}
                                />
                              ) : (
                                <Image
                                  src={UserProfile}
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                                />
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                  <h4 className="text-sm font-semibold text-white">{name}</h4>
                                  {c.addedDate ? (
                                    <span className="text-xs text-[#cde2f2]/80">{formatDate(c.addedDate)}</span>
                                  ) : null}
                                </div>
                                {mentor?.role ? (
                                  <p className="mb-1 text-xs capitalize text-[#cde2f2]/70">{mentor.role}</p>
                                ) : null}
                                <p className="text-sm leading-relaxed text-[#cde2f2]">{c.text}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "queries" && (
                  <div className={`${glassPanel} p-6 sm:p-8`}>
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-white sm:text-xl">Queries</h2>
                      <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
                        <button
                          type="button"
                          onClick={() => setQueryTab("Pending")}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            queryTab === "Pending"
                              ? "bg-[#8ec5eb] text-[#062946]"
                              : "text-[#cde2f2] hover:bg-white/10"
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          type="button"
                          onClick={() => setQueryTab("Answered")}
                          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            queryTab === "Answered"
                              ? "bg-[#8ec5eb] text-[#062946]"
                              : "text-[#cde2f2] hover:bg-white/10"
                          }`}
                        >
                          Answered
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 h-px bg-white/15" />

                    <div className="space-y-8">
                      {queries.length === 0 ? (
                        <p className="py-8 text-center text-sm text-[#cde2f2]/80">
                          No {queryTab === "Pending" ? "pending" : "answered"} queries.
                        </p>
                      ) : null}
                      {queries.map((query) => {
                        const q = query as {
                          _id: string;
                          actualQueryText?: string;
                          createdDate?: string;
                          status?: string;
                          repliedAnswer?: string;
                          repliedDate?: string;
                          repliedMentorId?: {
                            firstName?: string;
                            lastName?: string;
                            profilePicture?: string;
                            role?: string;
                          };
                        };
                        const isAnswered = q.status === "answered" || Boolean(q.repliedAnswer?.trim());

                        return (
                          <div key={q._id} className="border-b border-white/12 pb-8 last:border-0 last:pb-0">
                            <div className="mb-4 flex gap-3">
                              <Image
                                src={UserProfile}
                                alt=""
                                width={36}
                                height={36}
                                className="h-9 w-9 shrink-0 rounded-full object-cover"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-semibold text-white">{userName}</h4>
                                {q.createdDate ? (
                                  <p className="mb-2 text-xs text-[#cde2f2]/75">{formatDate(q.createdDate)}</p>
                                ) : null}
                                <p className="text-sm text-[#cde2f2]">{q.actualQueryText}</p>
                              </div>
                            </div>

                            {queryTab === "Pending" && !isAnswered ? (
                              <div className="ml-0 flex gap-2 rounded-xl border border-white/15 bg-white/5 p-1 sm:ml-12">
                                <input
                                  type="text"
                                  value={queryAnswers[q._id] || ""}
                                  onChange={(e) => handleAnswerChange(q._id, e.target.value)}
                                  placeholder="Write your answer…"
                                  className="min-h-[48px] flex-1 border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#cde2f2]/50 focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleSendAnswer(q._id)}
                                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#0f4a76] text-white transition hover:bg-[#135a8f]"
                                  aria-label="Send answer"
                                >
                                  <i className="fa-regular fa-paper-plane" />
                                </button>
                              </div>
                            ) : null}

                            {queryTab === "Answered" && isAnswered && q.repliedAnswer ? (
                              <div className="ml-0 rounded-xl border border-white/12 bg-white/[0.06] p-4 sm:ml-12">
                                <div className="flex gap-3">
                                  {q.repliedMentorId?.profilePicture ? (
                                    <Image
                                      src={q.repliedMentorId.profilePicture}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                                      unoptimized={
                                        q.repliedMentorId.profilePicture.startsWith("http://") ||
                                        q.repliedMentorId.profilePicture.startsWith("https://")
                                      }
                                    />
                                  ) : (
                                    <Image
                                      src={UserProfile}
                                      alt=""
                                      width={36}
                                      height={36}
                                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-semibold text-white">
                                      {q.repliedMentorId
                                        ? `${q.repliedMentorId.firstName ?? ""} ${q.repliedMentorId.lastName ?? ""}`.trim() ||
                                          "Mentor"
                                        : "Mentor"}
                                    </h4>
                                    {q.repliedDate ? (
                                      <p className="mb-2 text-xs text-[#cde2f2]/75">{formatDate(q.repliedDate)}</p>
                                    ) : null}
                                    {q.repliedMentorId?.role ? (
                                      <p className="mb-2 text-xs capitalize text-[#cde2f2]/70">
                                        {q.repliedMentorId.role}
                                      </p>
                                    ) : null}
                                    <p className="text-sm leading-relaxed text-[#cde2f2]">{q.repliedAnswer}</p>
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {queryTab === "Answered" && !isAnswered ? (
                              <p className="ml-0 text-sm text-[#cde2f2]/70 sm:ml-12">No reply recorded yet.</p>
                            ) : null}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TaskPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#062946] font-[Albert_Sans] text-[#cde2f2]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      }
    >
      <TaskPageContent />
    </Suspense>
  );
}
