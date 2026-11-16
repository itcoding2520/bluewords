import { BookOpen, FolderOpen, Sparkles } from "lucide-react";

import { CategoryReviewRequests, WordReviewRequests } from "@/components/admin/AdminReviewRequestSections";
import type { AdminReviewDecision, AdminReviewSubmission, AdminReviewTable } from "@/lib/admin-review-types";

interface AdminReviewPendingRequestsProps {
  categories: AdminReviewSubmission[];
  words: AdminReviewSubmission[];
  loading: boolean;
  busy: string | null;
  blockedWordId: string | null;
  ownerEmails: Record<string, string>;
  onModerate: (table: AdminReviewTable, id: string, status: AdminReviewDecision) => void | Promise<void>;
}

export function AdminReviewPendingRequests({
  categories,
  words,
  loading,
  busy,
  blockedWordId,
  ownerEmails,
  onModerate,
}: AdminReviewPendingRequestsProps) {
  return (
    <>
      {!loading && (
        <div className="admin-review-stats">
          <article className="admin-review-stat-card is-categories">
            <span><FolderOpen size={25} /></span>
            <div>
              <h2>Categories ({categories.length})</h2>
              <p>{categories.length ? "Waiting for admin review." : "No category requests."}</p>
            </div>
            <Sparkles size={19} className="admin-review-stat-sparkle" />
          </article>
          <article className="admin-review-stat-card is-words">
            <span><BookOpen size={25} /></span>
            <div>
              <h2>Words ({words.length})</h2>
              <p>{words.length ? "Waiting for admin review." : "No word requests."}</p>
            </div>
            <Sparkles size={19} className="admin-review-stat-sparkle" />
          </article>
        </div>
      )}

      {loading ? (
        <p className="py-10 text-center text-slate-500">Loading requests…</p>
      ) : (
        <div className="admin-review-pending-grid grid gap-5 lg:grid-cols-2">
          <CategoryReviewRequests categories={categories} busy={busy} ownerEmails={ownerEmails} onModerate={onModerate} />
          <WordReviewRequests words={words} busy={busy} blockedWordId={blockedWordId} ownerEmails={ownerEmails} onModerate={onModerate} />
        </div>
      )}
    </>
  );
}
