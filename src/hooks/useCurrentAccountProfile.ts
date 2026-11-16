import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import {
  getCachedUserProfile,
  getUserProfile,
  subscribeToUserProfileUpdates,
  type UserProfile,
} from "@/lib/supabase/user-profile";

export function useCurrentAccountProfile({
  sessionErrorLabel,
  profileErrorLabel,
  clearProfileOnError = false,
}: {
  sessionErrorLabel: string;
  profileErrorLabel?: string;
  clearProfileOnError?: boolean;
}) {
  const supabase = useSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSessionLoaded, setIsSessionLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    function syncUser(nextUser: User | null) {
      currentUserId = nextUser?.id ?? null;
      setIsSessionLoaded(true);
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        return;
      }

      const cachedProfile = getCachedUserProfile(nextUser.id);
      if (cachedProfile !== undefined) setProfile(cachedProfile);

      void getUserProfile(nextUser.id)
        .then((nextProfile) => {
          if (active && currentUserId === nextUser.id) setProfile(nextProfile);
        })
        .catch((error) => {
          if (profileErrorLabel) console.error(profileErrorLabel, error);
          if (active && currentUserId === nextUser.id && clearProfileOnError) setProfile(null);
        });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) syncUser(session?.user ?? null);
    });

    const unsubscribeProfileUpdates = subscribeToUserProfileUpdates(setProfile);

    async function loadSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.error(sessionErrorLabel, error);
        return;
      }
      syncUser(session?.user ?? null);
    }

    void loadSession();

    return () => {
      active = false;
      subscription.unsubscribe();
      unsubscribeProfileUpdates();
    };
  }, [clearProfileOnError, profileErrorLabel, sessionErrorLabel, supabase]);

  return { user, profile, isSessionLoaded };
}
