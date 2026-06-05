import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export const dynamic = "force-dynamic";

type HasilPageProps = {
  params: {
    id: string;
  };
};

type RuleMatchView = {
  rule_id: string;
  kode_rule: string;
  kesimpulan: string;
  confidence: number;
  matched_gejala_count: number;
  required_gejala_count: number;
};

type ID3PathView = {
  attribute: string;
  value: boolean;
};

function filterRuleMatches(value: Json[]): RuleMatchView[] {
  return value.filter((item): item is RuleMatchView => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    return (
      typeof item.rule_id === "string" &&
      typeof item.kode_rule === "string" &&
      typeof item.kesimpulan === "string" &&
      typeof item.confidence === "number" &&
      typeof item.matched_gejala_count === "number" &&
      typeof item.required_gejala_count === "number"
    );
  });
}

function parseFCRules(value: Json) {
  if (Array.isArray(value)) {
    return {
      matched: filterRuleMatches(value),
      partial: [],
    };
  }

  if (!value || typeof value !== "object") {
    return {
      matched: [],
      partial: [],
    };
  }

  return {
    matched: Array.isArray(value.matched) ? filterRuleMatches(value.matched) : [],
    partial: Array.isArray(value.partial) ? filterRuleMatches(value.partial) : [],
  };
}

function parseID3Path(value: Json): ID3PathView[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is ID3PathView => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return false;
    }

    return typeof item.attribute === "string" && typeof item.value === "boolean";
  });
}

function getConfidenceTone(confidence: number) {
  if (confidence >= 80) return "bg-accent-500";
  if (confidence >= 50) return "bg-warning-500";
  return "bg-error-500";
}

