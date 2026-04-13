"use client";

import { useEffect, useMemo, useState } from "react";
import MentorHeader from "@/app/Components/MentorHeader";
import Cookies from "js-cookie";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetMentorshipSessionsNormalized } from "@/app/Services/roadmaps.service";
import { useToast } from "@/app/Components/ui/Toast";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";

type Insights = {
  challenges: string[];
  growthSignals: string[];
  emotionalTrend: { label: string; value: number }[];
  emotionalTrendNarrative?: string[];
};

function aggregateInsights(sessions: Array<{ mentorshipInsights?: any }>): Insights {
  const challenges = new Set<string>();
  const growth = new Set<string>();
  const narrative = new Set<string>();
  const buckets = new Map<string, number[]>();

  for (const s of sessions) {
    const m = s.mentorshipInsights;
    if (!m || typeof m !== "object") continue;
    (Array.isArray(m.challenges) ? m.challenges : []).forEach((x: any) => {
      const t = String(x || "").trim();
      if (t) challenges.add(t);
    });
    (Array.isArray(m.growthSignals) ? m.growthSignals : []).forEach((x: any) => {
      const t = String(x || "").trim();
      if (t) growth.add(t);
    });
    (Array.isArray(m.emotionalTrendNarrative) ? m.emotionalTrendNarrative : []).forEach((x: any) => {
      const t = String(x || "").trim();
      if (t) narrative.add(t);
    });
    (Array.isArray(m.emotionalTrend) ? m.emotionalTrend : []).forEach((pt: any) => {
      if (!pt || typeof pt !== "object") return;
      const label = String(pt.label || "").trim();
      const value = Number(pt.value);
      if (!label) return;
      const arr = buckets.get(label) ?? [];
      arr.push(Number.isFinite(value) ? value : 0);
      buckets.set(label, arr);
    });
  }

  const emotionalTrend = [...buckets.entries()].map(([label, values]) => ({
    label,
    value: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
  }));

  const out: Insights = {
    challenges: [...challenges],
    growthSignals: [...growth],
    emotionalTrend,
  };
  const n = [...narrative];
  if (n.length) out.emotionalTrendNarrative = n;
  return out;
}

export default function MentorMentoringInsightsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const mentorCookie = Cookies.get("mentor");
        if (!mentorCookie) throw new Error("Mentor information not found");
        const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
        const mentorId = mentorData?.id;
        if (!mentorId) throw new Error("Mentor ID not found");

        const assignedUsersResponse = await apiGetAssignedUsers(mentorId);
        const assignedPastors = assignedUsersResponse.data?.data || [];

        const all: any[] = [];
        for (const pastor of assignedPastors) {
          if (!pastor?._id) continue;
          const list = await apiGetMentorshipSessionsNormalized(pastor._id);
          all.push(...list);
        }
        setSessions(all);
      } catch (e) {
        toast.show({ kind: "error", title: "Failed to load insights", subtitle: extractApiErrorMessage(e) });
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insights = useMemo(() => aggregateInsights(sessions), [sessions]);

  return (
    <div className="min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <MentorHeader showFullHeader />

      <div className="mx-auto w-full max-w-5xl px-4 md:px-8 py-10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Insights</h1>
            <p className="mt-1 text-sm text-white/60">AI-assisted patterns across mentorship sessions.</p>
          </div>
          <a
            href="/mentor/mentoring-session"
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/10"
          >
            Back
          </a>
        </div>

        {loading ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
            Loading insights…
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-[#8ec5eb] mb-3">Challenges</div>
              {insights.challenges.length ? (
                <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                  {insights.challenges.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-white/50">No data yet.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-sm font-semibold text-[#8ec5eb] mb-3">Growth signals</div>
              {insights.growthSignals.length ? (
                <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                  {insights.growthSignals.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-white/50">No data yet.</div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 md:col-span-2">
              <div className="text-sm font-semibold text-[#8ec5eb] mb-3">Emotional trend</div>
              {insights.emotionalTrend.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {insights.emotionalTrend.map((pt) => (
                    <div key={pt.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="text-sm font-semibold text-white/90">{pt.label}</div>
                      <div className="mt-1 text-xs text-white/60">Avg: {pt.value.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-white/50">No data yet.</div>
              )}

              {insights.emotionalTrendNarrative?.length ? (
                <div className="mt-5">
                  <div className="text-sm font-semibold text-white/80 mb-2">Narrative</div>
                  <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                    {insights.emotionalTrendNarrative.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

