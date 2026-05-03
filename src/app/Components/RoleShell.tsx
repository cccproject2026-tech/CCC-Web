/**
 * Shared background for role shells.
 * `director` and `mentor` use the Revitalization Roadmap dashboard (deep navy + subtle accents).
 */
export default function RoleShell({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "director" | "mentor";
}) {
  const dashboard = variant === "director" || variant === "mentor";

  const overlay = dashboard
    ? "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_14%_10%,rgba(52,152,219,0.14),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(155,89,182,0.08),transparent_36%),linear-gradient(180deg,#070f22_0%,#0A1128_42%,#0d1836_100%)]"
    : "pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.22),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]";

  const baseBg = dashboard ? "bg-[#0A1128]" : "bg-[#062946]";

  return (
    <div className={`relative min-h-screen ${baseBg} font-[Albert_Sans] text-white`}>
      <div className={overlay} aria-hidden />
      <div className="relative z-[1] flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
