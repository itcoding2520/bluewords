import {
  getCachedDashboardVocabularyOverview,
  getDashboardVocabularyOverview,
} from "@/lib/supabase/dashboard-vocabulary";
import { useCachedUserResource } from "@/hooks/useCachedUserResource";

export function useDashboardVocabularyOverview(userId: string) {
  return useCachedUserResource(
    userId,
    getCachedDashboardVocabularyOverview,
    getDashboardVocabularyOverview,
    "Failed to load dashboard vocabulary overview:",
  );
}
