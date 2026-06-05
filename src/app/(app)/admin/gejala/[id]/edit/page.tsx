import { notFound } from "next/navigation";
import { GejalaForm } from "@/components/gejala/GejalaForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditGejalaPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function EditGejalaPage({
  params,
  searchParams,
}: EditGejalaPageProps) {
  const supabase = createClient();
  const { data: gejala, error } = await supabase
    .from("gejala")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !gejala) {
    notFound();
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <GejalaForm gejala={gejala} error={searchParams?.error} />
    </div>
  );
}
