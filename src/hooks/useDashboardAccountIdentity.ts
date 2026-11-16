import { useCurrentAccountProfile } from "@/hooks/useCurrentAccountProfile";

export function useDashboardAccountIdentity() {
  const { user, profile } = useCurrentAccountProfile({
    sessionErrorLabel: "Failed to load dashboard session:",
    clearProfileOnError: true,
  });
  return { email: user?.email ?? null, nickname: profile?.nickname ?? null };
}
