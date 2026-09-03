"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Calendar,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Activity,
  Users,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import { AIUsageTelemetry } from "../../../types";

type DateRangePreset = "7d" | "30d" | "90d";

export default function UsagePage() {
  const { activeInstitution } = useInstitution();
  const [telemetry, setTelemetry] = useState<AIUsageTelemetry | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>("30d");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const calculateDates = (rangePreset: DateRangePreset) => {
    const end = new Date();
    const start = new Date();
    if (rangePreset === "7d") {
      start.setDate(end.getDate() - 7);
    } else if (rangePreset === "30d") {
      start.setDate(end.getDate() - 30);
    } else if (rangePreset === "90d") {
      start.setDate(end.getDate() - 90);
    }
    const endStr = end.toISOString().split("T")[0];
    const startStr = start.toISOString().split("T")[0];
    return { startStr, endStr };
  };

  const fetchUsage = async (start?: string, end?: string) => {
    if (!activeInstitution?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.institutions.getUsage(activeInstitution.id, {
        start_date: start || startDate || undefined,
        end_date: end || endDate || undefined,
      });
      setTelemetry(data);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch AI usage telemetry.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const { startStr, endStr } = calculateDates(preset);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchUsage(startStr, endStr);
  }, [activeInstitution?.id, preset]);

  const handlePresetChange = (p: DateRangePreset) => {
    setPreset(p);
    const { startStr, endStr } = calculateDates(p);
    setStartDate(startStr);
    setEndDate(endStr);
    fetchUsage(startStr, endStr);
  };

  const formatTokens = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const summary = telemetry?.summary;
  const totalTokens = summary?.total_tokens ?? 0;
  const totalRuns = summary?.total_runs ?? 0;
  const completedRuns = summary?.completed_runs ?? 0;
  const failedRuns = summary?.failed_runs ?? 0;
  const successRate =
    totalRuns > 0 ? ((completedRuns / totalRuns) * 100).toFixed(1) : "100.0";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Workspaces</span>
          <span>/</span>
          <span>Intelligence</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">AI Usage</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              AI Usage & Telemetry
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Authoritative token consumption and agent execution metrics for{" "}
              <strong className="text-slate-700">{activeInstitution?.name}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Range Selector */}
            <div className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-medium shadow-xs">
              {(["7d", "30d", "90d"] as DateRangePreset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePresetChange(p)}
                  className={`rounded-md px-2.5 py-1 text-xs transition-colors ${
                    preset === p
                      ? "bg-slate-900 text-white font-medium"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  Last {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchUsage()}
              disabled={isLoading}
              title="Refresh telemetry"
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

      {/* Summary KPI Cards (DeepSeek card layout) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Total Tokens Consumed
            </span>
            <Cpu size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : formatTokens(totalTokens)}
            </span>
            <span className="text-xs text-slate-500 font-normal">Tokens</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Input: {formatTokens(summary?.prompt_tokens)}</span>
            <span>·</span>
            <span>Output: {formatTokens(summary?.completion_tokens)}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Agent Executions
            </span>
            <Activity size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : totalRuns.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-normal">Total Runs</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center gap-2">
            <span className="text-emerald-600 font-medium">
              {completedRuns} completed
            </span>
            {failedRuns > 0 && (
              <>
                <span>·</span>
                <span className="text-rose-600 font-medium">
                  {failedRuns} failed
                </span>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active AI Users
            </span>
            <Users size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : summary?.active_users ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-normal">Unique Members</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Executed learning and retrieval tasks
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Execution Success Rate
            </span>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : `${successRate}%`}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              Reliability
            </span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Completed without agent timeout or error
          </p>
        </div>
      </div>

      {/* Daily Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Daily Consumption Timeline</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily aggregation of prompt tokens, completion tokens, and agent runs.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {startDate} → {endDate}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Aggregating telemetry timeline...
          </div>
        ) : telemetry?.timeline && telemetry.timeline.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Date</th>
                  <th className="px-3.5 py-2 text-right">Prompt Tokens</th>
                  <th className="px-3.5 py-2 text-right">Completion Tokens</th>
                  <th className="px-3.5 py-2 text-right">Total Tokens</th>
                  <th className="px-3.5 py-2 text-right">Agent Runs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {telemetry.timeline.map((point) => (
                  <tr key={point.date} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-2 font-mono text-slate-900 font-medium">
                      {point.date}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                      {point.prompt_tokens.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                      {point.completion_tokens.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                      {point.total_tokens.toLocaleString()}
                    </td>
                    <td className="px-3.5 py-2 text-right font-mono text-accent font-medium">
                      {point.total_runs}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200">
            No agent run activity recorded within this date range.
          </div>
        )}
      </div>

      {/* Top Consumers Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Top AI Consumers (Institutional Members)
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Breakdown of usage across students, teachers, and staff members.
        </p>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Loading consumers...
          </div>
        ) : telemetry?.top_users && telemetry.top_users.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Member Email</th>
                  <th className="px-3.5 py-2">User ID</th>
                  <th className="px-3.5 py-2 text-right">Executions</th>
                  <th className="px-3.5 py-2 text-right">Total Tokens</th>
                  <th className="px-3.5 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {telemetry.top_users.map((user) => {
                  const share =
                    totalTokens > 0
                      ? ((user.total_tokens / totalTokens) * 100).toFixed(1)
                      : "0.0";
                  return (
                    <tr key={user.user_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-2 font-medium text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-3.5 py-2 font-mono text-[11px] text-slate-400 truncate max-w-[160px]">
                        {user.user_id}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                        {user.total_runs}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                        {user.total_tokens.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2 text-right font-medium text-accent">
                        {share}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200">
            No member-level executions recorded.
          </div>
        )}
      </div>

      {/* Architecture Disclosure Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600">
        <div className="font-semibold text-slate-900 mb-1">
          Server-Authoritative Telemetry Guarantee
        </div>
        <p className="leading-relaxed">
          Token metrics are aggregated directly in PostgreSQL using database-level{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
            Sum
          </code>{" "}
          and{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
            TruncDate
          </code>{" "}
          functions on the authoritative{" "}
          <code className="bg-white px-1 py-0.5 rounded border border-slate-200 font-mono text-[11px] text-slate-800">
            AgentRunRecord
          </code>{" "}
          table. Telemetry reflects genuine model generation costs without client-side approximation.
        </p>
      </div>
    </div>
  );
}
