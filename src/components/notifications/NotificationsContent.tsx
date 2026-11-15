"use client";

import Link from "next/link";
import { ArrowRight, Bell, BookOpen, CheckCheck, Clock3, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useNotificationsController, type NotificationRow } from "@/hooks/useNotificationsController";

export function NotificationsContent() {
  const { notifications, loading, error, refresh, markAllRead, markAsRead, reviewRequest, unreadCount } = useNotificationsController();

  return <div className="notifications-page">
    <header className="notifications-hero mb-6">
      <div className="notifications-heading"><p className="text-sm font-bold text-blue-600">Updates</p><h1 className="page-title mt-1">Notifications</h1><p className="page-intro-description mt-2">Stay updated on word and category requests</p></div>
      <div className="notifications-actions"><Button variant="secondary" onClick={() => void refresh(true)}><RefreshCw size={17} /> Refresh</Button><Button onClick={() => void markAllRead()} disabled={unreadCount === 0}><CheckCheck size={17} /> Mark all read {unreadCount > 0 && <span className="notification-unread-count">{unreadCount}</span>}</Button></div>
    </header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    {loading && notifications.length === 0 ? <div aria-label="Loading notifications" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div> : <div className="notifications-list space-y-3">
      {notifications.map((item, index) => (
        <article key={item.id} className={`notification-card notification-card-${index % 4} ${item.read_at ? "is-read" : "is-unread"}`}>
          {item.read_at ? (
            <div className="notification-main">
              <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
              <NotificationDetails item={item} />
            </div>
          ) : (
            <button type="button" onClick={() => void markAsRead(item)} className="notification-main notification-main-button">
              <span className="notification-icon">{item.entity_type === "category" ? <FolderOpen size={32} /> : <BookOpen size={32} />}</span>
              <NotificationDetails item={item} />
              <span className="notification-unread-dot" aria-label="Unread" />
            </button>
          )}
          {item.kind === "publish_request" && <Link href="/admin" onClick={(event) => void reviewRequest(event, item)} className="notification-review-link">Review <ArrowRight size={18} /></Link>}
        </article>
      ))}
      {notifications.length === 0 && <p className="notifications-empty rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500"><Bell className="mx-auto mb-3 size-8 text-blue-400" />You’re all caught up.</p>}
    </div>}
  </div>;
}

function NotificationDetails({ item }: { item: NotificationRow }) {
  return <span className="min-w-0 flex-1">
    <span className="block font-semibold text-slate-900">{item.title}</span>
    <span className="mt-1 block text-sm text-slate-600">{item.body}</span>
    <time className="notification-time mt-2 block text-xs text-slate-400" dateTime={item.created_at}><Clock3 size={15} />{new Date(item.created_at).toLocaleString()}</time>
  </span>;
}
