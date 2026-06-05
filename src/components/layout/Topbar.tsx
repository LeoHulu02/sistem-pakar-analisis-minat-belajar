import { logoutAction } from "@/actions/auth";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export async function Topbar() {
  const supabase = createClient();
  const { user, profile } = await (async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { data: profile } = user
        ? await supabase
            .from("profiles")
            .select("full_name, role")
            .eq("id", user.id)
            .single()
        : { data: null };

      return { user, profile };
    } catch {
      return { user: null, profile: null };
    }
  })();

  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-primary-100 bg-primary-50/80 px-4 backdrop-blur lg:border-slate-200 lg:bg-white lg:px-6 lg:backdrop-blur-none">
      <div>
        <p className="text-sm font-semibold text-slate-950">Dashboard</p>
        <p className="text-xs text-slate-500">
          Analisis minat belajar berbasis Forward Chaining + ID3
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium text-slate-950">
            {profile?.full_name ?? user?.email ?? "User"}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">
            {profile?.role ?? "session"}
          </p>
        </div>
        <form action={logoutAction}>
          <SubmitButton
            className="h-8 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100"
            pendingText="Keluar..."
          >
            Keluar
          </SubmitButton>
        </form>
      </div>
    </header>
  );
}
