import Link from "next/link";
import { Pagination } from "@/components/layout/Pagination";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

function average(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function getConfidenceTone(confidence: number) {
  if (confidence >= 80) return "bg-accent-500";
  if (confidence >= 50) return "bg-warning-500";
  return "bg-error-500";
}

type ComparisonPageProps = {
  searchParams?: {
    page?: string;
  };
};

export default async function ComparisonPage({ searchParams }: ComparisonPageProps) {
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const supabase = createClient();
  const { data: results, error } = await supabase
    .from("hasil_diagnosa")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const konsultasiIds = (results ?? []).map((item) => item.konsultasi_id);
  const { data: konsultasiRows } =
    konsultasiIds.length > 0
      ? await supabase
          .from("konsultasi")
          .select("id, siswa_id, created_at")
          .in("id", konsultasiIds)
      : { data: [] };

  const siswaIds = Array.from(
    new Set((konsultasiRows ?? []).map((item) => item.siswa_id)),
  );
  const { data: siswaRows } =
    siswaIds.length > 0
      ? await supabase
          .from("siswa")
          .select("id, nama, nis, kelas")
          .in("id", siswaIds)
      : { data: [] };

  const konsultasiById = new Map(
    (konsultasiRows ?? []).map((item) => [item.id, item]),
  );
  const siswaById = new Map((siswaRows ?? []).map((item) => [item.id, item]));
  const total = results?.length ?? 0;
  const agreementCount =
    results?.filter((item) => item.agreement === true).length ?? 0;
  const mismatchCount =
    results?.filter((item) => item.agreement === false).length ?? 0;
  const agreementRate = total > 0 ? (agreementCount / total) * 100 : 0;
  const avgFcConfidence = average(
    (results ?? [])
      .map((item) => item.fc_confidence)
      .filter((value): value is number => typeof value === "number"),
  );
  const avgId3Confidence = average(
    (results ?? [])
      .map((item) => item.id3_confidence)
      .filter((value): value is number => typeof value === "number"),
  );
  const finalDistribution = new Map<string, number>();

  for (const item of results ?? []) {
    const key = item.final_kesimpulan ?? "Belum ada";
    finalDistribution.set(key, (finalDistribution.get(key) ?? 0) + 1);
  }

  const distributionRows = Array.from(finalDistribution.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const paginatedResults = (results ?? []).slice(from, to);

  const stats = [
    {
      label: "Total Hasil",
      value: String(total),
      helper: "Konsultasi dengan hasil tersimpan",
    },
    {
      label: "Agreement Rate",
      value: formatPercent(agreementRate),
      helper: `${agreementCount} sepakat, ${mismatchCount} perlu review`,
    },
    {
      label: "Avg FC Confidence",
      value: formatPercent(avgFcConfidence),
      helper: "Rata-rata confidence Forward Chaining",
    },
    {
      label: "Avg ID3 Confidence",
      value: formatPercent(avgId3Confidence),
      helper: "Rata-rata confidence Decision Tree",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Admin
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Komparasi FC vs ID3
          </h1>
          <p className="text-xs text-slate-500">
            Pantau agreement, confidence, dan rekomendasi akhir dari semua
            konsultasi.
          </p>
        </div>
        <Link
          href="/konsultasi/new"
          className="inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Konsultasi Baru
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat comparison dashboard: {error.message}
        </div>
      ) : null}

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

      <section className="grid min-h-0 flex-1 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Distribusi Rekomendasi Akhir
            </h2>
            <p className="text-xs text-slate-500">
              Jumlah final result berdasarkan `hasil_diagnosa.final_kesimpulan`.
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            {distributionRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada hasil konsultasi.
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
              Hasil Konsultasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Perbandingan FC, ID3, dan final recommendation.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Siswa</th>
                  <th className="px-3 py-2 font-medium">FC</th>
                  <th className="px-3 py-2 font-medium">ID3</th>
                  <th className="px-3 py-2 font-medium">Final</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {paginatedResults.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada hasil konsultasi.
                    </td>
                  </tr>
                ) : (
                  paginatedResults.map((item) => {
                    const konsultasi = konsultasiById.get(item.konsultasi_id);
                    const siswa = konsultasi
                      ? siswaById.get(konsultasi.siswa_id)
                      : null;
                    const maxConfidence = Math.max(
                      item.fc_confidence ?? 0,
                      item.id3_confidence ?? 0,
                    );

                    return (
                      <tr
                        key={item.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-3 py-1.5">
                          <p className="font-medium text-slate-950">
                            {siswa?.nama ?? "-"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {siswa ? `${siswa.kelas} - ${siswa.nis}` : "-"}
                          </p>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          <p>{item.fc_kesimpulan ?? "-"}</p>
                          <p className="text-xs text-slate-500">
                            {formatPercent(item.fc_confidence ?? 0)}
                          </p>
                        </td>
                        <td className="px-3 py-1.5 text-slate-600">
                          <p>{item.id3_kesimpulan ?? "-"}</p>
                          <p className="text-xs text-slate-500">
                            {formatPercent(item.id3_confidence ?? 0)}
                          </p>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="min-w-28">
                            <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                              {item.final_kesimpulan ?? "-"}
                            </span>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${getConfidenceTone(
                                  maxConfidence,
                                )}`}
                                style={{
                                  width: `${Math.min(maxConfidence, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          {item.agreement ? (
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
                            href={`/konsultasi/${item.konsultasi_id}/hasil`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            Buka
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={total}
              basePath="/admin/comparison"
              searchParams={{}}
              variant="flush"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
