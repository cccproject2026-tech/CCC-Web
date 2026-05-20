"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { useToast } from "@/app/Components/ui/Toast";
import {
  mentorContainer,
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import VoiceNoteStatusBadge from "./VoiceNoteStatusBadge";
import VoiceNoteUploadModal from "./VoiceNoteUploadModal";
import { useVoiceNotesListQuery } from "./hooks/useVoiceNotesQueries";
import {
  formatVoiceNoteDate,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

export default function VoiceNotesListContent({ variant }: { variant: VoiceNotesVariant }) {
  const router = useRouter();
  const toast = useToast();
  const basePath = voiceNotesBasePath(variant);
  const Header = variant === "mentor" ? MentorHeader : PastorHeader;
  const [uploadOpen, setUploadOpen] = useState(false);

  const listQuery = useVoiceNotesListQuery();

  const notes = listQuery.data ?? [];

  useEffect(() => {
    if (!listQuery.isError) return;
    toast.show({
      kind: "error",
      title: "Could not load voice notes",
      subtitle: extractApiErrorMessage(listQuery.error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery.isError, listQuery.error]);

  return (
    <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen font-[Albert_Sans] text-white"}>
      <Header showFullHeader />

      <main className={variant === "mentor" ? mentorContainer : "mx-auto w-full max-w-5xl px-4 py-8 sm:px-8"}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Voice Notes</h1>
            <p className="mt-1 text-sm text-white/70">
              Upload audio to generate a transcript and AI summary.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className={variant === "mentor" ? mentorPrimaryCta : "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]"}
          >
            <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
            Upload Audio
          </button>
        </div>

        {listQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className={mentorSpinner} />
            <p className="mt-4 text-sm text-white/70">Loading voice notes…</p>
          </div>
        ) : listQuery.isError ? (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-8 text-center">
            <i className="fa-solid fa-exclamation-circle mb-2 text-red-200" aria-hidden />
            <p className="text-sm text-red-100">{extractApiErrorMessage(listQuery.error)}</p>
            <button
              type="button"
              onClick={() => void listQuery.refetch()}
              className="mt-4 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Try again
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className={`${mentorGlassCardFrost} p-10 text-center`}>
            <div className="text-4xl" aria-hidden>
              🎤
            </div>
            <p className="mt-4 text-lg font-semibold text-white">No voice notes yet</p>
            <p className="mt-2 text-sm text-white/65">
              Upload your first audio file to get started.
            </p>
            <button type="button" onClick={() => setUploadOpen(true)} className={`${mentorPrimaryCta} mt-6`}>
              Upload Audio
            </button>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => router.push(`${basePath}/${encodeURIComponent(note.id)}`)}
                  className={`${mentorGlassCardFrost} w-full p-5 text-left transition hover:border-[#3498DB]/40`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl" aria-hidden>
                      🎤
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-base font-bold text-white">{note.title}</div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <VoiceNoteStatusBadge status={note.status} compact />
                        <span className="text-xs text-white/55">
                          {formatVoiceNoteDate(note.createdAt)}
                        </span>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right shrink-0 text-white/40" aria-hidden />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {variant === "pastor" ? (
          <div className="mt-8">
            <Link
              href="/pastor/home"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#9bd3ff] hover:text-white"
            >
              <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
              Back to home
            </Link>
          </div>
        ) : null}
      </main>

      {variant === "pastor" ? <PastorFooter /> : null}

      <VoiceNoteUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        variant={variant}
      />
    </div>
  );
}
