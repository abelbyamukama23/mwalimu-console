"use client";

import React from "react";
import { File01Icon, InformationCircleIcon } from "hugeicons-react";
import { useInstitution } from "../../../lib/institution/institution-context";

export default function ResourcesPage() {
  const { activeInstitution } = useInstitution();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name}</span>
          <span>/</span>
          <span className="text-ink-secondary">Resources</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Resources & Documents
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Document repository, PDF/DOCX ingestion pipeline, and extraction status.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
          <File01Icon size={24} />
        </div>
        <h2 className="text-sm font-semibold text-ink">
          Document Ingestion & Pipeline Inspector
        </h2>
        <p className="mx-auto mt-1.5 max-w-md text-xs text-ink-secondary leading-relaxed">
          The backend processing pipeline extracts table of contents, book index entries, page maps, and pgvector embeddings. Drag-and-drop file upload and processing steppers land in Phase 3.
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-info-bg px-3.5 py-2 text-xs text-info-fg">
          <InformationCircleIcon size={16} />
          <span>Scheduled for Phase 3 Implementation</span>
        </div>
      </div>
    </div>
  );
}
