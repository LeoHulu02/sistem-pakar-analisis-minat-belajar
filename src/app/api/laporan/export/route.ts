import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvValue(value: string | number | boolean | null | undefined) {
  const raw = value == null ? "" : String(value);
  return `"${raw.replaceAll('"', '""')}"`;
}

function formatPercent(value: number | null) {
  return value == null ? "" : value.toFixed(2);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const kelas = searchParams.get("kelas")?.trim() ?? "";
  const tahunAjaran = searchParams.get("tahun_ajaran")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const supabase = createClient();

  const { data: results, error } = await supabase
    .from("hasil_diagnosa")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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

  const konsultasiById = new Map(
    (konsultasiRows ?? []).map((item) => [item.id, item]),
  );
  const siswaById = new Map((siswaRows ?? []).map((item) => [item.id, item]));
  const rows = (results ?? [])
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

  const header = [
    "nis",
    "nama",
    "kelas",
    "tahun_ajaran",
    "tanggal_konsultasi",
    "fc_kesimpulan",
    "fc_confidence",
    "id3_kesimpulan",
    "id3_confidence",
    "agreement",
    "final_kesimpulan",
  ];
  const body = rows.map((row) =>
    [
      row.siswa?.nis,
      row.siswa?.nama,
      row.siswa?.kelas,
      row.siswa?.tahun_ajaran,
      row.konsultasi?.created_at,
      row.hasil.fc_kesimpulan,
      formatPercent(row.hasil.fc_confidence),
      row.hasil.id3_kesimpulan,
      formatPercent(row.hasil.id3_confidence),
      row.hasil.agreement ? "sepakat" : "review",
      row.hasil.final_kesimpulan,
    ]
      .map(csvValue)
      .join(","),
  );
  const csv = [header.join(","), ...body].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="laporan-konsultasi.csv"`,
    },
  });
}
