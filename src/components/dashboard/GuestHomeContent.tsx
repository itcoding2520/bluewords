import { DashboardFeatureCard } from "@/components/dashboard/DashboardFeatureCard";
import { getGuestHomeFeatures } from "@/data/dashboard-features";

export function GuestHomeContent() {
  const guestActions = getGuestHomeFeatures();

  return (
    <div>
      <header className="mb-7">
        <p className="text-sm font-medium text-blue-600">Welcome to BlueWords</p>
        <h1 className="page-title mt-1">Learn words, play, and explore</h1>
        <p className="page-intro-description mt-2 max-w-2xl">You can explore default and approved community vocabulary and use flashcards and games without an account. Sign in to manage your own words, keep game history, and join the leaderboards.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {guestActions.map((feature) => <DashboardFeatureCard key={feature.href} feature={feature} layout="guest" />)}
      </div>
    </div>
  );
}
