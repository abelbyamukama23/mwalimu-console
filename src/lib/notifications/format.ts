import { InstitutionalAuditEvent } from "../../types";

export interface FormattedNotification {
  id: string;
  badge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  title: string;
  description: string;
  actor: string;
  timeAgo: string;
  timestamp: string;
  actionUrl?: string;
  actionLabel?: string;
  rawAction: string;
  rawTargetType: string;
  rawTargetRepr: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export function cleanDocTitle(title: string): string {
  if (!title) return "Document";
  let cleaned = title;
  // Strip shelf prefix if present like [Core Textbooks] Title
  cleaned = cleaned.replace(/^\[[^\]]+\]\s*/, "");
  // Strip common bulk download tags
  cleaned = cleaned.replace(/^_OceanofPDF\.com_/i, "");
  cleaned = cleaned.replace(/^_/, "");
  cleaned = cleaned.replace(/_/g, " ").trim();
  // Clean double spaces
  cleaned = cleaned.replace(/\s+/g, " ");
  return cleaned;
}

export function getRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  } catch {
    return isoString;
  }
}

export function formatNotification(event: InstitutionalAuditEvent): FormattedNotification {
  const action = (event.action || "").toLowerCase();
  const targetType = (event.target_type || "").toLowerCase();
  const targetRepr = event.target_repr || "";
  const actor = event.actor_email ? event.actor_email : "System Automated";
  const meta = event.metadata || {};

  let badge = {
    label: "System Event",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };
  let title = `${action} on ${targetRepr || targetType}`;
  let description = `Administrative event recorded by ${actor}.`;
  let actionUrl: string | undefined;
  let actionLabel: string | undefined;

  // 1. Membership / People Events
  if (action === "member.status_changed" || action === "member_status_changed") {
    const newStatus = (meta.new_status as string) || "";
    if (newStatus === "active") {
      badge = {
        label: "Member Activated",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
      };
      title = `Approved member access for ${targetRepr}`;
      description = `${actor} approved and activated this member's account.`;
    } else if (newStatus === "pending") {
      badge = {
        label: "Join Request",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
      };
      title = `New join request from ${targetRepr}`;
      description = `User has requested to join your institution workspace and is pending review.`;
    } else if (newStatus === "suspended") {
      badge = {
        label: "Member Suspended",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
      };
      title = `Suspended access for ${targetRepr}`;
      description = `${actor} temporarily suspended this account.`;
    } else {
      badge = {
        label: "Status Updated",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
      };
      title = `Updated status for ${targetRepr}`;
      description = `${actor} changed member status to ${newStatus || "updated"}.`;
    }
    actionUrl = "/people";
    actionLabel = "View in People Directory";
  } else if (action === "member.role_changed" || action === "member_role_changed") {
    const newRole = (meta.new_role as string) || "new role";
    badge = {
      label: "Role Updated",
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    };
    title = `Changed role to ${newRole.toUpperCase()} for ${targetRepr}`;
    description = `${actor} updated permission permissions for this member.`;
    actionUrl = "/people";
    actionLabel = "Manage Members";
  } else if (action === "member.removed" || action === "member_removed") {
    badge = {
      label: "Member Removed",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
    title = `Removed ${targetRepr} from institution`;
    description = `${actor} removed this user from the directory.`;
    actionUrl = "/people";
    actionLabel = "Review Directory";
  }

  // 2. Resource / Book Ingestion Events
  else if (action === "resource.uploaded" || action === "resource_uploaded") {
    const bookTitle = cleanDocTitle(targetRepr);
    badge = {
      label: "Book Uploaded",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    };
    title = `Added document "${bookTitle}"`;
    description = `${actor} uploaded and indexed this textbook into knowledge shelves.`;
    actionUrl = "/libraries";
    actionLabel = "Open Shelves";
  } else if (action === "resource.deleted" || action === "resource_deleted") {
    const bookTitle = cleanDocTitle(targetRepr);
    badge = {
      label: "Book Removed",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
    title = `Removed document "${bookTitle}"`;
    description = `${actor} deleted this document from library storage.`;
    actionUrl = "/libraries";
    actionLabel = "View Libraries";
  } else if (action === "resource.reindexed" || action === "resource_reindexed") {
    const bookTitle = cleanDocTitle(targetRepr);
    badge = {
      label: "Re-Indexed",
      bg: "bg-cyan-50",
      text: "text-cyan-700",
      border: "border-cyan-200",
    };
    title = `Re-indexed "${bookTitle}"`;
    description = `AI vector embeddings updated for fast retrieval.`;
    actionUrl = "/libraries";
    actionLabel = "Inspect Pipeline";
  }

  // 3. Knowledge Library Containers
  else if (action === "library.created" || action === "library_created") {
    badge = {
      label: "Library Created",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
    };
    title = `Created library "${targetRepr}"`;
    description = `${actor} created this knowledge library container.`;
    actionUrl = "/libraries";
    actionLabel = "Open Library";
  } else if (action === "library.updated" || action === "library_updated") {
    badge = {
      label: "Library Updated",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
    title = `Updated library "${targetRepr}"`;
    description = `${actor} modified settings or visibility tier.`;
    actionUrl = "/libraries";
    actionLabel = "View Library";
  } else if (action === "library.deleted" || action === "library_deleted") {
    badge = {
      label: "Library Deleted",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
    title = `Deleted library "${targetRepr}"`;
    description = `${actor} deleted this library container.`;
    actionUrl = "/libraries";
    actionLabel = "View Libraries";
  }

  // 4. Access Policies & Permissions
  else if (action === "access_policy.granted" || action === "access_policy_granted") {
    badge = {
      label: "Access Policy Added",
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    };
    title = `Granted access to "${targetRepr}"`;
    description = `${actor} authorized library access permissions.`;
    actionUrl = "/access";
    actionLabel = "Review Policies";
  } else if (action === "access_policy.revoked" || action === "access_policy_revoked") {
    badge = {
      label: "Access Revoked",
      bg: "bg-rose-50",
      text: "text-rose-700",
      border: "border-rose-200",
    };
    title = `Revoked access to "${targetRepr}"`;
    description = `${actor} removed library access permissions.`;
    actionUrl = "/access";
    actionLabel = "Review Policies";
  }

  // 5. Connectors & Integrations
  else if (action.includes("connection")) {
    if (action.includes("created")) {
      badge = {
        label: "Integration Added",
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
      };
      title = `Connected integration "${targetRepr}"`;
      description = `${actor} configured a new external connector.`;
    } else if (action.includes("sync")) {
      badge = {
        label: "Data Sync",
        bg: "bg-cyan-50",
        text: "text-cyan-700",
        border: "border-cyan-200",
      };
      title = `Sync started for "${targetRepr}"`;
      description = `Synchronization job triggered.`;
    } else if (action.includes("deleted")) {
      badge = {
        label: "Integration Removed",
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
      };
      title = `Removed integration "${targetRepr}"`;
      description = `${actor} disconnected this external source.`;
    }
    actionUrl = "/connectors";
    actionLabel = "Manage Connectors";
  }

  // 6. Organization Settings
  else if (action.includes("institution")) {
    badge = {
      label: "Settings Updated",
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    };
    title = `Institution settings updated`;
    description = `${actor} updated institutional profile or configuration.`;
    actionUrl = "/settings";
    actionLabel = "View Settings";
  }

  return {
    id: event.id,
    badge,
    title,
    description,
    actor,
    timeAgo: getRelativeTime(event.created_at),
    timestamp: new Date(event.created_at).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    actionUrl,
    actionLabel,
    rawAction: event.action,
    rawTargetType: event.target_type,
    rawTargetRepr: event.target_repr,
    metadata: event.metadata,
    ipAddress: event.ip_address || undefined,
  };
}
