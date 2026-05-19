"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { apiGetMentorSchedule } from "@/app/Services/appointments.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetAssessmentById, parseAssessmentDetailPayload } from "@/app/Services/assessment.service";
import {
  mentorFilterPanel,
  mentorMainGradient,
  mentorPageRoot,
} from "@/app/Components/mentor/mentor-theme";

type MeetingRow = {
  id: string;
  pastorName: string;
  assessmentId: string;
  assessmentName: string;
  meetingDate?: string;
  platform?: string;
  meetingLink?: string;
  status?: string;
};

function getAppointmentId(item: any): string {
  return String(item?._id ?? item?.id ?? "");
}

function getMeetingDate(item: any): string {
  return String(item?.meetingDate ?? item?.date ?? item?.scheduledAt ?? item?.startTime ?? "");
}

function getPastorName(item: any): string {
  const user = item?.userId || item?.pastorId || item?.user || item?.pastor;
  if (typeof user === "object" && user) {
    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    if (name) return name;
    if (user.name) return String(user.name);
    if (user.email) return String(user.email);
  }

  return String(item?.pastorName ?? item?.userName ?? "Pastor");
}

function getAssessmentIdFromAppointment(item: any): string {
  const direct = String(item?.assessmentId ?? item?.assessment?._id ?? item?.assessment?.id ?? "").trim();
  if (direct) return direct;

  const notes = String(item?.notes ?? item?.description ?? "");
  const match = notes.match(/assessmentId=([^|\s]+)/i);
  return String(match?.[1] || "").trim();
}

