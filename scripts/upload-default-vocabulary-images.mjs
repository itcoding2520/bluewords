import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseCsvRows } from "../src/lib/csv-rows.mjs";
import { loadProjectEnv } from "./lib/load-project-env.mjs";

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

loadProjectEnv(projectDir);

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

  const [header = [], ...rows] = parseCsvRows(source, {
    unclosedQuote: `CSV has an unclosed quoted field in ${csvPath}.`,
    missingContent: `CSV needs a header and at least one content row in ${csvPath}.`,
  }, { requireContent: false });
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
