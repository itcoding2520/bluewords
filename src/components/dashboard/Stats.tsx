
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
    <section className="mt-6 grid grid-cols-3 gap-2 lg:mt-10 lg:gap-5">
      <StatCard
        label="Total"
        value={total}
        description="In your vocabulary"
        variant="blue"
      />

      <StatCard
        label="Learning"
        value={learning}
        description="Keep practicing"
        variant="orange"
      />

      <StatCard
        label="Mastered"
        value={mastered}
        description="Great progress"
        variant="green"
      />
    </section>
  );
}
