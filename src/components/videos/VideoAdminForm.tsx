"use client";

import { Pencil, Plus, X } from "lucide-react";
import type { FormEventHandler } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export function VideoAdminForm({
  editing,
  title,
  youtubeUrl,
  isSaving,
  onTitleChange,
  onYoutubeUrlChange,
  onSave,
  onCancel,
}: {
  editing: boolean;
  title: string;
  youtubeUrl: string;
  isSaving: boolean;
  onTitleChange: (value: string) => void;
  onYoutubeUrlChange: (value: string) => void;
  onSave: FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
}) {
  return (
    <Card className="mb-6 p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">
        {editing ? "Edit video" : "Add a video"}
      </h2>
      <form onSubmit={onSave} className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Video title
          <Input value={title} onChange={(event) => onTitleChange(event.target.value)} maxLength={150} required placeholder="Enter a title" />
        </label>
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          YouTube link
          <Input value={youtubeUrl} onChange={(event) => onYoutubeUrlChange(event.target.value)} type="url" required placeholder="https://www.youtube.com/watch?v=..." />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={isSaving}>
            {editing ? <Pencil size={16} /> : <Plus size={16} />}
            {editing ? "Save changes" : "Add video"}
          </Button>
          {editing && (
            <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving} aria-label="Cancel editing">
              <X size={16} />
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
