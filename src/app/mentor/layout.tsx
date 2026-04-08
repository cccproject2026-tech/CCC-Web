import RoleShell from "../Components/RoleShell";
import MentorAuthGate from "../Components/MentorAuthGate";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell>
      <MentorAuthGate>{children}</MentorAuthGate>
    </RoleShell>
  );
}
