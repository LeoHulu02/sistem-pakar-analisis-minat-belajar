import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSiswaAction } from "@/actions/siswa";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SiswaDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
};

function formatJenisKelamin(value: "L" | "P" | null) {
  if (value === "L") return "Laki-laki";
  if (value === "P") return "Perempuan";
  return "-";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SiswaDetailPage({
  params,
  searchParams,
}: SiswaDetailPageProps) {
  const supabase = createClient();
  const [{ data: siswa, error }, { count: konsultasiCount }] =
    await Promise.all([
      supabase.from("siswa").select("*").eq("id", params.id).single(),
      supabase
        .from("konsultasi")
        .select("id", { count: "exact", head: true })
        .eq("siswa_id", params.id),
    ]);

  if (error || !siswa) {
    notFound();
  }

  const { data: konsultasiRows } = await supabase
    .from("konsultasi")
    .select("*")
    .eq("siswa_id", siswa.id)
    .order("created_at", { ascending: false })
    .limit(8);
  const konsultasiIds = (konsultasiRows ?? []).map((item) => item.id);
  const { data: hasilRows } =
    konsultasiIds.length > 0
      ? await supabase
          .from("hasil_diagnosa")
          .select("*")
          .in("konsultasi_id", konsultasiIds)
      : { data: [] };
  const hasilByKonsultasiId = new Map(
    (hasilRows ?? []).map((item) => [item.konsultasi_id, item]),
  );

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Detail Siswa
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {siswa.nama}
          </h1>
          <p className="font-mono text-xs text-slate-500">{siswa.nis}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/siswa"
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Kembali
          </Link>
          <Link
            href={`/siswa/${siswa.id}/edit`}
            className="inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            Edit
          </Link>
        </div>
      </div>

      {searchParams?.error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          {searchParams.error}
        </div>
      ) : null}

      <section className="grid lg:grid-cols-[1fr_320px]">
        <div className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Informasi Siswa
            </h2>
          </div>
          <dl className="grid gap-0 text-sm md:grid-cols-2">
            <div className="border-b border-slate-100 px-4 py-3">
              <dt className="text-xs text-slate-500">NIS</dt>
              <dd className="mt-1 font-mono text-slate-950">{siswa.nis}</dd>
            </div>
            <div className="border-b border-slate-100 px-4 py-3">
              <dt className="text-xs text-slate-500">Nama Lengkap</dt>
              <dd className="mt-1 font-medium text-slate-950">{siswa.nama}</dd>
            </div>
            <div className="border-b border-slate-100 px-4 py-3">
              <dt className="text-xs text-slate-500">Kelas</dt>
              <dd className="mt-1 font-medium text-slate-950">{siswa.kelas}</dd>
            </div>
            <div className="border-b border-slate-100 px-4 py-3">
              <dt className="text-xs text-slate-500">Jenis Kelamin</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {formatJenisKelamin(siswa.jenis_kelamin)}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-slate-500">Tahun Ajaran</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {siswa.tahun_ajaran}
              </dd>
            </div>
            <div className="px-4 py-3">
              <dt className="text-xs text-slate-500">Total Konsultasi</dt>
              <dd className="mt-1 font-medium text-slate-950">
                {konsultasiCount ?? 0}
              </dd>
            </div>
          </dl>
        </div>

        <aside>
          <div className="border-b border-slate-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Aksi Cepat
            </h2>
            <div className="mt-3 grid gap-2">
              <Link
                href={`/konsultasi/new?siswa_id=${siswa.id}`}
                className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
              >
                Mulai Konsultasi
              </Link>
              <form action={deleteSiswaAction}>
                <input type="hidden" name="id" value={siswa.id} />
                <SubmitButton
                  className="h-8 w-full rounded-md border border-error-100 bg-white px-3 text-sm font-medium text-error-500 hover:bg-error-100"
                  pendingText="Menghapus..."
                >
                  Hapus Siswa
                </SubmitButton>
              </form>
            </div>
          </div>

          <div className="bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Riwayat Konsultasi
            </h2>
            {(konsultasiRows ?? []).length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Belum ada riwayat konsultasi untuk siswa ini.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {(konsultasiRows ?? []).map((item) => {
                  const hasil = hasilByKonsultasiId.get(item.id);

                  return (
                    <Link
                      key={item.id}
                      href={`/konsultasi/${item.id}/hasil`}
                      className="block rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-950">
                            {hasil?.final_kesimpulan ?? "Belum ada hasil"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {formatDate(item.created_at)}
                          </p>
                        </div>
                        {hasil ? (
                          hasil.agreement ? (
                            <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                              Sepakat
                            </span>
                          ) : (
                            <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Review
                            </span>
                          )
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                            Pending
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
