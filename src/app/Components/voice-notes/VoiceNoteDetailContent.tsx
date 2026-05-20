"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import TranscriptSummarySection from "@/app/Components/transcript-summary/TranscriptSummarySection";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { useToast } from "@/app/Components/ui/Toast";
import {
  mentorContainer,
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import VoiceNoteStatusBadge from "./VoiceNoteStatusBadge";
import VoiceNoteUploadModal from "./VoiceNoteUploadModal";
import { useVoiceNoteDetailQuery } from "./hooks/useVoiceNotesQueries";
import {
  formatVoiceNoteDate,
  hasVoiceNoteTranscriptSummary,
  isVoiceNoteProcessing,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

export default function VoiceNoteDetailContent({ variant }: { variant: VoiceNotesVariant }) {
  const toast = useToast();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const basePath = voiceNotesBasePath(variant);
  const Header = variant === "mentor" ? MentorHeader : PastorHeader;

  const [retryUploadOpen, setRetryUploadOpen] = useState(false);

  const detailQuery = useVoiceNoteDetailQuery(id);
  const note = detailQuery.data;
  const processing = note ? isVoiceNoteProcessing(note.status) : false;
  const failed = note?.status === "failed";
  const completed = note?.status === "completed";
  const transcriptSummary = note?.transcriptSummary;
  const hasSummary = hasVoiceNoteTranscriptSummary(transcriptSummary);
  const hasTranscript = !!note?.transcript?.trim();

  useEffect(() => {
    if (!detailQuery.error) return;
    toast.show({
      kind: "error",
      title: "Failed to load voice note",
      subtitle: extractApiErrorMessage(detailQuery.error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.error]);

  if (detailQuery.isLoading) {
    return (
      <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen text-white"}>
        <Header showFullHeader />
        <div className="flex flex-col items-center justify-center py-24">
          <div className={mentorSpinner} />
          <p className="mt-4 text-sm text-white/70">Loading voice note…</p>
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !note) {
    return (
      <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen text-white"}>
        <Header showFullHeader />
        <main className={mentorContainer}>
          <div className={`${mentorGlassCardFrost} mx-auto max-w-lg p-8 text-center`}>
            <p className="text-lg font-semibold">Voice note not found</p>
            <p className="mt-2 text-sm text-white/65">
              {detailQuery.error ? extractApiErrorMessage(detailQuery.error) : "This note may have been removed."}
            </p>
            <Link
              href={basePath}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
              Back to voice notes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const statusMessage =
    note.status === "pending"
      ? "Your audio is queued for processing."
      : note.status === "transcribing"
        ? "Generating transcript…"
        : note.status === "summarizing"
          ? "Creating AI summary…"
          : "";

  return (
    <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen font-[Albert_Sans] text-white"}>
      <Header showFullHeader />

      <main className={variant === "mentor" ? mentorContainer : "mx-auto w-full max-w-5xl px-4 py-8 sm:px-8"}>
        <Link
          href={basePath}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
          Voice notes
        </Link>

        <div className={`${mentorGlassCardFrost} mb-6 p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">{note.title}</h1>
              <p className="mt-1 text-sm text-white/60">{formatVoiceNoteDate(note.createdAt)}</p>
            </div>
            <VoiceNoteStatusBadge status={note.status} />
          </div>

          {note.audioUrl ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#041f35]/40 p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                Audio
              </div>
              <audio controls src={note.audioUrl} className="w-full" preload="metadata">
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : null}
        </div>

        {processing ? (
          <div className={`${mentorGlassCardFrost} mb-6 flex flex-col items-center gap-4 p-10 text-center`}>
            <div className={mentorSpinner} />
            <div>
              <p className="text-lg font-semibold text-white">Processing your voice note</p>
              <p className="mt-2 text-sm text-white/65">{statusMessage}</p>
              <p className="mt-1 text-xs text-white/45">This page updates automatically.</p>
            </div>
          </div>
        ) : null}

        {failed ? (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center">
            <i className="fa-solid fa-circle-exclamation mb-2 text-2xl text-red-200" aria-hidden />
            <p className="text-lg font-semibold text-red-50">Processing failed</p>
            <p className="mt-2 text-sm text-red-100/90">
              {note.errorMessage?.trim() ||
                "We could not process this recording. Please try uploading the audio again."}
            </p>
            <button
              type="button"
              onClick={() => setRetryUploadOpen(true)}
              className="mt-4 rounded-lg border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
            >
              Retry upload
            </button>
          </div>
        ) : null}

        {(completed || hasTranscript || hasSummary) && !processing ? (
          <TranscriptSummarySection
            transcript={note.transcript}
            summary={transcriptSummary}
            isLoading={false}
            defaultTab={hasTranscript ? "transcript" : "summary"}
          />
        ) : null}

        {!processing && !failed && !completed && !hasTranscript && !hasSummary ? (
          <div className={`${mentorGlassCardFrost} p-8 text-center text-sm text-white/65`}>
            Results will appear here when processing completes.
          </div>
        ) : null}
      </main>

      {variant === "pastor" ? <PastorFooter /> : null}

      <VoiceNoteUploadModal
        isOpen={retryUploadOpen}
        onClose={() => setRetryUploadOpen(false)}
        variant={variant}
      />
    </div>
  );
}
