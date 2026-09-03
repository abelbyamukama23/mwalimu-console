"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(email, password, passwordConfirm);
      if (res.requires_verification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        router.push("/login");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
          <h1 className="text-xl font-semibold text-ink">Create Administrator Account</h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Step 1 of 2: Create and verify your identity before workspace setup
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
              placeholder="At least 8 characters"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="Confirm your password"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 focus-ring"
          >
            {isSubmitting ? "Creating Account..." : "Continue to Verification"}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-ink-secondary">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
