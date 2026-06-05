import Link from "next/link";
import { buildModalPath } from "@/lib/utils/href";
import type { Database } from "@/types/database";

type Siswa = Database["public"]["Tables"]["siswa"]["Row"];

type SiswaTableProps = {
  siswa: Siswa[];
  basePath?: string;
  searchParams?: Record<string, string | undefined>;
};

function formatJenisKelamin(value: Siswa["jenis_kelamin"]) {
  if (value === "L") return "Laki-laki";
  if (value === "P") return "Perempuan";
  return "-";
}

export function SiswaTable({
  siswa,
  basePath = "/siswa",
  searchParams,
}: SiswaTableProps) {
  if (siswa.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-950">
          Belum ada data siswa
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tambahkan siswa pertama untuk mulai menjalankan konsultasi.
        </p>
        <Link
          href={buildModalPath(basePath, searchParams, "create")}
          className="mt-4 inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Siswa
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden h-full overflow-auto bg-white md:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2 font-medium">NIS</th>
              <th className="px-3 py-2 font-medium">Nama</th>
              <th className="px-3 py-2 font-medium">Kelas</th>
              <th className="px-3 py-2 font-medium">JK</th>
              <th className="px-3 py-2 font-medium">Tahun Ajaran</th>
              <th className="px-3 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {siswa.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs text-slate-500">
                  {item.nis}
                </td>
                <td className="px-3 py-1.5 font-medium text-slate-950">
                  {item.nama}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">{item.kelas}</td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {formatJenisKelamin(item.jenis_kelamin)}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {item.tahun_ajaran}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={`/siswa/${item.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Detail
                    </Link>
                    <Link
                      href={buildModalPath(basePath, searchParams, "edit", item.id)}
                      className="text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={buildModalPath(basePath, searchParams, "delete", item.id)}
                      className="text-sm font-medium text-error-500 hover:text-red-700"
                    >
                      Hapus
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {siswa.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-950">{item.nama}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  {item.nis}
                </p>
              </div>
              <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                {item.kelas}
              </span>
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-slate-500">Jenis Kelamin</dt>
                <dd className="font-medium text-slate-700">
                  {formatJenisKelamin(item.jenis_kelamin)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Tahun Ajaran</dt>
                <dd className="font-medium text-slate-700">
                  {item.tahun_ajaran}
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
              <Link
                href={`/siswa/${item.id}`}
                className="h-8 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Detail
              </Link>
              <Link
                href={buildModalPath(basePath, searchParams, "edit", item.id)}
                className="h-8 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600"
              >
                Edit
              </Link>
              <Link
                href={buildModalPath(basePath, searchParams, "delete", item.id)}
                className="h-8 rounded-md border border-error-100 px-3 py-1.5 text-sm font-medium text-error-500"
              >
                Hapus
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
