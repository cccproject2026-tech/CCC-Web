"use client";

import { useParams } from "next/navigation";
import NoteDetailContent from "@/app/Components/notes/NoteDetailContent";

export default function DirectorNoteDetailPage() {
  const params = useParams();
  const noteId = typeof params?.noteId === "string" ? params.noteId : "";
  if (!noteId) return null;
  return <NoteDetailContent variant="director" noteId={noteId} />;
}
