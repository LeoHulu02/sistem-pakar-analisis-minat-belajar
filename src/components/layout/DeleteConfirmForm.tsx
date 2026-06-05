import Link from "next/link";
import { SubmitButton } from "@/components/layout/SubmitButton";

type DeleteConfirmFormProps = {
  id: string;
  name: string;
  entityLabel: string;
  cancelHref: string;
  returnTo: string;
  action: (formData: FormData) => Promise<void>;
};

export function DeleteConfirmForm({
  id,
  name,
  entityLabel,
  cancelHref,
  returnTo,
  action,
}: DeleteConfirmFormProps) {
  return (
    <form action={action} className="bg-white">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="return_to" value={returnTo} />

      <div className="space-y-3 px-4 py-4">
        <div className="rounded-lg border border-error-100 bg-error-100 px-3 py-2 text-sm text-error-500">
          Data yang dihapus tidak bisa dikembalikan dari aplikasi.
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          Yakin ingin menghapus {entityLabel}{" "}
          <span className="font-semibold text-slate-950">{name}</span>?
        </p>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
        <Link
          href={cancelHref}
          className="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Batal
        </Link>
        <SubmitButton
          className="h-8 rounded-md bg-error-500 px-3 text-sm font-medium text-white hover:bg-red-700"
          pendingText="Menghapus..."
        >
          Hapus
        </SubmitButton>
      </div>
    </form>
  );
}
