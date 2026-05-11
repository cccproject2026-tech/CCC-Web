"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import SelfRevitalizationHeroBg from "@/app/Assets/self-revitalization-hero.png";
import UserProfile from "@/app/Assets/user-profile.png";
import CMALogo from "@/app/Assets/CMA logo.png";

// Helper function to convert title to slug
const titleToSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Helper function to convert slug to title (with mapping for exact matches)
const slugToTitle = (slug: string): string => {
  const titleMap: { [key: string]: string } = {
    "12-month-mentoring-revitalization-roadmap-approval":
      "12-Month Mentoring Revitalization Roadmap Approval",
    "prayer-visit-strategy": "Prayer & Visit Strategy",
    "prayer-visitation-strategy": "Prayer and Visitation Strategy",
    "pastoral-ministry-profile-pmp": "Pastoral Ministry Profile (PMP)",
    "church-assessment-evaluation-cma": "Church Assessment Evaluation (CMA)",
    "gods-vision-for-your-church": "God's Vision for your Church",
    calendar: "Calendar",
    "identify-a-member-disciple": "Identify a Member/Disciple",
    "community-engagement-project": "Community Engagement Project",
  };
  return (
    titleMap[slug] ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export default function SelfRevitalizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [notes, setNotes] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [newComment, setNewComment] = useState("");
  const [queryTab, setQueryTab] = useState("Pending");
  const [queryAnswers, setQueryAnswers] = useState<{ [key: number]: string }>(
    {}
  );
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const title = slug ? slugToTitle(slug) : "";

  // Get item-specific data based on slug
  const getItemData = () => {
    const itemDataMap: {
      [key: string]: {
        roadmap: string;
        description: string | string[];
        descriptionList?: string[];
        status?: string;
        completedOn?: string;
        lastUpdatedOn?: string;
        completionTime?: string;
        hasUploads?: boolean;
        uploads?: Array<{ name: string; date: string }>;
        hasSurveyButton?: boolean;
        surveyButtonText?: string;
      };
    } = {
      "12-month-mentoring-revitalization-roadmap-approval": {
        roadmap: "Sign 12-Month Revitalization Roadmap",
        description:
          "12-Month Revitalization Roadmap for pastoral mentoring and church growth",
        descriptionList: [
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
          "12-Month Mentoring Timeline for Pastoral and Church Growth",
        ],
        status: "Completed",
        completedOn: "20 Oct 2024",
      },
      "prayer-visit-strategy": {
        roadmap: "Create a prayer and visitation strategy",
        description:
          "Develop a prayer and visitation strategy and upload document",
        status: "Completed",
        completedOn: "20 Oct 2024",
        lastUpdatedOn: "20 Oct 2024",
        hasUploads: true,
        uploads: [
          { name: "My Strategy 1.pdf", date: "20 Oct 2024" },
          { name: "My Strategy 2.pdf", date: "20 Oct 2024" },
        ],
      },
      "pastoral-ministry-profile-pmp": {
        roadmap: "Complete a Pastoral Ministry Profile (PMP)",
        description: "Complete a personal pastoral assessment",
        completionTime: "Months 1 - 2",
        hasSurveyButton: true,
        surveyButtonText: "View PMP Survey",
      },
    };

    return (
      itemDataMap[slug] || {
        roadmap:
          title || "Interested in receiving mentoring in community engagement",
        description: "Personal Spiritual Growth and Renewal",
      }
    );
  };

  const itemData = getItemData();

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
  ];

  const handleSendComment = () => {
    if (newComment.trim()) {
      console.log("New comment:", newComment);
      setNewComment("");
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
  ];

  const handleSendAnswer = (queryId: number) => {
    if (queryAnswers[queryId]?.trim()) {
      console.log("Answer for query", queryId, ":", queryAnswers[queryId]);
      setQueryAnswers((prev) => ({ ...prev, [queryId]: "" }));
    }
  };

  const handleAnswerChange = (queryId: number, value: string) => {
    setQueryAnswers((prev) => ({ ...prev, [queryId]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={SelfRevitalizationHeroBg.src}
        title={title}
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "/director/revitalization-roadmap" },
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap",
          },
          {
            label: "Self Revitalization Phase",
            href: "/director/revitalization-roadmap/self-revitalization",
          },
          { label: title },
        ]}
        status={
          itemData.status
            ? {
                label: itemData.status,
                color: itemData.status === "Completed" ? "green" : "red",
              }
            : undefined
        }
        completedOn={itemData.completedOn}
        lastUpdatedOn={itemData.lastUpdatedOn}
        completionTime={itemData.completionTime}
        heightClasses="h-[280px]"
      />

      {/* Main Content */}
      <main className="flex-1 py-10">
        <div className="w-full">
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
                      value={itemData.roadmap}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent focus:outline-none focus:border-white/50 placeholder-white/50"
                      placeholder={itemData.roadmap}
                    />
                  </div>

                  {/* Description Section 1 - Text Area */}
                  {typeof itemData.description === "string" && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-4">
                        Description
                      </label>
                      <textarea
                        value={itemData.description}
                        readOnly
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent focus:outline-none focus:border-white/50 resize-none"
                      />
                    </div>
                  )}

                  {/* Description Section 2 - Numbered List (for 12-month roadmap) */}
                  {itemData.descriptionList && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-4">
                        Description
                      </label>
                      <div className="bg-transparent border-2 border-white/30 rounded-lg p-4 w-full">
                        <ol className="space-y-2 list-decimal list-inside">
                          {itemData.descriptionList.map((point, index) => (
                            <li
                              key={index}
                              className="text-white text-base leading-relaxed"
                            >
                              {point}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Agreement Checkbox (below description list) */}
                      {slug ===
                        "12-month-mentoring-revitalization-roadmap-approval" && (
                        <div className="mt-4">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="mt-1 w-5 h-5 rounded border-gray-300 text-[#2E3B8E] focus:ring-[#2E3B8E]"
                            />
                            <span className="text-white text-sm">
                              I agree to participate in the 12-month
                              revitalization mentoring and church growth roadmap
                              provided by The Center for Community Change
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Uploads Section (for Prayer & Visit Strategy) */}
                  {itemData.hasUploads && itemData.uploads && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-4">
                        Uploads
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {itemData.uploads.map((upload, index) => (
                          <div
                            key={index}
                            className="bg-white rounded-lg p-4 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <i className="fa-regular fa-file-pdf text-red-600 text-2xl"></i>
                              <div>
                                <p className="text-gray-800 font-semibold">
                                  {upload.name}
                                </p>
                                <p className="text-gray-500 text-sm">
                                  {upload.date}
                                </p>
                              </div>
                            </div>
                            <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                              <i className="fa-solid fa-download text-xl"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Survey Button (for PMP) */}
                  {itemData.hasSurveyButton && (
                    <div className="mb-6 flex justify-end">
                      <button
                        onClick={() => setShowSurveyModal(true)}
                        className="bg-[#2E3B8E] text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#1F2A6E] transition-all"
                      >
                        {itemData.surveyButtonText}
                      </button>
                    </div>
                  )}

                  {/* Signature Section (for specific items) */}
                  {slug ===
                    "12-month-mentoring-revitalization-roadmap-approval" && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-2">
                        Signature
                      </label>
                      <div className="bg-white rounded-lg p-4 flex items-center justify-between w-[45%] max-w-md">
                        <div className="flex items-center gap-3">
                          <i className="fa-regular fa-file-pdf text-red-600 text-2xl"></i>
                          <div>
                            <p className="text-gray-800 font-semibold">
                              Signature.pdf
                            </p>
                            <p className="text-gray-500 text-sm">
                              {itemData.completedOn}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                          <i className="fa-solid fa-download text-xl"></i>
                        </button>
                      </div>
                    </div>
                  )}
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

                  <div className="h-px bg-[#B8E6FF] mb-6"></div>

                  <div className="space-y-0">
                    {queries.map((query, index) => (
                      <div key={query.id}>
                        <div className="pb-5">
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

                          {queryTab === "Pending" ? (
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

      {/* Survey Modal */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Teal Header */}
            <div className="bg-[#03a7ab] px-8 py-6 relative">
              <button
                onClick={() => setShowSurveyModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-[#007a80] rounded-full flex items-center justify-center hover:bg-[#006b70] transition-all"
              >
                <i className="fa-solid fa-times text-white text-lg"></i>
              </button>

              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-white text-3xl font-bold mb-2">
                    {slug === "pastoral-ministry-profile-pmp"
                      ? "Pastoral Ministry Profile (PMP)"
                      : "Church Assessment Evaluation (CMA)"}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {slug === "pastoral-ministry-profile-pmp"
                      ? "This survey is about your current personal well being"
                      : "This Assessment is about your current personal well being"}
                  </p>
                </div>

                {/* CMA Logo on right */}
                <div className="text-right">
                  <Image
                    src={CMALogo}
                    alt="CMA Logo"
                    width={120}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>

            {/* White Content Area */}
            <div className="flex-1 overflow-y-auto p-8">
              <h3 className="text-black text-xl font-bold mb-6">
                Survey Guidelines
              </h3>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2E3B8E] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base">
                    Please complete the survey in a single session without
                    taking breaks.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2E3B8E] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base">
                    If there is a power outage or loss of internet connection,
                    the survey will restart from the beginning.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2E3B8E] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base">
                    You will not be able to return to previous sections.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2E3B8E] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base">
                    This survey consists of 5 sections to complete.
                  </p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-[#2E3B8E] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-700 text-base">
                    The survey should take approximately 45 minutes to complete.
                  </p>
                </li>
              </ul>

              {/* Next Button - Flex End */}
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => {
                    setShowSurveyModal(false);
                    router.push(
                      `/director/revitalization-roadmap/self-revitalization/${slug}/survey`
                    );
                  }}
                  className="bg-[#2E3B8E] text-white rounded-lg px-8 py-3 text-sm font-semibold hover:bg-[#1F2A6E] transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
