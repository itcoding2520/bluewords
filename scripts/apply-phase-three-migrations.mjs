import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(root, ".env.local");
const migrations = [
  ["20261025100000", "20261025100000_phase_three_community_and_uniqueness.sql"],
  ["20261025110000", "20261025110000_seed_default_vocabulary_keys.sql"],
  ["20261025120000", "20261025120000_admin_profile_access.sql"],
  ["20261025130000", "20261025130000_admin_notifications.sql"],
  ["20261025140000", "20261025140000_public_shared_vocabulary.sql"],
  ["20261025150000", "20261025150000_publish_request_notification_details.sql"],
  ["20261025160000", "20261025160000_aggregate_publish_notifications.sql"],
  ["20261025170000", "20261025170000_category_images.sql"],
  ["20261025180000", "20261025180000_admin_edit_remove_vocabulary.sql"],
  ["20261025190000", "20261025190000_publish_admin_category_images.sql"],
  ["20261025200000", "20261025200000_require_owned_word_for_publish.sql"],
  ["20261025210000", "20261025210000_youtube_video_library.sql"],
  ["20261025220000", "20261025220000_video_author_nullable.sql"],
  ["20261025230000", "20261025230000_unique_youtube_video_ids.sql"],
];

function parseEnv(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in values) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    } else {
      value = value.replace(/\s+#.*$/, "").trim();
    }
    values[match[1]] = value;
  }
  return values;
}

const env = { ...parseEnv(await readFile(envPath, "utf8")), ...process.env };
const connectionString = env.DATABASE_URL;
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
if (!connectionString || !supabaseUrl) {
  throw new Error("Set DATABASE_URL and NEXT_PUBLIC_SUPABASE_URL in .env.local before running this script.");
}

const projectHost = new URL(supabaseUrl).hostname;
const projectRef = projectHost.endsWith(".supabase.co") ? projectHost.slice(0, -".supabase.co".length) : "";
const dbUrl = new URL(connectionString);
const dbUser = decodeURIComponent(dbUrl.username);
if (!projectRef || (!dbUrl.hostname.includes(projectRef) && !dbUser.endsWith(`.${projectRef}`))) {
  throw new Error("DATABASE_URL does not appear to target the same Supabase project as NEXT_PUBLIC_SUPABASE_URL. Check both values; no migration was run.");
}
if (dbUrl.port === "6543") {
  throw new Error("Use the Supabase Session Pooler (port 5432) or direct database connection for migrations, not the Transaction Pooler.");
}

const client = new Client({
  connectionString,
  application_name: "bluewords-phase3-migrator",
  connectionTimeoutMillis: 15000,
});

try {
  await client.connect();
  await client.query("SELECT pg_advisory_lock(731204251)");
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.bluewords_schema_migrations (
      version text PRIMARY KEY,
      migration_name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await client.query("REVOKE ALL ON public.bluewords_schema_migrations FROM PUBLIC, anon, authenticated, service_role");

  for (const [version, filename] of migrations) {
    const { rowCount } = await client.query(
      "SELECT 1 FROM public.bluewords_schema_migrations WHERE version = $1",
      [version],
    );
    if (rowCount) {
      console.log(`${version}: already applied, skipping`);
      continue;
    }

    const sql = await readFile(path.join(root, "src/lib/supabase/migrations", filename), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO public.bluewords_schema_migrations (version, migration_name) VALUES ($1, $2)",
        [version, filename],
      );
      await client.query("COMMIT");
      console.log(`${version}: applied`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log("Phase 3 migrations are up to date.");
} catch (error) {
  console.error(`Phase 3 migration failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  try {
    await client.query("SELECT pg_advisory_unlock(731204251)");
  } catch {}
  await client.end().catch(() => {});
}
