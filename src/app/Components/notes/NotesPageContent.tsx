"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import MentorHeader from "@/app/Components/MentorHeader";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import { apiGetNotes } from "@/app/Services/api";
// import { createNoteBestEffort, normalizeNotesList } from "@/app/Services/notes.service";
import {
  createNoteBestEffort,
  deleteNoteSafe,
  normalizeNotesList,
} from "@/app/Services/notes.service";
import type { Note } from "@/app/Services/types/users.types";
import {
  formatNoteTimestamp,
  notePreviewTitle,
  notesBasePath,
  NOTE_FORMAT_TOOLS,
  applyNoteFormat,
  type NotesVariant,
} from "./notesUtils";
import { useNotesSession } from "./useNotesSession";
import NotesDeleteConfirmDialog from "./NotesDeleteConfirmDialog";
import {
  mentorGlassCardFrost,
  mentorMainGradient,
  mentorPageRoot,
} from "@/app/Components/mentor/mentor-theme";
import { directorGlassCard, directorPageRoot } from "@/app/director/directorUi";

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

export default function NotesPageContent({ variant }: { variant: NotesVariant }) {
  const router = useRouter();
  const basePath = notesBasePath(variant);
  const Header =
    variant === "mentor" ? MentorHeader : variant === "pastor" ? PastorHeader : null;

  const [tab, setTab] = useState<"new" | "previous">("new");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { userId, displayName } = useNotesSession(variant);
  const notesStorageKey = `notes:${variant}:${userId ?? "guest"}`;
const deletedNotesKey = `deletedNotes:${variant}:${userId ?? "guest"}`;

const isDeletedNote = (id: string) => {
  try {
    const raw = sessionStorage.getItem(deletedNotesKey);
    if (!raw) return false;
    const deletedIds: string[] = JSON.parse(raw);
    return Array.isArray(deletedIds) && deletedIds.includes(String(id));
  } catch {
    return false;
  }
};
  //new 
// const deletedNotesKey = `deletedNotes:${variant}:${userId ?? "guest"}`;

// const filterDeletedNotes = (items: Note[]): Note[] => {
//   try {
//     const raw = sessionStorage.getItem(deletedNotesKey);
//     if (!raw) return items;

//     const deletedIds: string[] = JSON.parse(raw);
//     if (!Array.isArray(deletedIds) || deletedIds.length === 0) return items;

//     return items.filter((n) => !deletedIds.includes(String(n._id)));
//   } catch {
//     return items;
//   }
// };




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
      // const raw = envelope.data !== undefined ? envelope.data : (res.data as unknown);
      // setNotes(normalizeNotesList(raw));
      const raw = envelope.data !== undefined ? envelope.data : (res.data as unknown);

// setNotes((prev) => {
//   const incoming = normalizeNotesList(raw);
//   const merged = [...incoming];

//   for (const p of prev) {
//     if (!merged.find((n) => n._id === p._id)) {
//       merged.unshift(p);
//     }
//   }

//   return merged;
// });
// setNotes((prev) => {
//   const incoming = normalizeNotesList(raw);

//   // merge backend + UI notes safely
//   const merged = [...prev];

//   for (const inc of incoming) {
//     if (!merged.find((n) => n._id === inc._id)) {
//       merged.push(inc);
//     }
//   }

//   return merged;
// });

setNotes((prev) => {
  const incoming = normalizeNotesList(raw);
  // const incoming = filterDeletedNotes(normalizeNotesList(raw));

  const byId = new Map<string, Note>();

  // 🔥 FIRST: add backend notes (source of truth)
//   for (const note of incoming) {
//     if (note?._id) {
//       byId.set(String(note._id), note);
//     }
//   }

// for (const note of prev) {
//   if (!note?._id) continue;

//   const id = String(note._id);

//   if (!byId.has(id)) {
//     byId.set(id, note);
//   }
// }
for (const note of incoming) {
  if (note?._id) {
    byId.set(String(note._id), note);
  }
}

for (const note of prev) {
  if (!note?._id) continue;

  const id = String(note._id);
  const existing = byId.get(id);

  if (!existing) {
    byId.set(id, note);
    continue;
  }

  const prevUpdated = new Date(note.updatedAt ?? note.createdAt ?? 0).getTime();
  const existingUpdated = new Date(
    existing.updatedAt ?? existing.createdAt ?? 0
  ).getTime();

  if (prevUpdated > existingUpdated) {
    byId.set(id, note);
  }
}

  // 🔥 return merged list (newest first)
  return Array.from(byId.values()).sort((a, b) => {
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return bTime - aTime;
  });
});
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
  useEffect(() => {
  if (!userId) return;

  try {
    const cached = sessionStorage.getItem(notesStorageKey);
    if (!cached) return;

    const parsed = JSON.parse(cached) as Note[];
    if (Array.isArray(parsed) && parsed.length > 0) {
      setNotes(parsed);
      // setNotes(filterDeletedNotes(parsed));
    }
  } catch (e) {
    console.error("Failed to restore cached notes:", e);
  }
}, [userId, notesStorageKey]);

// useEffect(() => {
//   if (!userId) return;

//   try {
//     sessionStorage.setItem(notesStorageKey, JSON.stringify(notes));

//   } catch (e) {
//     console.error("Failed to cache notes:", e);
//   }
// }, [notes, userId, notesStorageKey]);

//--> test
useEffect(() => {
  if (!userId) return;
  if (loading) return;

  try {
    const cached = sessionStorage.getItem(notesStorageKey);

    // don't overwrite a non-empty cache with an empty/stale notes array on mount
    if (notes.length === 0 && cached) return;

    sessionStorage.setItem(notesStorageKey, JSON.stringify(notes));
  } catch (e) {
    console.error("Failed to cache notes:", e);
  }
}, [notes, userId, notesStorageKey, loading]);

  const glassPanel =
    variant === "mentor"
      ? mentorGlassCardFrost
      : variant === "director"
        ? directorGlassCard
        : glassPanelPastor;

//   const handleSave = async () => {
//     if (!userId) {
//       setSaveError("Session expired. Please sign in again.");
//       return;
//     }
//     const text = draft.trim();
//     if (!text) {
//       setSaveError("Write something before saving.");
//       return;
//     }
//     setSaving(true);
//     setSaveError(null);
//     setSaveOk(null);
//     try {
//       // await createNoteBestEffort(userId, text, userId);

//       // setDraft("");
//       // setSaveOk("Note saved.");
//       // setTimeout(() => setSaveOk(null), 2000);
//       // await loadNotes();
//       // setTab("previous");
//       const savedNote = await createNoteBestEffort(userId, text, userId);

// if (!savedNote || !savedNote._id) {
//   throw new Error("Invalid note returned from server");
// }

// setNotes((prev) => [savedNote, ...prev]);

// setDraft("");
// setSaveOk("Note saved.");
// setTimeout(() => setSaveOk(null), 2000);

// setTab("previous");
//     } catch (e) {
//       console.error(e);
//       setSaveError(extractApiErrorMessage(e));
//     } finally {
//       setSaving(false);
//     }
//   };
// const handleSave = async () => {
//   if (!userId) {
//     setSaveError("Session expired. Please sign in again.");
//     return;
//   }

//   const text = draft.trim();
//   if (!text) {
//     setSaveError("Write something before saving.");
//     return;
//   }

//   setSaving(true);
//   setSaveError(null);
//   setSaveOk(null);

//   try {
//     await createNoteBestEffort(userId, text, userId);

//     setDraft("");
//     setSaveOk("Note saved.");
//     setTimeout(() => setSaveOk(null), 2000);

//     // ✅ ALWAYS reload from backend
//     await loadNotes();

//     setTab("previous");
//   } catch (e) {
//     console.error(e);
//     setSaveError(extractApiErrorMessage(e));
//   } finally {
//     setSaving(false);
//   }
// };

// type NoteFormat =
//   | "heading"
//   | "quote"
//   | "divider"
//   | "bullet"
//   | "number"
//   | "left"
//   | "center"
//   | "right";

// const applyNoteFormat = (format: NoteFormat) => {
//   const textarea = textareaRef.current;
//   if (!textarea) return;

//   const start = textarea.selectionStart;
//   const end = textarea.selectionEnd;
//   const selectedText = draft.slice(start, end);
//   const fallbackText = selectedText || "Your text";
//   let formattedText = fallbackText;

//   switch (format) {
//     case "heading":
//       formattedText = `# ${fallbackText}`;
//       break;

//     case "quote":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line) => `> ${line}`)
//         .join("\n");
//       break;

//     case "divider":
//       formattedText = `${fallbackText}\n\n---\n`;
//       break;

//     case "bullet":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line) => `• ${line}`)
//         .join("\n");
//       break;

//     case "number":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line, index) => `${index + 1}. ${line}`)
//         .join("\n");
//       break;

//     case "left":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line) => `<p style="text-align:left">${line}</p>`)
//         .join("\n");
//       break;

//     case "center":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line) => `<p style="text-align:center">${line}</p>`)
//         .join("\n");
//       break;

//     case "right":
//       formattedText = fallbackText
//         .split("\n")
//         .map((line) => `<p style="text-align:right">${line}</p>`)
//         .join("\n");
//       break;

//     default:
//       break;
//   }

//   const nextDraft =
//     draft.slice(0, start) + formattedText + draft.slice(end);

//   setDraft(nextDraft);

//   window.setTimeout(() => {
//     textarea.focus();
//     textarea.setSelectionRange(start, start + formattedText.length);
//   }, 0);
// };

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

  // try {
  //   const savedNote = await createNoteBestEffort(userId, text, userId);

  //   // 🔴 CRITICAL CHECK
  //   if (!savedNote || !savedNote._id) {
  //     throw new Error("Backend did not save note");
  //   }

  //   console.log("SAVE SUCCESS:", savedNote);

  //   // ✅ show only confirmed note
  //   setNotes((prev) => [savedNote, ...prev]);

  //   setDraft("");
  //   setSaveOk("Note saved.");
  //   setTimeout(() => setSaveOk(null), 2000);

  //   setTab("previous");

  // } catch (e) {
  //   console.error("SAVE FAILED:", e);

  //   // ❌ IMPORTANT: show error clearly
  //   setSaveError("❌ Save failed. Backend rejected request.");
  // } finally {
  //   setSaving(false);
  // }

  try {
  const savedNote = await createNoteBestEffort(userId, text, userId);

  if (!savedNote || !savedNote._id) {
    throw new Error("Save failed - invalid response");
  }

  setNotes((prev) => {
    const exists = prev.some((n) => n._id === savedNote._id);
    return exists ? prev : [savedNote, ...prev];
  });

  setDraft("");
  setSaveOk("Note saved.");
  setTimeout(() => setSaveOk(null), 2000);

  setTab("previous");
} catch (e) {
  console.error("SAVE FAILED:", e);
  setSaveError(extractApiErrorMessage(e));
} finally {
  setSaving(false);
}
};

  const mainClass =
    variant === "mentor"
      ? `mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10 ${mentorMainGradient}`
      : "mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10";

  const MainTag = variant === "director" ? "div" : "main";
