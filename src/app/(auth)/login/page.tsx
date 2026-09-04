"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";
import { MwalimuLogo } from "../../../components/ui/logo";

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
            Sign In to Console
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-slate-500">
            Mwalimu Institutional Control Plane
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
              placeholder="admin@institution.edu"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
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
              placeholder="••••••••••••"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-9 w-full rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Don&apos;t have an administrator account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Register your institution
          </Link>
        </div>
      </div>
    </div>
  );
}
