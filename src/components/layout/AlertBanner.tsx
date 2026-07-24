import { AlertTriangle } from "lucide-react";

type AlertBannerProps = {
  title?: string;
  message?: string;
  className?: string;
};

export function AlertBanner({
  title = "Pemberitahuan: Gagal Menyimpan Data",
  message,
  className = "",
}: AlertBannerProps) {
  if (!message) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900 shadow-sm ${className}`}
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <div className="space-y-0.5">
        {title ? (
          <h4 className="font-semibold text-red-900">{title}</h4>
        ) : null}
        <p className="text-sm leading-relaxed text-red-700">{message}</p>
      </div>
    </div>
  );
}
