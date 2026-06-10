"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";

import TranscriptSummarySection from "@/app/Components/transcript-summary/TranscriptSummarySection";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { useToast } from "@/app/Components/ui/Toast";
import {
  mentorContainer,
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorSecondaryCta,
} from "@/app/Components/mentor/mentor-theme";
import VoiceNoteStatusBadge from "./VoiceNoteStatusBadge";
import VoiceNoteUploadModal from "./VoiceNoteUploadModal";
import VoiceNoteDeleteConfirmModal from "./ui/VoiceNoteDeleteConfirmModal";
import VoiceNoteProcessingPanel from "./ui/VoiceNoteProcessingPanel";
import { VoiceNoteDetailSkeleton } from "./ui/VoiceNotesSkeletons";
import {
  useDeleteVoiceNoteMutation,
  useVoiceNoteDetailQuery,
} from "./hooks/useVoiceNotesQueries";
import {
  formatVoiceNoteDate,
  hasVoiceNoteTranscriptSummary,
  isVoiceNoteProcessing,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

export default function VoiceNoteDetailContent({ variant }: { variant: VoiceNotesVariant }) {
  const toast = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const basePath = voiceNotesBasePath(variant);
  const Header = variant === "mentor" ? MentorHeader : PastorHeader;

  const [retryUploadOpen, setRetryUploadOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const detailQuery = useVoiceNoteDetailQuery(id);
  const deleteMutation = useDeleteVoiceNoteMutation();
  const note = detailQuery.data;
  const processing = note ? isVoiceNoteProcessing(note.status) : false;
  const failed = note?.status === "failed";
  const transcriptSummary = note?.transcriptSummary;
  const hasSummary = hasVoiceNoteTranscriptSummary(transcriptSummary);
  const hasTranscript = !!note?.transcript?.trim();
  const showResults = !processing && (hasTranscript || hasSummary || note?.status === "completed");

  useEffect(() => {
    if (!detailQuery.error) return;
    toast.show({
      kind: "error",
      title: "Failed to load voice note",
      subtitle: extractApiErrorMessage(detailQuery.error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.error]);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.show({ kind: "success", title: "Voice note deleted" });
      setDeleteOpen(false);
      router.push(basePath);
    } catch (e) {
      toast.show({
        kind: "error",
        title: "Could not delete",
        subtitle: extractApiErrorMessage(e),
      });
    }
  };

  if (detailQuery.isLoading) {
    return (
      <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen text-white"}>
        <Header showFullHeader />
        <main className={variant === "mentor" ? mentorContainer : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-8"}>
          <VoiceNoteDetailSkeleton />
        </main>
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
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15"
            >
              <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
              Back to voice notes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen font-[Albert_Sans] text-white"}>
      <Header showFullHeader />

      <main className={variant === "mentor" ? mentorContainer : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-8"}>
          <Link
            href={basePath}
            className="mb-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3498DB]"
          >
            <i className="fa-solid fa-arrow-left text-xs" aria-hidden />
            Voice notes
          </Link>

          <div className={`${mentorGlassCardFrost} mb-6 p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                {/* <h1 className="text-xl font-bold text-white sm:text-2xl">{note.title}</h1> */}
                <h1 className="break-words text-xl font-bold text-white sm:text-2xl">
  {note.title}
</h1>
                <p className="mt-1 text-sm text-white/60">{formatVoiceNoteDate(note.createdAt)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <VoiceNoteStatusBadge status={note.status} />
                <button
                  type="button"
                  onClick={() => setDeleteOpen(true)}
                  disabled={processing || deleteMutation.isPending}
                  className={`${mentorSecondaryCta} border-red-400/30 text-red-100 hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50`}
                  aria-label="Delete voice note"
                >
                  <i className="fa-solid fa-trash-can mr-1.5 text-xs" aria-hidden />
                  Delete
                </button>
              </div>
            </div>

            {note.audioUrl ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-[#041f35]/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                  <i className="fa-solid fa-volume-high text-[#8ec5eb]" aria-hidden />
                  Audio playback
                </div>
                <audio
                  controls
                  src={note.audioUrl}
                  className="h-12 w-full max-w-full"
                  preload="metadata"
                  aria-label={`Audio for ${note.title}`}
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            ) : processing ? (
              <p className="mt-4 text-sm text-white/50">Audio will be available when processing completes.</p>
            ) : null}
          </div>

          {processing ? <VoiceNoteProcessingPanel status={note.status} /> : null}

          {failed ? (
            <div className="mb-6 rounded-2xl border border-red-400/30 bg-gradient-to-b from-red-500/15 to-red-900/10 p-6 sm:p-8">
              <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/20">
                  <i className="fa-solid fa-triangle-exclamation text-xl text-red-200" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-red-50">Something went wrong</p>
                  <p className="mt-2 text-sm leading-relaxed text-red-100/90">
                    {note.errorMessage?.trim() ||
                      "We couldn't finish processing this recording. Your audio may be unclear or the service was temporarily unavailable."}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRetryUploadOpen(true)}
                    className="mt-4 min-h-[44px] rounded-lg border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
                  >
                    <i className="fa-solid fa-arrow-rotate-right mr-2 text-xs" aria-hidden />
                    Retry upload
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {showResults ? (
            <TranscriptSummarySection
              transcript={note.transcript}
              summary={transcriptSummary}
              isLoading={detailQuery.isFetching && processing}
              defaultTab={hasTranscript ? "transcript" : "summary"}
              enhanced
              disabled={processing}
            />
          ) : null}

          {!processing && !failed && !showResults ? (
            <div className={`${mentorGlassCardFrost} p-8 text-center text-sm text-white/65`}>
              Results will appear here when processing completes.
            </div>
          ) : null}
      </main>

      {/* {variant === "pastor" ? <PastorFooter /> : null} */}

      <VoiceNoteUploadModal
        isOpen={retryUploadOpen}
        onClose={() => setRetryUploadOpen(false)}
        variant={variant}
      />

      <VoiceNoteDeleteConfirmModal
        open={deleteOpen}
        title={note.title}
        busy={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
