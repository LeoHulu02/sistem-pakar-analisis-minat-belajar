import Link from "next/link";
import { buildModalPath } from "@/lib/utils/href";
import type { Database, Json } from "@/types/database";

type Dataset = Database["public"]["Tables"]["dataset_id3"]["Row"];

type DatasetTableProps = {
  dataset: Dataset[];
  basePath?: string;
  searchParams?: Record<string, string | undefined>;
};

function countFeatures(fitur: Json) {
  if (!fitur || typeof fitur !== "object" || Array.isArray(fitur)) {
    return 0;
  }

  return Object.values(fitur).filter(Boolean).length;
}

function previewFeatures(fitur: Json) {
  if (!fitur || typeof fitur !== "object" || Array.isArray(fitur)) {
    return [];
  }

  return Object.entries(fitur)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key)
    .slice(0, 5);
}

export function DatasetTable({
  dataset,
  basePath = "/admin/dataset",
  searchParams,
}: DatasetTableProps) {
  if (dataset.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
        <h2 className="text-sm font-semibold text-slate-950">
          Belum ada dataset ID3
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Tambahkan data training pertama untuk membangun decision tree.
        </p>
        <Link
          href={buildModalPath(basePath, searchParams, "create")}
          className="mt-4 inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Tambah Dataset
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
              <th className="px-3 py-2 font-medium">Label</th>
              <th className="px-3 py-2 font-medium">Fitur True</th>
              <th className="px-3 py-2 font-medium">Preview</th>
              <th className="px-3 py-2 font-medium">Tahun Ajaran</th>
              <th className="px-3 py-2 text-right font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {dataset.map((item) => (
              <tr
                key={item.id}
                className="border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="whitespace-nowrap px-3 py-1.5">
                  <span className="rounded bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                    {item.label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 font-medium text-slate-950">
                  {countFeatures(item.fitur)}
                </td>
                <td className="px-3 py-1.5">
                  <div className="flex flex-wrap gap-1">
                    {previewFeatures(item.fitur).map((feature) => (
                      <span
                        key={feature}
                        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-slate-600">
                  {item.tahun_ajaran ?? "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right">
                  <div className="inline-flex items-center gap-2">
                    <Link
                      href={buildModalPath(basePath, searchParams, "edit", item.id)}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
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
        {dataset.map((item) => (
          <article
            key={item.id}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-500">Label</p>
                <p className="font-semibold text-slate-950">{item.label}</p>
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                {countFeatures(item.fitur)} fitur
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {previewFeatures(item.fitur).map((feature) => (
                <span
                  key={feature}
                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-slate-600"
                >
                  {feature}
                </span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
              <Link
                href={buildModalPath(basePath, searchParams, "edit", item.id)}
                className="h-8 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white"
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
