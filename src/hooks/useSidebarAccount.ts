"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { isAdminUser } from "@/lib/supabase/admin-access";
import { useCurrentAccountProfile } from "@/hooks/useCurrentAccountProfile";

export function useSidebarAccount() {
  const supabase = useSupabaseClient();
  const [adminCheck, setAdminCheck] = useState<{ user: User; isAdmin: boolean } | null>(null);
  const { user, profile, isSessionLoaded } = useCurrentAccountProfile({
    sessionErrorLabel: "Failed to load session:",
    profileErrorLabel: "Failed to load user profile:",
  });

  useEffect(() => {
    let active = true;
    if (user) {
      void isAdminUser(supabase, user.id).then((admin) => {
        if (active) setAdminCheck({ user, isAdmin: admin });
      });
    }

    return () => {
      active = false;
    };
  }, [supabase, user]);

  const isAdminChecked = isSessionLoaded && (!user || adminCheck?.user === user);
  const isAdmin = Boolean(user && adminCheck?.user === user && adminCheck.isAdmin);

  return {
    email: user?.email ?? null,
    isAuthenticated: Boolean(user?.id),
    authUserId: user?.id ?? null,
    isAdmin,
    isAdminChecked,
    profile,
  };
}
