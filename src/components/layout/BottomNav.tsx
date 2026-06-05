import Link from "next/link";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings2,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/siswa", label: "Siswa", icon: Users },
  { href: "/konsultasi/new", label: "Tes", icon: ClipboardList },
  { href: "/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/rules", label: "Admin", icon: Settings2 },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t border-slate-200 bg-white lg:hidden">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-slate-500 hover:text-primary-600"
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
