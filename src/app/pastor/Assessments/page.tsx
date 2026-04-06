"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "@/app/Assets/assignments-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { ApiImagePlaceholder } from "@/app/Components/ApiMediaPlaceholder";
import { getCookie } from "@/app/utils/cookies";
import {
  apiGetAssignedAssessments,
  parseAssignedAssessmentsListBody,
  flattenAssignedAssessmentRow,
} from "@/app/Services/assessment.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";

function isHttpUrl(u?: string): boolean {
  return !!u && (u.startsWith("http://") || u.startsWith("https://"));
}

type Row = {
  id: string;
  title: string;
  desc: string;
  status: "Due" | "Not Started" | "Completed" | "Submitted";
  date: string;
  imgUrl: string | null;
  button: string;
  meeting?: string;
};

export default function PastorAssessments() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [assessments, setAssessments] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const userCookie = getCookie("user");
        if (!userCookie) return;

        const user = JSON.parse(userCookie) as { id?: string; _id?: string };
        const userId = user.id || user._id;
        if (!userId) return;

        const [assessmentRes, progressRes] = await Promise.all([
          apiGetAssignedAssessments(String(userId)),
          apiGetUserProgress(String(userId)),
        ]);

        const list = parseAssignedAssessmentsListBody(assessmentRes.data);

        const progressData = unwrapProgressData(progressRes);
        const assessmentProgress = progressData?.assessments || [];

        const mapped: Row[] = list
          .map((item) => {
            const flat = flattenAssignedAssessmentRow(item);
            if (!flat) return null;
            const { assessment, assessmentId: aid, assignmentId, dueDate, meetingDate, updatedAt } = flat;
            const progress = assessmentProgress.find(
              (p: { assessmentId?: string; assignmentId?: string }) =>
                String(p.assessmentId) === aid ||
                (assignmentId && p.assignmentId && String(p.assignmentId) === assignmentId),
            );

            const ps = String(progress?.status || "").toLowerCase().replace(/\s+/g, "_");
            let status: Row["status"] = "Not Started";
            if (ps === "completed" || ps === "reviewed") status = "Completed";
            else if (ps === "submitted") status = "Submitted";
            else if (
              ps === "in_progress" ||
              ps === "inprogress" ||
              ps === "assigned" ||
              ps === "due"
            )
              status = "Due";

            const banner = assessment?.bannerImage as string | undefined;
            const imgUrl = isHttpUrl(banner) ? banner! : null;

            return {
              id: aid,
              title: (assessment?.name as string) || "Assessment",
              desc: (assessment?.description as string) || "",
              status,
              date: dueDate ? new Date(dueDate).toLocaleDateString() : "",
              imgUrl,
              button:
                status === "Completed"
                  ? "View Results"
                  : status === "Submitted"
                    ? "View submission"
                    : "Start Now",
              meeting: meetingDate ? new Date(meetingDate).toLocaleDateString() : undefined,
            };
          })
          .filter((r): r is Row => r != null);

        setAssessments(mapped);
      } catch (error) {
        console.error("Failed to fetch assessments", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const filtered = assessments.filter((a) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (a.title || "").toLowerCase().includes(q);
    if (activeTab === "All") return matchesSearch;
    return a.status === activeTab && matchesSearch;
  });

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
      <div className="flex h-screen items-center justify-center bg-[#062946] text-white">
        Loading assessments...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex h-[200px] items-end justify-start bg-cover bg-center px-4 pb-8 md:h-[250px] md:px-8 md:pb-12 lg:px-16"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white md:text-4xl">Assessments</h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Complete assigned assessments and monitor your submission status.
          </p>
        </div>
      </section>

      <main className="relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 pb-12 pt-8 md:px-10 md:pb-20 md:pt-16 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-stretch justify-between gap-4 md:mb-10 lg:flex-row lg:items-center">
            <div className="relative w-full lg:w-[350px]">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#cde2f2]" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white shadow-sm outline-none backdrop-blur placeholder:text-[#cde2f2] focus:ring-2 focus:ring-[#8ec5eb]"
              />
            </div>

            <div className="flex overflow-x-auto rounded-xl border border-white/20 bg-white/10 shadow-sm backdrop-blur">
              {["All", "Due", "Not Started", "Completed", "Submitted"].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-3 py-2 text-xs font-medium transition-all md:px-5 md:text-sm ${
                    activeTab === tab ? "bg-white text-[#0f4a76]" : "text-[#d9ebf8] hover:bg-white/15"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-[#cde2f2]">No assessments to show.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg md:flex-row"
                >
                  <div className="relative m-4 h-[180px] w-full flex-shrink-0 md:m-5 md:h-[200px] md:w-[200px]">
                    {item.imgUrl ? (
                      <Image
                        src={item.imgUrl}
                        alt=""
                        width={200}
                        height={200}
                        className="h-full w-full rounded-lg object-cover"
                        unoptimized
                      />
                    ) : (
                      <ApiImagePlaceholder className="h-full w-full rounded-lg" />
                    )}
                    {item.date ? (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-[#fff6d8] px-2 py-[3px] text-xs font-semibold text-[#d38a00]">
                        <i className="fa-regular fa-calendar text-xs" />
                        {item.date}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 md:p-5">
                    <div>
                      <h3 className="mb-1 text-[15px] font-semibold leading-tight text-white md:text-[17px]">
                        {item.title}
                      </h3>
                      <p className="mb-3 text-sm text-[#cde2f2]">{item.desc}</p>

                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-xs font-medium text-[#d9ebf8]">Status</span>
                        <span
                          className={`rounded px-2 py-[2px] text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      {item.status === "Submitted" && (
                        <>
                          <p className="mb-2 text-xs text-[#d9ebf8]">Submitted on : {item.date}</p>
                          {item.meeting ? (
                            <p className="inline-block rounded-md bg-white/15 px-3 py-2 text-xs font-medium text-[#d9ebf8]">
                              Meeting: {item.meeting}
                            </p>
                          ) : null}
                        </>
                      )}

                      {item.status === "Completed" && (
                        <p className="mt-2 text-xs text-[#d9ebf8]">Completed on : {item.date}</p>
                      )}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/pastor/PastorSurveyCMA?assessmentId=${item.id}`)
                        }
                        className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] md:px-5 md:text-sm"
                      >
                        {item.button}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
