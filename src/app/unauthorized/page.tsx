import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-950">
          Akses tidak diizinkan
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Akun ini tidak memiliki izin untuk membuka halaman tersebut.
        </p>
        <Link
          href="/dashboard"
          className="mt-4 inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Kembali ke Dashboard
        </Link>
      </section>
    </main>
  );
}
