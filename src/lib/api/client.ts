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
  LoginResponse,
  Membership,
  RegisterResponse,
  User,
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
      // Queue requests until refresh resolves
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
    const message =
      typeof errorData === "object" && errorData && "detail" in errorData
        ? String((errorData as { detail: string }).detail)
        : `Request failed with status ${response.status}`;

    throw new ApiClientError(message, response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export const api = {
  auth: {
    async login(email: string, password: string):Promise<LoginResponse> {
      const data = await apiRequest<LoginResponse>("/api/v1/auth/login/", {
        method: "POST",
        body: JSON.stringify({ email, password }),
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
  },
};
