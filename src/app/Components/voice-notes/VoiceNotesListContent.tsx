"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import type { VoiceNoteStatus } from "@/app/Services/types/voice-notes.types";
import { useToast } from "@/app/Components/ui/Toast";
import {
  mentorContainer,
  mentorFilterPanel,
  mentorGlassCardFrost,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorSearchBarWrap,
  mentorSearchIcon,
  mentorSearchInput,
  mentorSelectDark,
} from "@/app/Components/mentor/mentor-theme";
import VoiceNoteStatusBadge from "./VoiceNoteStatusBadge";
import VoiceNoteRecordModal from "./VoiceNoteRecordModal";
import VoiceNoteUploadModal from "./VoiceNoteUploadModal";
import VoiceNotesEmptyState from "./ui/VoiceNotesEmptyState";
import { VoiceNotesListSkeleton } from "./ui/VoiceNotesSkeletons";
import { useVoiceNotesListQuery } from "./hooks/useVoiceNotesQueries";
import {
  filterVoiceNotesList,
  formatVoiceNoteDate,
  VOICE_NOTE_STATUS_FILTER_OPTIONS,
  voiceNotesBasePath,
  type VoiceNotesVariant,
} from "./voiceNotesUtils";

export default function VoiceNotesListContent({ variant }: { variant: VoiceNotesVariant }) {
  const router = useRouter();
  const toast = useToast();
  const basePath = voiceNotesBasePath(variant);
  const Header = variant === "mentor" ? MentorHeader : PastorHeader;
  const [uploadOpen, setUploadOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VoiceNoteStatus>("all");

  const listQuery = useVoiceNotesListQuery();
  const allNotes = listQuery.data ?? [];

  const filteredNotes = useMemo(
    () => filterVoiceNotesList(allNotes, search, statusFilter),
    [allNotes, search, statusFilter],
  );

  useEffect(() => {
    if (!listQuery.isError) return;
    toast.show({
      kind: "error",
      title: "Could not load voice notes",
      subtitle: extractApiErrorMessage(listQuery.error),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listQuery.isError, listQuery.error]);

  const ctaClass =
    variant === "mentor"
      ? mentorPrimaryCta
      : "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8ec5eb]";

  return (
    <div className={variant === "mentor" ? mentorPageRoot : "min-h-screen font-[Albert_Sans] text-white"}>
      <Header showFullHeader />

      <main className={variant === "mentor" ? mentorContainer : "mx-auto w-full max-w-6xl px-4 py-8 sm:px-8"}>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Voice Notes</h1>
              <p className="mt-1 text-sm text-white/70">
                Record or upload audio to generate a transcript and AI summary.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 self-start sm:flex-row">
              <button
                type="button"
                onClick={() => setRecordOpen(true)}
                className={
                  variant === "mentor"
                    ? mentorSecondaryCta
                    : "rounded-lg border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
                }
                aria-label="Record voice note"
              >
                <i className="fa-solid fa-microphone mr-2 text-xs" aria-hidden />
                Record Voice
              </button>
              <button
                type="button"
                onClick={() => setUploadOpen(true)}
                className={`${ctaClass} min-h-[44px]`}
                aria-label="Upload audio file"
              >
                <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
                Upload Audio
              </button>
            </div>
          </div>

          {!listQuery.isLoading && allNotes.length > 0 ? (
            <div className={`mb-6 ${mentorFilterPanel}`}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">Search voice notes by title</span>
                  <div className={mentorSearchBarWrap}>
                    <i className={mentorSearchIcon} aria-hidden />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by title…"
                      className={mentorSearchInput}
                    />
                  </div>
                </label>
                <label className="w-full lg:w-48">
                  <span className="sr-only">Filter by status</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as "all" | VoiceNoteStatus)}
                    className={mentorSelectDark}
                  >
                    {VOICE_NOTE_STATUS_FILTER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {search || statusFilter !== "all" ? (
                <p className="mt-3 text-xs text-white/55">
                  Showing {filteredNotes.length} of {allNotes.length} voice notes
                </p>
              ) : null}
            </div>
          ) : null}

          {listQuery.isLoading ? (
            <VoiceNotesListSkeleton />
          ) : listQuery.isError ? (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-6 py-8 text-center">
              <i className="fa-solid fa-exclamation-circle mb-2 text-2xl text-red-200" aria-hidden />
              <p className="text-sm text-red-100">{extractApiErrorMessage(listQuery.error)}</p>
              <button
                type="button"
                onClick={() => void listQuery.refetch()}
                className="mt-4 min-h-[44px] rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
              >
                Try again
              </button>
            </div>
          ) : allNotes.length === 0 ? (
            <VoiceNotesEmptyState
              onUpload={() => setUploadOpen(true)}
              onRecord={() => setRecordOpen(true)}
            />
          ) : filteredNotes.length === 0 ? (
            <div className={`${mentorGlassCardFrost} p-10 text-center`}>
              <p className="text-lg font-semibold text-white">No matching voice notes</p>
              <p className="mt-2 text-sm text-white/65">Try a different search or status filter.</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-sm font-semibold text-[#8ec5eb] hover:text-white"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {filteredNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`${basePath}/${encodeURIComponent(note.id)}`)}
                    className={`${mentorGlassCardFrost} w-full p-5 text-left transition hover:border-[#3498DB]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3498DB]`}
                    aria-label={`Open voice note ${note.title}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#3498DB]/25 bg-[#3498DB]/15 text-lg"
                        aria-hidden
                      >
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

      <VoiceNoteRecordModal
        isOpen={recordOpen}
        onClose={() => setRecordOpen(false)}
        variant={variant}
      />
      <VoiceNoteUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        variant={variant}
      />
    </div>
  );
}
