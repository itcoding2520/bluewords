"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  getDashboardVocabularyOverview,
  type DashboardVocabularyOverview,
} from "@/lib/supabase/dashboard-vocabulary";

import { DashboardHeader } from "./DashboardHeader";
import { Stats } from "./Stats";
import { ProgressCard } from "./ProgressCard";
import { RecentWords } from "./RecentWords";
import { LearningInsights } from "./LearningInsights";

interface DashboardContentProps {
  dateLabel: string;
  greeting: string;
  userId: string;
}

export function DashboardContent({
  dateLabel,
  greeting,
  userId,
}: DashboardContentProps) {
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setEmail(session?.user.email ?? null);
      }
    });

    async function loadSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Failed to load dashboard session:", error);
        return;
      }

      setEmail(session?.user.email ?? null);
    }

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const [overviewState, setOverviewState] = useState<
    | { userId: string; status: "loading" }
    | { userId: string; status: "error" }
    | { userId: string; status: "loaded"; data: DashboardVocabularyOverview }
  >({ userId, status: "loading" });
  const currentOverviewState = overviewState.userId === userId
    ? overviewState
    : null;

  useEffect(() => {
    let active = true;

    void getDashboardVocabularyOverview(userId)
      .then((result) => {
        if (active) setOverviewState({ userId, status: "loaded", data: result });
      })
      .catch((error) => {
        console.error("Failed to load dashboard vocabulary overview:", error);
        if (active) setOverviewState({ userId, status: "error" });
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (!currentOverviewState || currentOverviewState.status === "loading") {
    return (
      <div className="py-16 text-sm text-slate-500" role="status">
        Loading dashboard...
      </div>
    );
  }

  if (currentOverviewState.status === "error") {
    return (
      <div className="py-16 text-sm text-slate-500" role="alert">
        Could not load dashboard data. Please refresh and try again.
      </div>
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
      />

      <Stats
        total={overview.total}
        learning={overview.learning}
        mastered={overview.mastered}
      />

      <ProgressCard
        total={overview.total}
        mastered={overview.mastered}
        progress={progress}
      />

      <LearningInsights userId={userId} />

      <RecentWords words={overview.recentWords} />
    </>
  );
}
