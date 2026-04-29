"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import {
  apiCompleteMentorshipSession,
  apiGetMentorshipSessionsNormalized,
  apiRedoMentorshipSession,
  type MentorshipSession,
} from "@/app/Services/roadmaps.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiGetMentorSchedule, apiGetUserSchedule } from "@/app/Services/appointments.service";
import { appointmentEntityId, unwrapAppointmentsAxiosData } from "@/app/Services/appointment-utils";
import type { AppointmentResponse } from "@/app/Services/types/appointments.types";

export type MentorSession = MentorshipSession & { pastorId: string; pastorName: string; pastorEmail: string };

function isAxiosRateLimitError(e: unknown): boolean {
  const err = e as { response?: { status?: number } };
  return err?.response?.status === 429;
}

function defaultRetry(failureCount: number, error: unknown) {
  // Avoid hammering the API proxy when rate-limited.
  if (isAxiosRateLimitError(error)) return false;
  return failureCount < 1;
}

function getMentorIdFromCookie() {
  const mentorCookie = Cookies.get("mentor");
  if (!mentorCookie) throw new Error("Mentor information not found");
  const mentorData = JSON.parse(decodeURIComponent(mentorCookie));
  const mentorId = String(mentorData?.id ?? "").trim();
  if (!mentorId) throw new Error("Mentor ID not found");
  return mentorId;
}

export function getPastorIdFromCookie() {
  const pastorCookie = Cookies.get("user");
  if (!pastorCookie) throw new Error("Pastor information not found");
  const pastorData = JSON.parse(decodeURIComponent(pastorCookie));
  const pastorId = String(pastorData?.id ?? "").trim();
  if (!pastorId) throw new Error("Pastor ID not found");
  return pastorId;
}

export function useMentorGroupedSessionsQuery() {
  return useQuery({
    queryKey: ["mentorship-sessions", "mentor"],
    staleTime: 60_000,
    queryFn: async () => {
      const mentorId = getMentorIdFromCookie();
      const assignedUsersResponse = await apiGetAssignedUsers(mentorId);
      const assignedPastors = assignedUsersResponse.data?.data || [];
      const grouped = await Promise.all(
        assignedPastors.map(async (pastor: any) => {
          const pastorId = String(pastor?._id ?? "").trim();
          if (!pastorId) return null;
          const sessions = await apiGetMentorshipSessionsNormalized(pastorId);
          return {
            pastorId,
            pastorName: `${pastor.firstName} ${pastor.lastName}`,
            pastorEmail: pastor.email,
            sessions: sessions.map((s) => ({ ...s, pastorId, pastorName: `${pastor.firstName} ${pastor.lastName}`, pastorEmail: pastor.email })),
          };
        }),
      );
      return grouped.filter((g): g is { pastorId: string; pastorName: string; pastorEmail: string; sessions: MentorSession[] } => !!g && g.sessions.length > 0);
    },
    retry: defaultRetry,
  });
}

export function usePastorSessionsQuery() {
  return useQuery({
    queryKey: ["mentorship-sessions", "pastor"],
    staleTime: 60_000,
    queryFn: async () => apiGetMentorshipSessionsNormalized(getPastorIdFromCookie()),
    retry: defaultRetry,
  });
}

