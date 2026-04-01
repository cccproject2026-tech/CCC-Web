import DirectorLayoutShell from "./DirectorLayoutShell";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DirectorLayoutShell>{children}</DirectorLayoutShell>;
}
