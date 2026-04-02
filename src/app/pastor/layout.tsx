import RoleShell from "../Components/RoleShell";

export default function PastorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell>{children}</RoleShell>;
}
