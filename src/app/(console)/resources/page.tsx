"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  File01Icon,
  Upload01Icon,
  Download01Icon,
  Delete02Icon,
  Search01Icon,
  FilterIcon,
  RefreshIcon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Book02Icon,
  CpuIcon,
  Layers01Icon,
  EyeIcon,
} from "hugeicons-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import type {
  Library,
  ProcessingRunStatus,
  ProcessingStage,
  Resource,
  ResourceType,
  ResourceStatus,
} from "../../../types";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const STAGES: Array<{ key: ProcessingStage; label: string }> = [
  { key: "extract", label: "Extract" },
  { key: "normalize", label: "Normalize" },
  { key: "chunk", label: "Chunk" },
  { key: "embed", label: "Embed" },
  { key: "index", label: "Index" },
  { key: "finalize", label: "Finalize" },
];

export default function ResourcesPage() {
  const { activeInstitution, activeInstitutionId } = useInstitution();

  // Libraries state
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");
  const [isLibrariesLoading, setIsLibrariesLoading] = useState(true);

  // Resources state
  const [resources, setResources] = useState<Resource[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Upload Form
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<ResourceType>("pdf");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Processing Inspector
  const [inspectResource, setInspectResource] = useState<Resource | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingRunStatus | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Delete State
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 1. Fetch libraries for active institution
  const fetchLibraries = useCallback(async () => {
    if (!activeInstitutionId) {
      setLibraries([]);
      setSelectedLibraryId("");
      setIsLibrariesLoading(false);
      return;
    }

    setIsLibrariesLoading(true);
    try {
      const res = await api.libraries.list({
        institution_id: activeInstitutionId,
      });
      setLibraries(res.results);
      if (res.results.length > 0) {
        // Keep currently selected if valid, otherwise select first
        setSelectedLibraryId((prev) =>
          res.results.some((l) => l.id === prev) ? prev : res.results[0].id
        );
      } else {
        setSelectedLibraryId("");
      }
    } catch {
      setLibraries([]);
    } finally {
      setIsLibrariesLoading(false);
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  // 2. Fetch resources for selected library
  const fetchResources = useCallback(async () => {
    if (!selectedLibraryId) {
      setResources([]);
      setIsResourcesLoading(false);
      return;
    }

    setIsResourcesLoading(true);
    setError(null);
    try {
      const res = await api.resources.list(selectedLibraryId);
      setResources(res.results);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load documents for this library.");
      }
    } finally {
      setIsResourcesLoading(false);
    }
  }, [selectedLibraryId]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // 3. Upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibraryId || !uploadFile) return;

    setIsUploading(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const formData = new FormData();
      formData.append("name", uploadName.trim() || uploadFile.name);
      formData.append("resource_type", uploadType);
      formData.append("file", uploadFile);

      const created = await api.resources.upload(selectedLibraryId, formData);
      setResources((prev) => [created, ...prev]);
      setActionSuccess(`Document "${created.name}" uploaded and enqueued for indexing.`);
      setIsUploadOpen(false);
      setUploadName("");
      setUploadFile(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // 4. File drag & drop support
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx" || ext === "txt") {
        setUploadType(ext as ResourceType);
      }
    }
  };

  // 5. Inspect processing status
  const handleOpenInspector = async (res: Resource) => {
    setInspectResource(res);
    setIsInspectingLoading(true);
    try {
      const statusData = await api.resources.getProcessingStatus(
        res.library.id,
        res.id
      );
      setProcessingStatus(statusData);
    } catch {
      setProcessingStatus(null);
    } finally {
      setIsInspectingLoading(false);
    }
  };

  const handleTriggerReprocess = async () => {
    if (!inspectResource) return;
    setIsRetrying(true);
    try {
      const updatedRun = await api.resources.triggerReprocess(
        inspectResource.library.id,
        inspectResource.id
      );
      setProcessingStatus(updatedRun);
      setActionSuccess("Processing pipeline re-enqueued.");
      fetchResources();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to trigger re-index.");
    } finally {
      setIsRetrying(false);
    }
  };

  // 6. Download document
  const handleDownload = async (res: Resource) => {
    try {
      await api.resources.download(
        res.library.id,
        res.id,
        res.original_filename || `${res.name}.${res.resource_type}`
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to download file.");
    }
  };

  // 7. Delete document
  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    try {
      await api.resources.delete(resourceToDelete.library.id, resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      setActionSuccess(`Removed document "${resourceToDelete.name}".`);
      setResourceToDelete(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered resources
  const filteredResources = useMemo(() => {
    return resources.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.original_filename?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === "all" || r.resource_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [resources, searchQuery, typeFilter]);

  const getStatusBadgeStyle = (status: ResourceStatus) => {
    switch (status) {
      case "ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "uploading":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const selectedLibrary = libraries.find((l) => l.id === selectedLibraryId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-ink-secondary">Resources</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              Document Repository & Ingestion
            </h1>
            <p className="mt-1 text-xs text-ink-secondary">
              Upload institutional textbooks, syllabi, and PDFs into knowledge containers.
            </p>
          </div>
          {selectedLibraryId && (
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-ring"
            >
              <Upload01Icon size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckmarkCircle01Icon size={16} className="shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <Cancel01Icon size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <Alert02Icon size={16} className="shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-900"
          >
            <Cancel01Icon size={14} />
          </button>
        </div>
      )}

      {/* Library Selector Banner */}
      <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Book02Icon size={18} className="text-accent" />
            <div>
              <div className="text-xs font-semibold text-ink">
                Active Knowledge Container
              </div>
              <div className="text-[11px] text-ink-tertiary">
                Choose which institutional library to view or populate.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLibrariesLoading ? (
              <span className="text-xs text-ink-tertiary">Loading libraries...</span>
            ) : libraries.length === 0 ? (
              <span className="text-xs text-amber-600">
                No libraries found. Create one first in the Libraries workspace.
              </span>
            ) : (
              <select
                value={selectedLibraryId}
                onChange={(e) => setSelectedLibraryId(e.target.value)}
                className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink focus-ring"
              >
                {libraries.map((lib) => (
                  <option key={lib.id} value={lib.id}>
                    {lib.name} ({lib.visibility})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {selectedLibraryId && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search01Icon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or filename..."
              className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-secondary">
              <FilterIcon size={14} className="text-ink-tertiary" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="border-none bg-transparent p-0 text-xs text-ink focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Textbooks</option>
                <option value="docx">DOCX Documents</option>
                <option value="txt">TXT Transcripts</option>
              </select>
            </div>

            <button
              onClick={fetchResources}
              title="Refresh list"
              className="rounded-md border border-border p-2 text-ink-tertiary hover:bg-slate-50 hover:text-ink transition-colors"
            >
              <RefreshIcon size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Resources Table */}
      {!selectedLibraryId ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-xs text-ink-tertiary">
          Select or create an institutional library to manage documents.
        </div>
      ) : isResourcesLoading ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-ink-secondary">
          Loading documents from {selectedLibrary?.name}...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-danger-fg">
          <p>{error}</p>
          <button
            onClick={fetchResources}
            className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs text-white"
          >
            Retry
          </button>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <File01Icon size={24} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No documents uploaded</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-tertiary">
            Upload course textbooks, PDF guides, or reading materials into{" "}
            <strong>{selectedLibrary?.name}</strong>.
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <Upload01Icon size={16} />
            <span>Upload Document</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-50/50 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Format</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Indexing Status</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResources.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-accent font-semibold uppercase text-[10px]">
                          {res.resource_type}
                        </div>
                        <div>
                          <div className="font-medium text-ink truncate max-w-[220px]">
                            {res.name}
                          </div>
                          <div className="text-[10px] text-ink-tertiary truncate max-w-[220px]">
                            {res.original_filename}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 uppercase text-ink-secondary font-mono text-[11px]">
                      {res.resource_type}
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary font-mono text-[11px]">
                      {formatBytes(res.size)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${getStatusBadgeStyle(
                          res.status
                        )}`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                      {new Date(res.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenInspector(res)}
                          title="Inspect Ingestion & Vectors"
                          className="rounded p-1 text-ink-tertiary hover:bg-slate-100 hover:text-accent transition-colors"
                        >
                          <EyeIcon size={16} />
                        </button>
                        <button
                          onClick={() => handleDownload(res)}
                          title="Download Original"
                          className="rounded p-1 text-ink-tertiary hover:bg-slate-100 hover:text-ink transition-colors"
                        >
                          <Download01Icon size={16} />
                        </button>
                        <button
                          onClick={() => setResourceToDelete(res)}
                          title="Delete Document"
                          className="rounded p-1 text-ink-tertiary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Delete02Icon size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {isUploadOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isUploading && setIsUploadOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Upload01Icon size={18} className="text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  Upload Document to {selectedLibrary?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-ink-tertiary hover:text-ink"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-6 text-center hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => document.getElementById("file-input")?.click()}
              >
                <Upload01Icon size={28} className="text-accent mb-2" />
                <div className="text-xs font-medium text-ink">
                  {uploadFile ? uploadFile.name : "Click to browse or drag file here"}
                </div>
                <div className="text-[11px] text-ink-tertiary mt-1">
                  Supported: PDF, DOCX, TXT (up to 100MB)
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setUploadFile(f);
                      if (!uploadName) {
                        setUploadName(f.name.replace(/\.[^/.]+$/, ""));
                      }
                      const ext = f.name.split(".").pop()?.toLowerCase();
                      if (ext === "pdf" || ext === "docx" || ext === "txt") {
                        setUploadType(ext as ResourceType);
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Oxford Secondary Physics Book 4"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Format Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ResourceType)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                >
                  <option value="pdf">PDF Document / Textbook</option>
                  <option value="docx">Microsoft Word (DOCX)</option>
                  <option value="txt">Plain Text (TXT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {isUploading ? "Uploading & Enqueuing..." : "Upload & Begin Ingestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Processing Inspector Modal */}
      {inspectResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isRetrying && setInspectResource(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CpuIcon size={18} className="text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  Pipeline Inspector: {inspectResource.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectResource(null)}
                className="text-ink-tertiary hover:text-ink"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            {isInspectingLoading ? (
              <div className="p-8 text-center text-xs text-ink-secondary">
                Inspecting processing run telemetry...
              </div>
            ) : !processingStatus || processingStatus.status === "NOT_ENQUEUED" ? (
              <div className="p-6 text-center">
                <p className="text-xs text-ink-secondary mb-4">
                  No active processing run found for this document.
                </p>
                <button
                  onClick={handleTriggerReprocess}
                  disabled={isRetrying}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {isRetrying ? "Enqueuing..." : "Enqueue Background Processing"}
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Status Header */}
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3.5 text-xs">
                  <div>
                    <div className="text-ink-tertiary text-[10px]">Processing Status</div>
                    <div className="font-semibold text-ink mt-0.5 capitalize flex items-center gap-2">
                      <span>{processingStatus.status}</span>
                      {processingStatus.status === "ready" && (
                        <CheckmarkCircle01Icon size={14} className="text-emerald-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-ink-tertiary text-[10px]">Indexed Chunks</div>
                    <div className="font-mono font-semibold text-ink mt-0.5">
                      {processingStatus.chunks_count} chunks
                    </div>
                  </div>
                </div>

                {/* Pipeline Stage Progression Stepper */}
                <div>
                  <div className="text-xs font-semibold text-ink mb-2">
                    Pipeline Stages
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center">
                    {STAGES.map((s) => {
                      const isCurrent = processingStatus.current_stage === s.key;
                      const isCompleted =
                        processingStatus.status === "ready" ||
                        (processingStatus.status === "processing" &&
                          STAGES.findIndex((x) => x.key === processingStatus.current_stage) >
                            STAGES.findIndex((x) => x.key === s.key));

                      return (
                        <div
                          key={s.key}
                          className={`rounded p-2 text-[10px] font-medium border ${
                            isCompleted
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : isCurrent
                              ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                              : "border-border bg-slate-50 text-ink-tertiary"
                          }`}
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Error Banner if Failed */}
                {processingStatus.status === "failed" && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                    <div className="font-semibold flex items-center gap-1.5 mb-1">
                      <Alert02Icon size={14} />
                      <span>Ingestion Error ({processingStatus.error_code || "FAILED"})</span>
                    </div>
                    <p className="leading-relaxed font-mono text-[11px]">
                      {processingStatus.error_message || "The extraction worker encountered an unhandled error."}
                    </p>
                  </div>
                )}

                {/* Telemetry Details */}
                <dl className="grid grid-cols-2 gap-2 text-xs border-t border-border pt-3">
                  <div>
                    <dt className="text-ink-tertiary text-[10px]">Run UUID</dt>
                    <dd className="font-mono text-[11px] text-ink truncate">
                      {processingStatus.run_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-ink-tertiary text-[10px]">Updated</dt>
                    <dd className="text-ink-secondary text-[11px]">
                      {processingStatus.updated_at
                        ? new Date(processingStatus.updated_at).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <button
                    onClick={handleTriggerReprocess}
                    disabled={isRetrying}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshIcon size={14} className={isRetrying ? "animate-spin" : ""} />
                    <span>{isRetrying ? "Re-indexing..." : "Re-index Document"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectResource(null)}
                    className="rounded-md bg-accent px-4 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {resourceToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isDeleting && setResourceToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-danger-fg mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-danger-bg">
                <Alert02Icon size={20} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Delete Document</h3>
                <p className="text-xs text-ink-secondary">
                  Removes file binary and all vector embeddings.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-ink">{resourceToDelete.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setResourceToDelete(null)}
                className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
