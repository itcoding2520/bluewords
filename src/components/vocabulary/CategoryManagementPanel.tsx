"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useVocabulary } from "@/contexts/VocabularyContext";
import type { VocabularyCategoryColor, VocabularyCategoryRow } from "@/lib/supabase/categories";
import { deleteCategoryImage, uploadCategoryImage, validateCategoryImage } from "@/lib/supabase/category-images";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { defaultVocabularyCategories } from "@/data/default-vocabulary";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";

const colors: Array<{ value: VocabularyCategoryColor; label: string; dot: string }> = [
  { value: "blue", label: "Blue", dot: "bg-blue-500" },
  { value: "violet", label: "Violet", dot: "bg-violet-500" },
  { value: "orange", label: "Orange", dot: "bg-orange-500" },
  { value: "green", label: "Green", dot: "bg-emerald-500" },
  { value: "rose", label: "Rose", dot: "bg-rose-500" },
  { value: "indigo", label: "Indigo", dot: "bg-indigo-500" },
  { value: "teal", label: "Teal", dot: "bg-teal-500" },
  { value: "amber", label: "Amber", dot: "bg-amber-500" },
  { value: "pink", label: "Pink", dot: "bg-pink-500" },
  { value: "slate", label: "Slate", dot: "bg-slate-500" },
];

