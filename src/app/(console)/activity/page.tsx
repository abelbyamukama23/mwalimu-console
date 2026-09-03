"use client";

import React, { useEffect, useState } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Terminal,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import { InstitutionalAuditEvent } from "../../../types";

export default function ActivityPage() {
  const { activeInstitution } = useInstitution();
  const [events, setEvents] = useState<InstitutionalAuditEvent[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [actionFilter, setActionFilter] = useState<string>("");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    if (!activeInstitution?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.institutions.getAuditLogs(activeInstitution.id, {
        search: searchQuery || undefined,
        action: actionFilter || undefined,
        target_type: targetTypeFilter || undefined,
      });
      setEvents(data.results || []);
      setTotalCount(data.count ?? (data.results ? data.results.length : 0));
    } catch (err: any) {
      setError(err?.message || "Failed to retrieve audit events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [activeInstitution?.id, actionFilter, targetTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const formatActionName = (action: string) => {
    return action.replace(/_/g, " ").toLowerCase();
  };

  const getActionColor = (action: string) => {
    if (action.includes("deleted") || action.includes("revoked") || action.includes("removed")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (action.includes("created") || action.includes("granted") || action.includes("uploaded")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (action.includes("sync") || action.includes("reindexed")) {
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    }
    return "bg-blue-50 text-blue-700 border-blue-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Workspaces</span>
          <span>/</span>
          <span>Intelligence</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Audit Activity</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              Institutional Audit Ledger
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Append-only, immutable record of all administrative and governance mutations for{" "}
              <strong className="text-slate-700">{activeInstitution?.name}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700 border border-slate-200/60">
              <ShieldCheck size={13} className="text-emerald-600" />
              <span>Tamper-Evident Ledger</span>
            </span>
            <button
              onClick={fetchEvents}
              disabled={isLoading}
              title="Refresh ledger"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : "text-slate-500"} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
        <form
          onSubmit={handleSearchSubmit}
          className="flex flex-col gap-2.5 sm:flex-row sm:items-center justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search target, actor, or metadata..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
              <Filter size={13} className="text-slate-400" />
              <span>Filter:</span>
            </div>

            {/* Target Type Filter */}
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
            >
              <option value="">All Target Types</option>
              <option value="membership">Members</option>
              <option value="library">Libraries</option>
              <option value="resource">Resources</option>
              <option value="connection">Connectors</option>
              <option value="access_policy">Access Policies</option>
              <option value="institution">Institution Settings</option>
            </select>

            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
            >
              <option value="">All Actions</option>
              <option value="MEMBER_ROLE_CHANGED">Member Role Changed</option>
              <option value="MEMBER_STATUS_CHANGED">Member Status Changed</option>
              <option value="MEMBER_REMOVED">Member Removed</option>
              <option value="LIBRARY_CREATED">Library Created</option>
              <option value="LIBRARY_UPDATED">Library Updated</option>
              <option value="LIBRARY_DELETED">Library Deleted</option>
              <option value="RESOURCE_UPLOADED">Resource Uploaded</option>
              <option value="RESOURCE_DELETED">Resource Deleted</option>
              <option value="RESOURCE_REINDEXED">Resource Re-indexed</option>
              <option value="CONNECTION_CREATED">Connection Created</option>
              <option value="CONNECTION_UPDATED">Connection Updated</option>
              <option value="CONNECTION_DELETED">Connection Deleted</option>
              <option value="CONNECTION_SYNC_TRIGGERED">Sync Triggered</option>
              <option value="ACCESS_POLICY_GRANTED">Access Granted</option>
              <option value="ACCESS_POLICY_REVOKED">Access Revoked</option>
              <option value="INSTITUTION_UPDATED">Institution Updated</option>
            </select>

            <button
              type="submit"
              className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              Apply
            </button>
          </div>
        </form>
      </div>

      {/* Events Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 bg-slate-50/80">
          <div className="flex items-center gap-1.5">
            <History size={14} className="text-accent" />
            <span className="text-xs font-semibold text-slate-800">Recorded Mutations</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Showing {events.length} of {totalCount} events
          </span>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-xs text-slate-400">
            Loading immutable audit records...
          </div>
        ) : events.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {events.map((event) => {
              const isExpanded = expandedEventId === event.id;
              const hasMetadata =
                event.metadata && Object.keys(event.metadata).length > 0;

              return (
                <div key={event.id} className="transition-colors hover:bg-slate-50/50">
                  <div
                    onClick={() =>
                      hasMetadata &&
                      setExpandedEventId(isExpanded ? null : event.id)
                    }
                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 gap-2.5 cursor-pointer ${
                      isExpanded ? "bg-slate-50/80" : ""
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-700 mt-0.5 sm:mt-0"
                        title={hasMetadata ? "Toggle metadata details" : "No metadata"}
                      >
                        {hasMetadata ? (
                          isExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )
                        ) : (
                          <div className="w-3.5" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-medium border ${getActionColor(
                              event.action
                            )}`}
                          >
                            {event.action}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                            {event.target_type}
                          </span>
                          <span className="text-xs font-medium text-slate-900 truncate max-w-sm">
                            {event.target_repr}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            <span>{event.actor_email || "System / Automated"}</span>
                          </span>
                          {event.ip_address && (
                            <span className="font-mono text-[10px]">
                              IP: {event.ip_address}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-500">
                        <Clock size={11} className="text-slate-400" />
                        <span>
                          {new Date(event.created_at).toLocaleDateString()}{" "}
                          {new Date(event.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.2">
                        {event.id.slice(0, 8)}...
                      </div>
                    </div>
                  </div>

                  {/* Metadata Details Expansion */}
                  {isExpanded && hasMetadata && (
                    <div className="bg-slate-900 text-slate-100 p-3.5 font-mono text-xs border-t border-slate-200">
                      <div className="flex items-center justify-between mb-2 text-slate-400 text-[10px]">
                        <span className="flex items-center gap-1.5">
                          <Terminal size={12} className="text-accent" />
                          <span>Mutation Metadata Payload</span>
                        </span>
                        <span>Target ID: {event.target_id}</span>
                      </div>
                      <pre className="overflow-x-auto p-2 bg-slate-950 rounded text-slate-300 text-[11px] leading-relaxed">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-14 text-center text-xs text-slate-400">
            No audit records match the current filter criteria.
          </div>
        )}
      </div>

      {/* Security Invariant Guarantee */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-emerald-600" />
          <span>Immutable Audit Ledger Architecture</span>
        </div>
        <p className="leading-relaxed">
          Audit events in Mwalimu are strictly append-only. The database model enforces{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
            ValidationError
          </code>{" "}
          on any attempt to update or delete existing audit rows. Access is restricted exclusively to authenticated institutional administrators.
        </p>
      </div>
    </div>
  );
}
