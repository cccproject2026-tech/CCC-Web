"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import UserProfile from "@/app/Assets/user-profile.png";
import { apiAddComment, apiGetComments, apiGetQueries, apiGetRoadmapById, apiReplyToQuery } from "@/app/Services/roadmaps.service";
import { apiGetUserById } from "@/app/Services/users.service";
import MentorHeader from "@/app/Components/MentorHeader";

function JumpStartPageContent() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const [queryTab, setQueryTab] = useState("Pending");
  const [queryAnswers, setQueryAnswers] = useState<{ [key: string]: string }>({})

  const searchParams = useSearchParams();

  const userId = searchParams.get("userId");
  const roadmapId = searchParams.get("roadmapId");

  const [roadmap, setRoadmap] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [comments, setComments] = useState<any[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
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

        const roadmapRes = await apiGetRoadmapById(roadmapId);

        setRoadmap(roadmapRes.data?.data);

        await Promise.allSettled([
          fetchComments(),
          fetchQueries()
        ]);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

  }, [roadmapId, userId]);

  const fetchComments = async () => {
    try {
      if (!roadmapId || !userId) return;

      const res = await apiGetComments(roadmapId, userId);

      setComments(res?.data?.data || []);

    } catch (err) {
      console.error("Comments API missing or failing");
      setComments([]);
    }
  };

  const fetchQueries = async () => {
    try {
      if (!roadmapId || !userId) return;

      const res = await apiGetQueries(roadmapId, userId);

      setQueries(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch queries", err);
    }
  };

  const handleSendComment = async () => {

    if (!newComment.trim()) return;

    if (!roadmapId || !userId) return;

    try {

      await apiAddComment(roadmapId, {
        text: newComment,
        userId: userId,
        mentorId: userId
      });

      setNewComment("");

      await fetchComments();

    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleSendAnswer = async (queryId: string) => {

    const answer = queryAnswers[queryId];

    if (!answer?.trim()) return;

    if (!roadmapId || !userId) return;

    try {

      await apiReplyToQuery(roadmapId, queryId, {
        repliedAnswer: answer,
        repliedMentorId: userId
      });

      setQueryAnswers(prev => ({
        ...prev,
        [queryId]: ""
      }));

      await fetchQueries();

    } catch (err) {
      console.error("Failed to reply query", err);
    }

  };

  const handleAnswerChange = (queryId: string, value: string) => {

    setQueryAnswers(prev => ({
      ...prev,
      [queryId]: value
    }));

  };

  const descriptionPoints = roadmap?.roadmaps || [];

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
        status={{ label: "Completed", color: "green" }}
        completedOn="20 Oct 2024"
        heightClasses="h-[280px]"
      />

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
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
                      2
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
                      3
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
                      Session Date
                    </label>
                    <div className="relative">
                      <i className="fa-solid fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-white/60 pointer-events-none"></i>
                      <input
                        type="text"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        onFocus={(e) => (e.target.type = "date")}
                        onBlur={(e) => {
                          if (!e.target.value) {
                            e.target.type = "text";
                          }
                        }}
                        placeholder="Select Date"
                        className="w-full pl-10 pr-4 py-3 border-2 border-white/30 rounded-lg text-white bg-white/10 focus:outline-none focus:border-white/50 placeholder-white/50"
                      />
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
                        className="w-12 h-12 bg-[#B8E6FF] text-[#2E3B8E] rounded-full flex items-center justify-center hover:bg-[#A0D9FF] transition-all"
                      >
                        <i className="fa-solid fa-paper-plane"></i>
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment: any) => (
                      <div
                        key={comment._id}
                        className="bg-white rounded-lg shadow-sm p-5 relative"
                      >

                        <div className="flex gap-4">

                          <Image
                            src={comment.user?.profileImage || UserProfile}
                            alt="user"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />

                          <div className="flex-1">

                            <div className="flex items-center gap-2 mb-1">

                              <h4 className="font-semibold text-sm text-gray-800">
                                {comment.user?.firstName} {comment.user?.lastName}
                              </h4>

                              <span className="text-xs text-gray-500">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>

                            </div>

                            <p className="text-sm text-gray-700">
                              {comment.text}
                            </p>

                          </div>

                        </div>

                      </div>
                    ))}
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
                    {queries.map((query, index) => (
                      <div key={query._id}>
                        <div className="pb-5">
                          {/* User Query Section */}
                          <div className="flex gap-4 mb-4">
                            <Image
                              src={query.avatar}
                              alt={query.name}
                              width={40}
                              height={40}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm text-white">
                                  {query.name}
                                </h4>
                                <span className="text-xs text-white/70">
                                  {query.date}
                                </span>
                              </div>
                              <p className="text-sm text-white">{query.actualQueryText}</p>
                            </div>
                          </div>

                          {/* Answer Section - Conditional Rendering */}
                          {queryTab === "Pending" ? (
                            /* Answer Input Section for Pending */
                            <div className="flex gap-2 border border-[#7489ae] rounded-lg bg-[#375a96] p-1">
                              <input
                                type="text"
                                value={queryAnswers[query._id] || ""}
                                onChange={(e) => handleAnswerChange(query._id, e.target.value)}
                                placeholder="Write Your Answer here..."
                                className="flex-1 px-4 py-3 bg-[#375a96] text-white rounded-md focus:outline-none placeholder-gray-400"
                              />
                              <button
                                onClick={() => handleSendAnswer(query._id)}
                                className="w-12 h-12 bg-[#1e366f] border border-[#7489ae] rounded-lg flex items-center justify-center hover:bg-[#1a2e5c] transition-all"
                              >
                                <i className="fa-regular fa-paper-plane text-white"></i>
                              </button>
                            </div>
                          ) : (
                            /* Mentor Answer Section for Answered */
                            query.answer && (
                              <div className="ml-14 mb-4">
                                <div className="bg-[#375a96] rounded-lg p-4">
                                  <div className="flex gap-4 mb-4">

                                    <Image
                                      src={query.user?.profileImage || UserProfile}
                                      alt="user"
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full"
                                    />

                                    <div className="flex-1">

                                      <div className="flex items-center gap-2 mb-1">

                                        <h4 className="font-semibold text-sm text-white">
                                          {query.user?.firstName} {query.user?.lastName}
                                        </h4>

                                        <span className="text-xs text-white/70">
                                          {new Date(query.createdAt).toLocaleDateString()}
                                        </span>

                                      </div>

                                      <p className="text-sm text-white">
                                        {query.actualQueryText}
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
                    ))}
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
