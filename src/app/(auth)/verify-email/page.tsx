"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "../../../lib/auth/session-context";

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
      // Once verified, proceed to workspace onboarding
      router.push("/onboarding");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-white font-bold text-lg">
            M
          </div>
          <h1 className="text-xl font-semibold text-ink">Verify Your Email</h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Enter the 6-digit verification code sent to your email
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
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.trim())}
              placeholder="123456"
              className="w-full text-center tracking-widest text-lg font-mono rounded-md border border-border bg-surface px-3 py-2 text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-secondary mb-1">
              Your Full Name (Optional)
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Dr. Jane Doe"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otp.length < 6}
            className="w-full rounded-md bg-accent py-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 focus-ring"
          >
            {isSubmitting ? "Verifying..." : "Verify & Proceed to Onboarding"}
          </button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center text-xs text-ink-secondary">
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-ink-secondary">Loading...</div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