export default async function HasilKonsultasiPage({ params }: HasilPageProps) {
  const supabase = createClient();
  const [
    { data: konsultasi, error: konsultasiError },
    { data: hasil },
    { data: selectedRows },
  ] = await Promise.all([
    supabase.from("konsultasi").select("*").eq("id", params.id).single(),
    supabase
      .from("hasil_diagnosa")
      .select("*")
      .eq("konsultasi_id", params.id)
      .single(),
    supabase
      .from("konsultasi_gejala")
      .select("gejala_id")
      .eq("konsultasi_id", params.id),
  ]);

  if (konsultasiError || !konsultasi || !hasil) {
    notFound();
  }

  const [{ data: siswa }, { data: gejala }] = await Promise.all([
    supabase.from("siswa").select("*").eq("id", konsultasi.siswa_id).single(),
    supabase
      .from("gejala")
      .select("*")
      .in(
        "id",
        (selectedRows ?? []).map((item) => item.gejala_id),
      )
      .order("kode", { ascending: true }),
  ]);

  const fcConfidence = hasil.fc_confidence ?? 0;
  const id3Confidence = hasil.id3_confidence ?? 0;
  const fcRules = parseFCRules(hasil.fc_rules_matched);
  const matchedRules = fcRules.matched;
  const partialRules = fcRules.partial.slice(0, 5);
  const id3Path = parseID3Path(hasil.id3_path);
  const finalKesimpulan =
    hasil.final_kesimpulan ?? hasil.fc_kesimpulan ?? hasil.id3_kesimpulan;
  const comparisonNote = hasil.agreement
    ? "FC dan ID3 sepakat pada kesimpulan yang sama."
    : "FC dan ID3 berbeda atau salah satu metode belum menghasilkan kesimpulan. Gunakan sebagai rekomendasi awal untuk verifikasi guru BK.";

  return (
    <div className="h-full overflow-auto bg-white">
      <div className="flex flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Hasil Konsultasi
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {siswa?.nama ?? "Siswa"}
          </h1>
          <p className="text-xs text-slate-500">
            {siswa ? `${siswa.kelas} - ${siswa.nis}` : "Data siswa"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/konsultasi/new"
            className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Konsultasi Baru
          </Link>
          {siswa ? (
            <Link
              href={`/siswa/${siswa.id}`}
              className="inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
            >
              Detail Siswa
            </Link>
          ) : null}
        </div>
      </div>

      <section className="border-b border-slate-200 bg-white p-3">
        <div className="grid gap-4 md:grid-cols-[1fr_240px] md:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Rekomendasi Akhir
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {finalKesimpulan ?? "Belum ada kesimpulan"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">{comparisonNote}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                FC: {hasil.fc_kesimpulan ?? "-"}
              </span>
              <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
                ID3: {hasil.id3_kesimpulan ?? "-"}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {hasil.agreement ? "Metode sepakat" : "Perlu review"}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-end justify-between">
              <p className="text-sm font-medium text-slate-700">
                Confidence Final
              </p>
              <p className="text-2xl font-semibold text-slate-950">
                {Math.max(fcConfidence, id3Confidence).toFixed(2)}%
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full ${getConfidenceTone(
                  Math.max(fcConfidence, id3Confidence),
                )}`}
                style={{
                  width: `${Math.min(Math.max(fcConfidence, id3Confidence), 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid border-b border-slate-200 md:grid-cols-2">
        <div className="border-b border-slate-200 bg-white p-3 md:border-b-0 md:border-r">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Forward Chaining
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {hasil.fc_kesimpulan ?? "-"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {matchedRules.length} rule terpenuhi.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full ${getConfidenceTone(fcConfidence)}`}
              style={{ width: `${Math.min(fcConfidence, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-medium text-slate-700">
            {fcConfidence.toFixed(2)}%
          </p>
        </div>

        <div className="bg-white p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            ID3 Decision Tree
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {hasil.id3_kesimpulan ?? "-"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {id3Path.length} node keputusan dilalui.
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full ${getConfidenceTone(id3Confidence)}`}
              style={{ width: `${Math.min(id3Confidence, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-right text-sm font-medium text-slate-700">
            {id3Confidence.toFixed(2)}%
          </p>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1fr_340px]">
        <div className="border-b border-slate-200 bg-white lg:border-b-0 lg:border-r">
          <div className="border-b border-slate-200 px-3 py-2">
            <h2 className="text-sm font-semibold text-slate-950">
              Rule yang Terpenuhi
            </h2>
            <p className="text-xs text-slate-500">
              Daftar rule FC yang semua premis gejalanya cocok.
            </p>
          </div>

          {matchedRules.length === 0 ? (
            <div className="space-y-4 p-4">
              <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Tidak ada rule yang match penuh.
              </div>

              {partialRules.length > 0 ? (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Rule Hampir Cocok
                  </h3>
                  <div className="mt-2 overflow-x-auto rounded-md border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-3 py-2 font-medium">Rule</th>
                          <th className="px-3 py-2 font-medium">Kesimpulan</th>
                          <th className="px-3 py-2 font-medium">Gejala Cocok</th>
                          <th className="px-3 py-2 font-medium">Skor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {partialRules.map((rule) => (
                          <tr
                            key={rule.rule_id}
                            className="border-t border-slate-100 hover:bg-slate-50"
                          >
                            <td className="px-3 py-2.5 font-mono text-xs font-medium text-primary-700">
                              {rule.kode_rule}
                            </td>
                            <td className="px-3 py-2.5">
                              <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                                {rule.kesimpulan}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {rule.matched_gejala_count}/
                              {rule.required_gejala_count}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-slate-950">
                              {rule.confidence.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">
                  Belum ada rule yang gejalanya cocok sebagian.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">Rule</th>
                    <th className="px-4 py-2 font-medium">Kesimpulan</th>
                    <th className="px-4 py-2 font-medium">Gejala Match</th>
                    <th className="px-4 py-2 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {matchedRules.map((rule) => (
                    <tr
                      key={rule.rule_id}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs font-medium text-primary-700">
                        {rule.kode_rule}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                          {rule.kesimpulan}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {rule.matched_gejala_count}/
                        {rule.required_gejala_count}
                      </td>
                      <td className="px-4 py-2.5 font-medium text-slate-950">
                        {rule.confidence.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside>
          <div className="border-b border-slate-200 bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Path ID3
            </h2>
            {id3Path.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                Tidak ada path ID3. Dataset mungkin belum tersedia.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {id3Path.map((step, index) => (
                  <div
                    key={`${step.attribute}-${index}`}
                    className="rounded-md border border-slate-200 px-3 py-2 text-sm"
                  >
                    <p className="font-mono text-xs text-primary-700">
                      {step.attribute}
                    </p>
                    <p className="mt-1 text-slate-600">
                      Nilai: {step.value ? "Ya" : "Tidak"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white p-3">
            <h2 className="text-sm font-semibold text-slate-950">
              Gejala Dipilih
            </h2>
            <div className="mt-3 space-y-2">
              {(gejala ?? []).map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-slate-200 px-3 py-2"
                >
                  <p className="font-mono text-xs font-medium text-primary-700">
                    {item.kode}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.deskripsi}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
