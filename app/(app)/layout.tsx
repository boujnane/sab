import { NavBar } from "@/components/nav-bar";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col pb-20 md:pb-0 md:pl-48">
      <NavBar />
      {children}
    </div>
  );
}
