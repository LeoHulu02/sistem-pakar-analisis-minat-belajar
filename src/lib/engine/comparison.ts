import "server-only";

import type {
  ComparisonOutput,
  FCOutput,
  ID3Output,
} from "@/lib/engine/types";

type ComparisonInput = {
  fc: FCOutput;
  id3: ID3Output;
};

export function compareInferenceResults({
  fc,
  id3,
}: ComparisonInput): ComparisonOutput {
  const agreement = Boolean(
    fc.kesimpulan && id3.kesimpulan && fc.kesimpulan === id3.kesimpulan,
  );
  const confidenceDiff = Math.abs(fc.confidence - id3.confidence);

  if (agreement) {
    return {
      agreement: true,
      final_kesimpulan: fc.kesimpulan,
      confidence_diff: confidenceDiff,
      recommendation_note:
        "Kedua metode menghasilkan kesimpulan yang sama. Hasil dapat digunakan sebagai rekomendasi utama.",
    };
  }

  if (!fc.kesimpulan && !id3.kesimpulan) {
    return {
      agreement: false,
      final_kesimpulan: null,
      confidence_diff: confidenceDiff,
      recommendation_note:
        "Belum ada metode yang menghasilkan kesimpulan. Basis pengetahuan dan dataset perlu ditinjau.",
    };
  }

  const finalKesimpulan =
    fc.confidence >= id3.confidence ? fc.kesimpulan : id3.kesimpulan;

  return {
    agreement: false,
    final_kesimpulan: finalKesimpulan,
    confidence_diff: confidenceDiff,
    recommendation_note:
      "Hasil FC dan ID3 berbeda. Gunakan confidence tertinggi sebagai rekomendasi awal dan lakukan verifikasi guru BK.",
  };
}
