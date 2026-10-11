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
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3 lg:gap-5">
      <StatCard
        label="Total words"
        value={total}
        description="In your vocabulary"
      />

      <StatCard
        label="Learning"
        value={learning}
        description="Keep practicing"
      />

      <StatCard
        label="Mastered"
        value={mastered}
        description="Great progress"
      />
    </section>
  );
}