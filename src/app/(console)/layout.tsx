"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import { ConsoleShell } from "../../components/layout/console-shell";

export default function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSession();
  const { institutions, isLoading: instLoading } = useInstitution();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (
      !authLoading &&
      !instLoading &&
      isAuthenticated &&
      institutions.length === 0
    ) {
      router.push("/onboarding");
    }
  }, [authLoading, instLoading, isAuthenticated, institutions.length, router]);

  if (authLoading || instLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-xs text-ink-secondary">
          Initializing Institutional Console...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <ConsoleShell>{children}</ConsoleShell>;
}
