import { notFound } from "next/navigation";
import { SiswaForm } from "@/components/siswa/SiswaForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditSiswaPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function EditSiswaPage({
  params,
  searchParams,
}: EditSiswaPageProps) {
  const supabase = createClient();
  const { data: siswa, error } = await supabase
    .from("siswa")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !siswa) {
    notFound();
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <SiswaForm siswa={siswa} error={searchParams?.error} />
    </div>
  );
}
