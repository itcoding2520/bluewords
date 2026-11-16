"use client";

import { Bell, CheckCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AutoDismissMessage } from "@/components/ui/AutoDismissMessage";
import { useNotificationsController } from "@/hooks/useNotificationsController";
import { NotificationCard } from "@/components/notifications/NotificationCard";

export function NotificationsContent() {
  const {
    data: { notifications, unreadCount },
    status: { loading, error },
    actions: { refresh, markAllRead, markAsRead, reviewRequest },
  } = useNotificationsController();

  return <div className="notifications-page">
    <header className="notifications-hero mb-6">
      <div className="notifications-heading"><p className="text-sm font-bold text-blue-600">Updates</p><h1 className="page-title mt-1">Notifications</h1><p className="page-intro-description mt-2">Stay updated on word and category requests</p></div>
      <div className="notifications-actions"><Button variant="secondary" onClick={() => void refresh(true)}><RefreshCw size={17} /> Refresh</Button><Button onClick={() => void markAllRead()} disabled={unreadCount === 0}><CheckCheck size={17} /> Mark all read {unreadCount > 0 && <span className="notification-unread-count">{unreadCount}</span>}</Button></div>
    </header>
    {error && <AutoDismissMessage key={error} variant="error" className="mb-4">{error}</AutoDismissMessage>}
    {loading && notifications.length === 0 ? <div aria-label="Loading notifications" className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />)}</div> : <div className="notifications-list space-y-3">
      {notifications.map((item, index) => (
        <NotificationCard
          key={item.id}
          item={item}
          index={index}
          onMarkRead={(notification) => void markAsRead(notification)}
          onReviewRequest={(event, notification) => void reviewRequest(event, notification)}
        />
      ))}
      {notifications.length === 0 && <p className="notifications-empty rounded-2xl border border-slate-200 bg-white py-12 text-center text-sm text-slate-500"><Bell className="mx-auto mb-3 size-8 text-blue-400" />You’re all caught up.</p>}
    </div>}
  </div>;
}
