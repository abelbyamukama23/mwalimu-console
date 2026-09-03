"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  ExternalLink,
  Code2,
  Users,
  BookOpen,
  Shield,
  Layers,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import { InstitutionalAuditEvent } from "../../../types";
import { formatNotification, FormattedNotification } from "../../../lib/notifications/format";

type CategoryFilter = "all" | "members" | "knowledge" | "security";

export default function NotificationsPage() {
  const { activeInstitution } = useInstitution();
  const [events, setEvents] = useState<InstitutionalAuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!activeInstitution?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      let targetType: string | undefined;
      if (categoryFilter === "members") targetType = "membership";
      else if (categoryFilter === "knowledge") targetType = "resource"; // we also filter in client for library

      const data = await api.institutions.getAuditLogs(activeInstitution.id, {
        search: searchQuery || undefined,
        target_type: targetType,
      });
      setEvents(data.results || []);
      setTotalCount(data.count ?? (data.results ? data.results.length : 0));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeInstitution?.id, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  // Convert raw events to user-friendly notifications
  const formattedNotifications = useMemo(() => {
    let filtered = events;
    if (categoryFilter === "knowledge") {
      filtered = events.filter(
        (e) => e.target_type === "resource" || e.target_type === "library"
      );
    } else if (categoryFilter === "security") {
      filtered = events.filter(
        (e) =>
          e.target_type === "access_policy" ||
          e.target_type === "connection" ||
          e.target_type === "institution"
      );
    }
    return filtered.map(formatNotification);
  }, [events, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Workspaces</span>
          <span>/</span>
          <span>Intelligence</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Notifications</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Notifications & Activity</span>
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Clear, real-time activity updates and member requests for{" "}
              <strong className="text-slate-700">{activeInstitution?.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-emerald-50 px-3 text-xs font-medium text-emerald-700 border border-emerald-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Updates</span>
            </span>

            <button
              onClick={fetchEvents}
              disabled={isLoading}
              title="Refresh notifications"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw
                size={13}
                className={isLoading ? "animate-spin text-slate-400" : "text-slate-600"}
              />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5 shadow-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to fetch notifications</p>
            <p className="mt-0.5 text-rose-600">{error}</p>
          </div>
        </div>
      )}

      {/* Category Pills & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 w-fit">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers size={13} />
            <span>All</span>
          </button>
          <button
            onClick={() => setCategoryFilter("members")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === "members"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users size={13} />
            <span>People & Requests</span>
          </button>
          <button
            onClick={() => setCategoryFilter("knowledge")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === "knowledge"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BookOpen size={13} />
            <span>Books & Libraries</span>
          </button>
          <button
            onClick={() => setCategoryFilter("security")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              categoryFilter === "security"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield size={13} />
            <span>Access & System</span>
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-400 focus:outline-none shadow-xs"
            />
          </div>
          <button
            type="submit"
            className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Notifications Feed */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-slate-600" />
            <span className="text-xs font-semibold text-slate-800">Recent Notifications</span>
          </div>
          <span className="text-xs text-slate-400">
            {formattedNotifications.length} update{formattedNotifications.length === 1 ? "" : "s"}
          </span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-slate-400">
            <div className="animate-pulse">Loading notifications...</div>
          </div>
        ) : formattedNotifications.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {formattedNotifications.map((notif) => {
              const isExpanded = expandedEventId === notif.id;
              const hasMetadata = notif.metadata && Object.keys(notif.metadata).length > 0;

              return (
                <div
                  key={notif.id}
                  className="p-4 sm:p-5 transition-colors hover:bg-slate-50/40"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Notification Category Badge */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border shrink-0 ${notif.badge.bg} ${notif.badge.text} ${notif.badge.border}`}
                      >
                        {notif.badge.label}
                      </span>

                      {/* Main Message Content */}
                      <div className="min-w-0">
                        <h2 className="text-xs font-semibold text-slate-900 leading-snug">
                          {notif.title}
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                          {notif.description}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1 text-slate-600">
                            <User size={11} className="text-slate-400" />
                            <span>{notif.actor}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock size={11} className="text-slate-400" />
                            <span>{notif.timeAgo}</span>
                            <span className="text-slate-300">({notif.timestamp})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side: Action link & Power User toggle */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>{notif.actionLabel || "View"}</span>
                          <ExternalLink size={11} />
                        </Link>
                      )}

                      {hasMetadata && (
                        <button
                          type="button"
                          onClick={() => setExpandedEventId(isExpanded ? null : notif.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 p-1 rounded transition-colors"
                          title="Technical log details"
                        >
                          <Code2 size={12} />
                          <span>{isExpanded ? "Hide Details" : "Details"}</span>
                          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable Technical Log Details */}
                  {isExpanded && hasMetadata && (
                    <div className="mt-3.5 rounded-lg border border-slate-200 bg-slate-50/80 p-3 text-xs">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                        <span>Event ID: {notif.id}</span>
                        {notif.ipAddress && <span>Origin IP: {notif.ipAddress}</span>}
                      </div>
                      <pre className="overflow-x-auto p-2.5 bg-slate-900 text-slate-200 rounded font-mono text-[11px] leading-relaxed">
                        {JSON.stringify(
                          {
                            action_code: notif.rawAction,
                            target_type: notif.rawTargetType,
                            target_name: notif.rawTargetRepr,
                            metadata: notif.metadata,
                          },
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Bell size={18} />
            </div>
            <h3 className="text-xs font-semibold text-slate-800">No notifications found</h3>
            <p className="mt-0.5 text-xs text-slate-400 max-w-sm mx-auto">
              There are no recorded system events or requests in this category yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-emerald-600" />
          <span>All administrative events and requests are recorded securely and immutably.</span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Institution ID: {activeInstitution?.id?.slice(0, 8)}...
        </span>
      </div>
    </div>
  );
}
