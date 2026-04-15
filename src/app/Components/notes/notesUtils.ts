import { getCookie } from "@/app/utils/cookies";
import type { Note } from "@/app/Services/types/users.types";

export type NotesVariant = "mentor" | "pastor" | "director";

function pickUserId(u: Record<string, unknown>): string | null {
  const raw = (u._id ?? u.id ?? u.userId) as string | undefined;
  if (raw == null || String(raw).trim() === "") return null;
  return String(raw).trim();
}

function displayNameFromUser(u: Record<string, unknown>): string {
  const first = String(u.firstName ?? "");
  const last = String(u.lastName ?? "");
  return [first, last].filter(Boolean).join(" ");
}

/**
 * Prefer `userId` cookie (set on login) for API paths — matches Mongo `_id` reliably.
 */
export function getNotesSession(variant: NotesVariant): {
  userId: string | null;
  displayName: string;
} {
  const explicitId = getCookie("userId")?.trim() || null;

  try {
    if (variant === "mentor") {
      const raw = getCookie("mentor");
      if (!raw) {
        return {
          userId: explicitId,
          displayName: "",
        };
      }
      const u = JSON.parse(raw) as Record<string, unknown>;
      return {
        userId: explicitId || pickUserId(u),
        displayName: displayNameFromUser(u) || "Mentor",
      };
    }

    const raw = getCookie("user");
    if (!raw) {
      return {
        userId: explicitId,
        displayName: "",
      };
    }
    const u = JSON.parse(raw) as Record<string, unknown>;
    const defaultName = variant === "director" ? "Director" : "User";
    return {
      userId: explicitId || pickUserId(u),
      displayName: displayNameFromUser(u) || defaultName,
    };
  } catch {
    return {
      userId: explicitId,
      displayName: "",
    };
  }
}

// export function noteBody(note: Pick<Note, "text" | "content">): string {
//   return (note.text ?? note.content ?? "").trim();
// }

export function noteBody(note: Pick<Note, "text" | "content">): string {
  return (note.content ?? note.text ?? "").trim();
}

export function notePreviewTitle(note: Note): string {
  const raw = noteBody(note);
  const line = raw.split(/\r?\n/).find((l) => l.trim().length > 0) ?? raw;
  const t = line.trim();
  if (!t) return "Note";
  return t.length > 72 ? `${t.slice(0, 69)}…` : t;
}

export function formatNoteTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

export function notesBasePath(variant: NotesVariant): string {
  if (variant === "mentor") return "/mentor/notes";
  if (variant === "director") return "/director/notes";
  return "/pastor/notes";
}
