"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiClientError } from "../api/client";
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "./token-store";
import type { User } from "../../types";

interface SessionContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    passwordConfirm: string
  ) => Promise<{ requires_verification: boolean; email: string }>;
  verifyEmail: (
    email: string,
    otp: string,
    displayName?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = await api.auth.getMe();
      setUser(userData);
      setError(null);
    } catch {
      clearAccessToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.login(email, password);
      if (res.user) {
        setUser(res.user);
      } else {
        const userData = await api.auth.getMe();
        setUser(userData);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        let msg = err.message;
        if (typeof err.data === "object" && err.data) {
          const d = err.data as Record<string, unknown>;
          if (d.detail) {
            msg = String(d.detail);
          } else if (Array.isArray(d.non_field_errors)) {
            msg = d.non_field_errors.join(" ");
          } else if (d.error) {
            msg = String(d.error);
          }
        }
        setError(msg);
        throw new Error(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    email: string,
    password: string,
    passwordConfirm: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.register(email, password, passwordConfirm);
      return {
        requires_verification: res.requires_verification,
        email: res.email,
      };
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        const errorDetail =
          typeof err.data === "object" && err.data
            ? Object.entries(err.data as Record<string, unknown>)
                .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
                .join(" ")
            : err.message;
        setError(errorDetail);
        throw new Error(errorDetail);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (
    email: string,
    otp: string,
    displayName?: string
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.auth.verifyEmail(email, otp, displayName);
      if (res.user) {
        setUser(res.user);
      } else {
        const userData = await api.auth.getMe();
        setUser(userData);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        const msg =
          typeof err.data === "object" && err.data && "error" in err.data
            ? String((err.data as { error: string }).error)
            : err.message;
        setError(msg);
        throw new Error(msg);
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <SessionContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        error,
        login,
        register,
        verifyEmail,
        logout,
        refreshUser,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
