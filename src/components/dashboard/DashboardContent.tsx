"use client";

import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useDashboardAccountIdentity } from "@/hooks/useDashboardAccountIdentity";
import { useDashboardVocabularyOverview } from "@/hooks/useDashboardVocabularyOverview";

import { DashboardHeader } from "./DashboardHeader";
import { Stats } from "./Stats";
import { ProgressCard } from "./ProgressCard";
import { DashboardFeatures } from "./DashboardFeatures";
import { LearningInsights } from "./LearningInsights";

interface DashboardContentProps {
  dateLabel: string;
  greeting: string;
  userId: string;
  isAdmin: boolean;
}

export function DashboardContent({
  dateLabel,
  greeting,
  userId,
  isAdmin,
}: DashboardContentProps) {
  const { email, nickname } = useDashboardAccountIdentity();
  const currentOverviewState = useDashboardVocabularyOverview(userId);

  if (!currentOverviewState || currentOverviewState.status === "loading") {
    return (
      <div className="py-16 text-sm text-slate-500" role="status">
        Loading dashboard...
      </div>
    );
  }

  if (currentOverviewState.status === "error") {
    return (
      <AutoDismissMessage variant="error" className="my-16 text-center">
        Could not load dashboard data. Please refresh and try again.
      </AutoDismissMessage>
    );
  }

  const overview = currentOverviewState.data;

  const progress = overview.total === 0
    ? 0
    : Math.round((overview.mastered / overview.total) * 100);

  return (
    <>
      <DashboardHeader
        dateLabel={dateLabel}
        greeting={greeting}
        email={email}
        nickname={nickname}
      >
        <Stats
          total={overview.total}
          learning={overview.learning}
          mastered={overview.mastered}
        />
      </DashboardHeader>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <ProgressCard
          total={overview.total}
          mastered={overview.mastered}
          progress={progress}
        />
        <LearningInsights userId={userId} />
      </div>

      <DashboardFeatures isAdmin={isAdmin} />
    </>
  );
}
