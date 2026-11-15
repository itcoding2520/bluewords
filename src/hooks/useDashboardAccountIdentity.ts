import { useEffect, useState } from "react";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getUserProfile, USER_PROFILE_UPDATED_EVENT, type UserProfile } from "@/lib/supabase/user-profile";

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

    function handleProfileUpdated(event: Event) {
      setNickname((event as CustomEvent<UserProfile>).detail.nickname);
    }
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);

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
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [supabase]);

  return { email, nickname };
}
