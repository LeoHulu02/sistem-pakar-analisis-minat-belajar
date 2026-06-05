import Link from "next/link";
import { deleteGejalaAction } from "@/actions/gejala";
import { GejalaTable } from "@/components/gejala/GejalaTable";
import { CrudModal } from "@/components/layout/CrudModal";
import { DeleteConfirmForm } from "@/components/layout/DeleteConfirmForm";
import { Pagination } from "@/components/layout/Pagination";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { GejalaForm } from "@/components/gejala/GejalaForm";
import { createClient } from "@/lib/supabase/server";
import { buildModalPath, buildPath } from "@/lib/utils/href";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type GejalaPageProps = {
  searchParams?: {
    q?: string;
    kategori?: string;
    status?: string;
    error?: string;
    page?: string;
    modal?: string;
    id?: string;
  };
};

export default async function GejalaPage({ searchParams }: GejalaPageProps) {
  const q = searchParams?.q?.trim() ?? "";
  const kategori = searchParams?.kategori?.trim() ?? "";
  const status = searchParams?.status?.trim() ?? "";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = createClient();

  let query = supabase
    .from("gejala")
    .select("*", { count: "exact" })
    .order("kode", { ascending: true })
    .range(from, to);

  if (q) {
    query = query.or(`kode.ilike.%${q}%,deskripsi.ilike.%${q}%`);
  }

  if (kategori) {
    query = query.eq("kategori", kategori);
  }

  if (status === "aktif") {
    query = query.eq("aktif", true);
  }

  if (status === "nonaktif") {
    query = query.eq("aktif", false);
  }

  const [{ data: gejala, error, count }, { data: kategoriRows }] = await Promise.all([
    query,
    supabase.from("gejala").select("kategori").order("kategori"),
  ]);
  const listSearchParams = {
    q,
    kategori,
    status,
    page: currentPage > 1 ? String(currentPage) : undefined,
  };
  const closeHref = buildPath("/admin/gejala", listSearchParams);
  const modal = searchParams?.modal;
  const modalId = searchParams?.id;
  const { data: selectedGejala } = modalId
    ? await supabase.from("gejala").select("*").eq("id", modalId).single()
    : { data: null };

  const kategoriOptions = Array.from(
    new Set(
      (kategoriRows ?? [])
        .map((item) => item.kategori)
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
            Master Gejala
          </h1>
          <p className="text-xs text-slate-500">
            Kelola daftar pertanyaan yang digunakan untuk kuesioner dan premis
            rule Forward Chaining.
          </p>
        </div>
        <Link
          href={buildModalPath("/admin/gejala", listSearchParams, "create")}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Gejala
        </Link>
      </div>

      <form className="grid shrink-0 gap-2 border-b border-slate-200 bg-white p-2 md:grid-cols-[1fr_180px_150px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari kode atau deskripsi..."
          className="h-8 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        <select
          name="kategori"
          defaultValue={kategori}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua kategori</option>
          {kategoriOptions.map((option) => (
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
          Gagal memuat gejala: {error.message}. Pastikan migration Supabase
          sudah dijalankan.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <GejalaTable
              gejala={gejala ?? []}
              basePath="/admin/gejala"
              searchParams={listSearchParams}
            />
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={count ?? 0}
              basePath="/admin/gejala"
              searchParams={{ q, kategori, status }}
            variant="flush"
            />
          </div>
        </div>
      )}

      {modal === "create" ? (
        <CrudModal
          title="Tambah Gejala"
          description="Tambahkan pertanyaan kuesioner dan premis rule FC."
          closeHref={closeHref}
        >
          <GejalaForm
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "edit" && selectedGejala ? (
        <CrudModal
          title="Edit Gejala"
          description="Perbarui kode, kategori, deskripsi, dan status gejala."
          closeHref={closeHref}
        >
          <GejalaForm
            gejala={selectedGejala}
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "delete" && selectedGejala ? (
        <CrudModal
          title="Hapus Gejala"
          description="Konfirmasi sebelum gejala dihapus dari knowledge base."
          closeHref={closeHref}
          size="md"
        >
          <DeleteConfirmForm
            id={selectedGejala.id}
            name={`${selectedGejala.kode} - ${selectedGejala.deskripsi}`}
            entityLabel="gejala"
            cancelHref={closeHref}
            returnTo={closeHref}
            action={deleteGejalaAction}
          />
        </CrudModal>
      ) : null}
    </div>
  );
}
