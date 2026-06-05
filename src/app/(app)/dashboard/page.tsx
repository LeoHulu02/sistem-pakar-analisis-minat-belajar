import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function getConfidenceTone(confidence: number) {
  if (confidence >= 80) return "bg-accent-500";
  if (confidence >= 50) return "bg-warning-500";
  return "bg-error-500";
}

export default async function DashboardPage() {
  const supabase = createClient();
  const [
    { count: siswaCount, error: siswaError },
    { count: konsultasiCount, error: konsultasiError },
    { count: activeRulesCount, error: rulesError },
    { count: datasetCount, error: datasetError },
    { data: results, error: resultsError },
  ] = await Promise.all([
    supabase.from("siswa").select("id", { count: "exact", head: true }),
    supabase.from("konsultasi").select("id", { count: "exact", head: true }),
    supabase
      .from("rules_fc")
      .select("id", { count: "exact", head: true })
      .eq("aktif", true),
    supabase.from("dataset_id3").select("id", { count: "exact", head: true }),
    supabase
      .from("hasil_diagnosa")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const hasLoadError = Boolean(
    siswaError || konsultasiError || rulesError || datasetError || resultsError,
  );
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
          .select("id, nama, nis, kelas")
          .in("id", siswaIds)
      : { data: [] };

  const konsultasiById = new Map(
    (konsultasiRows ?? []).map((item) => [item.id, item]),
  );
  const siswaById = new Map((siswaRows ?? []).map((item) => [item.id, item]));
  const agreementCount =
    results?.filter((item) => item.agreement === true).length ?? 0;
  const agreementRate =
    results && results.length > 0 ? (agreementCount / results.length) * 100 : 0;
  const finalDistribution = new Map<string, number>();

  for (const item of results ?? []) {
    const label = item.final_kesimpulan ?? "Belum ada";
    finalDistribution.set(label, (finalDistribution.get(label) ?? 0) + 1);
  }

  const distributionRows = Array.from(finalDistribution.entries()).sort(
    (a, b) => b[1] - a[1],
  );
  const stats = [
    {
      label: "Total Siswa",
      value: String(siswaCount ?? 0),
      helper: "Data master siswa",
      badge: "Master",
    },
    {
      label: "Konsultasi",
      value: String(konsultasiCount ?? 0),
      helper: "Sesi konsultasi tersimpan",
      badge: "Flow",
    },
    {
      label: "Rules Aktif",
      value: String(activeRulesCount ?? 0),
      helper: "Basis pengetahuan FC",
      badge: "FC",
    },
    {
      label: "Dataset ID3",
      value: String(datasetCount ?? 0),
      helper: "Data training decision tree",
      badge: "ID3",
    },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Overview Sistem
          </h1>
          <p className="text-xs text-slate-500">
            Monitoring data siswa, knowledge base, dataset ID3, dan hasil
            konsultasi.
          </p>
        </div>
        <Link
          href="/konsultasi/new"
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Konsultasi Baru
        </Link>
      </div>

      {hasLoadError ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Sebagian data dashboard gagal dimuat. Pastikan migration Supabase dan
          RLS sudah aktif.
        </div>
      ) : null}

      <section className="grid shrink-0 border-b border-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-b border-slate-200 bg-white p-3 sm:border-r xl:border-b-0"
          >
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-semibold tracking-tight text-slate-950">
                {stat.value}
              </p>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {stat.badge}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid min-h-0 flex-1 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="flex min-h-0 flex-col border-b border-slate-200 bg-white xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Konsultasi Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Hasil inference terbaru dari FC dan ID3.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Siswa</th>
                  <th className="px-3 py-2 font-medium">Kelas</th>
                  <th className="px-3 py-2 font-medium">Final</th>
                  <th className="px-3 py-2 font-medium">Confidence</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 text-right font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {(results ?? []).length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Belum ada konsultasi.
                    </td>
                  </tr>
                ) : (
                  (results ?? []).map((item) => {
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
                          <p className="font-mono text-xs text-slate-500">
                            {siswa?.nis ?? "-"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                          {siswa?.kelas ?? "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-1.5">
                          <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                            {item.final_kesimpulan ?? "-"}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="min-w-24">
                            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full ${getConfidenceTone(
                                  maxConfidence,
                                )}`}
                                style={{
                                  width: `${Math.min(maxConfidence, 100)}%`,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-slate-500">
                              {formatPercent(maxConfidence)}
                            </p>
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
        </div>

        <div className="min-h-0 overflow-y-auto bg-white p-3">
          <h2 className="text-sm font-semibold text-slate-950">
            Distribusi Minat
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Berdasarkan rekomendasi akhir konsultasi terbaru.
          </p>
          <div className="mt-4 space-y-3">
            {distributionRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                Belum ada distribusi.
              </p>
            ) : (
              distributionRows.map(([label, count]) => {
                const percentage =
                  results && results.length > 0
                    ? (count / results.length) * 100
                    : 0;

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

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                Agreement sample
              </span>
              <span className="font-semibold text-slate-950">
                {formatPercent(agreementRate)}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Dihitung dari {results?.length ?? 0} hasil terbaru yang ditampilkan.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
