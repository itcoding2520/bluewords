
import { StatCard } from "./StatCard";

interface StatsProps {
  total: number;
  learning: number;
  mastered: number;
}

export function Stats({
  total,
  learning,
  mastered,
}: StatsProps) {
  return (
    <section className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:mt-5 lg:gap-5">
      <StatCard
        label="Total words"
        value={total}
        description="In your vocabulary"
        variant="blue"
        icon="/images/ui/icons/icon-total.svg"
      />

      <StatCard
        label="Learning"
        value={learning}
        description="Keep practicing"
        variant="orange"
        icon="/images/ui/icons/icon-learning.svg"
      />

      <StatCard
        label="Mastered"
        value={mastered}
        description="Great progress"
        variant="green"
        icon="/images/ui/icons/icon-mastered.svg"
      />
    </section>
  );
}
