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
        <div className="relative z-10 m-0 flex min-h-0 w-full max-w-full flex-1 flex-col p-0">
          {children}
        </div>
      </MentorAuthGate>
    </RoleShell>
  );
}
