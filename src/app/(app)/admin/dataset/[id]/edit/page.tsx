import { notFound } from "next/navigation";
import { DatasetForm } from "@/components/dataset/DatasetForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditDatasetPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function EditDatasetPage({
  params,
  searchParams,
}: EditDatasetPageProps) {
  const supabase = createClient();
  const [
    { data: dataset, error },
    { data: gejala },
    { data: labelRows },
  ] = await Promise.all([
    supabase.from("dataset_id3").select("*").eq("id", params.id).single(),
    supabase.from("gejala").select("*").order("kode", { ascending: true }),
    supabase.from("dataset_id3").select("label").order("label"),
  ]);

  if (error || !dataset) {
    notFound();
  }

  const labels = Array.from(new Set((labelRows ?? []).map((item) => item.label)));

  return (
    <div className="h-full overflow-auto bg-white">
      <DatasetForm
        dataset={dataset}
        gejala={gejala ?? []}
        labels={labels}
        error={searchParams?.error}
      />
    </div>
  );
}
