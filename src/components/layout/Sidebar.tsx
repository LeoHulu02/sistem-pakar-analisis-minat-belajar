"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  Database,
  FileSpreadsheet,
  FileText,
  GitCompare,
  ListChecks,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/siswa", label: "Siswa", icon: Users },
  { href: "/konsultasi/new", label: "Konsultasi", icon: ClipboardList },
  { href: "/laporan", label: "Laporan", icon: FileText },
  { href: "/admin/gejala", label: "Gejala", icon: ListChecks },
  { href: "/admin/rules", label: "Rules", icon: Database },
  { href: "/admin/dataset", label: "Dataset", icon: FileSpreadsheet },
  { href: "/admin/comparison", label: "Komparasi", icon: GitCompare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 overflow-y-auto border-r border-slate-200 bg-white lg:block">
      <div className="flex h-12 items-center border-b border-slate-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-xs font-semibold text-white">
            S
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-slate-950">
              Sistem Pakar
            </p>
            <p className="text-[11px] text-slate-500">Analisis Minat Belajar</p>
          </div>
        </Link>
      </div>

      <nav className="space-y-1 px-2 py-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition",
                isActive
                  ? "bg-primary-50 font-medium text-primary-700 ring-1 ring-primary-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              )}
            >
              <item.icon
                className={cn(
                  "h-4 w-4",
                  isActive ? "text-primary-600" : "text-slate-400",
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mx-2 mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-700">
          <BarChart3 className="h-3.5 w-3.5 text-primary-600" />
          Status MVP
        </div>
        <p className="text-xs leading-relaxed text-slate-500">
          Foundation app aktif. Modul data dan engine akan dibangun bertahap.
        </p>
      </div>
    </aside>
  );
}
