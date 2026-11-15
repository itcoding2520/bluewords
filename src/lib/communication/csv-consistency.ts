import type {
  CommunicationCsvDuplicate,
  CommunicationCsvRecord,
} from "@/lib/communication/csv";
import { removeDuplicateCommunicationCsvRecords } from "@/lib/communication/csv-record-duplicates";
import { validateCommunicationCsvMetadata } from "@/lib/communication/csv-record-metadata";

export function validateCommunicationCsvConsistency(
  mapped: CommunicationCsvRecord[]
): {
  records: CommunicationCsvRecord[];
  recordRows: number[];
  duplicates: CommunicationCsvDuplicate[];
} {
  const unique = removeDuplicateCommunicationCsvRecords(mapped);
  validateCommunicationCsvMetadata(unique.records, unique.recordRows);
  return unique;
}
