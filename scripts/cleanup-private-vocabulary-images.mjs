import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
try {
  process.loadEnvFile(path.join(projectDir, ".env.local"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const execute = process.argv.includes("--execute");
const confirmed = process.argv.includes("--confirm-all-accounts");
const bucket = "vocabulary-images";
const pageSize = 1000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
}
if (execute && !confirmed) {
  throw new Error("Destructive mode requires both --execute and --confirm-all-accounts.");
}

async function storageRequest(pathname, init = {}) {
  const response = await fetch(`${supabaseUrl}/storage/v1${pathname}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Storage API ${init.method ?? "GET"} ${pathname} failed (${response.status}): ${await response.text()}`);
  }
  return response.status === 204 ? null : response.json();
}

async function listFolder(prefix) {
  const entries = [];
  for (let offset = 0; ; offset += pageSize) {
    const page = await storageRequest(`/object/list/${bucket}`, {
      method: "POST",
      body: JSON.stringify({
        prefix,
        limit: pageSize,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    entries.push(...page);
    if (page.length < pageSize) return entries;
  }
}

const rootEntries = await listFolder("");
const accountFolders = rootEntries
  .filter((entry) => uuidPattern.test(entry.name))
  .map((entry) => entry.name);
const objectPaths = [];

for (const accountId of accountFolders) {
  const pendingFolders = [accountId];
  while (pendingFolders.length > 0) {
    const prefix = pendingFolders.pop();
    for (const entry of await listFolder(prefix)) {
      const objectPath = `${prefix}/${entry.name}`;
      if (entry.id === null || entry.id === undefined) {
        pendingFolders.push(objectPath);
      } else {
        objectPaths.push(objectPath);
      }
    }
  }
}

console.log(`Found ${objectPaths.length} private image objects in ${accountFolders.length} account folders.`);
console.log("Shared default-vocabulary/* images are excluded.");
if (!execute) {
  console.log("Dry run only. After the database reset succeeds, add --execute --confirm-all-accounts to delete these objects.");
  process.exit(0);
}

for (let offset = 0; offset < objectPaths.length; offset += pageSize) {
  const batch = objectPaths.slice(offset, offset + pageSize);
  await storageRequest(`/object/${bucket}`, {
    method: "DELETE",
    body: JSON.stringify({ prefixes: batch }),
  });
  console.log(`Deleted ${Math.min(offset + batch.length, objectPaths.length)} / ${objectPaths.length} private image objects.`);
}
console.log("Private vocabulary image cleanup complete.");
