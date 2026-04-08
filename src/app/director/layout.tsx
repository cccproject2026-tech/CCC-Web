import DirectorAuthGate from "../Components/DirectorAuthGate";
import DirectorLayoutShell from "./DirectorLayoutShell";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DirectorAuthGate>
      <DirectorLayoutShell>{children}</DirectorLayoutShell>
    </DirectorAuthGate>
  );
}
