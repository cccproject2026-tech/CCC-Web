"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "@/app/Assets/assignments-bg.png";
import Card1 from "@/app/Assets/card1.png";
import Card2 from "@/app/Assets/card2.png";
import Card3 from "@/app/Assets/card3.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getCookie } from "@/app/utils/cookies";
import { apiGetAssignedAssessments } from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";

export default function PastorAssessments() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const userCookie = getCookie("user");

        if (!userCookie) {
          console.error("User cookie not found");
          return;
        }

        const user = JSON.parse(userCookie);
        const userId = user.id;

        const [assessmentRes, progressRes] = await Promise.all([
          apiGetAssignedAssessments(userId),
          apiGetUserProgress(userId),
        ]);

        // assigned assessments
        const data = assessmentRes.data?.data || [];

        // progress response
        const progressData = progressRes.data?.data || {};
        const assessmentProgress = progressData?.assessments || [];

        const mapped = data.map((item: any) => {
          const progress = assessmentProgress.find(
            (p: any) => p.assignmentId === item.assignmentId
          );

          const status =
            progress?.status === "completed"
              ? "Completed"
              : progress?.status === "submitted"
                ? "Submitted"
                : "Not Started";

          return {
            id: item.assignmentId,
            title: item.assessment?.name || "Assessment",
            desc: item.assessment?.description || "",
            status,
            date: item.dueDate
              ? new Date(item.dueDate).toLocaleDateString()
              : "",
            img: Card1,
            button: status === "Completed" ? "View Results" : "Start Now",
          };
        });

        setAssessments(mapped);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  // const assessments = [
  //   {
  //     id: 1,
  //     title: "Church Assessment Evaluation (CMA)",
  //     desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
  //     status: "Due",
  //     date: "20 Oct 2024",
  //     img: Card1,
  //     button: "Start Now",
  //   },
  //   {
  //     id: 2,
  //     title: "Pastoral Ministry Profile (PMP)",
  //     desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
  //     status: "Not Started",
  //     date: "20 Oct 2024",
  //     img: Card2,
  //     button: "Start Now",
  //   },
  //   {
  //     id: 3,
  //     title: "Pastoral Ministry Profile (PMP)",
  //     desc: "This Assessment is about Lorem ipsum dolor sit amet, consectetur",
  //     status: "Submitted",
  //     date: "20 Oct 2024",
  //     meeting: "20 January 2025",
  //     img: Card3,
  //     button: "Meeting Scheduled on 20 January 2025",
  //   },
  //   {
  //     id: 4,
  //     title: "Pastoral Ministry Profile (PMP)",
  //     desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
  //     status: "Completed",
  //     date: "20 Oct 2024",
  //     img: Card3,
  //     button: "Customized Development Plans",
  //   },
  //   {
  //     id: 5,
  //     title: "Pastoral Ministry Profile (PMP)",
  //     desc: "This Survey is about Lorem ipsum dolor sit amet, consectetur",
  //     status: "Completed",
  //     date: "20 Oct 2024",
  //     img: Card3,
  //     button: "Customized Development Plans",
  //   },
  // ];

  const filtered = assessments.filter((a) =>
    activeTab === "All"
      ? (a.title || "").toLowerCase().includes(searchTerm.toLowerCase())
      : a.status === activeTab &&
      (a.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Due":
        return "bg-yellow-100 text-yellow-700";
      case "Not Started":
        return "bg-blue-100 text-blue-700";
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Submitted":
        return "bg-[#E0EAFF] text-[#1D4ED8]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-white">
        Loading assessments...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A3C8C] text-[#0B1C58]">
      <PastorHeader showFullHeader={true} />

      {/* 🟣 HERO SECTION */}
      <section
        className="relative h-[200px] md:h-[250px] flex items-end justify-start px-4 md:px-8 lg:px-16 pb-8 md:pb-12 bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#09256F]/70 via-[#0E2F8A]/40 to-[#133A9E]/90"></div>
        <h1 className="relative z-10 text-2xl md:text-4xl font-semibold text-white mb-1">
          Assessments
        </h1>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-[#EEF3FF] pt-8 md:pt-16 pb-12 md:pb-20 px-4 md:px-10 lg:px-20">
        <div className="max-w-7xl mx-auto">
          {/* 🔍 Search + Tabs */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8 md:mb-10">
            {/* Search Box */}
            <div className="relative w-full lg:w-[350px]">
              <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2 text-sm"></i>
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-md pl-10 pr-4 py-2 text-sm text-gray-600 shadow-sm outline-none focus:ring-2 focus:ring-[#103C8C]"
                suppressHydrationWarning
              />
            </div>

            {/* Tabs */}
            <div className="flex bg-white rounded-lg shadow-sm overflow-x-auto">
              {["All", "Due", "Not Started", "Completed", "Submitted"].map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 md:px-5 py-2 text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                      ? "bg-[#103C8C] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                      }`}
                    suppressHydrationWarning
                  >
                    {tab}
                  </button>
                )
              )}
            </div>
          </div>

          {/* 🟩 FLEX CARD LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg overflow-hidden flex flex-col md:flex-row transition-all duration-300"
              >
                {/* LEFT IMAGE */}
                <div className="relative w-full md:w-[200px] h-[180px] md:h-[200px] flex-shrink-0 m-4 md:m-5">
                  <Image
                    src={item.img}
                    alt={item.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* DUE DATE LABEL */}
                  <div className="absolute bottom-2 left-2 bg-yellow-400 text-black text-xs font-semibold px-2 py-[3px] rounded-md flex items-center gap-1">
                    <i className="fa-regular fa-calendar text-xs"></i>
                    {item.date}
                  </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex flex-col justify-between flex-1 p-4 md:p-5">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px] md:text-[17px] leading-tight mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{item.desc}</p>

                    {/* STATUS */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs text-gray-500 font-medium">
                        Status
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-[2px] rounded ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Extra Info based on status */}
                    {item.status === "Submitted" && (
                      <>
                        <p className="text-xs text-gray-600 mb-2">
                          Submitted on : {item.date}
                        </p>
                        <p className="bg-[#E0EAFF] text-[#1D4ED8] text-xs px-3 py-2 rounded-md inline-block font-medium">
                          Meeting Scheduled on {item.meeting}
                        </p>
                      </>
                    )}

                    {item.status === "Completed" && (
                      <p className="text-xs text-gray-600 mt-2">
                        Completed on : {item.date}
                      </p>
                    )}
                  </div>

                  {/* BUTTON */}
                  <div className="flex justify-end mt-3">
                    <button
                      onClick={() => router.push("/pastor/Assessments/details")}
                      className={`${item.status === "Completed"
                        ? "bg-[#103C8C]"
                        : "bg-[#103C8C]"
                        } text-white text-xs md:text-sm font-medium px-4 md:px-5 py-2 rounded-lg hover:bg-[#0B2E72] transition`}
                      suppressHydrationWarning
                    >
                      {item.button}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
