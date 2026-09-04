"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  FolderPlus,
  Upload,
  Download,
  Trash2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Cpu,
  Eye,
  Shield,
  ArrowLeft,
  ChevronRight,
  FileText,
  FolderOpen,
  Users,
  UserPlus,
  Mail,
  Clock,
  RotateCcw,
  Send,
  Loader2,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { api, ApiClientError } from "../../../../lib/api/client";
import { useInstitution } from "../../../../lib/institution/institution-context";
import {
  getInstitutionConfig,
  parseShelfAndTitle,
  formatShelfResourceName,
} from "../../../../lib/institution/classification";
import { WindowsFolderIcon } from "../../../../components/ui/windows-folder";
import type {
  Library,
  ProcessingRunStatus,
  ProcessingStage,
  Resource,
  ResourceType,
  ResourceStatus,
  LibraryInvitation,
  LibraryAccessRole,
} from "../../../../types";

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

const STAGES: Array<{ key: ProcessingStage; label: string }> = [
  { key: "extract", label: "Extract" },
  { key: "normalize", label: "Normalize" },
  { key: "chunk", label: "Chunk" },
  { key: "embed", label: "Embed" },
  { key: "index", label: "Index" },
  { key: "finalize", label: "Finalize" },
];

export default function LibraryDetailClient() {
  const urlParams = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const rawId = urlParams?.id;
  const libraryId = (rawId && rawId !== "view" ? rawId : searchParams?.get("id") || "") as string;
  const router = useRouter();
  const { activeInstitution } = useInstitution();

  // Library & Resources State
  const [library, setLibrary] = useState<Library | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Shelves State: A library starts with 0 shelves. Users create them.
  const [userCreatedShelves, setUserCreatedShelves] = useState<string[]>([]);
  // activeShelf: null means viewing Library Root (Shelves view). string means opened inside that shelf!
  const [activeShelf, setActiveShelf] = useState<string | null>(null);

  // Modal: Create Shelf
  const [isNewShelfOpen, setIsNewShelfOpen] = useState(false);
  const [newShelfName, setNewShelfName] = useState("");

  // Search & Filter inside opened shelf
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Upload Form (accessible ONLY inside an active shelf)
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadType, setUploadType] = useState<ResourceType>("pdf");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Processing Inspector
  const [inspectResource, setInspectResource] = useState<Resource | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingRunStatus | null>(null);
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Delete Resource
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Phase 3: Root Level Tab (Shelves vs Members & Invitations)
  const [rootTab, setRootTab] = useState<"shelves" | "members">("shelves");
  const [libraryInvitations, setLibraryInvitations] = useState<LibraryInvitation[]>([]);
  const [isLoadingLibInvites, setIsLoadingLibInvites] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<LibraryAccessRole>("student");
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [revokingInviteId, setRevokingInviteId] = useState<string | null>(null);

  const fetchLibraryInvitations = useCallback(async () => {
    if (!libraryId) return;
    setIsLoadingLibInvites(true);
    try {
      const res = await api.invitations.listForLibrary(libraryId);
      const invites = res.results || [];
      invites.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLibraryInvitations(invites);
    } catch {
      // Graceful ignore
    } finally {
      setIsLoadingLibInvites(false);
    }
  }, [libraryId]);

  useEffect(() => {
    if (rootTab === "members") {
      fetchLibraryInvitations();
    }
  }, [rootTab, fetchLibraryInvitations]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryId || !inviteEmail.trim()) return;

    setIsSendingInvite(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.invitations.create(libraryId, {
        email: inviteEmail.trim().toLowerCase(),
        intended_access: inviteRole,
      });
      setActionSuccess(`Invitation sent to ${inviteEmail.trim()}.`);
      setInviteEmail("");
      setIsInviteModalOpen(false);
      fetchLibraryInvitations();
    } catch (err: any) {
      setActionError(err?.message || "Failed to issue invitation.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRevokeInvite = async (invitationId: string, email: string) => {
    setRevokingInviteId(invitationId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.invitations.revoke(libraryId, invitationId);
      setActionSuccess(`Revoked invitation for ${email}.`);
      setLibraryInvitations((prev) =>
        prev.map((i) => (i.id === invitationId ? { ...i, status: "revoked" } : i))
      );
    } catch (err: any) {
      setActionError(err?.message || "Failed to revoke invitation.");
    } finally {
      setRevokingInviteId(null);
    }
  };

  const institutionConfig = useMemo(
    () => getInstitutionConfig(activeInstitution?.institution_type),
    [activeInstitution?.institution_type]
  );

  // Load custom created shelves from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`mwalimu_shelves_${libraryId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setUserCreatedShelves(parsed);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [libraryId]);

  // Save custom created shelves to localStorage
  const persistShelves = useCallback(
    (shelvesList: string[]) => {
      try {
        localStorage.setItem(`mwalimu_shelves_${libraryId}`, JSON.stringify(shelvesList));
      } catch {
        // ignore storage errors
      }
    },
    [libraryId]
  );

  // 1. Fetch Library and Resources
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [libData, resData] = await Promise.all([
        api.libraries.get(libraryId),
        api.resources.list(libraryId),
      ]);
      setLibrary(libData);
      setResources(resData.results || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load knowledge library details.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [libraryId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 2. All Shelves in this library: ONLY user-created shelves + shelves found in existing documents.
  // NO automatic pre-population! A brand new library has 0 shelves.
  const shelves = useMemo(() => {
    const set = new Set<string>();

    // Add shelves explicitly created by users
    userCreatedShelves.forEach((s) => set.add(s));

    // Add shelves derived from existing uploaded files
    resources.forEach((r) => {
      const { shelf } = parseShelfAndTitle(r.name);
      if (shelf && shelf !== "General Documents") {
        set.add(shelf);
      }
    });

    return Array.from(set);
  }, [userCreatedShelves, resources]);

  // 3. Stats per shelf
  const shelfStats = useMemo(() => {
    const map: Record<string, { count: number; size: number; lastModified: string }> = {};

    shelves.forEach((s) => {
      map[s] = { count: 0, size: 0, lastModified: "" };
    });

    resources.forEach((r) => {
      const { shelf } = parseShelfAndTitle(r.name);
      if (map[shelf]) {
        map[shelf].count += 1;
        map[shelf].size += r.size || 0;
        if (!map[shelf].lastModified || new Date(r.updated_at) > new Date(map[shelf].lastModified)) {
          map[shelf].lastModified = r.updated_at;
        }
      }
    });

    return map;
  }, [shelves, resources]);

  // 4. Resources inside the active shelf
  const shelfResources = useMemo(() => {
    if (!activeShelf) return [];

    return resources.filter((r) => {
      const { shelf, title } = parseShelfAndTitle(r.name);
      if (shelf !== activeShelf) return false;

      if (typeFilter !== "all" && r.resource_type !== typeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = title.toLowerCase().includes(q);
        const matchesFilename = r.original_filename?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesFilename) return false;
      }

      return true;
    });
  }, [resources, activeShelf, typeFilter, searchQuery]);

  // 5. Create New Shelf
  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newShelfName.trim();
    if (!clean) return;

    if (!shelves.includes(clean)) {
      const updated = [...userCreatedShelves, clean];
      setUserCreatedShelves(updated);
      persistShelves(updated);
    }

    setIsNewShelfOpen(false);
    setNewShelfName("");
    setActiveShelf(clean); // Open the newly created shelf immediately!
    setActionSuccess(`Created shelf "${clean}". You can now upload books and documents into it.`);
  };

  // 6. Upload Handler (Executed ONLY inside an active shelf)
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!libraryId || !uploadFile || !activeShelf) return;

    setIsUploading(true);
    setActionError(null);
    setActionSuccess(null);

    const rawTitle = uploadName.trim() || uploadFile.name;
    const formattedName = formatShelfResourceName(activeShelf, rawTitle);

    try {
      const formData = new FormData();
      formData.append("name", formattedName);
      formData.append("resource_type", uploadType);
      formData.append("file", uploadFile);

      const created = await api.resources.upload(libraryId, formData);
      setResources((prev) => [created, ...prev]);
      setActionSuccess(`"${rawTitle}" uploaded to shelf "${activeShelf}" and enqueued for indexing.`);
      setIsUploadOpen(false);
      setUploadName("");
      setUploadFile(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Document upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadFile(file);
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ""));
      }
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "pdf" || ext === "docx" || ext === "txt") {
        setUploadType(ext as ResourceType);
      }
    }
  };

  // 7. Inspect Ingestion Status
  const handleOpenInspector = async (res: Resource) => {
    setInspectResource(res);
    setIsInspectingLoading(true);
    try {
      const statusData = await api.resources.getProcessingStatus(libraryId, res.id);
      setProcessingStatus(statusData);
    } catch {
      setProcessingStatus(null);
    } finally {
      setIsInspectingLoading(false);
    }
  };

  const handleTriggerReprocess = async () => {
    if (!inspectResource) return;
    setIsRetrying(true);
    try {
      const updatedRun = await api.resources.triggerReprocess(libraryId, inspectResource.id);
      setProcessingStatus(updatedRun);
      setActionSuccess("Pipeline re-enqueued for indexing.");
      fetchData();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to trigger re-index.");
    } finally {
      setIsRetrying(false);
    }
  };

  // 8. Download Document
  const handleDownload = async (res: Resource) => {
    try {
      const { title } = parseShelfAndTitle(res.name);
      await api.resources.download(
        libraryId,
        res.id,
        res.original_filename || `${title}.${res.resource_type}`
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to download file.");
    }
  };

  // 9. Delete Document
  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await api.resources.delete(libraryId, resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      setActionSuccess(`Removed "${resourceToDelete.name}".`);
      setResourceToDelete(null);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Failed to delete document.");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ResourceStatus) => {
    switch (status) {
      case "ready":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "uploading":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-slate-400">
        Loading knowledge library workspace...
      </div>
    );
  }

  if (error || !library) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-xs text-rose-600 mb-3">{error || "Library not found."}</p>
        <Link
          href="/libraries"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800"
        >
          <ArrowLeft size={13} />
          <span>Back to Knowledge Libraries</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/libraries" className="hover:text-slate-700 transition-colors">
            Knowledge Libraries
          </Link>
          <span>/</span>
          {activeShelf ? (
            <button
              onClick={() => setActiveShelf(null)}
              className="text-slate-600 font-medium hover:text-accent transition-colors"
            >
              {library.name}
            </button>
          ) : (
            <span className="text-slate-600 font-medium">{library.name}</span>
          )}
          {activeShelf && (
            <>
              <span>/</span>
              <span className="text-amber-700 font-semibold flex items-center gap-1">
                <span>📁</span>
                <span>{activeShelf}</span>
              </span>
            </>
          )}
        </div>

        {/* Top Header */}
        {!activeShelf ? (
          /* LEVEL 1: LIBRARY ROOT (Shelves View) */
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-[26px] font-semibold text-slate-900 tracking-tight">
                  {library.name}
                </h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border capitalize ${
                    library.visibility === "discoverable"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600"
                  }`}
                >
                  {library.visibility}
                </span>
                {library.target_type === "academic_unit" && library.academic_unit ? (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-blue-200 bg-blue-50 text-blue-700">
                    <GraduationCap size={11} />
                    <span>Academic Shelf: {library.academic_unit.name} ({library.academic_unit.code})</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-teal-200 bg-teal-50 text-teal-700">
                    <Sparkles size={11} />
                    <span>Universal Utility Shelf</span>
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-[13px] text-slate-500 max-w-2xl">
                {library.description || "Curated learning repository for institutional coursework and AI grounding."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsNewShelfOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3 text-xs font-medium text-white hover:bg-amber-700 shadow-xs transition-colors"
              >
                <FolderPlus size={14} />
                <span>+ New Shelf</span>
              </button>

              <Link
                href="/access"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 shadow-xs transition-colors"
                title="Configure RBAC Access Policies"
              >
                <Shield size={13} />
                <span>Access</span>
              </Link>
            </div>
          </div>
        ) : (
          /* LEVEL 2: SHELF WORKSPACE */
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveShelf(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 shadow-xs transition-colors"
                title="Back to All Shelves"
              >
                <ArrowLeft size={14} />
              </button>
              <div className="flex items-center gap-2.5">
                <WindowsFolderIcon size={36} />
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
                    {activeShelf}
                  </h1>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>Shelf inside <span className="font-medium text-slate-600">{library.name}</span></span>
                    <span>•</span>
                    {library.target_type === "academic_unit" && library.academic_unit ? (
                      <span className="text-blue-600 font-medium inline-flex items-center gap-1">
                        <GraduationCap size={11} />
                        <span>{library.academic_unit.code}</span>
                      </span>
                    ) : (
                      <span className="text-teal-600 font-medium inline-flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>Utility</span>
                      </span>
                    )}
                    <span>•</span>
                    <span className="font-semibold text-slate-700">{shelfResources.length}</span> documents
                  </div>
                </div>
              </div>
            </div>

            {/* ONLY HERE is file upload allowed! */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 shadow-xs transition-colors"
              >
                <Upload size={13} />
                <span>Upload to &ldquo;{activeShelf}&rdquo;</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Notification Banners */}
      {actionSuccess && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900">
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
          <button onClick={() => setActionError(null)} className="text-rose-600 hover:text-rose-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 1: LIBRARY ROOT TABS & SHELVES                                      */}
      {/* ========================================================================= */}
      {!activeShelf && (
        <div className="flex border-b border-slate-200 text-xs font-medium gap-2">
          <button
            type="button"
            onClick={() => setRootTab("shelves")}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              rootTab === "shelves"
                ? "border-amber-600 text-amber-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <FolderOpen size={14} />
            <span>Knowledge Shelves</span>
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] text-slate-600">
              {shelves.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRootTab("members")}
            className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              rootTab === "members"
                ? "border-amber-600 text-amber-700 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <Users size={14} />
            <span>Members & Invitations</span>
            {libraryInvitations.filter((i) => i.status === "pending").length > 0 && (
              <span className="rounded-full bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.2 text-[10px] font-semibold">
                {libraryInvitations.filter((i) => i.status === "pending").length}
              </span>
            )}
          </button>
        </div>
      )}

      {!activeShelf && rootTab === "shelves" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <FolderOpen size={16} className="text-amber-600" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                Library Shelves ({shelves.length})
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Files and textbooks are organized inside shelves
            </div>
          </div>

          {shelves.length === 0 ? (
            /* EMPTY LIBRARY: No shelves created yet */
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/20 p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center mb-3">
                <WindowsFolderIcon size={56} />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">
                No shelves created yet
              </h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 leading-relaxed">
                Knowledge files and textbooks must be organized inside shelves.
                Create your first shelf (e.g. <em>Core Textbooks</em>, <em>Past Papers</em>, or <em>Lab Manuals</em>) to begin adding books.
              </p>
              <div className="mt-4">
                <button
                  onClick={() => setIsNewShelfOpen(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 text-xs font-medium text-white hover:bg-amber-700 shadow-xs transition-colors"
                >
                  <FolderPlus size={14} />
                  <span>+ Create First Shelf</span>
                </button>
              </div>
            </div>
          ) : (
            /* POPULATED LIBRARY: Grid of Windows Yellow Folders */
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {shelves.map((shelfName) => {
                const stats = shelfStats[shelfName] || { count: 0, size: 0, lastModified: "" };

                return (
                  <button
                    key={shelfName}
                    type="button"
                    onClick={() => setActiveShelf(shelfName)}
                    className="group flex flex-col items-center text-center p-3.5 rounded-xl border border-slate-200 bg-white hover:border-amber-400 hover:shadow-xs hover:bg-amber-50/20 transition-all text-left"
                  >
                    <div className="relative mb-2.5 transition-transform group-hover:scale-105">
                      <WindowsFolderIcon size={52} />
                      <span className="absolute -bottom-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-slate-900 px-1 text-[9px] font-bold text-white shadow-xs">
                        {stats.count}
                      </span>
                    </div>
                    <div
                      className="text-xs font-semibold text-slate-900 truncate w-full group-hover:text-amber-800 transition-colors"
                      title={shelfName}
                    >
                      {shelfName}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {stats.count} {stats.count === 1 ? "book" : "books"} • {formatBytes(stats.size)}
                    </div>
                    <div className="mt-2 text-[10px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to open &rarr;
                    </div>
                  </button>
                );
              })}

              {/* Add New Shelf Card */}
              <button
                type="button"
                onClick={() => setIsNewShelfOpen(true)}
                className="flex flex-col items-center justify-center text-center p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-white hover:border-amber-400 transition-all group"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-2 group-hover:scale-105 transition-transform">
                  <FolderPlus size={22} />
                </div>
                <div className="text-xs font-medium text-slate-700 group-hover:text-amber-800">
                  + New Shelf
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Organize books
                </div>
              </button>
            </div>
          )}

          {/* Educational Callout */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 flex items-start gap-2.5 shadow-xs">
            <span className="text-amber-600 text-sm">💡</span>
            <div>
              <span className="font-semibold text-slate-800">Knowledge Organization:</span> Books, syllabi, and study resources must reside inside shelves. Open any shelf above to upload files, manage documents, or inspect AI vector embeddings.
            </div>
          </div>
        </div>
      )}

      {/* LEVEL 1: LIBRARY ROOT - MEMBERS & INVITATIONS VIEW */}
      {!activeShelf && rootTab === "members" && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Library Invitations & Access
              </h2>
              <p className="text-[11px] text-slate-500">
                Authorized educators, students, and curators for <strong>{library.name}</strong>.
              </p>
            </div>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              <UserPlus size={13} />
              <span>+ Invite to Library</span>
            </button>
          </div>

          {/* Pending Invitations Table */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
              <Mail size={14} className="text-amber-600" />
              <span>
                Pending Invitations (
                {libraryInvitations.filter((i) => i.status === "pending").length})
              </span>
            </div>

            {isLoadingLibInvites ? (
              <div className="flex h-32 items-center justify-center text-xs text-slate-400">
                <Loader2 size={16} className="animate-spin mr-2 text-accent" />
                Loading invitations...
              </div>
            ) : libraryInvitations.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
                <p className="text-xs text-slate-500">
                  No invitations sent yet for this library.
                </p>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="mt-2 text-xs font-medium text-accent hover:underline cursor-pointer"
                >
                  Send an invitation
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Recipient</th>
                      <th className="px-4 py-2.5">Intended Role</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Invited By</th>
                      <th className="px-4 py-2.5">Expires / Created</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {libraryInvitations.map((inv) => {
                      const isPending = inv.status === "pending" && !inv.is_expired;
                      const isRevoking = revokingInviteId === inv.id;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-slate-900">
                              {inv.recipient_email}
                            </div>
                            {inv.recipient_user && (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Registered User
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="capitalize font-medium text-slate-800">
                              {inv.intended_access}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
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
                              {inv.is_expired && inv.status === "pending"
                                ? "expired"
                                : inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-500">
                            {inv.inviter.email}
                          </td>
                          <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                            {isPending ? (
                              <span className="flex items-center gap-1 text-amber-700">
                                <Clock size={11} />
                                <span>
                                  Expires {new Date(inv.expires_at).toLocaleDateString()}
                                </span>
                              </span>
                            ) : (
                              <span>{new Date(inv.created_at).toLocaleDateString()}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {isPending && (
                              <button
                                type="button"
                                disabled={isRevoking}
                                onClick={() =>
                                  handleRevokeInvite(inv.id, inv.recipient_email)
                                }
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: SHELF CONTENTS & INGESTION WORKSPACE                             */}
      {/* ========================================================================= */}
      {activeShelf && (
        <div className="space-y-4">
          {/* Shelf Filter and Search Toolbar */}
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
                placeholder={`Search books in "${activeShelf}"...`}
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-500 text-xs font-medium mr-0.5">
                <Filter size={13} className="text-slate-400" />
                <span>Format:</span>
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 focus:border-accent focus:outline-none"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Textbooks</option>
                <option value="docx">DOCX Documents</option>
                <option value="txt">TXT Transcripts</option>
              </select>

              <button
                onClick={fetchData}
                title="Refresh shelf"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition-colors shadow-xs"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>

          {/* Documents Table or Empty Shelf Dropzone */}
          {shelfResources.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 mb-2.5">
                <FileText size={22} />
              </div>
              <h3 className="text-xs font-semibold text-slate-900">
                This shelf is empty
              </h3>
              <p className="mx-auto mt-0.5 max-w-sm text-xs text-slate-400">
                Upload course textbooks, past papers, or curriculum chapters directly into &ldquo;{activeShelf}&rdquo;.
              </p>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="mt-3.5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white transition-colors hover:bg-slate-800 shadow-xs"
              >
                <Upload size={13} />
                <span>Upload First Document to &ldquo;{activeShelf}&rdquo;</span>
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-100">
                  <thead className="bg-slate-50/80 text-slate-500 font-medium">
                    <tr>
                      <th className="px-3.5 py-2">Document Title & Filename</th>
                      <th className="px-3.5 py-2">Format</th>
                      <th className="px-3.5 py-2">Size</th>
                      <th className="px-3.5 py-2">Indexing Status</th>
                      <th className="px-3.5 py-2">Uploaded</th>
                      <th className="px-3.5 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {shelfResources.map((res) => {
                      const { title } = parseShelfAndTitle(res.name);

                      return (
                        <tr key={res.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-3.5 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-100 text-accent font-semibold uppercase text-[9px]">
                                {res.resource_type}
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 truncate max-w-[280px]">
                                  {title}
                                </div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[280px]">
                                  {res.original_filename}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 uppercase text-slate-500 font-mono text-[11px]">
                            {res.resource_type}
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 font-mono text-[11px]">
                            {formatBytes(res.size)}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border capitalize ${getStatusBadge(
                                res.status
                              )}`}
                            >
                              {res.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-slate-500 whitespace-nowrap">
                            {new Date(res.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleOpenInspector(res)}
                                title="Inspect Ingestion & Chunks"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-accent transition-colors"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleDownload(res)}
                                title="Download Original"
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => setResourceToDelete(res)}
                                title="Delete Document"
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={14} />
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
        </div>
      )}

      {/* Modal: Create New Shelf */}
      {isNewShelfOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => setIsNewShelfOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <WindowsFolderIcon size={26} />
                <h3 className="text-sm font-semibold text-slate-900">
                  Create Knowledge Shelf
                </h3>
              </div>
              <button
                onClick={() => setIsNewShelfOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateShelf} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Shelf Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newShelfName}
                  onChange={(e) => setNewShelfName(e.target.value)}
                  placeholder="e.g. Core Textbooks, Past Papers, Lab Manuals"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              {/* Optional Quick Suggestions */}
              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-1.5">
                  Suggested shelf names for {institutionConfig.title}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {institutionConfig.defaultShelves.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setNewShelfName(preset.name)}
                      className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-800 transition-colors text-left"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewShelfOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newShelfName.trim()}
                  className="h-8 rounded-lg bg-amber-600 px-3.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 shadow-xs"
                >
                  Create Shelf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document (Inside Active Shelf) */}
      {isUploadOpen && activeShelf && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isUploading && setIsUploadOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <WindowsFolderIcon size={24} />
                <h3 className="text-sm font-semibold text-slate-900">
                  Upload to &ldquo;{activeShelf}&rdquo;
                </h3>
              </div>
              <button
                onClick={() => setIsUploadOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-5 text-center hover:border-amber-400 hover:bg-amber-50/20 transition-colors cursor-pointer"
                onClick={() => document.getElementById("shelf-file-input")?.click()}
              >
                <Upload size={24} className="text-amber-600 mb-1.5" />
                <div className="text-xs font-medium text-slate-800">
                  {uploadFile ? uploadFile.name : "Click to browse or drag file here"}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Supported: PDF, DOCX, TXT (up to 100MB)
                </div>
                <input
                  id="shelf-file-input"
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setUploadFile(f);
                      if (!uploadName) {
                        setUploadName(f.name.replace(/\.[^/.]+$/, ""));
                      }
                      const ext = f.name.split(".").pop()?.toLowerCase();
                      if (ext === "pdf" || ext === "docx" || ext === "txt") {
                        setUploadType(ext as ResourceType);
                      }
                    }
                  }}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Oxford Secondary Physics Book 4"
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Format Type
                </label>
                <select
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value as ResourceType)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 text-xs text-slate-900 focus:bg-white focus:border-accent focus:outline-none"
                >
                  <option value="pdf">PDF Document / Textbook</option>
                  <option value="docx">Microsoft Word (DOCX)</option>
                  <option value="txt">Plain Text (TXT)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="h-8 rounded-lg bg-slate-900 px-3.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs"
                >
                  {isUploading ? "Uploading & Enqueuing..." : "Upload & Begin Ingestion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Processing Pipeline Inspector */}
      {inspectResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isRetrying && setInspectResource(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div className="flex items-center gap-2">
                <Cpu size={16} className="text-accent" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Pipeline Inspector: {parseShelfAndTitle(inspectResource.name).title}
                </h3>
              </div>
              <button onClick={() => setInspectResource(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {isInspectingLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Inspecting processing run telemetry...
              </div>
            ) : !processingStatus || processingStatus.status === "NOT_ENQUEUED" ? (
              <div className="p-6 text-center">
                <p className="text-xs text-slate-500 mb-3">
                  No active processing run found for this document.
                </p>
                <button
                  onClick={handleTriggerReprocess}
                  disabled={isRetrying}
                  className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 shadow-xs"
                >
                  {isRetrying ? "Enqueuing..." : "Enqueue Background Processing"}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-slate-50/80 border border-slate-100 p-3 text-xs">
                  <div>
                    <div className="text-slate-400 text-[10px]">Processing Status</div>
                    <div className="font-semibold text-slate-900 mt-0.5 capitalize flex items-center gap-1.5">
                      <span>{processingStatus.status}</span>
                      {processingStatus.status === "ready" && (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-slate-400 text-[10px]">Indexed Chunks</div>
                    <div className="font-mono font-semibold text-slate-900 mt-0.5">
                      {processingStatus.chunks_count} chunks
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-1.5">
                    Pipeline Stages
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center">
                    {STAGES.map((s) => {
                      const isCurrent = processingStatus.current_stage === s.key;
                      const isCompleted =
                        processingStatus.status === "ready" ||
                        (processingStatus.status === "processing" &&
                          STAGES.findIndex((x) => x.key === processingStatus.current_stage) >
                            STAGES.findIndex((x) => x.key === s.key));

                      return (
                        <div
                          key={s.key}
                          className={`rounded p-1.5 text-[10px] font-medium border ${
                            isCompleted
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                              : isCurrent
                              ? "border-accent bg-accent/10 text-accent ring-1 ring-accent"
                              : "border-slate-200 bg-slate-50 text-slate-400"
                          }`}
                        >
                          {s.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {processingStatus.status === "failed" && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800">
                    <div className="font-semibold flex items-center gap-1.5 mb-0.5">
                      <AlertCircle size={14} />
                      <span>Ingestion Error ({processingStatus.error_code || "FAILED"})</span>
                    </div>
                    <p className="leading-relaxed font-mono text-[11px]">
                      {processingStatus.error_message || "The extraction worker encountered an unhandled error."}
                    </p>
                  </div>
                )}

                <dl className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-2.5">
                  <div>
                    <dt className="text-slate-400 text-[10px]">Run UUID</dt>
                    <dd className="font-mono text-[11px] text-slate-800 truncate">
                      {processingStatus.run_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-400 text-[10px]">Updated</dt>
                    <dd className="text-slate-500 text-[11px]">
                      {processingStatus.updated_at
                        ? new Date(processingStatus.updated_at).toLocaleString()
                        : "—"}
                    </dd>
                  </div>
                </dl>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={handleTriggerReprocess}
                    disabled={isRetrying}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw size={12} className={isRetrying ? "animate-spin" : ""} />
                    <span>{isRetrying ? "Re-indexing..." : "Re-index Document"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectResource(null)}
                    className="h-8 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 shadow-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {resourceToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isDeleting && setResourceToDelete(null)}
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
                <h3 className="text-sm font-semibold text-slate-900">Delete Document</h3>
                <p className="text-xs text-slate-500">
                  Removes file binary and all associated vector embeddings.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-900">{parseShelfAndTitle(resourceToDelete.name).title}</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setResourceToDelete(null)}
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

      {/* Modal: Invite Member to Library */}
      {isInviteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          onClick={() => !isSendingInvite && setIsInviteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl animate-in fade-in zoom-in duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Invite to {library.name}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Send an invitation link with direct library access.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(false)}
                className="rounded p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5 text-xs">
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
                  New users will be asked to register and verify their email first.
                </p>
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
                  disabled={isSendingInvite}
                  onClick={() => setIsInviteModalOpen(false)}
                  className="h-8 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingInvite || !inviteEmail.trim()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-900 px-3 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {isSendingInvite ? (
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
