"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Globe,
  Lock,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  LayoutGrid,
  List,
  FolderOpen,
} from "lucide-react";
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

function getLibrarySpineColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("physic") || lower.includes("chem") || lower.includes("bio") || lower.includes("sci")) {
    return "bg-emerald-500";
  }
  if (lower.includes("math") || lower.includes("calc") || lower.includes("stat") || lower.includes("tech") || lower.includes("comput")) {
    return "bg-amber-500";
  }
  if (lower.includes("hist") || lower.includes("geo") || lower.includes("social") || lower.includes("law") || lower.includes("econ")) {
    return "bg-blue-500";
  }
  if (lower.includes("eng") || lower.includes("lit") || lower.includes("lang") || lower.includes("french") || lower.includes("swahili") || lower.includes("art")) {
    return "bg-purple-500";
  }
  return "bg-teal-600";
}

export default function LibrariesPage() {
  const router = useRouter();
  const { activeInstitution, activeInstitutionId } = useInstitution();

  const [libraries, setLibraries] = useState<Library[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // View Mode: Grid vs High-Density List
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Libraries</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              Knowledge Libraries
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Curate institutional learning boundaries, textbook repositories, and access tiers.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
          >
            <Plus size={13} />
            <span>New Institutional Library</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-900"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter, Search, and View Controls */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search libraries by name, subject, or code..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
            <Filter size={13} className="text-slate-400" />
            <span>Filter:</span>
          </div>
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
          >
            <option value="all">All Visibilities</option>
            <option value="discoverable">Discoverable to Members</option>
            <option value="restricted">Restricted (RBAC Required)</option>
          </select>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-slate-900 text-white font-medium shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-slate-900 text-white font-medium shadow-xs"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Library Grid / List */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Loading institutional knowledge libraries...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-rose-700">
          <p>{error}</p>
          <button
            onClick={fetchLibraries}
            className="mt-2 h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-accent mb-2">
            <BookOpen size={18} />
          </div>
          <h3 className="text-xs font-semibold text-slate-900">No institutional libraries yet</h3>
          <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-400">
            Create your first library container to begin curating curriculum textbooks,
            study materials, and institutional knowledge bases.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 shadow-xs"
          >
            <Plus size={13} />
            <span>Create First Library</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLibraries.map((lib) => {
            const isDiscoverable = lib.visibility === "discoverable";
            const spineColor = getLibrarySpineColor(lib.name);

            return (
              <div
                key={lib.id}
                onClick={() => router.push(`/libraries/view?id=${lib.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
              >
                {/* Subject Spine Ribbon */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${spineColor}`}
                />

                <div className="pl-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-semibold text-slate-900 group-hover:text-accent transition-colors truncate max-w-[150px]">
                          {lib.name}
                        </h2>
                        <div className="text-[10px] text-slate-400 font-mono">
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
                        <Globe size={10} />
                      ) : (
                        <Lock size={10} />
                      )}
                      <span className="capitalize">{lib.visibility}</span>
                    </span>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-xs text-slate-500 min-h-[32px]">
                    {lib.description || "Curated learning repository for institutional coursework and AI grounding."}
                  </p>

                  {/* Knowledge Shelves & Quick Stats */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                      <span>📁</span>
                      <span>Shelves Available</span>
                    </span>
                    <span>•</span>
                    <span>Click to open</span>
                  </div>
                </div>

                <div
                  className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs pl-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/libraries/view?id=${lib.id}`}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
                    >
                      <FolderOpen size={12} className="text-amber-600" />
                      <span>Open Shelves</span>
                    </Link>
                    <Link
                      href="/access"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      <Lock size={11} />
                      <span>Access</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(lib)}
                      title="Library Settings"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                    >
                      <Settings size={13} />
                    </button>
                    <button
                      onClick={() => setLibraryToDelete(lib)}
                      title="Delete Library"
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density List / Table View */
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Library Container</th>
                  <th className="px-3.5 py-2">Slug</th>
                  <th className="px-3.5 py-2">Access Scope</th>
                  <th className="px-3.5 py-2">Description</th>
                  <th className="px-3.5 py-2">Created</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredLibraries.map((lib) => {
                  const isDiscoverable = lib.visibility === "discoverable";
                  const spineColor = getLibrarySpineColor(lib.name);

                  return (
                    <tr
                      key={lib.id}
                      onClick={() => router.push(`/libraries/view?id=${lib.id}`)}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer group"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-4 w-1 rounded-full ${spineColor}`} />
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <BookOpen size={14} />
                          </div>
                          <div className="font-medium text-slate-900 group-hover:text-accent transition-colors">
                            {lib.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">
                        /{lib.slug}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${
                            isDiscoverable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isDiscoverable ? <Globe size={10} /> : <Lock size={10} />}
                          <span>{lib.visibility}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 truncate max-w-xs text-[11px]">
                        {lib.description || "—"}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-400 whitespace-nowrap text-[11px]">
                        {new Date(lib.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td
                        className="px-3.5 py-2.5 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/libraries/view?id=${lib.id}`}
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                          >
                            <FolderOpen size={11} className="text-amber-600" />
                            <span>Shelves</span>
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(lib)}
                            title="Settings"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                          >
                            <Settings size={13} />
                          </button>
                          <button
                            onClick={() => setLibraryToDelete(lib)}
                            title="Delete"
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Library Modal */}
      {isCreateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isCreating && setIsCreateOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Create Institutional Library
                </h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
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
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
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
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Curricular scope, grade levels, or syllabus details..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1.5">
                  Discovery Visibility
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateVisibility("discoverable")}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      createVisibility === "discoverable"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Globe size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900">Discoverable</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Visible to all enrolled members.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateVisibility("restricted")}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all ${
                      createVisibility === "restricted"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Lock size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900">Restricted</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Explicit access policy grant required.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isUpdating && setLibraryToEdit(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <h3 className="text-sm font-semibold text-slate-900">
                Library Settings: {libraryToEdit.name}
              </h3>
              <button
                onClick={() => setLibraryToEdit(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Library Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Discovery Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) =>
                    setEditVisibility(e.target.value as LibraryVisibility)
                  }
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  <option value="discoverable">Discoverable (Institution Members)</option>
                  <option value="restricted">Restricted (Requires Policy Grant)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setLibraryToEdit(null)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isDeleting && setLibraryToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Delete Library</h3>
                <p className="text-xs text-slate-500">
                  Destructive institutional action.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900">{libraryToDelete.name}</strong>? All
              contained documents, book indexes, and pgvector embeddings will be removed.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLibraryToDelete(null)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-8 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs"
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
