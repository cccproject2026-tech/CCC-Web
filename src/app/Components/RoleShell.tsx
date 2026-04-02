/**
 * Shared background for pastor + mentor areas — matches the public landing page palette.
 */
export default function RoleShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#062946] font-[Albert_Sans] text-white">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.22),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.12),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]"
        aria-hidden
      />
      <div className="relative z-[1] flex min-h-screen flex-col">{children}</div>
    </div>
  );
}
