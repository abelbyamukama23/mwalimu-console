"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";
import { MwalimuLogo } from "../../../components/ui/logo";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const initialEmail = searchParams.get("email") || "";
  const { register } = useSession();

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await register(email, password, passwordConfirm);
      if (res.requires_verification) {
        const nextQuery = next ? `&next=${encodeURIComponent(next)}` : "";
        router.push(`/verify-email?email=${encodeURIComponent(email)}${nextQuery}`);
      } else {
        const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
        router.push(`/login${nextQuery}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-7 sm:p-8 shadow-xs">
        {/* Brand */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <MwalimuLogo size={28} priority />
            <span className="text-xl font-bold tracking-tight text-ink">Mwalimu</span>
            <span className="rounded bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
            Create Account
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-slate-500">
            Create and verify your identity on Mwalimu
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@school.edu"
              className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-xs text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-xs text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="••••••••"
              className="h-9 w-full rounded-lg border border-border bg-canvas px-3 text-xs text-ink placeholder:text-slate-400 focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 w-full rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 shadow-xs cursor-pointer"
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-accent hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <RegisterForm />
    </Suspense>
  );
}
