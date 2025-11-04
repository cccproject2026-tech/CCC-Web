import AppHeader from "../Components/Header/AppHeader";

export default function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader showFullHeader={true} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