export function CategoryManagementPanel() {
  const { categories, words, addCategory, updateCategory, deleteCategory, refreshCategories } = useVocabulary({ loadWords: false, loadCategories: false });
  const [supabase] = useState(() => createClient());
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
  const [sortBy, setSortBy] = useState<"name" | "newest" | "oldest">("name");
  const [filterBy, setFilterBy] = useState<"all" | "mine" | "default" | "community">("all");
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("app_admins").select("user_id").eq("user_id", user.id).maybeSingle();
        if (!cancelled) setIsAdmin(Boolean(data));
      })();
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [supabase]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const { data } = await supabase.from("community_categories").select("name, owner_id").eq("status", "published");
        const owners = (data ?? []) as Array<{ name: string; owner_id: string }>;
        const ownerIds = [...new Set(owners.map((item) => item.owner_id))];
        const emails: Record<string, string> = {};
        for (let start = 0; start < ownerIds.length; start += 100) {
          const response = await fetch(`/api/admin/users?ids=${ownerIds.slice(start, start + 100).join(",")}`);
          if (!response.ok) continue;
          const payload = await response.json() as { users?: Array<{ id: string; email: string | null }> };
          for (const user of payload.users ?? []) emails[user.id] = user.email ?? "No email";
        }
        if (!cancelled) setCategoryAuthors(Object.fromEntries(owners.map((item) => [item.name.trim().toLocaleLowerCase(), emails[item.owner_id] ?? "Loading author…"])));
      })();
    }, 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [isAdmin, supabase]);

  const defaultCategoryNames = new Set(defaultVocabularyCategories.map((category) => category.name.trim().toLocaleLowerCase()));
  const isDefaultCategory = (category: VocabularyCategoryRow) => category.is_default || defaultCategoryNames.has(category.name.trim().toLocaleLowerCase());
  const isPublishedSharedCategory = (category: VocabularyCategoryRow) => category.id.startsWith("community-category-") || category.user_id === "community";
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
      const { error } = await supabase.from("community_categories").update({ image_path: path }).eq("id", communityId);
      if (error) { await deleteCategoryImage(path); throw error; }
    } else {
      const updated = await updateCategory(category.id, { image_path: path }, { silent: true });
      if (!updated) {
        await deleteCategoryImage(path);
        throw new Error("Could not save the category image.");
      }
      if (isAdmin) {
        const normalizedName = category.name.trim().replace(/\s+/g, " ").toLocaleLowerCase();
        const { error } = await supabase.from("community_categories").update({ image_path: path })
          .eq("normalized_name", normalizedName).eq("status", "published");
        if (error) { await deleteCategoryImage(path); throw error; }
      }
    }
    await refreshCategories();
    // An existing image can already back a published community category, so leave
    // replaced files in storage instead of breaking the shared category avatar.
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
      if (added) { setName(""); setColor("blue"); setNewImage(null); setPage(1); }
    } catch (error) {
      if (uploadedPath) await deleteCategoryImage(uploadedPath).catch(() => undefined);
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
    } finally { setIsSaving(false); }
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
        const { error } = await supabase.from("community_categories").update({ name: editName, color: editColor }).eq("id", id);
        if (error) throw error;
      } else {
        updated = Boolean(await updateCategory(editing.id, editing.is_default ? { color: editColor } : { name: editName, color: editColor }));
      }
      if (updated && editImage && (isAdmin || !editing.is_default)) await saveImage(editing, editImage);
      if (updated) setEditing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the category image.");
    } finally { setIsSaving(false); }
  }

  async function handleDelete(category: VocabularyCategoryRow) {
    if (isSaving || category.is_default) return;
    if (!window.confirm(`Delete “${category.name}”? Words in this category will move to Uncategorized.`)) return;
    setIsSaving(true);
    await deleteCategory(category.id);
    setIsSaving(false);
  }

  return <section>
    <p className="mb-5 text-sm text-slate-500">Organize your words and add an optional image for category chips in games.</p>
    <form onSubmit={(event) => void handleAdd(event)} className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[minmax(0,1fr)_150px_minmax(180px,0.8fr)_auto] sm:items-end sm:p-5">
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" maxLength={50} /></label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Color<Select value={color} onChange={(event) => setColor(event.target.value as VocabularyCategoryColor)}>{colors.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
      <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category image <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImage(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700" /></label>
      <Button type="submit" disabled={!name.trim() || isSaving}><Plus size={16} /> Add category</Button>
    </form>

    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-900">{managedCategories.length} categories</div>
      <div className="grid gap-3 border-b border-slate-100 bg-slate-50/70 p-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">Filter by
          <Select aria-label="Filter categories" value={filterBy} onChange={(event) => { setFilterBy(event.target.value as typeof filterBy); setPage(1); }}>
            <option value="all">All categories</option>
            <option value="mine">By me</option>
            <option value="default">Default</option>
            <option value="community">Community</option>
          </Select>
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">Sort by
          <Select aria-label="Sort categories" value={sortBy} onChange={(event) => { setSortBy(event.target.value as typeof sortBy); setPage(1); }}>
            <option value="name">A → Z</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </Select>
        </label>
      </div>
      {pageCategories.map((category) => {
        const selectedColor = colors.find((option) => option.value === category.color) ?? colors[0];
        const isReadOnly = category.user_id === "community";
        const isProtectedDefault = isDefaultCategory(category);
        const isPublishedShared = category.id.startsWith("community-category-");
        const canManageCategory = isAdmin || (!isProtectedDefault && !isReadOnly && !isPublishedShared);
        return <article key={category.id} className="border-b border-slate-100 p-4 last:border-0 sm:px-5">
          {editing?.id === category.id ? <form onSubmit={(event) => void handleUpdate(event)} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_minmax(180px,0.8fr)_auto] sm:items-end">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category name<Input value={editName} disabled={category.is_default} onChange={(event) => setEditName(event.target.value)} maxLength={50} /></label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">Color<Select value={editColor} onChange={(event) => setEditColor(event.target.value as VocabularyCategoryColor)}>{colors.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select></label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">{isProtectedDefault ? "Default category image" : "Change category image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={category.is_default && !isAdmin} onChange={(event) => setEditImage(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700 disabled:opacity-50" /></label>
            <div className="flex gap-2"><Button type="submit" disabled={isSaving}><Check size={16} /> Save</Button><Button type="button" variant="secondary" onClick={() => setEditing(null)} disabled={isSaving}><X size={16} /></Button></div>
          </form> : <div className="flex flex-wrap items-center gap-3">
            <CategoryAvatar name={category.name} imagePath={category.image_path} fallbackWordImagePath={words.find((word) => word.category.trim().toLocaleLowerCase() === category.name.trim().toLocaleLowerCase() && word.imagePath)?.imagePath} colorClass={selectedColor.dot} sizeClass="size-11" shapeClass="rounded-xl" />
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{category.name}</p><p className="mt-0.5 text-xs text-slate-500">{isAdmin && categoryAuthors[category.name.trim().toLocaleLowerCase()] ? `By ${categoryAuthors[category.name.trim().toLocaleLowerCase()]}` : isReadOnly ? "Published community category" : category.is_default ? "Default category" : category.image_path ? "Custom image" : "Uses the first word image in games"}</p></div>
            {canManageCategory && <Button type="button" variant="secondary" onClick={() => startEdit(category)} disabled={isSaving}><Pencil size={15} /> Edit</Button>}
            {canManageCategory && !category.is_default && <Button type="button" variant="secondary" onClick={() => void handleDelete(category)} disabled={isSaving} aria-label={`Delete ${category.name}`}><Trash2 size={15} /></Button>}
          </div>}
        </article>;
      })}
      {!managedCategories.length && <p className="p-8 text-center text-sm text-slate-500"><ImagePlus className="mx-auto mb-2" size={22} />No categories yet.</p>}
      {!!managedCategories.length && <footer className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <p aria-live="polite">Showing {firstVisibleCategory}–{lastVisibleCategory} of {managedCategories.length} categories</p>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
          <label className="flex items-center gap-2 whitespace-nowrap">
            <span>Rows per page</span>
            <select aria-label="Categories per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50">
              {[10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap">Page {currentPage} of {pageCount}</span>
            <Button type="button" variant="secondary" aria-label="Previous category page" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1} className="size-10 px-0"><ChevronLeft size={17} /></Button>
            <Button type="button" variant="secondary" aria-label="Next category page" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={currentPage >= pageCount} className="size-10 px-0"><ChevronRight size={17} /></Button>
          </div>
        </div>
      </footer>}
    </div>
  </section>;
}
