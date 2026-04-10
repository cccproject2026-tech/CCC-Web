"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import { directorGlassCard, directorPageRoot } from "@/app/director/directorUi";
import {
  deleteNoteSafe,
  fetchNoteById,
  updateNoteBestEffort,
} from "@/app/Services/notes.service";
import type { Note } from "@/app/Services/types/users.types";
import {
  formatNoteTimestamp,
  noteBody,
  notesBasePath,
  type NotesVariant,
} from "./notesUtils";
import { useNotesSession } from "./useNotesSession";

const glassPanelPastor =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.88)_0%,rgba(10,53,88,0.94)_100%)] shadow-[0_20px_50px_rgba(2,20,38,0.35)]";

function extractApiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 401) return "Your session expired. Please sign in again.";
    const d = err.response?.data as Record<string, unknown> | string | undefined;
    if (d && typeof d === "object") {
      const m = d.message;
      if (typeof m === "string" && m.trim()) return m;
      if (Array.isArray(m)) return m.filter((x) => typeof x === "string").join(" ");
    }
    if (typeof d === "string" && d.trim()) return d;
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong.";
}

export default function NoteDetailContent({
  variant,
  noteId,
}: {
  variant: NotesVariant;
  noteId: string;
}) {
  const router = useRouter();
  const basePath = notesBasePath(variant);
  const Header =
    variant === "mentor" ? MentorHeader : variant === "pastor" ? PastorHeader : null;
  const { userId, displayName } = useNotesSession(variant);
  const glassPanel = variant === "director" ? directorGlassCard : glassPanelPastor;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const loadOne = useCallback(async () => {
    if (!userId || !noteId) {
      setLoading(false);
      setError("Missing session or note.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const n = await fetchNoteById(userId, noteId);
      setNote(n);
      setDraft(noteBody(n ?? {}));
    } catch (e) {
      console.error(e);
      setError(extractApiErrorMessage(e));
      setNote(null);
    } finally {
      setLoading(false);
    }
  }, [userId, noteId]);

  useEffect(() => {
    loadOne();
  }, [loadOne]);

  useEffect(() => {
    if (note && editing) setDraft(noteBody(note));
  }, [note, editing]);

  const handleSaveEdit = async () => {
    if (!userId || !noteId) return;
    const text = draft.trim();
    if (!text) {
      setActionError("Note cannot be empty.");
      return;
    }
    setSaving(true);
    setActionError(null);
    setActionOk(null);
    try {
      const updated = await updateNoteBestEffort(userId, noteId, text);
      if (updated) setNote(updated);
      else await loadOne();
      setEditing(false);
      setActionOk("Note updated.");
      setTimeout(() => setActionOk(null), 2000);
    } catch (e) {
      console.error(e);
      setActionError(extractApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !noteId) return;
    if (!window.confirm("Delete this note permanently?")) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteNoteSafe(userId, noteId);
      router.push(basePath);
    } catch (e) {
      console.error(e);
      setActionError(extractApiErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const MainTag = variant === "director" ? "div" : "main";

  return (
    <div
      className={
        variant === "director"
          ? directorPageRoot
          : "relative flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white"
      }
    >
      {variant !== "director" ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(141,211,243,0.16),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      ) : null}
      <div className="relative z-10 flex min-h-screen flex-col">
        {Header ? <Header showFullHeader /> : null}

        <MainTag className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.push(basePath)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Back to notes"
              >
                <i className="fa-solid fa-arrow-left text-sm" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Notes</h1>
                {displayName ? (
                  <p className="mt-1 text-sm text-[#cde2f2]">{displayName}</p>
                ) : null}
              </div>
            </div>
            {!loading && !error && note && (
              <div className="flex flex-wrap items-center gap-2">
                {editing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDraft(noteBody(note));
                        setActionError(null);
                      }}
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#e7f1fa] disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <i className="fa-solid fa-pen mr-2 text-xs" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:opacity-60"
                    >
                      {deleting ? "Deleting…" : "Delete"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className={`p-5 sm:p-6 ${glassPanel}`}>
            {loading && <p className="text-sm text-[#cde2f2]">Loading…</p>}
            {!loading && error && <p className="text-sm text-[#ffb2b2]">{error}</p>}
            {!loading && !error && note && (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">Note</p>
                <p className="mt-2 text-sm text-[#b7d2e6]">
                  {formatNoteTimestamp(note.createdAt)}
                  {note.updatedAt && note.updatedAt !== note.createdAt ? (
                    <span className="text-[#cde2f2]/70"> · Updated {formatNoteTimestamp(note.updatedAt)}</span>
                  ) : null}
                </p>
                {actionError ? <p className="mt-2 text-sm text-[#ffb2b2]">{actionError}</p> : null}
                {actionOk ? <p className="mt-2 text-sm text-[#8ec5eb]">{actionOk}</p> : null}
                {editing ? (
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={12}
                    className="mt-6 w-full resize-y rounded-2xl border border-white/15 bg-[#041f35]/80 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[#8ec5eb]/50 focus:border-[#8ec5eb]/50 focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40"
                  />
                ) : (
                  <div className="mt-6 whitespace-pre-wrap rounded-2xl border border-white/10 bg-[#041f35]/60 px-4 py-4 text-sm leading-relaxed text-[#d9ebf8]">
                    {noteBody(note)}
                  </div>
                )}
              </>
            )}
          </div>
        </MainTag>

        {variant === "pastor" ? <PastorFooter /> : null}
      </div>
    </div>
  );
}
