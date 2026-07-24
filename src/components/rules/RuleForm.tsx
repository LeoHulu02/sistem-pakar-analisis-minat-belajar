import Link from "next/link";
import { createRuleAction, updateRuleAction } from "@/actions/rules";
import { AlertBanner } from "@/components/layout/AlertBanner";
import { SubmitButton } from "@/components/layout/SubmitButton";
import type { Database } from "@/types/database";

type Rule = Database["public"]["Tables"]["rules_fc"]["Row"];
type Gejala = Database["public"]["Tables"]["gejala"]["Row"];

type RuleFormProps = {
  rule?: Rule;
  gejala: Gejala[];
  selectedGejalaIds?: string[];
  error?: string;
  cancelHref?: string;
  returnTo?: string;
  variant?: "page" | "modal";
};

export function RuleForm({
  rule,
  gejala,
  selectedGejalaIds = [],
  error,
  cancelHref,
  returnTo,
  variant = "page",
}: RuleFormProps) {
  const isEdit = Boolean(rule);
  const isModal = variant === "modal";
  const selected = new Set(selectedGejalaIds);

  return (
    <form
      action={isEdit ? updateRuleAction : createRuleAction}
      className={
        isModal ? "bg-white" : "rounded-lg border border-slate-200 bg-white shadow-sm"
      }
    >
      {rule ? <input type="hidden" name="id" value={rule.id} /> : null}
      {returnTo ? <input type="hidden" name="return_to" value={returnTo} /> : null}

      {!isModal ? (
        <div className="border-b border-slate-200 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-950">
            {isEdit ? "Edit Rule FC" : "Tambah Rule FC"}
          </h1>
          <p className="text-sm text-slate-500">
            Rule menghubungkan kumpulan mata pelajaran dengan kesimpulan minat belajar.
          </p>
        </div>
      ) : null}

      <div className="grid gap-4 p-4">
        {error ? (
          <AlertBanner
            title={isEdit ? "Gagal Menyimpan Rule" : "Gagal Menambahkan Rule"}
            message={error}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div>
            <label
              htmlFor="kode_rule"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Kode Rule
            </label>
            <input
              id="kode_rule"
              name="kode_rule"
              required
              defaultValue={rule?.kode_rule}
              className="h-9 w-full rounded-md border border-slate-200 px-3 font-mono text-sm uppercase outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="R001"
            />
          </div>

          <div>
            <label
              htmlFor="nama_rule"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Nama Rule
            </label>
            <input
              id="nama_rule"
              name="nama_rule"
              required
              defaultValue={rule?.nama_rule}
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="Minat IPA dari kemampuan sains dan numerik"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
          <div>
            <label
              htmlFor="kesimpulan"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Kesimpulan Minat
            </label>
            <input
              id="kesimpulan"
              name="kesimpulan"
              required
              defaultValue={rule?.kesimpulan}
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
              placeholder="IPA / IPS / Bahasa / Teknologi"
            />
          </div>

          <div>
            <label
              htmlFor="bobot"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Bobot
            </label>
            <input
              id="bobot"
              name="bobot"
              type="number"
              min="0.1"
              step="0.05"
              required
              defaultValue={rule?.bobot ?? 1}
              className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={rule?.aktif ?? true}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Rule aktif dan digunakan saat inference
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-950">
                Premis Mata Pelajaran
              </h2>
              <p className="text-xs text-slate-500">
                Pilih minimal satu mata pelajaran yang harus terpenuhi untuk rule ini.
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              {gejala.length} mata pelajaran
            </span>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-200">
            {gejala.length === 0 ? (
              <div className="p-4 text-sm text-slate-500">
                Belum ada mata pelajaran. Tambahkan mata pelajaran terlebih dahulu.
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
                      name="gejala_ids"
                      value={item.id}
                      defaultChecked={selected.has(item.id)}
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
          href={cancelHref ?? "/admin/rules"}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <SubmitButton
          className="h-8 rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
          pendingText={isEdit ? "Menyimpan..." : "Menambahkan..."}
        >
          {isEdit ? "Simpan Rule" : "Tambah Rule"}
        </SubmitButton>
      </div>
    </form>
  );
}
