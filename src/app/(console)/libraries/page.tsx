"use client";

import React from "react";
import { Book02Icon, InformationCircleIcon } from "hugeicons-react";
import { useInstitution } from "../../../lib/institution/institution-context";

export default function LibrariesPage() {
  const { activeInstitution } = useInstitution();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name}</span>
          <span>/</span>
          <span className="text-ink-secondary">Libraries</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Knowledge Libraries
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Define institutional knowledge containers, discovery visibility, and access boundaries.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
          <Book02Icon size={24} />
        </div>
        <h2 className="text-sm font-semibold text-ink">
          Institutional Knowledge Management
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-ink-secondary leading-relaxed">
          The Platform API supports institutional library CRUD via{" "}
          <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[11px]">
            /api/v1/libraries/
          </code>{" "}
          with scope type <code className="font-mono text-[11px]">institution</code>. Full creation wizard and library catalog UI land in Phase 3.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-info-bg px-3.5 py-2 text-xs text-info-fg">
          <InformationCircleIcon size={16} />
          <span>Scheduled for Phase 3 Implementation</span>
        </div>
      </div>
    </div>
  );
}
