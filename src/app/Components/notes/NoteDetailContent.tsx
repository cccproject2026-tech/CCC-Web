"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
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

//   const loadOne = useCallback(async () => {
//     if (!userId || !noteId) {
//       setLoading(false);
//       setError("Missing session or note.");
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     try {
//       // const n = await fetchNoteById(userId, noteId);
//       // setNote(n);
//       // setDraft(noteBody(n ?? {}));
//       const n = await fetchNoteById(userId, noteId);

// // if (!n) {
// //   setError("Note not found.");
// //   setNote(null);
// //   return;
// // }
// if (!n) {
//   setError("Note not found in server.");
//   setNote(null);
//   return;
// }

// setNote(n);

// const content =
//   typeof n.content === "string"
//     ? n.content
//     : noteBody(n);

// setDraft(content);
//     } catch (e) {
//       console.error(e);
//       setError(extractApiErrorMessage(e));
//       setNote(null);
//     } finally {
//       setLoading(false);
//     }
//   }, [userId, noteId]);

// const loadOne = useCallback(async () => {
//   if (!userId || !noteId) {
//     setLoading(false);
//     setError("Missing session or note.");
//     return;
//   }

//   setLoading(true);
//   setError(null);

//   try {
//     // ✅ NEW: get note from URL (this is the key fix)
//     const noteParam = searchParams.get("note");

//     if (noteParam) {
//       const parsed = JSON.parse(noteParam);

//       setNote(parsed);
//       setDraft(parsed.content || "");

//       setLoading(false);
//       return;
//     }

//     // 🔁 fallback (only if user refreshes page)
//     const n = await fetchNoteById(userId, noteId);

//     if (!n) {
//       setError("Note not found.");
//       setNote(null);
//       return;
//     }

//     setNote(n);
//     setDraft(n.content || "");

//   } catch (e) {
//     console.error(e);
//     setError("Failed to load note.");
//     setNote(null);
//   } finally {
//     setLoading(false);
//   }
// }, [userId, noteId, searchParams]);
//--2
// const loadOne = useCallback(async () => {
//   if (!userId || !noteId) {
//     setLoading(false);
//     setError("Missing session or note.");
//     return;
//   }

//   setLoading(true);
//   setError(null);

//   try {
//     const noteParam = searchParams.get("note");

//     // 1) Show passed note immediately for fast UI
//     if (noteParam) {
//       const parsed = JSON.parse(noteParam);
//       setNote(parsed);
//       setDraft(parsed.content || "");
//     }

//     // 2) Always fetch latest note from backend and override stale URL data
//     const fresh = await fetchNoteById(userId, noteId);

//     if (fresh) {
//       setNote(fresh);
//       setDraft(typeof fresh.content === "string" ? fresh.content : "");
//     } else if (!noteParam) {
//       setError("Note not found.");
//       setNote(null);
//     }
//   } catch (e) {
//     console.error(e);
//     setError("Failed to load note.");
//     setNote(null);
//   } finally {
//     setLoading(false);
//   }
// }, [userId, noteId, searchParams]);


const loadOne = useCallback(async () => {
  if (!userId || !noteId) {
    setLoading(false);
    setError("Missing session or note.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const noteParam = searchParams.get("note");

    // ✅ if note is passed from Previous list, trust it and stop here
    if (noteParam) {
      const parsed = JSON.parse(noteParam);
      setNote(parsed);
      setDraft(typeof parsed.content === "string" ? parsed.content : "");
      return;
    }

    // only fallback when page is opened directly / refreshed
    const fresh = await fetchNoteById(userId, noteId);

    if (fresh) {
      setNote(fresh);
      setDraft(typeof fresh.content === "string" ? fresh.content : "");
    } else {
      setError("Note not found.");
      setNote(null);
    }
  } catch (e) {
    console.error(e);
    setError("Failed to load note.");
    setNote(null);
  } finally {
    setLoading(false);
  }
}, [userId, noteId, searchParams]);
  useEffect(() => {
    loadOne();
  }, [loadOne]);

  // useEffect(() => {
  //   if (note && editing) setDraft(noteBody(note));
  // }, [note, editing]);
  // this is overwriting the my upated text

  // const handleSaveEdit = async () => {
  //   if (!userId || !noteId) return;
  //   const text = draft.trim();
  //   if (!text) {
  //     setActionError("Note cannot be empty.");
  //     return;
  //   }
  //   setSaving(true);
  //   setActionError(null);
  //   setActionOk(null);
  //   try {
  //     const updated = await updateNoteBestEffort(userId, noteId, text);
  //     if (updated) setNote(updated);
  //     else await loadOne();
  //     setEditing(false);
  //     setActionOk("Note updated.");
  //     setTimeout(() => setActionOk(null), 2000);
  //   } catch (e) {
  //     console.error(e);
  //     setActionError(extractApiErrorMessage(e));
  //   } finally {
  //     setSaving(false);
  //   }
  // };


  // -> use to change old logic
//   const handleSaveEdit = async () => {
//   if (!userId || !noteId) return;

//   const text = draft.trim();
//   if (!text) {
//     setActionError("Note cannot be empty.");
//     return;
//   }

//   setSaving(true);
//   setActionError(null);
//   setActionOk(null);

//   try {
//     const updated = await updateNoteBestEffort(userId, noteId, text);

//     if (updated) {
//       setNote(updated);

//       // 🔥 IMPORTANT FIX (this was missing)
//       setDraft(typeof updated.content === "string" ? updated.content : "");
//     } else {
//       await loadOne();
//     }

//     setEditing(false);
//     setActionOk("Note updated.");
//     setTimeout(() => setActionOk(null), 2000);

//   } catch (e) {
//     console.error(e);
//     setActionError(extractApiErrorMessage(e));
//   } finally {
//     setSaving(false);
//   }
// };

  // const handleDelete = async () => {
  //   if (!userId || !noteId) return;
  //   if (!window.confirm("Delete this note permanently?")) return;
  //   setDeleting(true);
  //   setActionError(null);
  //   try {
  //     await deleteNoteSafe(userId, noteId);
  //     router.push(basePath);
  //   } catch (e) {
  //     console.error(e);
  //     setActionError(extractApiErrorMessage(e));
  //   } finally {
  //     setDeleting(false);
  //   }
  // };

//-> test
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

    if (updated) {
      setNote(updated);
      setDraft(typeof updated.content === "string" ? updated.content : "");

      const notesStorageKey = `notes:${variant}:${userId ?? "guest"}`;

      try {
        const cached = sessionStorage.getItem(notesStorageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            const patched = parsed.map((n: any) =>
              String(n?._id) === String(noteId)
                ? { ...n, ...updated, content: updated.content }
                : n
            );
            sessionStorage.setItem(notesStorageKey, JSON.stringify(patched));
          }
        }
      } catch (cacheErr) {
        console.error("Failed to update notes cache after edit:", cacheErr);
      }
    } else {
      await loadOne();
    }

    setEditing(false);
    setActionOk("Note updated.");
    setTimeout(() => setActionOk(null), 2000);

    // router.replace(basePath);
    window.location.href = basePath;

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

    const notesStorageKey = `notes:${variant}:${userId ?? "guest"}`;
    const deletedKey = `deletedNotes:${variant}:${userId ?? "guest"}`;

    try {
      const cached = sessionStorage.getItem(notesStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(
            (n: any) => String(n?._id) !== String(noteId)
          );
          sessionStorage.setItem(notesStorageKey, JSON.stringify(filtered));
        }
      }

      const deletedRaw = sessionStorage.getItem(deletedKey);
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      if (!deletedIds.includes(String(noteId))) {
        deletedIds.push(String(noteId));
        sessionStorage.setItem(deletedKey, JSON.stringify(deletedIds));
      }
    } catch (cacheErr) {
      console.error("Failed to update notes cache after delete:", cacheErr);
    }

    router.replace(basePath);
    router.refresh();
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
                    {/* {noteBody(note)} */}
                    {typeof note.content === "string" ? note.content : noteBody(note)}

                  </div>
                )}
              </>
            )}
          </div>
        </MainTag>

        {/* {variant === "pastor" ? <PastorFooter /> : null} */}
      </div>
    </div>
  );
}
