import Link from "next/link";
import { createSiswaAction, updateSiswaAction } from "@/actions/siswa";
import { AlertBanner } from "@/components/layout/AlertBanner";
import { SubmitButton } from "@/components/layout/SubmitButton";
import type { Database } from "@/types/database";

type Siswa = Database["public"]["Tables"]["siswa"]["Row"];

type SiswaFormProps = {
  siswa?: Siswa;
  error?: string;
  cancelHref?: string;
  returnTo?: string;
  variant?: "page" | "modal";
};

export function SiswaForm({
  siswa,
  error,
  cancelHref,
  returnTo,
  variant = "page",
}: SiswaFormProps) {
  const isEdit = Boolean(siswa);
  const isModal = variant === "modal";

  return (
    <form
      action={isEdit ? updateSiswaAction : createSiswaAction}
      className={
        isModal ? "bg-white" : "rounded-lg border border-slate-200 bg-white shadow-sm"
      }
    >
      {siswa ? <input type="hidden" name="id" value={siswa.id} /> : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      {!isModal ? (
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {isEdit ? "Edit Siswa" : "Tambah Siswa"}
          </h1>
          <p className="text-sm text-slate-500">
            Data ini menjadi basis untuk sesi konsultasi dan hasil diagnosa.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 p-4 md:grid-cols-2">
        {error ? (
          <div className="md:col-span-2">
            <AlertBanner
              title={isEdit ? "Gagal Menyimpan Perubahan" : "Gagal Menambahkan Siswa"}
              message={error}
            />
          </div>
        ) : null}

        <div>
          <label
            htmlFor="nis"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            NIS
          </label>
          <input
            id="nis"
            name="nis"
            required
            defaultValue={siswa?.nis}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="1024001"
          />
        </div>

        <div>
          <label
            htmlFor="nama"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Nama Lengkap
          </label>
          <input
            id="nama"
            name="nama"
            required
            defaultValue={siswa?.nama}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="Nama siswa"
          />
        </div>

        <div>
          <label
            htmlFor="kelas"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Kelas
          </label>
          <input
            id="kelas"
            name="kelas"
            required
            defaultValue={siswa?.kelas}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="X-A"
          />
        </div>

        <div>
          <label
            htmlFor="tahun_ajaran"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Tahun Ajaran
          </label>
          <input
            id="tahun_ajaran"
            name="tahun_ajaran"
            required
            defaultValue={siswa?.tahun_ajaran ?? "2024/2025"}
            className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            placeholder="2024/2025"
          />
        </div>

        <div>
          <label
            htmlFor="jenis_kelamin"
            className="mb-1 block text-xs font-medium text-slate-700"
          >
            Jenis Kelamin
          </label>
          <select
            id="jenis_kelamin"
            name="jenis_kelamin"
            defaultValue={siswa?.jenis_kelamin ?? ""}
            className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
          >
            <option value="">Tidak diisi</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <Link
          href={cancelHref ?? (siswa ? `/siswa/${siswa.id}` : "/siswa")}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <SubmitButton
          className="h-8 rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          pendingText={isEdit ? "Menyimpan..." : "Menambahkan..."}
        >
          {isEdit ? "Simpan Perubahan" : "Tambah Siswa"}
        </SubmitButton>
      </div>
    </form>
  );
}
