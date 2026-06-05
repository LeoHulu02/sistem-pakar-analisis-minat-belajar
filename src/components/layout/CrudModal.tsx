import Link from "next/link";

type CrudModalProps = {
  title: string;
  description?: string;
  closeHref: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizeClass = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function CrudModal({
  title,
  description,
  closeHref,
  children,
  size = "lg",
}: CrudModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto px-4 py-6">
      <Link
        href={closeHref}
        aria-label="Tutup modal"
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="crud-modal-title"
        className={`relative mx-auto overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl ${sizeClass[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3">
          <div>
            <h2
              id="crud-modal-title"
              className="text-base font-semibold tracking-tight text-slate-950"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            ) : null}
          </div>
          <Link
            href={closeHref}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 text-lg leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            aria-label="Tutup"
          >
            ×
          </Link>
        </div>
        <div>{children}</div>
      </section>
    </div>
  );
}
