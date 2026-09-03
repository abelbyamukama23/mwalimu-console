"use client";

import React, { useEffect, useState } from "react";
import {
  Coins,
  Activity,
  Users,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Zap,
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch AI credit telemetry.");
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

  const formatCredits = (num: number = 0) => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const summary = telemetry?.summary;
  const rawTokens = summary?.total_tokens ?? 0;
  // Convert tokens to Institutional Credits (1 credit per 1,000 processed tokens or direct credit value)
  const totalCredits = (summary as any)?.total_credits ?? Math.max(0, Math.round(rawTokens / 1000));
  const queryCredits =
    (summary as any)?.query_credits ?? Math.max(0, Math.round((summary?.prompt_tokens ?? 0) / 1000));
  const synthesisCredits =
    (summary as any)?.synthesis_credits ??
    Math.max(0, Math.round((summary?.completion_tokens ?? 0) / 1000));

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
          <span className="text-slate-600 font-medium">AI Credits</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight flex items-center gap-2">
              <span>AI Credits & Activity</span>
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Institutional AI credit consumption, agent workloads, and operational efficiency for{" "}
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
                      ? "bg-slate-900 text-white font-medium shadow-xs"
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
              title="Refresh credit telemetry"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin text-slate-400" : "text-slate-500"} />
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: AI Credits Consumed */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              AI Credits Consumed
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Coins size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : formatCredits(totalCredits)}
            </span>
            <span className="text-xs text-slate-500 font-normal">Credits</span>
          </div>
          <div className="mt-2.5 text-xs text-slate-400 flex items-center gap-1.5">
            <span>Query: {formatCredits(queryCredits)}</span>
            <span>·</span>
            <span>Synthesis: {formatCredits(synthesisCredits)}</span>
          </div>
        </div>

        {/* Card 2: Agent Tasks */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Agent Tasks Executed
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Activity size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : totalRuns.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-normal">Tasks Run</span>
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

        {/* Card 3: Active Members */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Active Institutional Members
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Users size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-slate-900 tracking-tight">
              {isLoading ? "—" : summary?.active_users ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-normal">Members Active</span>
          </div>
          <p className="mt-2.5 text-xs text-slate-400">
            Teachers & students running curriculum tasks
          </p>
        </div>

        {/* Card 4: Reliability Rate */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Task Success Rate
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <TrendingUp size={15} />
            </div>
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
            Completed without agent failure or timeout
          </p>
        </div>
      </div>

      {/* Daily Credit Timeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Daily Credit Consumption</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily aggregation of institutional AI credits and agent workload execution.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {startDate} → {endDate}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Aggregating credit consumption timeline...
          </div>
        ) : telemetry?.timeline && telemetry.timeline.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Date</th>
                  <th className="px-3.5 py-2 text-right">Query Credits</th>
                  <th className="px-3.5 py-2 text-right">Synthesis Credits</th>
                  <th className="px-3.5 py-2 text-right">Total Credits</th>
                  <th className="px-3.5 py-2 text-right">Tasks Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {telemetry.timeline.map((point: any) => {
                  const ptCredits = point.total_credits ?? Math.max(0, Math.round(point.total_tokens / 1000));
                  const ptQuery = point.query_credits ?? Math.max(0, Math.round(point.prompt_tokens / 1000));
                  const ptSynth = point.synthesis_credits ?? Math.max(0, Math.round(point.completion_tokens / 1000));

                  return (
                    <tr key={point.date} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-2 font-mono text-slate-900 font-medium">
                        {point.date}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                        {ptQuery.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-slate-600">
                        {ptSynth.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-semibold text-slate-900">
                        {ptCredits.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono text-accent font-medium">
                        {point.total_runs}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400 rounded-lg border border-dashed border-slate-200">
            No agent activity or credit consumption recorded within this date range.
          </div>
        )}
      </div>

      {/* Top Consumers Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Top Consumers (Institutional Members)
        </h2>
        <p className="text-xs text-slate-500 mb-3">
          Breakdown of credit consumption across teachers, students, and staff members.
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
                  <th className="px-3.5 py-2 text-right">Tasks Executed</th>
                  <th className="px-3.5 py-2 text-right">Credits Consumed</th>
                  <th className="px-3.5 py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {telemetry.top_users.map((user: any) => {
                  const userCredits = user.total_credits ?? Math.max(0, Math.round(user.total_tokens / 1000));
                  const share =
                    totalCredits > 0
                      ? ((userCredits / totalCredits) * 100).toFixed(1)
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
                        {userCredits.toLocaleString()}
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
            No member-level credit consumption recorded.
          </div>
        )}
      </div>

      {/* Architecture Disclosure Callout */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs text-slate-600 flex items-start gap-2.5">
        <Zap size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-slate-900 mb-1">
            Institutional AI Credit Unit Guarantee
          </div>
          <p className="leading-relaxed">
            Mwalimu measures computational workload in standardized Institutional AI Credits. Credits account for grounded document retrieval, multi-step curriculum research, textbook vector indexing, and student assessment synthesis aggregated server-side from authoritative execution records.
          </p>
        </div>
      </div>
    </div>
  );
}
