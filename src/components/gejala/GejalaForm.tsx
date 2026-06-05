import Link from "next/link";
import { createGejalaAction, updateGejalaAction } from "@/actions/gejala";
import { SubmitButton } from "@/components/layout/SubmitButton";
import type { Database } from "@/types/database";

type Gejala = Database["public"]["Tables"]["gejala"]["Row"];

type GejalaFormProps = {
  gejala?: Gejala;
  error?: string;
  cancelHref?: string;
  returnTo?: string;
  variant?: "page" | "modal";
};

export function GejalaForm({
  gejala,
  error,
  cancelHref,
  returnTo,
  variant = "page",
}: GejalaFormProps) {
  const isEdit = Boolean(gejala);
  const isModal = variant === "modal";

  return (
    <form
      action={isEdit ? updateGejalaAction : createGejalaAction}
      className={
        isModal ? "bg-white" : "rounded-lg border border-slate-200 bg-white shadow-sm"
      }
    >
      {gejala ? <input type="hidden" name="id" value={gejala.id} /> : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      {!isModal ? (
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {isEdit ? "Edit Gejala" : "Tambah Gejala"}
          </h1>
          <p className="text-sm text-slate-500">
            Gejala akan digunakan sebagai pertanyaan kuesioner dan premis rule FC.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 p-4">
        {error ? (
          <div className="rounded-md border border-error-100 bg-error-100 px-3 py-2 text-sm text-error-500">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[180px_1fr]">
          <div>
            <label
              htmlFor="kode"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Kode
            </label>
            <input
              id="kode"
              name="kode"
              required
              defaultValue={gejala?.kode}
              className="h-9 w-full rounded-md border border-slate-200 px-3 font-mono text-sm uppercase outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="G001"
            />
          </div>

          <div>
            <label
              htmlFor="kategori"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Kategori
            </label>
            <input
              id="kategori"
              name="kategori"
              defaultValue={gejala?.kategori ?? ""}
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="akademik / sosial / teknologi"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="deskripsi"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Deskripsi Pertanyaan
          </label>
          <textarea
            id="deskripsi"
            name="deskripsi"
            required
            defaultValue={gejala?.deskripsi}
            className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="Siswa menyukai pelajaran matematika dan pemecahan masalah numerik."
          />
        </div>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={gejala?.aktif ?? true}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Aktif dan tampil di kuesioner
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <Link
          href={cancelHref ?? "/admin/gejala"}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <SubmitButton
          className="h-8 rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          pendingText={isEdit ? "Menyimpan..." : "Menambahkan..."}
        >
          {isEdit ? "Simpan Perubahan" : "Tambah Gejala"}
        </SubmitButton>
      </div>
    </form>
  );
}
