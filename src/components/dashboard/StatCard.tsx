
import { Card } from "@/components/ui/Card";
import Image from "next/image";

type StatCardVariant = "blue" | "orange" | "green";

interface StatCardProps {
  label: string;
  value: number;
  description: string;
  variant: StatCardVariant;
  icon: string;
}

const variantStyles: Record<
  StatCardVariant,
  {
    card: string;
    label: string;
    value: string;
    description: string;
    icon: string;
    background: string;
  }
> = {
  blue: {
    card: "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-cyan-50",
    label: "text-blue-700",
    value: "text-blue-950",
    description: "text-blue-600",
    icon: "bg-blue-100 text-blue-700 ring-blue-50",
    background: "/images/ui/backgrounds/stat-total.svg",
  },
  orange: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    label: "text-orange-700",
    value: "text-orange-950",
    description: "text-orange-600",
    icon: "bg-orange-100 text-orange-700 ring-orange-50",
    background: "/images/ui/backgrounds/stat-learning.svg",
  },
  green: {
    card: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-lime-50",
    label: "text-green-700",
    value: "text-green-950",
    description: "text-green-600",
    icon: "bg-emerald-100 text-emerald-700 ring-emerald-50",
    background: "/images/ui/backgrounds/stat-mastered.svg",
  },
};

export function StatCard({
  label,
  value,
  description,
  variant,
  icon,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card className={`flex min-w-0 items-center gap-3 rounded-3xl border-white/80 bg-white/85 p-4 shadow-[0_8px_20px_rgb(35_88_145/0.10)] sm:gap-4 sm:p-5 ${styles.card}`} style={{ backgroundImage: `url('${styles.background}')`, backgroundSize: "100% 100%" }}>
      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ring-4 sm:size-14 ${styles.icon}`}>
        <Image src={icon} alt="" width={30} height={30} />
      </span>
      <div className="min-w-0">
        <p className={`text-xs font-semibold sm:text-sm ${styles.label}`}>
          {label}
        </p>
        <p className={`mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl ${styles.value}`}>
          {value.toLocaleString()}
        </p>
        <p className={`mt-0.5 text-xs ${styles.description}`}>
          {description}
        </p>
      </div>
    </Card>
  );
}
