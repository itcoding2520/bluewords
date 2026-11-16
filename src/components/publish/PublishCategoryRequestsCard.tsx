import { FolderHeart, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CommunityCategoryRequest } from "@/lib/vocabulary/publish-options";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

interface PublishCategoryRequestsCardProps {
  requestsLoaded: boolean;
  requestableCategories: Array<{ id: string; name: string }>;
  selectedCategories: string[];
  communityCategoryRequests: CommunityCategoryRequest[];
  busy: boolean;
  onToggle: (categoryName: string, checked: boolean) => void;
  onSend: () => void;
}

export function PublishCategoryRequestsCard({
  requestsLoaded,
  requestableCategories,
  selectedCategories,
  communityCategoryRequests,
  busy,
  onToggle,
  onSend,
}: PublishCategoryRequestsCardProps) {
  return (
    <Card className="publish-request-card publish-category-card p-5 sm:p-6">
      <div className="publish-request-heading">
        <span className="publish-request-icon publish-category-icon"><FolderHeart size={29} /></span>
        <div><h2>Category requests</h2><p>Selecting a category also selects its available words.</p></div>
        <Sparkles className="publish-sparkle" size={22} />
      </div>
      <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {!requestsLoaded ? (
          <p className="text-sm text-slate-500">Loading request status…</p>
        ) : requestableCategories.length ? requestableCategories.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedCategories.includes(item.name)}
              onChange={(event) => onToggle(item.name, event.target.checked)}
            />
            <span>{item.name}</span>
            {communityCategoryRequests.some((request) =>
              normalizeVocabularyText(request.name) === normalizeVocabularyText(item.name) && request.status === "rejected"
            ) && <span className="text-xs text-amber-700">Rejected · resubmittable</span>}
          </label>
        )) : (
          <div className="publish-empty-state">
            <span className="publish-empty-illustration publish-folder-illustration">📁<span>⭐</span></span>
            <h3>No categories ready to request.</h3>
            <p>Custom categories you can submit for community approval will appear here.</p>
          </div>
        )}
      </div>
      <Button className="publish-send-button mt-4" onClick={onSend} disabled={!selectedCategories.length || busy}>
        <Send size={16} /> {busy ? "Sending requests…" : "Send category requests"}
      </Button>
    </Card>
  );
}
