"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import { apiGetNotes } from "@/app/Services/api";
import { createNoteBestEffort, normalizeNotesList } from "@/app/Services/notes.service";
import type { Note } from "@/app/Services/types/users.types";
import {
  formatNoteTimestamp,
  notePreviewTitle,
  notesBasePath,
  type NotesVariant,
} from "./notesUtils";
import { useNotesSession } from "./useNotesSession";

const glassPanel =
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

export default function NotesPageContent({ variant }: { variant: NotesVariant }) {
  const router = useRouter();
  const basePath = notesBasePath(variant);
  const Header = variant === "mentor" ? MentorHeader : PastorHeader;

  const [tab, setTab] = useState<"new" | "previous">("new");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);

  const { userId, displayName } = useNotesSession(variant);

  const loadNotes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setListError(null);
    try {
      const res = await apiGetNotes(userId);
      const envelope = res.data as { success?: boolean; message?: string; data?: unknown };
      if (envelope && envelope.success === false) {
        setListError(
          typeof envelope.message === "string" ? envelope.message : "Could not load notes.",
        );
        setNotes([]);
        return;
      }
      const raw = envelope.data !== undefined ? envelope.data : (res.data as unknown);
      setNotes(normalizeNotesList(raw));
    } catch (e) {
      console.error(e);
      setListError(extractApiErrorMessage(e));
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSave = async () => {
    if (!userId) {
      setSaveError("Session expired. Please sign in again.");
      return;
    }
    const text = draft.trim();
    if (!text) {
      setSaveError("Write something before saving.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveOk(null);
    try {
      await createNoteBestEffort(userId, text, userId);

      setDraft("");
      setSaveOk("Note saved.");
      setTimeout(() => setSaveOk(null), 2000);
      await loadNotes();
      setTab("previous");
    } catch (e) {
      console.error(e);
      setSaveError(extractApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(141,211,243,0.16),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Header showFullHeader />

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {/* Page header — Notes title + user pill (reference design) */}
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                aria-label="Go back"
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
            {displayName ? (
              <div className="inline-flex items-center rounded-full border border-[#8ec5eb]/40 bg-[#062946]/80 px-4 py-2 text-sm font-medium text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]">
                {displayName}
              </div>
            ) : null}
          </div>

          {!userId ? (
            <div className={`p-6 ${glassPanel}`}>
              <p className="text-sm text-[#ffb2b2]">You need to be signed in to view notes.</p>
            </div>
          ) : (
            <>
              {/* Tab switcher — New / Previous */}
              <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
                <button
                  type="button"
                  onClick={() => setTab("new")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition sm:text-base ${
                    tab === "new"
                      ? "bg-white text-[#062946] shadow-[0_10px_28px_rgba(0,0,0,0.25)]"
                      : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  New
                </button>
                <button
                  type="button"
                  onClick={() => setTab("previous")}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition sm:text-base ${
                    tab === "previous"
                      ? "bg-white text-[#062946] shadow-[0_10px_28px_rgba(0,0,0,0.25)]"
                      : "border border-white/15 bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  Previous
                </button>
              </div>

              {tab === "new" && (
                <div className={`p-5 sm:p-6 ${glassPanel}`}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                    New note
                  </p>
                  {/* Decorative toolbar (visual parity with mobile reference) */}
                  <div className="mb-3 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-white/[0.06] p-2">
                    {["fa-font", "fa-table-columns", "fa-minus", "fa-list-ul", "fa-list-ol", "fa-align-left", "fa-align-center", "fa-align-right"].map(
                      (icon) => (
                        <button
                          key={icon}
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#cde2f2] transition hover:bg-white/10"
                          disabled
                          title="Formatting"
                        >
                          <i className={`fa-solid ${icon} text-xs`} />
                        </button>
                      ),
                    )}
                  </div>
                  <label className="sr-only" htmlFor="note-draft">
                    Note content
                  </label>
                  <textarea
                    id="note-draft"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write the Notes here..."
                    rows={10}
                    className="w-full resize-y rounded-2xl border border-white/15 bg-[#041f35]/80 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-[#8ec5eb]/50 focus:border-[#8ec5eb]/50 focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]/40"
                  />
                  {saveError ? <p className="mt-2 text-sm text-[#ffb2b2]">{saveError}</p> : null}
                  {saveOk ? <p className="mt-2 text-sm text-[#8ec5eb]">{saveOk}</p> : null}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-5 w-full rounded-2xl bg-white py-3.5 text-base font-semibold text-[#062946] shadow-[0_14px_32px_rgba(2,20,38,0.35)] transition hover:bg-[#e7f1fa] disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              )}

              {tab === "previous" && (
                <div className={`p-5 sm:p-6 ${glassPanel}`}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                    Your notes
                  </p>
                  {loading && <p className="text-sm text-[#cde2f2]">Loading notes…</p>}
                  {!loading && listError && <p className="text-sm text-[#ffb2b2]">{listError}</p>}
                  {!loading && !listError && notes.length === 0 && (
                    <p className="text-sm text-[#cde2f2]">No notes yet. Switch to New to add one.</p>
                  )}
                  {!loading && !listError && notes.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {notes.map((n) => (
                        <li key={n._id}>
                          <Link
                            href={`${basePath}/${n._id}`}
                            className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 transition hover:border-[#8ec5eb]/35 hover:bg-white/10"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-semibold text-white">{notePreviewTitle(n)}</p>
                              <p className="mt-0.5 text-xs text-[#b7d2e6]">
                                {formatNoteTimestamp(n.createdAt)}
                              </p>
                            </div>
                            <i className="fa-solid fa-chevron-right shrink-0 text-[#8ec5eb]/80" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </main>

        <PastorFooter />
      </div>
    </div>
  );
}
