"use client";

import { usePathname } from "next/navigation";
import AppHeader from "../Components/Header/AppHeader";

export default function DirectorLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginRoute =
    pathname === "/director/login" || pathname?.startsWith("/director/login/");

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader showFullHeader={true} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
