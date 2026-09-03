"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Lock,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  BookOpen,
  User,
  Shield,
  ShieldCheck,
} from "lucide-react";
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

  // Mutation trackers
  const [mutatingPolicyId, setMutatingPolicyId] = useState<string | null>(null);

  // Revoke State
  const [policyToRevoke, setPolicyToRevoke] = useState<LibraryAccessPolicy | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // 1. Fetch libraries
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

  // 2. Fetch institution members (for granting)
  useEffect(() => {
    if (!activeInstitutionId) return;
    api.memberships
      .list({ institution_id: activeInstitutionId })
      .then((res) => setMemberships(res.results.filter((m) => m.status === "active")))
      .catch(() => setMemberships([]));
  }, [activeInstitutionId]);

  // 3. Fetch policies for selected library
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

  // 4. Role mutation
  const handleRoleChange = async (
    policyId: string,
    newRole: LibraryAccessRole
  ) => {
    if (!selectedLibraryId) return;
    setMutatingPolicyId(policyId);
    setActionError(null);
    setActionSuccess(null);

    try {
      const updated = await api.accessPolicies.update(
        selectedLibraryId,
        policyId,
        { role: newRole }
      );
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, role: updated.role } : p))
      );
      setActionSuccess(`Access role updated to ${newRole}.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to update access policy.");
    } finally {
      setMutatingPolicyId(null);
    }
  };

  // 5. Grant Access
  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibraryId || !grantUserId) return;

    setIsGranting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const created = await api.accessPolicies.grant(selectedLibraryId, {
        user_id: grantUserId,
        role: grantRole,
      });
      setPolicies((prev) => [created, ...prev]);
      setActionSuccess(`Granted ${grantRole} access to ${created.user.email}.`);
      setIsGrantOpen(false);
      setGrantUserId("");
      setGrantRole("student");
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to grant access policy.");
    } finally {
      setIsGranting(false);
    }
  };

  // 6. Revoke Access
  const handleConfirmRevoke = async () => {
    if (!selectedLibraryId || !policyToRevoke) return;
    setIsRevoking(true);
    setActionError(null);

    try {
      await api.accessPolicies.revoke(selectedLibraryId, policyToRevoke.id);
      setPolicies((prev) => prev.filter((p) => p.id !== policyToRevoke.id));
      setActionSuccess(`Revoked access policy for ${policyToRevoke.user.email}.`);
      setPolicyToRevoke(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to revoke access policy.");
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

  // Members not yet granted on this library
  const availableMembers = useMemo(() => {
    const grantedUserIds = new Set(policies.map((p) => p.user.id));
    return memberships.filter((m) => !grantedUserIds.has(m.user.id));
  }, [memberships, policies]);

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

  const selectedLibrary = libraries.find((l) => l.id === selectedLibraryId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>{activeInstitution?.name || "Workspace"}</span>
          <span>/</span>
          <span className="text-slate-600 font-medium">Access Policies</span>
        </div>
        <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
              Library Access (RBAC)
            </h1>
            <p className="mt-0.5 text-xs sm:text-[13px] text-slate-500">
              Enforce role-based access boundaries on institutional knowledge libraries and courses.
            </p>
          </div>
          {selectedLibraryId && (
            <button
              onClick={() => setIsGrantOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
            >
              <Plus size={13} />
              <span>Grant Member Access</span>
            </button>
          )}
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

      {/* Library Selector Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-accent" />
            <div>
              <div className="text-xs font-semibold text-slate-900">
                Selected Knowledge Container
              </div>
              <div className="text-[11px] text-slate-400">
                Choose the library whose access policies you want to govern.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLibrariesLoading ? (
              <span className="text-xs text-slate-400">Loading libraries...</span>
            ) : libraries.length === 0 ? (
              <span className="text-xs text-amber-600">
                No libraries found. Create an institutional library first.
              </span>
            ) : (
              <select
                value={selectedLibraryId}
                onChange={(e) => setSelectedLibraryId(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 focus:border-accent focus:outline-none"
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
              placeholder="Filter granted members by email..."
              className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
              <Filter size={13} className="text-slate-400" />
              <span>Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
            >
              <option value="all">All Granted Roles</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="administrator">Administrators</option>
            </select>
          </div>
        </div>
      )}

      {/* Policies Table */}
      {!selectedLibraryId ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Select or create an institutional library to inspect its access policies.
        </div>
      ) : isPoliciesLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
          Loading access policies for {selectedLibrary?.name}...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-xs text-rose-700">
          <p>{error}</p>
          <button
            onClick={fetchPolicies}
            className="mt-2 h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
          >
            Retry
          </button>
        </div>
      ) : filteredPolicies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-accent mb-2">
            <Lock size={18} />
          </div>
          <h3 className="text-xs font-semibold text-slate-900">No individual access policies</h3>
          <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-400">
            {selectedLibrary?.visibility === "discoverable"
              ? "This library is discoverable to all active members of this institution. You can grant specific elevated roles below."
              : "This library is restricted. Only members with an explicit access policy granted below can access it."}
          </p>
          <button
            onClick={() => setIsGrantOpen(true)}
            className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white transition-colors hover:bg-slate-800 shadow-xs"
          >
            <Plus size={13} />
            <span>Grant Access Policy</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100">
              <thead className="bg-slate-50/80 text-slate-500 font-medium">
                <tr>
                  <th className="px-3.5 py-2">Granted Member</th>
                  <th className="px-3.5 py-2">Access Role</th>
                  <th className="px-3.5 py-2">Granted Date</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredPolicies.map((policy) => {
                  const isMutating = mutatingPolicyId === policy.id;
                  return (
                    <tr key={policy.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-medium">
                            <User size={13} />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {policy.user.email}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              User ID: {policy.user.id.slice(0, 8)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <select
                          disabled={isMutating}
                          value={policy.role}
                          onChange={(e) =>
                            handleRoleChange(
                              policy.id,
                              e.target.value as LibraryAccessRole
                            )
                          }
                          className={`rounded border px-2 py-0.5 text-[11px] font-medium transition-colors focus:outline-none ${getRoleBadgeStyle(
                            policy.role
                          )}`}
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                        {new Date(policy.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3.5 py-2.5 text-right">
                        <button
                          disabled={isMutating}
                          onClick={() => setPolicyToRevoke(policy)}
                          title="Revoke access"
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
        </div>
      )}

      {/* Grant Access Modal */}
      {isGrantOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isGranting && setIsGrantOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Grant Access: {selectedLibrary?.name}
                </h3>
              </div>
              <button
                onClick={() => setIsGrantOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleGrant} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Enrolled Institutional Member
                </label>
                {availableMembers.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-500">
                    All currently active members of this workspace already have an access policy on this library.
                  </p>
                ) : (
                  <select
                    required
                    value={grantUserId}
                    onChange={(e) => setGrantUserId(e.target.value)}
                    className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
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
                <label className="block font-medium text-slate-700 mb-1">
                  Library Role Grant
                </label>
                <select
                  value={grantRole}
                  onChange={(e) =>
                    setGrantRole(e.target.value as LibraryAccessRole)
                  }
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  {ACCESS_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isGranting}
                  onClick={() => setIsGrantOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting || !grantUserId}
                  className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isRevoking && setPolicyToRevoke(null)}
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
                <h3 className="text-sm font-semibold text-slate-900">Revoke Access</h3>
                <p className="text-xs text-slate-500">
                  Revoking access policy grant.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to revoke access to{" "}
              <strong className="text-slate-900">{selectedLibrary?.name}</strong> for{" "}
              <strong className="text-slate-900">{policyToRevoke.user.email}</strong>?
              If this library is restricted, they will no longer be able to read or query its resources.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isRevoking}
                onClick={() => setPolicyToRevoke(null)}
                className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRevoking}
                onClick={handleConfirmRevoke}
                className="h-8 rounded-lg bg-rose-600 px-3.5 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50 shadow-xs"
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
