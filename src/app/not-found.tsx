"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#062946] text-white font-[Albert_Sans] flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-3xl border border-white/20 bg-white/5 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-widest text-[#cde2f2]/80">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-[#cde2f2]">
          The page you’re looking for doesn’t exist or was moved.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[#8ec5eb]/90 px-5 py-2.5 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
          >
            Go home
          </Link>
          <Link
            href="/mentor/login"
            className="rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
          >
            Mentor login
          </Link>
        </div>
      </div>
    </div>
  );
}