const toggleNoteSelection = (noteId: string) => {
  setSelectedNoteIds((prev) =>
    prev.includes(noteId)
      ? prev.filter((id) => id !== noteId)
      : [...prev, noteId]
  );
};

const performBulkDelete = async () => {
  if (!userId) return;
  const ids = [...selectedNoteIds];
  if (ids.length === 0) return;

  setBulkDeleting(true);
  try {
    await Promise.all(ids.map((noteId) => deleteNoteSafe(userId, noteId)));

    setNotes((prev) =>
      prev.filter((note: any) => !ids.includes(String(note._id || note.id)))
    );

    setSelectedNoteIds([]);
    setSelectMode(false);
    setBulkDeleteDialogOpen(false);
  } catch (error) {
    console.error("Failed to delete selected notes:", error);
  } finally {
    setBulkDeleting(false);
  }
};
  return (
    <div
      className={
        variant === "mentor"
          ? mentorPageRoot
          : variant === "director"
            ? directorPageRoot
            : "relative flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white"
      }
    >
      {variant === "pastor" ? (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(141,211,243,0.16),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      ) : null}
      <div className="relative z-10 flex min-h-screen flex-col">
        {Header ? <Header showFullHeader /> : null}

        <MainTag className={mainClass}>
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
                    {/* {["fa-font", "fa-table-columns", "fa-minus", "fa-list-ul", "fa-list-ol", "fa-align-left", "fa-align-center", "fa-align-right"].map(
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
                    )} */}
                    {NOTE_FORMAT_TOOLS.map((tool) => (
  <button
    key={tool.icon}
    type="button"
  onClick={() =>
                      applyNoteFormat({
                        format: tool.format,
                        draft,
                        setDraft,
                        textareaRef,
                      })
                    }
    className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-[#cde2f2] transition hover:bg-white/10"
    title={tool.label}
  >
    <i className={`fa-solid ${tool.icon} text-xs`} />
  </button>
))}
                  </div>
                  <label className="sr-only" htmlFor="note-draft">
                    Note content
                  </label>
                  <textarea
                   ref={textareaRef}
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
                 <div className="mb-5 flex items-center justify-between">
  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
    Your notes
  </p>

  <div className="flex items-center gap-2">
    {selectMode && selectedNoteIds.length > 0 && (
      <button
        type="button"
        onClick={() => setBulkDeleteDialogOpen(true)}
        className="rounded-lg border border-red-300/40 bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/25"
      >
        Delete {selectedNoteIds.length}
      </button>
    )}

    <button
      type="button"
      onClick={() => {
        setSelectMode((prev) => !prev);
        setSelectedNoteIds([]);
      }}
      className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[#cde2f2] hover:bg-white/15"
    >
      {selectMode ? "Cancel" : "Select"}
    </button>
  </div>
</div>
                  {loading && <p className="text-sm text-[#cde2f2]">Loading notes…</p>}
                  {!loading && listError && <p className="text-sm text-[#ffb2b2]">{listError}</p>}
                  {!loading && !listError && notes.length === 0 && (
                    <p className="text-sm text-[#cde2f2]">No notes yet. Switch to New to add one.</p>
                  )}
                  {!loading && !listError && notes.length > 0 && (
                    <ul className="mt-4 space-y-3">
                      {/* {notes.map((n) => (
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
                      ))} */}
                      {notes.map((n) => {
  if (!n || !n._id || typeof n.content !== "string") return null;
if (isDeletedNote(String(n._id))) return null;
  return (
    <li key={n._id}>
  <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 transition hover:border-[#8ec5eb]/35 hover:bg-white/10">
    {selectMode && (
      <button
        type="button"
        onClick={() => toggleNoteSelection(String(n._id))}
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
          selectedNoteIds.includes(String(n._id))
            ? "border-[#8ec5eb] bg-[#8ec5eb]"
            : "border-white/30 bg-white/5"
        }`}
      >
        {selectedNoteIds.includes(String(n._id)) && (
          <i className="fa-solid fa-check text-[10px] text-[#062946]" />
        )}
      </button>
    )}

    <Link
      href={{
        pathname: `${basePath}/${n._id}`,
        query: { note: JSON.stringify(n) },
      }}
      className="flex min-w-0 flex-1 items-center gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{notePreviewTitle(n)}</p>
        <p className="mt-0.5 text-xs text-[#b7d2e6]">
          {formatNoteTimestamp(n.createdAt)}
        </p>
      </div>

      {!selectMode && (
        <i className="fa-solid fa-chevron-right shrink-0 text-[#8ec5eb]/80" />
      )}
    </Link>
  </div>
</li>
  );
})}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </MainTag>

        {/* {variant === "pastor" ? <PastorFooter /> : null} */}
      </div>

      <NotesDeleteConfirmDialog
        open={bulkDeleteDialogOpen && selectedNoteIds.length > 0}
        onClose={() => !bulkDeleting && setBulkDeleteDialogOpen(false)}
        onConfirm={() => void performBulkDelete()}
        deleting={bulkDeleting}
        panelClassName={glassPanel}
        eyebrow="Delete notes"
        title={`Delete ${selectedNoteIds.length} note${selectedNoteIds.length === 1 ? "" : "s"} permanently?`}
        description="This action cannot be undone. Selected notes will be removed from your list."
        confirmLabel={
          selectedNoteIds.length <= 1 ? "Delete note" : `Delete ${selectedNoteIds.length} notes`
        }
      />
    </div>
  );
}
