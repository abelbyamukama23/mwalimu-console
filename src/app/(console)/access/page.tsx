"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  LockKeyIcon,
  PlusSignIcon,
  Search01Icon,
  FilterIcon,
  Delete02Icon,
  Alert02Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
  Book02Icon,
  UserIcon,
  Shield01Icon,
  SecurityCheckIcon,
} from "hugeicons-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import type {
  Library,
  LibraryAccessPolicy,
  LibraryAccessRole,
  Membership,
} from "../../../types";

const ACCESS_ROLE_OPTIONS: Array<{ value: LibraryAccessRole; label: string }> = [
  { value: "student", label: "Student (Read Access)" },
  { value: "teacher", label: "Teacher (Read & Assign)" },
  { value: "administrator", label: "Administrator (Manage)" },
];

export default function AccessPage() {
  const { activeInstitution, activeInstitutionId } = useInstitution();

  // Libraries state
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");
  const [isLibrariesLoading, setIsLibrariesLoading] = useState(true);

  // Institution members (for the grant picker)
  const [memberships, setMemberships] = useState<Membership[]>([]);

  // Access policies state
  const [policies, setPolicies] = useState<LibraryAccessPolicy[]>([]);
  const [isPoliciesLoading, setIsPoliciesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Grant Modal
  const [isGrantOpen, setIsGrantOpen] = useState(false);
  const [grantUserId, setGrantUserId] = useState("");
  const [grantRole, setGrantRole] = useState<LibraryAccessRole>("student");
  const [isGranting, setIsGranting] = useState(false);

  // Revoke Confirmation Modal
  const [policyToRevoke, setPolicyToRevoke] = useState<LibraryAccessPolicy | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Mutation in-flight tracker
  const [mutatingPolicyId, setMutatingPolicyId] = useState<string | null>(null);

  // 1. Fetch libraries & members for active institution
  const fetchLibrariesAndMembers = useCallback(async () => {
    if (!activeInstitutionId) {
      setLibraries([]);
      setSelectedLibraryId("");
      setMemberships([]);
      setIsLibrariesLoading(false);
      return;
    }

    setIsLibrariesLoading(true);
    try {
      const [libRes, memRes] = await Promise.all([
        api.libraries.list({ institution_id: activeInstitutionId }),
        api.memberships.list({ institution_id: activeInstitutionId }),
      ]);
      setLibraries(libRes.results);
      setMemberships(memRes.results.filter((m) => m.status === "active"));

      if (libRes.results.length > 0) {
        setSelectedLibraryId((prev) =>
          libRes.results.some((l) => l.id === prev) ? prev : libRes.results[0].id
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
    fetchLibrariesAndMembers();
  }, [fetchLibrariesAndMembers]);

  // 2. Fetch policies for selected library
  const fetchPolicies = useCallback(async () => {
    if (!selectedLibraryId) {
      setPolicies([]);
      setIsPoliciesLoading(false);
      return;
    }

    setIsPoliciesLoading(true);
    setError(null);
    try {
      const res = await api.accessPolicies.list(selectedLibraryId);
      setPolicies(res.results);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load access policies for this library.");
      }
    } finally {
      setIsPoliciesLoading(false);
    }
  }, [selectedLibraryId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  // 3. Grant access handler
  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibraryId || !grantUserId) return;

    setIsGranting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const newPolicy = await api.accessPolicies.grant(selectedLibraryId, {
        user_id: grantUserId,
        role: grantRole,
      });
      setPolicies((prev) => [newPolicy, ...prev]);
      setActionSuccess(`Access granted to ${newPolicy.user.email} (${grantRole}).`);
      setIsGrantOpen(false);
      setGrantUserId("");
      setGrantRole("student");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to grant access policy.");
    } finally {
      setIsGranting(false);
    }
  };

  // 4. Update policy role
  const handleRoleChange = async (policyId: string, newRole: LibraryAccessRole) => {
    if (!selectedLibraryId) return;
    setMutatingPolicyId(policyId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await api.accessPolicies.update(selectedLibraryId, policyId, {
        role: newRole,
      });
      setPolicies((prev) => prev.map((p) => (p.id === policyId ? updated : p)));
      setActionSuccess(`Policy updated to ${newRole}.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update role grant.");
    } finally {
      setMutatingPolicyId(null);
    }
  };

  // 5. Revoke access handler
  const handleConfirmRevoke = async () => {
    if (!selectedLibraryId || !policyToRevoke) return;
    setIsRevoking(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.accessPolicies.revoke(selectedLibraryId, policyToRevoke.id);
      setPolicies((prev) => prev.filter((p) => p.id !== policyToRevoke.id));
      setActionSuccess(`Revoked access for ${policyToRevoke.user.email}.`);
      setPolicyToRevoke(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to revoke access.");
    } finally {
      setIsRevoking(false);
    }
  };

  // Filtered policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch = p.user.email
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || p.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [policies, searchQuery, roleFilter]);

  // Available members to grant (exclude those who already have a policy)
  const availableMembers = useMemo(() => {
    const grantedUserIds = new Set(policies.map((p) => p.user.id));
    return memberships.filter((m) => !grantedUserIds.has(m.user.id));
  }, [memberships, policies]);

  const selectedLibrary = libraries.find((l) => l.id === selectedLibraryId);

  const getRoleBadgeStyle = (role: LibraryAccessRole) => {
    switch (role) {
      case "administrator":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "teacher":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-ink-tertiary">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-ink-secondary">Access</span>
        </div>
        <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-ink">
              Library Access & RBAC
            </h1>
            <p className="mt-1 text-xs text-ink-secondary">
              Grant and govern role-based access permissions for institutional knowledge containers.
            </p>
          </div>
          {selectedLibraryId && (
            <button
              onClick={() => setIsGrantOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover focus-ring"
            >
              <PlusSignIcon size={16} />
              <span>Grant Member Access</span>
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
                Selected Knowledge Container
              </div>
              <div className="text-[11px] text-ink-tertiary">
                Choose the library whose access policies you want to govern.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLibrariesLoading ? (
              <span className="text-xs text-ink-tertiary">Loading libraries...</span>
            ) : libraries.length === 0 ? (
              <span className="text-xs text-amber-600">
                No libraries found. Create an institutional library first.
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
              placeholder="Filter granted members by email..."
              className="w-full rounded-md border border-border bg-surface pl-9 pr-3 py-2 text-xs text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-ink-secondary">
              <FilterIcon size={14} className="text-ink-tertiary" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border-none bg-transparent p-0 text-xs text-ink focus:outline-none"
              >
                <option value="all">All Granted Roles</option>
                <option value="student">Students</option>
                <option value="teacher">Teachers</option>
                <option value="administrator">Administrators</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Policies Table */}
      {!selectedLibraryId ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center text-xs text-ink-tertiary">
          Select or create an institutional library to inspect its access policies.
        </div>
      ) : isPoliciesLoading ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-ink-secondary">
          Loading access policies for {selectedLibrary?.name}...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center text-xs text-danger-fg">
          <p>{error}</p>
          <button
            onClick={fetchPolicies}
            className="mt-3 rounded-md bg-accent px-3 py-1.5 text-xs text-white"
          >
            Retry
          </button>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent mb-3">
            <LockKeyIcon size={24} />
          </div>
          <h3 className="text-sm font-semibold text-ink">No individual access policies</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-ink-tertiary">
            {selectedLibrary?.visibility === "discoverable"
              ? "This library is discoverable to all active members of this institution. You can grant specific elevated roles below."
              : "This library is restricted. Only members with an explicit access policy granted below can access it."}
          </p>
          <button
            onClick={() => setIsGrantOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-accent-hover"
          >
            <PlusSignIcon size={16} />
            <span>Grant Access Policy</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-slate-50/50 text-[11px] font-semibold text-ink-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Granted Member</th>
                  <th className="px-4 py-3">Access Role</th>
                  <th className="px-4 py-3">Granted Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPolicies.map((policy) => {
                  const isMutating = mutatingPolicyId === policy.id;
                  return (
                    <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-ink-secondary font-medium">
                            <UserIcon size={14} />
                          </div>
                          <div>
                            <div className="font-medium text-ink">
                              {policy.user.email}
                            </div>
                            <div className="text-[10px] text-ink-tertiary font-mono">
                              User ID: {policy.user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <select
                          disabled={isMutating}
                          value={policy.role}
                          onChange={(e) =>
                            handleRoleChange(
                              policy.id,
                              e.target.value as LibraryAccessRole
                            )
                          }
                          className={`rounded border px-2 py-1 text-[11px] font-medium transition-colors focus-ring ${getRoleBadgeStyle(
                            policy.role
                          )}`}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      </td>
                      <td className="px-4 py-3.5 text-ink-secondary whitespace-nowrap">
                        {new Date(policy.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          disabled={isMutating}
                          onClick={() => setPolicyToRevoke(policy)}
                          title="Revoke access"
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
        </div>
      )}

      {/* Grant Access Modal */}
      {isGrantOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isGranting && setIsGrantOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div className="flex items-center gap-2">
                <LockKeyIcon size={18} className="text-accent" />
                <h3 className="text-sm font-semibold text-ink">
                  Grant Access: {selectedLibrary?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsGrantOpen(false)}
                className="text-ink-tertiary hover:text-ink"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Enrolled Institutional Member
                </label>
                {availableMembers.length === 0 ? (
                  <p className="rounded-md bg-slate-50 p-3 text-xs text-ink-tertiary">
                    All currently active members of this workspace already have an access policy on this library.
                  </p>
                ) : (
                  <select
                    required
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                  >
                    <option value="">Select a member...</option>
                    {availableMembers.map((m) => (
                      <option key={m.user.id} value={m.user.id}>
                        {m.user.email} (Org: {m.role})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Library Role Grant
                </label>
                <select
                  value={grantRole}
                  onChange={(e) =>
                    setGrantRole(e.target.value as LibraryAccessRole)
                  }
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-xs text-ink focus-ring"
                >
                  {ACCESS_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-border pt-4">
                <button
                  type="button"
                  disabled={isGranting}
                  onClick={() => setIsGrantOpen(false)}
                  className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting || !grantUserId}
                  className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white hover:bg-accent-hover disabled:opacity-50"
                >
                  {isGranting ? "Granting..." : "Grant Access Policy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Modal */}
      {policyToRevoke && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={() => !isRevoking && setPolicyToRevoke(null)}
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
                <h3 className="text-sm font-semibold text-ink">Revoke Access</h3>
                <p className="text-xs text-ink-secondary">
                  Revoking access policy grant.
                </p>
              </div>
            </div>

            <p className="text-xs text-ink-secondary leading-relaxed mb-4">
              Are you sure you want to revoke access to{" "}
              <strong className="text-ink">{selectedLibrary?.name}</strong> for{" "}
              <strong className="text-ink">{policyToRevoke.user.email}</strong>?
              If this library is restricted, they will no longer be able to read or query its resources.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setPolicyToRevoke(null)}
                className="rounded-md border border-border px-3.5 py-2 text-xs font-medium text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevoke}
                className="rounded-md bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {isRevoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
