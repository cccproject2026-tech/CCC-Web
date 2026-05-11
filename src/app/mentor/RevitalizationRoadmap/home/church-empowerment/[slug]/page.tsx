"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/Header/AppHeader";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import SelfRevitalizationHeroBg from "@/app/Assets/self-revitalization-hero.png";
import UserProfile from "@/app/Assets/user-profile.png";

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
    "community-engagement-project": "Community Engagement Project",
    "facility-review": "Facility Review",
    "welcome-team": "Welcome Team",
    "guest-contact-information": "Guest Contact Information",
    "community-assessment": "Community Assessment",
    "community-engagement-events": "Community Engagement Events",
    "empower-ministry-leaders": "Empower Ministry Leaders",
    "leadership-development": "Leadership Development",
    "god-s-vision-team": "God's Vision Team",
    "gods-vision-team": "God's Vision Team",
    "calendar": "Calendar",
    "prayer": "Prayer",
    "mentoring-conversations": "Mentoring Conversations",
    "secret-guest": "Secret Guest",
    "god-moments": "God-Moments",
    "share-your-vision": "Share your Vision",
    "calendar-of-events": "Calendar of Events",
    "preaching-calendar": "Preaching Calendar",
    "proclamation-event-team": "Proclamation Event Team",
  };
  return (
    titleMap[slug] ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export default function ChurchEmpowermentDetailPage() {
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
  const [selectedDate, setSelectedDate] = useState("");
  const [prayerList, setPrayerList] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const title = slug ? slugToTitle(slug) : "";

  // Get item-specific data based on slug
  const getItemData = () => {
    const itemDataMap: {
      [key: string]: {
        roadmap: string;
        description: string;
        status?: string;
        completedOn?: string;
        lastUpdatedOn?: string;
        completionTime?: string;
        projectDate?: boolean;
        showDateSelector?: boolean;
        dateLabel?: string;
        hasSharedMedia?: boolean;
        hasFileCard?: boolean;
        fileCardLabel?: string;
        fileName?: string;
        fileDate?: string;
        hasPrayerList?: boolean;
        prayerListPlaceholder?: string;
        hasUploadSection?: boolean;
        uploadLabel?: string;
      };
    } = {
      "community-engagement-project": {
        roadmap: "The church will complete a community engagement project",
        description:
          "Complete a community engagement project with the member/disciple and share the stories of God's work",
        status: "Completed",
        completedOn: "20 Oct 2024",
        completionTime: "Months 3-4",
        projectDate: true,
        showDateSelector: true,
        dateLabel: "Project Date",
        hasSharedMedia: true,
      },
      "facility-review": {
        roadmap: "Complete a review of your facility",
        description:
          "Complete a review of your facility and make the necessary minor adjustments to make it more visitor friendly",
        completionTime: "Months 3-4",
      },
      "welcome-team": {
        roadmap: "Develop a welcome team strategy",
        description:
          "Develop a welcome team strategy and begin implementing that strategy, include a secret quest",
        completionTime: "Months 3-4",
        showDateSelector: true,
        dateLabel: "Secret Guest Date",
      },
      "guest-contact-information": {
        roadmap: "Begin collecting guest contact information",
        description:
          "Begin collecting guest contact information and measure guest follow-up",
        completionTime: "Months 3-4",
      },
      "community-assessment": {
        roadmap: "Refine your understanding of community needs",
        description:
          "Refine your understanding of the needs in your community by using a community assessment tool",
        completionTime: "Months 5-6",
      },
      "community-engagement-events": {
        roadmap: "Plan community engagement events",
        description:
          "Plan two community engagement events with at least 1 follow-up bridge event that addresses felt needs in the community",
        completionTime: "Months 5-6",
      },
      "empower-ministry-leaders": {
        roadmap: "Begin empowering ministry leaders",
        description:
          "Begin empowering ministry leaders into calendar activities in the worship service and offering a regular new member opportunities to come to the church service. Include a lay Bible worker role",
        completionTime: "Months 7-9",
      },
      "leadership-development": {
        roadmap: "Develop and train church leadership",
        description:
          "Develop and train church leadership for sustainable growth",
        completionTime: "Months 7-9",
      },
      "god-s-vision-team": {
        roadmap: "Create a Vision team",
        description:
          "Create a team meeting schedule through the end of the year for the vision team.",
        completionTime: "Months 3-4",
        hasFileCard: true,
        fileCardLabel: "Team Schedule",
        fileName: "Team Schedule 1.pdf",
        fileDate: "20 Oct 2024",
      },
      "gods-vision-team": {
        roadmap: "Create a Vision team",
        description:
          "Create a team meeting schedule through the end of the year for the vision team.",
        completionTime: "Months 3-4",
        hasFileCard: true,
        fileCardLabel: "Team Schedule",
        fileName: "Team Schedule 1.pdf",
        fileDate: "20 Oct 2024",
      },
      "calendar": {
        roadmap: "Create preaching calendar.",
        description: "Finalize a schedule through the end of the year.",
        completionTime: "Months 3-4",
        hasFileCard: true,
        fileCardLabel: "Calendar",
        fileName: "Calendar 1.pdf",
        fileDate: "20 Oct 2024",
      },
      "prayer": {
        roadmap: "Prioritize Church Prayer",
        description:
          "Prioritize church prayer opportunities and meet consistently for prayer with your congregation",
        completionTime: "Months 3-4",
        hasPrayerList: true,
        prayerListPlaceholder: "Enter list of prayer opportunities here...",
        hasUploadSection: true,
        uploadLabel: "Upload Calendar",
      },
      "mentoring-conversations": {
        roadmap: "Schedule mentoring conversations",
        description: "Schedule two mentoring conversations with your mentor",
        completionTime: "Months 3-4",
        showDateSelector: true,
        dateLabel: "Month 3 meeting date",
      },
      "secret-guest": {
        roadmap: "Process secret guest visit",
        description:
          'Process the "secret quest" visit with your church and incorporate findings into your welcome team strategy',
        completionTime: "Months 3-4",
      },
      "god-moments": {
        roadmap: "Celebrate wins with your church",
        description:
          "Celebrate wins with your church by sharing special moments and miracles that are happening in your congregation",
        completionTime: "Months 3-4",
      },
      "share-your-vision": {
        roadmap: "Share your vision",
        description: "Make an effort to continually share your vision with the church",
        completionTime: "Months 5-6",
      },
      "calendar-of-events": {
        roadmap: "Develop calendar of events",
        description:
          "Develop a calendar with your church of events for the year that includes at least two community engagement events and their follow-up events",
        completionTime: "Months 5-6",
      },
      "preaching-calendar": {
        roadmap: "Coordinate preaching calendar",
        description:
          "Coordinate a preaching calendar for the year that focuses a growing relationship with Christ and with each ministry leader",
        completionTime: "Months 7-9",
      },
      "proclamation-event-team": {
        roadmap: "Recruit proclamation event team",
        description: "Recruit a proclamation event team",
        completionTime: "Months 7-9",
      },
    };

    return (
      itemDataMap[slug] || {
        roadmap: title || "Church Empowerment Task",
        description: "Complete the church empowerment task",
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
      text: "Great progress on the community engagement project!",
      avatar: UserProfile,
    },
    {
      id: 2,
      name: "Robin Roe",
      role: "Project Manager",
      time: "Yesterday",
      text: "Keep up the excellent work on welcoming guests.",
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
      text: "How should we measure the success of the community engagement project?",
      avatar: UserProfile,
      answer: {
        mentor: "John Doe",
        date: "22/09/2024",
        role: "Mentor",
        text: "You can measure success through attendance, feedback, and follow-up engagement with community members.",
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
            label: "Church Empowerment Phase",
            href: "/director/revitalization-roadmap/church-empowerment",
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

                  {/* Description Section */}
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

                  {/* Project Date Section (for Community Engagement Project) */}
                  {itemData.showDateSelector && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-2">
                        {itemData.dateLabel || "Project Date"}
                      </label>
                      <div className="flex items-center gap-3 border-2 border-white/30 rounded-lg bg-transparent px-4 py-3 w-[45%] max-w-md">
                        <i className="fa-regular fa-calendar text-white/70"></i>
                        <input
                          type="text"
                          value={selectedDate || "Select Date"}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="flex-1 bg-transparent text-white focus:outline-none placeholder-white/50"
                          placeholder="Select Date"
                        />
                      </div>
                    </div>
                  )}

                  {/* View Shared Media Button (for Community Engagement Project) */}
                  {itemData.hasSharedMedia && (
                    <div className="mb-6 flex justify-start">
                      <button
                        onClick={() =>
                          router.push(
                            `/director/revitalization-roadmap/church-empowerment/${slug}/shared-media`
                          )
                        }
                        className="bg-[#2E3B8E] text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-[#1F2A6E] transition-all"
                      >
                        View Shared Media
                      </button>
                    </div>
                  )}

                  {/* File Card Section (for God's Vision Team and Calendar) */}
                  {itemData.hasFileCard && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-2">
                        {itemData.fileCardLabel}
                      </label>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm p-4 flex items-center justify-between gap-4 w-full max-w-md">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#FFEAEA] text-[#E24C4B] rounded-md p-2">
                            <i className="fa-regular fa-file-pdf text-lg"></i>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-800">
                              {itemData.fileName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {itemData.fileDate}
                            </p>
                          </div>
                        </div>
                        <button className="text-[#2E3B8E] hover:text-[#1F2A6E] transition-all">
                          <i className="fa-solid fa-download text-lg"></i>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Prayer List Section */}
                  {itemData.hasPrayerList && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-2">
                        List of Prayer Opportunities
                      </label>
                      <textarea
                        value={prayerList}
                        onChange={(e) => setPrayerList(e.target.value)}
                        placeholder={itemData.prayerListPlaceholder}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent focus:outline-none focus:border-white/50 placeholder-white/50 resize-none"
                      />
                    </div>
                  )}

                  {/* Or Separator (for Prayer) */}
                  {itemData.hasPrayerList && itemData.hasUploadSection && (
                    <div className="mb-6 flex items-center justify-center">
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 h-px bg-white/20"></div>
                        <span className="text-white font-semibold">Or</span>
                        <div className="flex-1 h-px bg-white/20"></div>
                      </div>
                    </div>
                  )}

                  {/* Upload Calendar Section (for Prayer) */}
                  {itemData.hasUploadSection && (
                    <div className="mb-6">
                      <label className="block text-white font-bold text-sm mb-2">
                        {itemData.uploadLabel}
                      </label>
                      <label
                        htmlFor="calendar-upload"
                        className="border-2 border-dashed border-white/30 rounded-lg bg-transparent text-center flex flex-col items-center justify-center h-[160px] cursor-pointer hover:bg-white/5 transition"
                      >
                        <input
                          type="file"
                          id="calendar-upload"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setUploadedFile(file);
                          }}
                        />
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                          <i className="fa-solid fa-plus text-white text-xl"></i>
                        </div>
                        <p className="text-sm text-white/80">
                          Drag & Drop or Click here to choose file
                        </p>
                        <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
                          <span>Max file size: 10 MB</span>
                          <i className="fa-solid fa-circle-info text-xs"></i>
                        </p>
                      </label>
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
    </div>
  );
}

