import type { SupabaseClient } from "@/lib/supabase/client";
import { type CommunicationCsvRecord } from "@/lib/communication/csv";
import { fetchAllPages } from "@/lib/supabase/fetch-all-pages.mjs";

export async function importNewCommunicationItems(
  supabase: SupabaseClient,
  records: CommunicationCsvRecord[],
  lessonsByKey: Map<string, string>,
) {
  const allItemRows = [];
  const itemKeys: string[] = [];
  for (const row of records) {
    if (row.record_type !== "item") continue;
    allItemRows.push({
      item_key: row.record_key,
      lesson_id: lessonsByKey.get(row.lesson_key),
      item_type: row.item_type,
      content_en: row.content_en,
      meaning_vi: row.meaning_vi,
      example_en: row.example_en,
      example_vi: row.example_vi,
      image_keyword: row.image_keyword,
      audio_url: row.audio_url,
      sort_order: row.record_order,
    });
    itemKeys.push(row.record_key);
  }
  const itemKeyBatches = Array.from(
    { length: Math.ceil(itemKeys.length / 100) },
    (_, index) => itemKeys.slice(index * 100, (index + 1) * 100),
  );
  const existingItemsByBatch = await Promise.all(itemKeyBatches.map((itemKeyBatch) =>
    fetchAllPages<{ item_key: string }>(async (from, to) => {
      const { data, error } = await supabase.from("communication_lesson_items")
        .select("item_key").in("item_key", itemKeyBatch)
        .order("item_key").range(from, to);
      return { data: data ?? [], error };
    })
  ));
  const existingItemKeys = new Set(existingItemsByBatch.flat().map((row) => row.item_key));
  const itemRows = [];
  let skippedExistingRows = 0;
  for (const row of allItemRows) {
    if (existingItemKeys.has(row.item_key)) skippedExistingRows++;
    else itemRows.push(row);
  }
  if (itemRows.length) {
    const insertItems = await supabase.from("communication_lesson_items").insert(itemRows);
    if (insertItems.error) throw insertItems.error;
  }

  return { itemCount: itemRows.length, existingItemKeys, skippedExistingRows };
}
