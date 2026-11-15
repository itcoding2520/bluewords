import type {
  CommunicationCsvDuplicate,
  CommunicationCsvRecord,
} from "@/lib/communication/csv";

export function removeDuplicateCommunicationCsvRecords(
  records: CommunicationCsvRecord[]
): {
  records: CommunicationCsvRecord[];
  recordRows: number[];
  duplicates: CommunicationCsvDuplicate[];
} {
  const uniqueKeys = new Set<string>();
  const turnOrders = new Set<string>();
  const uniqueRecords: CommunicationCsvRecord[] = [];
  const recordRows: number[] = [];
  const duplicates: CommunicationCsvDuplicate[] = [];

  records.forEach((record, index) => {
    const row = index + 2;
    const identity = `${record.record_type}:${record.record_key}`;
    const turnOrderKey = record.record_type === "dialogue_turn"
      ? `${record.dialogue_key}:${record.turn_order}`
      : null;

    if (uniqueKeys.has(identity) || (turnOrderKey && turnOrders.has(turnOrderKey))) {
      duplicates.push({
        row,
        recordType: record.record_type,
        recordKey: record.record_key,
      });
      return;
    }

    uniqueKeys.add(identity);
    if (turnOrderKey) turnOrders.add(turnOrderKey);
    uniqueRecords.push(record);
    recordRows.push(row);
  });

  return { records: uniqueRecords, recordRows, duplicates };
}
