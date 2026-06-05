import { notFound } from "next/navigation";
import { RuleForm } from "@/components/rules/RuleForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type EditRulePageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    error?: string;
  };
};

export default async function EditRulePage({
  params,
  searchParams,
}: EditRulePageProps) {
  const supabase = createClient();
  const [{ data: rule, error }, { data: gejala }, { data: selectedRows }] =
    await Promise.all([
      supabase.from("rules_fc").select("*").eq("id", params.id).single(),
      supabase.from("gejala").select("*").order("kode", { ascending: true }),
      supabase
        .from("rule_gejala")
        .select("gejala_id")
        .eq("rule_id", params.id),
    ]);

  if (error || !rule) {
    notFound();
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <RuleForm
        rule={rule}
        gejala={gejala ?? []}
        selectedGejalaIds={(selectedRows ?? []).map((item) => item.gejala_id)}
        error={searchParams?.error}
      />
    </div>
  );
}
