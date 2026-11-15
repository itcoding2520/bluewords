import { useEffect, useState, type FormEvent } from "react";
import { useConfirmDialog } from "@/components/ui/ConfirmDialogProvider";
import { useSupabaseClient } from "@/hooks/useSupabaseClient";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import { deleteCategoryImage, uploadCategoryImage, validateCategoryImage } from "@/lib/supabase/category-images";
import { toast } from "sonner";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { loadAdminUserEmails } from "@/lib/admin-users";

export type CategoryManagementSort = "name" | "newest" | "oldest";
export type CategoryManagementFilter = "all" | "mine" | "default" | "community";

export function useCategoryManagementController() {
  const confirmDialog = useConfirmDialog();
  const { categories, words, addCategory, updateCategory, deleteCategory, refreshCategories } = useVocabulary({
    loadWords: false,
    loadCategories: false,
  });
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryAuthors, setCategoryAuthors] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [color, setColor] = useState<VocabularyCategoryColor>("blue");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [editing, setEditing] = useState<VocabularyCategoryRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<VocabularyCategoryColor>("blue");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<CategoryManagementSort>("name");
  const [filterBy, setFilterBy] = useState<CategoryManagementFilter>("all");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("app_admins")
          .select("user_id").eq("user_id", user.id).maybeSingle();
        if (!cancelled) setIsAdmin(Boolean(data));
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const { data } = await supabase.from("community_categories")
          .select("name, owner_id").eq("status", "published");
        const owners = (data ?? []) as Array<{ name: string; owner_id: string }>;
        const ownerIds = [...new Set(owners.map((item) => item.owner_id))];
        const emails = await loadAdminUserEmails(
          ownerIds,
          "Could not load category authors."
        ).catch((): Record<string, string> => ({}));
        if (!cancelled) {
          setCategoryAuthors(Object.fromEntries(owners.map((item) => [
            item.name.trim().toLocaleLowerCase(),
            emails[item.owner_id] ?? "Loading author…",
          ])));
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isAdmin, supabase]);

  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((category) =>
    category.name.trim().toLocaleLowerCase()
  ));
  const isDefaultCategory = (category: VocabularyCategoryRow) =>
    category.is_default || defaultCategoryNames.has(category.name.trim().toLocaleLowerCase());
  const isPublishedSharedCategory = (category: VocabularyCategoryRow) =>
    category.id.startsWith("community-category-") || category.user_id === "community";
  const filteredCategories = categories.filter((category) => {
    if (filterBy === "mine") return !isDefaultCategory(category) && !isPublishedSharedCategory(category);
    if (filterBy === "default") return isDefaultCategory(category);
    if (filterBy === "community") return isPublishedSharedCategory(category) && !isDefaultCategory(category);
    return true;
  });
  const managedCategories = [...filteredCategories].sort((left, right) => {
    if (sortBy === "name") return left.name.localeCompare(right.name);
    if (!left.created_at || !right.created_at) {
      if (!left.created_at && !right.created_at) return left.name.localeCompare(right.name);
      return left.created_at ? -1 : 1;
    }
    const byDate = new Date(left.created_at).getTime() - new Date(right.created_at).getTime();
    return (sortBy === "newest" ? -byDate : byDate) || left.name.localeCompare(right.name);
  });
  const pageCount = Math.max(1, Math.ceil(managedCategories.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageCategories = managedCategories.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstVisibleCategory = managedCategories.length ? (currentPage - 1) * pageSize + 1 : 0;
  const lastVisibleCategory = Math.min(currentPage * pageSize, managedCategories.length);

  function startEdit(category: VocabularyCategoryRow) {
    setEditing(category);
    setEditName(category.name);
    setEditColor(category.color);
    setEditImage(null);
  }

  async function saveImage(category: VocabularyCategoryRow, file: File) {
    const path = await uploadCategoryImage(category.id, file);
    const communityId = category.id.startsWith("community-category-")
      ? category.id.slice("community-category-".length)
      : null;
    if (communityId) {
      const { error } = await supabase.from("community_categories")
        .update({ image_path: path }).eq("id", communityId);
      if (error) { await deleteCategoryImage(path); throw error; }
    } else {
      const updated = await updateCategory(category.id, { image_path: path }, { silent: true });
      if (!updated) {
        await deleteCategoryImage(path);
        throw new Error("Could not save the category image.");
      }
      if (isAdmin) {
        const normalizedName = category.name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        const { error } = await supabase.from("community_categories")
          .update({ image_path: path }).eq("normalized_name", normalizedName).eq("status", "published");
        if (error) { await deleteCategoryImage(path); throw error; }
      }
    }
    await refreshCategories();
    // Existing images can be shared by published category avatars, so replaced files stay in storage.
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || isSaving) return;
    if (newImage) {
      const validationError = validateCategoryImage(newImage);
      if (validationError) { toast.error(validationError); return; }
    }
    setIsSaving(true);
    let uploadedPath: string | null = null;
    try {
      const id = newImage ? crypto.randomUUID() : undefined;
      if (id && newImage) uploadedPath = await uploadCategoryImage(id, newImage);
      const added = await addCategory({ id, name, color, image_path: uploadedPath });
      if (!added && uploadedPath) await deleteCategoryImage(uploadedPath);
      if (added) {
        setName("");
        setColor("blue");
        setNewImage(null);
        setPage(1);
      }
    } catch (error) {
      if (uploadedPath) await deleteCategoryImage(uploadedPath).catch(() => undefined);
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || isSaving) return;
    if (editImage) {
      const validationError = validateCategoryImage(editImage);
      if (validationError) { toast.error(validationError); return; }
    }
    setIsSaving(true);
    try {
      const isSharedCategory = editing.id.startsWith("community-category-");
      let updated = true;
      if (isSharedCategory) {
        const id = editing.id.slice("community-category-".length);
        const { error } = await supabase.from("community_categories")
          .update({ name: editName, color: editColor }).eq("id", id);
        if (error) throw error;
      } else {
        updated = Boolean(await updateCategory(
          editing.id,
          editing.is_default ? { color: editColor } : { name: editName, color: editColor }
        ));
      }
      if (updated && editImage && (isAdmin || !editing.is_default)) await saveImage(editing, editImage);
      if (updated) setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(category: VocabularyCategoryRow) {
    if (isSaving || category.is_default) return;
    const confirmed = await confirmDialog({
      title: "Delete category?",
      description: `Delete “${category.name}”? Words in this category will move to Uncategorized.`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;
    setIsSaving(true);
    await deleteCategory(category.id);
    setIsSaving(false);
  }

  return {
    categories, words, isAdmin, categoryAuthors, name, setName, color, setColor,
    newImage, setNewImage, editing, setEditing, editName, setEditName,
    editColor, setEditColor, editImage, setEditImage, isSaving, page, setPage,
    pageSize, setPageSize, sortBy, setSortBy, filterBy, setFilterBy,
    isDefaultCategory, managedCategories, pageCount, currentPage, pageCategories,
    firstVisibleCategory, lastVisibleCategory, startEdit, handleAdd, handleUpdate, handleDelete,
  };
}
