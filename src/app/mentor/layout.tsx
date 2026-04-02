import RoleShell from "../Components/RoleShell";

export default function MentorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleShell>{children}</RoleShell>;
}
