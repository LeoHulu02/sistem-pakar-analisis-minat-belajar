import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="min-h-screen lg:pl-56">
        <Topbar />
        <main className="h-[calc(100dvh-3rem)] w-full overflow-hidden bg-white">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
