// "use client";

// import { useCallback, useEffect, useState, Suspense } from "react";
// import Image from "next/image";
// import { useSearchParams } from "next/navigation";
// import "@fortawesome/fontawesome-free/css/all.min.css";

// import HeroBg from "@/app/Assets/roadmap-bg.png";
// import UserProfile from "@/app/Assets/user-profile.png";

// import {
//   apiGetRoadmapById,
//   apiGetNestedRoadmapItem,
//   apiGetExtras,
//   apiGetComments,
//   apiAddComment,
//   apiGetQueries,
//   apiReplyToQuery,
// } from "@/app/Services/roadmaps.service";
// import { apiGetUserById } from "@/app/Services/users.service";
// import DirectorHero from "../../DirectorHero";
// import { directorPageContainer, directorPageRoot, directorSpinner } from "../../directorUi";
// import { getDirectorUserId } from "@/app/utils/director-auth";
// import { getMentorUserId } from "@/app/utils/mentor-auth";
// import { verifyDirectorOrMentorPastorAccess } from "@/app/utils/mentor-pastor-link";

// const glassPanel =
//   "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.88)_0%,rgba(10,53,88,0.95)_100%)] shadow-md backdrop-blur-sm";

// const inputDark =
//   "rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-[#cde2f2]/60 outline-none focus:border-[#8ec5eb]/50";

// /** Unwraps GET roadmap / nested-item bodies (same as pastor jumpstart). */
// function extractRoadmapDocumentFromResponse(res: { data?: unknown }): Record<string, unknown> | null {
//   const unwrap = (input: unknown): unknown => {
//     if (input == null || typeof input !== "object" || Array.isArray(input)) return input;
//     const o = input as Record<string, unknown>;
//     if (o.success === false) return null;
//     if ("data" in o && o.data !== undefined) return unwrap(o.data);
//     return o;
//   };
//   const doc = unwrap(res?.data);
//   if (doc == null || typeof doc !== "object" || Array.isArray(doc)) return null;
//   return doc as Record<string, unknown>;
// }

// function findNestedTaskById(nodes: unknown[], id: string): Record<string, unknown> | null {
//   const target = String(id);
//   for (const node of nodes) {
//     if (!node || typeof node !== "object" || Array.isArray(node)) continue;
//     const n = node as Record<string, unknown>;
//     if (String(n._id ?? n.id) === target) return n;
//     const children = n.roadmaps;
//     if (Array.isArray(children)) {
//       const found = findNestedTaskById(children as unknown[], id);
//       if (found) return found;
//     }
//   }
//   return null;
// }

// function unwrapCommentsFromResponse(res: { data?: unknown }): Record<string, unknown>[] {
//   const axiosBody = res.data as { data?: unknown } | undefined;
//   const thread = axiosBody?.data ?? axiosBody;
//   if (thread && typeof thread === "object" && !Array.isArray(thread) && "comments" in thread) {
//     const list = (thread as { comments?: unknown }).comments;
//     return Array.isArray(list) ? (list as Record<string, unknown>[]) : [];
//   }
//   if (Array.isArray(thread)) return thread as Record<string, unknown>[];
//   return [];
// }

// function unwrapQueriesFromResponse(res: { data?: unknown }): Record<string, unknown>[] {
//   const axiosBody = res.data as { data?: unknown } | undefined;
//   const body = axiosBody?.data ?? axiosBody;
//   const threads = Array.isArray(body) ? body : body ? [body] : [];
//   return threads.flatMap((t) => {
//     if (!t || typeof t !== "object") return [];
//     const q = (t as { queries?: unknown[] }).queries;
//     return Array.isArray(q) ? q : [];
//   }) as Record<string, unknown>[];
// }

// function formatDate(iso?: string) {
//   if (!iso) return "";
//   try {
//     return new Date(iso).toLocaleDateString();
//   } catch {
//     return String(iso);
//   }
// }

// /** Skip internal rows; same filter as pastor jumpstart when merging extras. */
// function isRenderablePastorExtraRow(item: Record<string, unknown>): boolean {
//   const t = String(item.type ?? "").toUpperCase();
//   return t !== "" && t !== "JUMPSTART_COMPLETE";
// }

// function TaskPageContent() {
//   const searchParams = useSearchParams();
//   const taskId = searchParams.get("taskId");
//   const roadmapId = searchParams.get("roadmapId");
//   const userId = searchParams.get("userId");

//   const [task, setTask] = useState<Record<string, unknown> | null>(null);
//   const [phaseName, setPhaseName] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [loadError, setLoadError] = useState<string | null>(null);

//   const [activeTab, setActiveTab] = useState<"pastorResponse" | "comments" | "queries">("pastorResponse");

//   const [pastorExtrasRows, setPastorExtrasRows] = useState<Record<string, unknown>[]>([]);
//   const [extrasLoading, setExtrasLoading] = useState(false);

//   const [comments, setComments] = useState<Record<string, unknown>[]>([]);
//   const [queries, setQueries] = useState<Record<string, unknown>[]>([]);
//   const [newComment, setNewComment] = useState("");

//   const [queryAnswers, setQueryAnswers] = useState<Record<string, string>>({});
//   const [queryTab, setQueryTab] = useState<"Pending" | "Answered">("Pending");

//   const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
//   const [accessError, setAccessError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!userId) return;

//     const loadUser = async () => {
//       try {
//         const access = await verifyDirectorOrMentorPastorAccess(userId);
//         if (!access.ok) {
//           setAccessError(access.reason);
//           setUser(null);
//           return;
//         }
//         setAccessError(null);
//         const res = await apiGetUserById(userId);
//         const body = res.data as { data?: unknown };
//         setUser((body?.data ?? res.data) as { firstName?: string; lastName?: string });
//       } catch (e) {
//         console.error("Failed to fetch user", e);
//       }
//     };

//     loadUser();
//   }, [userId]);

//   const fetchComments = useCallback(async () => {
//     if (!roadmapId || !userId) return;
//     try {
//       const res = await apiGetComments(roadmapId, userId);
//       setComments(unwrapCommentsFromResponse(res));
//     } catch {
//       setComments([]);
//     }
//   }, [roadmapId, userId]);

//   const fetchQueries = useCallback(async () => {
//     if (!roadmapId || !userId) return;
//     const status = queryTab === "Pending" ? "pending" : "answered";
//     try {
//       const res = await apiGetQueries(roadmapId, userId, status);
//       setQueries(unwrapQueriesFromResponse(res));
//     } catch {
//       setQueries([]);
//     }
//   }, [roadmapId, userId, queryTab]);

//   useEffect(() => {
//     if (!roadmapId || !taskId) {
//       setLoading(false);
//       setTask(null);
//       setPhaseName(null);
//       setLoadError(!roadmapId || !taskId ? "Missing roadmap or task in the URL." : null);
//       return;
//     }

//     let cancelled = false;

//     const run = async () => {
//       setLoading(true);
//       setLoadError(null);
//       try {
//         const access = await verifyDirectorOrMentorPastorAccess(userId);
//         if (!access.ok) {
//           setAccessError(access.reason);
//           setTask(null);
//           setPhaseName(null);
//           return;
//         }
//         setAccessError(null);
//         let taskDoc: Record<string, unknown> | null = null;
//         let phaseTitle: string | null = null;

//         const phaseRes = await apiGetRoadmapById(roadmapId);
//         const raw = phaseRes.data as { data?: unknown };
//         const phase = (raw?.data ?? phaseRes.data) as {
//           name?: string;
//           roadmaps?: Record<string, unknown>[];
//         } | null;
//         phaseTitle = phase?.name ?? null;

