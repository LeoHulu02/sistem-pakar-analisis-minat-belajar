import Link from "next/link";
import { deleteRuleAction } from "@/actions/rules";
import { CrudModal } from "@/components/layout/CrudModal";
import { DeleteConfirmForm } from "@/components/layout/DeleteConfirmForm";
import { Pagination } from "@/components/layout/Pagination";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { RuleForm } from "@/components/rules/RuleForm";
import { RuleTable, type RuleListItem } from "@/components/rules/RuleTable";
import { createClient } from "@/lib/supabase/server";
import { buildModalPath, buildPath } from "@/lib/utils/href";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type RulesPageProps = {
  searchParams?: {
    q?: string;
    kesimpulan?: string;
    status?: string;
    error?: string;
    page?: string;
    modal?: string;
    id?: string;
  };
};

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const q = searchParams?.q?.trim() ?? "";
  const kesimpulan = searchParams?.kesimpulan?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = createClient();

  let query = supabase
    .from("rules_fc")
    .select("*", { count: "exact" })
    .order("kode_rule", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.or(
      `kode_rule.ilike.%${q}%,nama_rule.ilike.%${q}%,kesimpulan.ilike.%${q}%`,
    );
  }

  if (kesimpulan) {
    query = query.eq("kesimpulan", kesimpulan);
  }

  if (status === "aktif") {
    query = query.eq("aktif", true);
  }

  if (status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const [{ data: rules, error, count }, { data: mappings }, { data: kesimpulanRows }] =
    await Promise.all([
      query,
      supabase.from("rule_gejala").select("rule_id"),
      supabase.from("rules_fc").select("kesimpulan").order("kesimpulan"),
    ]);
  const listSearchParams = {
    q,
    kesimpulan,
    status,
    page: currentPage > 1 ? String(currentPage) : undefined,
  };
  const closeHref = buildPath("/admin/rules", listSearchParams);
  const modal = searchParams?.modal;
  const modalId = searchParams?.id;
  const needsRuleForm = modal === "create" || modal === "edit";
  const [
    { data: gejalaOptions },
    { data: selectedRule },
    { data: selectedRuleGejala },
  ] = await Promise.all([
    needsRuleForm
      ? supabase.from("gejala").select("*").eq("aktif", true).order("kode")
      : Promise.resolve({ data: null }),
    modalId ? supabase.from("rules_fc").select("*").eq("id", modalId).single() : Promise.resolve({ data: null }),
    modalId
      ? supabase.from("rule_gejala").select("gejala_id").eq("rule_id", modalId)
      : Promise.resolve({ data: null }),
  ]);

  const countByRule = new Map<string, number>();
  for (const mapping of mappings ?? []) {
    countByRule.set(mapping.rule_id, (countByRule.get(mapping.rule_id) ?? 0) + 1);
  }

  const ruleItems: RuleListItem[] = (rules ?? []).map((rule) => ({
    ...rule,
    gejala_count: countByRule.get(rule.id) ?? 0,
  }));

  const kesimpulanOptions = Array.from(
    new Set((kesimpulanRows ?? []).map((item) => item.kesimpulan)),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Admin
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Forward Chaining Rules
          </h1>
          <p className="text-xs text-slate-500">
            Kelola knowledge base yang menghubungkan mata pelajaran dengan kesimpulan
            minat belajar.
          </p>
        </div>
        <Link
          href={buildModalPath("/admin/rules", listSearchParams, "create")}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Rule
        </Link>
      </div>

      <form className="grid shrink-0 gap-2 border-b border-slate-200 bg-white p-2 md:grid-cols-[1fr_180px_150px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari kode, nama rule, atau kesimpulan..."
          className="h-8 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        <select
          name="kesimpulan"
          defaultValue={kesimpulan}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua kesimpulan</option>
          {kesimpulanOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua status</option>
          <option value="aktif">Aktif</option>
          <option value="nonaktif">Nonaktif</option>
        </select>
        <SubmitButton
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          pendingText="Memfilter..."
        >
          Filter
        </SubmitButton>
      </form>

      {searchParams?.error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          {searchParams.error}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat rules: {error.message}. Pastikan migration Supabase
          sudah dijalankan.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <RuleTable
              rules={ruleItems}
              basePath="/admin/rules"
              searchParams={listSearchParams}
            />
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={count ?? 0}
              basePath="/admin/rules"
              searchParams={{ q, kesimpulan, status }}
              variant="flush"
            />
          </div>
        </div>
      )}

      {modal === "create" ? (
        <CrudModal
          title="Tambah Rule FC"
          description="Hubungkan beberapa mata pelajaran dengan satu kesimpulan minat belajar."
          closeHref={closeHref}
          size="xl"
        >
          <RuleForm
            variant="modal"
            gejala={gejalaOptions ?? []}
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "edit" && selectedRule ? (
        <CrudModal
          title="Edit Rule FC"
          description="Perbarui rule, bobot, status, dan premis mata pelajaran."
          closeHref={closeHref}
          size="xl"
        >
          <RuleForm
            rule={selectedRule}
            gejala={gejalaOptions ?? []}
            selectedGejalaIds={(selectedRuleGejala ?? []).map(
              (item) => item.gejala_id,
            )}
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "delete" && selectedRule ? (
        <CrudModal
          title="Hapus Rule FC"
          description="Konfirmasi sebelum rule dihapus dari knowledge base."
          closeHref={closeHref}
          size="md"
        >
          <DeleteConfirmForm
            id={selectedRule.id}
            name={`${selectedRule.kode_rule} - ${selectedRule.nama_rule}`}
            entityLabel="rule"
            cancelHref={closeHref}
            returnTo={closeHref}
            action={deleteRuleAction}
          />
        </CrudModal>
      ) : null}
    </div>
  );
}
