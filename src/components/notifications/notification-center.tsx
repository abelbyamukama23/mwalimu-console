"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Shield,
  BookOpen,
  UserCheck,
  X,
  AlertCircle,
  Loader2,
  Mail,
} from "lucide-react";
import { api } from "../../lib/api/client";
import type { PlatformNotification } from "../../types";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: string; text: string; type: "success" | "error" } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.notifications.getUnreadCount();
      setUnreadCount(res.unread_count);
    } catch {
      // Ignore background refresh errors
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await api.notifications.list();
      setNotifications(res.results);
      const unread = res.results.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // Handle gracefully
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and periodic unread count poll (30s)
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // When opened, fetch latest notification list
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkRead = async (notification: PlatformNotification) => {
    if (notification.is_read) return;
    try {
      await api.notifications.markRead(notification.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Graceful ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Graceful ignore
    }
  };

  const handleAcceptInvite = async (notification: PlatformNotification) => {
    const token = notification.payload?.token;
    if (!token) return;

    setActionLoadingId(notification.id);
    setActionMessage(null);
    try {
      const res = await api.invitations.accept(token);
      setActionMessage({
        id: notification.id,
        text: res.message || "Joined library successfully!",
        type: "success",
      });
      await handleMarkRead(notification);
    } catch (err: any) {
      setActionMessage({
        id: notification.id,
        text: err?.message || "Failed to accept invitation.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineInvite = async (notification: PlatformNotification) => {
    const token = notification.payload?.token;
    if (!token) return;

    setActionLoadingId(notification.id);
    setActionMessage(null);
    try {
      const res = await api.invitations.decline(token);
      setActionMessage({
        id: notification.id,
        text: res.message || "Invitation declined.",
        type: "success",
      });
      await handleMarkRead(notification);
    } catch (err: any) {
      setActionMessage({
        id: notification.id,
        text: err?.message || "Failed to decline invitation.",
        type: "error",
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Group notifications into Today vs Earlier
  const today = new Date().toDateString();
  const todayNotifications = notifications.filter(
    (n) => new Date(n.created_at).toDateString() === today
  );
  const earlierNotifications = notifications.filter(
    (n) => new Date(n.created_at).toDateString() !== today
  );

  const getNotificationIcon = (type: string) => {
    if (type.includes("library_invitation")) {
      return <BookOpen size={14} className="text-accent" />;
    }
    if (type.includes("security") || type.includes("auth")) {
      return <Shield size={14} className="text-amber-500" />;
    }
    if (type.includes("member")) {
      return <UserCheck size={14} className="text-indigo-500" />;
    }
    return <Mail size={14} className="text-ink-secondary" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-white shadow-xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown (DeepSeek aesthetic) */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-xl border border-border bg-surface text-ink shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-surface">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-accent-subtle px-1.5 py-0.2 text-[10px] font-semibold text-accent border border-accent/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline transition-colors"
                >
                  <CheckCheck size={13} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-ink-tertiary hover:text-ink hover:bg-subtle transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-border/60">
            {isLoading && notifications.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-xs text-ink-tertiary">
                <Loader2 size={16} className="animate-spin mr-2 text-accent" />
                Loading updates...
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle text-ink-tertiary mb-2">
                  <Bell size={18} />
                </div>
                <div className="text-xs font-medium text-ink">No notifications yet</div>
                <div className="text-[11px] text-ink-tertiary mt-0.5 max-w-[220px]">
                  Library invitations and security updates will appear here.
                </div>
              </div>
            ) : (
              <>
                {/* Today Section */}
                {todayNotifications.length > 0 && (
                  <div>
                    <div className="bg-canvas/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      Today
                    </div>
                    {todayNotifications.map((n) => renderNotificationItem(n))}
                  </div>
                )}

                {/* Earlier Section */}
                {earlierNotifications.length > 0 && (
                  <div>
                    <div className="bg-canvas/50 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      Earlier
                    </div>
                    {earlierNotifications.map((n) => renderNotificationItem(n))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border bg-surface px-4 py-2 flex items-center justify-between text-[11px] text-ink-tertiary">
            <span>Mwalimu Communications</span>
            <Link
              href="/activity"
              onClick={() => setIsOpen(false)}
              className="font-medium text-accent hover:underline flex items-center gap-1"
            >
              <span>View all activity</span>
              <ExternalLink size={10} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );

  function renderNotificationItem(n: PlatformNotification) {
    const isInvite = n.notification_type.includes("library_invitation") && n.payload?.token;
    const isActionLoading = actionLoadingId === n.id;
    const actionResult = actionMessage?.id === n.id ? actionMessage : null;

    return (
      <div
        key={n.id}
        onClick={() => handleMarkRead(n)}
        className={`p-3.5 transition-colors cursor-pointer text-left ${
          !n.is_read ? "bg-accent/5 hover:bg-accent/8" : "hover:bg-subtle"
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface border border-border">
            {getNotificationIcon(n.notification_type)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-1">
              <span className={`text-xs font-semibold leading-tight truncate ${!n.is_read ? "text-ink" : "text-ink-secondary"}`}>
                {n.title}
              </span>
              {!n.is_read && (
                <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              )}
            </div>

            <p className="mt-1 text-[11px] text-ink-secondary leading-snug line-clamp-2">
              {n.message}
            </p>

            {/* Inline Action for Library Invitations */}
            {isInvite && !actionResult && (
              <div className="mt-2.5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleAcceptInvite(n)}
                  className="inline-flex h-6 items-center justify-center rounded-md bg-accent px-2.5 text-[11px] font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-2xs"
                >
                  {isActionLoading ? <Loader2 size={11} className="animate-spin" /> : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => handleDeclineInvite(n)}
                  className="inline-flex h-6 items-center justify-center rounded-md border border-border bg-surface px-2.5 text-[11px] font-medium text-ink-secondary hover:bg-subtle hover:text-ink disabled:opacity-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            )}

            {/* Action Feedback Message */}
            {actionResult && (
              <div
                className={`mt-2 flex items-center gap-1.5 rounded px-2 py-1 text-[11px] ${
                  actionResult.type === "success"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                }`}
              >
                {actionResult.type === "success" ? <Check size={12} /> : <AlertCircle size={12} />}
                <span>{actionResult.text}</span>
              </div>
            )}

            {/* Timestamp */}
            <div className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-tertiary">
              <Clock size={10} />
              <span>{formatRelativeTime(n.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}
