import Link from "next/link";
import { deleteSiswaAction } from "@/actions/siswa";
import { DeleteConfirmForm } from "@/components/layout/DeleteConfirmForm";
import { CrudModal } from "@/components/layout/CrudModal";
import { Pagination } from "@/components/layout/Pagination";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { SiswaForm } from "@/components/siswa/SiswaForm";
import { SiswaTable } from "@/components/siswa/SiswaTable";
import { createClient } from "@/lib/supabase/server";
import { buildModalPath, buildPath } from "@/lib/utils/href";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 20;

type SiswaPageProps = {
  searchParams?: {
    q?: string;
    kelas?: string;
    page?: string;
    modal?: string;
    id?: string;
    error?: string;
  };
};

export default async function SiswaPage({ searchParams }: SiswaPageProps) {
  const q = searchParams?.q?.trim() ?? "";
  const kelas = searchParams?.kelas?.trim() ?? "";
  const currentPage = Math.max(Number(searchParams?.page ?? "1") || 1, 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const supabase = createClient();

  let query = supabase
    .from("siswa")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(`nama.ilike.%${q}%,nis.ilike.%${q}%`);
  }

  if (kelas) {
    query = query.eq("kelas", kelas);
  }

  const [{ data: siswa, error, count }, { data: kelasRows }] = await Promise.all([
    query,
    supabase.from("siswa").select("kelas").order("kelas"),
  ]);
  const listSearchParams = {
    q,
    kelas,
    page: currentPage > 1 ? String(currentPage) : undefined,
  };
  const closeHref = buildPath("/siswa", listSearchParams);
  const modal = searchParams?.modal;
  const modalId = searchParams?.id;
  const { data: selectedSiswa } = modalId
    ? await supabase.from("siswa").select("*").eq("id", modalId).single()
    : { data: null };

  const kelasOptions = Array.from(
    new Set((kelasRows ?? []).map((item) => item.kelas)),
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 flex-col justify-between gap-2 border-b border-slate-200 bg-white px-3 py-2 md:flex-row md:items-center">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            Data Siswa
          </h1>
          <p className="text-xs text-slate-500">
            Kelola data master siswa untuk konsultasi minat belajar.
          </p>
        </div>
        <Link
          href={buildModalPath("/siswa", listSearchParams, "create")}
          className="inline-flex h-8 items-center justify-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Siswa
        </Link>
      </div>

      <form className="grid shrink-0 gap-2 border-b border-slate-200 bg-white p-2 md:grid-cols-[1fr_180px_auto]">
        <input
          name="q"
          defaultValue={q}
          placeholder="Cari nama atau NIS..."
          className="h-8 rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        />
        <select
          name="kelas"
          defaultValue={kelas}
          className="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Semua kelas</option>
          {kelasOptions.map((option) => (
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

      {error ? (
        <div className="rounded-lg border border-error-100 bg-error-100 p-4 text-sm text-error-500">
          Gagal memuat data siswa: {error.message}. Pastikan migration Supabase
          sudah dijalankan.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-hidden">
            <SiswaTable
              siswa={siswa ?? []}
              basePath="/siswa"
              searchParams={listSearchParams}
            />
          </div>
          <div className="shrink-0">
            <Pagination
              currentPage={currentPage}
              pageSize={PAGE_SIZE}
              totalItems={count ?? 0}
              basePath="/siswa"
              searchParams={{ q, kelas }}
              variant="flush"
            />
          </div>
        </div>
      )}

      {modal === "create" ? (
        <CrudModal
          title="Tambah Siswa"
          description="Isi data master siswa tanpa meninggalkan halaman daftar."
          closeHref={closeHref}
        >
          <SiswaForm
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "edit" && selectedSiswa ? (
        <CrudModal
          title="Edit Siswa"
          description="Perbarui identitas siswa, kelas, dan tahun ajaran."
          closeHref={closeHref}
        >
          <SiswaForm
            siswa={selectedSiswa}
            variant="modal"
            cancelHref={closeHref}
            returnTo={closeHref}
            error={searchParams?.error}
          />
        </CrudModal>
      ) : null}

      {modal === "delete" && selectedSiswa ? (
        <CrudModal
          title="Hapus Siswa"
          description="Konfirmasi sebelum data siswa dihapus."
          closeHref={closeHref}
          size="md"
        >
          <DeleteConfirmForm
            id={selectedSiswa.id}
            name={selectedSiswa.nama}
            entityLabel="siswa"
            cancelHref={closeHref}
            returnTo={closeHref}
            action={deleteSiswaAction}
          />
        </CrudModal>
      ) : null}
    </div>
  );
}
