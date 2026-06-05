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
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
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
            className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            pendingText="Keluar..."
          >
            Keluar
          </SubmitButton>
        </form>
      </div>
    </header>
  );
}
