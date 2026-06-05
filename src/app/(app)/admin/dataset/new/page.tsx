import { DatasetForm } from "@/components/dataset/DatasetForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewDatasetPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function NewDatasetPage({
  searchParams,
}: NewDatasetPageProps) {
  const supabase = createClient();
  const [{ data: gejala, error }, { data: labelRows }] = await Promise.all([
    supabase.from("gejala").select("*").order("kode", { ascending: true }),
    supabase.from("dataset_id3").select("label").order("label"),
  ]);

  const labels = Array.from(new Set((labelRows ?? []).map((item) => item.label)));

  return (
    <div className="h-full overflow-auto bg-white">
      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat gejala: {error.message}
        </div>
      ) : (
        <DatasetForm
          gejala={gejala ?? []}
          labels={labels}
          error={searchParams?.error}
        />
      )}
    </div>
  );
}
