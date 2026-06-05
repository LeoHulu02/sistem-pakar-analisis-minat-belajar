import { GejalaForm } from "@/components/gejala/GejalaForm";

type NewGejalaPageProps = {
  searchParams?: {
    error?: string;
  };
};

export default function NewGejalaPage({ searchParams }: NewGejalaPageProps) {
  return (
    <div className="h-full overflow-auto bg-white">
      <GejalaForm error={searchParams?.error} />
    </div>
  );
}
