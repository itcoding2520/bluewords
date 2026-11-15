import type {
  CommunicationCsvDuplicate,
  CommunicationCsvRecord,
} from "@/lib/communication/csv";

export function validateCommunicationCsvConsistency(
  mapped: CommunicationCsvRecord[]
): {
  records: CommunicationCsvRecord[];
  recordRows: number[];
  duplicates: CommunicationCsvDuplicate[];
} {
  const uniqueKeys = new Map<string, number>();
  const turnOrders = new Map<string, number>();
  const duplicates: CommunicationCsvDuplicate[] = [];
  const uniqueLines: number[] = [];
  const uniqueRecords = mapped.filter((item, index) => {
    const line = index + 2;
    const identity = `${item.record_type}:${item.record_key}`;
    const turnOrderKey =
      item.record_type === "dialogue_turn"
        ? `${item.dialogue_key}:${item.turn_order}`
        : null;
    if (uniqueKeys.has(identity) || (turnOrderKey && turnOrders.has(turnOrderKey))) {
      duplicates.push({
        row: line,
        recordType: item.record_type,
        recordKey: item.record_key,
      });
      return false;
    }
    uniqueKeys.set(identity, line);
    if (turnOrderKey) turnOrders.set(turnOrderKey, line);
    uniqueLines.push(line);
    return true;
  });

  const topicMetadata = new Map<string, string>();
  const lessonMetadata = new Map<string, string>();
  const dialogueMetadata = new Map<string, string>();
  uniqueRecords.forEach((item, index) => {
    const line = uniqueLines[index];
    const topic = JSON.stringify([
      item.topic_title_en,
      item.topic_title_vi,
      item.topic_description_en,
      item.topic_description_vi,
      item.topic_order,
    ]);
    if (
      topicMetadata.has(item.topic_slug) &&
      topicMetadata.get(item.topic_slug) !== topic
    ) {
      throw new Error(
        `Row ${line}: topic fields differ from earlier rows for ${item.topic_slug}.`
      );
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
    if (
      lessonMetadata.has(item.lesson_key) &&
      lessonMetadata.get(item.lesson_key) !== lesson
    ) {
      throw new Error(
        `Row ${line}: lesson fields differ from earlier rows for ${item.lesson_key}.`
      );
    }
    lessonMetadata.set(item.lesson_key, lesson);

    if (item.record_type === "dialogue_turn") {
      const dialogue = JSON.stringify([
        item.lesson_key,
        item.dialogue_title_en,
        item.dialogue_title_vi,
        item.dialogue_prompt_vi,
      ]);
      if (
        dialogueMetadata.has(item.dialogue_key) &&
        dialogueMetadata.get(item.dialogue_key) !== dialogue
      ) {
        throw new Error(
          `Row ${line}: dialogue fields differ from earlier rows for ${item.dialogue_key}.`
        );
      }
      dialogueMetadata.set(item.dialogue_key, dialogue);
    }
  });

  return { records: uniqueRecords, recordRows: uniqueLines, duplicates };
}
