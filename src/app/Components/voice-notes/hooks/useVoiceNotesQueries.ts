"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteVoiceNote,
  getVoiceNoteById,
  getVoiceNotes,
  uploadVoiceNote,
} from "@/app/Services/voice-notes.service";
import type { VoiceNoteDetailDto } from "@/app/Services/types/voice-notes.types";
import { isVoiceNoteProcessing } from "../voiceNotesUtils";

export const voiceNotesQueryKeys = {
  all: ["voice-notes"] as const,
  detail: (id: string) => ["voice-notes", id] as const,
};

const POLL_MS = 4000;

export function useVoiceNotesListQuery() {
  return useQuery({
    queryKey: voiceNotesQueryKeys.all,
    queryFn: getVoiceNotes,
    staleTime: 15_000,
    retry: 1,
  });
}

export function useVoiceNoteDetailQuery(id: string) {
  return useQuery({
    queryKey: voiceNotesQueryKeys.detail(id),
    enabled: !!id,
    queryFn: () => getVoiceNoteById(id),
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    refetchInterval: (query) => {
      const status = (query.state.data as VoiceNoteDetailDto | undefined)?.status;
      if (status && isVoiceNoteProcessing(status)) return POLL_MS;
      return false;
    },
    retry: 1,
  });
}

export function useUploadVoiceNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      title,
      onUploadProgress,
    }: {
      file: File;
      title?: string;
      onUploadProgress?: (percent: number) => void;
    }) => uploadVoiceNote(file, { title, onUploadProgress }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: voiceNotesQueryKeys.all });
    },
  });
}

export function useDeleteVoiceNoteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteVoiceNote(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: voiceNotesQueryKeys.all });
      void queryClient.removeQueries({ queryKey: voiceNotesQueryKeys.detail(id) });
    },
  });
}
