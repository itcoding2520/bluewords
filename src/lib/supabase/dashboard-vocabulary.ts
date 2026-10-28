import { createClient } from "@/lib/supabase/client";
import { createInvalidatableAsyncCache } from "@/lib/supabase/invalidatable-async-cache.mjs";
import type { VocabularyCategoryColor } from "@/lib/supabase/categories";
export interface DashboardRecentWord {
  id: string;
  word: string;
  meaning: string;
  category: string;
  imagePath: string | null;
  categoryColor: VocabularyCategoryColor | null;
}

export interface DashboardVocabularyOverview {
  total: number;
  mastered: number;
  learning: number;
  recentWords: DashboardRecentWord[];
}

const overviewCache = createInvalidatableAsyncCache();

export function invalidateDashboardVocabularyOverviewCache(userId?: string): void {
  overviewCache.invalidate(userId);
}

export function getDashboardVocabularyOverview(
  userId: string
): Promise<DashboardVocabularyOverview> {
  return overviewCache.get(userId, async () => {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_dashboard_vocabulary_overview");

    if (error) throw error;

    return data as DashboardVocabularyOverview;
  });
}

export function getCachedDashboardVocabularyOverview(
  userId: string
): DashboardVocabularyOverview | undefined {
  return overviewCache.peek(userId);
}
