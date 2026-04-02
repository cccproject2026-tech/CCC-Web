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
    <html lang="en">
      <body className="bg-[#062946] text-white font-[Albert_Sans]">
        <div className="min-h-screen flex items-center justify-center px-6">
          <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur">
            <p className="text-xs uppercase tracking-widest text-[#cde2f2]/80">
              App error
            </p>
            <h1 className="mt-2 text-2xl font-semibold">The app crashed.</h1>
            <p className="mt-2 text-sm text-[#cde2f2]">
              Try reloading. If it repeats, share the console error.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-xl bg-[#8ec5eb]/90 px-5 py-2.5 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
              >
                Reload
              </button>
              <a
                href="/mentor/login"
                className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
              >
                Mentor login
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
      </body>
    </html>
  );
}

