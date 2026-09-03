"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  UserGroupIcon,
  Search01Icon,
  FilterIcon,
  Delete02Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  SecurityCheckIcon,
  Shield01Icon,
  UserIcon,
} from "hugeicons-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import type { Membership, MembershipRole, MembershipStatus } from "../../../types";

const ROLE_OPTIONS: Array<{ value: MembershipRole; label: string }> = [
  { value: "administrator", label: "Administrator" },
  { value: "teacher", label: "Teacher" },
  { value: "student", label: "Student" },
  { value: "librarian", label: "Librarian" },
];

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
        setError("Unable to load institutional members.");
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
        prev.map((m) => (m.id === membershipId ? updated : m))
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
  const handleStatusChange = async (membershipId: string, newStatus: MembershipStatus) => {
    setMutatingId(membershipId);
    setActionError(null);
    setActionSuccess(null);
    try {
      const updated = await api.memberships.update(membershipId, { status: newStatus });
      setMemberships((prev) =>
        prev.map((m) => (m.id === membershipId ? updated : m))
      );
      setActionSuccess(`Membership status updated to ${newStatus}.`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-ink-secondary">People</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">People & Members</h1>
            <p className="mt-1 text-xs text-ink-secondary">
              Manage institutional administrators, educators, librarians, and student memberships.
            </p>
          </div>
          <div className="text-xs text-ink-secondary">
            Total Members:{" "}
            <span className="font-semibold text-ink">{memberships.length}</span>
          </div>
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
            placeholder="Search members by email..."
            className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink-secondary">
            <FilterIcon size={14} className="text-ink-tertiary" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border-none bg-transparent p-0 text-xs text-ink focus:outline-none"
            >
              <option value="all">All Roles</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1.5 text-xs text-ink-secondary">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border-none bg-transparent p-0 text-xs text-ink focus:outline-none"
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
      </div>

      {/* Members Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-ink-secondary">
            Loading institutional members...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-danger-fg">
            <p>{error}</p>
            <button
              onClick={fetchMembers}
              className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs text-white"
            >
              Retry
            </button>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-ink-tertiary mb-3">
              <UserGroupIcon size={20} />
            </div>
            <h3 className="text-xs font-semibold text-ink">No members found</h3>
            <p className="mt-1 text-xs text-ink-tertiary">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "No members are currently enrolled in this workspace."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-50/50 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Enrolled</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMembers.map((m) => {
                  const isMutating = mutatingId === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-ink-secondary font-medium">
                            <UserIcon size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-ink">{m.user.email}</div>
                            <div className="text-[10px] text-ink-tertiary font-mono">
                              ID: {m.user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          disabled={isMutating}
                          value={m.role}
                          onChange={(e) =>
                            handleRoleChange(m.id, e.target.value as MembershipRole)
                          }
                          className={`rounded border px-2 py-1 text-[11px] font-medium transition-colors focus-ring ${getRoleBadgeStyle(
                            m.role
                          )}`}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          disabled={isMutating}
                          value={m.status}
                          onChange={(e) =>
                            handleStatusChange(m.id, e.target.value as MembershipStatus)
                          }
                          className={`rounded border px-2 py-1 text-[11px] font-medium transition-colors focus-ring ${getStatusBadgeStyle(
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
                      <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                        {new Date(m.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          disabled={isMutating}
                          onClick={() => setMemberToRemove(m)}
                          title="Remove member"
                          className="rounded p-1 text-ink-tertiary hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-50"
                        >
                          <Delete02Icon size={16} />
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isRemoving && setMemberToRemove(null)}
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
                <h3 className="text-sm font-semibold text-ink">Remove Member</h3>
                <p className="text-xs text-ink-secondary">
                  This will revoke their access to this workspace.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              Are you sure you want to remove{" "}
              <strong className="text-ink">{memberToRemove.user.email}</strong>{" "}
              (Role: <span className="capitalize">{memberToRemove.role}</span>)?
              If this member is the sole active administrator, the platform will strictly prevent removal.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() => setMemberToRemove(null)}
                className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRemoving}
                onClick={handleConfirmRemove}
                className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
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
