import { SiswaForm } from "@/components/siswa/SiswaForm";

type NewSiswaPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function NewSiswaPage({ searchParams }: NewSiswaPageProps) {
  return (
    <div className="h-full overflow-auto bg-white">
      <SiswaForm error={searchParams?.error} />
    </div>
  );
}
