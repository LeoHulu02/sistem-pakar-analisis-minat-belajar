import Link from "next/link";
import { deleteDatasetAction } from "@/actions/dataset";
import { DatasetTable } from "@/components/dataset/DatasetTable";
import { DatasetForm } from "@/components/dataset/DatasetForm";
import { CrudModal } from "@/components/layout/CrudModal";
import { DeleteConfirmForm } from "@/components/layout/DeleteConfirmForm";
import { Pagination } from "@/components/layout/Pagination";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { createClient } from "@/lib/supabase/server";
import { buildModalPath, buildPath } from "@/lib/utils/href";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type DatasetPageProps = {
  searchParams?: {
    label?: string;
    tahun_ajaran?: string;
    error?: string;
    page?: string;
    modal?: string;
    id?: string;
  };
};

export default async function DatasetPage({ searchParams }: DatasetPageProps) {
  const label = searchParams?.label?.trim() ?? "";
  const tahunAjaran = searchParams?.tahun_ajaran?.trim() ?? "";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = createClient();

  let query = supabase
    .from("dataset_id3")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (label) {
    query = query.eq("label", label);
  }

  if (tahunAjaran) {
    query = query.eq("tahun_ajaran", tahunAjaran);
  }

  const [
    { data: dataset, error, count },
    { data: labelRows },
    { data: tahunRows },
    { data: gejalaRows },
  ] = await Promise.all([
    query,
    supabase.from("dataset_id3").select("label").order("label"),
    supabase.from("dataset_id3").select("tahun_ajaran").order("tahun_ajaran"),
    supabase.from("gejala").select("*").eq("aktif", true).order("kode"),
  ]);
  const listSearchParams = {
    label,
    tahun_ajaran: tahunAjaran,
    page: currentPage > 1 ? String(currentPage) : undefined,
  };
  const closeHref = buildPath("/admin/dataset", listSearchParams);
  const modal = searchParams?.modal;
  const modalId = searchParams?.id;
  const { data: selectedDataset } = modalId
    ? await supabase.from("dataset_id3").select("*").eq("id", modalId).single()
    : { data: null };

  const labelOptions = Array.from(
    new Set((labelRows ?? []).map((item) => item.label)),
  );
  const tahunOptions = Array.from(
    new Set(
      (tahunRows ?? [])
        .map((item) => item.tahun_ajaran)
        .filter((item): item is string => Boolean(item)),
    ),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Admin
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Dataset ID3
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data training untuk membangun decision tree minat belajar.
          </p>
        </div>
        <Link
          href={buildModalPath("/admin/dataset", listSearchParams, "create")}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Dataset
        </Link>
      </div>

      <form className="grid shrink-0 gap-2 border-b border-slate-200 bg-white p-2 md:grid-cols-[1fr_180px_auto]">
        <select
          name="label"
          defaultValue={label}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua label</option>
          {labelOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <select
          name="tahun_ajaran"
          defaultValue={tahunAjaran}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua tahun</option>
          {tahunOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
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
          Gagal memuat dataset: {error.message}. Pastikan migration Supabase
          sudah dijalankan.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <DatasetTable
              dataset={dataset ?? []}
              basePath="/admin/dataset"
              searchParams={listSearchParams}
            />
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={count ?? 0}
              basePath="/admin/dataset"
              searchParams={{ label, tahun_ajaran: tahunAjaran }}
              variant="flush"
            />
          </div>
        </div>
      )}

      {modal === "create" ? (
        <CrudModal
          title="Tambah Dataset ID3"
          description="Tambahkan data training untuk decision tree."
          closeHref={closeHref}
          size="xl"
        >
          <DatasetForm
            variant="modal"
            gejala={gejalaRows ?? []}
            labels={labelOptions}
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "edit" && selectedDataset ? (
        <CrudModal
          title="Edit Dataset ID3"
          description="Perbarui label, tahun ajaran, dan fitur gejala."
          closeHref={closeHref}
          size="xl"
        >
          <DatasetForm
            dataset={selectedDataset}
            gejala={gejalaRows ?? []}
            labels={labelOptions}
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "delete" && selectedDataset ? (
        <CrudModal
          title="Hapus Dataset ID3"
          description="Konfirmasi sebelum data training dihapus."
          closeHref={closeHref}
          size="md"
        >
          <DeleteConfirmForm
            id={selectedDataset.id}
            name={selectedDataset.label}
            entityLabel="dataset"
            cancelHref={closeHref}
            returnTo={closeHref}
            action={deleteDatasetAction}
          />
        </CrudModal>
      ) : null}
    </div>
  );
}
