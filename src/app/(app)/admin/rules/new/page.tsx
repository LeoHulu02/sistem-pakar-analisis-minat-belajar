import { RuleForm } from "@/components/rules/RuleForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewRulePageProps = {
  searchParams?: {
    error?: string;
  };
};

export default async function NewRulePage({ searchParams }: NewRulePageProps) {
  const supabase = createClient();
  const { data: gejala, error } = await supabase
    .from("gejala")
    .select("*")
    .order("kode", { ascending: true });

  return (
    <div className="h-full overflow-auto bg-white">
      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat gejala: {error.message}
        </div>
      ) : (
        <RuleForm gejala={gejala ?? []} error={searchParams?.error} />
      )}
    </div>
  );
}
