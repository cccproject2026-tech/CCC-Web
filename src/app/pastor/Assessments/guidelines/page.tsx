"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import { AssessmentGuidelinesClient } from "@/app/Components/assessment-guidelines/AssessmentGuidelinesClient";

function GuidelinesInner() {
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId")?.trim() || "";
  const meetingId = searchParams.get("meetingId")?.trim() || "";
  const meetingDate = searchParams.get("meetingDate")?.trim() || "";
  const mentorName = searchParams.get("mentorName")?.trim() || "";
  const meetingPlatform = searchParams.get("platform")?.trim() || "";

  // const surveyUrl = `/pastor/PastorSurveyCMA?assessmentId=${encodeURIComponent(assessmentId)}`;
  // const scheduleMeetingHref = `${surveyUrl}&readOnly=1&scheduleMeeting=1`;
  const roadmapId = searchParams.get("roadmapId")?.trim() || "";
const taskId = searchParams.get("taskId")?.trim() || "";
const parentId = searchParams.get("parentId")?.trim() || "";

const surveyParams = new URLSearchParams({
  assessmentId,
});

if (roadmapId) surveyParams.set("roadmapId", roadmapId);
if (taskId) surveyParams.set("taskId", taskId);
if (parentId) surveyParams.set("parentId", parentId);

const surveyUrl = `/pastor/PastorSurveyCMA?${surveyParams.toString()}`;
const scheduleMeetingHref = `${surveyUrl}&readOnly=1&scheduleMeeting=1`;

  return (
    <AssessmentGuidelinesClient
      assessmentId={assessmentId}
      meetingId={meetingId}
      meetingDate={meetingDate}
      mentorName={mentorName}
      meetingPlatform={meetingPlatform}
      roadmapId={roadmapId}
      taskId={taskId}
      answersUserId={null}
      staffReview={false}
      listHref="/pastor/Assessments"
      listLabel="Back to Assessments"
      surveyUrl={surveyUrl}
      // surveyReadOnlyHref={`${surveyUrl}&readOnly=1`}
      surveyReadOnlyHref={`${surveyUrl}&readOnly=1${
  meetingId ? `&meetingId=${encodeURIComponent(meetingId)}` : ""
}${
  meetingDate ? `&meetingDate=${encodeURIComponent(meetingDate)}` : ""
}${
  mentorName ? `&mentorName=${encodeURIComponent(mentorName)}` : ""
}${
  meetingPlatform ? `&platform=${encodeURIComponent(meetingPlatform)}` : ""
}`}
      surveyRetakeUrl={`${surveyUrl}&retake=1`}
      preSurveyUrl={`/pastor/Assessments/pre-survey?assessmentId=${encodeURIComponent(assessmentId)}`}
      preSurveyRetakeUrl={`/pastor/Assessments/pre-survey?assessmentId=${encodeURIComponent(assessmentId)}&retake=1`}
      scheduleMeetingHref={scheduleMeetingHref}
      cdpHref={`/pastor/assessmentRecommendations?assessmentId=${encodeURIComponent(assessmentId)}`}
      renderHeader={() => <PastorHeader showFullHeader={true} />}
    />
  );
}

export default function AssessmentGuidelinesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#062946] text-white">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
        </div>
      }
    >
      <GuidelinesInner />
    </Suspense>
  );
}
