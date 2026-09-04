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
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import type {
  Library,
  LibraryVisibility,
  LibraryTargetType,
  AcademicUnit,
} from "../../../types";

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
  const [academicUnits, setAcademicUnits] = useState<AcademicUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // View Mode: Grid vs High-Density List
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [createDescription, setCreateDescription] = useState("");
  const [createVisibility, setCreateVisibility] = useState<LibraryVisibility>("restricted");
  const [createTargetType, setCreateTargetType] = useState<LibraryTargetType>("utility");
  const [createAcademicUnitId, setCreateAcademicUnitId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [libraryToEdit, setLibraryToEdit] = useState<Library | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState<LibraryVisibility>("restricted");
  const [editTargetType, setEditTargetType] = useState<LibraryTargetType>("utility");
  const [editAcademicUnitId, setEditAcademicUnitId] = useState("");
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

  const fetchAcademicUnits = useCallback(async () => {
    if (!activeInstitutionId) {
      setAcademicUnits([]);
      return;
    }
    try {
      const units = await api.academicUnits.list(activeInstitutionId);
      setAcademicUnits(units);
    } catch {
      // Graceful fallback
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    fetchLibraries();
    fetchAcademicUnits();
  }, [fetchLibraries, fetchAcademicUnits]);

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
        target_type: createTargetType,
        academic_unit_id:
          createTargetType === "academic_unit" && createAcademicUnitId
            ? createAcademicUnitId
            : null,
      });
      setLibraries((prev) => [newLib, ...prev]);
      setActionSuccess(`Knowledge library "${newLib.name}" created successfully.`);
      setIsCreateOpen(false);
      setCreateName("");
      setCreateSlug("");
      setCreateDescription("");
      setCreateVisibility("restricted");
      setCreateTargetType("utility");
      setCreateAcademicUnitId("");
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
    setEditTargetType(lib.target_type || "utility");
    setEditAcademicUnitId(lib.academic_unit?.id || "");
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
        target_type: editTargetType,
        academic_unit_id:
          editTargetType === "academic_unit" && editAcademicUnitId
            ? editAcademicUnitId
            : null,
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
        lib.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.academic_unit?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.academic_unit?.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesVis =
        visibilityFilter === "all" || lib.visibility === visibilityFilter;
      const matchesTarget =
        targetTypeFilter === "all" || lib.target_type === targetTypeFilter;
      return matchesSearch && matchesVis && matchesTarget;
    });
  }, [libraries, searchQuery, visibilityFilter, targetTypeFilter]);

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
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Knowledge Libraries & Shelves
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
              Curate institutional learning boundaries, class cohort shelves, and universal utility repositories.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>New Institutional Library</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="text-rose-600 hover:text-rose-900 dark:text-rose-400 cursor-pointer"
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
            placeholder="Search libraries by name, subject, cohort..."
            className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
            <Filter size={13} className="text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs text-slate-700 dark:text-slate-200 focus:border-accent focus:outline-none"
          >
            <option value="all">All Targeting</option>
            <option value="utility">Universal Utility</option>
            <option value="academic_unit">Academic Unit Shelves</option>
          </select>

          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs text-slate-700 dark:text-slate-200 focus:border-accent focus:outline-none"
          >
            <option value="all">All Visibilities</option>
            <option value="discoverable">Discoverable to Members</option>
            <option value="restricted">Restricted (Policy Required)</option>
          </select>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              title="List View"
              className={`flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium shadow-xs"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Library Grid / List */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-12 text-center text-xs text-slate-400">
          Loading institutional knowledge libraries...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-12 text-center text-xs text-rose-700 dark:text-rose-400">
          <p>{error}</p>
          <button
            onClick={fetchLibraries}
            className="mt-2 h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : filteredLibraries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-accent mb-2">
            <BookOpen size={18} />
          </div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">No institutional libraries yet</h3>
          <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-400">
            Create your first library container to begin curating curriculum textbooks,
            study materials, and institutional knowledge bases.
          </p>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 transition-colors hover:bg-slate-800 dark:hover:bg-white shadow-xs cursor-pointer"
          >
            <Plus size={13} />
            <span>Create First Library</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredLibraries.map((lib) => {
            const isDiscoverable = lib.visibility === "discoverable";
            const isAcademic = lib.target_type === "academic_unit";
            const spineColor = getLibrarySpineColor(lib.name);

            return (
              <div
                key={lib.id}
                onClick={() => router.push(`/libraries/view?id=${lib.id}`)}
                className="group relative flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-4 sm:p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm transition-all cursor-pointer overflow-hidden"
              >
                {/* Subject Spine Ribbon */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${spineColor}`}
                />

                <div className="pl-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-slate-100 dark:group-hover:text-slate-900 transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <div>
                        <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-accent transition-colors truncate max-w-[150px]">
                          {lib.name}
                        </h2>
                        <div className="text-[10px] text-slate-400 font-mono">
                          /{lib.slug}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          isDiscoverable
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isDiscoverable ? (
                          <Globe size={10} />
                        ) : (
                          <Lock size={10} />
                        )}
                        <span className="capitalize">{lib.visibility}</span>
                      </span>

                      {/* Phase 4 Knowledge Shelf Targeting Badge */}
                      {isAcademic && lib.academic_unit ? (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                          <GraduationCap size={10} />
                          <span>Academic • {lib.academic_unit.code}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                          <Sparkles size={10} />
                          <span>Utility Shelf</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400 min-h-[32px]">
                    {lib.description || "Curated learning repository for institutional coursework and AI grounding."}
                  </p>

                  {/* Knowledge Shelves & Quick Stats */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                      <span>📁</span>
                      <span>Shelves Available</span>
                    </span>
                    <span>•</span>
                    <span>Click to open</span>
                  </div>
                </div>

                <div
                  className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between text-xs pl-1"
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
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    >
                      <Lock size={11} />
                      <span>Access</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(lib)}
                      title="Library Settings"
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      <Settings size={13} />
                    </button>
                    <button
                      onClick={() => setLibraryToDelete(lib)}
                      title="Delete Library"
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Library Container</th>
                  <th className="px-3.5 py-2">Targeting / Shelf Scope</th>
                  <th className="px-3.5 py-2">Slug</th>
                  <th className="px-3.5 py-2">Access Scope</th>
                  <th className="px-3.5 py-2">Description</th>
                  <th className="px-3.5 py-2">Created</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-surface">
                {filteredLibraries.map((lib) => {
                  const isDiscoverable = lib.visibility === "discoverable";
                  const isAcademic = lib.target_type === "academic_unit";
                  const spineColor = getLibrarySpineColor(lib.name);

                  return (
                    <tr
                      key={lib.id}
                      onClick={() => router.push(`/libraries/view?id=${lib.id}`)}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-4 w-1 rounded-full ${spineColor}`} />
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                            <BookOpen size={14} />
                          </div>
                          <div className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-accent transition-colors">
                            {lib.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        {isAcademic && lib.academic_unit ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                            <GraduationCap size={10} />
                            <span>Academic • {lib.academic_unit.code}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
                            <Sparkles size={10} />
                            <span>Utility • All</span>
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-slate-400">
                        /{lib.slug}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${
                            isDiscoverable
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                          }`}
                        >
                          {isDiscoverable ? <Globe size={10} /> : <Lock size={10} />}
                          <span>{lib.visibility}</span>
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-xs text-[11px]">
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
                            className="inline-flex h-7 items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
                          >
                            <FolderOpen size={11} className="text-amber-600" />
                            <span>Shelves</span>
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(lib)}
                            title="Settings"
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          >
                            <Settings size={13} />
                          </button>
                          <button
                            onClick={() => setLibraryToDelete(lib)}
                            title="Delete"
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
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
            className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Create Knowledge Library Container
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A secure logical container for textbooks, syllabus materials, and grounding data.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
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
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              {/* Shelf Scope & Knowledge Targeting */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Knowledge Shelf Scope & Targeting
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCreateTargetType("utility");
                      setCreateAcademicUnitId("");
                    }}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      createTargetType === "utility"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Sparkles size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Universal Utility</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Cross-cohort reference, handbook, or multi-class resources.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreateTargetType("academic_unit");
                      if (academicUnits.length > 0 && !createAcademicUnitId) {
                        setCreateAcademicUnitId(academicUnits[0].id);
                      }
                    }}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      createTargetType === "academic_unit"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <GraduationCap size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Academic Unit Shelf</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Targeted directly to a specific class cohort or grade.
                      </div>
                    </div>
                  </button>
                </div>

                {createTargetType === "academic_unit" && (
                  <div className="mt-2.5 pl-0.5">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Target Academic Cohort / Unit
                    </label>
                    <select
                      value={createAcademicUnitId}
                      onChange={(e) => setCreateAcademicUnitId(e.target.value)}
                      required
                      className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-accent focus:outline-none"
                    >
                      <option value="">Select target class cohort...</option>
                      {academicUnits
                        .filter((u) => u.is_active)
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            [{unit.unit_type.toUpperCase()}] {unit.name} ({unit.code})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Curricular scope, grade levels, or syllabus details..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Discovery Visibility
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateVisibility("discoverable")}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      createVisibility === "discoverable"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Globe size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Discoverable</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Visible to all enrolled members.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCreateVisibility("restricted")}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      createVisibility === "restricted"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Lock size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Restricted</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Explicit access policy grant required.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || (createTargetType === "academic_unit" && !createAcademicUnitId)}
                  className="h-8 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 shadow-xs cursor-pointer"
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
            className="w-full max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3.5">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Library Settings: {libraryToEdit.name}
              </h3>
              <button
                onClick={() => setLibraryToEdit(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Library Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              {/* Scope & Targeting in Edit */}
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Knowledge Shelf Scope & Targeting
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetType("utility");
                      setEditAcademicUnitId("");
                    }}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      editTargetType === "utility"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <Sparkles size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Universal Utility</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Cross-cohort reference or general knowledge.
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditTargetType("academic_unit");
                      if (academicUnits.length > 0 && !editAcademicUnitId) {
                        setEditAcademicUnitId(academicUnits[0].id);
                      }
                    }}
                    className={`flex items-start gap-2 rounded-lg border p-2.5 text-left transition-all cursor-pointer ${
                      editTargetType === "academic_unit"
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <GraduationCap size={14} className="shrink-0 text-accent mt-0.5" />
                    <div>
                      <div className="text-xs font-medium text-slate-900 dark:text-slate-100">Academic Unit Shelf</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                        Targeted directly to a specific cohort.
                      </div>
                    </div>
                  </button>
                </div>

                {editTargetType === "academic_unit" && (
                  <div className="mt-2.5 pl-0.5">
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Target Academic Cohort / Unit
                    </label>
                    <select
                      value={editAcademicUnitId}
                      onChange={(e) => setEditAcademicUnitId(e.target.value)}
                      required
                      className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-accent focus:outline-none"
                    >
                      <option value="">Select target class cohort...</option>
                      {academicUnits
                        .filter((u) => u.is_active)
                        .map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            [{unit.unit_type.toUpperCase()}] {unit.name} ({unit.code})
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Discovery Visibility
                </label>
                <select
                  value={editVisibility}
                  onChange={(e) =>
                    setEditVisibility(e.target.value as LibraryVisibility)
                  }
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                >
                  <option value="discoverable">Discoverable (Institution Members)</option>
                  <option value="restricted">Restricted (Requires Policy Grant)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setLibraryToEdit(null)}
                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || (editTargetType === "academic_unit" && !editAcademicUnitId)}
                  className="h-8 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white disabled:opacity-50 shadow-xs cursor-pointer"
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
            className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Delete Library: {libraryToDelete.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will permanently delete the library and its resources.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900 dark:text-slate-100">{libraryToDelete.name}</strong>?
              All shelves, uploaded documents, chunk vectors, and member access grants associated
              with this container will be removed immediately.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setLibraryToDelete(null)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="h-8 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs cursor-pointer"
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
