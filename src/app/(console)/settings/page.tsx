"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Globe,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Info,
  RefreshCw,
  Image as ImageIcon,
  Upload,
  Loader2,
} from "lucide-react";
import { useInstitution } from "../../../lib/institution/institution-context";
import { api } from "../../../lib/api/client";
import {
  INSTITUTION_TYPE_LABELS,
  InstitutionContextRegion,
  GeographicUnit,
} from "../../../types";

export default function SettingsPage() {
  const { activeInstitution, refreshInstitutions } = useInstitution();
  const [name, setName] = useState(activeInstitution?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Institutional Branding State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingBadge, setIsUploadingBadge] = useState(false);
  const [isRemovingBadge, setIsRemovingBadge] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [badgeSuccess, setBadgeSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeInstitution) return;

    if (file.size > 2 * 1024 * 1024) {
      setBadgeError("File size exceeds 2MB limit. Please choose a smaller image.");
      return;
    }

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!validTypes.includes(file.type)) {
      setBadgeError("Unsupported format. Allowed: PNG, JPEG, WebP, SVG.");
      return;
    }

    setIsUploadingBadge(true);
    setBadgeError(null);
    setBadgeSuccess(null);
    try {
      await api.institutions.uploadBranding(activeInstitution.id, file);
      await refreshInstitutions();
      setBadgeSuccess("Institutional badge updated successfully.");
      setTimeout(() => setBadgeSuccess(null), 4000);
    } catch (err: any) {
      setBadgeError(err?.message || "Failed to upload institutional badge.");
    } finally {
      setIsUploadingBadge(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveBadge = async () => {
    if (!activeInstitution) return;
    setIsRemovingBadge(true);
    setBadgeError(null);
    setBadgeSuccess(null);
    try {
      await api.institutions.removeBranding(activeInstitution.id);
      await refreshInstitutions();
      setBadgeSuccess("Institutional badge removed.");
      setTimeout(() => setBadgeSuccess(null), 4000);
    } catch (err: any) {
      setBadgeError(err?.message || "Failed to remove badge.");
    } finally {
      setIsRemovingBadge(false);
    }
  };

  // Focus Context Regions State
  const [contextRegions, setContextRegions] = useState<InstitutionContextRegion[]>([]);
  const [geographicUnits, setGeographicUnits] = useState<GeographicUnit[]>([]);
  const [selectedGeoUnitId, setSelectedGeoUnitId] = useState("");
  const [isAddingRegion, setIsAddingRegion] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [regionError, setRegionError] = useState<string | null>(null);
  const [regionSuccess, setRegionSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeInstitution) {
      setName(activeInstitution.name);
      fetchContextRegions();
    }
  }, [activeInstitution?.id]);

  const fetchContextRegions = async () => {
    if (!activeInstitution?.id) return;
    setIsLoadingRegions(true);
    setRegionError(null);
    try {
      const [regionsRes, unitsRes] = await Promise.all([
        api.contextRegions.list(activeInstitution.id),
        api.geographicUnits.list(),
      ]);
      const regionsList = Array.isArray(regionsRes)
        ? regionsRes
        : (regionsRes as any)?.results || [];
      setContextRegions(regionsList);
      const unitsList = Array.isArray(unitsRes)
        ? unitsRes
        : (unitsRes as any)?.results || [];
      setGeographicUnits(unitsList);
    } catch (err: any) {
      setRegionError(err?.message || "Failed to load focus context regions.");
    } finally {
      setIsLoadingRegions(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution) return;
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await api.institutions.update(activeInstitution.id, { name: name.trim() });
      await refreshInstitutions();
      setSuccessMsg("Organization details updated successfully.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddContextRegion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitution?.id || !selectedGeoUnitId) return;
    setIsAddingRegion(true);
    setRegionError(null);
    try {
      await api.contextRegions.create(activeInstitution.id, {
        geographic_unit_id: selectedGeoUnitId,
      });
      setSelectedGeoUnitId("");
      setRegionSuccess("Focus context region added.");
      setTimeout(() => setRegionSuccess(null), 3000);
      fetchContextRegions();
    } catch (err: any) {
      setRegionError(err?.message || "Failed to add context region.");
    } finally {
      setIsAddingRegion(false);
    }
  };

  const handleDeleteContextRegion = async (regionId: string) => {
    if (!activeInstitution?.id) return;
    try {
      await api.contextRegions.delete(activeInstitution.id, regionId);
      setRegionSuccess("Context region removed.");
      setTimeout(() => setRegionSuccess(null), 3000);
      fetchContextRegions();
    } catch (err: any) {
      setRegionError(err?.message || "Failed to delete context region.");
    }
  };

  const safeRegions = Array.isArray(contextRegions) ? contextRegions : [];
  const safeUnits = Array.isArray(geographicUnits) ? geographicUnits : [];

  const handleMovePriority = async (index: number, direction: "up" | "down") => {
    if (!activeInstitution?.id) return;
    const newRegions = [...safeRegions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newRegions.length) return;

    const temp = newRegions[index];
    newRegions[index] = newRegions[targetIndex];
    newRegions[targetIndex] = temp;

    const regionIds = newRegions.map((r) => r.id);
    try {
      await api.contextRegions.reorder(activeInstitution.id, regionIds);
      setContextRegions(newRegions);
    } catch (err: any) {
      setRegionError(err?.message || "Failed to reorder context regions.");
    }
  };

  // Filter out already added geographic units from available options
  const configuredUnitIds = new Set(
    safeRegions
      .map((r) => r.geographic_unit?.id)
      .filter(Boolean)
  );
  const availableUnits = safeUnits.filter((u) => !configuredUnitIds.has(u.id));

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{activeInstitution?.name}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Settings</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
          Organization Settings
        </h1>
        <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
          Configure institutional identity, classification, and regional knowledge adaptation rules.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
          <CheckCircle2 size={15} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
          <AlertCircle size={15} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* General Information */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Building2 size={16} className="text-accent" />
          <span>General Information</span>
        </h2>

        <form onSubmit={handleUpdate} className="space-y-3 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Institution Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 w-full max-w-md rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-0.5">
              Institution Classification (Type)
            </label>
            <div className="text-xs text-slate-900 font-medium">
              {activeInstitution
                ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type]
                : "—"}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Configured during onboarding. Governs platform operational boundary.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-0.5">
              URL Slug
            </label>
            <div className="font-mono text-xs text-slate-600">
              ai-mwalimu.com/inst/{activeInstitution?.slug}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-0.5">
              System Tenant Identifier
            </label>
            <div className="font-mono text-[11px] text-slate-400">
              {activeInstitution?.id}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 shadow-xs"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Institutional Branding Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-accent" />
            <span>Institutional Branding</span>
          </h2>
          <span className="text-[11px] text-slate-400">PNG, JPEG, WebP, SVG up to 2MB</span>
        </div>

        {badgeSuccess && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700">
            <CheckCircle2 size={14} />
            <span>{badgeSuccess}</span>
          </div>
        )}

        {badgeError && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
            <AlertCircle size={14} />
            <span>{badgeError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden shrink-0">
            {activeInstitution?.badge_url ? (
              <img
                src={activeInstitution.badge_url}
                alt={activeInstitution.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 size={24} className="text-slate-400" />
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="text-xs font-medium text-slate-900">Official Badge & Logo</div>
            <p className="text-[11px] text-slate-500">
              Displayed in the navigation bar, console sidebar, and member invitation communications.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                disabled={isUploadingBadge}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
              >
                {isUploadingBadge ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                <span>{activeInstitution?.badge_url ? "Replace Badge" : "Upload Badge"}</span>
              </button>

              {activeInstitution?.badge_url && (
                <button
                  type="button"
                  disabled={isRemovingBadge || isUploadingBadge}
                  onClick={handleRemoveBadge}
                  className="inline-flex h-7 items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2.5 text-xs font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isRemovingBadge ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Focus Context Regions Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-slate-900">
              Focus Context Regions
            </h2>
          </div>
          <button
            onClick={fetchContextRegions}
            disabled={isLoadingRegions}
            title="Refresh regions"
            className="rounded p-1 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RefreshCw size={13} className={isLoadingRegions ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Guidance Callout */}
        <div className="flex items-start gap-2.5 rounded-lg bg-slate-50/80 border border-slate-200 p-3 text-xs text-slate-600">
          <Info size={15} className="text-accent shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Pedagogical Context Prioritization:</strong> Focus context regions prioritize localized curriculum frameworks, national standards, and regional pedagogical adaptations during agent knowledge retrieval.
          </p>
        </div>

        {regionError && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle size={14} />
            <span>{regionError}</span>
          </div>
        )}

        {regionSuccess && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 size={14} />
            <span>{regionSuccess}</span>
          </div>
        )}

        {/* Add Context Region Form */}
        <form onSubmit={handleAddContextRegion} className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <select
            value={selectedGeoUnitId}
            onChange={(e) => setSelectedGeoUnitId(e.target.value)}
            disabled={isAddingRegion || availableUnits.length === 0}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-800 focus:bg-white focus:border-accent focus:outline-none min-w-[220px]"
          >
            <option value="">
              {availableUnits.length === 0
                ? "All available regions configured"
                : "Select Geographic Region / Country"}
            </option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.unit_type.toUpperCase()}) {u.code ? `[${u.code}]` : ""}
              </option>
            ))}
          </select>

          <button
            type="submit"
            disabled={isAddingRegion || !selectedGeoUnitId}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs transition-colors"
          >
            <Plus size={13} />
            <span>{isAddingRegion ? "Adding..." : "Add Region"}</span>
          </button>
        </form>

        {/* Regions Table */}
        <div className="rounded-lg border border-slate-100 overflow-hidden">
          {isLoadingRegions ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Loading focus context regions...
            </div>
          ) : safeRegions.length > 0 ? (
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2 w-16">Priority</th>
                  <th className="px-3.5 py-2">Region Name</th>
                  <th className="px-3.5 py-2">Type</th>
                  <th className="px-3.5 py-2">Code</th>
                  <th className="px-3.5 py-2 text-right">Order & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {safeRegions.map((region, idx) => (
                  <tr key={region.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-3.5 py-2 font-mono text-[11px] text-accent font-semibold">
                      #{idx + 1}
                    </td>
                    <td className="px-3.5 py-2 font-medium text-slate-900">
                      {region.geographic_unit?.name || "Unknown Region"}
                    </td>
                    <td className="px-3.5 py-2 text-slate-500 uppercase text-[10px] font-mono">
                      {region.geographic_unit?.unit_type || "REGION"}
                    </td>
                    <td className="px-3.5 py-2 font-mono text-slate-400 text-[11px]">
                      {region.geographic_unit?.code || "—"}
                    </td>
                    <td className="px-3.5 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleMovePriority(idx, "up")}
                          disabled={idx === 0}
                          title="Increase Priority"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition-colors"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          onClick={() => handleMovePriority(idx, "down")}
                          disabled={idx === safeRegions.length - 1}
                          title="Decrease Priority"
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 transition-colors"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteContextRegion(region.id)}
                          title="Remove Region"
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 ml-1 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              No focus context regions configured yet. Global educational standards will apply.
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-5">
        <h2 className="text-sm font-semibold text-rose-800 mb-1">
          Danger Zone
        </h2>
        <p className="text-xs text-rose-700 leading-relaxed mb-3">
          Archiving or deleting an institution suspends access for all members, libraries, and resources. Only authorized platform administrators may perform this action.
        </p>
        <button
          disabled
          title="Deletion workflow requires explicit secondary authorization"
          className="h-8 rounded-lg border border-rose-300 bg-white px-3 text-xs font-medium text-rose-700 opacity-60 cursor-not-allowed shadow-xs"
        >
          Archive This Institution
        </button>
      </div>
    </div>
  );
}