export function useMentorSessionDetailQuery(sessionId: string, pastorIdFromQuery?: string) {
  return useQuery({
    queryKey: ["mentorship-session", sessionId, "mentor", pastorIdFromQuery || "auto"],
    enabled: !!sessionId,
    // Detail query also fetches schedules; cache longer + don't refetch on focus to avoid 429s.
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: defaultRetry,
    queryFn: async () => {
      const mentorId = getMentorIdFromCookie();
      let pastorId = pastorIdFromQuery || "";
      let sessions: MentorshipSession[] = [];

      if (pastorId) {
        sessions = await apiGetMentorshipSessionsNormalized(pastorId);
      } else {
        const assignedUsersResponse = await apiGetAssignedUsers(mentorId);
        const assignedPastors = assignedUsersResponse.data?.data || [];
        const all = await Promise.all(
          assignedPastors.map(async (p: any) => {
            const pid = String(p?._id ?? "").trim();
            if (!pid) return null;
            const list = await apiGetMentorshipSessionsNormalized(pid);
            return { pid, list };
          }),
        );
        const foundGroup = all.find((x) => x?.list.some((s) => s.id === sessionId));
        if (foundGroup) {
          pastorId = foundGroup.pid;
          sessions = foundGroup.list;
        }
      }

      const session = sessions.find((s) => s.id === sessionId) ?? null;
      if (!session) return { session: null, sessionsForPastor: [], appointment: null, pastorId, mentorId };

      const apptId = session.appointmentId ? String(session.appointmentId) : "";
      if (!apptId) return { session, sessionsForPastor: sessions, appointment: null, pastorId, mentorId };

      const [mentorSched, pastorSched] = await Promise.all([
        apiGetMentorSchedule(mentorId),
        pastorId ? apiGetUserSchedule(pastorId) : Promise.resolve({ data: [] } as any),
      ]);
      const merged = [...unwrapAppointmentsAxiosData(mentorSched), ...unwrapAppointmentsAxiosData(pastorSched)] as AppointmentResponse[];
      const appointment =
        merged.find((a) => appointmentEntityId(a) === apptId) ??
        merged.find((a) => String((a as any)?._id ?? (a as any)?.id ?? "") === apptId) ??
        null;

      return { session, sessionsForPastor: sessions, appointment, pastorId, mentorId };
    },
  });
}

export function usePastorSessionDetailQuery(sessionId: string) {
  return useQuery({
    queryKey: ["mentorship-session", sessionId, "pastor"],
    enabled: !!sessionId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: defaultRetry,
    queryFn: async () => {
      const pastorId = getPastorIdFromCookie();
      const [sessions, sched] = await Promise.all([apiGetMentorshipSessionsNormalized(pastorId), apiGetUserSchedule(pastorId)]);
      const session = sessions.find((s) => s.id === sessionId) ?? null;
      if (!session?.appointmentId) return { session, sessions, appointment: null };
      const all = unwrapAppointmentsAxiosData(sched) as AppointmentResponse[];
      const appointment = all.find((a) => appointmentEntityId(a) === String(session.appointmentId)) ?? null;
      return { session, sessions, appointment };
    },
  });
}

export function useMentorSessionActions(sessionId: string) {
  const queryClient = useQueryClient();
  const completeMutation = useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => apiCompleteMentorshipSession(appointmentId),
    onMutate: async ({ appointmentId }) => {
      await queryClient.cancelQueries({ queryKey: ["mentorship-session", sessionId] });
      const previous = queryClient.getQueriesData({ queryKey: ["mentorship-session", sessionId] });
      queryClient.setQueriesData({ queryKey: ["mentorship-session", sessionId] }, (old: any) =>
        old?.session ? { ...old, session: { ...old.session, status: "COMPLETED" } } : old,
      );
      return { previous, appointmentId };
    },
    onError: (_e, _v, ctx) => {
      ctx?.previous?.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mentorship-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["mentorship-session", sessionId] });
    },
  });

  const redoMutation = useMutation({
    mutationFn: async ({ appointmentId }: { appointmentId: string }) => apiRedoMentorshipSession(appointmentId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["mentorship-sessions"] });
      void queryClient.invalidateQueries({ queryKey: ["mentorship-session", sessionId] });
    },
  });

  const actionLoading = useMemo<"complete" | "redo" | null>(() => {
    if (completeMutation.isPending) return "complete";
    if (redoMutation.isPending) return "redo";
    return null;
  }, [completeMutation.isPending, redoMutation.isPending]);

  return { completeMutation, redoMutation, actionLoading };
}