//         try {
//           const nestedRes = await apiGetNestedRoadmapItem(roadmapId, taskId);
//           taskDoc = extractRoadmapDocumentFromResponse(nestedRes);
//         } catch {
//           /* fall back to embedded roadmaps tree */
//         }

//         if (!taskDoc && phase?.roadmaps?.length) {
//           taskDoc = findNestedTaskById(phase.roadmaps as unknown[], taskId);
//         }

//         if (cancelled) return;

//         setPhaseName(phaseTitle);
//         setTask(taskDoc);
//         if (!taskDoc) {
//           setLoadError(
//             "This task could not be loaded. It may have moved — open it again from the phase list.",
//           );
//         }

//         await fetchComments();
//       } catch (e) {
//         console.error("Failed to load task", e);
//         if (!cancelled) {
//           setTask(null);
//           setLoadError("Could not load this task. Try again or open it from the phase list.");
//         }
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };

//     run();
//     return () => {
//       cancelled = true;
//     };
//   }, [roadmapId, taskId, fetchComments]);

//   useEffect(() => {
//     if (!roadmapId || !userId) return;
//     void fetchQueries();
//   }, [queryTab, roadmapId, userId, fetchQueries]);

//   useEffect(() => {
//     if (!roadmapId || !userId || !taskId) return;

//     let cancelled = false;

//     const loadPastorExtras = async () => {
//       setExtrasLoading(true);
//       try {
//         const res = await apiGetExtras(roadmapId, userId, taskId);
//         const data = (res.data as { data?: unknown })?.data ?? res.data;
//         const rows = (data as { extras?: unknown })?.extras;
//         if (!cancelled) {
//           setPastorExtrasRows(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []);
//         }
//       } catch (e) {
//         console.error("Failed to load pastor extras", e);
//         if (!cancelled) setPastorExtrasRows([]);
//       } finally {
//         if (!cancelled) setExtrasLoading(false);
//       }
//     };

//     void loadPastorExtras();
//     return () => {
//       cancelled = true;
//     };
//   }, [roadmapId, userId, taskId]);

//   const handleSendComment = async () => {
//     if (!newComment.trim() || !roadmapId || !userId) return;
//     const mentorId = getDirectorUserId() ?? getMentorUserId();
//     if (!mentorId) {
//       console.warn("No director or mentor session; cannot post comment.");
//       return;
//     }

//     try {
//       await apiAddComment(roadmapId, {
//         text: newComment.trim(),
//         userId,
//         mentorId,
//       });
//       setNewComment("");
//       await fetchComments();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleSendAnswer = async (queryId: string) => {
//     const answer = queryAnswers[queryId];
//     if (!answer?.trim() || !roadmapId) return;
//     const mentorId = getDirectorUserId() ?? getMentorUserId();
//     if (!mentorId) {
//       console.warn("No director or mentor session; cannot reply.");
//       return;
//     }

//     try {
//       await apiReplyToQuery(roadmapId, queryId, {
//         repliedAnswer: answer,
//         repliedMentorId: mentorId,
//       });
//       setQueryAnswers((prev) => ({ ...prev, [queryId]: "" }));
//       await fetchQueries();
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleAnswerChange = (qid: string, value: string) => {
//     setQueryAnswers((prev) => ({ ...prev, [qid]: value }));
//   };

//   const pastorHubHref = userId
//     ? `/director/pastor-assignments?assignUser=${encodeURIComponent(userId)}`
//     : "/director/pastor-assignments";

//   const phaseHref =
//     userId && roadmapId
//       ? `/director/revitalization-roadmap/phase?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(roadmapId)}`
//       : null;

//   const userName = user
//     ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Pastor"
//     : userId
//       ? "…"
//       : "Pastor";

//   const taskTitle = String(task?.name ?? "Task");
//   const taskDescription = String(task?.description ?? "");

//   if (loading) {
//     return (
//       <div className={directorPageRoot}>
//         <DirectorHero
//           title="Task"
//           subtitle="Loading…"
//           image={HeroBg}
//           breadcrumbItems={[
//             { label: "Home", href: "/director/home" },
//             { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
//             { label: "Task" },
//           ]}
//         />
//         <div className="flex flex-1 items-center justify-center px-6 py-20">
//           <div className={directorSpinner} />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={directorPageRoot}>
//       <DirectorHero
//         title={task ? taskTitle : "Task"}
//         subtitle="Read this pastor&apos;s submitted responses, add comments, and reply to queries."
//         image={HeroBg}
//         pill="Director · Revitalization Roadmap"
//         breadcrumbItems={[
//           { label: "Home", href: "/director/home" },
//           { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
//           ...(userId ? [{ label: userName, href: pastorHubHref }] : []),
//           ...(phaseHref ? [{ label: phaseName ?? "Phase", href: phaseHref }] : []),
//           { label: task ? taskTitle : "Task" },
//         ]}
//       />

//       <main className="flex-1 pb-12">
//         <div className={`${directorPageContainer} max-w-7xl`}>
//           {loadError && (
//             <div className="mb-8 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
//               {loadError}
//             </div>
//           )}

//           {accessError && (
//             <div className="mb-8 rounded-xl border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
//               {accessError}
//             </div>
//           )}

//           {!task && !loadError ? (
//             <p className="text-center text-sm text-[#cde2f2]">Nothing to show.</p>
//           ) : null}

//           {task && (
//             <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
//               <div className="lg:col-span-1">
//                 <div className={`overflow-hidden ${glassPanel}`}>
//                   <div className="border-b border-white/15 bg-white/5 px-5 py-4 text-sm font-semibold text-white">
//                     Sections
//                   </div>
//                   <div className="space-y-1 p-3">
//                     <button
//                       type="button"
//                       onClick={() => setActiveTab("pastorResponse")}
//                       className={`w-full rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
//                         activeTab === "pastorResponse"
//                           ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
//                           : "text-[#cde2f2] hover:bg-white/10"
//                       }`}
//                     >
//                       Pastor response
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setActiveTab("comments")}
//                       className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
//                         activeTab === "comments"
//                           ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
//                           : "text-[#cde2f2] hover:bg-white/10"
//                       }`}
//                     >
//                       <span>Comments</span>
//                       <span className="rounded-full bg-[#e6edff] px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
//                         {comments.length}
//                       </span>
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => setActiveTab("queries")}
//                       className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-semibold transition ${
//                         activeTab === "queries"
//                           ? "border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 text-white"
//                           : "text-[#cde2f2] hover:bg-white/10"
//                       }`}
//                     >
//                       <span>Queries</span>
//                       <span className="rounded-full bg-[#e6edff] px-2 py-0.5 text-xs font-semibold text-[#1e40af]">
//                         {queries.length}
//                       </span>
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               <div className="lg:col-span-3">
//                 {activeTab === "pastorResponse" && (
//                   <div className={`${glassPanel} p-6 sm:p-8`}>
//                     <h2 className="mb-2 text-lg font-semibold text-white sm:text-xl">Pastor response</h2>
//                     <p className="mb-6 text-sm text-[#cde2f2]">
//                       Answers and progress saved by {userName} for this task.
//                     </p>

//                     {taskDescription.trim() ? (
//                       <details className="mb-6 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3">
//                         <summary className="cursor-pointer text-sm font-semibold text-[#d9ebf8]">
//                           Task instructions
//                         </summary>
//                         <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
//                           {taskDescription}
//                         </p>
//                       </details>
//                     ) : null}

