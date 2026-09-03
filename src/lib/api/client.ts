/**
 * Centralized Typed Platform API Client for Mwalimu Institutional Console.
 */

import {
  clearAccessToken,
  getAccessToken,
  getActiveInstitutionId,
  getCsrfToken,
  setAccessToken,
} from "../auth/token-store";
import type {
  Institution,
  InstitutionType,
  Library,
  LibraryAccessPolicy,
  LibraryAccessRole,
  LibraryVisibility,
  LoginResponse,
  Membership,
  MembershipRole,
  MembershipStatus,
  ProcessingRunStatus,
  RegisterResponse,
  Resource,
  User,
  InstitutionOverview,
  AIUsageTelemetry,
  InstitutionalAuditEvent,
  ConnectorSummary,
  InstitutionConnection,
  ConnectionSyncJob,
  InstitutionContextRegion,
  GeographicUnit,
} from "../../types";

export class ApiClientError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(getCsrfToken() ? { "X-CSRFToken": getCsrfToken()! } : {}),
      },
      credentials: "include",
    });

    if (!res.ok) {
      clearAccessToken();
      return null;
    }

    const data = (await res.json()) as { access?: string };
    if (data.access) {
      setAccessToken(data.access);
      return data.access;
    }
    return null;
  } catch {
    clearAccessToken();
    return null;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("X-Client-Type")) {
    headers.set("X-Client-Type", "institutional_console");
  }

  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const activeInstId = getActiveInstitutionId();
  if (activeInstId && !headers.has("X-Institution-Id")) {
    headers.set("X-Institution-Id", activeInstId);
  }

  const csrf = getCsrfToken();
  if (csrf && !headers.has("X-CSRFToken")) {
    headers.set("X-CSRFToken", csrf);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: "include",
  };

  let response = await fetch(url, config);

  // Handle 401 Unauthorized with token refresh
  if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;
      onRefreshed(newToken);

      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...config, headers });
      }
    } else {
      const newToken = await new Promise<string | null>((resolve) => {
        subscribeTokenRefresh((t) => resolve(t));
      });
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(url, { ...config, headers });
      }
    }
  }

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }

    let message = `Request failed with status ${response.status}`;
    if (typeof errorData === "object" && errorData !== null) {
      if ("detail" in errorData) {
        message = String((errorData as { detail: string }).detail);
      } else if ("error" in errorData) {
        message = String((errorData as { error: string }).error);
      } else {
        const fieldErrors = Object.entries(errorData as Record<string, unknown>)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        if (fieldErrors) message = fieldErrors;
      }
    }

    throw new ApiClientError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<LoginResponse> {
      const data = await apiRequest<LoginResponse>("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          client_type: "institutional_console",
        }),
      });
      if (data.access) {
        setAccessToken(data.access);
      }
      return data;
    },

    async register(
      email: string,
      password: string,
      passwordConfirm: string
    ): Promise<RegisterResponse> {
      return apiRequest<RegisterResponse>("/api/v1/auth/register/", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          password_confirm: passwordConfirm,
        }),
      });
    },

    async verifyEmail(
      email: string,
      otp: string,
      displayName?: string
    ): Promise<LoginResponse> {
      const data = await apiRequest<LoginResponse>("/api/v1/auth/verify-email/", {
        method: "POST",
        body: JSON.stringify({
          email,
          otp,
          ...(displayName ? { display_name: displayName } : {}),
        }),
      });
      if (data.access) {
        setAccessToken(data.access);
      }
      return data;
    },

    async getMe(): Promise<User> {
      return apiRequest<User>("/api/v1/auth/me/", {
        method: "GET",
      });
    },

    async logout(): Promise<void> {
      try {
        await apiRequest("/api/v1/auth/logout/", { method: "POST" });
      } finally {
        clearAccessToken();
      }
    },
  },

  institutions: {
    async list(): Promise<{ results: Institution[]; count: number }> {
      return apiRequest<{ results: Institution[]; count: number }>(
        "/api/v1/institutions/",
        { method: "GET" }
      );
    },

    async get(id: string): Promise<Institution> {
      return apiRequest<Institution>(`/api/v1/institutions/${id}/`, {
        method: "GET",
      });
    },

    async create(data: {
      name: string;
      slug: string;
      institution_type: InstitutionType;
    }): Promise<Institution> {
      return apiRequest<Institution>("/api/v1/institutions/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: Partial<Institution>): Promise<Institution> {
      return apiRequest<Institution>(`/api/v1/institutions/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async getOverview(id: string): Promise<InstitutionOverview> {
      return apiRequest<InstitutionOverview>(
        `/api/v1/institutions/${id}/overview/`,
        { method: "GET" }
      );
    },

    async getUsage(
      id: string,
      params?: { start_date?: string; end_date?: string }
    ): Promise<AIUsageTelemetry> {
      const q = new URLSearchParams();
      if (params?.start_date) q.append("start_date", params.start_date);
      if (params?.end_date) q.append("end_date", params.end_date);
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      return apiRequest<AIUsageTelemetry>(
        `/api/v1/institutions/${id}/usage/${queryStr}`,
        { method: "GET" }
      );
    },

    async getAuditLogs(
      id: string,
      params?: { action?: string; target_type?: string; search?: string; page?: number }
    ): Promise<{ results: InstitutionalAuditEvent[]; count: number }> {
      const q = new URLSearchParams();
      if (params?.action) q.append("action", params.action);
      if (params?.target_type) q.append("target_type", params.target_type);
      if (params?.search) q.append("search", params.search);
      if (params?.page) q.append("page", String(params.page));
      const queryStr = q.toString() ? `?${q.toString()}` : "";
      const res = await apiRequest<any>(
        `/api/v1/institutions/${id}/audit-logs/${queryStr}`,
        { method: "GET" }
      );
      if (Array.isArray(res)) {
        return { results: res, count: res.length };
      }
      return res;
    },

    async getConnections(id: string): Promise<InstitutionConnection[]> {
      return apiRequest<InstitutionConnection[]>(
        `/api/v1/institutions/${id}/connections/`,
        { method: "GET" }
      );
    },
  },

  memberships: {
    async list(params?: {
      institution_id?: string;
    }): Promise<{ results: Membership[]; count: number }> {
      const query = params?.institution_id
        ? `?institution_id=${encodeURIComponent(params.institution_id)}`
        : "";
      return apiRequest<{ results: Membership[]; count: number }>(
        `/api/v1/memberships/${query}`,
        { method: "GET" }
      );
    },

    async update(
      id: string,
      data: { role?: MembershipRole; status?: MembershipStatus }
    ): Promise<Membership> {
      return apiRequest<Membership>(`/api/v1/memberships/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<void> {
      return apiRequest<void>(`/api/v1/memberships/${id}/`, {
        method: "DELETE",
      });
    },
  },

  libraries: {
    async list(params?: {
      institution_id?: string;
    }): Promise<{ results: Library[]; count: number }> {
      const query = params?.institution_id
        ? `?institution_id=${encodeURIComponent(params.institution_id)}`
        : "";
      return apiRequest<{ results: Library[]; count: number }>(
        `/api/v1/libraries/${query}`,
        { method: "GET" }
      );
    },

    async get(id: string): Promise<Library> {
      return apiRequest<Library>(`/api/v1/libraries/${id}/`, {
        method: "GET",
      });
    },

    async create(data: {
      name: string;
      slug: string;
      description?: string;
      visibility?: LibraryVisibility;
      institution_id?: string;
    }): Promise<Library> {
      return apiRequest<Library>("/api/v1/libraries/", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async update(id: string, data: Partial<Library>): Promise<Library> {
      return apiRequest<Library>(`/api/v1/libraries/${id}/`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },

    async delete(id: string): Promise<void> {
      return apiRequest<void>(`/api/v1/libraries/${id}/`, {
        method: "DELETE",
      });
    },
  },

  resources: {
    async list(libraryId: string): Promise<{ results: Resource[]; count: number }> {
      return apiRequest<{ results: Resource[]; count: number }>(
        `/api/v1/libraries/${libraryId}/resources/`,
        { method: "GET" }
      );
    },

    async get(libraryId: string, id: string): Promise<Resource> {
      return apiRequest<Resource>(
        `/api/v1/libraries/${libraryId}/resources/${id}/`,
        { method: "GET" }
      );
    },

    async upload(libraryId: string, formData: FormData): Promise<Resource> {
      return apiRequest<Resource>(
        `/api/v1/libraries/${libraryId}/resources/`,
        {
          method: "POST",
          body: formData,
        }
      );
    },

    async download(libraryId: string, id: string, filename: string): Promise<void> {
      const url = `${API_BASE_URL}/api/v1/libraries/${libraryId}/resources/${id}/download/`;
      const token = getAccessToken();
      const activeInstId = getActiveInstitutionId();

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (activeInstId) headers["X-Institution-Id"] = activeInstId;

      const res = await fetch(url, { headers, credentials: "include" });
      if (!res.ok) {
        throw new ApiClientError(`Download failed (${res.status})`, res.status);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    },

    async getProcessingStatus(
      libraryId: string,
      id: string
    ): Promise<ProcessingRunStatus> {
      return apiRequest<ProcessingRunStatus>(
        `/api/v1/libraries/${libraryId}/resources/${id}/processing-status/`,
        { method: "GET" }
      );
    },

    async triggerReprocess(
      libraryId: string,
      id: string
    ): Promise<ProcessingRunStatus> {
      return apiRequest<ProcessingRunStatus>(
        `/api/v1/libraries/${libraryId}/resources/${id}/processing-status/`,
        { method: "POST" }
      );
    },

    async delete(libraryId: string, id: string): Promise<void> {
      return apiRequest<void>(
        `/api/v1/libraries/${libraryId}/resources/${id}/`,
        { method: "DELETE" }
      );
    },
  },

  accessPolicies: {
    async list(
      libraryId: string
    ): Promise<{ results: LibraryAccessPolicy[]; count: number }> {
      return apiRequest<{ results: LibraryAccessPolicy[]; count: number }>(
        `/api/v1/libraries/${libraryId}/access-policies/`,
        { method: "GET" }
      );
    },

    async grant(
      libraryId: string,
      data: { user_id: string; role?: LibraryAccessRole }
    ): Promise<LibraryAccessPolicy> {
      return apiRequest<LibraryAccessPolicy>(
        `/api/v1/libraries/${libraryId}/access-policies/`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },

    async update(
      libraryId: string,
      policyId: string,
      data: { role: LibraryAccessRole }
    ): Promise<LibraryAccessPolicy> {
      return apiRequest<LibraryAccessPolicy>(
        `/api/v1/libraries/${libraryId}/access-policies/${policyId}/`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      );
    },

    async revoke(libraryId: string, policyId: string): Promise<void> {
      return apiRequest<void>(
        `/api/v1/libraries/${libraryId}/access-policies/${policyId}/`,
        { method: "DELETE" }
      );
    },
  },

  connectors: {
    async list(): Promise<ConnectorSummary[]> {
      const res = await apiRequest<any>("/api/v1/connectors/", {
        method: "GET",
      });
      if (Array.isArray(res)) {
        return res;
      }
      return res?.results || [];
    },

    async listConnections(libraryId: string): Promise<InstitutionConnection[]> {
      const res = await apiRequest<any>(
        `/api/v1/libraries/${libraryId}/connections/`,
        { method: "GET" }
      );
      if (Array.isArray(res)) {
        return res;
      }
      return res?.results || [];
    },

    async createConnection(
      libraryId: string,
      data: {
        connector_id: string;
        name: string;
        configuration?: Record<string, any>;
        credentials?: Record<string, any>;
        sync_frequency?: string;
      }
    ): Promise<InstitutionConnection> {
      return apiRequest<InstitutionConnection>(
        `/api/v1/libraries/${libraryId}/connections/`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },

    async deleteConnection(
      libraryId: string,
      connectionId: string
    ): Promise<void> {
      return apiRequest<void>(
        `/api/v1/libraries/${libraryId}/connections/${connectionId}/`,
        { method: "DELETE" }
      );
    },

    async triggerSync(
      libraryId: string,
      connectionId: string
    ): Promise<ConnectionSyncJob> {
      return apiRequest<ConnectionSyncJob>(
        `/api/v1/libraries/${libraryId}/connections/${connectionId}/sync/`,
        { method: "POST" }
      );
    },

    async listSyncJobs(
      libraryId: string,
      connectionId: string
    ): Promise<ConnectionSyncJob[]> {
      const res = await apiRequest<any>(
        `/api/v1/libraries/${libraryId}/connections/${connectionId}/sync-jobs/`,
        { method: "GET" }
      );
      if (Array.isArray(res)) {
        return res;
      }
      return res?.results || [];
    },
  },

  contextRegions: {
    async list(institutionId: string): Promise<InstitutionContextRegion[]> {
      const res = await apiRequest<any>(
        `/api/v1/institutions/${institutionId}/context-regions/`,
        { method: "GET" }
      );
      if (Array.isArray(res)) {
        return res;
      }
      return res?.results || [];
    },

    async create(
      institutionId: string,
      data: { geographic_unit_id: string; priority?: number }
    ): Promise<InstitutionContextRegion> {
      return apiRequest<InstitutionContextRegion>(
        `/api/v1/institutions/${institutionId}/context-regions/`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
    },

    async delete(institutionId: string, regionId: string): Promise<void> {
      return apiRequest<void>(
        `/api/v1/institutions/${institutionId}/context-regions/${regionId}/`,
        { method: "DELETE" }
      );
    },

    async reorder(
      institutionId: string,
      regionIds: string[]
    ): Promise<InstitutionContextRegion[]> {
      return apiRequest<InstitutionContextRegion[]>(
        `/api/v1/institutions/${institutionId}/context-regions/reorder/`,
        {
          method: "PUT",
          body: JSON.stringify({ region_ids: regionIds }),
        }
      );
    },
  },

  geographicUnits: {
    async list(): Promise<{ results: GeographicUnit[]; count: number }> {
      const res = await apiRequest<any>("/api/v1/context/geographic-units/", {
        method: "GET",
      });
      if (Array.isArray(res)) {
        return { results: res, count: res.length };
      }
      return res;
    },
  },
};
