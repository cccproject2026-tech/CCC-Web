"use client";

import { useParams } from "next/navigation";
import MenteeProfileClient from "../MenteeProfileClient";

/**
 * Path-based URL: /director/mentees/profile/[id]
 * Query-based URL still works: /director/mentees/profile?id=[id]
 */
export default function MenteeProfileByIdPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  if (!id) return null;
  return <MenteeProfileClient menteeId={id} />;
}
