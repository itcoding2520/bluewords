import type { SupabaseClient } from "@/lib/supabase/client";
import { createInvalidatableAsyncCache } from "@/lib/supabase/invalidatable-async-cache.mjs";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";
import type {
  CommunicationCollections,
  CommunicationLesson,
  CommunicationLessonItem,
  CommunicationTopic,
} from "@/lib/supabase/communication-admin-types";

const COLLECTION_CACHE_TTL = 60_000;
const COLLECTION_CACHE_VERSION = "v2-paginated-items";
const collectionsCache = createInvalidatableAsyncCache();
const collectionsCacheExpiry = new Map<string, number>();


export async function loadAdminCommunicationCollections(
  supabase: SupabaseClient,
  force = false
): Promise<CommunicationCollections> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  const userId = session?.user.id;
  if (!userId) throw new Error("Your session has expired. Sign in again to manage communication content.");

  const cacheKey = `${COLLECTION_CACHE_VERSION}:${userId}`;
  if (force || (collectionsCacheExpiry.get(userId) ?? 0) <= Date.now()) {
    collectionsCache.invalidate(cacheKey);
    // Set expiry before the request so concurrent mounts share the same promise.
    collectionsCacheExpiry.set(userId, Date.now() + COLLECTION_CACHE_TTL);
  }

  return collectionsCache.get(cacheKey, async () => {
    const [topicResult, lessonResult, allItems] = await Promise.all([
      supabase.from("communication_topics").select("*").order("sort_order").order("title_en"),
      supabase.from("communication_lessons").select("*").order("sort_order").order("title_en"),
      fetchAllPages<CommunicationLessonItem>(async (from, to) => {
        const { data, error } = await supabase
          .from("communication_lesson_items")
          .select("*")
          .order("sort_order")
          .order("item_key")
          .range(from, to);
        return { data: (data ?? []) as CommunicationLessonItem[], error };
      }),
    ]);

    if (topicResult.error) throw topicResult.error;
    if (lessonResult.error) throw lessonResult.error;

    return {
      topics: (topicResult.data ?? []) as CommunicationTopic[],
      lessons: (lessonResult.data ?? []) as CommunicationLesson[],
      items: allItems,
    };
  });
}
