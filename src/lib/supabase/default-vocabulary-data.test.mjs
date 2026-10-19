import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const vocabularyRoot = path.join(repositoryRoot, "data/default-vocabulary");

function parseCsv(contents) {
  const records = [];
  let fields = [];
  let field = "";
  let quoted = false;
  const source = contents.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) {
      quoted = true;
    } else if (character === ",") {
      fields.push(field);
      field = "";
    } else if (character === "\n" || character === "\r") {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      if (field.length > 0 || fields.length > 0) {
        fields.push(field);
        records.push(fields);
      }
      fields = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (field.length > 0 || fields.length > 0) {
    fields.push(field);
    records.push(fields);
  }

  return records;
}

function toRows(contents) {
  const [header, ...records] = parseCsv(contents);
  return records.map((record) =>
    Object.fromEntries(header.map((name, index) => [name, record[index] ?? ""]))
  );
}

test("the default vocabulary packs contain 18 complete categories", () => {
  const categories = toRows(
    readFileSync(path.join(vocabularyRoot, "categories.csv"), "utf8")
  );
  const folders = readdirSync(vocabularyRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const expectedFolders = categories.map(({ name }) => name.toLowerCase()).sort();

  assert.equal(categories.length, 18);
  assert.deepEqual(folders, expectedFolders);

  const allWords = [];

  for (const { name } of categories) {
    const folder = name.toLowerCase();
    const categoryDirectory = path.join(vocabularyRoot, folder);
    const words = toRows(
      readFileSync(path.join(categoryDirectory, "words.csv"), "utf8")
    );
    const imageNames = new Set();
    const wordNames = new Set();

    assert.equal(words.length, 25, `${name} should contain 25 words`);

    for (const word of words) {
      assert.equal(word.category, name, `${word.word} has an unexpected category`);
      assert.ok(word.word, `${name} contains a blank word`);
      assert.ok(word.image_file, `${word.word} is missing its image filename`);
      assert.equal(path.basename(word.image_file), word.image_file);
      assert.ok(
        readFileSync(path.join(categoryDirectory, "images", word.image_file)).length > 0,
        `Missing or empty image for ${word.word}`
      );
      assert.ok(!wordNames.has(word.word.toLowerCase()), `${name} repeats ${word.word}`);
      assert.ok(!imageNames.has(word.image_file), `${name} repeats ${word.image_file}`);

      wordNames.add(word.word.toLowerCase());
      imageNames.add(word.image_file);
      allWords.push(word.word.toLowerCase());
    }

    const imageFiles = readdirSync(path.join(categoryDirectory, "images"))
      .filter((file) => /\.(jpe?g|png|webp)$/i.test(file))
      .sort();
    assert.deepEqual([...imageNames].sort(), imageFiles, `${name} image files must match its CSV`);
  }

  assert.equal(new Set(allWords).size, 436);
});
