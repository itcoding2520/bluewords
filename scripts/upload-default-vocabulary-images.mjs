import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const dataDir = path.join(projectDir, "data", "default-vocabulary");
const remainingPacks = [
  "clothes",
  "colors",
  "feelings",
  "food",
  "fruits",
  "house",
  "jobs",
  "numbers",
  "school",
  "shapes",
  "supplies",
  "time",
  "transport",
  "weather",
];

try {
  process.loadEnvFile(path.join(projectDir, ".env.local"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.");
}

if (!serviceRoleKey) {
  throw new Error(
    "SUPABASE_SERVICE_ROLE_KEY is missing or empty in .env.local. Add the private Supabase service-role key before uploading."
  );
}

function parseCsv(source) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

let uploaded = 0;

for (const folder of remainingPacks) {
  const categoryDir = path.join(dataDir, folder);
  const csvPath = path.join(categoryDir, "words.csv");
  const imageDir = path.join(categoryDir, "images");
  let source;
  try {
    source = (await readFile(csvPath, "utf8")).replace(/^\uFEFF/, "");
  } catch {
    continue;
  }

  const [header = [], ...rows] = parseCsv(source);
  const imageColumn = header.indexOf("image_file");
  if (imageColumn < 0) {
    throw new Error(`${csvPath} is missing the image_file column.`);
  }

  const files = [...new Set(rows.map((row) => row[imageColumn]).filter(Boolean))];
  for (const fileName of files) {
    if (path.basename(fileName) !== fileName) {
      throw new Error(`Invalid image filename in ${csvPath}: ${fileName}`);
    }

    const filePath = path.join(imageDir, fileName);
    const extension = path.extname(fileName).toLowerCase();
    const contentType =
      extension === ".jpg" || extension === ".jpeg"
        ? "image/jpeg"
        : extension === ".png"
          ? "image/png"
          : extension === ".webp"
            ? "image/webp"
            : null;
    if (!contentType) {
      throw new Error(`Unsupported image format: ${filePath}`);
    }

    const body = await readFile(filePath);
    const storagePath = `default-vocabulary/${folder}/${fileName}`;
    const encodedPath = storagePath
      .split("/")
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/storage/v1/object/vocabulary-images/${encodedPath}`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Cache-Control": "max-age=31536000",
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body,
      }
    );
    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Could not upload ${storagePath} (${response.status}): ${details}`);
    }
    uploaded += 1;
    console.log(`Uploaded ${storagePath}`);
  }
}

console.log(`Done. Uploaded ${uploaded} shared default images.`);
