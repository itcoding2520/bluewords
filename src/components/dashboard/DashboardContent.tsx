"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import {
  getDashboardVocabularyOverview,
  type DashboardVocabularyOverview,
} from "@/lib/supabase/dashboard-vocabulary";

import { DashboardHeader } from "./DashboardHeader";
import { Stats } from "./Stats";
import { ProgressCard } from "./ProgressCard";
import { DashboardFeatures } from "./DashboardFeatures";
import { LearningInsights } from "./LearningInsights";
import {
  getUserProfile,
  USER_PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/supabase/user-profile";

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
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    function syncUser(user: { id: string; email?: string } | null) {
      currentUserId = user?.id ?? null;
      setEmail(user?.email ?? null);
      if (!user) {
        setNickname(null);
        return;
      }

      void getUserProfile(user.id)
        .then((profile) => { if (active && currentUserId === user.id) setNickname(profile?.nickname ?? null); })
        .catch(() => { if (active && currentUserId === user.id) setNickname(null); });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) syncUser(session?.user ?? null);
    });

    function handleProfileUpdated(event: Event) {
      setNickname((event as CustomEvent<UserProfile>).detail.nickname);
    }
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);

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

      syncUser(session?.user ?? null);
    }

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
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
