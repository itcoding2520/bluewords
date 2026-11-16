import { escapeCsvCell } from "@/lib/csv-rows";
import { COMMUNICATION_CSV_HEADERS } from "@/lib/communication/csv-headers";
import type { CommunicationCsvRecord } from "@/lib/communication/csv";

export function exportCommunicationCsv(records: CommunicationCsvRecord[]) {
  const lines = records.map((record) => COMMUNICATION_CSV_HEADERS.map((name) => {
    if (name === "response_options_json") return escapeCsvCell(JSON.stringify(record.response_options));
    return escapeCsvCell(record[name as keyof CommunicationCsvRecord] as string | number | null | undefined);
  }).join(","));
  return [COMMUNICATION_CSV_HEADERS.map((header) => escapeCsvCell(header)).join(","), ...lines].join("\r\n");
}
