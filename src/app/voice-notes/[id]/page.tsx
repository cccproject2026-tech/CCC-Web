"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useParams, useRouter } from "next/navigation";

export default function VoiceNoteDetailRedirectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = encodeURIComponent(params.id ?? "");

  useEffect(() => {
    if (Cookies.get("mentor")) {
      router.replace(`/mentor/voice-notes/${id}`);
      return;
    }
    if (Cookies.get("user")) {
      router.replace(`/pastor/voice-notes/${id}`);
      return;
    }
    router.replace("/choose-role");
  }, [router, id]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#062946] font-[Albert_Sans] text-white">
      <p className="text-sm text-white/70">Redirecting…</p>
    </div>
  );
}
