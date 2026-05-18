"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import SearchBar from "@/app/Components/SearchBar";
import {
  mentorFilterPanel,
  mentorMainGradient,
  mentorPageRoot,
} from "@/app/Components/mentor/mentor-theme";
import {
  apiGetAssessments,
  apiGetUserAnswers,
  parseAssessmentsListPayload,
} from "@/app/Services/assessment.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";

function isTodayDate(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function getAssessmentId(item: { _id?: string; id?: string }): string {
  const raw = item._id ?? item.id;
  return raw != null ? String(raw) : "";
}

export default function MentorAssessmentSubmissionsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true);

        const mentor = getMentorFromCookie();
        const mentorId = mentor?.id ?? mentor?._id;
        if (!mentorId) {
          setSubmissions([]);
          return;
        }

        const [usersRes, assessmentsRes] = await Promise.all([
          apiGetAssignedUsers(mentorId),
          apiGetAssessments({}),
        ]);
const pastors: any[] = Array.isArray(usersRes.data?.data) ? usersRes.data.data : [];
        const assessments = parseAssessmentsListPayload(assessmentsRes.data);

        const results: any[] = [];

        for (const pastor of pastors) {
          const pastorId = String(pastor._id ?? pastor.id ?? "");
          const pastorName =
            `${pastor.firstName || ""} ${pastor.lastName || ""}`.trim() || "Pastor";

          for (const assessment of assessments) {
            const assessmentId = getAssessmentId(assessment);
            if (!assessmentId || !pastorId) continue;

            try {
              const res = await apiGetUserAnswers(assessmentId, pastorId);
              const answerData = (res.data as any)?.data;

              if (!answerData?._id) continue;

              results.push({
                ...assessment,
                _id: assessmentId,
                pastorId,
                pastorName,
                submittedAt: answerData.updatedAt || answerData.createdAt,
              });
            } catch {
              // No submission for this pastor + assessment.
            }
          }
        }

        setSubmissions(results);
   
      } catch (err) {
        console.error("Failed to load submissions", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    };

    void loadSubmissions();
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return submissions;

    return submissions.filter((item) =>
      String(item.pastorName || "").toLowerCase().includes(q),
    );
  }, [submissions, searchTerm]);

  const todaySubmissions = filtered.filter((item) => isTodayDate(item.submittedAt));
  const previousSubmissions = filtered.filter(
    (item) => item.submittedAt && !isTodayDate(item.submittedAt),
  );

  const renderCard = (assessment: any, idx: number) => (
    <div
      key={`${assessment._id}-${assessment.pastorId}-${idx}`}
      className="flex min-h-[120px] flex-col rounded-xl border border-white/10 bg-white/[0.04] p-4"
    >
      <p className="text-sm font-semibold text-white">
        {assessment.name || "Assessment"}
      </p>

      <p className="mt-1 text-xs font-semibold text-amber-200">
        Submitted by {assessment.pastorName}
      </p>

      <div className="mt-auto flex justify-end gap-2 pt-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${assessment.pastorId}`,
            )
          }
          className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
        >
          View Result
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/mentor/MentorAssessments/result?assessmentId=${assessment._id}&userId=${assessment.pastorId}&editRecommendation=1`,
            )
          }
          className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
        >
          Send CDP
        </button>
      </div>
    </div>
  );

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <main className={`${mentorMainGradient} min-h-screen px-6 py-8`}>
        <div className="mb-6">
          <button
            type="button"
            onClick={() => router.push("/mentor/MentorAssessments")}
            className="mb-4 text-sm font-semibold text-[#8ec5eb] hover:underline"
          >
            ← Back to Assessments
          </button>

          <h1 className="text-2xl font-bold text-white">
            Assessment Submissions
          </h1>
          <p className="mt-1 text-sm text-[#cde2f2]/75">
            View today&apos;s and previous assessment submissions.
          </p>
        </div>

        <div className={`${mentorFilterPanel} mb-6 p-5`}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by pastor name..."
            variant="dark"
            className="max-w-xl"
          />
        </div>

        {loading ? (
          <p className="py-10 text-center text-sm text-[#cde2f2]/75">
            Loading submissions...
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <section className={`${mentorFilterPanel} p-5`}>
              <h2 className="mb-4 text-lg font-semibold text-white">
                Today&apos;s Submissions
              </h2>

              <div className="space-y-3">
                {todaySubmissions.length > 0 ? (
                  todaySubmissions.map(renderCard)
                ) : (
                  <p className="text-sm text-[#cde2f2]/70">
                    No assessments submitted today.
                  </p>
                )}
              </div>
            </section>

            <section className={`${mentorFilterPanel} p-5`}>
              <h2 className="mb-4 text-lg font-semibold text-white">
                Previous Submissions
              </h2>

              <div className="space-y-3">
                {previousSubmissions.length > 0 ? (
                  previousSubmissions.map(renderCard)
                ) : (
                  <p className="text-sm text-[#cde2f2]/70">
                    No previous submissions found.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}