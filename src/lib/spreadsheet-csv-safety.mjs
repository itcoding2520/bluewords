const formulaLikePrefix = /^[\t\r\n ]*[=+\-@]/u;

export function protectSpreadsheetCell(value) {
  if (value.startsWith("'")) return `'${value}`;
  return formulaLikePrefix.test(value) ? `'${value}` : value;
}

export function restoreSpreadsheetCell(value) {
  if (value.startsWith("''")) return value.slice(1);
  if (value.startsWith("'") && formulaLikePrefix.test(value.slice(1))) {
    return value.slice(1);
  }
  return value;
}
