import { Card } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
}

export function StatCard({
  label,
  value,
  description,
}: StatCardProps) {
  return (
    <Card className="p-6">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </Card>
  );
}