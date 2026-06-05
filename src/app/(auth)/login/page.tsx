import Image from "next/image";
import { UserRound } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { PasswordInput } from "@/components/layout/PasswordInput";
import { SubmitButton } from "@/components/layout/SubmitButton";

type LoginPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <main className="h-screen overflow-hidden bg-[#f3fbf9] md:h-dvh">
      <section className="grid h-full w-full md:grid-cols-2">
        <aside className="relative hidden h-full overflow-hidden bg-[#27b8a8] md:block">
          <Image
            src="/login-learning.jpg"
            alt="Ilustrasi digital learning"
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#031f25]/84 via-[#0f766e]/34 to-[#f05f57]/12" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.26),transparent_34%)]" />
          <div className="absolute inset-y-0 right-0 w-px bg-white/30" />

          <div className="relative z-10 h-full" />
        </aside>

        <div className="relative flex h-full items-center justify-center overflow-hidden bg-[#f3fbf9] px-6 py-6 sm:px-8 lg:px-16">
          <div className="absolute right-10 top-16 h-28 w-28 rounded-full bg-[#27b8a8]/15 blur-2xl" />
          <div className="absolute bottom-12 left-16 h-32 w-32 rounded-full bg-[#f05f57]/10 blur-2xl" />

          <section className="relative w-full max-w-sm rounded-2xl border border-teal-100 bg-white px-7 py-8 shadow-xl shadow-teal-900/10">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                Selamat Datang
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Silakan masuk untuk melanjutkan
              </p>
            </div>

            {searchParams?.error ? (
              <div className="mb-5 rounded-lg border border-error-100 bg-error-100 px-3 py-2 text-sm font-medium text-error-500">
                {searchParams.error}
              </div>
            ) : null}

            <form action={loginAction} className="space-y-4" autoComplete="off">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-950"
                >
                  Email
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="off"
                    required
                    className="h-10 w-full rounded-lg border border-teal-100 bg-[#f3fbf9] pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#27b8a8] focus:ring-2 focus:ring-[#27b8a8]/20"
                    placeholder="Masukkan email akun"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-950"
                >
                  Password
                </label>
                <PasswordInput />
              </div>

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    name="remember"
                    className="h-4 w-4 rounded border-teal-200 text-[#27b8a8] focus:ring-[#27b8a8]"
                  />
                  <span>Ingat Saya</span>
                </label>
              </div>

              <SubmitButton
                className="h-10 w-full rounded-lg bg-[#16a394] px-4 text-sm font-semibold text-white shadow-md shadow-teal-900/20 transition hover:bg-[#0f766e]"
                pendingText="Masuk..."
              >
                Masuk
              </SubmitButton>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
