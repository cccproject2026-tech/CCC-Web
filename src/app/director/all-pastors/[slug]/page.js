"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
import ProgressBg from "../../../Assets/progress-bg.jpg";
import Jumpstart from "../../../Assets/jumpstart-hero.png";
import SelfRevitalization from "../../../Assets/self-revitalization-hero.png";
import Roadmap from "../../../Assets/roadmap-bg.png";
import CCCLogo from "../../../Assets/CCCLogo.png";
import Image from "next/image";
import Link from "next/link";
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
import { Doughnut, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function PastorDetailPage({ params }) {
  const router = useRouter();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showCompletedNotification, setShowCompletedNotification] =
    useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [finalComments, setFinalComments] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [roadmapFilter, setRoadmapFilter] = useState("All");
  const [surveyFilter, setSurveyFilter] = useState("All");

  // Different data for different users
  const usersData = {
    1: {
      name: "John Doe",
      overallProgress: 100,
      roadmapCompleted: 5,
      roadmapTotal: 5,
      roadmapRemaining: 0,
      assessmentsCompleted: 3,
      assessmentsTotal: 3,
      assessmentsRemaining: 0,
    },
    2: {
      name: "Jane Smith",
      overallProgress: 70,
      roadmapCompleted: 3,
      roadmapTotal: 5,
      roadmapRemaining: 2,
      assessmentsCompleted: 2,
      assessmentsTotal: 3,
      assessmentsRemaining: 1,
    },
    3: {
      name: "Michael Johnson",
      overallProgress: 85,
      roadmapCompleted: 4,
      roadmapTotal: 5,
      roadmapRemaining: 1,
      assessmentsCompleted: 3,
      assessmentsTotal: 3,
      assessmentsRemaining: 0,
    },
    4: {
      name: "Sarah Williams",
      overallProgress: 45,
      roadmapCompleted: 2,
      roadmapTotal: 5,
      roadmapRemaining: 3,
      assessmentsCompleted: 1,
      assessmentsTotal: 3,
      assessmentsRemaining: 2,
    },
    5: {
      name: "Robert Brown",
      overallProgress: 92,
      roadmapCompleted: 5,
      roadmapTotal: 5,
      roadmapRemaining: 0,
      assessmentsCompleted: 2,
      assessmentsTotal: 3,
      assessmentsRemaining: 1,
    },
    6: {
      name: "David Wilson",
      overallProgress: 62,
      roadmapCompleted: 3,
      roadmapTotal: 5,
      roadmapRemaining: 2,
      assessmentsCompleted: 2,
      assessmentsTotal: 3,
      assessmentsRemaining: 1,
    },
  };

  const userId = params.slug || "1";
  const pastorData = usersData[userId] || usersData[1];

  const allPhases = [
    {
      id: 1,
      title: "Jump-start",
      description: "Join a two-day group revitalization session hosted by CCC.",
      image: Jumpstart,
      status: "Completed",
      completedDate: "20 Oct 2024",
    },
    {
      id: 2,
      title: "Self Revitalization Phase",
      description: "Interested in receiving mentoring in community engagement.",
      image: SelfRevitalization,
      status: "Completed",
      completedDate: "20 Oct 2024",
    },
    {
      id: 3,
      title: "Church Empowerment Phase",
      description: "Interested in receiving mentoring in community engagement.",
      image: Roadmap,
      status: "Completed",
      completedDate: "20 Oct 2024",
    },
    {
      id: 4,
      title: "Community Revitalization and Multiplication Phase",
      description: "Interested in receiving mentoring in community engagement.",
      image: Roadmap,
      status: pastorData.roadmapCompleted >= 4 ? "Completed" : "In Progress",
      completedDate: pastorData.roadmapCompleted >= 4 ? "20 Oct 2024" : null,
    },
    {
      id: 5,
      title: "Advanced Leadership Development",
      description: "Interested in receiving mentoring in community engagement.",
      image: Roadmap,
      status: pastorData.roadmapCompleted >= 5 ? "Completed" : "Remaining",
      completedDate: pastorData.roadmapCompleted >= 5 ? "20 Oct 2024" : null,
    },
  ];

  const allSurveys = [
    {
      id: 1,
      title: "Church Assessment Evaluation(CMA)",
      description: "Interested in receiving mentoring in community engagement.",
      image: CCCLogo,
      buttonText: "Customized Development Plans",
      status: "Completed",
      submittedDate: "20 Oct 2024",
    },
    {
      id: 2,
      title: "Church Assessment Evaluation(CMA)",
      description: "Interested in receiving mentoring in community engagement.",
      image: CCCLogo,
      buttonText: "Customized Development Plans",
      status: pastorData.assessmentsCompleted >= 2 ? "Completed" : "Remaining",
      submittedDate:
        pastorData.assessmentsCompleted >= 2 ? "20 Oct 2024" : null,
      dueDate: pastorData.assessmentsCompleted >= 2 ? null : "30 Nov 2024",
    },
    {
      id: 3,
      title: "Community Engagement Survey",
      description: "Assess community outreach and engagement strategies.",
      image: CCCLogo,
      buttonText: "View Development Plans",
      status: pastorData.assessmentsCompleted >= 3 ? "Completed" : "Remaining",
      submittedDate:
        pastorData.assessmentsCompleted >= 3 ? "15 Oct 2024" : null,
      dueDate: pastorData.assessmentsCompleted >= 3 ? null : "15 Dec 2024",
    },
  ];

  // Filter phases and surveys
  const filteredPhases = allPhases.filter((phase) => {
    if (roadmapFilter === "All") return true;
    if (roadmapFilter === "Completed") return phase.status === "Completed";
    if (roadmapFilter === "Remaining")
      return phase.status === "Remaining" || phase.status === "In Progress";
    return true;
  });

  const filteredSurveys = allSurveys.filter((survey) => {
    if (surveyFilter === "All") return true;
    if (surveyFilter === "Completed") return survey.status === "Completed";
    if (surveyFilter === "Remaining") return survey.status === "Remaining";
    return true;
  });

  const handleSubmitComments = () => {
    if (!finalComments.trim()) return;
    setIsCompleted(true);
    setShowCommentsModal(false);
    setShowCompletedNotification(true);
    setShowSuccessToast(true);
    setFinalComments("");

    setTimeout(() => {
      setShowSuccessToast(false);
    }, 3000);
  };

  // Calculate percentages for donut chart
  const completedPercentage = pastorData.overallProgress;
  const remainingPercentage = 100 - completedPercentage;

  // Doughnut Chart Data for Overall Progress
  const doughnutData = {
    labels: ["Completed", "Remaining"],
    datasets: [
      {
        data: [completedPercentage, remainingPercentage],
        backgroundColor: ["#22D3EE", "#F59E0B"],
        borderColor: ["#22D3EE", "#F59E0B"],
        borderWidth: 0,
        cutout: "75%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  };

  // Bar Chart Data for Individual Progress
  const barData = {
    labels: ["Roadmap", "Assessments"],
    datasets: [
      {
        label: "Total",
        data: [pastorData.roadmapTotal, pastorData.assessmentsTotal],
        backgroundColor: "#6366F1",
        borderRadius: 4,
        barThickness: 40,
      },
      {
        label: "Completed",
        data: [pastorData.roadmapCompleted, pastorData.assessmentsCompleted],
        backgroundColor: "#22D3EE",
        borderRadius: 4,
        barThickness: 40,
      },
      {
        label: "Remaining",
        data: [pastorData.roadmapRemaining, pastorData.assessmentsRemaining],
        backgroundColor: "#F59E0B",
        borderRadius: 4,
        barThickness: 40,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 13,
            weight: "500",
          },
          color: "#4B5563",
        },
      },
      y: {
        beginAtZero: true,
        max: 6,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
          },
          color: "#6B7280",
        },
        grid: {
          color: "#E5E7EB",
        },
      },
    },
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#3A7CA5] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section with Breadcrumbs */}
      <AppHero
        title={pastorData.name}
        backgroundImageUrl={ProgressBg.src}
        heightClasses="h-[180px]"
        breadcrumbItems={[
          { label: "Track Progress", href: "/director/all-pastors" },
          { label: pastorData.name },
        ]}
      />

      {/* Completed Notification - Top Right */}
      {showCompletedNotification && (
        <div className="fixed top-24 right-8 z-[100] animate-slide-left">
          <div className="bg-white rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[380px] border-l-4 border-cyan-400">
            <div className="w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-white text-lg"></i>
            </div>
            <p className="text-gray-900 font-semibold text-[15px]">
              This programme has Marked as Completed
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-10 flex-1">
        <div className="max-w-[1400px] mx-auto">
          {/* Add Final Comments Button */}
          {!isCompleted && (
            <div className="flex justify-end mb-6">
              <button
                onClick={() => setShowCommentsModal(true)}
                className="px-6 py-3 bg-[#1F2A6E] text-white rounded-lg text-[15px] font-semibold hover:bg-[#0F1A5E] transition-all shadow-lg"
              >
                Add Final Comments
              </button>
            </div>
          )}

          <div className="space-y-10">
            {/* Overall and Individual Progress Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Overall Progress Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-[24px] font-bold text-gray-900 mb-6">
                  Overall Progress
                </h2>

                {/* Legend */}
                <div className="flex items-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-cyan-400"></div>
                    <span className="text-gray-700 font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-orange-400"></div>
                    <span className="text-gray-700 font-medium">Remaining</span>
                  </div>
                </div>

                {/* Doughnut Chart */}
                <div className="flex justify-center items-center relative">
                  <div className="w-[300px] h-[300px] relative">
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[28px] font-bold text-gray-900">
                        Completed
                      </span>
                    </div>
                  </div>
                  {/* Left Percentage Badge */}
                  <div className="absolute left-8 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2">
                      <div className="bg-[#1F2A6E] text-white px-4 py-2 rounded-lg font-bold text-lg">
                        {remainingPercentage.toFixed(1)}%
                      </div>
                      <div className="w-12 h-0.5 bg-gray-300"></div>
                      <div className="w-3 h-3 bg-[#1F2A6E] rounded-full"></div>
                    </div>
                  </div>
                  {/* Right Percentage Badge */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-[#1F2A6E] rounded-full"></div>
                      <div className="w-12 h-0.5 bg-gray-300"></div>
                      <div className="bg-[#1F2A6E] text-white px-4 py-2 rounded-lg font-bold text-lg">
                        {completedPercentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Individual Progress Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-[24px] font-bold text-gray-900 mb-6">
                  Individual Progress
                </h2>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-[#6366F1]"></div>
                    <span className="text-gray-700 font-medium">Total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-cyan-400"></div>
                    <span className="text-gray-700 font-medium">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-sm bg-orange-400"></div>
                    <span className="text-gray-700 font-medium">Remaining</span>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="relative">
                  <div className="h-[320px]">
                    <Bar data={barData} options={barOptions} />
                  </div>
                  {/* Percentage Badge */}
                  {pastorData.roadmapCompleted === pastorData.roadmapTotal && (
                    <div className="absolute top-2 left-1/4 -translate-x-1/2">
                      <div className="bg-cyan-50 border border-cyan-200 rounded px-2 py-1">
                        <span className="text-cyan-600 text-xs font-bold">
                          100%
                        </span>
                      </div>
                    </div>
                  )}
                  {pastorData.roadmapCompleted < pastorData.roadmapTotal && (
                    <div className="absolute top-2 left-1/4 -translate-x-1/2">
                      <div className="bg-cyan-50 border border-cyan-200 rounded px-2 py-1">
                        <span className="text-cyan-600 text-xs font-bold">
                          {Math.round(
                            (pastorData.roadmapCompleted /
                              pastorData.roadmapTotal) *
                              100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Revitalization Roadmap Progress */}
            <div className="bg-blue-100/30 rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[28px] font-bold text-gray-900">
                  Revitalization Roadmap Progress
                </h2>
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-md">
                  {["All", "Completed", "Remaining"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setRoadmapFilter(filter)}
                      className={`px-5 py-2 rounded-md font-semibold text-sm transition-all ${
                        roadmapFilter === filter
                          ? "bg-[#2E3B8E] text-white"
                          : "bg-transparent text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPhases.map((phase) => (
                  <div
                    key={phase.id}
                    className="bg-white rounded-2xl shadow-lg p-5"
                  >
                    <div className="flex gap-5">
                      <div className="relative w-[190px] h-[150px] flex-shrink-0 rounded-xl overflow-hidden">
                        <Image
                          src={phase.image}
                          alt={phase.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Centered Icon with border ring */}
                        {phase.status === "Completed" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              {/* Green border ring */}
                              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border-4 border-green-500 flex items-center justify-center">
                                {/* Green circle with check */}
                                <div className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                                  <i className="fa-solid fa-check text-white text-lg"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {phase.status === "In Progress" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border-4 border-orange-500 flex items-center justify-center">
                                <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                  <i className="fa-solid fa-clock text-white text-lg"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {phase.status === "Remaining" && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm border-4 border-gray-400 flex items-center justify-center">
                                <div className="w-11 h-11 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
                                  <i className="fa-solid fa-hourglass text-white text-lg"></i>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">
                          {phase.title}
                        </h3>
                        <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">
                          {phase.description}
                        </p>
                        <div className="space-y-2">
                          <div className="inline-flex items-center gap-2">
                            <span className="text-[13px] font-semibold text-gray-700">
                              Status
                            </span>
                            <span
                              className={`px-3 py-1 rounded text-[13px] font-bold ${
                                phase.status === "Completed"
                                  ? "bg-green-100 text-green-700"
                                  : phase.status === "In Progress"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {phase.status}
                            </span>
                          </div>
                          {phase.completedDate && (
                            <p className="text-[13px] text-gray-600">
                              <span className="font-semibold">
                                Completed on :
                              </span>{" "}
                              {phase.completedDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Survey Progress */}
            <div className="bg-[#1F3A5F] rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[28px] font-bold text-white">
                  Survey Progress
                </h2>
                {/* Filter Tabs */}
                <div className="flex items-center gap-2 bg-white rounded-lg p-1.5 shadow-md">
                  {["All", "Completed", "Remaining"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setSurveyFilter(filter)}
                      className={`px-5 py-2 rounded-md font-semibold text-sm transition-all ${
                        surveyFilter === filter
                          ? "bg-[#2E3B8E] text-white"
                          : "bg-transparent text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSurveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="bg-white rounded-2xl shadow-lg p-5"
                  >
                    <div className="flex gap-5">
                      <div className="relative w-[190px] h-[150px] flex-shrink-0 rounded-xl bg-gray-50 flex items-center justify-center">
                        <Image
                          src={survey.image}
                          alt={survey.title}
                          className="w-28 h-28 object-contain"
                        />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-[17px] font-bold text-gray-900 mb-2 leading-tight">
                          {survey.title}
                        </h3>
                        <p className="text-[13px] text-gray-500 mb-4 leading-relaxed flex-1">
                          {survey.description}
                        </p>
                        {survey.status === "Completed" && (
                          <>
                            <button className="w-full px-4 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F2A6E] transition-all shadow-md mb-3">
                              {survey.buttonText}
                            </button>
                            <p className="text-[13px] text-gray-600">
                              <span className="font-semibold">
                                Submitted On :
                              </span>{" "}
                              {survey.submittedDate}
                            </p>
                          </>
                        )}
                        {survey.status === "Remaining" && (
                          <p className="text-[13px] text-gray-600">
                            <span className="font-semibold">Due :</span>{" "}
                            {survey.dueDate}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add Comments Modal */}
      {showCommentsModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center"
            onClick={() => setShowCommentsModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none">
            <div className="bg-white rounded-xl shadow-2xl w-[500px] max-w-[90vw] animate-fade-in pointer-events-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-[20px] font-bold text-gray-900">
                    Final Comments
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Pr. {pastorData.name}
                  </p>
                </div>
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-gray-500 text-xl"></i>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <textarea
                  value={finalComments}
                  onChange={(e) => setFinalComments(e.target.value)}
                  placeholder="Write the Comments here..."
                  rows={8}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowCommentsModal(false)}
                  className="px-6 py-2.5 text-[#2E3B8E] rounded-lg text-[15px] font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitComments}
                  disabled={!finalComments.trim()}
                  className={`px-6 py-2.5 rounded-lg text-[15px] font-semibold transition-all ${
                    finalComments.trim()
                      ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Mark Programme as Completed
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-8 right-8 z-[100] animate-slide-left">
          <div className="bg-white rounded-lg shadow-2xl px-6 py-4 flex items-center gap-3 min-w-[320px] border-l-4 border-green-500">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-green-600 text-lg"></i>
            </div>
            <p className="text-gray-900 font-semibold">
              Programme marked as completed successfully!
            </p>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
