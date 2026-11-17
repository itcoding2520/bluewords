import { getStandardImageExtension } from "@/lib/image-validation";
import { requireAuthenticatedUser } from "@/lib/supabase/authenticated-user";
import type { SupabaseClient } from "@/lib/supabase/client";

export async function uploadAuthenticatedImage(input: {
  supabase: SupabaseClient;
  bucket: string;
  ownerFolder: string;
  file: File;
  authenticationError: string;
}): Promise<string> {
  const user = await requireAuthenticatedUser(input.supabase, input.authenticationError);
  const extension = getStandardImageExtension(input.file.type);
  const path = `${user.id}/${input.ownerFolder}/${crypto.randomUUID()}.${extension}`;
  const { error } = await input.supabase.storage.from(input.bucket).upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });

  if (error) throw error;
  return path;
}
