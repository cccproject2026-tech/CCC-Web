"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserProgress } from "@/app/Services/progress.service";

// Images
import progressBg from "../../Assets/progress-bg.png";
import card1 from "../../Assets/card1.png";
import card2 from "../../Assets/card2.png";
import card3 from "../../Assets/card3.png";

export default function PastorProgressPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("Remaining");
  const [overallProgress, setOverallProgress] = useState(0);
  const [roadmapProgress, setRoadmapProgress] = useState(0);
  const [assessmentProgress, setAssessmentProgress] = useState(0);
  const [completedItems, setCompletedItems] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const userCookie = getCookie("user");
        if (!userCookie) return;
        const user = JSON.parse(userCookie);
        const userId = user?.id || user?._id;
        if (!userId) return;

        const res = await apiGetUserProgress(userId);
        const data = res.data?.data;
        if (!data) return;

        setOverallProgress(Number(data.overallProgress || 0));
        setRoadmapProgress(Number(data.overallRoadmapProgress || 0));
        setAssessmentProgress(Number(data.overallAssessmentProgress || 0));
        setCompletedItems(Number(data.completedItems || 0));
        setTotalItems(Number(data.totalItems || 0));
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    };

    fetchProgress();
  }, []);

  const donut = useMemo(() => {
    const value = Math.max(0, Math.min(100, overallProgress));
    const size = 210;
    const stroke = 16;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return { size, stroke, radius, circumference, offset, value };
  }, [overallProgress]);

  const roadmapCards = [
    {
      img: card1,
      title: "Self Revitalization Phase",
      completion: "10/12 tasks completed",
      time: "Completion Time",
    },
    {
      img: card2,
      title: "Church Empowerment Phase",
      completion: "14/18 tasks completed",
      time: "Completion Time",
    },
    {
      img: card3,
      title: "Community Revitalization and Multiplication Phase",
      completion: "5/12 tasks completed",
      time: "Completion Time",
    },
  ];

  const surveyCard = {
    img: card1,
    title: "Church Assessment Evaluation (CMA)",
    due: "Due 02/12/2024",
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative flex h-[220px] items-end bg-cover bg-center px-4 pb-8 md:h-[280px] md:px-8 lg:px-16"
        style={{ backgroundImage: `url(${progressBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Growth Insights
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-wide text-white md:text-4xl">
            My Progress
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Track roadmap completion and assessment progress across your journey.
          </p>
        </div>
      </section>

      {/* CONTENT */}
      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
        {/* --- OVERALL + INDIVIDUAL PROGRESS --- */}
        <section className="grid grid-cols-1 gap-4 bg-transparent px-4 py-8 md:gap-8 md:px-8 md:py-12 lg:px-16 lg:grid-cols-2">
          {/* Left Card */}
          <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-4 shadow-sm md:p-8">
            <h3 className="mb-4 text-lg font-semibold text-white">Overall Progress</h3>
            <div className="flex flex-col items-center justify-center">
              <svg width={donut.size} height={donut.size} className="drop-shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
                <circle
                  cx={donut.size / 2}
                  cy={donut.size / 2}
                  r={donut.radius}
                  stroke="rgba(255,255,255,0.18)"
                  strokeWidth={donut.stroke}
                  fill="none"
                />
                <circle
                  cx={donut.size / 2}
                  cy={donut.size / 2}
                  r={donut.radius}
                  stroke="#8ec5eb"
                  strokeWidth={donut.stroke}
                  fill="none"
                  strokeDasharray={donut.circumference}
                  strokeDashoffset={donut.offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${donut.size / 2} ${donut.size / 2})`}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="34"
                  fontWeight="700"
                >
                  {donut.value}%
                </text>
              </svg>
              <p className="mt-3 text-sm text-[#d9ebf8]">
                {completedItems}/{totalItems || 0} items completed
              </p>
            </div>
          </div>

          {/* Right Card */}
          <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-4 shadow-sm md:p-8">
            <h3 className="mb-4 text-lg font-semibold text-white">Individual Progress</h3>
            <div className="space-y-5">
              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-[#d9ebf8]">
                  <span>Roadmaps</span>
                  <span className="font-semibold text-white">{Math.round(roadmapProgress)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/20">
                  <div
                    className="h-2.5 rounded-full bg-[#8ec5eb] transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, roadmapProgress))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-[#d9ebf8]">
                  <span>Assessments</span>
                  <span className="font-semibold text-white">{Math.round(assessmentProgress)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/20">
                  <div
                    className="h-2.5 rounded-full bg-[#f5cc76] transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, assessmentProgress))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm text-[#d9ebf8]">
                  <span>Total Completion</span>
                  <span className="font-semibold text-white">{Math.round(overallProgress)}%</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-white/20">
                  <div
                    className="h-2.5 rounded-full bg-[#34d399] transition-all duration-500"
                    style={{ width: `${Math.max(0, Math.min(100, overallProgress))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- ROADMAP PROGRESS --- */}
      {/* --- ROADMAP PROGRESS --- */}
<section className="mb-12 bg-transparent px-4 pt-8 md:px-8 lg:px-16">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
    <h2 className="text-lg md:text-xl font-semibold">Revitalization Roadmap Progress</h2>

    <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 text-sm shadow backdrop-blur">
      {["All", "Completed", "Remaining"].map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`px-3 md:px-5 py-2 text-xs md:text-sm font-medium transition-all ${
            filter === tab
              ? "bg-white text-[#0f4a76]"
              : "text-[#d9ebf8] hover:bg-white/15"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
    {/* CARD 1 */}
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-sm transition-all hover:shadow-md">
      <div className="flex">
        <div className="w-1/3 sm:w-1/4 md:w-1/3">
          <Image
            src={card1}
            alt="Self Revitalization"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-3 md:p-5">
          <h4 className="mb-1 text-sm font-semibold text-white md:text-[15px]">
            Self Revitalization Phase
          </h4>
          <p className="mb-3 text-xs text-[#cde2f2] md:text-[13px]">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-medium text-[#d9ebf8]">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#FFF0F0] text-[#B91C1C] border-[#FCA5A5]">
              Due
            </span>
          </div>

          {/* Progress bar */}
          <p className="mb-1 text-[12px] text-[#d9ebf8]">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#16A34A] rounded-full w-[75%]"></div>
          </div>
          <p className="mb-2 text-[12px] font-medium text-white">06/08</p>

          <p className="text-[12px] text-[#d9ebf8]">
            Completion Time{" "}
            <span className="font-semibold text-white">Months 1 – 2</span>
          </p>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => router.push("/pastor/SelfRevitalizationPhasePage")}
              className="rounded-md bg-white px-3 py-[6px] text-[10px] font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] md:px-6 md:text-[12px]"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* CARD 2 */}
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-sm transition-all hover:shadow-md">
      <div className="flex">
        <div className="w-1/3 sm:w-1/4 md:w-1/3">
          <Image
            src={card2}
            alt="Church Empowerment Phase"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-3 md:p-5">
          <h4 className="mb-1 text-sm font-semibold text-white md:text-[15px]">
            Church Empowerment Phase
          </h4>
          <p className="mb-3 text-xs text-[#cde2f2] md:text-[13px]">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-medium text-[#d9ebf8]">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]">
              In-progress
            </span>
          </div>

          <p className="mb-1 text-[12px] text-[#d9ebf8]">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#F59E0B] rounded-full w-[65%]"></div>
          </div>
          <p className="mb-2 text-[12px] font-medium text-white">12/18</p>

          <p className="text-[12px] text-[#d9ebf8]">
            Completion Time{" "}
            <span className="font-semibold text-white">Months 3 – 9</span>
          </p>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => router.push("/pastor/ChurchEmpowermentPhase")}
              className="rounded-md bg-white px-3 py-[6px] text-[10px] font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] md:px-6 md:text-[12px]"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* CARD 3 */}
    <div className="overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-sm transition-all hover:shadow-md">
      <div className="flex">
        <div className="w-1/3 sm:w-1/4 md:w-1/3">
          <Image
            src={card3}
            alt="Community Revitalization"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 p-3 md:p-5">
          <h4 className="mb-1 text-sm font-semibold text-white md:text-[15px]">
            Community Revitalization and Multiplication Phase
          </h4>
          <p className="mb-3 text-xs text-[#cde2f2] md:text-[13px]">
            Interested in receiving mentoring in community engagement
          </p>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-medium text-[#d9ebf8]">Status</span>
            <span className="text-[11px] px-2 py-[3px] rounded-full font-medium border bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]">
              Not Started
            </span>
          </div>

          <p className="mb-1 text-[12px] text-[#d9ebf8]">Task Completed</p>
          <div className="w-full h-[6px] bg-gray-200 rounded-full mb-1">
            <div className="h-[6px] bg-[#2563EB] rounded-full w-[35%]"></div>
          </div>
          <p className="mb-2 text-[12px] font-medium text-white">05/12</p>

          <p className="text-[12px] text-[#d9ebf8]">
            Completion Time{" "}
            <span className="font-semibold text-white">Months 10 – 12</span>
          </p>

          <div className="flex justify-end mt-4">
            <button
              onClick={() => router.push("/pastor/CommunityEngagementProject")}
              className="rounded-md bg-white px-3 py-[6px] text-[10px] font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] md:px-6 md:text-[12px]"
            >
              View
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* --- SURVEY PROGRESS --- */}
<section className="bg-transparent px-4 pb-10 pt-8 md:px-8 lg:px-16">
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 text-white gap-4">
    <h2 className="text-lg md:text-xl font-semibold">Survey Progress</h2>
    <div className="flex overflow-hidden rounded-xl border border-white/20 bg-white/10 text-sm shadow backdrop-blur">
      {["All", "Completed", "Remaining"].map((tab) => (
        <button
          key={tab}
          onClick={() => setFilter(tab)}
          className={`px-3 md:px-5 py-2 text-xs md:text-sm font-medium transition-all ${
            filter === tab
              ? "bg-white text-[#0f4a76]"
              : "text-[#d9ebf8] hover:bg-white/15"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>

  <div className="max-w-full overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-sm sm:max-w-xl">
    <div className="flex">
      <div className="w-1/3 sm:w-1/4 md:w-1/3">
        <Image
          src={card1}
          alt={surveyCard.title}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 p-3 text-white md:p-5">
        <h4 className="mb-1 text-sm font-semibold md:text-[15px]">
          {surveyCard.title}
        </h4>
        <p className="mb-3 text-xs text-[#cde2f2] md:text-[13px]">
          Interested in receiving mentoring in community engagement
        </p>
        <p className="mb-1 text-[12px] text-[#d9ebf8]">Due</p>
        <p className="mb-4 text-[13px] font-semibold text-white">
          20 Oct 2024
        </p>

        <div className="flex justify-end">
          <button
            onClick={() => router.push("/pastor/Assessments")}
            className="rounded-md bg-white px-3 py-[6px] text-[10px] font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] md:px-6 md:text-[12px]"
          >
            View
          </button>
        </div>
      </div>
    </div>
  </div>
</section>

      </main>


    </div>
  );
}
