export type InstitutionType =
  | "family"
  | "school"
  | "college"
  | "university"
  | "training_center"
  | "education_organization"
  | "other";

export const INSTITUTION_TYPE_LABELS: Record<InstitutionType, string> = {
  family: "Family Workspace",
  school: "School (K-12)",
  college: "College / Vocational Institute",
  university: "University / Higher Education",
  training_center: "Training Center / Academy",
  education_organization: "Educational Organization / NGO",
  other: "Other Organization",
};

export type InstitutionStatus = "active" | "suspended" | "archived";

export interface Institution {
  id: string;
  name: string;
  slug: string;
  status: InstitutionStatus;
  institution_type: InstitutionType;
  badge_url?: string | null;
  logo_updated_at?: string | null;
  created_by_id?: string | null;
  created_at: string;
  updated_at: string;
}

export type MembershipRole = "administrator" | "teacher" | "student" | "librarian";
export type MembershipStatus = "pending" | "active" | "inactive" | "suspended";

export interface UserProfile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  phone_number?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  is_active: boolean;
  is_email_verified: boolean;
  profile?: UserProfile | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  user: {
    id: string;
    email: string;
  };
  institution: {
    id: string;
    name: string;
    slug: string;
  };
  role: MembershipRole;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
}

export type LibraryScopeType = "personal" | "institution";
export type LibraryStatus = "active" | "archived";
export type LibraryVisibility = "discoverable" | "restricted";
export type LibraryAccessRole = "administrator" | "teacher" | "student";

export interface Library {
  id: string;
  scope_type: LibraryScopeType;
  is_personal: boolean;
  institution?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  name: string;
  slug: string;
  description: string;
  status: LibraryStatus;
  visibility: LibraryVisibility;
  created_at: string;
  updated_at: string;
}

export interface LibraryAccessPolicy {
  id: string;
  library: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
  };
  role: LibraryAccessRole;
  created_at: string;
  updated_at: string;
}

export type ResourceType = "pdf" | "docx" | "txt";
export type ResourceStatus = "pending" | "uploading" | "ready" | "failed" | "archived";

export interface Resource {
  id: string;
  library: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  resource_type: ResourceType;
  original_filename: string;
  content_type: string;
  size: number;
  object_key: string;
  checksum: string;
  status: ResourceStatus;
  created_by?: {
    id: string;
    email: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export type ProcessingStatus = "queued" | "processing" | "ready" | "failed" | "NOT_ENQUEUED";
export type ProcessingStage = "extract" | "normalize" | "chunk" | "embed" | "index" | "finalize";

export interface ProcessingRunStatus {
  run_id?: string;
  resource_id: string;
  status: ProcessingStatus;
  current_stage?: ProcessingStage | string;
  is_active?: boolean;
  chunks_count: number;
  error_code?: string | null;
  error_message?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AuthTokens {
  access: string;
  refresh?: string;
}

export interface LoginResponse {
  access: string;
  user?: User;
}

export interface RegisterResponse {
  email: string;
  requires_verification: boolean;
  message: string;
}

// =============================================================================
// Phase 4 Intelligence & Governance Types
// =============================================================================

export interface InstitutionalAuditEvent {
  id: string;
  institution_id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string;
  target_id: string;
  target_repr: string;
  metadata: Record<string, any>;
  ip_address: string | null;
  created_at: string;
}

export interface InstitutionOverview {
  institution_id: string;
  name: string;
  slug: string;
  institution_type: string;
  status: string;
  members: {
    total_active: number;
    pending: number;
    by_role: Record<string, number>;
  };
  knowledge: {
    total_libraries: number;
    discoverable_libraries: number;
    restricted_libraries: number;
    total_resources: number;
    resources_by_status: Record<string, number>;
  };
  integrations: {
    total_connections: number;
    active_connections: number;
    error_connections: number;
  };
  ai_telemetry_30d: {
    total_tokens: number;
    total_runs: number;
    active_users: number;
  };
  health: {
    status: "healthy" | "attention_needed";
    stuck_processing_count: number;
    failed_ingestion_count: number;
    failed_sync_count: number;
  };
  recent_activity: InstitutionalAuditEvent[];
}

export interface AIUsageTelemetry {
  institution_id: string;
  start_date: string;
  end_date: string;
  summary: {
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_runs: number;
    completed_runs: number;
    failed_runs: number;
    cancelled_runs: number;
    timed_out_runs: number;
    active_users: number;
  };
  timeline: Array<{
    date: string;
    total_tokens: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_runs: number;
  }>;
  top_users: Array<{
    user_id: string;
    email: string;
    total_tokens: number;
    total_runs: number;
  }>;
}

export interface ConnectorSummary {
  id: string;
  name: string;
  slug: string;
  connector_type: string;
  auth_type: string;
}

export interface InstitutionConnection {
  id: string;
  library_id: string;
  library_name?: string;
  connector: ConnectorSummary;
  name: string;
  status: "active" | "inactive" | "error" | "syncing";
  sync_frequency: "manual" | "hourly" | "daily" | "weekly";
  last_synced_at: string | null;
  last_sync_status: "success" | "partial" | "failed" | null;
  last_sync_error: string;
  has_credentials: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConnectionSyncJob {
  id: string;
  connection_id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  celery_task_id: string | null;
  resources_discovered: number;
  resources_created: number;
  resources_updated: number;
  resources_deleted: number;
  error_code: string | null;
  error_message: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GeographicUnit {
  id: string;
  name: string;
  unit_type: string;
  code?: string;
  parent_id?: string | null;
}

export interface InstitutionContextRegion {
  id: string;
  institution_id: string;
  geographic_unit: GeographicUnit;
  priority: number;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Phase 3 Communication & Invitation Types
// =============================================================================

export type LibraryInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "expired"
  | "revoked";

export interface LibraryInvitation {
  id: string;
  library: {
    id: string;
    name: string;
    slug?: string;
  };
  institution?: {
    id: string;
    name: string;
    slug?: string;
  } | null;
  inviter: {
    id: string;
    email: string;
    display_name?: string;
  };
  recipient_email: string;
  recipient_user?: {
    id: string;
    email: string;
  } | null;
  intended_access: LibraryAccessRole;
  status: LibraryInvitationStatus;
  token?: string;
  expires_at: string;
  accepted_at?: string | null;
  declined_at?: string | null;
  revoked_at?: string | null;
  is_expired: boolean;
  created_at: string;
  updated_at: string;
}

export interface PublicInvitationResolution {
  library_name: string;
  library_id: string;
  institution_name?: string;
  institution_badge_url?: string | null;
  inviter_name?: string;
  intended_access: LibraryAccessRole;
  masked_recipient_email: string;
  status: LibraryInvitationStatus;
  expires_at: string;
  is_expired: boolean;
  can_accept: boolean;
}

export interface PlatformNotification {
  id: string;
  recipient_id: string;
  actor?: {
    id: string;
    email: string;
    display_name?: string;
  } | null;
  notification_type: string;
  title: string;
  message: string;
  payload: Record<string, any>;
  is_read: boolean;
  read_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

export interface UnreadNotificationCountResponse {
  unread_count: number;
}

