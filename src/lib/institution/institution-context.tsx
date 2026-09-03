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
  getActiveInstitutionId,
  setActiveInstitutionId as persistActiveInstitutionId,
} from "../auth/token-store";
import { useSession } from "../auth/session-context";
import type { Institution, InstitutionType } from "../../types";

interface InstitutionContextType {
  institutions: Institution[];
  activeInstitution: Institution | null;
  activeInstitutionId: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveInstitution: (institutionId: string) => void;
  createInstitution: (data: {
    name: string;
    slug: string;
    institution_type: InstitutionType;
  }) => Promise<Institution>;
  refreshInstitutions: () => Promise<void>;
}

const InstitutionContext = createContext<InstitutionContextType | undefined>(
  undefined
);

export function InstitutionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useSession();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [activeInstitutionId, setActiveIdState] = useState<string | null>(
    getActiveInstitutionId()
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshInstitutions = useCallback(async () => {
    if (!isAuthenticated) {
      setInstitutions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch memberships where user is administrator
      const membershipsRes = await api.memberships.list();
      const adminMemberships = membershipsRes.results.filter(
        (m) => m.role === "administrator" && m.status === "active"
      );

      // Fetch the corresponding institution details
      const instPromises = adminMemberships.map((m) =>
        api.institutions.get(m.institution.id).catch(() => null)
      );
      const fetched = (await Promise.all(instPromises)).filter(
        (i): i is Institution => i !== null
      );

      setInstitutions(fetched);

      // Select active institution
      const storedId = getActiveInstitutionId();
      if (storedId && fetched.some((i) => i.id === storedId)) {
        setActiveIdState(storedId);
      } else if (fetched.length > 0) {
        const firstId = fetched[0].id;
        setActiveIdState(firstId);
        persistActiveInstitutionId(firstId);
      } else {
        setActiveIdState(null);
        persistActiveInstitutionId(null);
      }
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError("Failed to load institutions.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshInstitutions();
  }, [refreshInstitutions]);

  const setActiveInstitution = (institutionId: string) => {
    const exists = institutions.some((i) => i.id === institutionId);
    if (exists) {
      setActiveIdState(institutionId);
      persistActiveInstitutionId(institutionId);
    }
  };

  const createInstitution = async (data: {
    name: string;
    slug: string;
    institution_type: InstitutionType;
  }): Promise<Institution> => {
    setIsLoading(true);
    setError(null);
    try {
      const newInst = await api.institutions.create(data);
      setInstitutions((prev) => [newInst, ...prev]);
      setActiveIdState(newInst.id);
      persistActiveInstitutionId(newInst.id);
      return newInst;
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

  const activeInstitution =
    institutions.find((i) => i.id === activeInstitutionId) || null;

  return (
    <InstitutionContext.Provider
      value={{
        institutions,
        activeInstitution,
        activeInstitutionId,
        isLoading,
        error,
        setActiveInstitution,
        createInstitution,
        refreshInstitutions,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
}

export function useInstitution(): InstitutionContextType {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error("useInstitution must be used within an InstitutionProvider");
  }
  return context;
}
