import RoleShell from "../Components/RoleShell";
import PastorAuthGate from "../Components/PastorAuthGate";

export default function PastorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleShell>
      <PastorAuthGate>{children}</PastorAuthGate>
    </RoleShell>
  );
}
