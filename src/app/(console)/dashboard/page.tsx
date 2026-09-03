"use client";

import React from "react";
import Link from "next/link";
import {
  Building01Icon,
  UserGroupIcon,
  Book02Icon,
  File01Icon,
  CpuIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  InformationCircleIcon,
} from "hugeicons-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { INSTITUTION_TYPE_LABELS } from "../../../types";

export default function DashboardPage() {
  const { activeInstitution } = useInstitution();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>Workspaces</span>
          <span>/</span>
          <span className="text-ink-secondary">Overview</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              {activeInstitution?.name || "Institutional Overview"}
            </h1>
            <p className="mt-1 text-xs text-ink-secondary">
              Authoritative control plane for this organizational learning workspace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success-fg">
              <CheckmarkCircle01Icon size={14} />
              <span>Status: {activeInstitution?.status || "Active"}</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {activeInstitution
                ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type] ||
                  activeInstitution.institution_type
                : "Organization"}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Active Members</span>
            <UserGroupIcon size={18} className="text-ink-tertiary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">—</span>
            <span className="text-[11px] text-ink-tertiary">Aggregating...</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-tertiary">
            Direct member counts available in People directory.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Knowledge Libraries</span>
            <Book02Icon size={18} className="text-ink-tertiary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">—</span>
            <span className="text-[11px] text-ink-tertiary">Configured</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-tertiary">
            Institutional knowledge containers and access rules.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">Ingested Documents</span>
            <File01Icon size={18} className="text-ink-tertiary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">—</span>
            <span className="text-[11px] text-ink-tertiary">Ready</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-tertiary">
            PDFs, DOCX, and textbooks indexed for retrieval.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-secondary">AI Usage This Month</span>
            <CpuIcon size={18} className="text-ink-tertiary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-ink">—</span>
            <span className="text-[11px] text-ink-tertiary">Tokens</span>
          </div>
          <p className="mt-2 text-[11px] text-ink-tertiary">
            Platform token telemetry ledger active.
          </p>
        </div>
      </div>

      {/* Workspace Profile & Quick Information */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
            <Building01Icon size={18} className="text-accent" />
            <span>Workspace Metadata</span>
          </h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 text-xs">
            <div>
              <dt className="text-ink-tertiary">Institution Name</dt>
              <dd className="font-medium text-ink mt-0.5">{activeInstitution?.name}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">Classification</dt>
              <dd className="font-medium text-ink mt-0.5">
                {activeInstitution
                  ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type]
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">Slug Identifier</dt>
              <dd className="font-mono text-ink mt-0.5">{activeInstitution?.slug}</dd>
            </div>
            <div>
              <dt className="text-ink-tertiary">Tenant ID</dt>
              <dd className="font-mono text-[11px] text-ink-secondary mt-0.5 truncate">
                {activeInstitution?.id}
              </dd>
            </div>
          </dl>

          <div className="mt-6 rounded-lg bg-info-bg/50 border border-info-fg/10 p-3.5 flex items-start gap-2.5">
            <InformationCircleIcon size={16} className="text-info-fg shrink-0 mt-0.5" />
            <p className="text-xs text-ink-secondary leading-relaxed">
              <strong>Phase 2 Foundation Active:</strong> All actions in this console are executed in the context of{" "}
              <code className="text-xs font-mono bg-white px-1 py-0.5 rounded border border-border">
                X-Institution-Id: {activeInstitution?.id}
              </code>
              . The Platform API enforces server-authoritative tenant isolation.
            </p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
          <h2 className="text-sm font-semibold text-ink mb-4">
            Management Workspaces
          </h2>
          <div className="space-y-2">
            <Link
              href="/people"
              className="flex items-center justify-between rounded-lg border border-border p-3 text-xs hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <UserGroupIcon size={16} className="text-accent" />
                <span className="font-medium text-ink">People & Members</span>
              </div>
              <ArrowRight01Icon size={14} className="text-ink-tertiary group-hover:text-ink transition-colors" />
            </Link>

            <Link
              href="/libraries"
              className="flex items-center justify-between rounded-lg border border-border p-3 text-xs hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Book02Icon size={16} className="text-accent" />
                <span className="font-medium text-ink">Knowledge Libraries</span>
              </div>
              <ArrowRight01Icon size={14} className="text-ink-tertiary group-hover:text-ink transition-colors" />
            </Link>

            <Link
              href="/resources"
              className="flex items-center justify-between rounded-lg border border-border p-3 text-xs hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <File01Icon size={16} className="text-accent" />
                <span className="font-medium text-ink">Document Repository</span>
              </div>
              <ArrowRight01Icon size={14} className="text-ink-tertiary group-hover:text-ink transition-colors" />
            </Link>

            <Link
              href="/settings"
              className="flex items-center justify-between rounded-lg border border-border p-3 text-xs hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <Building01Icon size={16} className="text-accent" />
                <span className="font-medium text-ink">Organization Settings</span>
              </div>
              <ArrowRight01Icon size={14} className="text-ink-tertiary group-hover:text-ink transition-colors" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
