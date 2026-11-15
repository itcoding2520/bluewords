"use client";

import { useEffect, useState } from "react";

import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { isAdminUser } from "@/lib/supabase/admin-access";
import {
  getCachedUserProfile,
  getUserProfile,
  USER_PROFILE_UPDATED_EVENT,
  type UserProfile,
} from "@/lib/supabase/user-profile";

export function useSidebarAccount() {
  const supabase = useSupabaseClient();
  const [email, setEmail] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminChecked, setIsAdminChecked] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let active = true;
    let currentUserId: string | null = null;

    async function loadProfile(userId: string) {
      currentUserId = userId;
      const cachedProfile = getCachedUserProfile(userId);
      if (active && cachedProfile !== undefined) setProfile(cachedProfile);
      try {
        const nextProfile = await getUserProfile(userId);
        if (active && currentUserId === userId) setProfile(nextProfile);
      } catch (profileError) {
        console.error("Failed to load user profile:", profileError);
      }
    }

    async function loadSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.error("Failed to load session:", error);
        return;
      }

      setEmail(session?.user.email ?? null);
      setIsAuthenticated(Boolean(session?.user.id));
      setAuthUserId(session?.user.id ?? null);
      if (session?.user.id) {
        setIsAdminChecked(false);
        const admin = await isAdminUser(supabase, session.user.id);
        if (active) {
          setIsAdmin(admin);
          setIsAdminChecked(true);
        }
      } else {
        setIsAdmin(false);
        setIsAdminChecked(true);
      }
      if (session?.user.id) void loadProfile(session.user.id);
      else {
        currentUserId = null;
        setProfile(null);
      }
    }

    void loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setEmail(session?.user.email ?? null);
      setIsAuthenticated(Boolean(session?.user.id));
      setAuthUserId(session?.user.id ?? null);
      setIsAdmin(false);
      setIsAdminChecked(!session?.user.id);
      if (session?.user.id) {
        const userId = session.user.id;
        void isAdminUser(supabase, userId).then((admin) => {
          if (active) {
            setIsAdmin(admin);
            setIsAdminChecked(true);
          }
        });
      }
      if (session?.user.id) void loadProfile(session.user.id);
      else {
        currentUserId = null;
        setProfile(null);
      }
    });

    function handleProfileUpdated(event: Event) {
      setProfile((event as CustomEvent<UserProfile>).detail);
    }
    window.addEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener(USER_PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, [supabase]);

  return { email, isAuthenticated, authUserId, isAdmin, isAdminChecked, profile };
}
