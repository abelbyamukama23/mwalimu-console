"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Book02Icon,
  PlusSignIcon,
  Search01Icon,
  FilterIcon,
  Globe02Icon,
  LockKeyIcon,
  Settings01Icon,
  Delete02Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  File01Icon,
} from "hugeicons-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import type { Library, LibraryVisibility } from "../../../types";

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LibrariesPage() {
  const { activeInstitution, activeInstitutionId } = useInstitution();

  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [createDescription, setCreateDescription] = useState("");
  const [createVisibility, setCreateVisibility] = useState<LibraryVisibility>("restricted");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [libraryToEdit, setLibraryToEdit] = useState<Library | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<LibraryVisibility>("restricted");
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete Modal
  const [libraryToDelete, setLibraryToDelete] = useState<Library | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLibraries = useCallback(async () => {
    if (!activeInstitutionId) {
      setLibraries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.libraries.list({
        institution_id: activeInstitutionId,
      });
      setLibraries(res.results);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Unable to load institutional libraries.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  // Create handler
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName.trim()) return;
    setIsCreating(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const newLib = await api.libraries.create({
        name: createName.trim(),
        slug: createSlug.trim() || generateSlug(createName),
        description: createDescription.trim(),
        visibility: createVisibility,
        institution_id: activeInstitutionId || undefined,
      });
      setLibraries((prev) => [newLib, ...prev]);
      setActionSuccess(`Knowledge library "${newLib.name}" created successfully.`);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCreateDescription("");
      setCreateVisibility("restricted");
      setIsSlugCustomized(false);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to create library.");
    } finally {
      setIsCreating(false);
    }
  };

  // Edit handler
  const handleOpenEdit = (lib: Library) => {
    setLibraryToEdit(lib);
    setEditName(lib.name);
    setEditDescription(lib.description || "");
    setEditVisibility(lib.visibility);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryToEdit) return;
    setIsUpdating(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await api.libraries.update(libraryToEdit.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        visibility: editVisibility,
      });
      setLibraries((prev) =>
        prev.map((l) => (l.id === libraryToEdit.id ? updated : l))
      );
      setActionSuccess(`Library "${updated.name}" updated successfully.`);
      setLibraryToEdit(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update library.");
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!libraryToDelete) return;
    setIsDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.libraries.delete(libraryToDelete.id);
      setLibraries((prev) => prev.filter((l) => l.id !== libraryToDelete.id));
      setActionSuccess(`Deleted library "${libraryToDelete.name}".`);
      setLibraryToDelete(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete library.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredLibraries = useMemo(() => {
    return libraries.filter((lib) => {
      const matchesSearch =
        lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVis =
        visibilityFilter === "all" || lib.visibility === visibilityFilter;
      return matchesSearch && matchesVis;
    });
  }, [libraries, searchQuery, visibilityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-ink-secondary">Libraries</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              Knowledge Libraries
            </h1>
            <p className="mt-1 text-xs text-ink-secondary">
              Curate institutional learning boundaries, textbook repositories, and access tiers.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-ring"
          >
            <PlusSignIcon size={16} />
            <span>New Institutional Library</span>
          </button>
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

      {/* Filter and Search Bar */}
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
            placeholder="Search libraries by name or topic..."
            className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-secondary">
            <FilterIcon size={14} className="text-ink-tertiary" />
            <select
              value={visibilityFilter}
              onChange={(e) => setVisibilityFilter(e.target.value)}
              className="border-none bg-transparent p-0 text-xs text-ink focus:outline-none"
            >
              <option value="all">All Visibilities</option>
              <option value="discoverable">Discoverable to Members</option>
              <option value="restricted">Restricted (RBAC Policy Required)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Library Grid */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-ink-secondary">
          Loading institutional knowledge libraries...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-danger-fg">
          <p>{error}</p>
          <button
            onClick={fetchLibraries}
            className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs text-white"
          >
            Retry
          </button>
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <Book02Icon size={24} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No institutional libraries yet</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-tertiary">
            Create your first library container to begin curating curriculum textbooks,
            study materials, and institutional knowledge bases.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <PlusSignIcon size={16} />
            <span>Create First Library</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLibraries.map((lib) => {
            const isDiscoverable = lib.visibility === "discoverable";
            return (
              <div
                key={lib.id}
                className="flex flex-col justify-between rounded-xl border border-border bg-surface p-5 shadow-xs hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-accent font-semibold">
                        <Book02Icon size={18} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-ink truncate max-w-[180px]">
                          {lib.name}
                        </h2>
                        <div className="text-[10px] text-ink-tertiary font-mono">
                          /{lib.slug}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        isDiscoverable
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {isDiscoverable ? (
                        <Globe02Icon size={12} />
                      ) : (
                        <LockKeyIcon size={12} />
                      )}
                      <span className="capitalize">{lib.visibility}</span>
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs text-ink-secondary min-h-[32px]">
                    {lib.description || "No description provided for this library."}
                  </p>
                </div>

                <div className="mt-5 border-t border-border pt-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                    >
                      <File01Icon size={14} />
                      <span>Documents</span>
                    </Link>
                    <Link
                      href="/access"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-secondary hover:text-ink"
                    >
                      <LockKeyIcon size={14} />
                      <span>Access</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(lib)}
                      title="Library Settings"
                      className="rounded p-1 text-ink-tertiary hover:bg-slate-100 hover:text-ink transition-colors"
                    >
                      <Settings01Icon size={15} />
                    </button>
                    <button
                      onClick={() => setLibraryToDelete(lib)}
                      title="Delete Library"
                      className="rounded p-1 text-ink-tertiary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Delete02Icon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Library Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isCreating && setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Book02Icon size={18} className="text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  Create Institutional Library
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-ink-tertiary hover:text-ink"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Library Name
                </label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCreateName(val);
                    if (!isSlugCustomized) {
                      setCreateSlug(generateSlug(val));
                    }
                  }}
                  placeholder="e.g. Senior 4 Mathematics, Faculty Curriculum"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Slug Identifier
                </label>
                <input
                  type="text"
                  required
                  value={createSlug}
                  onChange={(e) => {
                    setIsSlugCustomized(true);
                    setCreateSlug(generateSlug(e.target.value));
                  }}
                  placeholder="senior-4-math"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs font-mono text-ink placeholder:text-ink-tertiary focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Curricular scope, grade levels, or syllabus details..."
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Discovery Visibility
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCreateVisibility("discoverable")}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all ${
                      createVisibility === "discoverable"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border hover:bg-slate-50"
                    }`}
                  >
                    <Globe02Icon size={16} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-ink">Discoverable</div>
                      <div className="text-[10px] text-ink-tertiary mt-0.5 leading-tight">
                        Visible to all enrolled members of this institution.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateVisibility("restricted")}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-all ${
                      createVisibility === "restricted"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border hover:bg-slate-50"
                    }`}
                  >
                    <LockKeyIcon size={16} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-ink">Restricted</div>
                      <div className="text-[10px] text-ink-tertiary mt-0.5 leading-tight">
                        Explicit access policy grant required to access.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Library"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Library Modal */}
      {libraryToEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isUpdating && setLibraryToEdit(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <h3 className="text-sm font-semibold text-ink">
                Library Settings: {libraryToEdit.name}
              </h3>
              <button
                onClick={() => setLibraryToEdit(null)}
                className="text-ink-tertiary hover:text-ink"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Library Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">
                  Discovery Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) =>
                    setEditVisibility(e.target.value as LibraryVisibility)
                  }
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                >
                  <option value="discoverable">Discoverable (Institution Members)</option>
                  <option value="restricted">Restricted (Requires Policy Grant)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setLibraryToEdit(null)}
                  className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {isUpdating ? "Saving..." : "Save Settings"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {libraryToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isDeleting && setLibraryToDelete(null)}
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
                <h3 className="text-sm font-semibold text-ink">Delete Library</h3>
                <p className="text-xs text-ink-secondary">
                  Destructive institutional action.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-ink">{libraryToDelete.name}</strong>? All
              contained documents, book indexes, and pgvector embeddings will be removed.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLibraryToDelete(null)}
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
