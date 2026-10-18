
import { Card } from "@/components/ui/Card";

type StatCardVariant = "blue" | "orange" | "green";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  variant: StatCardVariant;
}

const variantStyles: Record<
  StatCardVariant,
  {
    card: string;
    label: string;
    value: string;
    description: string;
  }
> = {
  blue: {
    card: "border-blue-100 bg-blue-50",
    label: "text-blue-700",
    value: "text-blue-950",
    description: "text-blue-600",
  },
  orange: {
    card: "border-orange-100 bg-[#ff990a]",
    label: "text-white",
    value: "text-white",
    description: "text-white",
  },
  green: {
    card: "border-green-100 bg-green-50",
    label: "text-green-700",
    value: "text-green-950",
    description: "text-green-600",
  },
};

export function StatCard({
  label,
  value,
  description,
  variant,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={`min-w-0 p-5 sm:p-6 ${styles.card}`}>
      <p className={`text-sm font-medium ${styles.label}`}>
        {label}
      </p>

      <p
        className={`mt-3 text-2xl font-semibold tracking-tight sm:text-3xl ${styles.value}`}
      >
        {value}
      </p>

      <p className={`mt-1 text-xs ${styles.description}`}>
        {description}
      </p>
    </Card>
  );
}
