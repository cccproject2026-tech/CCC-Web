"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  hasDirectorSession,
  isDirectorPublicRoute,
} from "@/app/utils/director-auth";

export default function DirectorAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !pathname) return;

    if (isDirectorPublicRoute(pathname)) {
      setAllowed(true);
      return;
    }

    if (!hasDirectorSession()) {
      const search = typeof window !== "undefined" ? window.location.search || "" : "";
      const returnPath = `${pathname}${search}`;
      router.replace(`/director/login?returnUrl=${encodeURIComponent(returnPath)}`);
      setAllowed(false);
      return;
    }

    setAllowed(true);
  }, [mounted, pathname, router]);

  if (!pathname) return null;

  if (isDirectorPublicRoute(pathname)) {
    return <>{children}</>;
  }

  if (!mounted || !allowed) {
    return (
      <div className="flex min-h-screen flex-1 items-center justify-center bg-[#062946] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
          <p className="text-sm text-[#cde2f2]">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
