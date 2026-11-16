import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { getUserProfile, type UserProfile } from "@/lib/supabase/user-profile";

export function useEditableUserProfileData({
  userId,
  onProfileLoaded,
  setError,
}: {
  userId: string;
  onProfileLoaded: (profile: UserProfile | null) => void;
  setError: Dispatch<SetStateAction<string>>;
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void getUserProfile(userId).then((loadedProfile) => {
      if (!active) return;
      setProfile(loadedProfile);
      onProfileLoaded(loadedProfile);
    }).catch(() => {
      if (active) setError("Could not load your profile. Please try again.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [onProfileLoaded, setError, userId]);

  return { profile, setProfile, loading };
}
