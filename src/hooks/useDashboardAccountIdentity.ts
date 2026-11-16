import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getUserProfile, subscribeToUserProfileUpdates } from "@/lib/supabase/user-profile";

export function useDashboardAccountIdentity() {
  const supabase = useSupabaseClient();
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) syncUser(session?.user ?? null);
    });

    const unsubscribeProfileUpdates = subscribeToUserProfileUpdates((profile) => {
      setNickname(profile.nickname);
    });

    async function loadSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
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
      unsubscribeProfileUpdates();
    };
  }, [supabase]);

  return { email, nickname };
}
