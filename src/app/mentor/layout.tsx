import RoleShell from "../Components/RoleShell";
import MentorAuthGate from "../Components/MentorAuthGate";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell variant="mentor">
      <MentorAuthGate>
        <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col px-4 pb-10 pt-4 sm:px-6 sm:pb-12 lg:px-8 lg:pt-6">
          {children}
        </div>
      </MentorAuthGate>
    </RoleShell>
  );
}
