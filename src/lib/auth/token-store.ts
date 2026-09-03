/**
 * Token and cookie management for Mwalimu Institutional Console.
 */

const ACCESS_KEY = "mwalimu_console_access_token";
const ACTIVE_INSTITUTION_KEY = "mwalimu_console_active_institution";

let inMemoryAccess: string | null = null;

export function setAccessToken(token: string): void {
  inMemoryAccess = token;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(ACCESS_KEY, token);
    } catch {
      // ignore storage errors
    }
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccess) return inMemoryAccess;
  if (typeof window !== "undefined") {
    try {
      inMemoryAccess = localStorage.getItem(ACCESS_KEY);
    } catch {
      // ignore storage errors
    }
  }
  return inMemoryAccess;
}

export function clearAccessToken(): void {
  inMemoryAccess = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(ACCESS_KEY);
    } catch {
      // ignore
    }
  }
}

export function setActiveInstitutionId(id: string | null): void {
  if (typeof window !== "undefined") {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_INSTITUTION_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_INSTITUTION_KEY);
      }
    } catch {
      // ignore
    }
  }
}

export function getActiveInstitutionId(): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(ACTIVE_INSTITUTION_KEY);
    } catch {
      return null;
    }
  }
  return null;
}

export function getCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
