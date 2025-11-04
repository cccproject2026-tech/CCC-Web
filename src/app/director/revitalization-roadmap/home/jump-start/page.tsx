"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import UserProfile from "@/app/Assets/user-profile.png";

export default function JumpStartPage() {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const [queryTab, setQueryTab] = useState("Pending");
  const [queryAnswers, setQueryAnswers] = useState<{ [key: number]: string }>(
    {}
  );

  const comments = [
    {
      id: 1,
      name: "John Doe",
      role: "Mentor",
      time: "9:41 am",
      text: "Needs improvement. Refer XYZ document",
      avatar: UserProfile,
    },
    {
      id: 2,
      name: "Robin Roe",
      role: "Project Manager",
      time: "Yesterday",
      text: "No need to spend time researching this area. Focus on the other sub group.",
      avatar: UserProfile,
    },
    {
      id: 3,
      name: "Robin Roe",
      role: "Project Manager",
      time: "Yesterday",
      text: "No need to spend time researching this area. Focus on the other sub group.",
      avatar: UserProfile,
    },
    {
      id: 4,
      name: "Robin Roe",
      role: "Mentor",
      time: "10/11/2024",
      text: "Needs improvement. Refer XYZ document",
      avatar: UserProfile,
    },
  ];

  const handleSendComment = () => {
    if (newComment.trim()) {
      console.log("New comment:", newComment);
      setNewComment("");
      // Add comment to list
    }
  };

  const queries = [
    {
      id: 1,
      name: "Me",
      date: "22/09/2024",
      text: "Is it possible for you to get me a letter stating that my volunteering is part of this course to submit to my church committee?",
      avatar: UserProfile,
      answer: {
        mentor: "John Doe",
        date: "22/09/2024",
        role: "Mentor",
        text: "I do not have the authority to do that. Please contact Project Manager",
        avatar: UserProfile,
      },
    },
    {
      id: 2,
      name: "Me",
      date: "12/09/2024",
      text: "Is it possible for you to get me a letter stating that my volunteering is part of this course to submit to my church committee?",
      avatar: UserProfile,
      answer: {
        mentor: "John Doe",
        date: "13/09/2024",
        role: "Mentor",
        text: "I do not have the authority to do that. Please contact Project Manager",
        avatar: UserProfile,
      },
    },
  ];

  const handleSendAnswer = (queryId: number) => {
    if (queryAnswers[queryId]?.trim()) {
      console.log("Answer for query", queryId, ":", queryAnswers[queryId]);
      setQueryAnswers((prev) => ({ ...prev, [queryId]: "" }));
      // Handle answer submission
    }
  };

  const handleAnswerChange = (queryId: number, value: string) => {
    setQueryAnswers((prev) => ({ ...prev, [queryId]: value }));
  };

  const descriptionPoints = [
    "Christ Method Alone (Why & How)",
    "Self-Leadership",
    "Dealing with Resistance",
    "Empower Others-Spiritual Renewal",
    "Community Engagement - Need Assessments",
    "Cycle of Evangelism & Discipleship",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={JumpStartBg.src}
        title="Jump Start"
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "/director/revitalization-roadmap/home" },
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap/home",
          },
          { label: "Jump Start" },
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
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === "overview"
                        ? "bg-[#2E3B8E] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    Over View
                  </button>
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
                      activeTab === "comments"
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
                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-all flex items-center justify-between ${
                      activeTab === "queries"
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
                      value="Attend a Jump-start Session in your area."
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
                      {descriptionPoints.map((point, index) => (
                        <li
                          key={index}
                          className="text-white text-base leading-relaxed"
                        >
                          {point}
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
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="bg-white rounded-lg shadow-sm p-5 relative"
                      >
                        {/* Yellow dot indicator */}
                        <div className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full"></div>

                        <div className="flex gap-4">
                          <Image
                            src={comment.avatar}
                            alt={comment.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm text-gray-800">
                                {comment.name}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {comment.time}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              {comment.role}
                            </p>
                            <p className="text-sm text-gray-700">
                              {comment.text}
                            </p>
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div className="flex gap-4 mt-4 justify-end">
                          <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                            <i className="fa-regular fa-envelope text-base"></i>
                          </button>
                          <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                            <i className="fa-regular fa-comment text-base"></i>
                          </button>
                          <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                            <i className="fa-regular fa-comment-dots text-base"></i>
                          </button>
                          <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                            <i className="fa-solid fa-phone text-base"></i>
                          </button>
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
                          className={`px-4 py-2 rounded-md font-semibold transition-all ${
                            queryTab === "Pending"
                              ? "bg-[#2E3B8E] text-white"
                              : "text-gray-600 hover:text-gray-800"
                          }`}
                        >
                          Pending
                        </button>
                        <button
                          onClick={() => setQueryTab("Answered")}
                          className={`px-4 py-2 rounded-md font-semibold transition-all ${
                            queryTab === "Answered"
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
                      <div key={query.id}>
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
                              <p className="text-sm text-white">{query.text}</p>
                            </div>
                          </div>

                          {/* Answer Section - Conditional Rendering */}
                          {queryTab === "Pending" ? (
                            /* Answer Input Section for Pending */
                            <div className="flex gap-2 border border-[#7489ae] rounded-lg bg-[#375a96] p-1">
                              <input
                                type="text"
                                value={queryAnswers[query.id] || ""}
                                onChange={(e) =>
                                  handleAnswerChange(query.id, e.target.value)
                                }
                                placeholder="Write Your Answer here..."
                                className="flex-1 px-4 py-3 bg-[#375a96] text-white rounded-md focus:outline-none placeholder-gray-400"
                              />
                              <button
                                onClick={() => handleSendAnswer(query.id)}
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
                                  <div className="flex gap-4">
                                    <Image
                                      src={query.answer.avatar}
                                      alt={query.answer.mentor}
                                      width={40}
                                      height={40}
                                      className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-sm text-white">
                                          {query.answer.mentor}
                                        </h4>
                                        <span className="text-xs text-white/70">
                                          {query.answer.date}
                                        </span>
                                      </div>
                                      <p className="text-xs text-white/70 mb-2">
                                        {query.answer.role}
                                      </p>
                                      <p className="text-sm text-white">
                                        {query.answer.text}
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