//                     {extrasLoading ? (
//                       <div className="flex justify-center py-12">
//                         <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
//                       </div>
//                     ) : (
//                       <>
//                         {pastorExtrasRows.filter(isRenderablePastorExtraRow).length === 0 ? (
//                           <p className="rounded-xl border border-white/15 bg-white/5 px-4 py-8 text-center text-sm text-[#cde2f2]/90">
//                             No responses submitted for this task yet.
//                           </p>
//                         ) : (
//                           <div className="space-y-1">
//                             {pastorExtrasRows.filter(isRenderablePastorExtraRow).map((item, idx) => {
//                               const t = String(item.type ?? "").toUpperCase();
//                               const label = String(item.name ?? item.key ?? `Item ${idx + 1}`);
//                               const sig =
//                                 item.signatureData !== undefined ? item.signatureData : undefined;
//                               const val = item.value !== undefined ? item.value : sig;

//                               if (t === "TEXT_DISPLAY") {
//                                 return (
//                                   <div
//                                     key={`${label}-${idx}`}
//                                     className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
//                                   >
//                                     <p className="text-sm leading-relaxed text-[#cde2f2]">{label}</p>
//                                   </div>
//                                 );
//                               }

//                               const empty =
//                                 val === undefined ||
//                                 val === null ||
//                                 (typeof val === "string" && val.trim() === "");

//                               if (empty) {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <p className="mt-1 text-sm text-[#cde2f2]/65">No answer submitted.</p>
//                                   </div>
//                                 );
//                               }

//                               if (typeof val === "boolean") {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <p className="mt-1 text-sm text-white">{val ? "Yes" : "No"}</p>
//                                   </div>
//                                 );
//                               }

//                               const str =
//                                 typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

//                               if (
//                                 t === "SIGNATURE" &&
//                                 typeof str === "string" &&
//                                 (str.startsWith("http://") ||
//                                   str.startsWith("https://") ||
//                                   str.startsWith("data:image"))
//                               ) {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <div className="mt-3">
//                                       {/* eslint-disable-next-line @next/next/no-img-element */}
//                                       <img
//                                         src={str}
//                                         alt=""
//                                         className="max-h-48 max-w-full rounded-lg border border-white/15 object-contain"
//                                       />
//                                     </div>
//                                   </div>
//                                 );
//                               }

//                               return (
//                                 <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                   <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                     {label}
//                                   </p>
//                                   <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
//                                     {str}
//                                   </p>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         )}
//                       </>
//                     )}
//                   </div>
//                 )}

//                 {activeTab === "comments" && (
//                   <div className={`${glassPanel} p-6 sm:p-8`}>
//                     <h2 className="mb-6 text-lg font-semibold text-white sm:text-xl">Comments</h2>

//                     <div className="mb-8">
//                       <label className="mb-2 block text-sm font-semibold text-[#d9ebf8]">Add comment</label>
//                       <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
//                         <input
//                           type="text"
//                           value={newComment}
//                           onChange={(e) => setNewComment(e.target.value)}
//                           placeholder="Write your comment…"
//                           className={`flex-1 ${inputDark}`}
//                         />
//                         <button
//                           type="button"
//                           onClick={handleSendComment}
//                           className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8ec5eb] text-[#062946] transition hover:bg-[#a9d5f2] sm:h-auto sm:w-14"
//                           aria-label="Send comment"
//                         >
//                           <i className="fa-solid fa-paper-plane" />
//                         </button>
//                       </div>
//                     </div>

//                     <div className="space-y-4">
//                       {comments.length === 0 ? (
//                         <p className="py-8 text-center text-sm text-[#cde2f2]/80">No comments yet.</p>
//                       ) : null}
//                       {comments.map((comment, cIdx) => {
//                         const c = comment as {
//                           _id?: string;
//                           text?: string;
//                           addedDate?: string;
//                           mentorId?: {
//                             firstName?: string;
//                             lastName?: string;
//                             profilePicture?: string;
//                             role?: string;
//                           };
//                         };
//                         const mentor = c.mentorId;
//                         const name = mentor
//                           ? `${mentor.firstName ?? ""} ${mentor.lastName ?? ""}`.trim() || "Mentor"
//                           : "Mentor";
//                         const avatar = mentor?.profilePicture;
//                         const isHttp =
//                           typeof avatar === "string" &&
//                           (avatar.startsWith("http://") || avatar.startsWith("https://"));

//                         return (
//                           <div
//                             key={String(c._id ?? `comment-${cIdx}`)}
//                             className="rounded-xl border border-white/12 bg-white/[0.07] p-5 backdrop-blur-sm"
//                           >
//                             <div className="flex gap-4">
//                               {avatar ? (
//                                 <Image
//                                   src={avatar}
//                                   alt=""
//                                   width={40}
//                                   height={40}
//                                   className="h-10 w-10 shrink-0 rounded-full object-cover"
//                                   unoptimized={isHttp}
//                                 />
//                               ) : (
//                                 <Image
//                                   src={UserProfile}
//                                   alt=""
//                                   width={40}
//                                   height={40}
//                                   className="h-10 w-10 shrink-0 rounded-full object-cover"
//                                 />
//                               )}
//                               <div className="min-w-0 flex-1">
//                                 <div className="mb-1 flex flex-wrap items-center gap-2">
//                                   <h4 className="text-sm font-semibold text-white">{name}</h4>
//                                   {c.addedDate ? (
//                                     <span className="text-xs text-[#cde2f2]/80">{formatDate(c.addedDate)}</span>
//                                   ) : null}
//                                 </div>
//                                 {mentor?.role ? (
//                                   <p className="mb-1 text-xs capitalize text-[#cde2f2]/70">{mentor.role}</p>
//                                 ) : null}
//                                 <p className="text-sm leading-relaxed text-[#cde2f2]">{c.text}</p>
//                               </div>
//                             </div>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//                 {activeTab === "queries" && (
//                   <div className={`${glassPanel} p-6 sm:p-8`}>
//                     <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                       <h2 className="text-lg font-semibold text-white sm:text-xl">Queries</h2>
//                       <div className="inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
//                         <button
//                           type="button"
//                           onClick={() => setQueryTab("Pending")}
//                           className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
//                             queryTab === "Pending"
//                               ? "bg-[#8ec5eb] text-[#062946]"
//                               : "text-[#cde2f2] hover:bg-white/10"
//                           }`}
//                         >
//                           Pending
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => setQueryTab("Answered")}
//                           className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
//                             queryTab === "Answered"
//                               ? "bg-[#8ec5eb] text-[#062946]"
//                               : "text-[#cde2f2] hover:bg-white/10"
//                           }`}
//                         >
//                           Answered
//                         </button>
//                       </div>
//                     </div>

//                     <div className="mb-6 h-px bg-white/15" />

//                     <div className="space-y-8">
//                       {queries.length === 0 ? (
//                         <p className="py-8 text-center text-sm text-[#cde2f2]/80">
//                           No {queryTab === "Pending" ? "pending" : "answered"} queries.
//                         </p>
//                       ) : null}
//                       {queries.map((query) => {
//                         const q = query as {
//                           _id: string;
//                           actualQueryText?: string;
//                           createdDate?: string;
//                           status?: string;
//                           repliedAnswer?: string;
//                           repliedDate?: string;
//                           repliedMentorId?: {
//                             firstName?: string;
//                             lastName?: string;
//                             profilePicture?: string;
//                             role?: string;
//                           };
//                         };
//                         const isAnswered = q.status === "answered" || Boolean(q.repliedAnswer?.trim());

