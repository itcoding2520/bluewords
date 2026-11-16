/**
 * @param {string} csv
 * @param {{ unclosedQuote: string; missingContent: string }} messages
 * @param {{ requireContent?: boolean }} [options]
 * @returns {string[][]}
 */
export function parseCsvRows(csv, messages, { requireContent = true } = {}) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (quoted) {
      if (character === '"' && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error(messages.unclosedQuote);
  if (field || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  if (requireContent && rows.length < 2) throw new Error(messages.missingContent);
  return rows;
}

/** @param {string | number | null | undefined} value */
export function escapeCsvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
