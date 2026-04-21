import { isAxiosError } from "axios";
import axiosInstance from "./config/axios-instance";
import { apiGetNotes } from "./users.service";
import type { Note } from "./types/users.types";

/** Stable string id for matching list items (handles `$oid` envelopes). */
function noteIdString(note: Note): string | null {
  const n = note as unknown as Record<string, unknown>;
  const raw = n._id ?? n.id;
  if (raw == null) return null;
  if (typeof raw === "object" && raw !== null && "$oid" in raw) {
    return String((raw as { $oid: string }).$oid);
  }
  return String(raw);
}

/** Pull notes array from varying API envelope shapes */
// export function normalizeNotesList(payload: unknown): Note[] {
//   if (payload == null) return [];
//   if (Array.isArray(payload)) return payload as Note[];
//   if (typeof payload !== "object") return [];
//   const o = payload as Record<string, unknown>;
//   if (Array.isArray(o.notes)) return o.notes as Note[];
//   if (Array.isArray(o.items)) return o.items as Note[];
//   if (Array.isArray(o.data)) return o.data as Note[];
//   return [];
// }
export function normalizeNotesList(payload: unknown): Note[] {
  if (payload == null) return [];

  if (Array.isArray(payload)) {
    return payload
      .map((n) => normalizeNoteRecord(n))
      .filter((n): n is Note => n !== null);
  }

  if (typeof payload !== "object") return [];

  const o = payload as Record<string, unknown>;

  if (Array.isArray(o.notes)) {
    return o.notes
      .map((n) => normalizeNoteRecord(n))
      .filter((n): n is Note => n !== null);
  }

  if (Array.isArray(o.items)) {
    return o.items
      .map((n) => normalizeNoteRecord(n))
      .filter((n): n is Note => n !== null);
  }

  if (Array.isArray(o.data)) {
    return o.data
      .map((n) => normalizeNoteRecord(n))
      .filter((n): n is Note => n !== null);
  }

  return [];
}