function isToday(value?: string): boolean {
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

function isThisWeekUpcoming(value?: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = new Date();
  const end = new Date(now);
  end.setDate(now.getDate() + 7);
  end.setHours(23, 59, 59, 999);

  return date > now && date <= end;
}

function formatMeetingDate(value?: string): string {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function MentorAssessmentMeetingsPage() {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingSearch, setMeetingSearch] = useState("");

  useEffect(() => {
    const mentor = getMentorFromCookie();
    const mentorId = String(mentor?.id ?? mentor?._id ?? "");

    if (!mentorId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadMeetings = async () => {
      try {
        setLoading(true);
const assignedUsersRes = await apiGetAssignedUsers(mentorId);
const assignedUsers = Array.isArray((assignedUsersRes.data as any)?.data)
  ? (assignedUsersRes.data as any).data
  : [];

const pastorNameById = new Map(
  assignedUsers.map((u: any) => [
    String(u._id ?? u.id ?? ""),
    `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email || "Pastor",
  ]),
);
        const res = await apiGetMentorSchedule(mentorId);
        const body: any = res.data;
        const list: any[] = Array.isArray(body?.data) ? body.data : [];

        const assessmentNameCache = new Map<string, string>();

        const rows = await Promise.all(
          list.map(async (item) => {
            const assessmentId = getAssessmentIdFromAppointment(item);

            let assessmentName = "Assessment";
            if (assessmentId) {
              if (assessmentNameCache.has(assessmentId)) {
                assessmentName = assessmentNameCache.get(assessmentId) || "Assessment";
              } else {
                try {
                  const assessmentRes = await apiGetAssessmentById(assessmentId);
                  const detail = parseAssessmentDetailPayload(assessmentRes.data);
                  assessmentName = String((detail as any)?.name || (detail as any)?.title || "Assessment");
                  assessmentNameCache.set(assessmentId, assessmentName);
                } catch {
                  assessmentNameCache.set(assessmentId, "Assessment");
                }
              }
            }

            return {
              id: getAppointmentId(item),
//               pastorName:
//   pastorNameById.get(String(item?.userId ?? item?.pastorId ?? item?.user?._id ?? item?.pastor?._id ?? "")) ||
//   getPastorName(item),
pastorName:
  pastorNameById.get(
    String(
      item?.userId?._id ??
      item?.userId ??
      item?.pastorId?._id ??
      item?.pastorId ??
      item?.user?._id ??
      item?.pastor?._id ??
      ""
    ),
  ) || getPastorName(item),
              assessmentId,
              assessmentName,
              meetingDate: getMeetingDate(item),
              platform: String(item?.platform ?? item?.meetingPlatform ?? ""),
              meetingLink: String(item?.meetingLink ?? item?.link ?? ""),
              status: String(item?.status ?? ""),
            };
          }),
        );

        // const assessmentRows = rows.filter((row) => row.assessmentId);
 const assessmentRows = rows.filter((row) => Boolean(row.assessmentId)) as MeetingRow[];

        if (!cancelled) setMeetings(assessmentRows);
      } catch (err) {
        console.error("Failed to load assessment meetings", err);
        if (!cancelled) setMeetings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadMeetings();

    return () => {
      cancelled = true;
    };
  }, []);

  const todaysMeetings = useMemo(() => {
    return meetings
      .filter((item) => isToday(item.meetingDate))
      .sort((a, b) => new Date(a.meetingDate || 0).getTime() - new Date(b.meetingDate || 0).getTime());
  }, [meetings]);

  const upcomingMeetings = useMemo(() => {
    return meetings
      .filter((item) => !isToday(item.meetingDate) && isThisWeekUpcoming(item.meetingDate))
      .sort((a, b) => new Date(a.meetingDate || 0).getTime() - new Date(b.meetingDate || 0).getTime());
  }, [meetings]);
const visibleTodaysMeetings = useMemo(() => {
  const q = meetingSearch.trim().toLowerCase();
  if (!q) return todaysMeetings;
  return todaysMeetings.filter((item) =>
    item.pastorName.toLowerCase().includes(q),
  );
}, [todaysMeetings, meetingSearch]);

const visibleUpcomingMeetings = useMemo(() => {
  const q = meetingSearch.trim().toLowerCase();
  if (!q) return upcomingMeetings;
  return upcomingMeetings.filter((item) =>
    item.pastorName.toLowerCase().includes(q),
  );
}, [upcomingMeetings, meetingSearch]);
  const renderMeetingCard = (meeting: MeetingRow) => (
    <div
      key={meeting.id || `${meeting.assessmentId}-${meeting.meetingDate}`}
      className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{meeting.assessmentName}</h3>
         <p className="mt-1 text-sm text-[#cde2f2]/75">
  Pastor:{" "}
  <span className="font-semibold text-amber-200">
    {meeting.pastorName}
  </span>
</p>
          <p className="mt-1 text-sm text-[#cde2f2]/75">
            Time: {formatMeetingDate(meeting.meetingDate)}
          </p>
          {/* {meeting.platform && (
            <p className="mt-1 text-sm text-[#cde2f2]/75">Platform: {meeting.platform}</p>
          )} */}
          {meeting.platform && (
  <p className="mt-1 text-sm text-[#cde2f2]/75">
    Platform:{" "}
    {meeting.meetingLink ? (
      <a
        href={meeting.meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-[#8ec5eb] underline-offset-4 hover:underline"
      >
        {meeting.platform}
      </a>
    ) : (
      <span>{meeting.platform}</span>
    )}
  </p>
)}
        </div>

        {/* <button
          type="button"
          onClick={() => meeting.id && router.push(`/mentor/MentorSchedule/${encodeURIComponent(meeting.id)}`)}
          className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
        >
          View Meeting
        </button> */}
        <div className="flex flex-col items-end gap-2">
  <button
    type="button"
    onClick={() =>
      meeting.id &&
      router.push(`/mentor/MentorSchedule?appointmentId=${encodeURIComponent(meeting.id)}&reschedule=1`)
    }
    className="rounded-lg border border-amber-300/40 bg-amber-400/15 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
  >
    Reschedule Meeting
  </button>

  <button
    type="button"
    onClick={() =>
      meeting.id &&
      router.push(`/mentor/MentorSchedule/${encodeURIComponent(meeting.id)}`)
    }
    className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
  >
    View Meeting
  </button>
</div>
      </div>
    </div>
  );

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <main className={`${mentorMainGradient} min-h-screen px-4 py-8 sm:px-8`}>
        <button
          type="button"
          onClick={() => router.push("/mentor/MentorAssessments")}
          className="mb-6 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          <i className="fa-solid fa-arrow-left" />
          Back to Assessments
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Assessment Scheduled Meetings
          </h1>
          <p className="mt-2 text-sm text-[#cde2f2]/75">
            Review today&apos;s and this week&apos;s assessment-related meetings.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
          </div>
        ) : (
            <>
            <div className="mb-5">
  <input
    value={meetingSearch}
    onChange={(e) => setMeetingSearch(e.target.value)}
    placeholder="Search by pastor name..."
    className="h-12 w-full max-w-md rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white outline-none placeholder:text-white/45"
  />
</div>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <section className={`${mentorFilterPanel} p-5`}>
              <h2 className="mb-4 text-lg font-semibold text-white">
                Today&apos;s Assessment Meetings
              </h2>

              {visibleTodaysMeetings.length > 0 ? (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                  {visibleTodaysMeetings.map(renderMeetingCard)}
                </div>
              ) : (
                <p className="text-sm text-[#cde2f2]/70">
                  No assessment meetings scheduled for today.
                </p>
              )}

            </section>

            <section className={`${mentorFilterPanel} p-5`}>
              <h2 className="mb-4 text-lg font-semibold text-white">
                This Week&apos;s Upcoming Assessment Meetings
              </h2>

             {visibleUpcomingMeetings.length > 0 ? (
                <div className="max-h-[520px] space-y-3 overflow-y-auto pr-2">
                  {visibleUpcomingMeetings.map(renderMeetingCard)}
                </div>
              ) : (
                <p className="text-sm text-[#cde2f2]/70">
                  No upcoming assessment meetings found for this week.
                </p>
              )}
            </section>
          </div>
          </>
        )}

      </main>
    </div>
  );
}