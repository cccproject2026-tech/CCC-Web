"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function VoiceNotesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    if (Cookies.get("mentor")) {
      router.replace("/mentor/voice-notes");
      return;
    }
    if (Cookies.get("user")) {
      router.replace("/pastor/voice-notes");
      return;
    }
    router.replace("/choose-role");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#062946] font-[Albert_Sans] text-white">
      <p className="text-sm text-white/70">Redirecting…</p>
    </div>
  );
}
