import { Check, Pencil, Trash2, X } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { VocabularyCategoryColorSelect } from "@/components/vocabulary/VocabularyCategoryColorSelect";
import { CATEGORY_DOT_STYLES } from "@/components/vocabulary/category-dropdown-styles";
import type { VocabularyCategoryColor } from "@/config/vocabulary";
import type { VocabularyCategoryRow } from "@/lib/supabase/categories";
import { isDefaultCategory, isPublishedSharedCategory } from "@/lib/vocabulary/category-management";

export function CategoryManagementCard({
  category,
  isAdmin,
  author,
  fallbackWordImagePath,
  editing,
  editName,
  onEditNameChange,
  editColor,
  onEditColorChange,
  onEditImageChange,
  isSaving,
  onEditingChange,
  onStartEdit,
  onDelete,
  onUpdate,
}: {
  category: VocabularyCategoryRow;
  isAdmin: boolean;
  author: string | undefined;
  fallbackWordImagePath: string | undefined;
  editing: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  editColor: VocabularyCategoryColor;
  onEditColorChange: (color: VocabularyCategoryColor) => void;
  onEditImageChange: (file: File | null) => void;
  isSaving: boolean;
  onEditingChange: (category: VocabularyCategoryRow | null) => void;
  onStartEdit: (category: VocabularyCategoryRow) => void;
  onDelete: (category: VocabularyCategoryRow) => void;
  onUpdate: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  const selectedColor = CATEGORY_DOT_STYLES[category.color];
  const isReadOnly = category.user_id === "community";
  const isProtectedDefault = isDefaultCategory(category);
  const isPublishedShared = isPublishedSharedCategory(category);
  const canManageCategory = isAdmin || (!isProtectedDefault && !isReadOnly && !isPublishedShared);

  return (
    <article className="category-item-card">
      {editing ? (
        <form onSubmit={onUpdate} className="category-edit-form grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_minmax(180px,0.8fr)_auto] sm:items-end">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category name<Input value={editName} disabled={category.is_default} onChange={(event) => onEditNameChange(event.target.value)} maxLength={50} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Color<VocabularyCategoryColorSelect ariaLabel="Color" value={editColor} onChange={onEditColorChange} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">{isProtectedDefault ? "Default category image" : "Change category image"}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={category.is_default && !isAdmin} onChange={(event) => onEditImageChange(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700 disabled:opacity-50" /></label>
          <div className="flex gap-2"><Button type="submit" disabled={isSaving}><Check size={16} /> Save</Button><Button type="button" variant="secondary" onClick={() => onEditingChange(null)} disabled={isSaving}><X size={16} /></Button></div>
        </form>
      ) : (
        <div className="category-item-content">
          <CategoryAvatar name={category.name} imagePath={category.image_path} fallbackWordImagePath={fallbackWordImagePath} colorClass={selectedColor} sizeClass="size-20" shapeClass="rounded-2xl" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{category.name}</p><p className="mt-1 text-xs text-slate-500">{isAdmin && author ? `By ${author}` : isReadOnly ? "Published community category" : category.is_default ? "Default category" : category.image_path ? "Custom image" : "Uses the first word image in games"}</p></div>
          {canManageCategory && <ActionMenu label={category.name} disabled={isSaving} actions={[{ label: "Edit", icon: <Pencil size={15} />, onSelect: () => onStartEdit(category) }, ...(!category.is_default ? [{ label: "Remove", icon: <Trash2 size={15} />, onSelect: () => onDelete(category), destructive: true }] : [])]} />}
        </div>
      )}
    </article>
  );
}
