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
