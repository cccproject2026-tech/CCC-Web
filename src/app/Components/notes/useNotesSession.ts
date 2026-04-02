"use client";

import { useEffect, useMemo, useState } from "react";
import { getCookie, setCookie } from "@/app/utils/cookies";
import { getNotesSession, type NotesVariant } from "./notesUtils";

/** Stable user id + display name for notes APIs (backfills `userId` cookie when missing). */
export function useNotesSession(variant: NotesVariant) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (getCookie("userId")) return;
    const raw = getCookie(variant === "mentor" ? "mentor" : "user");
    if (!raw) return;
    try {
      const u = JSON.parse(raw) as { _id?: string; id?: string };
      const id = u._id ?? u.id;
      if (id) {
        setCookie("userId", String(id));
        setTick((n) => n + 1);
      }
    } catch {
      /* ignore */
    }
  }, [variant]);

  return useMemo(() => getNotesSession(variant), [variant, tick]);
}
