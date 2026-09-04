"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";
import { MwalimuLogo } from "../../../components/ui/logo";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail } = useSession();

  const initialEmail = searchParams.get("email") || "";
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await verifyEmail(email, otp, displayName);
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-7 sm:p-8 shadow-xs">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <MwalimuLogo size={28} priority />
            <span className="text-xl font-bold tracking-tight text-ink">Mwalimu</span>
            <span className="rounded bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
            Verify Your Email
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-slate-500">
            Enter the 6-digit verification code sent to your email
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
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              placeholder="123456"
              className="h-9 w-full text-center tracking-widest text-lg font-mono rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Your Full Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Jane Doe"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length < 6}
            className="h-9 w-full rounded-lg bg-slate-900 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 shadow-xs"
          >
            {isSubmitting ? "Verifying..." : "Verify & Proceed to Onboarding"}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
          Need to change email?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
