"use client";
import { usePathname } from "next/navigation";
import AppHeader from "../Components/Header/AppHeader";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // List of routes where header should be visible
  const showHeaderOn = [
    "/director/waitingforapproval",
    "/director/revitalization-roadmap",
  ];

  // Check if current route matches any of them
  const showHeader = showHeaderOn.some((path) => pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <AppHeader showFullHeader={true} />}
      {/* Header only for selected pages */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