//                         return (
//                           <div key={q._id} className="border-b border-white/12 pb-8 last:border-0 last:pb-0">
//                             <div className="mb-4 flex gap-3">
//                               <Image
//                                 src={UserProfile}
//                                 alt=""
//                                 width={36}
//                                 height={36}
//                                 className="h-9 w-9 shrink-0 rounded-full object-cover"
//                               />
//                               <div className="min-w-0 flex-1">
//                                 <h4 className="text-sm font-semibold text-white">{userName}</h4>
//                                 {q.createdDate ? (
//                                   <p className="mb-2 text-xs text-[#cde2f2]/75">{formatDate(q.createdDate)}</p>
//                                 ) : null}
//                                 <p className="text-sm text-[#cde2f2]">{q.actualQueryText}</p>
//                               </div>
//                             </div>

//                             {queryTab === "Pending" && !isAnswered ? (
//                               <div className="ml-0 flex gap-2 rounded-xl border border-white/15 bg-white/5 p-1 sm:ml-12">
//                                 <input
//                                   type="text"
//                                   value={queryAnswers[q._id] || ""}
//                                   onChange={(e) => handleAnswerChange(q._id, e.target.value)}
//                                   placeholder="Write your answer…"
//                                   className="min-h-[48px] flex-1 border-0 bg-transparent px-3 py-2 text-sm text-white placeholder:text-[#cde2f2]/50 focus:outline-none"
//                                 />
//                                 <button
//                                   type="button"
//                                   onClick={() => handleSendAnswer(q._id)}
//                                   className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-[#0f4a76] text-white transition hover:bg-[#135a8f]"
//                                   aria-label="Send answer"
//                                 >
//                                   <i className="fa-regular fa-paper-plane" />
//                                 </button>
//                               </div>
//                             ) : null}

//                             {queryTab === "Answered" && isAnswered && q.repliedAnswer ? (
//                               <div className="ml-0 rounded-xl border border-white/12 bg-white/[0.06] p-4 sm:ml-12">
//                                 <div className="flex gap-3">
//                                   {q.repliedMentorId?.profilePicture ? (
//                                     <Image
//                                       src={q.repliedMentorId.profilePicture}
//                                       alt=""
//                                       width={36}
//                                       height={36}
//                                       className="h-9 w-9 shrink-0 rounded-full object-cover"
//                                       unoptimized={
//                                         q.repliedMentorId.profilePicture.startsWith("http://") ||
//                                         q.repliedMentorId.profilePicture.startsWith("https://")
//                                       }
//                                     />
//                                   ) : (
//                                     <Image
//                                       src={UserProfile}
//                                       alt=""
//                                       width={36}
//                                       height={36}
//                                       className="h-9 w-9 shrink-0 rounded-full object-cover"
//                                     />
//                                   )}
//                                   <div className="min-w-0 flex-1">
//                                     <h4 className="text-sm font-semibold text-white">
//                                       {q.repliedMentorId
//                                         ? `${q.repliedMentorId.firstName ?? ""} ${q.repliedMentorId.lastName ?? ""}`.trim() ||
//                                           "Mentor"
//                                         : "Mentor"}
//                                     </h4>
//                                     {q.repliedDate ? (
//                                       <p className="mb-2 text-xs text-[#cde2f2]/75">{formatDate(q.repliedDate)}</p>
//                                     ) : null}
//                                     {q.repliedMentorId?.role ? (
//                                       <p className="mb-2 text-xs capitalize text-[#cde2f2]/70">
//                                         {q.repliedMentorId.role}
//                                       </p>
//                                     ) : null}
//                                     <p className="text-sm leading-relaxed text-[#cde2f2]">{q.repliedAnswer}</p>
//                                   </div>
//                                 </div>
//                               </div>
//                             ) : null}

//                             {queryTab === "Answered" && !isAnswered ? (
//                               <p className="ml-0 text-sm text-[#cde2f2]/70 sm:ml-12">No reply recorded yet.</p>
//                             ) : null}

//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }

// export default function TaskPage() {
//   return (
//     <Suspense
//       fallback={
//         <div className={`${directorPageRoot} items-center justify-center text-white/75`}>
//           <div className={directorSpinner} />
//         </div>
//       }
//     >
//       <TaskPageContent />
//     </Suspense>
//   );
// }

"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import type { JSX } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  apiGetUserAnswers,
  apiGetSectionRecommendations,
} from "@/app/Services/assessment.service";

import { apiGetAppointments } from "@/app/Services/appointments.service";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { apiGetExtrasDocuments } from "@/app/Services/api";

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
  apiDeleteQueryReply,
} from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";

import DirectorHero from "@/app/director/DirectorHero";
import { directorPageContainer, directorPageRoot, directorSpinner } from "../../directorUi";
import { getDirectorUserId } from "@/app/utils/director-auth";

import { verifyDirectorOrMentorPastorAccess } from "@/app/utils/mentor-pastor-link";
import { getMentorUserId } from "@/app/utils/mentor-auth";

