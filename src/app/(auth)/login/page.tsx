"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white font-bold text-lg">
            M
          </div>
          <h1 className="text-xl font-semibold text-ink">Sign In to Console</h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Mwalimu Institutional Control Plane
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-danger-fg/20 bg-danger-bg p-3 text-xs text-danger-fg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@institution.edu"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 focus-ring"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-ink-secondary">
          Don&apos;t have an administrator account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Register your institution
          </Link>
        </div>
      </div>
    </div>
  );
}
