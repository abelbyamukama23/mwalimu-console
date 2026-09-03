"use client";

import React, { useState } from "react";
import {
  Building01Icon,
  CheckmarkCircle01Icon,
  Alert02Icon,
} from "hugeicons-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { INSTITUTION_TYPE_LABELS } from "../../../types";

export default function SettingsPage() {
  const { activeInstitution, refreshInstitutions } = useInstitution();
  const [name, setName] = useState(activeInstitution?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const { api } = await import("../../../lib/api/client");
      await api.institutions.update(activeInstitution.id, { name: name.trim() });
      await refreshInstitutions();
      setSuccessMsg("Organization details updated successfully.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name}</span>
          <span>/</span>
          <span className="text-ink-secondary">Settings</span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Organization Settings
        </h1>
        <p className="mt-1 text-xs text-ink-secondary">
          Configure institutional identity, classification, and tenant settings.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-success-bg p-3 text-xs text-success-fg">
          <CheckmarkCircle01Icon size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-md bg-danger-bg p-3 text-xs text-danger-fg">
          <Alert02Icon size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
        <h2 className="text-sm font-semibold text-ink mb-4 flex items-center gap-2">
          <Building01Icon size={18} className="text-accent" />
          <span>General Information</span>
        </h2>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Institution Classification (Type)
            </label>
            <div className="text-xs text-ink-secondary font-medium">
              {activeInstitution
                ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type]
                : "—"}
            </div>
            <p className="text-[11px] text-ink-tertiary mt-0.5">
              Set during registration. Governs workspace metadata.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              URL Slug
            </label>
            <div className="font-mono text-xs text-ink-secondary">
              ai-mwalimu.com/inst/{activeInstitution?.slug}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              System Tenant Identifier
            </label>
            <div className="font-mono text-xs text-ink-tertiary">
              {activeInstitution?.id}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 focus-ring"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-danger-fg/20 bg-danger-bg/20 p-6">
        <h2 className="text-sm font-semibold text-danger-fg mb-2">
          Danger Zone
        </h2>
        <p className="text-xs text-ink-secondary leading-relaxed mb-4">
          Archiving or deleting an institution suspends access for all members, libraries, and resources. Only administrators may perform this action.
        </p>
        <button
          disabled
          title="Deletion confirmation workflow lands in Phase 3"
          className="rounded-md border border-danger-fg/40 bg-surface px-3 py-1.5 text-xs font-medium text-danger-fg opacity-60 cursor-not-allowed"
        >
          Archive This Institution
        </button>
      </div>
    </div>
  );
}
