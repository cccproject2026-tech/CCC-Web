"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import MentorBg from "../../../Assets/mentor-bg.png";
import Jumpstart from "../../../Assets/jumpstart-hero.png";
import SelfRevitalization from "../../../Assets/self-revitalization-hero.png";
import Roadmap from "../../../Assets/roadmap-bg.png";
import CCCLogo from "../../../Assets/CCCLogo.png";
import Image from "next/image";
import Link from "next/link";

export default function PastorDetailPage({ params }) {
  const router = useRouter();
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [finalComments, setFinalComments] = useState("");

  // Dummy data for the pastor
  const pastorData = {
    name: "John Doe",
    overallProgress: 100,
    roadmapCompleted: 5,
    roadmapTotal: 5,
    assessmentsCompleted: 3,
    assessmentsTotal: 3,
  };

  const phases = [
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
      status: "Completed",
      completedDate: "20 Oct 2024",
    },
  ];

  const surveys = [
    {
      id: 1,
      title: "Church Assessment Evaluation(CMA)",
      description: "Interested in receiving mentoring in community engagement.",
      image: CCCLogo,
      buttonText: "Customized Development Plans",
      submittedDate: "20 Oct 2024",
    },
    {
      id: 2,
      title: "Church Assessment Evaluation(CMA)",
      description: "Interested in receiving mentoring in community engagement.",
      image: CCCLogo,
      buttonText: "Customized Development Plans",
      submittedDate: "20 Oct 2024",
    },
  ];

  const handleAddComments = () => {
    console.log("Final Comments:", finalComments);
    setShowCommentsModal(false);
    setFinalComments("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Breadcrumbs */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6">
        <div className="max-w-[1400px] mx-auto">
          <nav className="flex items-center gap-2 text-sm text-blue-300">
            <Link href="/director/all-pastors" className="hover:text-white">
              Track Progress
            </Link>
            <i className="fa-solid fa-chevron-right text-[10px]"></i>
            <span className="text-white font-semibold">{pastorData.name}</span>
          </nav>
        </div>
      </section>

      {/* Page Title */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-4">
        <div className="max-w-[1400px] mx-auto">
          <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold text-white leading-tight">
            {pastorData.name}
          </h1>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8 md:py-12">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Overall and Individual Progress Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overall Progress Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <h2 className="text-[24px] font-bold text-gray-900 mb-6">
                Overall Progress
              </h2>

              {/* Legend */}
              <div className="flex items-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-800"></div>
                  <span className="text-gray-700">Roadmap & Assessments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-200"></div>
                  <span className="text-gray-700">Remaining</span>
                </div>
              </div>

              {/* Circular Progress */}
              <div className="flex justify-center items-center">
                <div className="relative w-[280px] h-[280px]">
                  <svg className="transform -rotate-90 w-full h-full">
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      stroke="#e5e7eb"
                      strokeWidth="24"
                      fill="none"
                    />
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      stroke="#3b82f6"
                      strokeWidth="24"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 120}`}
                      strokeDashoffset={`${
                        2 *
                        Math.PI *
                        120 *
                        (1 - pastorData.overallProgress / 100)
                      }`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[36px] font-bold text-blue-600">
                      Completed
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[48px] font-bold text-blue-600">
                        {pastorData.overallProgress}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Progress Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[24px] font-bold text-gray-900">
                  Individual Progress
                </h2>
                <button
                  onClick={() => setShowCommentsModal(true)}
                  className="px-5 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                >
                  Add Final Comments
                </button>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-800"></div>
                  <span className="text-gray-700">Roadmap & Assessments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-800"></div>
                  <span className="text-gray-700">Total</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-200"></div>
                  <span className="text-gray-700">Remaining</span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="space-y-6">
                {/* Roadmap Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-semibold text-gray-700">
                      Roadmap
                    </span>
                  </div>
                  <div className="relative h-12 bg-blue-200 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-6">
                        <div className="h-8 w-8 bg-blue-800 rounded"></div>
                        <div className="h-8 w-8 bg-blue-500 rounded"></div>
                      </div>
                    </div>
                    <div className="absolute top-1 right-2 text-[12px] font-bold text-blue-800">
                      100%
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-[12px] text-gray-600">
                    <span>Total: {pastorData.roadmapTotal}</span>
                    <span>Completed: {pastorData.roadmapCompleted}</span>
                  </div>
                </div>

                {/* Assessments Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[15px] font-semibold text-gray-700">
                      Assessments
                    </span>
                  </div>
                  <div className="relative h-12 bg-blue-200 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-6">
                        <div className="h-6 w-8 bg-blue-800 rounded"></div>
                        <div className="h-6 w-8 bg-blue-500 rounded"></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-[12px] text-gray-600">
                    <span>Total: {pastorData.assessmentsTotal}</span>
                    <span>Completed: {pastorData.assessmentsCompleted}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revitalization Roadmap Progress */}
          <div>
            <h2 className="text-[28px] font-bold text-white mb-6">
              Revitalization Roadmap Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phases.map((phase) => (
                <div
                  key={phase.id}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex gap-5">
                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden flex-shrink-0">
                      <Image
                        src={phase.image}
                        alt={phase.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <i className="fa-solid fa-check text-white text-sm"></i>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[18px] font-bold text-gray-900 mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-[14px] text-gray-600 mb-3 leading-relaxed">
                        {phase.description}
                      </p>
                      <div className="inline-block px-3 py-1.5 bg-green-100 text-green-800 rounded-lg text-[12px] font-semibold mb-2">
                        Status: {phase.status}
                      </div>
                      <p className="text-[13px] text-gray-600">
                        Completed on: {phase.completedDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Survey Progress */}
          <div>
            <h2 className="text-[28px] font-bold text-white mb-6">
              Survey Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {surveys.map((survey) => (
                <div
                  key={survey.id}
                  className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
                >
                  <div className="flex gap-5">
                    <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      <Image
                        src={survey.image}
                        alt={survey.title}
                        className="w-full h-full object-contain p-4"
                      />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <h3 className="text-[18px] font-bold text-gray-900 mb-2">
                        {survey.title}
                      </h3>
                      <p className="text-[14px] text-gray-600 mb-4 leading-relaxed flex-1">
                        {survey.description}
                      </p>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-all w-full mb-2">
                        {survey.buttonText}
                      </button>
                      <p className="text-[13px] text-gray-600">
                        Submitted On: {survey.submittedDate}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add Comments Modal */}
      {showCommentsModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowCommentsModal(false)}
          ></div>
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] animate-fade-in w-[500px] max-w-[90vw]">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-[20px] font-bold text-gray-900">
                  Add Final Comments
                </h3>
              </div>
              <div className="p-6">
                <textarea
                  value={finalComments}
                  onChange={(e) => setFinalComments(e.target.value)}
                  placeholder="Enter your comments here..."
                  rows={6}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={() => setShowCommentsModal(false)}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-300 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddComments}
                    className="px-5 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                  >
                    Add Comments
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <AppFooter />
    </div>
  );
}