/** Single note from GET / POST / PATCH / PUT response */
export function normalizeNoteRecord(payload: unknown): Note | null {
  if (payload == null) return null;
  if (typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  const id = o._id ?? o.id;
  if (id != null) {
    return { ...(o as object), _id: String(id) } as Note;
  }
  if ("data" in o && o.data != null) return normalizeNoteRecord(o.data);
  if ("note" in o && o.note != null) return normalizeNoteRecord(o.note);
  return null;
}

function envelopeSuccess(data: unknown): boolean {
  if (data == null || typeof data !== "object") return true;
  const s = (data as { success?: boolean }).success;
  return s !== false;
}

function extractEnvelopeMessage(data: unknown): string | undefined {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return undefined;
}

/**
 * Resolve one note by id. The API does not expose GET /users/:userId/notes/:noteId,
 * so we load GET /users/:userId/notes and find the matching item.
 */
export async function fetchNoteById(userId: string, noteId: string): Promise<Note | null> {
  const res = await apiGetNotes(userId);
  const envelope = res.data as { success?: boolean; message?: string; data?: unknown };
  if (envelope && envelope.success === false) {
    throw new Error(
      typeof envelope.message === "string" ? envelope.message : "Could not load notes.",
    );
  }
  const raw = envelope.data !== undefined ? envelope.data : (res.data as unknown);
  const list = normalizeNotesList(raw);
  const target = noteId.trim();
  for (const n of list) {
    const id = noteIdString(n);
    if (id && id === target) return n;
  }
  // throw new Error("Note not found.");
  return null;
}

/**
 * POST /users/:userId/notes — try common body shapes until one succeeds.
 */
// export async function createNoteBestEffort(
//   userId: string,
//   text: string,
//   createdBy: string,
// ): Promise<Note | null> {
//   const payloads: Record<string, unknown>[] = [
//     { text, createdBy },
//     { text },
//     { content: text, createdBy },
//     { content: text },
//     { note: text, createdBy },
//     { note: text },
//     { body: text },
//   ];

//   let lastErr: unknown;

//   for (const body of payloads) {
//     try {
//       const res = await axiosInstance.post<unknown>(`/users/${userId}/notes`, body);
//       const data = res.data as { success?: boolean; message?: string; data?: unknown };
//       if (data && data.success === false) {
//         lastErr = new Error(data.message || "Server rejected the note.");
//         continue;
//       }
//       if (!envelopeSuccess(res.data)) {
//         lastErr = new Error(extractEnvelopeMessage(res.data) || "Server rejected the note.");
//         continue;
//       }
//       const raw = (data as { data?: unknown }).data ?? res.data;
//       const note = normalizeNoteRecord(raw);
//       return note;
//     } catch (e) {
//       lastErr = e;
//       if (!isAxiosError(e)) break;
//       const st = e.response?.status;
//       if (st === 401 || st === 403) break;
//       if (st !== 400 && st !== 422) break;
//     }
//   }

//   throw lastErr ?? new Error("Could not save note.");
// }
// export async function createNoteBestEffort(
//   userId: string,
//   text: string,
//   createdBy: string,
// ): Promise<Note | null> {
//   try {
//     const res = await axiosInstance.post(`/users/${userId}/notes`, {
//       content: text,
//       createdBy,
//     });

//     const data = res.data as { success?: boolean; data?: unknown };

//     if (data && data.success === false) {
//       throw new Error("Server rejected note");
//     }

//     const raw = data?.data ?? res.data;
//     return normalizeNoteRecord(raw);
//   } catch (e) {
//     console.error("SAVE FAILED:", e);
//     throw e;
//   }
// }


export async function createNoteBestEffort(
  userId: string,
  text: string,
  createdBy: string,
): Promise<Note | null> {
  try {
    const res = await axiosInstance.post(`/users/${userId}/notes`, {
      content: text,
      createdBy,
    });

    console.log("RAW SAVE RESPONSE:", res.data);

    const data = res.data as any;

    if (data?.success === false) {
      throw new Error(data.message || "Save failed");
    }

    const raw = data?.data ?? res.data;

    const note = normalizeNoteRecord(raw);

    return note;
  } catch (err) {
    console.error("BACKEND ERROR:", err);
    throw err; // 🔴 IMPORTANT: do NOT silently fail
  }
}
/**
 * PATCH with common bodies — backend has no PUT for notes.
 */
// export async function updateNoteBestEffort(
//   userId: string,
//   noteId: string,
//   text: string,
// ): Promise<Note | null> {
//   const payloads: Record<string, unknown>[] = [
//     { text },
//     { content: text },
//     { note: text },
//     { body: text },
//   ];

//   let lastErr: unknown;

//   for (const body of payloads) {
//     try {
//       const res = await axiosInstance.patch<unknown>(`/users/${userId}/notes/${noteId}`, body);
//       const data = res.data as { success?: boolean; message?: string; data?: unknown };
//       if (data && data.success === false) {
//         lastErr = new Error(data.message || "Update rejected.");
//         continue;
//       }
//       if (!envelopeSuccess(res.data)) {
//         lastErr = new Error(extractEnvelopeMessage(res.data) || "Update rejected.");
//         continue;
//       }
//       const raw = data.data !== undefined ? data.data : res.data;
//       let note = normalizeNoteRecord(raw);
//       if (!note) {
//         try {
//           note = await fetchNoteById(userId, noteId);
//         } catch {
//           /* ignore */
//         }
//       }
//       if (note) return note;
//     } catch (e) {
//       lastErr = e;
//       if (!isAxiosError(e)) break;
//       const st = e.response?.status;
//       if (st === 401 || st === 403) break;
//       if (st !== 400 && st !== 422 && st !== 404) break;
//     }
//   }

//   throw lastErr ?? new Error("Could not update note.");
// }
export async function updateNoteBestEffort(
  userId: string,
  noteId: string,
  text: string,
): Promise<Note | null> {
  try {
    const res = await axiosInstance.patch<unknown>(
      `/users/${userId}/notes/${noteId}`,
      { content: text }
    );

    console.log("RAW PATCH RESPONSE:", res.data);

    const data = res.data as {
      success?: boolean;
      message?: string;
      data?: unknown;
    };

    if (data?.success === false) {
      throw new Error(data.message || "Update rejected.");
    }

    if (!envelopeSuccess(res.data)) {
      throw new Error(extractEnvelopeMessage(res.data) || "Update rejected.");
    }

    const raw = data.data !== undefined ? data.data : res.data;
    const note = normalizeNoteRecord(raw);

    if (!note) {
      throw new Error("Invalid update response from server.");
    }

    return note;
  } catch (e) {
    console.error("PATCH FAILED:", e);
    throw e;
  }
}
/**
 * DELETE /users/:userId/notes/:noteId
 */
export async function deleteNoteSafe(userId: string, noteId: string): Promise<void> {
  const res = await axiosInstance.delete<unknown>(`/users/${userId}/notes/${noteId}`);
  const data = res.data as { success?: boolean; message?: string };
  if (data && data.success === false) {
    throw new Error(data.message || "Could not delete note.");
  }
}
