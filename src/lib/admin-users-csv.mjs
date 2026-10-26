import {
  protectSpreadsheetCell,
} from "./spreadsheet-csv-safety.mjs";

function escapeCsv(value) {
  const safe = protectSpreadsheetCell(String(value ?? ""));
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportAdminUsersCsv(users) {
  const rows = [["email", "nickname", "created_at", "last_sign_in_at"]];
  for (const user of users) rows.push([user.email ?? "", user.nickname ?? "", user.created_at ?? "", user.last_sign_in_at ?? ""]);
  return `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}

export function createAdminUsersCsvTemplate() {
  return `\uFEFF${[ADMIN_USER_CSV_HEADERS, ["", "", ""]].map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
}
