import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  variant?: "card" | "flush";
};

function buildHref(
  basePath: string,
  searchParams: PaginationProps["searchParams"],
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  basePath,
  searchParams,
  variant = "card",
}: PaginationProps) {
  const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);
  const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const canPrevious = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      className={
        variant === "flush"
          ? "flex flex-col gap-2 border-t border-slate-200 bg-white px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"
          : "flex flex-col gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm md:flex-row md:items-center md:justify-between"
      }
    >
      <p className="text-slate-500">
        Menampilkan{" "}
        <span className="font-medium text-slate-700">{start}</span>-
        <span className="font-medium text-slate-700">{end}</span> dari{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> data
      </p>
      <div className="flex items-center gap-2">
        {canPrevious ? (
          <Link
            href={buildHref(basePath, searchParams, currentPage - 1)}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            Sebelumnya
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 font-medium text-slate-300">
            Sebelumnya
          </span>
        )}
        <span className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
          {currentPage} / {totalPages}
        </span>
        {canNext ? (
          <Link
            href={buildHref(basePath, searchParams, currentPage + 1)}
            className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 font-medium text-slate-600 hover:bg-slate-50"
          >
            Berikutnya
          </Link>
        ) : (
          <span className="inline-flex h-8 items-center rounded-md border border-slate-200 px-3 font-medium text-slate-300">
            Berikutnya
          </span>
        )}
      </div>
    </div>
  );
}
