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
  UserPlus,
  Mail,
  Clock,
  Loader2,
  BookOpen,
  Send,
  RotateCcw,
} from "lucide-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useInstitution } from "../../../lib/institution/institution-context";
import {
  getInstitutionConfig,
  getRoleLabel,
} from "../../../lib/institution/classification";
import type {
  Membership,
  MembershipRole,
  MembershipStatus,
  Library,
  LibraryInvitation,
  LibraryAccessRole,
} from "../../../types";

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

  // Phase 3: Tabs, Libraries & Invitations State
  const [activeTab, setActiveTab] = useState<"members" | "invitations">("members");
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [invitations, setInvitations] = useState<LibraryInvitation[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);

  // Invite Modal State
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLibraryId, setInviteLibraryId] = useState("");
  const [inviteRole, setInviteRole] = useState<LibraryAccessRole>("student");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

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

  const fetchLibrariesAndInvitations = useCallback(async () => {
    if (!activeInstitutionId) return;
    setIsLoadingInvitations(true);
    try {
      const libsRes = await api.libraries.list({ institution_id: activeInstitutionId });
      const libs = libsRes.results || [];
      setLibraries(libs);
      if (libs.length > 0 && !inviteLibraryId) {
        setInviteLibraryId(libs[0].id);
      }

      const invitePromises = libs.map((lib) =>
        api.invitations.listForLibrary(lib.id).catch(() => ({ results: [] }))
      );
      const results = await Promise.all(invitePromises);
      const allInvites = results.flatMap((r) => r.results || []);
      // Sort newest first
      allInvites.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setInvitations(allInvites);
    } catch {
      // Graceful ignore
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [activeInstitutionId, inviteLibraryId]);

  useEffect(() => {
    fetchMembers();
    fetchLibrariesAndInvitations();
  }, [fetchMembers, fetchLibrariesAndInvitations]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteLibraryId || !inviteEmail.trim()) return;

    setIsSubmittingInvite(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.invitations.create(inviteLibraryId, {
        email: inviteEmail.trim().toLowerCase(),
        intended_access: inviteRole,
      });
      setActionSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteEmail("");
      setIsInviteModalOpen(false);
      fetchLibrariesAndInvitations();
    } catch (err: any) {
      setActionError(err?.message || "Failed to issue invitation.");
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const handleRevokeInvitation = async (invitation: LibraryInvitation) => {
    setRevokingInviteId(invitation.id);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.invitations.revoke(invitation.library.id, invitation.id);
      setActionSuccess(`Revoked invitation for ${invitation.recipient_email}.`);
      setInvitations((prev) =>
        prev.map((i) => (i.id === invitation.id ? { ...i, status: "revoked" } : i))
      );
    } catch (err: any) {
      setActionError(err?.message || "Failed to revoke invitation.");
    } finally {
      setRevokingInviteId(null);
    }
  };

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
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
            >
              <UserPlus size={14} />
              <span>Invite Member</span>
            </button>
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
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer"
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
            className="text-rose-600 hover:text-rose-900 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-medium gap-2">
        <button
          onClick={() => setActiveTab("members")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === "members"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Users size={14} />
          <span>Members Directory</span>
          <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
            {memberships.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === "invitations"
              ? "border-slate-900 text-slate-900 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Mail size={14} />
          <span>Pending Invitations</span>
          {invitations.length > 0 && (
            <span className="rounded-full bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.2 text-[10px] font-semibold">
              {invitations.filter((i) => i.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Members Directory */}
      {activeTab === "members" ? (
        <div className="space-y-4">
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
            className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-accent focus:outline-none transition-colors"
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
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs text-slate-700 dark:text-slate-200 focus:border-accent focus:outline-none"
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
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 text-xs text-slate-700 dark:text-slate-200 focus:border-accent focus:outline-none"
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
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-surface shadow-xs">
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
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
              <Users size={18} />
            </div>
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">No members found</h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filters."
                : "No members are currently enrolled in this workspace."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/80 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-3.5 py-2">Member</th>
                  <th className="px-3.5 py-2">Role</th>
                  <th className="px-3.5 py-2">Status</th>
                  <th className="px-3.5 py-2">Enrolled</th>
                  <th className="px-3.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-surface">
                {filteredMembers.map((m) => {
                  const isMutating = mutatingId === m.id;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
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
    </div>
  ) : (
        /* Tab 2: Pending Invitations */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Library Invitations</h2>
              <p className="text-[11px] text-slate-500">
                Pending and historical invitations to knowledge libraries in this institution.
              </p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus size={13} />
              <span>+ Invite New Member</span>
            </button>
          </div>

          {isLoadingInvitations ? (
            <div className="flex h-48 items-center justify-center text-xs text-slate-400">
              <Loader2 size={16} className="animate-spin mr-2 text-accent" />
              Loading invitations...
            </div>
          ) : invitations.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-xs">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-2">
                <Mail size={18} />
              </div>
              <h3 className="text-xs font-semibold text-slate-900">No invitations found</h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                Invite colleagues, educators, or students to access specific institutional libraries.
              </p>
              <button
                onClick={() => setIsInviteModalOpen(true)}
                className="mt-3.5 inline-flex h-7 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors cursor-pointer"
              >
                <UserPlus size={12} />
                <span>Invite First Member</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Recipient</th>
                    <th className="px-4 py-3">Library</th>
                    <th className="px-4 py-3">Intended Access</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Invited By</th>
                    <th className="px-4 py-3">Expires / Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {invitations.map((inv) => {
                    const isRevoking = revokingInviteId === inv.id;
                    const isPending = inv.status === "pending" && !inv.is_expired;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{inv.recipient_email}</div>
                          {inv.recipient_user && (
                            <span className="text-[10px] text-emerald-600 font-medium">
                              Registered User
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-800">{inv.library.name}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="capitalize text-slate-700 font-medium">
                            {inv.intended_access}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${
                              inv.status === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : inv.status === "pending" && !inv.is_expired
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : inv.status === "declined"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {inv.is_expired && inv.status === "pending" ? "expired" : inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {inv.inviter.email}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[11px]">
                          {isPending ? (
                            <span className="flex items-center gap-1 text-amber-700">
                              <Clock size={11} />
                              <span>Expires {new Date(inv.expires_at).toLocaleDateString()}</span>
                            </span>
                          ) : (
                            <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isPending && (
                            <button
                              type="button"
                              disabled={isRevoking}
                              onClick={() => handleRevokeInvitation(inv)}
                              className="inline-flex h-6 items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 text-[11px] font-medium text-rose-700 hover:bg-rose-100 disabled:opacity-50 transition-colors cursor-pointer"
                            >
                              {isRevoking ? (
                                <Loader2 size={10} className="animate-spin" />
                              ) : (
                                <RotateCcw size={10} />
                              )}
                              <span>Revoke</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isSubmittingInvite && setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Invite Member to Library</h3>
                  <p className="text-[11px] text-slate-500">
                    Send a secure invitation with an access token.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="colleague@institution.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 focus:border-accent focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If unregistered, they will be invited to register and verify their email.
                </p>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Knowledge Library
                </label>
                <select
                  value={inviteLibraryId}
                  onChange={(e) => setInviteLibraryId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-accent focus:outline-none"
                >
                  {libraries.map((lib) => (
                    <option key={lib.id} value={lib.id}>
                      {lib.name} ({lib.visibility})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Intended Access Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as LibraryAccessRole)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 focus:border-accent focus:outline-none capitalize"
                >
                  <option value="student">Student / Viewer</option>
                  <option value="teacher">Teacher / Contributor</option>
                  <option value="administrator">Administrator / Curator</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmittingInvite}
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInvite || !inviteEmail || !inviteLibraryId}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isSubmittingInvite ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>Send Invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
