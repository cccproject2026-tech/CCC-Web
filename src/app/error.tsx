"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans] flex items-center justify-center px-6">
      <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-widest text-[#cde2f2]/80">
          Something went wrong
        </p>
        <h1 className="mt-2 text-2xl font-semibold">We hit an unexpected error.</h1>
        <p className="mt-2 text-sm text-[#cde2f2]">
          Please try again. If it keeps happening, share the error in the console.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-[#8ec5eb]/90 px-5 py-2.5 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
          >
            Try again
          </button>
          <a
            href="/mentor/login"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Back to mentor login
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-white/15 bg-black/20 p-4">
          <p className="text-xs text-white/70">
            Digest: {error.digest ?? "n/a"}
          </p>
          <p className="mt-2 text-xs text-white/70 break-words">{error.message}</p>
        </div>
      </div>
    </div>
  );
}

