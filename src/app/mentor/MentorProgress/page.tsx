"use client";
import { useEffect, useState, Suspense } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import overall from "@/app/Assets/overall-progress.jpeg";
import individual from "@/app/Assets/Individual.jpeg";
import progressBg from "@/app/Assets/progress-bg.png";
import card1 from "@/app/Assets/card1.png";
import card2 from "@/app/Assets/card2.png";
import card3 from "@/app/Assets/card3.png";
import MentorHeader from "@/app/Components/MentorHeader";
import { useSearchParams } from "next/navigation";
import { apiAddFinalComment, apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetRoadmapById } from "@/app/Services/roadmaps.service";
import { apiGetAssessmentById } from "@/app/Services/assessment.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

function PastorProgressPageContent() {
  const [roadmapFilter, setRoadmapFilter] = useState("All");
  const [surveyFilter, setSurveyFilter] = useState("All");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("comments"); // ✅ for tab switching
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const isCompleted = progress?.finalComments?.length > 0;

  useEffect(() => {
    if (!userId) return;

    const fetchProgress = async () => {
      try {
        const res = await apiGetUserProgress(userId);
        setProgress(res.data?.data);
      } catch (err) {
        console.error("Failed to fetch progress", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [userId]);


  useEffect(() => {
    if (!progress?.roadmaps?.length) return;

    const hydrateRoadmaps = async () => {
      try {
        const results = await Promise.allSettled(
          progress.roadmaps.map(async (r: any) => {
            const res = await apiGetRoadmapById(r.roadMapId);
            const roadmap = res.data?.data;
            const percent = r.progressPercentage ?? 0;
            return {
              ...r,
              title: roadmap?.name,
              description: roadmap?.description,
              timeline: roadmap?.timeline,
              percent
            };
          })
        );
        const valid = results
          .filter((r) => r.status === "fulfilled")
          .map((r: any) => r.value);

        setRoadmaps(valid);
      } catch (err) {
        console.error("Failed to load roadmap details", err);
      }
    };

    hydrateRoadmaps();
  }, [progress]);


  useEffect(() => {
    console.log(progress)
    if (!progress?.assessments?.length) return; const hydrateAssessments = async () => {
      try {
        const results = await Promise.allSettled(
          progress.assessments.map(async (a: any) => {
            const res = await apiGetAssessmentById(a.assessmentId);

            console.log("Assessment API response:", res.data);

            const assessment = res.data;

            return {
              ...a,
              title: assessment?.name,
              description: assessment?.description,
              bannerImage: assessment?.bannerImage,
              type: assessment?.type,
              totalSections: assessment?.sections?.length || 0,
              dueDate: a.dueDate,
              status: a.status,
            };
          })
        );
        const valid = results
          .filter((r) => r.status === "fulfilled")
          .map((r: any) => r.value);

        setAssessments(valid);
      } catch (err) {
        console.error("Failed to load assessments", err);
      }
    };

    hydrateAssessments();
  }, [progress]);

  const getStatusColor = (status: string) => {
    if (status === "completed")
      return "bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]";
    if (status === "in_progress")
      return "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]";
    return "bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]";
  };

  const handleMarkComplete = async () => {
    try {
      const mentor = getMentorFromCookie();
      if (!mentor?.id) return;

      await apiAddFinalComment({
        userId: userId as string,
        commentorId: mentor.id,
        comment: comment,
      });

      const res = await apiGetUserProgress(userId as string);
      setProgress(res.data.data);

      setIsDrawerOpen(false);
      setShowSuccess(true);

      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to submit final comment", err);
    }
  };

  const filteredRoadmaps = roadmaps.filter((r) => {
    if (roadmapFilter === "Completed") return r.status === "completed";
    if (roadmapFilter === "Remaining") return r.status !== "completed";
    return true;
  });

  const filteredAssessments = assessments.filter((a) => {
    if (surveyFilter === "Completed") return a.status === "completed";
    if (surveyFilter === "Remaining") return a.status !== "completed";
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading progress...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <MentorHeader showFullHeader={true} />

      {/* HERO HEADER */}
      <section
        className="relative h-[220px] bg-cover bg-center flex flex-col justify-center px-4 md:px-20"
        style={{ backgroundImage: `url(${progressBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#103D8C]/95 to-[#06285A]/90"></div>
        <h1 className="relative z-10 text-3xl font-semibold tracking-wide">
          My Progress
        </h1>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[#F4F7FC] text-[#0B1C58] relative">
        {/* 🟦 OVERALL + INDIVIDUAL PROGRESS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-4 md:px-16 py-12 bg-[#176192]">
          {/* Overall Progress */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h3 className="text-lg font-semibold mb-4">
              Overall Progress: {progress?.overallProgress ?? 0}%
            </h3>
            <div className="flex justify-center">
              <Image
                src={overall}
                alt="Overall Progress"
                width={480}
                height={480}
                className="rounded-lg"
              />
            </div>
          </div>

          {/* Individual Progress */}
          <div className="bg-white rounded-xl shadow-sm p-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Individual Progress</h3>
              {/* 🟩 Add / View Final Comments Button */}
              {!isCompleted ? (
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-5 py-[6px] rounded-md font-medium"
                >
                  Add Final Comments
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsDrawerOpen(true);
                    setActiveTab("comments");
                  }}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-5 py-[6px] rounded-md font-medium"
                >
                  View Final Comments
                </button>
              )}
            </div>
            <div className="flex justify-center">
              <Image
                src={individual}
                alt="Individual Progress"
                width={480}
                height={480}
                className="rounded-lg"
              />
            </div>
          </div>
        </section>

        {/* 🟩 REVITALIZATION ROADMAP PROGRESS */}
        <section className="px-4 md:px-16 py-10 bg-gradient-to-b from-[#BBD6E9] to-[#E3F1FF]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">
              Revitalization Roadmap Progress
            </h2>
            <div className="flex bg-white rounded-lg shadow overflow-hidden">
              {["All", "Completed", "Remaining"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setRoadmapFilter(tab)}
                  className={`px-5 py-2 text-sm font-medium transition-all ${roadmapFilter === tab
                    ? "bg-[#103C8C] text-white"
                    : "text-gray-600 hover:text-[#103C8C]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {filteredRoadmaps.map((r: any) => (
              <RoadmapCard
                key={r.roadMapId}
                img={card1}
                title={r.title || "Roadmap"}
                desc={r.description || ""}
                progress={r.percent}
                completed={`${r.completedSteps}/${r.totalSteps}`}
                status={r.status}
                statusColor={getStatusColor(r.status)}
                time={r.timeline || ""}
              />
            ))}
          </div>
        </section>

        {/* 🟪 SURVEY PROGRESS */}
        <section className="px-4 md:px-16 pb-12 bg-gradient-to-b from-[#0D3C78] to-[#0B2A55] pt-15 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold">Survey Progress</h2>
            <div className="flex bg-white rounded-lg shadow overflow-hidden">
              {["All", "Completed", "Remaining"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSurveyFilter(tab)}
                  className={`px-5 py-2 text-sm font-medium transition-all ${surveyFilter === tab
                    ? "bg-[#103C8C] text-white"
                    : "text-gray-500 hover:text-[#103C8C]"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {filteredAssessments.map((a: any) => (
              <AssessmentCard
                key={a.assessmentId}
                assessment={a}
              />
            ))}
          </div>
        </section>

        {/* 🧩 FINAL COMMENTS DRAWER (ADD + VIEW MODES) */}
        {isDrawerOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
              onClick={() => setIsDrawerOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-full sm:w-[460px] bg-white text-[#0B1C58] shadow-2xl z-50">
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-gray-200">
                <div>
                  <h2 className="text-lg font-semibold">
                    {isCompleted
                      ? "Final Comments & Summary"
                      : "Final Comments"}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{progress?.user?.firstName} {progress?.user?.lastName}</p>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-[#103C8C] transition"
                >
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              {/* Tabs (only after completed) */}
              {isCompleted && (
                <div className="flex border-b border-gray-200">
                  {["comments", "summary"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-3 text-sm font-medium capitalize ${activeTab === tab
                        ? "border-b-2 border-[#103C8C] text-[#103C8C]"
                        : "text-gray-500 hover:text-[#103C8C]"
                        }`}
                    >
                      {tab === "comments"
                        ? "Final Comments"
                        : "Programme Summary"}
                    </button>
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="p-6">
                {!isCompleted ? (
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write the Comments here..."
                    className="w-full h-[260px] border border-gray-300 rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#103C8C]"
                  />
                ) : (
                  <div className="space-y-3 max-h-[260px] oveyrflow-y-auto">

                    {progress?.finalComments?.map((c: any) => (
                      <div
                        key={c._id}
                        className="border rounded-md p-3 bg-gray-50"
                      >
                        <p className="text-sm text-gray-800">
                          {c.comment}
                        </p>

                        <p className="text-[11px] text-gray-500 mt-1">
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))}

                  </div>
                )}

                {isCompleted && activeTab === "summary" && (
                  <div className="text-sm text-gray-700">
                    <p className="mb-2 font-medium">
                      Programme Completion Summary:
                    </p>
                    <p>
                      The participant has successfully completed all phases of
                      the Revitalization Programme. Review comments have been
                      recorded.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {!isCompleted && (
                <div className="absolute bottom-0 left-0 w-full border-t border-gray-200 bg-white p-5 flex justify-end gap-4">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="border border-[#103C8C] text-[#103C8C] text-[13px] font-medium px-6 py-[6px] rounded-md hover:bg-[#F5F8FF] transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkComplete}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[13px] font-medium px-8 py-[6px] rounded-md transition"
                  >
                    Mark Programme as Completed
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ✅ SUCCESS POPUP */}
        {showSuccess && (
          <div className="fixed inset-0 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl shadow-lg px-8 py-5 flex items-center gap-3">
              <div className="text-green-600 text-2xl">✔</div>
              <p className="text-[#0B1C58] font-medium text-[15px]">
                This programme has been marked as Completed
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* RoadmapCard unchanged */
function RoadmapCard({
  img,
  title,
  desc,
  status,
  statusColor,
  progress,
  completed,
  time,
}: any) {
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="flex">
        <div className="w-1/3">
          <Image src={img} alt={title} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-5">
          <h4 className="text-[15px] font-semibold mb-1">{title}</h4>
          <p className="text-[13px] text-[#6B7280] mb-3">{desc}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] text-[#6B7280] font-medium">
              Status
            </span>
            <span
              className={`text-[11px] px-2 py-[3px] rounded-full font-medium border ${statusColor}`}
            >
              {status}
            </span>
          </div>
          <p className="text-[12px] text-[#6B7280] mb-1">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div
              className="h-[6px] bg-[#16A34A] rounded-full transition-all duration-700"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-[12px] text-[#0B1C58] font-medium mb-2">
            {completed}
          </p>
          <p className="text-[12px] text-[#6B7280]">
            Completion Time{" "}
            <span className="font-semibold text-[#0B1C58]">{time}</span>
          </p>
          <div className="flex justify-end mt-4">
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-6 py-[6px] rounded-md font-medium">
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


function AssessmentCard({ assessment }: any) {
  const isCompleted = assessment.status === "completed";

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all p-4 h-[200px]">
      <div className="flex h-full gap-4">

        {/* Image */}
        <div className="relative w-[160px] h-full rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={assessment.bannerImage || card1}
            alt={assessment.title || "Assessment"}
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex flex-col justify-between flex-1">

          {/* Top */}
          <div>
            <h4 className="text-[15px] font-bold text-black mb-1 line-clamp-1">
              {assessment.title || "Assessment"}
            </h4>

            <p className="text-[13px] text-[#6B7280] mb-2 line-clamp-2">
              {assessment.description || ""}
            </p>

            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-4 py-[5px] rounded-md font-medium">
              Customized Development Plans
            </button>
          </div>

          {/* Footer */}
          <div className="flex justify-between text-[12px] text-[#6B7280]">

            {isCompleted ? (
              <span className="font-bold text-black">
                Submited On
              </span>
            ) : (
              <>
                <span className="font-bold text-black">Due Date</span>
                <span className="font-semibold text-[#0B1C58]">
                  {assessment.dueDate || "-"}
                </span>
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}

export default function PastorProgressPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <PastorProgressPageContent />
    </Suspense>
  );
}