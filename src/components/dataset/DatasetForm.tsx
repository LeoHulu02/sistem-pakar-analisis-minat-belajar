import Link from "next/link";
import { createDatasetAction, updateDatasetAction } from "@/actions/dataset";
import { SubmitButton } from "@/components/layout/SubmitButton";
import type { Database, Json } from "@/types/database";

type Dataset = Database["public"]["Tables"]["dataset_id3"]["Row"];
type Gejala = Database["public"]["Tables"]["gejala"]["Row"];

type DatasetFormProps = {
  dataset?: Dataset;
  gejala: Gejala[];
  labels: string[];
  error?: string;
  cancelHref?: string;
  returnTo?: string;
  variant?: "page" | "modal";
};

function getSelectedCodes(fitur?: Json) {
  if (!fitur || typeof fitur !== "object" || Array.isArray(fitur)) {
    return new Set<string>();
  }

  return new Set(
    Object.entries(fitur)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key),
  );
}

export function DatasetForm({
  dataset,
  gejala,
  labels,
  error,
  cancelHref,
  returnTo,
  variant = "page",
}: DatasetFormProps) {
  const isEdit = Boolean(dataset);
  const isModal = variant === "modal";
  const selectedCodes = getSelectedCodes(dataset?.fitur);

  return (
    <form
      action={isEdit ? updateDatasetAction : createDatasetAction}
      className={
        isModal ? "bg-white" : "rounded-lg border border-slate-200 bg-white shadow-sm"
      }
    >
      {dataset ? <input type="hidden" name="id" value={dataset.id} /> : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      {!isModal ? (
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {isEdit ? "Edit Dataset ID3" : "Tambah Dataset ID3"}
          </h1>
          <p className="text-sm text-slate-500">
            Dataset ini digunakan untuk membangun decision tree saat konsultasi.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 p-4">
        {error ? (
          <div className="rounded-md border border-error-100 bg-error-100 px-3 py-2 text-sm text-error-500">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <div>
            <label
              htmlFor="label"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Label Minat
            </label>
            <input
              id="label"
              name="label"
              required
              defaultValue={dataset?.label}
              list="dataset-labels"
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="IPA / IPS / Bahasa / Teknologi"
            />
            <datalist id="dataset-labels">
              {labels.map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
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
              defaultValue={dataset?.tahun_ajaran ?? "2024/2025"}
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="2024/2025"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Fitur Gejala
              </h2>
              <p className="text-xs text-slate-500">
                Centang gejala yang bernilai true untuk data training ini.
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {gejala.length} gejala
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-200">
            {gejala.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Belum ada gejala. Tambahkan gejala terlebih dahulu.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {gejala.map((item) => (
                  <label
                    key={item.id}
                    className="grid cursor-pointer grid-cols-[auto_72px_1fr_auto] items-start gap-3 px-3 py-2 text-sm hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      name="gejala_codes"
                      value={item.kode}
                      defaultChecked={selectedCodes.has(item.kode)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-mono text-xs font-medium text-primary-700">
                      {item.kode}
                    </span>
                    <span className="leading-relaxed text-slate-700">
                      {item.deskripsi}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                      {item.kategori ?? "umum"}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <Link
          href={cancelHref ?? "/admin/dataset"}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <SubmitButton
          className="h-8 rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          pendingText={isEdit ? "Menyimpan..." : "Menambahkan..."}
        >
          {isEdit ? "Simpan Dataset" : "Tambah Dataset"}
        </SubmitButton>
      </div>
    </form>
  );
}
