import { createKonsultasiAction } from "@/actions/konsultasi";
import { SubmitButton } from "@/components/layout/SubmitButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NewKonsultasiPageProps = {
  searchParams?: {
    siswa_id?: string;
    error?: string;
  };
};

export default async function NewKonsultasiPage({
  searchParams,
}: NewKonsultasiPageProps) {
  const supabase = createClient();
  const [{ data: siswa, error: siswaError }, { data: gejala, error: gejalaError }] =
    await Promise.all([
      supabase
        .from("siswa")
        .select("*")
        .order("nama", { ascending: true })
        .limit(200),
      supabase
        .from("gejala")
        .select("*")
        .eq("aktif", true)
        .order("kategori", { ascending: true })
        .order("kode", { ascending: true }),
    ]);

  const gejalaByKategori = new Map<string, NonNullable<typeof gejala>>();
  for (const item of gejala ?? []) {
    const key = item.kategori ?? "Umum";
    gejalaByKategori.set(key, [...(gejalaByKategori.get(key) ?? []), item]);
  }

  return (
    <div className="h-full overflow-auto bg-white">
      <form
        action={createKonsultasiAction}
        className="bg-white"
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
            Kuesioner
          </p>
          <h1 className="mt-1 text-lg font-semibold text-slate-950">
            Konsultasi Baru
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Pilih siswa dan gejala yang sesuai. Sistem akan menjalankan Forward
            Chaining dan ID3 secara server-side.
          </p>
        </div>

        <div className="space-y-4 p-4">
          {searchParams?.error ? (
            <div className="rounded-md border border-error-100 bg-error-100 px-3 py-2 text-sm text-error-500">
              {searchParams.error}
            </div>
          ) : null}

          {siswaError || gejalaError ? (
            <div className="rounded-md border border-error-100 bg-error-100 px-3 py-2 text-sm text-error-500">
              Gagal memuat data konsultasi. Pastikan schema dan seed Supabase
              sudah dijalankan.
            </div>
          ) : null}

          <div>
            <label
              htmlFor="siswa_id"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Siswa
            </label>
            <select
              id="siswa_id"
              name="siswa_id"
              required
              defaultValue={searchParams?.siswa_id ?? ""}
              className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Pilih siswa</option>
              {(siswa ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama} - {item.kelas} ({item.nis})
                </option>
              ))}
            </select>
          </div>

          <section>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-950">
                  Gejala Terpilih
                </h2>
                <p className="text-xs text-slate-500">
                  Centang semua pernyataan yang sesuai dengan siswa.
                </p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                {(gejala ?? []).length} aktif
              </span>
            </div>

            <div className="space-y-3">
              {Array.from(gejalaByKategori.entries()).map(([kategori, items]) => (
                <div
                  key={kategori}
                  className="overflow-hidden rounded-lg border border-slate-200"
                >
                  <div className="border-b border-slate-200 bg-slate-50 px-3 py-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {kategori}
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => (
                      <label
                        key={item.id}
                        className="grid cursor-pointer grid-cols-[auto_72px_1fr] items-start gap-3 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          name="gejala_ids"
                          value={item.id}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="font-mono text-xs font-medium text-primary-700">
                          {item.kode}
                        </span>
                        <span className="leading-relaxed text-slate-700">
                          {item.deskripsi}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
          <SubmitButton
            className="h-8 rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
            pendingText="Menganalisis..."
          >
            Jalankan Analisis
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}
