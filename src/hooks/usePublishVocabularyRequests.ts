import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { getCachedPublishRequests, invalidatePublishRequestCache } from "@/lib/supabase/publish-request-cache.mjs";
import { loadPublishVocabularyRequests } from "@/lib/supabase/publish-vocabulary-requests";
import type { CommunityCategoryRequest, CommunityWordRequest } from "@/lib/vocabulary/publish-options";

export function usePublishVocabularyRequests(isAuthenticated: boolean) {
  const supabase = useSupabaseClient();
  const [communityCategoryRequests, setCommunityCategoryRequests] = useState<CommunityCategoryRequest[]>([]);
  const [communityWordRequests, setCommunityWordRequests] = useState<CommunityWordRequest[]>([]);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  const loadPublishRequests = useCallback(async () => {
    return loadPublishVocabularyRequests(supabase);
  }, [supabase]);

  const refreshRequests = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    invalidatePublishRequestCache(user.id);
    try {
      const requests = await getCachedPublishRequests(user.id, loadPublishRequests, { force: true });
      setCommunityCategoryRequests(requests.categories);
      setCommunityWordRequests(requests.words);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not refresh request status.");
    }
  }, [loadPublishRequests, supabase]);

  useEffect(() => {
    let active = true;
    async function loadRequests() {
      if (!isAuthenticated) {
        setCommunityCategoryRequests([]);
        setCommunityWordRequests([]);
        setRequestsLoaded(true);
        return;
      }
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setRequestsLoaded(true);
          return;
        }
        const requests = await getCachedPublishRequests(user.id, loadPublishRequests);
        if (!active) return;
        setCommunityCategoryRequests(requests.categories);
        setCommunityWordRequests(requests.words);
        setRequestsLoaded(true);
      } catch (error) {
        if (active) {
          toast.error(error instanceof Error ? error.message : "Could not load request status.");
          setRequestsLoaded(true);
        }
      }
    }
    const loadingTimer = window.setTimeout(() => { if (active) setRequestsLoaded(false); }, 0);
    void loadRequests();
    return () => {
      active = false;
      window.clearTimeout(loadingTimer);
    };
  }, [isAuthenticated, loadPublishRequests, supabase]);

  return {
    communityCategoryRequests,
    communityWordRequests,
    requestsLoaded,
    refreshRequests,
  };
}
