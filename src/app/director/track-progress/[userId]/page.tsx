"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import ProgressBg from "../../../Assets/progress-bg.jpg";
import Card1 from "../../../Assets/card1.png";
import Card2 from "../../../Assets/card2.png";
import Card3 from "../../../Assets/card3.png";
import Card4 from "../../../Assets/card4.png";
import { apiAddFinalComment, apiGetUserProgress } from "@/app/Services/progress.service";
import { apiGetUserById } from "@/app/Services/users.service";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RoadmapCardProps {
  image: any;
  title: string;
  description: string;
  status: "Completed" | "In-progress" | "Not Started" | "Over Due";
  completedDate?: string;
  tasksCompleted?: string; // e.g., "06/08"
  completionTime?: string; // e.g., "Months 1-2"
}

function RoadmapProgressCard({
  image,
  title,
  description,
  status,
  completedDate,
  tasksCompleted,
  completionTime,
}: RoadmapCardProps) {
  const getStatusBadgeStyle = () => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "In-progress":
        return "bg-orange-100 text-orange-700";
      case "Not Started":
        return "bg-blue-100 text-blue-700";
      case "Over Due":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex">
      {/* Image Section - Left (1/3 width) */}
      <div className="relative w-1/3 flex-shrink-0">
        <Image
          src={image}
          alt={title}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
        {/* Green Checkmark Icon - Only show for Completed status */}
        {status === "Completed" && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Outer ring with light green border */}
            <div className="relative w-14 h-14">
              {/* Outer border ring - light green */}
              <div className="absolute inset-0 rounded-full border-2 border-green-400"></div>
              {/* Transparent gap layer - shows background through */}
              <div className="absolute inset-[4px] rounded-full bg-transparent"></div>
              {/* Inner green fill circle - inside transparent gap */}
              <div className="absolute inset-[6px] rounded-full bg-green-500"></div>
              {/* White checkmark centered */}
              <div className="absolute inset-[6px] flex items-center justify-center">
                <i className="fa-solid fa-check text-white text-sm font-bold"></i>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Content Section - Right (2/3 width) */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        <div className="flex flex-col gap-2">
          <span
            className={`${getStatusBadgeStyle()} text-xs font-semibold px-3 py-1 rounded-md w-fit`}
          >
            Status: {status}
          </span>
          {status === "Completed" && completedDate && (
            <span className="text-xs text-gray-700">
              Completed on : {completedDate}
            </span>
          )}
          {tasksCompleted && (
            <div className="flex flex-col gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${(parseInt(tasksCompleted.split("/")[0]) / parseInt(tasksCompleted.split("/")[1])) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">
                Task Completed: {tasksCompleted}
              </span>
            </div>
          )}
          {completionTime && (
            <span className="text-xs text-gray-700">
              Completion Time: {completionTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

interface SurveyCardProps {
  image: any;
  title: string;
  description: string;
  status: "Completed" | "Remaining";
  submittedDate?: string;
  dueDate?: string;
  onButtonClick?: () => void;
}

function SurveyProgressCard({
  image,
  title,
  description,
  status,
  submittedDate,
  dueDate,
  onButtonClick,
}: SurveyCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex">
      {/* Image Section - Left (square) */}
      <div className="relative w-1/3 flex-shrink-0">
        <Image
          src={image}
          alt={title}
          width={200}
          height={200}
          className="w-full h-full object-cover"
        />
      </div>
      {/* Content Section - Right (2/3 width) */}
      <div className="flex-1 p-5 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
        </div>
        <div className="flex flex-col gap-3">
          {status === "Completed" && (
            <button
              onClick={onButtonClick}
              className="bg-[#1E366F] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors border-2 border-purple-500/30 shadow-sm w-fit"
            >
              Customized Development Plans
            </button>
          )}
          <span className="text-xs text-gray-600">
            {status === "Completed"
              ? `Submitted On : ${submittedDate}`
              : `Due ${dueDate}`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function IndividualProgressPage() {
  const { userId } = useParams<{ userId: string }>();
  const params = useParams();
  const [isFinalCommentsModalOpen, setIsFinalCommentsModalOpen] = useState(false);
  const [finalComments, setFinalComments] = useState("");
  const [hasComments, setHasComments] = useState(false);
  const [roadmapFilter, setRoadmapFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [surveyFilter, setSurveyFilter] = useState<"All" | "Completed" | "Remaining">("All");
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const userName = user
    ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
    : "—";
  const isCompleted = progressData?.overallCompleted ?? false;
  const [directorId, setDirectorId] = useState<string>("");

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    setDirectorId(storedUserId as string);
  }, []);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      apiGetUserById(userId),
      apiGetUserProgress(userId),
    ])
      .then(([userRes, progressRes]) => {
        setUser(userRes.data.data);
        setProgressData(progressRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (progressData?.finalComments?.length) {
      setHasComments(true);
      setFinalComments(progressData.finalComments[0].comment);
    }
  }, [progressData]);

  const handleSubmitComments = async () => {
    if (!finalComments.trim()) return;


    try {
      await apiAddFinalComment({
        userId,
        commentorId: directorId,
        comment: finalComments,
      });


      // Fetch latest progress after save
      const progressRes = await apiGetUserProgress(userId);
      setProgressData(progressRes.data.data);


      setHasComments(true);
    } catch (error) {
      console.error("Failed to add final comment", error);
    }
  };

  const handleMarkAsCompleted = () => {
    // Mark programme as completed
    setIsFinalCommentsModalOpen(false);
    // Here you would typically update the status in your backend
  };

  const roadmapCards =
    progressData?.roadmaps.map((rm: any) => ({
      id: rm.roadMapId,
      image: Card1, // static until backend provides images
      title: "Roadmap",
      description: "Revitalization Roadmap",
      status:
        rm.status === "completed"
          ? "Completed"
          : rm.status === "in_progress"
            ? "In-progress"
            : "Not Started",
      tasksCompleted:
        rm.totalSteps > 0
          ? `${rm.completedSteps}/${rm.totalSteps}`
          : undefined,
    })) ?? [];

  const surveyCards =
    progressData?.assessments.map((as: any) => ({
      id: as.assessmentId,
      image: Card2,
      title: "Assessment",
      description: "Assessment Progress",
      status: as.status === "completed" ? "Completed" : "Remaining",
      submittedDate: as.status === "completed" ? "Submitted" : undefined,
      dueDate: as.status !== "completed" ? "Pending" : undefined,
    })) ?? [];

  const progress = {
    completed: progressData?.overallProgress ?? 0,
    remaining: 100 - (progressData?.overallProgress ?? 0),
  };

  // Donut Chart Data
  const donutChartData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [progress.completed, progress.remaining],
        backgroundColor: ["#5B7FDB", "#FFD84E"],
        borderWidth: 0,
      },
    ],
  };

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    cutout: "70%",
  };

  // Bar Chart Data
  const barChartData = {
    labels: ["Roadmaps", "Assessments"],
    datasets: [
      {
        label: "Total",
        data: [
          progressData?.totalRoadmaps ?? 0,
          progressData?.totalAssessments ?? 0,
        ],
        backgroundColor: "#5B7FDB",
        borderRadius: 4,
      },
      {
        label: "Completed",
        data: [
          progressData?.completedRoadmaps ?? 0,
          progressData?.completedAssessments ?? 0,
        ],
        backgroundColor: "#5BC0DE",
        borderRadius: 4,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // Hide default legend, we'll use custom one
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          color: "#666666",
          font: {
            size: 12,
          },
        },
        grid: {
          display: true,
          color: "#E0E0E0",
          borderDash: [5, 5],
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: "#333333",
          font: {
            size: 14,
          },
        },
        grid: {
          display: false,
        },
      },
    },
  };

  // Filter roadmap cards
  const filteredRoadmapCards = roadmapCards.filter((card) => {
    if (roadmapFilter === "All") return true;
    if (roadmapFilter === "Completed") return card.status === "Completed";
    if (roadmapFilter === "Remaining")
      return card.status !== "Completed";
    return true;
  });

  // Filter survey cards
  const filteredSurveyCards = surveyCards.filter((card) => {
    if (surveyFilter === "All") return true;
    if (surveyFilter === "Completed") return card.status === "Completed";
    if (surveyFilter === "Remaining") return card.status === "Remaining";
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] to-[#2E3B8E]">
      {/* Hero Section */}
      <AppHero
        title={userName}
        backgroundImageUrl={ProgressBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Track Progress", href: "/director/track-progress" },
          { label: userName },
        ]}
      />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12">
        <div className="max-w-[1400px] mx-auto space-y-12">
          {/* Progress Overview Section */}
          <div className="relative">
            {/* Add/View Final Comments Button - Above and outside the cards */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsFinalCommentsModalOpen(true)}
                className="bg-[#1E366F] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors shadow-md"
              >
                {isCompleted ? "View Final Comments" : "Add Final Comments"}
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Progress Card */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Roadmap & Assessments
                </h2>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#5B7FDB] rounded-full"></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FFD84E] rounded-full"></div>
                    <span className="text-xs text-gray-600">Remaining</span>
                  </div>
                </div>
                <div className="relative h-64 flex items-center justify-center">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Doughnut data={donutChartData} options={donutChartOptions} />
                    {/* Center white circle with text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
                        <span className="text-gray-900 font-bold text-lg">
                          {progress.completed === 100 ? "Completed" : `${progress.completed}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Percentage Label with connecting line - positioned to the right of donut */}
                  {progress.completed > 0 && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="relative flex items-center">
                        {/* Connecting line from donut edge */}
                        <div className="w-12 h-0.5 bg-[#5B7FDB] mr-2"></div>
                        {/* Percentage Label */}
                        <div className="bg-[#1E366F] text-white text-sm font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap">
                          {progress.completed}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Individual Progress Card */}
              <div className="bg-white rounded-xl shadow-lg p-8 relative">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Individual Progress
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Roadmap & Assessments
                  </p>
                </div>
                <div className="flex items-center justify-end gap-4 mb-6">
                  {/* Custom Legend */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#5B7FDB] rounded-full"></div>
                      <span className="text-xs text-gray-600">Total</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#5BC0DE] rounded-full"></div>
                      <span className="text-xs text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-[#FFD84E] rounded-full"></div>
                      <span className="text-xs text-gray-600">Remaining</span>
                    </div>
                  </div>
                </div>
                <div className="relative h-64">
                  <Bar
                    data={barChartData}
                    options={barChartOptions}
                    plugins={[
                      {
                        id: "customLabels",
                        afterDatasetsDraw: (chart: any) => {
                          const ctx = chart.ctx;
                          const meta = chart.getDatasetMeta(1); // Completed dataset
                          meta.data.forEach((bar: any, index: number) => {
                            if (index === 0 && progress.roadmap > 0) {
                              // Only for Roadmap (first bar) - draw percentage badge
                              const x = bar.x;
                              const y = bar.y;
                              const barWidth = bar.width;
                              const barHeight = bar.height;

                              // Calculate percentage
                              const percentage = Math.round((progress.roadmap / 5) * 100);

                              // Calculate badge dimensions
                              const badgeWidth = 40;
                              const badgeHeight = 20;
                              const badgeX = x - badgeWidth / 2;
                              const badgeY = y - barHeight - badgeHeight - 5;

                              ctx.save();
                              // Draw rounded rectangle background
                              ctx.fillStyle = "#5BC0DE";
                              const radius = 4;
                              ctx.beginPath();
                              ctx.moveTo(badgeX + radius, badgeY);
                              ctx.lineTo(badgeX + badgeWidth - radius, badgeY);
                              ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY, badgeX + badgeWidth, badgeY + radius);
                              ctx.lineTo(badgeX + badgeWidth, badgeY + badgeHeight - radius);
                              ctx.quadraticCurveTo(badgeX + badgeWidth, badgeY + badgeHeight, badgeX + badgeWidth - radius, badgeY + badgeHeight);
                              ctx.lineTo(badgeX + radius, badgeY + badgeHeight);
                              ctx.quadraticCurveTo(badgeX, badgeY + badgeHeight, badgeX, badgeY + badgeHeight - radius);
                              ctx.lineTo(badgeX, badgeY + radius);
                              ctx.quadraticCurveTo(badgeX, badgeY, badgeX + radius, badgeY);
                              ctx.closePath();
                              ctx.fill();

                              // Draw white text
                              ctx.fillStyle = "#FFFFFF";
                              ctx.font = "bold 12px sans-serif";
                              ctx.textAlign = "center";
                              ctx.textBaseline = "middle";
                              ctx.fillText(`${percentage}%`, x, badgeY + badgeHeight / 2);
                              ctx.restore();
                            }
                          });
                        },
                      },
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Revitalization Roadmap Progress Section */}
          <div className="bg-[#b0d0e4] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Revitalization Roadmap Progress
              </h2>
              {/* Filter Tabs */}
              <div className="flex items-center gap-0 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setRoadmapFilter("All")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${roadmapFilter === "All"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setRoadmapFilter("Completed")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${roadmapFilter === "Completed"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setRoadmapFilter("Remaining")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${roadmapFilter === "Remaining"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Remaining
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoadmapCards.map((card) => (
                <RoadmapProgressCard
                  key={card.id}
                  image={card.image}
                  title={card.title}
                  description={card.description}
                  status={card.status}
                  completedDate={card.completedDate}
                  tasksCompleted={card.tasksCompleted}
                  completionTime={card.completionTime}
                />
              ))}
            </div>
          </div>

          {/* Survey Progress Section */}
          <div className="bg-[#b0d0e4] rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Survey Progress
              </h2>
              {/* Filter Tabs */}
              <div className="flex items-center gap-0 bg-white rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setSurveyFilter("All")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${surveyFilter === "All"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSurveyFilter("Completed")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${surveyFilter === "Completed"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setSurveyFilter("Remaining")}
                  className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${surveyFilter === "Remaining"
                    ? "bg-[#1E366F] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  Remaining
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSurveyCards.map((card) => (
                <SurveyProgressCard
                  key={card.id}
                  image={card.image}
                  title={card.title}
                  description={card.description}
                  status={card.status}
                  submittedDate={'submittedDate' in card ? card.submittedDate : undefined}
                  dueDate={'dueDate' in card ? card.dueDate : undefined}
                  onButtonClick={() => console.log("Customized Development Plans clicked")}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <AppFooter />

      {/* Final Comments Modal */}
      {isFinalCommentsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Final Comments</h2>
                <p className="text-sm text-gray-600 mt-1">Pr. {userName}</p>
              </div>
              <button
                onClick={() => setIsFinalCommentsModalOpen(false)}
                className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <textarea
                value={finalComments}
                onChange={(e) => !hasComments && setFinalComments(e.target.value)}
                placeholder={hasComments ? "" : "Write the Comments here..."}
                readOnly={hasComments}
                className={`w-full h-64 px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E366F] focus:border-transparent resize-none ${hasComments ? "bg-gray-50 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setIsFinalCommentsModalOpen(false)}
                className="px-6 py-2.5 bg-white border border-[#1E366F] text-[#1E366F] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {hasComments ? (
                <button
                  onClick={handleMarkAsCompleted}
                  className="px-6 py-2.5 bg-[#1E366F] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2f5a] transition-colors"
                >
                  Mark Programme as Completed
                </button>
              ) : (
                <button
                  onClick={handleSubmitComments}
                  className="px-6 py-2.5 bg-[#1E366F] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2f5a] transition-colors"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

