import { DashboardFeatureCard } from "@/components/dashboard/DashboardFeatureCard";
import { getDashboardFeatures } from "@/data/dashboard-features";

export function DashboardFeatures({ isAdmin }: { isAdmin: boolean }) {
  const features = getDashboardFeatures(isAdmin);

  return (
    <section className="mt-8">
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-blue-950 sm:text-2xl">Explore BlueWords <span aria-hidden="true">✨</span></h2>
        <p className="page-intro-description mt-2">
          Learn a little, play a little, grow every day!
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[640px]:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {features.map((feature) => <DashboardFeatureCard key={feature.href} feature={feature} layout="member" />)}
      </div>
    </section>
  );
}
