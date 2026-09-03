"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  User,
  Building2,
} from "lucide-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import {
  getInstitutionConfig,
  getRoleLabel,
} from "../../../lib/institution/classification";
import type { Membership, MembershipRole, MembershipStatus } from "../../../types";

const STATUS_OPTIONS: Array<{ value: MembershipStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

export default function PeoplePage() {
  const { activeInstitution, activeInstitutionId } = useInstitution();

  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Destructive removal state
  const [memberToRemove, setMemberToRemove] = useState<Membership | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // In-flight mutation tracker
  const [mutatingId, setMutatingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!activeInstitutionId) {
      setMemberships([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.memberships.list({
        institution_id: activeInstitutionId,
      });
      setMemberships(res.results);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load members directory.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeInstitutionId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Role mutation
  const handleRoleChange = async (membershipId: string, newRole: MembershipRole) => {
    setMutatingId(membershipId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await api.memberships.update(membershipId, { role: newRole });
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? { ...m, role: updated.role } : m))
      );
      setActionSuccess(`Role updated to ${newRole}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update role.";
      setActionError(msg);
    } finally {
      setMutatingId(null);
    }
  };

  // Status mutation
  const handleStatusChange = async (
    membershipId: string,
    newStatus: MembershipStatus
  ) => {
    setMutatingId(membershipId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await api.memberships.update(membershipId, { status: newStatus });
      setMemberships((prev) =>
        prev.map((m) =>
          m.id === membershipId ? { ...m, status: updated.status } : m
        )
      );
      setActionSuccess(`Status updated to ${newStatus}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setActionError(msg);
    } finally {
      setMutatingId(null);
    }
  };

  // Remove confirmation
  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.memberships.delete(memberToRemove.id);
      setMemberships((prev) => prev.filter((m) => m.id !== memberToRemove.id));
      setActionSuccess(`Removed ${memberToRemove.user.email} from institution.`);
      setMemberToRemove(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove member.";
      setActionError(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  // Filtered members
  const filteredMembers = useMemo(() => {
    return memberships.filter((m) => {
      const matchesSearch =
        m.user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      const matchesStatus = statusFilter === "all" || m.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [memberships, searchQuery, roleFilter, statusFilter]);

  const getRoleBadgeStyle = (role: MembershipRole) => {
    switch (role) {
      case "administrator":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "teacher":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "librarian":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getStatusBadgeStyle = (status: MembershipStatus) => {
    switch (status) {
      case "active":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "suspended":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const instConfig = useMemo(
    () => getInstitutionConfig(activeInstitution?.institution_type),
    [activeInstitution?.institution_type]
  );

  const roleOptions: Array<{ value: MembershipRole; label: string }> = useMemo(
    () => [
      {
        value: "administrator",
        label: getRoleLabel("administrator", activeInstitution?.institution_type),
      },
      {
        value: "teacher",
        label: getRoleLabel("teacher", activeInstitution?.institution_type),
      },
      {
        value: "student",
        label: getRoleLabel("student", activeInstitution?.institution_type),
      },
      {
        value: "librarian",
        label: getRoleLabel("librarian", activeInstitution?.institution_type),
      },
    ],
    [activeInstitution?.institution_type]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">People</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              People & Members
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Manage institutional administrators, educators, librarians, and student memberships.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Total Members:{" "}
            <span className="font-semibold text-slate-900">{memberships.length}</span>
          </div>
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

      {/* Workspace Classification Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
              <Building2 size={16} />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
                <span>{activeInstitution?.name || "Workspace"}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${instConfig.badgeStyle}`}
                >
                  {instConfig.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Every member email enrolled in this workspace inherits roles tailored to{" "}
                <strong>{instConfig.title}</strong> ({instConfig.roleLabels.teacher},{" "}
                {instConfig.roleLabels.student}).
              </p>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Classification: {activeInstitution?.institution_type || "school"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search members by email..."
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
            <Filter size={13} className="text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
          >
            <option value="all">All Roles</option>
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Loading institutional members...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-rose-700">
            <p>{error}</p>
            <button
              onClick={fetchMembers}
              className="mt-2 h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
              <Users size={18} />
            </div>
            <h3 className="text-xs font-semibold text-slate-900">No members found</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "No members are currently enrolled in this workspace."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Member</th>
                  <th className="px-3.5 py-2">Role</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Enrolled</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredMembers.map((m) => {
                  const isMutating = mutatingId === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium">
                            <User size={13} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{m.user.email}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {m.user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <select
                          disabled={isMutating}
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value as MembershipRole)
                          }
                          className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none ${getRoleBadgeStyle(
                            m.role
                          )}`}
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <select
                          disabled={isMutating}
                          value={m.status}
                          onChange={(e) =>
                            handleStatusChange(m.id, e.target.value as MembershipStatus)
                          }
                          className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none ${getStatusBadgeStyle(
                            m.status
                          )}`}
                        >
                          {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          disabled={isMutating}
                          onClick={() => setMemberToRemove(m)}
                          title="Remove member"
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Member Removal */}
      {memberToRemove && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isRemoving && setMemberToRemove(null)}
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
                <h3 className="text-sm font-semibold text-slate-900">Remove Member</h3>
                <p className="text-xs text-slate-500">
                  This will revoke their access to this workspace.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-slate-900">{memberToRemove.user.email}</strong>{" "}
              (Role: <span className="capitalize">{memberToRemove.role}</span>)?
              If this member is the sole active administrator, the platform will strictly prevent removal.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setMemberToRemove(null)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="h-8 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isRemoving ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
