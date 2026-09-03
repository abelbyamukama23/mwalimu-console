"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  BookOpen,
  FileText,
  Cpu,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Bell,
  Network,
  RefreshCw,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import { InstitutionOverview, INSTITUTION_TYPE_LABELS } from "../../../types";
import { formatNotification } from "../../../lib/notifications/format";

export default function DashboardPage() {
  const { activeInstitution } = useInstitution();
  const [overview, setOverview] = useState<InstitutionOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    if (!activeInstitution?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.institutions.getOverview(activeInstitution.id);
      setOverview(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load institutional overview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [activeInstitution?.id]);

  const formatTokens = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Workspaces</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Overview</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              {activeInstitution?.name || "Institutional Overview"}
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Authoritative intelligence and operational control plane.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchOverview}
              disabled={isLoading}
              title="Refresh intelligence"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : "text-slate-500"} />
              <span>Refresh</span>
            </button>
            <span
              className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${
                overview?.health.status === "attention_needed"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {overview?.health.status === "attention_needed" ? (
                <AlertCircle size={13} className="text-amber-600" />
              ) : (
                <CheckCircle2 size={13} className="text-emerald-600" />
              )}
              <span>
                {overview?.health.status === "attention_needed"
                  ? "Attention Needed"
                  : "Operational"}
              </span>
            </span>
            <span className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-700 border border-slate-200/60">
              {activeInstitution
                ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type] ||
                  activeInstitution.institution_type
                : "Organization"}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-start gap-2">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Metrics Grid (DeepSeek density & hierarchy) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Members */}
        <Link
          href="/people"
          className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active Members
            </span>
            <Users
              size={16}
              className="text-slate-400 group-hover:text-accent transition-colors"
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : overview?.members.total_active ?? 0}
            </span>
            {overview?.members.pending ? (
              <span className="text-xs text-amber-600 font-medium">
                +{overview.members.pending} pending
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-normal">Enrolled</span>
            )}
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>
              {overview?.members.by_role.teacher ?? 0} teachers · {overview?.members.by_role.student ?? 0} students
            </span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
          </div>
        </Link>

        {/* Knowledge Libraries */}
        <Link
          href="/libraries"
          className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Knowledge Libraries
            </span>
            <BookOpen
              size={16}
              className="text-slate-400 group-hover:text-accent transition-colors"
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : overview?.knowledge.total_libraries ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-normal">Containers</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>
              {overview?.knowledge.restricted_libraries ?? 0} restricted RBAC
            </span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
          </div>
        </Link>

        {/* Ingested Documents */}
        <Link
          href="/libraries"
          className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Indexed Books & Files
            </span>
            <FileText
              size={16}
              className="text-slate-400 group-hover:text-accent transition-colors"
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : overview?.knowledge.total_resources ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              {overview?.knowledge.resources_by_status?.ready ?? 0} ready
            </span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>Organized inside library shelves</span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
          </div>
        </Link>

        {/* AI Tokens 30d */}
        <Link
          href="/usage"
          className="group rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              AI Usage (30d)
            </span>
            <Cpu
              size={16}
              className="text-slate-400 group-hover:text-accent transition-colors"
            />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : formatTokens(overview?.ai_telemetry_30d.total_tokens)}
            </span>
            <span className="text-xs text-slate-500 font-normal">Tokens</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center justify-between">
            <span>
              {overview?.ai_telemetry_30d.total_runs ?? 0} agent executions
            </span>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500" />
          </div>
        </Link>
      </div>

      {/* Health & Operations Row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Workspace Metadata */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Building2 size={16} className="text-accent" />
            <span>Tenant Specifications</span>
          </h2>
          <dl className="divide-y divide-slate-100 text-xs">
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Institution Name</dt>
              <dd className="font-medium text-slate-900">{activeInstitution?.name}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Classification</dt>
              <dd className="font-medium text-slate-900">
                {activeInstitution
                  ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type]
                  : "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Slug Identifier</dt>
              <dd className="font-mono text-slate-700">{activeInstitution?.slug}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Connected Sources</dt>
              <dd className="font-medium text-slate-900">
                {overview?.integrations.total_connections ?? 0} active
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-slate-500">Tenant ID</dt>
              <dd className="font-mono text-[11px] text-slate-400 truncate max-w-[150px]">
                {activeInstitution?.id}
              </dd>
            </div>
          </dl>
          <div className="mt-4 pt-2">
            <Link
              href="/settings"
              className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <span>Manage Organization Settings</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Recent Notifications & Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Bell size={16} className="text-slate-700" />
                <span>Recent Notifications & Activity</span>
              </h2>
              <Link
                href="/activity"
                className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
              >
                <span>View All Notifications</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Loading recent notifications...
              </div>
            ) : overview?.recent_activity && overview.recent_activity.length > 0 ? (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                {overview.recent_activity.map((event) => {
                  const notif = formatNotification(event);
                  return (
                    <div
                      key={notif.id}
                      className="p-3 bg-white hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border shrink-0 ${notif.badge.bg} ${notif.badge.text} ${notif.badge.border}`}
                        >
                          {notif.badge.label}
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {notif.actor} • {notif.timeAgo}
                          </p>
                        </div>
                      </div>

                      {notif.actionUrl && (
                        <Link
                          href={notif.actionUrl}
                          className="text-[11px] font-medium text-slate-600 hover:text-slate-900 shrink-0 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          {notif.actionLabel || "View"}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200">
                No notifications recorded yet for this institution.
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span>Real-time administrative updates and member requests.</span>
            <Link
              href="/connectors"
              className="text-accent hover:underline flex items-center gap-1 font-medium"
            >
              <Network size={12} />
              <span>Inspect Connectors ({overview?.integrations.total_connections ?? 0})</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
