import { escapeCsvCell as escapeCell, parseCsvRows as parseRows } from "./csv-rows.mjs";

export function parseCsvRows(
  csv: string,
  messages: { unclosedQuote: string; missingContent: string },
  options?: { requireContent?: boolean },
): string[][] {
  return parseRows(csv, messages, options);
}

export function escapeCsvCell(
  value: string | number | null | undefined,
  options?: { spreadsheetSafe?: boolean; quoteAll?: boolean },
): string {
  return escapeCell(value, options);
}
