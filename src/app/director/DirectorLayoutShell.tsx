"use client";

import { usePathname } from "next/navigation";
import AppHeader from "../Components/Header/AppHeader";
import RoleShell from "../Components/RoleShell";

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
    <RoleShell>
      <AppHeader showFullHeader={true} />
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col px-4 pb-10 pt-4 sm:px-6 sm:pb-12 lg:px-8 lg:pt-6">
        {children}
      </main>
    </RoleShell>
  );
}
