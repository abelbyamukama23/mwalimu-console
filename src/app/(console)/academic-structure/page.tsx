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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink flex items-center gap-2.5">
            <GraduationCap className="h-6 w-6 text-accent" />
            Academic Structure
          </h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Manage academic cohorts, classes, grades, and departments for {activeInstitution?.name || "your institution"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPresetOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors shadow-xs"
          >
            <Sparkles className="h-4 w-4 text-accent" />
            Apply Preset
          </button>
          <button
            onClick={() => {
              setCreateOrder(units.length + 1);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Academic Unit
          </button>
        </div>
      </div>

      {/* Action feedback */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center justify-between rounded-lg border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-600 dark:text-rose-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:opacity-75">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
            Total Cohorts
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{units.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
            Active Units
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {units.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
            Students Placed
          </p>
          <p className="mt-2 text-2xl font-bold text-accent">{totalStudentsPlaced}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-secondary">
            Teachers Assigned
          </p>
          <p className="mt-2 text-2xl font-bold text-ink">{totalTeachersAssigned}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-secondary" />
          <input
            type="text"
            placeholder="Search by class name or code (e.g. Primary 4, P4)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-ink placeholder:text-ink-secondary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-ink-secondary shrink-0" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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

      {/* Main List */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 text-sm text-ink-secondary">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading academic structure...
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-6 text-center text-sm text-rose-600 dark:text-rose-400">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p className="font-semibold">Unable to load academic structure</p>
          <p className="mt-1 text-xs opacity-90">{error}</p>
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-ink">No academic units found</h3>
          <p className="mt-1 max-w-sm text-sm text-ink-secondary">
            {searchQuery || typeFilter !== "all"
              ? "Try adjusting your search criteria or filters."
              : "Get started quickly by applying a standard school preset or adding your first class."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => setIsPresetOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors"
            >
              <Sparkles className="h-4 w-4 text-accent" />
              Apply Standard Preset
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Unit Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-subtle text-xs font-semibold uppercase tracking-wider text-ink-secondary">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Cohort Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-center">Seq Order</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-center">Teachers</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUnits.map((unit) => (
                  <tr
                    key={unit.id}
                    className="hover:bg-subtle/50 transition-colors cursor-pointer"
                    onClick={() => openMembersModal(unit)}
                  >
                    <td className="px-4 py-3 font-semibold text-accent whitespace-nowrap">
                      <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs">
                        {unit.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink">
                      {unit.name}
                    </td>
                    <td className="px-4 py-3 text-ink-secondary whitespace-nowrap">
                      <span className="rounded-full bg-border/40 px-2 py-0.5 text-xs text-ink-secondary">
                        {ACADEMIC_UNIT_TYPE_LABELS[unit.unit_type] || unit.unit_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink-secondary font-mono text-xs">
                      #{unit.order}
                    </td>
                    <td className="px-4 py-3 text-center text-ink font-medium">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Users className="h-3.5 w-3.5 text-ink-secondary" />
                        {unit.student_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-ink font-medium">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <Briefcase className="h-3.5 w-3.5 text-ink-secondary" />
                        {unit.teacher_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          unit.is_active
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-ink-secondary/10 text-ink-secondary"
                        }`}
                      >
                        {unit.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-3 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEdit(unit)}
                        className="rounded p-1.5 text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
                        title="Edit academic unit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Preset Application Modal */}
      {isPresetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Apply Academic Preset
              </h2>
              <button
                onClick={() => setIsPresetOpen(false)}
                className="text-ink-secondary hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-ink-secondary">
              Select a standard academic structure preset. Existing matching codes will be preserved and synchronized.
            </p>

            <div className="space-y-2.5">
              {[
                { id: "primary", label: "Primary (P1 – P7)", desc: "Standard 7-year primary grade progression" },
                { id: "secondary", label: "Secondary (S1 – S6)", desc: "Ordinary and Advanced secondary form levels" },
                { id: "primary_and_secondary", label: "Primary & Secondary (P1 – S6)", desc: "Full K-12 institutional progression" },
                { id: "tertiary", label: "Tertiary (Year 1 – Year 4)", desc: "Higher education undergraduate academic years" },
              ].map((p) => (
                <label
                  key={p.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedPreset === p.id
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-border hover:bg-subtle"
                  }`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={p.id}
                    checked={selectedPreset === p.id}
                    onChange={() => setSelectedPreset(p.id as AcademicStructurePreset)}
                    className="mt-1 text-accent focus:ring-accent"
                  />
                  <div>
                    <p className="text-sm font-semibold text-ink">{p.label}</p>
                    <p className="text-xs text-ink-secondary">{p.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsPresetOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPreset}
                disabled={isApplyingPreset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {isApplyingPreset && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                Apply Preset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-accent" />
                Add Academic Unit
              </h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-ink-secondary hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                  Cohort / Class Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Primary 4 North, Grade 10"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P4N, G10"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink uppercase focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                    Sequence Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createOrder}
                    onChange={(e) => setCreateOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                  Unit Type
                </label>
                <select
                  value={createType}
                  onChange={(e) => setCreateType(e.target.value as AcademicUnitType)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {Object.entries(ACADEMIC_UNIT_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !createName.trim() || !createCode.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {isCreating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Create Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {unitToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-accent" />
                Edit Academic Unit
              </h2>
              <button
                onClick={() => setUnitToEdit(null)}
                className="text-ink-secondary hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                  Cohort Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink uppercase focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                    Sequence Order
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 0)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-ink-secondary mb-1">
                  Unit Type
                </label>
                <select
                  value={editType}
                  onChange={(e) => setEditType(e.target.value as AcademicUnitType)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="editIsActive" className="text-sm font-medium text-ink cursor-pointer">
                  Active (enables knowledge targeting and placement)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setUnitToEdit(null)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editName.trim() || !editCode.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Cohort Members Drawer / Modal */}
      {activeUnitForMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-ink flex items-center gap-2">
                  <span className="rounded bg-accent/10 border border-accent/20 px-2 py-0.5 text-xs text-accent font-semibold">
                    {activeUnitForMembers.code}
                  </span>
                  {activeUnitForMembers.name} Cohort
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Placed students and assigned teachers for this academic unit.
                </p>
              </div>
              <button
                onClick={() => setActiveUnitForMembers(null)}
                className="text-ink-secondary hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 pr-1">
              {isLoadingMembers ? (
                <div className="flex h-36 items-center justify-center">
                  <div className="flex items-center gap-2 text-xs text-ink-secondary">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    Loading cohort roster...
                  </div>
                </div>
              ) : (
                <>
                  {/* Assigned Teachers */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 mb-2">
                      <Briefcase className="h-3.5 w-3.5 text-accent" />
                      Assigned Teachers ({cohortTeachers.length})
                    </h3>
                    {cohortTeachers.length === 0 ? (
                      <p className="text-xs text-ink-secondary italic p-3 rounded-lg bg-subtle border border-border/50">
                        No teachers currently assigned to this unit.
                      </p>
                    ) : (
                      <div className="divide-y divide-border rounded-lg border border-border bg-subtle/30 overflow-hidden">
                        {cohortTeachers.map((t) => (
                          <div key={t.id} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-ink">{t.teacher_name}</p>
                              <p className="text-xs text-ink-secondary">{t.teacher_email}</p>
                            </div>
                            {t.subject && (
                              <span className="rounded bg-accent/10 text-accent text-xs font-medium px-2 py-0.5">
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
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary flex items-center gap-1.5 mb-2">
                      <UserCheck className="h-3.5 w-3.5 text-accent" />
                      Placed Students ({cohortStudents.length})
                    </h3>
                    {cohortStudents.length === 0 ? (
                      <p className="text-xs text-ink-secondary italic p-3 rounded-lg bg-subtle border border-border/50">
                        No learners currently placed in this unit.
                      </p>
                    ) : (
                      <div className="divide-y divide-border rounded-lg border border-border bg-subtle/30 overflow-hidden max-h-56 overflow-y-auto">
                        {cohortStudents.map((s) => (
                          <div key={s.id} className="p-3 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-ink">
                                {s.user.email}
                              </p>
                              <p className="text-xs text-ink-secondary">Member ID: {s.id.slice(0, 8)}</p>
                            </div>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
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

            <div className="flex justify-end pt-3 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setActiveUnitForMembers(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-subtle transition-colors"
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
