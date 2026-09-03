"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../lib/auth/session-context";

export default function IndexPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="text-xs text-ink-secondary">Redirecting...</div>
    </div>
  );
}
