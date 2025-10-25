"use client";
import { usePathname } from "next/navigation";
import AppHeader from "../Components/AppHeader";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // List of routes where header should be visible
  const showHeaderOn = ["/director/waitingforapproval"];

  // Check if current route matches any of them
  const showHeader = showHeaderOn.some((path) => pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <AppHeader />} {/* Header only for selected pages */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
