import { BookOpen, Check, FolderOpen, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CategoryAvatar } from "@/components/vocabulary/CategoryAvatar";
import { formatDateTime } from "@/lib/formatDate";
import type { AdminReviewSubmission } from "@/lib/admin-review-types";

type ReviewTable = "community_categories" | "community_words";
type ReviewDecision = "published" | "rejected";

interface AdminReviewPendingRequestsProps {
  categories: AdminReviewSubmission[];
  words: AdminReviewSubmission[];
  loading: boolean;
  busy: string | null;
  blockedWordId: string | null;
  ownerEmails: Record<string, string>;
  onModerate: (table: ReviewTable, id: string, status: ReviewDecision) => void | Promise<void>;
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
          <CategoryRequests
            categories={categories}
            busy={busy}
            ownerEmails={ownerEmails}
            onModerate={onModerate}
          />
          <WordRequests
            words={words}
            busy={busy}
            blockedWordId={blockedWordId}
            ownerEmails={ownerEmails}
            onModerate={onModerate}
          />
        </div>
      )}
    </>
  );
}

function CategoryRequests({
  categories,
  busy,
  ownerEmails,
  onModerate,
}: Pick<AdminReviewPendingRequestsProps, "categories" | "busy" | "ownerEmails" | "onModerate">) {
  return (
    <section className="admin-review-pending-card is-categories">
      <div className="admin-review-section-title">
        <FolderOpen size={20} />
        <h2>Category requests</h2>
        <span>{categories.length}</span>
      </div>
      {categories.length === 0 ? (
        <div className="admin-review-empty">
          <FolderOpen size={42} />
          <p>No category requests.</p>
          <span>New community category submissions will appear here.</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {categories.map((item) => (
            <article key={item.id} className="admin-review-request-row">
              <div className="flex items-center gap-3">
                <CategoryAvatar name={item.name ?? ""} imagePath={item.image_path} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    By {ownerEmails[item.owner_id] ?? "Loading author…"} · Submitted {formatDateTime(item.created_at)}
                  </p>
                </div>
              </div>
              <RequestDecisionButtons
                table="community_categories"
                id={item.id}
                busy={busy}
                onModerate={onModerate}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function WordRequests({
  words,
  busy,
  blockedWordId,
  ownerEmails,
  onModerate,
}: Pick<AdminReviewPendingRequestsProps, "words" | "busy" | "blockedWordId" | "ownerEmails" | "onModerate">) {
  return (
    <section className="admin-review-pending-card is-words">
      <div className="admin-review-section-title">
        <BookOpen size={20} />
        <h2>Word requests</h2>
        <span>{words.length}</span>
      </div>
      {words.length === 0 ? (
        <div className="admin-review-empty">
          <BookOpen size={42} />
          <p>No word requests.</p>
          <span>New vocabulary submissions will appear here.</span>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {words.map((item) => (
            <article key={item.id} className="admin-review-request-row">
              <p className="font-semibold text-slate-900">{item.word}</p>
              <p className="mt-1 text-sm text-slate-600">{item.meaning}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <CategoryAvatar name={item.category_name ?? ""} imagePath={item.category_image_path} colorClass="bg-slate-200" />
                {item.category_name}
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Requested by {ownerEmails[item.owner_id] ?? "Loading author…"} · Submitted {formatDateTime(item.created_at)}
              </p>
              <p className={`mt-2 text-xs font-medium ${item.category_status === "published" ? "text-emerald-700" : "text-amber-700"}`}>
                Category: {item.category_status === "published" ? "Approved" : item.category_status === "rejected" ? "Rejected" : "Waiting for approval"}
              </p>
              {blockedWordId === item.id && item.category_status !== "published" && (
                <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  {item.category_status === "rejected"
                    ? `Category “${item.category_name}” was rejected. Review or restore that category before approving this word.`
                    : `Approve category “${item.category_name}” before approving this word.`}
                </p>
              )}
              <RequestDecisionButtons
                table="community_words"
                id={item.id}
                busy={busy}
                onModerate={onModerate}
              />
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function RequestDecisionButtons({
  table,
  id,
  busy,
  onModerate,
}: {
  table: ReviewTable;
  id: string;
  busy: string | null;
  onModerate: AdminReviewPendingRequestsProps["onModerate"];
}) {
  return (
    <div className="mt-3 flex gap-2">
      <Button onClick={() => void onModerate(table, id, "published")} disabled={busy === id}>
        <Check size={15} /> Approve
      </Button>
      <Button variant="secondary" onClick={() => void onModerate(table, id, "rejected")} disabled={busy === id}>
        <X size={15} /> Reject
      </Button>
    </div>
  );
}
