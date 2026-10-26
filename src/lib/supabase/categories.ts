import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export type VocabularyCategoryColor =
  | "blue"
  | "violet"
  | "orange"
  | "green"
  | "rose"
  | "indigo"
  | "teal"
  | "amber"
  | "pink"
  | "slate";

export interface VocabularyCategoryRow {
  id: string;
  user_id: string;
  name: string;
  color: VocabularyCategoryColor;
  image_path?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type VocabularyCategoryUpdate = Partial<
  Pick<VocabularyCategoryRow, "name" | "color" | "image_path">
>;

async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be logged in to manage categories.");
  }

  return user;
}

export async function getVocabularyCategoriesForUser(
  userId: string
): Promise<
  VocabularyCategoryRow[]
> {
  const { data, error } = await supabase
    .from("vocabulary_categories")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as VocabularyCategoryRow[];
}

export async function getVocabularyCategories(): Promise<VocabularyCategoryRow[]> {
  const { data, error } = await supabase
    .from("vocabulary_categories")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as VocabularyCategoryRow[];
}

export async function addVocabularyCategory(input: {
  id?: string;
  name: string;
  color: VocabularyCategoryColor;
  image_path?: string | null;
}): Promise<VocabularyCategoryRow> {
  const user = await getAuthenticatedUser();
  const name = input.name.trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  const { data, error } = await supabase
    .from("vocabulary_categories")
    .insert({
      ...(input.id ? { id: input.id } : {}),
      user_id: user.id,
      name,
      color: input.color,
      is_default: false,
      image_path: input.image_path ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyCategoryRow;
}

export async function updateVocabularyCategory(
  id: string,
  updates: VocabularyCategoryUpdate
): Promise<VocabularyCategoryRow> {
  const user = await getAuthenticatedUser();
  const normalizedUpdates: VocabularyCategoryUpdate = {
    ...updates,
  };

  if (updates.name !== undefined) {
    const name = updates.name.trim();

    if (!name) {
      throw new Error("Category name is required.");
    }

    normalizedUpdates.name = name;
  }

  const { data, error } = await supabase
    .from("vocabulary_categories")
    .update(normalizedUpdates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;

  return data as VocabularyCategoryRow;
}

export async function deleteVocabularyCategory(
  id: string
): Promise<void> {
  const user = await getAuthenticatedUser();

  const { error } = await supabase
    .from("vocabulary_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error) throw error;
}
