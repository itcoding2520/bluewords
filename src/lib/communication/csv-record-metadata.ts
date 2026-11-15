import type { CommunicationCsvRecord } from "@/lib/communication/csv";

export function validateCommunicationCsvMetadata(
  records: CommunicationCsvRecord[],
  recordRows: number[]
): void {
  const topicMetadata = new Map<string, string>();
  const lessonMetadata = new Map<string, string>();
  const dialogueMetadata = new Map<string, string>();

  records.forEach((item, index) => {
    const line = recordRows[index];
    const topic = JSON.stringify([
      item.topic_title_en,
      item.topic_title_vi,
      item.topic_description_en,
      item.topic_description_vi,
      item.topic_order,
    ]);
    if (topicMetadata.has(item.topic_slug) && topicMetadata.get(item.topic_slug) !== topic) {
      throw new Error(`Row ${line}: topic fields differ from earlier rows for ${item.topic_slug}.`);
    }
    topicMetadata.set(item.topic_slug, topic);

    const lesson = JSON.stringify([
      item.topic_slug,
      item.lesson_title_en,
      item.lesson_title_vi,
      item.difficulty,
      item.lesson_order,
      item.lesson_status,
    ]);
    if (lessonMetadata.has(item.lesson_key) && lessonMetadata.get(item.lesson_key) !== lesson) {
      throw new Error(`Row ${line}: lesson fields differ from earlier rows for ${item.lesson_key}.`);
    }
    lessonMetadata.set(item.lesson_key, lesson);

    if (item.record_type !== "dialogue_turn") return;
    const dialogue = JSON.stringify([
      item.lesson_key,
      item.dialogue_title_en,
      item.dialogue_title_vi,
      item.dialogue_prompt_vi,
    ]);
    if (dialogueMetadata.has(item.dialogue_key) && dialogueMetadata.get(item.dialogue_key) !== dialogue) {
      throw new Error(`Row ${line}: dialogue fields differ from earlier rows for ${item.dialogue_key}.`);
    }
    dialogueMetadata.set(item.dialogue_key, dialogue);
  });
}
