"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  Sparkles,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ChevronRight,
  UserCheck,
  Briefcase,
  Loader2,
  CheckSquare,
} from "lucide-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import {
  AcademicUnit,
  AcademicUnitType,
  ACADEMIC_UNIT_TYPE_LABELS,
  AcademicStructurePreset,
  TeachingAssignment,
  Membership,
} from "../../../types";

export default function AcademicStructurePage() {
  const { activeInstitution, activeInstitutionId } = useInstitution();

  const [units, setUnits] = useState<AcademicUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Selection & Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Single Delete Modal
  const [unitToDelete, setUnitToDelete] = useState<AcademicUnit | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createType, setCreateType] = useState<AcademicUnitType>("grade");
  const [createOrder, setCreateOrder] = useState<number>(1);
  const [isCreating, setIsCreating] = useState(false);

  // Edit Modal
  const [unitToEdit, setUnitToEdit] = useState<AcademicUnit | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editType, setEditType] = useState<AcademicUnitType>("grade");
  const [editOrder, setEditOrder] = useState<number>(1);
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Preset Modal
  const [isPresetOpen, setIsPresetOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<AcademicStructurePreset>("primary");
  const [isApplyingPreset, setIsApplyingPreset] = useState(false);

  // View Members Modal
  const [activeUnitForMembers, setActiveUnitForMembers] = useState<AcademicUnit | null>(null);
  const [cohortTeachers, setCohortTeachers] = useState<TeachingAssignment[]>([]);
  const [cohortStudents, setCohortStudents] = useState<Membership[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchUnits = useCallback(async () => {
    if (!activeInstitutionId) {
      setUnits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.academicUnits.list(activeInstitutionId);
      setUnits(data);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load academic structure.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredUnits.length && filteredUnits.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredUnits.map((u) => u.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Create Academic Unit
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitutionId || !createName.trim() || !createCode.trim()) return;

    setIsCreating(true);
    setActionError(null);
    try {
      const newUnit = await api.academicUnits.create(activeInstitutionId, {
        name: createName.trim(),
        code: createCode.trim().toUpperCase(),
        unit_type: createType,
        order: createOrder,
      });

      setUnits((prev) => [...prev, newUnit].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      setIsCreateOpen(false);
      setCreateName("");
      setCreateCode("");
      setCreateType("grade");
      setCreateOrder(units.length + 1);
      setActionSuccess(`Academic unit "${newUnit.name}" created successfully.`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to create academic unit.";
      setActionError(message);
    } finally {
      setIsCreating(false);
    }
  };

  // Open Edit Modal
  const openEdit = (unit: AcademicUnit) => {
    setUnitToEdit(unit);
    setEditName(unit.name);
    setEditCode(unit.code);
    setEditType(unit.unit_type);
    setEditOrder(unit.order);
    setEditIsActive(unit.is_active);
    setActionError(null);
  };

  // Update Academic Unit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInstitutionId || !unitToEdit) return;

    setIsUpdating(true);
    setActionError(null);
    try {
      const updated = await api.academicUnits.update(
        activeInstitutionId,
        unitToEdit.id,
        {
          name: editName.trim(),
          code: editCode.trim().toUpperCase(),
          unit_type: editType,
          order: editOrder,
          is_active: editIsActive,
        }
      );

      setUnits((prev) =>
        prev
          .map((u) => (u.id === updated.id ? updated : u))
          .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
      );
      setUnitToEdit(null);
      setActionSuccess(`Academic unit "${updated.name}" updated successfully.`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to update academic unit.";
      setActionError(message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Single Delete Academic Unit
  const handleConfirmDeleteSingle = async () => {
    if (!activeInstitutionId || !unitToDelete) return;

    setIsDeletingSingle(true);
    setActionError(null);
    try {
      await api.academicUnits.delete(activeInstitutionId, unitToDelete.id);
      setUnits((prev) => prev.filter((u) => u.id !== unitToDelete.id));
      setSelectedIds((prev) => prev.filter((id) => id !== unitToDelete.id));
      setActionSuccess(`Academic unit "${unitToDelete.name}" removed.`);
      setUnitToDelete(null);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to delete academic unit.";
      setActionError(message);
    } finally {
      setIsDeletingSingle(false);
    }
  };

  // Bulk Delete Academic Units
  const handleConfirmBulkDelete = async () => {
    if (!activeInstitutionId || selectedIds.length === 0) return;

    setIsBulkDeleting(true);
    setActionError(null);
    try {
      const deletePromises = selectedIds.map((id) =>
        api.academicUnits.delete(activeInstitutionId, id)
      );
      await Promise.all(deletePromises);

      const deletedCount = selectedIds.length;
      setUnits((prev) => prev.filter((u) => !selectedIds.includes(u.id)));
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      setActionSuccess(`Successfully deleted ${deletedCount} academic units.`);
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to delete selected academic units.";
      setActionError(message);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Apply Preset
  const handleApplyPreset = async () => {
    if (!activeInstitutionId) return;

    setIsApplyingPreset(true);
    setActionError(null);
    try {
      const result = await api.academicUnits.applyPreset(
        activeInstitutionId,
        selectedPreset
      );
      setUnits(result);
      setSelectedIds([]);
      setIsPresetOpen(false);
      setActionSuccess(
        `Applied standard preset successfully (${result.length} academic units configured).`
      );
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to apply preset.";
      setActionError(message);
    } finally {
      setIsApplyingPreset(false);
    }
  };

  // View Members
  const openMembersModal = async (unit: AcademicUnit) => {
    setActiveUnitForMembers(unit);
    setIsLoadingMembers(true);
    try {
      if (!activeInstitutionId) return;
      const [teachers, students] = await Promise.all([
        api.academicUnits.getTeachers(activeInstitutionId, unit.id),
        api.academicUnits.getStudents(activeInstitutionId, unit.id),
      ]);
      setCohortTeachers(teachers);
      setCohortStudents(students);
    } catch {
      setCohortTeachers([]);
      setCohortStudents([]);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        unit.code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilter === "all" || unit.unit_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [units, searchQuery, typeFilter]);

  // Aggregate stats
  const totalStudentsPlaced = useMemo(
    () => units.reduce((acc, u) => acc + (u.student_count || 0), 0),
    [units]
  );
  const totalTeachersAssigned = useMemo(
    () => units.reduce((acc, u) => acc + (u.teacher_count || 0), 0),
    [units]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Academic-Structure</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-accent" />
              Academic Structure
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500 dark:text-slate-400">
              Manage academic cohorts, classes, grades, and departments for {activeInstitution?.name || "your institution"}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPresetOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Apply Preset</span>
            </button>
            <button
              onClick={() => {
                setCreateOrder(units.length + 1);
                setIsCreateOpen(true);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Academic Unit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action feedback */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/40 p-3 text-xs text-rose-800 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900 dark:text-rose-400 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Cohorts
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{units.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Units
          </p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {units.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Students Placed
          </p>
          <p className="mt-1.5 text-2xl font-bold text-accent">{totalStudentsPlaced}</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-4 shadow-xs">
          <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Teachers Assigned
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-slate-100">{totalTeachersAssigned}</p>
        </div>
      </div>

      {/* Search, Filter & Bulk Action Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by class name or code (e.g. Primary 4, P4)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-700 dark:text-slate-200 focus:border-accent focus:outline-none"
            >
              <option value="all">All Unit Types</option>
              {Object.entries(ACADEMIC_UNIT_TYPE_LABELS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Banner */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 p-2.5 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 pl-1">
              <CheckSquare className="h-4 w-4 text-accent shrink-0" />
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {selectedIds.length} {selectedIds.length === 1 ? "unit" : "units"} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(true)}
                className="inline-flex h-7 items-center gap-1.5 rounded-md bg-rose-600 px-3 text-[11px] font-medium text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
              >
                <Trash2 size={12} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin text-accent" />
            Loading academic structure...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-6 text-center text-xs text-rose-700 dark:text-rose-400">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Unable to load academic structure</p>
          <p className="mt-1 opacity-90">{error}</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-accent mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No academic units found</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search criteria or filters."
              : "Get started quickly by applying a standard school preset or adding your first class."}
          </p>
          <div className="mt-4 flex items-center gap-2.5">
            <button
              onClick={() => setIsPresetOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface px-3 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span>Apply Standard Preset</span>
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Unit Manually</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="w-10 px-3.5 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={filteredUnits.length > 0 && selectedIds.length === filteredUnits.length}
                      onChange={handleToggleSelectAll}
                      className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-900 cursor-pointer"
                      title="Select all units"
                    />
                  </th>
                  <th className="px-3.5 py-2">Code</th>
                  <th className="px-3.5 py-2">Cohort Name</th>
                  <th className="px-3.5 py-2">Type</th>
                  <th className="px-3.5 py-2 text-center">Seq Order</th>
                  <th className="px-3.5 py-2 text-center">Students</th>
                  <th className="px-3.5 py-2 text-center">Teachers</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-surface">
                {filteredUnits.map((unit) => {
                  const isSelected = selectedIds.includes(unit.id);
                  return (
                    <tr
                      key={unit.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        isSelected ? "bg-slate-50/80 dark:bg-slate-800/40" : ""
                      }`}
                      onClick={() => openMembersModal(unit)}
                    >
                      <td className="w-10 px-3.5 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(unit.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-900 cursor-pointer"
                        />
                      </td>
                      <td className="px-3.5 py-2.5 font-semibold text-accent whitespace-nowrap">
                        <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-[11px]">
                          {unit.code}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                        {unit.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {ACADEMIC_UNIT_TYPE_LABELS[unit.unit_type] || unit.unit_type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                        #{unit.order}
                      </td>
                      <td className="px-3.5 py-2.5 text-center text-slate-700 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          {unit.student_count || 0}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-center text-slate-700 dark:text-slate-300 font-medium">
                        <span className="inline-flex items-center gap-1 text-[11px]">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          {unit.teacher_count || 0}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                            unit.is_active
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {unit.is_active ? "Active" : "Archived"}
                        </span>
                      </td>
                      <td
                        className="px-3.5 py-2.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(unit)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                            title="Edit academic unit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setUnitToDelete(unit)}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete academic unit"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* Preset Application Modal */}
      {isPresetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" />
                Apply Academic Preset
              </h2>
              <button
                onClick={() => setIsPresetOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select a standard academic structure preset. Existing matching codes will be preserved and synchronized.
            </p>

            <div className="space-y-2">
              {[
                { id: "primary", label: "Primary (P1 – P7)", desc: "Standard 7-year primary grade progression" },
                { id: "secondary", label: "Secondary (S1 – S6)", desc: "Ordinary and Advanced secondary form levels" },
                { id: "primary_and_secondary", label: "Primary & Secondary (P1 – S6)", desc: "Full K-12 institutional progression" },
                { id: "tertiary", label: "Tertiary (Year 1 – Year 4)", desc: "Higher education undergraduate academic years" },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedPreset === p.id
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={p.id}
                    checked={selectedPreset === p.id}
                    onChange={() => setSelectedPreset(p.id as AcademicStructurePreset)}
                    className="mt-0.5 text-accent focus:ring-accent"
                  />
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{p.label}</p>
                    <p className="text-[11px] text-slate-400">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPresetOpen(false)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPreset}
                disabled={isApplyingPreset}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isApplyingPreset && <Loader2 size={12} className="animate-spin" />}
                <span>Apply Preset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-accent" />
                Add Academic Unit
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cohort / Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary 4 North, Grade 10"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P4N, G10"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 uppercase focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sequence Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createOrder}
                    onChange={(e) => setCreateOrder(parseInt(e.target.value) || 0)}
                    className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Unit Type
                </label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as AcademicUnitType)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-accent focus:outline-none"
                >
                  {Object.entries(ACADEMIC_UNIT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createName.trim() || !createCode.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isCreating && <Loader2 size={12} className="animate-spin" />}
                  <span>Create Cohort</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {unitToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-accent" />
                Edit Academic Unit
              </h2>
              <button
                onClick={() => setUnitToEdit(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 uppercase focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sequence Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                    className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Unit Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as AcademicUnitType)}
                  className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-900 dark:text-slate-100 focus:border-accent focus:outline-none"
                >
                  {Object.entries(ACADEMIC_UNIT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-slate-900"
                />
                <label htmlFor="editIsActive" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  Active (enables knowledge targeting and placement)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUnitToEdit(null)}
                  className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editName.trim() || !editCode.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  {isUpdating && <Loader2 size={12} className="animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Academic Unit Modal */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Delete Academic Unit
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unitToDelete.name} ({unitToDelete.code})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100">{unitToDelete.name}</strong>?
              Learners placed in this cohort and teachers assigned to it will be unlinked. Knowledge shelves targeted to this unit will revert to general utility.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={() => setUnitToDelete(null)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingSingle}
                onClick={handleConfirmDeleteSingle}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isDeletingSingle && <Loader2 size={12} className="animate-spin" />}
                <span>Delete Unit</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 shrink-0">
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Delete {selectedIds.length} Academic Units
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Bulk deletion action
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to permanently delete all <strong className="text-slate-900 dark:text-slate-100">{selectedIds.length}</strong> selected academic units?
              Learner placements and teaching assignments referencing these cohorts will be automatically unlinked.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={() => setIsBulkDeleteOpen(false)}
                className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 px-3 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBulkDeleting}
                onClick={handleConfirmBulkDelete}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
              >
                {isBulkDeleting && <Loader2 size={12} className="animate-spin" />}
                <span>Delete {selectedIds.length} Units</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Cohort Members Drawer / Modal */}
      {activeUnitForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs text-accent font-semibold">
                    {activeUnitForMembers.code}
                  </span>
                  {activeUnitForMembers.name} Cohort
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Placed students and assigned teachers for this academic unit.
                </p>
              </div>
              <button
                onClick={() => setActiveUnitForMembers(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {isLoadingMembers ? (
                <div className="flex h-36 items-center justify-center">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    Loading cohort roster...
                  </div>
                </div>
              ) : (
                <>
                  {/* Assigned Teachers */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <Briefcase className="h-3.5 w-3.5 text-accent" />
                      Assigned Teachers ({cohortTeachers.length})
                    </h3>
                    {cohortTeachers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        No teachers currently assigned to this unit.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface overflow-hidden">
                        {cohortTeachers.map((t) => (
                          <div key={t.id} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">{t.teacher_name}</p>
                              <p className="text-[11px] text-slate-400">{t.teacher_email}</p>
                            </div>
                            {t.subject && (
                              <span className="rounded bg-accent/10 text-accent text-[11px] font-medium px-2 py-0.5 border border-accent/20">
                                {t.subject}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Placed Students */}
                  <div>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-2">
                      <UserCheck className="h-3.5 w-3.5 text-accent" />
                      Placed Students ({cohortStudents.length})
                    </h3>
                    {cohortStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        No learners currently placed in this unit.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface overflow-hidden max-h-56 overflow-y-auto">
                        {cohortStudents.map((s) => (
                          <div key={s.id} className="p-2.5 flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">
                                {s.user.email}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">ID: {s.id.slice(0, 8)}...</p>
                            </div>
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                              Active
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setActiveUnitForMembers(null)}
                className="h-8 rounded-lg bg-slate-900 dark:bg-slate-100 px-3.5 text-xs font-medium text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
