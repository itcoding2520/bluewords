import { BookOpen, Send, Sparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { CommunityWordRequest } from "@/lib/supabase/publish-vocabulary-request-types";
import { normalizeVocabularyText } from "@/lib/vocabulary/normalize-text";

interface PublishWordRequestsCardProps {
  requestsLoaded: boolean;
  selectedWordIds: string[];
  setSelectedWordIds: Dispatch<SetStateAction<string[]>>;
  userWords: Array<{ id: string; word: string; category: string; meaning: string }>;
  communityWordRequests: CommunityWordRequest[];
  communityCategoryNames: Map<string, string>;
  busy: boolean;
  onSend: () => void;
}

export function PublishWordRequestsCard({
  requestsLoaded,
  selectedWordIds,
  setSelectedWordIds,
  userWords,
  communityWordRequests,
  communityCategoryNames,
  busy,
  onSend,
}: PublishWordRequestsCardProps) {
  return (
    <Card className="publish-request-card publish-word-card p-5 sm:p-6">
      <div className="publish-request-heading">
        <span className="publish-request-icon publish-word-icon"><BookOpen size={29} /></span>
        <div><h2>Word requests</h2><p>Choose words you added to your own vocabulary, including words in default categories.</p></div>
        <Sparkles className="publish-sparkle" size={22} />
      </div>
      <div className="publish-request-list mt-4 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
        {!requestsLoaded ? (
          <p className="text-sm text-slate-500">Loading request status…</p>
        ) : userWords.length ? userWords.map((item) => (
          <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={selectedWordIds.includes(item.id)}
              onChange={(event) => setSelectedWordIds((current) =>
                event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id)
              )}
            />
            <span>
              {item.word} <span className="text-slate-500">· {item.category}{item.meaning ? ` — ${item.meaning}` : ""}</span>
              {communityWordRequests.some((request) =>
                request.status === "rejected"
                && communityCategoryNames.get(request.category_id) === normalizeVocabularyText(item.category)
                && normalizeVocabularyText(request.normalized_word) === normalizeVocabularyText(item.word)
              ) && <span className="ml-2 text-xs text-amber-700">Rejected · resubmittable</span>}
            </span>
          </label>
        )) : (
          <div className="publish-empty-state">
            <span className="publish-empty-illustration publish-word-illustration">Aa<span>✦</span></span>
            <h3>No words ready to request.</h3>
            <p>Words from your vocabulary that are eligible for community approval will appear here.</p>
          </div>
        )}
      </div>
      <Button className="publish-send-button publish-word-send mt-4" onClick={onSend} disabled={!selectedWordIds.length || busy}>
        <Send size={16} /> {busy ? "Sending requests…" : "Send word requests"}
      </Button>
    </Card>
  );
}
