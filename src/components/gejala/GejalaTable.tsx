import Link from "next/link";
import { toggleGejalaAction } from "@/actions/gejala";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { buildModalPath } from "@/lib/utils/href";
import type { Database } from "@/types/database";

type Gejala = Database["public"]["Tables"]["gejala"]["Row"];

type GejalaTableProps = {
  gejala: Gejala[];
  basePath?: string;
  searchParams?: Record<string, string | undefined>;
};

function StatusBadge({ aktif }: { aktif: boolean }) {
  return aktif ? (
    <span className="rounded bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-600">
      Aktif
    </span>
  ) : (
    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
      Nonaktif
    </span>
  );
}

export function GejalaTable({
  gejala,
  basePath = "/admin/gejala",
  searchParams,
}: GejalaTableProps) {
  if (gejala.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-950">
          Belum ada mata pelajaran
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tambahkan mata pelajaran pertama untuk menyusun kuesioner dan rule FC.
        </p>
        <Link
          href={buildModalPath(basePath, searchParams, "create")}
          className="mt-4 inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Mata Pelajaran
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
              <th className="px-3 py-2 font-medium">Kode</th>
              <th className="px-3 py-2 font-medium">Deskripsi</th>
              <th className="px-3 py-2 font-medium">Kategori</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {gejala.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-1.5 font-mono text-xs font-medium text-primary-700">
                  {item.kode}
                </td>
                <td className="max-w-2xl px-3 py-1.5 leading-snug text-slate-700">
                  {item.deskripsi}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {item.kategori ?? "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5">
                  <StatusBadge aktif={item.aktif} />
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={buildModalPath(basePath, searchParams, "edit", item.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      Edit
                    </Link>
                    <form action={toggleGejalaAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input
                        type="hidden"
                        name="aktif"
                        value={String(!item.aktif)}
                      />
                      <SubmitButton
                        className="text-sm font-medium text-slate-500 hover:text-slate-900"
                        pendingText="Memproses..."
                      >
                        {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                      </SubmitButton>
                    </form>
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
        {gejala.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-semibold text-primary-700">
                  {item.kode}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-950">
                  {item.kategori ?? "Tanpa kategori"}
                </p>
              </div>
              <StatusBadge aktif={item.aktif} />
            </div>

            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {item.deskripsi}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <Link
                href={buildModalPath(basePath, searchParams, "edit", item.id)}
                className="h-8 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
              >
                Edit
              </Link>
              <form action={toggleGejalaAction}>
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="aktif" value={String(!item.aktif)} />
                <SubmitButton
                  className="h-8 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600"
                  pendingText="Memproses..."
                >
                  {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                </SubmitButton>
              </form>
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
