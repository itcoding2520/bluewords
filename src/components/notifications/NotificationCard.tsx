"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { ArrowRight, BookOpen, Clock3, FolderOpen } from "lucide-react";
import type { NotificationRow } from "@/lib/notifications";

export function NotificationCard({
  item,
  index,
  onMarkRead,
  onReviewRequest,
}: {
  item: NotificationRow;
  index: number;
  onMarkRead: (item: NotificationRow) => void;
  onReviewRequest: (event: MouseEvent<HTMLAnchorElement>, item: NotificationRow) => void;
}) {
  return (
    <article className={`notification-card notification-card-${index % 4} ${item.read_at ? "is-read" : "is-unread"}`}>
      {item.read_at ? (
        <div className="notification-main">
          <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
          <NotificationDetails item={item} />
        </div>
      ) : (
        <button type="button" onClick={() => onMarkRead(item)} className="notification-main notification-main-button">
          <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
          <NotificationDetails item={item} />
          <span className="notification-unread-dot" aria-label="Unread" />
        </button>
      )}
      {item.kind === "publish_request" && (
        <Link href="/admin" onClick={(event) => onReviewRequest(event, item)} className="notification-review-link">
          Review <ArrowRight size={18} />
        </Link>
      )}
    </article>
  );
}

function NotificationDetails({ item }: { item: NotificationRow }) {
  return <span className="min-w-0 flex-1">
    <span className="block font-semibold text-slate-900">{item.title}</span>
    <span className="mt-1 block text-sm text-slate-600">{item.body}</span>
    <time className="notification-time mt-2 block text-xs text-slate-400" dateTime={item.created_at}><Clock3 size={15} />{new Date(item.created_at).toLocaleString()}</time>
  </span>;
}
