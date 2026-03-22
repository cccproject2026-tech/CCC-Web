"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import JumpStartBg from "@/app/Assets/roadmap-jump-start-bg.jpg";
import UserProfile from "@/app/Assets/user-profile.png";

import {
    apiGetRoadmapById,
    apiGetComments,
    apiAddComment,
    apiGetQueries,
    apiReplyToQuery
} from "@/app/Services/roadmaps.service";
import MentorHeader from "@/app/Components/MentorHeader";

export default function TaskPage() {

    const searchParams = useSearchParams();
    const taskId = searchParams.get("taskId") as string;
    const roadmapId = searchParams.get("roadmapId") as string;
    const userId = searchParams.get("userId") as string;

    const [task, setTask] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "comments" | "queries">("overview");

    const [comments, setComments] = useState<any[]>([]);
    const [queries, setQueries] = useState<any[]>([]);
    const [newComment, setNewComment] = useState("");

    const [queryAnswers, setQueryAnswers] = useState<{ [key: string]: string }>({});
    const [queryTab, setQueryTab] = useState<"Pending" | "Answered">("Pending");

    useEffect(() => {

        if (!roadmapId || !taskId) return;

        const fetchData = async () => {

            const res = await apiGetRoadmapById(roadmapId);
            const phase = res.data.data;

            const foundTask = phase?.roadmaps?.find(
                (t: any) => String(t._id) === String(taskId)
            );
            console.log(foundTask)
            setTask(foundTask);

            fetchComments();
            fetchQueries();

        };

        fetchData();

    }, [roadmapId, taskId]);


    const fetchComments = async () => {

        if (!roadmapId || !userId) return;

        try {

            const res = await apiGetComments(roadmapId, userId);
            setComments(res.data?.data || []);

        } catch {
            setComments([]);
        }

    };


    const fetchQueries = async () => {

        if (!roadmapId || !userId) return;

        try {

            const res = await apiGetQueries(roadmapId, userId);
            setQueries(res.data?.data || []);

        } catch {
            setQueries([]);
        }

    };


    const handleSendComment = async () => {

        if (!newComment.trim()) return;

        try {

            await apiAddComment(roadmapId, {
                text: newComment,
                userId,
                mentorId: userId
            });

            setNewComment("");
            fetchComments();

        } catch (err) {

            console.error(err);

        }

    };


    const handleSendAnswer = async (queryId: string) => {

        const answer = queryAnswers[queryId];
        if (!answer?.trim()) return;

        try {

            await apiReplyToQuery(roadmapId, queryId, {
                repliedAnswer: answer,
                repliedMentorId: userId
            });

            setQueryAnswers(prev => ({ ...prev, [queryId]: "" }));
            fetchQueries();

        } catch (err) {

            console.error(err);

        }

    };


    const handleAnswerChange = (queryId: string, value: string) => {

        setQueryAnswers(prev => ({
            ...prev,
            [queryId]: value
        }));

    };


    if (!task) return <div className="text-white p-10">Loading...</div>;


    return (

        <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
            <MentorHeader showFullHeader={true} />
            <JumpStartHero
                backgroundImageUrl={JumpStartBg.src}
                title={task.name}
                breadcrumbItems={[
                    { label: "Revitalization Roadmap", href: "/mentor/revitalization-roadmap" },
                    { label: task.name }
                ]}
                heightClasses="h-[260px]"
            />

            <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">

                    {/* SIDEBAR */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                            <div className="bg-[#2E3B8E] text-white px-6 py-4 font-bold">
                                Over View
                            </div>

                            <div className="p-4 space-y-2">

                                <button
                                    onClick={() => setActiveTab("overview")}
                                    className={`w-full text-left px-4 py-3 rounded-lg font-semibold ${activeTab === "overview"
                                        ? "bg-[#2E3B8E] text-white"
                                        : "text-gray-700 hover:bg-gray-100"
                                        }`}
                                >
                                    Over View
                                </button>

                                <button
                                    onClick={() => setActiveTab("comments")}
                                    className="w-full text-left px-4 py-3 rounded-lg font-semibold flex justify-between text-gray-700 hover:bg-gray-100"
                                >
                                    Comments
                                    <span className="bg-blue-100 text-[#2E3B8E] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {comments.length}
                                    </span>
                                </button>

                                <button
                                    onClick={() => setActiveTab("queries")}
                                    className="w-full text-left px-4 py-3 rounded-lg font-semibold flex justify-between text-gray-700 hover:bg-gray-100"
                                >
                                    Queries
                                    <span className="bg-blue-100 text-[#2E3B8E] text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {queries.length}
                                    </span>
                                </button>

                            </div>

                        </div>
                    </div>


                    {/* RIGHT PANEL */}
                    <div className="lg:col-span-3">

                        {/* OVERVIEW */}
                        {activeTab === "overview" && (
                            <>
                                <h2 className="text-white text-2xl font-bold mb-6">Over View</h2>

                                <textarea
                                    readOnly
                                    value={task.description}
                                    className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent"
                                />

                                {(task.extras || []).map((extra: any, index: number) => {

                                    if (extra.type === "TEXT_DISPLAY")
                                        return (
                                            <div key={index} className="text-white mt-4">
                                                {extra.name}
                                            </div>
                                        );

                                    if (extra.type === "CHECKBOX")
                                        return (
                                            <label key={index} className="flex items-center gap-3 text-white mt-4">
                                                <input type="checkbox" />
                                                {extra.name}
                                            </label>
                                        );

                                    if (extra.type === "UPLOAD")
                                        return (
                                            <div key={index} className="mt-6">
                                                <label className="block text-white font-semibold mb-2">
                                                    {extra.name}
                                                </label>

                                                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center text-white">

                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        id={`upload-${index}`}
                                                    />

                                                    <label
                                                        htmlFor={`upload-${index}`}
                                                        className="cursor-pointer block"
                                                    >
                                                        Click to upload file
                                                    </label>

                                                </div>
                                            </div>
                                        );

                                    if (extra.type === "TEXT_FIELD")
                                        return (
                                            <input
                                                key={index}
                                                placeholder={extra.placeHolder}
                                                className="w-full px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent mt-4"
                                            />
                                        );

                                    if (extra.type === "DATE_PICKER")
                                        return (
                                            <input
                                                key={index}
                                                type="date"
                                                className="px-4 py-3 border-2 border-white/30 rounded-lg text-white bg-transparent mt-4"
                                            />
                                        );

                                    return null;

                                })}
                            </>
                        )}


                        {/* COMMENTS */}
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
                                                    {/* <Image
                                                        src={query.user?.profileImage || UserProfile}
                                                        alt="user"
                                                        width={40}
                                                        height={40}
                                                        className="w-10 h-10 rounded-full object-cover"
                                                    /> */}
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

            </main>

        </div>

    );

}