import type { RefObject } from "react";
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

/** Format actions for the notes textarea toolbar (new + edit). */
export type NoteFormat =
  | "heading"
  | "quote"
  | "divider"
  | "bullet"
  | "number"
  | "left"
  | "center"
  | "right";

export const NOTE_FORMAT_TOOLS: readonly {
  icon: string;
  label: string;
  format: NoteFormat;
}[] = [
  { icon: "fa-font", label: "Heading", format: "heading" },
  { icon: "fa-table-columns", label: "Quote block", format: "quote" },
  { icon: "fa-minus", label: "Divider", format: "divider" },
  { icon: "fa-list-ul", label: "Bullet list", format: "bullet" },
  { icon: "fa-list-ol", label: "Numbered list", format: "number" },
  { icon: "fa-align-left", label: "Align left", format: "left" },
  { icon: "fa-align-center", label: "Align center", format: "center" },
  { icon: "fa-align-right", label: "Align right", format: "right" },
];

export function applyNoteFormat(args: {
  format: NoteFormat;
  draft: string;
  setDraft: (next: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}): void {
  const { format, draft, setDraft, textareaRef } = args;
  const textarea = textareaRef.current;
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;

  const selectedText = draft.slice(start, end);
  const hasSelection = selectedText.length > 0;
  const targetText = hasSelection ? selectedText : "Your text";

  let formattedText = targetText;

  switch (format) {
    case "heading":
      formattedText = targetText
        .split("\n")
        .map((line) => (line.trim() ? `# ${line.replace(/^#\s*/, "")}` : line))
        .join("\n");
      break;

    case "quote":
      formattedText = targetText
        .split("\n")
        .map((line) => (line.trim() ? `> ${line.replace(/^>\s*/, "")}` : line))
        .join("\n");
      break;

    case "divider":
      formattedText = hasSelection ? `${targetText}\n\n---\n` : `\n---\n`;
      break;

    case "bullet":
      formattedText = targetText
        .split("\n")
        .map((line) => {
          const clean = line.replace(/^(\s*[-•]\s*)/, "");
          return clean.trim() ? `• ${clean}` : clean;
        })
        .join("\n");
      break;

    case "number":
      formattedText = targetText
        .split("\n")
        .map((line, index) => {
          const clean = line.replace(/^\s*\d+\.\s*/, "");
          return clean.trim() ? `${index + 1}. ${clean}` : clean;
        })
        .join("\n");
      break;

    case "left":
      formattedText = targetText
        .split("\n")
        .map((line) => line.trimStart())
        .join("\n");
      break;

    case "center":
      formattedText = targetText
        .split("\n")
        .map((line) => (line.trim() ? `          ${line.trim()}` : line))
        .join("\n");
      break;

    case "right":
      formattedText = targetText
        .split("\n")
        .map((line) => (line.trim() ? `                    ${line.trim()}` : line))
        .join("\n");
      break;

    default:
      break;
  }

  const nextDraft = draft.slice(0, start) + formattedText + draft.slice(end);
  setDraft(nextDraft);

  window.setTimeout(() => {
    textarea.focus();
    textarea.setSelectionRange(start, start + formattedText.length);
  }, 0);
}
