import Link from "next/link";
import { Pagination } from "@/components/layout/Pagination";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type LaporanPageProps = {
  searchParams?: {
    kelas?: string;
    tahun_ajaran?: string;
    status?: string;
    page?: string;
  };
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export default async function LaporanPage({ searchParams }: LaporanPageProps) {
  const kelas = searchParams?.kelas?.trim() ?? "";
  const tahunAjaran = searchParams?.tahun_ajaran?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const supabase = createClient();

  const { data: results, error } = await supabase
    .from("hasil_diagnosa")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(300);

  const konsultasiIds = (results ?? []).map((item) => item.konsultasi_id);
  const { data: konsultasiRows } =
    konsultasiIds.length > 0
      ? await supabase
          .from("konsultasi")
          .select("id, siswa_id, created_at, status")
          .in("id", konsultasiIds)
      : { data: [] };

  const siswaIds = Array.from(
    new Set((konsultasiRows ?? []).map((item) => item.siswa_id)),
  );
  const { data: siswaRows } =
    siswaIds.length > 0
      ? await supabase
          .from("siswa")
          .select("id, nama, nis, kelas, tahun_ajaran")
          .in("id", siswaIds)
      : { data: [] };

  const [{ data: kelasRows }, { data: tahunRows }] = await Promise.all([
    supabase.from("siswa").select("kelas").order("kelas"),
    supabase.from("siswa").select("tahun_ajaran").order("tahun_ajaran"),
  ]);

  const konsultasiById = new Map(
    (konsultasiRows ?? []).map((item) => [item.id, item]),
  );
  const siswaById = new Map((siswaRows ?? []).map((item) => [item.id, item]));
  const reportRows = (results ?? [])
    .map((hasil) => {
      const konsultasi = konsultasiById.get(hasil.konsultasi_id) ?? null;
      const siswa = konsultasi
        ? siswaById.get(konsultasi.siswa_id) ?? null
        : null;

      return { hasil, konsultasi, siswa };
    })
    .filter((row) => {
      if (kelas && row.siswa?.kelas !== kelas) return false;
      if (tahunAjaran && row.siswa?.tahun_ajaran !== tahunAjaran) return false;
      if (status === "sepakat" && row.hasil.agreement !== true) return false;
      if (status === "review" && row.hasil.agreement !== false) return false;
      return true;
    });

  const total = reportRows.length;
  const agreementCount = reportRows.filter(
    (row) => row.hasil.agreement === true,
  ).length;
  const reviewCount = reportRows.filter(
    (row) => row.hasil.agreement === false,
  ).length;
  const agreementRate = total > 0 ? (agreementCount / total) * 100 : 0;
  const avgConfidence = average(
    reportRows.map((row) =>
      Math.max(row.hasil.fc_confidence ?? 0, row.hasil.id3_confidence ?? 0),
    ),
  );
  const finalDistribution = new Map<string, number>();

  for (const row of reportRows) {
    const label = row.hasil.final_kesimpulan ?? "Belum ada";
    finalDistribution.set(label, (finalDistribution.get(label) ?? 0) + 1);
  }

  const distributionRows = Array.from(finalDistribution.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const paginatedRows = reportRows.slice(from, to);
  const exportParams = new URLSearchParams();

  if (kelas) exportParams.set("kelas", kelas);
  if (tahunAjaran) exportParams.set("tahun_ajaran", tahunAjaran);
  if (status) exportParams.set("status", status);

  const exportHref = `/api/laporan/export${
    exportParams.size > 0 ? `?${exportParams.toString()}` : ""
  }`;
  const kelasOptions = Array.from(
    new Set((kelasRows ?? []).map((item) => item.kelas)),
  );
  const tahunOptions = Array.from(
    new Set((tahunRows ?? []).map((item) => item.tahun_ajaran)),
  );
  const stats = [
    {
      label: "Total Laporan",
      value: String(total),
      helper: "Hasil sesuai filter aktif",
    },
    {
      label: "Metode Sepakat",
      value: String(agreementCount),
      helper: `${formatPercent(agreementRate)} agreement rate`,
    },
    {
      label: "Perlu Review",
      value: String(reviewCount),
      helper: "FC dan ID3 berbeda",
    },
    {
      label: "Avg Confidence",
      value: formatPercent(avgConfidence),
      helper: "Confidence tertinggi per hasil",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Laporan Konsultasi
          </h1>
          <p className="text-xs text-slate-500">
            Rekap hasil minat belajar siswa berdasarkan FC, ID3, dan rekomendasi
            akhir.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={exportHref}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </Link>
          <Link
            href="/admin/comparison"
            className="inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          >
            Lihat Komparasi
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat laporan: {error.message}
        </div>
      ) : null}

      <form className="grid shrink-0 gap-2 border-b border-slate-200 bg-white p-2 md:grid-cols-[1fr_1fr_160px_auto]">
        <select
          name="kelas"
          defaultValue={kelas}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua kelas</option>
          {kelasOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          name="tahun_ajaran"
          defaultValue={tahunAjaran}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua tahun ajaran</option>
          {tahunOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua status</option>
          <option value="sepakat">Sepakat</option>
          <option value="review">Perlu review</option>
        </select>
        <SubmitButton
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          pendingText="Memfilter..."
        >
          Filter
        </SubmitButton>
      </form>

      <section className="grid shrink-0 border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-b border-slate-200 bg-white p-3 sm:border-r xl:border-b-0"
          >
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {stat.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid min-h-0 flex-1 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Distribusi Hasil
            </h2>
            <p className="text-xs text-slate-500">
              Ringkasan final recommendation sesuai filter.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {distributionRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada data distribusi.
              </p>
            ) : (
              distributionRows.map(([label, count]) => {
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="text-slate-500">
                        {count} ({formatPercent(percentage)})
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-primary-600"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-col bg-white">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Rekap Detail
            </h2>
            <p className="text-xs text-slate-500">
              Data laporan siap digunakan untuk pembahasan hasil skripsi.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Siswa</th>
                  <th className="px-3 py-2 font-medium">Kelas</th>
                  <th className="px-3 py-2 font-medium">FC</th>
                  <th className="px-3 py-2 font-medium">ID3</th>
                  <th className="px-3 py-2 font-medium">Final</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Tidak ada data sesuai filter.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row) => (
                    <tr
                      key={row.hasil.id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-3 py-1.5">
                        <p className="font-medium text-slate-950">
                          {row.siswa?.nama ?? "-"}
                        </p>
                        <p className="font-mono text-xs text-slate-500">
                          {row.siswa?.nis ?? "-"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                        {row.siswa?.kelas ?? "-"}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">
                        {row.hasil.fc_kesimpulan ?? "-"}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">
                        {row.hasil.id3_kesimpulan ?? "-"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5">
                        <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {row.hasil.final_kesimpulan ?? "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5">
                        {row.hasil.agreement ? (
                          <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                            Sepakat
                          </span>
                        ) : (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                            Review
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-1.5 text-right">
                        <Link
                          href={`/konsultasi/${row.hasil.konsultasi_id}/hasil`}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                          Buka
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={total}
              basePath="/laporan"
              searchParams={{
                kelas,
                tahun_ajaran: tahunAjaran,
                status,
              }}
              variant="flush"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
