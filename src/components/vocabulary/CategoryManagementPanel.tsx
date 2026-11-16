"use client";

import { ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VocabularyCategoryColorSelect } from "@/components/vocabulary/VocabularyCategoryColorSelect";
import { CategoryManagementList } from "@/components/vocabulary/CategoryManagementList";
import { useCategoryManagementController } from "@/hooks/useCategoryManagementController";

export function CategoryManagementPanel() {
  const {
    access: { isAdmin },
    data: { words, categoryAuthors, managedCategories, pageCategories },
    pagination: {
      setPage, pageSize, setPageSize, pageCount, currentPage,
      firstVisibleCategory, lastVisibleCategory,
    },
    filters: { sortBy, setSortBy, filterBy, setFilterBy, isDefaultCategory },
    form: {
      name, setName, color, setColor, setNewImage, editing, setEditing,
      editName, setEditName, editColor, setEditColor, setEditImage,
    },
    actions: { isSaving, startEdit, handleAdd, handleUpdate, handleDelete },
  } = useCategoryManagementController();

  return (
    <section className="category-management-panel">
      <div className="category-add-card">
        <div className="category-add-heading"><span className="category-add-illustration"><ImagePlus size={34} /></span><div><h2>Add a new category</h2><p>Create a category to organize your words. You can also add a custom image for game chips.</p></div></div>
        <form onSubmit={(event) => void handleAdd(event)} className="category-add-form">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category name<Input value={name} onChange={(event) => setName(event.target.value)} placeholder="New category" maxLength={50} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Color<VocabularyCategoryColorSelect ariaLabel="Color" value={color} onChange={setColor} /></label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Category image <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setNewImage(event.target.files?.[0] ?? null)} className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-blue-50 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-700" /></label>
          <Button type="submit" disabled={!name.trim() || isSaving}><Plus size={16} /> Add category</Button>
        </form>
      </div>

      <CategoryManagementList
        words={words}
        isAdmin={isAdmin}
        categoryAuthors={categoryAuthors}
        editing={editing}
        onEditingChange={setEditing}
        editName={editName}
        onEditNameChange={setEditName}
        editColor={editColor}
        onEditColorChange={setEditColor}
        onEditImageChange={setEditImage}
        isSaving={isSaving}
        filterBy={filterBy}
        onFilterChange={(value) => { setFilterBy(value); setPage(1); }}
        sortBy={sortBy}
        onSortChange={(value) => { setSortBy(value); setPage(1); }}
        managedCategories={managedCategories}
        pageCategories={pageCategories}
        pageCount={pageCount}
        currentPage={currentPage}
        firstVisibleCategory={firstVisibleCategory}
        lastVisibleCategory={lastVisibleCategory}
        pageSize={pageSize}
        onPageChange={(update) => setPage(update)}
        onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
        isDefaultCategory={isDefaultCategory}
        onStartEdit={startEdit}
        onUpdate={(event) => void handleUpdate(event)}
        onDelete={(category) => void handleDelete(category)}
      />
    </section>
  );
}
