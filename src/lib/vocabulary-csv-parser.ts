import type { VocabularyCsvIssue } from "@/lib/vocabulary-csv-shared";

export interface CsvRecord {
  line: number;
  fields: string[];
}

export interface CsvParseResult {
  records: CsvRecord[];
  errors: VocabularyCsvIssue[];
}

export function parseRecords(input: string): CsvParseResult {
  const source = input.replace(/^\uFEFF/, "");
  const records: CsvRecord[] = [];
  const errors: VocabularyCsvIssue[] = [];
  let fields: string[] = [];
  let field = "";
  let line = 1;
  let recordLine = 1;
  let inQuotes = false;
  let afterQuote = false;

  function finishField() {
    fields.push(field);
    field = "";
    afterQuote = false;
  }

  function finishRecord() {
    finishField();
    if (fields.some((value) => value.trim() !== "")) {
      records.push({ line: recordLine, fields });
    }
    fields = [];
    recordLine = line + 1;
  }

  for (let index = 0; index < source.length; index++) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index++;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        field += character;
        if (character === "\n") line++;
        else if (character === "\r" && source[index + 1] !== "\n") line++;
      }
      continue;
    }

    if (character === '"') {
      if (field.trim() !== "" || afterQuote) {
        errors.push({
          line,
          message: "Unexpected quote in an unquoted field.",
        });
      } else {
        field = "";
        inQuotes = true;
      }
      continue;
    }

    if (afterQuote && character !== "," && character !== "\n" && character !== "\r" && character.trim() !== "") {
      errors.push({
        line,
        message: "Only a comma or line break can follow a closing quote.",
      });
      afterQuote = false;
    }

    if (character === ",") {
      finishField();
    } else if (character === "\n") {
      finishRecord();
      line++;
      recordLine = line;
    } else if (character === "\r") {
      finishRecord();
      if (source[index + 1] === "\n") index++;
      line++;
      recordLine = line;
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    errors.push({ line: recordLine, message: "Quoted field is not closed." });
  }

  if (field !== "" || fields.length > 0) {
    finishRecord();
  }

  return { records, errors };
}

