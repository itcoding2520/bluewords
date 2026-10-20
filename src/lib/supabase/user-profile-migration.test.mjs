import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migration = await readFile(
  new URL("./migrations/20261020190000_add_user_profiles_and_avatars.sql", import.meta.url),
  "utf8"
);

test("user profiles are private to their owner and nicknames are unique", () => {
  assert.match(migration, /ALTER TABLE public\.user_profiles ENABLE ROW LEVEL SECURITY/);
  assert.match(migration, /USING \(user_id = \(SELECT auth\.uid\(\)\)\)/);
  assert.match(migration, /ON public\.user_profiles \(lower\(nickname\)\)/);
  assert.match(migration, /char_length\(nickname\) BETWEEN 2 AND 24/);
});

test("avatars are public images, while uploads and deletes stay in the owner's folder", () => {
  assert.match(migration, /'user-avatars',[\s\S]*?true,[\s\S]*?5242880/);
  assert.match(migration, /bucket_id = 'user-avatars'[\s\S]*?\(storage\.foldername\(name\)\)\[1\] = \(SELECT auth\.uid\(\)\)::text/);
});

test("leaderboards return profile nicknames and avatar paths without exposing emails", () => {
  const leaderboardFunctions = migration.slice(migration.indexOf("CREATE FUNCTION public.get_vocabulary_quiz_leaderboard"));
  assert.match(leaderboardFunctions, /COALESCE\(profile\.nickname,[\s\S]*?profile\.avatar_path/);
  assert.equal((leaderboardFunctions.match(/LEFT JOIN public\.user_profiles AS profile/g) ?? []).length, 2);
  assert.doesNotMatch(leaderboardFunctions, /auth\.users|email/i);
});