import {
  resolveNestedTemplateItemId,
  unwrapNestedRoadmapsArray,
} from "@/app/Services/roadmap-assignments";

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
  const target = String(id).trim();
  if (!target) return null;
  for (const node of nodes) {
    if (!node || typeof node !== "object" || Array.isArray(node)) continue;
    const n = node as Record<string, unknown>;
    const nodeId = resolveNestedTemplateItemId(n);
    if (nodeId === target || (!nodeId && String(n._id ?? n.id) === target)) {
      return n;
    }
    const nested = unwrapNestedRoadmapsArray(n as { roadmaps?: unknown });
    if (nested.length) {
      const found = findNestedTaskById(nested as unknown[], id);
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

/** Long form for mentor task header, e.g. "May 20, 2026". */
function formatDueHeadingDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
  const router = useRouter();
  const taskId = searchParams.get("taskId");
  const roadmapId = searchParams.get("roadmapId");
  const userId = searchParams.get("userId");

  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [phaseName, setPhaseName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"pastorResponse" | "comments" | "queries">("pastorResponse");

  const [pastorExtrasRows, setPastorExtrasRows] = useState<Record<string, unknown>[]>([]);
  const [pastorUploadDocs, setPastorUploadDocs] = useState<
  Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]>
>({});
  const [extrasLoading, setExtrasLoading] = useState(false);

  const [comments, setComments] = useState<Record<string, unknown>[]>([]);
  const [queries, setQueries] = useState<Record<string, unknown>[]>([]);
  const [newComment, setNewComment] = useState("");

  const [queryAnswers, setQueryAnswers] = useState<Record<string, string>>({});
  const [queryTab, setQueryTab] = useState<"Pending" | "Answered">("Pending");

  const [mentorReplyDraft, setMentorReplyDraft] = useState("");
  const [editingMentorReplyId, setEditingMentorReplyId] = useState<string | null>(null);
  const [replyActionQueryId, setReplyActionQueryId] = useState<string | null>(null);

  const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const loadUser = async () => {
      try {
        const access = await verifyDirectorOrMentorPastorAccess(userId)
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
      const res = await apiGetQueries(roadmapId, userId, status, taskId || undefined, "pastor");
      // setQueries(unwrapQueriesFromResponse(res));
      const all = unwrapQueriesFromResponse(res);

// const scoped = all.filter((q: any) => {
//   const qTaskId = String(
//     q.nestedRoadMapItemId ??
//     q.nestedItemId ??
//     q.taskId ??
//     q.roadmapItemId ??
//     ""
//   );

//   return qTaskId === String(taskId);
// });

// setQueries(scoped);
const hasScopedIds = all.some((q: any) =>
  Boolean(q.nestedRoadMapItemId ?? q.nestedItemId ?? q.taskId ?? q.roadmapItemId)
);

const scoped = hasScopedIds
  ? all.filter((q: any) => {
      const qTaskId = String(
        q.nestedRoadMapItemId ??
          q.nestedItemId ??
          q.taskId ??
          q.roadmapItemId ??
          ""
      );

      return qTaskId === String(taskId);
    })
  : all;

setQueries(scoped);
    } catch {
      setQueries([]);
    }
  }, [roadmapId, userId, queryTab, taskId]);

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
        const access = await verifyDirectorOrMentorPastorAccess(userId)
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

        if (!taskDoc && phase) {
          const phaseChildren = unwrapNestedRoadmapsArray(phase as { roadmaps?: unknown });
          if (phaseChildren.length) {
            taskDoc = findNestedTaskById(phaseChildren as unknown[], taskId);
          }
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
  useEffect(() => {
  if (!roadmapId || !userId || !taskId) return;

  let cancelled = false;

  const loadPastorUploadDocs = async () => {
    try {
      const res = await apiGetExtrasDocuments(roadmapId, userId, taskId);
      const list = (res?.data?.data || res?.data) as any[];
      const batches = Array.isArray(list) ? list : [];

      const byName: Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]> = {};

      batches.forEach((b: any) => {
        const name = String(b?.name ?? "").trim().toLowerCase();
        const batchId = String(b?.uploadBatchId ?? "").trim();
        const files = Array.isArray(b?.files) ? b.files : [];

        if (!name || !files.length) return;

        const mapped = files
          .map((f: any) => ({
            fileName: String(f?.fileName ?? "").trim(),
            fileUrl: String(f?.fileUrl ?? "").trim(),
            uploadBatchId: batchId,
          }))
          .filter((f: any) => f.fileName && f.fileUrl);

        if (mapped.length) {
          byName[name] = [...(byName[name] || []), ...mapped];
        }
      });

      if (!cancelled) setPastorUploadDocs(byName);
    } catch {
      if (!cancelled) setPastorUploadDocs({});
    }
  };

  void loadPastorUploadDocs();

  return () => {
    cancelled = true;
  };
}, [roadmapId, userId, taskId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !roadmapId || !userId) return;
    const mentorId = getDirectorUserId() ?? getMentorUserId();
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
    const mentorId = getDirectorUserId() ?? getMentorUserId();
    if (!mentorId) {
      console.warn("No mentor session; cannot reply.");
      return;
    }

    try {
      await apiReplyToQuery(
        roadmapId,
        queryId,
        {
          repliedAnswer: answer,
          repliedMentorId: mentorId,
        },
        "pastor",
      );
      setQueryAnswers((prev) => ({ ...prev, [queryId]: "" }));
      await fetchQueries();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAnswerChange = (qid: string, value: string) => {
    setQueryAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const cancelMentorReplyEdit = () => {
    setEditingMentorReplyId(null);
    setMentorReplyDraft("");
  };

  const beginMentorReplyEdit = (repliedAnswer: string, queryId: string) => {
    setEditingMentorReplyId(queryId);
    setMentorReplyDraft(String(repliedAnswer ?? ""));
  };

  const handleSaveMentorReplyEdit = async (queryId: string) => {
    const text = mentorReplyDraft.trim();
    if (!text || !roadmapId) return;
    const mentorId = getDirectorUserId() ?? getMentorUserId();
    if (!mentorId) return;
    setReplyActionQueryId(queryId);
    try {
      await apiReplyToQuery(
        roadmapId,
        queryId,
        {
          repliedAnswer: text,
          repliedMentorId: mentorId,
        },
        "pastor",
      );
      cancelMentorReplyEdit();
      await fetchQueries();
    } catch (err) {
      console.error(err);
    } finally {
      setReplyActionQueryId(null);
    }
  };

  const handleDeleteMentorReply = async (queryId: string) => {
    if (!roadmapId) return;
    const mentorId = getDirectorUserId() ?? getMentorUserId();
    if (!mentorId) return;
    const ok = typeof window !== "undefined" ? window.confirm("Remove your reply from this query?") : false;
    if (!ok) return;
    setReplyActionQueryId(queryId);
    try {
      await apiDeleteQueryReply(roadmapId, queryId, mentorId, "pastor");
      cancelMentorReplyEdit();
      await fetchQueries();
    } catch (err) {
      console.error(err);
    } finally {
      setReplyActionQueryId(null);
    }
  };

  const pastorHomeHref = userId
  ? `/director/pastor-assignments?assignUser=${encodeURIComponent(userId)}`
  : "/director/pastor-assignments";
const phaseHref =
  userId && roadmapId
    ? `/director/revitalization-roadmap/phase?userId=${encodeURIComponent(userId)}&roadmapId=${encodeURIComponent(roadmapId)}`
    : null;

  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Pastor"
    : userId
      ? "…"
      : "Pastor";

  const taskTitle = String(task?.name ?? "Task");
  const taskDescription = String(task?.description ?? (task as { roadMapDetails?: unknown })?.roadMapDetails ?? "");

  if (loading) {
    return (
      <div className={directorPageRoot}>
        {/* <MentorHeader showFullHeader={true} /> */}
        <DirectorHero
          title="Task"
          subtitle="Loading…"
          image={HeroBg}
          breadcrumbItems={[
           { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: "Task" },
          ]}
          className="mb-6"
        />
        <div className="flex flex-1 items-center justify-center px-6 py-20">
          <div className={directorSpinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      {/* <MentorHeader showFullHeader={true} /> */}

      <DirectorHero
        title={task ? taskTitle : "Task"}
        subtitle="Read this pastor&apos;s submitted responses, add comments, and reply to queries."
        image={HeroBg}
        breadcrumbItems={[
          { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
          ...(userId ? [{ label: userName, href: pastorHomeHref }] : []),
          ...(phaseHref ? [{ label: phaseName ?? "Phase", href: phaseHref }] : []),
          { label: task ? taskTitle : "Task" },
        ]}
        className="mb-6"
      />

      {/* <main className={`${mentorRoadmapHubMain} pb-12`}>
        <div className="w-full"> */}
        <main className="flex-1 pb-12">
  <div className={`${directorPageContainer} max-w-7xl`}>
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
                    {(() => {
                      // const renderableExtras = pastorExtrasRows.filter(isRenderablePastorExtraRow);
//                       const allRenderableExtras = pastorExtrasRows.filter(isRenderablePastorExtraRow);

// const latestSubmitKey = allRenderableExtras
//   .map((item) =>
//     String(
//       item.submissionId ??
//         item.responseId ??
//         item.submitId ??
//         item.groupId ??
//         item.createdAt ??
//         item.updatedAt ??
//         "",
//     ),
//   )
//   .filter(Boolean)
//   .at(-1);

// const renderableExtras = latestSubmitKey
//   ? allRenderableExtras.filter((item) => {
//       const itemKey = String(
//         item.submissionId ??
//           item.responseId ??
//           item.submitId ??
//           item.groupId ??
//           item.createdAt ??
//           item.updatedAt ??
//           "",
//       );

//       return itemKey === latestSubmitKey;
//     })
//   : allRenderableExtras;

// const isUpdatedResponse = allRenderableExtras.length > renderableExtras.length;
// const pastorHasNoResponses = !extrasLoading && renderableExtras.length === 0;
const allRenderableExtras = pastorExtrasRows.filter(isRenderablePastorExtraRow);

const latestExtrasMap = new Map<string, Record<string, unknown>>();

allRenderableExtras.forEach((item) => {
  const type = String(item.type ?? "").toUpperCase();
  const label = String(item.name ?? item.key ?? "").trim().toLowerCase();

  const key = `${type}__${label}`;

  latestExtrasMap.set(key, item);
});

const renderableExtras = Array.from(latestExtrasMap.values());

const isUpdatedResponse = allRenderableExtras.length > renderableExtras.length;

const pastorHasNoResponses = !extrasLoading && renderableExtras.length === 0;
                      
const templateExtras = Array.isArray((task as any)?.extras)
  ? ((task as any).extras as Record<string, any>[])
  : [];

const answerByName = new Map<string, Record<string, unknown>>();

renderableExtras.forEach((item) => {
  const label = String(item.name ?? item.key ?? "").trim().toLowerCase();
  if (label) answerByName.set(label, item);
});

const renderAnswerCard = (
  item: Record<string, unknown>,
  idx: number,
  fallbackLabel?: string,
) => {
  const t = String(item.type ?? "").toUpperCase();
  const label = String(item.name ?? item.key ?? fallbackLabel ?? `Item ${idx + 1}`);
  // const uploadedFiles =
  // pastorUploadDocs[label.trim()] ??
  // pastorUploadDocs[label.trim().toLowerCase()] ??
  // [];
  const normalizedLabel = label.trim().toLowerCase();
const uploadedFiles = pastorUploadDocs[normalizedLabel] ?? [];
  const sig = item.signatureData !== undefined ? item.signatureData : undefined;
  const val = item.value !== undefined ? item.value : sig;

  if (t === "TEXT_DISPLAY") {
    return (
      <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-sm leading-relaxed text-[#cde2f2]">{label}</p>
      </div>
    );
  }

  const empty =
    val === undefined ||
    val === null ||
    (typeof val === "string" && val.trim() === "");

  if (t === "UPLOAD" && uploadedFiles.length > 0) {
    return (
      <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
          {label}
        </p>

        <div className="mt-3 space-y-2">
          {uploadedFiles.map((file) => (
            // <div
            //   key={`${file.fileUrl}-${file.fileName}`}
            //   onClick={() => window.open(file.fileUrl, "_blank")}
            //   className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
            // >
            //   <i className="fa-solid fa-file text-blue-300" />
            //   <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
            // </div>
            <div
  key={`${file.fileUrl}-${file.fileName}`}
  onClick={() => window.open(file.fileUrl, "_blank")}
  className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
>
  <i className="fa-solid fa-file text-blue-300" />
  <span className="min-w-0 flex-1 truncate">{file.fileName}</span>

  <button
    type="button"
    onClick={async (e) => {
      e.stopPropagation();

      if (navigator.share) {
        try {
          await navigator.share({
            title: file.fileName,
            url: file.fileUrl,
          });
          return;
        } catch {
          // user cancelled share
        }
      }

      await navigator.clipboard.writeText(file.fileUrl);
      alert("File link copied.");
    }}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-blue-200 hover:bg-white/15"
    title="Share"
  >
    <i className="fa-solid fa-share-nodes" />
  </button>

  <button
    type="button"
    onClick={async (e) => {
      e.stopPropagation();

      try {
        const response = await fetch(file.fileUrl);
        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = file.fileName || "download";
        document.body.appendChild(link);
        link.click();

        link.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        window.open(file.fileUrl, "_blank");
      }
    }}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-blue-200 hover:bg-white/15"
    title="Download"
  >
    <i className="fa-solid fa-download" />
  </button>
</div>
          ))}
        </div>
      </div>
    );
  }

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

  // if (typeof val === "boolean") {
  //   return (
  //     <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
  //       <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
  //         {label}
  //       </p>
  //       <p className="mt-1 text-sm text-white">{val ? "Yes" : "No"}</p>
  //     </div>
  //   );
  // }
  if (typeof val === "boolean") {
  return (
    <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
        {label}
      </p>

      <div className="mt-3 flex items-center gap-3 text-sm text-white">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border ${
            val
              ? "border-[#8ec5eb] bg-[#8ec5eb] text-[#062946]"
              : "border-white/35 bg-transparent"
          }`}
        >
          {val ? <i className="fa-solid fa-check text-xs" /> : null}
        </span>

        <span>{val ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}

  const str = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

  if (
    t === "SIGNATURE" &&
    typeof str === "string" &&
    (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:image"))
  ) {
    return (
      <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
          {label}
        </p>
        <div className="mt-3">
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
};

const readEntityId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return String(obj._id ?? obj.id ?? "").trim();
  }
  return String(value).trim();
};

const readAppointmentField = (appt: Record<string, any>, key: string): string => {
  const metadata = appt.metadata || appt.meta || appt.context || {};
  return String(appt[key] ?? metadata?.[key] ?? "").trim();
};

const notesContainToken = (notes: string, key: string, value?: string | null): boolean => {
  const target = String(value ?? "").trim();
  if (!target) return false;
  return notes.includes(`${key}:${target}`) || notes.includes(`${key}=${target}`);
};

const unwrapAppointments = (res: any): any[] => {
  const body = res?.data?.data ?? res?.data ?? [];
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.appointments)) return body.appointments;
  if (Array.isArray(body?.data)) return body.data;
  return [];
};

const renderTemplateExtra = (extra: Record<string, any>, idx: number): JSX.Element | null => {
  const type = String(extra.type ?? "").toUpperCase();
  const label = String(extra.name ?? "").trim();
if (type === "ASSESSMENT") {
  return (
    <div
      key={`assessment-${label}-${idx}`}
      className="rounded-xl border border-white/10 bg-white/[0.04] p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            Assessment submitted
          </h3>
          <p className="mt-1 text-sm text-[#cde2f2]">
            Pastor completed this roadmap assessment task.
          </p>
        </div>

        {/* <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            View Submitted Answers
          </button>

          <button
            type="button"
            className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            View Meeting Details
          </button>

          <button
            type="button"
            className="rounded-lg border border-white/15 bg-[#8ec5eb] px-4 py-2 text-sm font-semibold text-[#062946]"
          >
            View CDP
          </button>
        </div> */}
        <div className="flex flex-wrap gap-3">
  <button
    type="button"
    onClick={async () => {
      try {
        const assessmentId = String(
          extra?.assessmentId ??
            extra?.assessment?._id ??
            extra?.assessment ??
            extra?.selectedAssessment?._id ??
            extra?.selectedAssessment ??
            "",
        ).trim();

        if (!assessmentId || !userId) return;

        const res = await apiGetUserAnswers(assessmentId, userId);

        const answerData =
          (res?.data as any)?.data ?? res?.data;

        const answerId = String(
          answerData?._id ??
            answerData?.answerId ??
            "",
        ).trim();

        if (!answerId) return;

        router.push(
          `/director/assessments/result?assessmentId=${encodeURIComponent(
            assessmentId,
          )}&userId=${encodeURIComponent(
            userId,
          )}&answerId=${encodeURIComponent(answerId)}`,
        );
      } catch (err) {
        console.error("Failed to open assessment answers", err);
      }
    }}
    className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
  >
    View Submitted Answers
  </button>

  <button
    type="button"
    // onClick={async () => {
    //   try {
    //     const assessmentId = String(
    //       extra?.assessmentId ??
    //         extra?.assessment?._id ??
    //         extra?.assessment ??
    //         extra?.selectedAssessment?._id ??
    //         extra?.selectedAssessment ??
    //         "",
    //     ).trim();

    //     if (!assessmentId || !userId) return;

    //     const res = await apiGetAppointments({
    //       userId,
    //     });

    //     const appointments =
    //       ((res?.data as any)?.data ??
    //         res?.data ??
    //         []) as any[];

    //     const match = appointments.find((appt) => {
    //       const notes = String(appt?.notes || "");

    //       return (
    //         notes.includes(`assessmentId:${assessmentId}`) &&
    //         notes.includes(`taskId:${taskId || ""}`) &&
    //         notes.includes(`roadmapId:${roadmapId || ""}`)
    //       );
    //     });

    //     const appointmentId = String(
    //       match?._id ?? match?.id ?? "",
    //     ).trim();

    //     if (!appointmentId) return;

    //     router.push(
    //       `/director/schedule?appointmentId=${appointmentId}`,
    //     );
    //   } catch (err) {
    //     console.error("Failed to open meeting details", err);
    //   }
    // }}
    onClick={async () => {
  try {
    const assessmentId = String(
      extra?.assessmentId ??
        extra?.assessment?._id ??
        extra?.assessment ??
        extra?.selectedAssessment?._id ??
        extra?.selectedAssessment ??
        "",
    ).trim();

    if (!assessmentId || !userId) return;

    const res = await apiGetAppointments({
      userId,
      futureOnly: false,
    });

    const appointments = unwrapAppointments(res);

    const match = appointments
      .map((appt: any) => {
        const status = String(appt?.status ?? "").toLowerCase();
        if (status.includes("cancel")) return { appt, score: -1 };

        const notes = String(appt?.notes ?? "");
        let score = 0;

        if (
          readAppointmentField(appt, "assessmentId") === assessmentId ||
          notesContainToken(notes, "assessmentId", assessmentId)
        ) score += 10;

        if (
          roadmapId &&
          (readAppointmentField(appt, "roadmapId") === roadmapId ||
            notesContainToken(notes, "roadmapId", roadmapId))
        ) score += 4;

        if (
          taskId &&
          (readAppointmentField(appt, "taskId") === taskId ||
            notesContainToken(notes, "taskId", taskId))
        ) score += 4;

        return { appt, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)[0]?.appt;

    const appointmentId = String(match?._id ?? match?.id ?? "").trim();
    if (!appointmentId) return;

    router.push(`/director/schedule?appointmentId=${encodeURIComponent(appointmentId)}`);
  } catch (err) {
    console.error("Failed to open meeting details", err);
  }
}}
    className="rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
  >
    View Meeting Details
  </button>

  <button
    type="button"
    onClick={async () => {
      try {
        const assessmentId = String(
          extra?.assessmentId ??
            extra?.assessment?._id ??
            extra?.assessment ??
            extra?.selectedAssessment?._id ??
            extra?.selectedAssessment ??
            "",
        ).trim();

        if (!assessmentId || !userId) return;

        // const res = await apiGetSectionRecommendations(
        //   assessmentId,
        //   userId,
        // );

        // const recommendation =
        //   (res?.data as any)?.data ?? res?.data;

        // const recommendationId = String(
        //   recommendation?._id ??
        //     recommendation?.id ??
        //     "",
        // ).trim();

        // if (!recommendationId) return;

        // router.push(
        //   `/director/assessments/result?assessmentId=encodeURIComponent(
        //     assessmentId,
        //   )}&userId=${encodeURIComponent(
        //     userId,
        //   )}&viewCdp=1`,
        // );
        router.push(
  `/director/assessments/result?assessmentId=${encodeURIComponent(
    assessmentId,
  )}&userId=${encodeURIComponent(userId)}&viewCdp=1`,
);
      } catch (err) {
        console.error("Failed to open CDP", err);
      }
    }}
    className="rounded-lg border border-white/15 bg-[#8ec5eb] px-4 py-2 text-sm font-semibold text-[#062946]"
  >
    View CDP
  </button>
</div>
      </div>
    </div>
  );
}
  if (type === "SECTION") {
    const children = Array.isArray(extra.sections) ? extra.sections : [];

    return (
      <div
        key={`section-${label}-${idx}`}
        className="rounded-2xl border border-[#5A8DCB]/60 bg-white/[0.04] p-5"
      >
        <h4 className="mb-4 text-base font-semibold text-white">
          {label || "Section"}
        </h4>

        <div className="space-y-3">
          {children.length > 0 ? (
            children.map((child: Record<string, any>, childIdx: number) =>
              renderTemplateExtra(child, childIdx),
            )
          ) : (
            <p className="text-sm text-[#cde2f2]/65">No fields in this section.</p>
          )}
        </div>
      </div>
    );
  }

  const answer = answerByName.get(label.toLowerCase());

  if (!answer) {
    return renderAnswerCard(
      {
        type,
        name: label,
        value: undefined,
      },
      idx,
      label,
    );
  }

  return renderAnswerCard(answer, idx, label);
};

                      const dueRaw =
                        task &&
                        (task.endDate ??
                          task.dueDate ??
                          (task as Record<string, unknown>).due_date ??
                          (task as Record<string, unknown>).end_date);
                      const dueHeading =
                        typeof dueRaw === "string" && dueRaw.trim()
                          ? formatDueHeadingDate(dueRaw.trim())
                          : null;

                      return (
                        <>
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                            <h2 className="text-lg font-semibold text-white sm:text-xl">
  {isUpdatedResponse ? "Updated response" : "Pastor response"}
</h2>
                            {dueHeading ? (
                              <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-[#cde2f2]">
                                <i className="fa-regular fa-calendar text-[#8ec5eb]" aria-hidden />
                                <span>Due on {dueHeading}</span>
                              </div>
                            ) : null}
                          </div>

                          <p className="mb-6 text-sm text-[#cde2f2]">
                            {extrasLoading
                              ? "Loading this pastor's responses…"
                              : pastorHasNoResponses
                                ? "The response will be seen soon after the pastor completes the task."
                                : `Answers and progress saved by ${userName} for this task.`}
                          </p>

                          {taskDescription.trim() ? (
                            <details className="group mb-6 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 open:bg-white/[0.08]">
                              <summary className="cursor-pointer list-none text-sm font-semibold text-[#d9ebf8] [&::-webkit-details-marker]:hidden">
                                <span className="flex items-center gap-2">
                                  <i
                                    className="fa-solid fa-chevron-down text-xs text-[#8ec5eb] transition-transform group-open:rotate-180"
                                    aria-hidden
                                  />
                                  Task instructions
                                </span>
                              </summary>
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
                                {taskDescription}
                              </p>
                            </details>
                          ) : null}
                          {!pastorHasNoResponses ? (
  <h3 className="mb-4 text-lg font-semibold text-white">
    Pastor Tasks :
  </h3>
) : null}

                          {extrasLoading ? (
                            <div className="flex justify-center py-16">
                              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
                            </div>
                          ) : pastorHasNoResponses ? (
                            <div className="rounded-2xl border border-white/12 bg-[linear-gradient(180deg,rgba(24,90,130,0.35)_0%,rgba(9,52,86,0.5)_100%)] px-6 py-14 sm:px-10">
                              <div className="mx-auto flex max-w-lg flex-col items-center text-center">
                                <div className="relative mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/12 ring-1 ring-white/15">
                                  <i className="fa-regular fa-file-lines text-3xl text-[#e8f4fc]" aria-hidden />
                                  <span className="absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-[#0b3a5c] shadow-md">
                                    <i className="fa-regular fa-clock text-sm text-[#8ec5eb]" aria-hidden />
                                  </span>
                                </div>
                                <h3 className="text-lg font-bold text-white sm:text-xl">Task not submitted yet</h3>
                                <p className="mt-3 text-sm leading-relaxed text-[#cde2f2]/95">
                                  The pastor hasn&apos;t submitted their responses for this task yet. Once submitted,
                                  you will be able to review responses, add comments, and reply to queries.
                                </p>
                              </div>
                            </div>
                          ) : (
//                             <div className="space-y-1">
//                               {renderableExtras.map((item, idx) => {
//                               const t = String(item.type ?? "").toUpperCase();
//                               const label = String(item.name ?? item.key ?? `Item ${idx + 1}`);
//                               const uploadedFiles = pastorUploadDocs[label] ?? [];
//                               const sig =
//                                 item.signatureData !== undefined ? item.signatureData : undefined;
//                               const val = item.value !== undefined ? item.value : sig;

//                               if (t === "TEXT_DISPLAY") {
//                                 return (
//                                   <div
//                                     key={`${label}-${idx}`}
//                                     className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
//                                   >
//                                     <p className="text-sm leading-relaxed text-[#cde2f2]">{label}</p>
//                                   </div>
//                                 );
//                               }

//                               const empty =
//                                 val === undefined ||
//                                 val === null ||
//                                 (typeof val === "string" && val.trim() === "");

//                               if (empty) {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <p className="mt-1 text-sm text-[#cde2f2]/65">No answer submitted.</p>
//                                   </div>
//                                 );
//                               }
// if (t === "UPLOAD" && uploadedFiles.length > 0) {
//   return (
//     <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//       <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//         {label}
//       </p>

//       <div className="mt-3 space-y-2">
//         {uploadedFiles.map((file) => (
//           <div
//             key={`${file.fileUrl}-${file.fileName}`}
//             onClick={() => window.open(file.fileUrl, "_blank")}
//             className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white hover:bg-white/[0.08]"
//           >
//             <i className="fa-solid fa-file text-blue-300" />
//             <span className="min-w-0 flex-1 truncate">{file.fileName}</span>

//             <button
//               type="button"
//               onClick={async (e) => {
//                 e.stopPropagation();

//                 try {
//                   const response = await fetch(file.fileUrl);
//                   const blob = await response.blob();

//                   const url = window.URL.createObjectURL(blob);
//                   const link = document.createElement("a");

//                   link.href = url;
//                   link.download = file.fileName || "download";
//                   document.body.appendChild(link);
//                   link.click();

//                   link.remove();
//                   window.URL.revokeObjectURL(url);
//                 } catch {
//                   window.open(file.fileUrl, "_blank");
//                 }
//               }}
//               className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/10 text-blue-200 hover:bg-white/15"
//               title="Download"
//             >
//               <i className="fa-solid fa-download" />
//             </button>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }
//                               if (typeof val === "boolean") {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <p className="mt-1 text-sm text-white">{val ? "Yes" : "No"}</p>
//                                   </div>
//                                 );
//                               }

//                               const str =
//                                 typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);

//                               if (
//                                 t === "SIGNATURE" &&
//                                 typeof str === "string" &&
//                                 (str.startsWith("http://") ||
//                                   str.startsWith("https://") ||
//                                   str.startsWith("data:image"))
//                               ) {
//                                 return (
//                                   <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                     <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                       {label}
//                                     </p>
//                                     <div className="mt-3">
//                                       {/* eslint-disable-next-line @next/next/no-img-element */}
//                                       <img
//                                         src={str}
//                                         alt=""
//                                         className="max-h-48 max-w-full rounded-lg border border-white/15 object-contain"
//                                       />
//                                     </div>
//                                   </div>
//                                 );
//                               }

//                               return (
//                                 <div key={`${label}-${idx}`} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
//                                   <p className="text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
//                                     {label}
//                                   </p>
//                                   <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#cde2f2]">
//                                     {str}
//                                   </p>
//                                 </div>
//                               );
//                             })}
//                             </div>

  <div className="space-y-4">
    {templateExtras.length > 0
      ? templateExtras.map((extra, idx) => renderTemplateExtra(extra, idx))
      : renderableExtras.map((item, idx) => renderAnswerCard(item, idx))}
  </div>
)}
                          
                        </>
                      );
                    })()}
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
                      {(() => {
                        const loggedInMentorId = getMentorUserId() ?? "";
                        return queries.map((query) => {
                        const q = query as {
                          _id: string;
                          actualQueryText?: string;
                          createdDate?: string;
                          status?: string;
                          repliedAnswer?: string;
                          repliedDate?: string;
                          repliedMentorId?: {
                            _id?: string;
                            firstName?: string;
                            lastName?: string;
                            profilePicture?: string;
                            role?: string;
                          };
                        };
                        const isAnswered = q.status === "answered" || Boolean(q.repliedAnswer?.trim());

                        const replierId = q.repliedMentorId?._id
                          ? String(q.repliedMentorId._id)
                          : "";
                        const canManageMentorReply = Boolean(
                          loggedInMentorId &&
                            replierId &&
                            loggedInMentorId.trim() !== "" &&
                            loggedInMentorId === replierId,
                        );

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
                                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                                      <div>
                                        <h4 className="text-sm font-semibold text-white">
                                          {q.repliedMentorId
                                            ? `${q.repliedMentorId.firstName ?? ""} ${q.repliedMentorId.lastName ?? ""}`.trim() ||
                                              "Mentor"
                                            : "Mentor"}
                                        </h4>
                                        {q.repliedDate ? (
                                          <p className="mt-1 text-xs text-[#cde2f2]/75">{formatDate(q.repliedDate)}</p>
                                        ) : null}
                                      </div>
                                      {canManageMentorReply && queryTab === "Answered" ? (
                                        <div className="flex flex-wrap gap-2">
                                          {editingMentorReplyId === q._id ? (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() => void handleSaveMentorReplyEdit(q._id)}
                                                disabled={
                                                  Boolean(replyActionQueryId) || !mentorReplyDraft.trim()
                                                }
                                                className="rounded-lg border border-white/15 bg-[#8ec5eb] px-3 py-1.5 text-[11px] font-semibold text-[#062946] disabled:opacity-50"
                                              >
                                                {replyActionQueryId === q._id ? "Saving…" : "Save"}
                                              </button>
                                              <button
                                                type="button"
                                                onClick={cancelMentorReplyEdit}
                                                disabled={Boolean(replyActionQueryId)}
                                                className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-[#cde2f2] hover:bg-white/10 disabled:opacity-50"
                                              >
                                                Cancel
                                              </button>
                                            </>
                                          ) : (
                                            <>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  beginMentorReplyEdit(String(q.repliedAnswer ?? ""), q._id)
                                                }
                                                disabled={Boolean(replyActionQueryId)}
                                                className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-semibold text-[#cde2f2] hover:bg-white/10 disabled:opacity-50"
                                              >
                                                Edit
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => void handleDeleteMentorReply(q._id)}
                                                disabled={Boolean(replyActionQueryId)}
                                                className="rounded-lg border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-[11px] font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50"
                                              >
                                                Delete
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      ) : null}
                                    </div>
                                    {q.repliedMentorId?.role ? (
                                      <p className="mb-2 text-xs capitalize text-[#cde2f2]/70">
                                        {q.repliedMentorId.role}
                                      </p>
                                    ) : null}
                                    {editingMentorReplyId === q._id ? (
                                      <textarea
                                        value={mentorReplyDraft}
                                        onChange={(e) => setMentorReplyDraft(e.target.value)}
                                        rows={4}
                                        className="mt-1 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm leading-relaxed text-[#cde2f2] placeholder:text-[#cde2f2]/40 focus:border-[#8ec5eb]/50 focus:outline-none"
                                      />
                                    ) : (
                                      <p className="text-sm leading-relaxed text-[#cde2f2]">{q.repliedAnswer}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ) : null}

                            {queryTab === "Answered" && !isAnswered ? (
                              <p className="ml-0 text-sm text-[#cde2f2]/70 sm:ml-12">No reply recorded yet.</p>
                            ) : null}

                          </div>
                        );
                      });
                      })()}
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
        <div className={`${directorPageRoot} flex flex-1 items-center justify-center py-24 text-[#cde2f2]`}>
          <div className={directorSpinner} />
        </div>
      }
    >
      <TaskPageContent />
    </Suspense>
  );
}
