"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  XCircle,
} from "lucide-react";
import { api, ApiClientError } from "../../../lib/api/client";
import { useSession } from "../../../lib/auth/session-context";
import { MwalimuLogo } from "../../../components/ui/logo";
import type { PublicInvitationResolution } from "../../../types";

export default function InviteLandingClient() {
  const params = useParams<{ token: string }>();
  const token = params?.token;
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useSession();

  const [invitation, setInvitation] = useState<PublicInvitationResolution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [completedState, setCompletedState] = useState<"accepted" | "declined" | null>(null);
  const [acceptedLibraryId, setAcceptedLibraryId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || token === "preview") {
      setIsLoading(false);
      return;
    }

    const resolveInvite = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await api.invitations.resolveToken(token);
        setInvitation(data);
        if (data.status === "accepted") {
          setCompletedState("accepted");
          setAcceptedLibraryId(data.library_id);
        } else if (data.status === "declined") {
          setCompletedState("declined");
        }
      } catch (err: unknown) {
        if (err instanceof ApiClientError && err.status === 404) {
          setError("This invitation link is invalid or has expired.");
        } else {
          setError("Failed to load invitation details. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    resolveInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setIsAccepting(true);
    setActionError(null);
    try {
      const res = await api.invitations.accept(token);
      setCompletedState("accepted");
      setAcceptedLibraryId(res.library_id);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
      } else {
        setActionError("An unexpected error occurred while accepting the invitation.");
      }
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    setIsDeclining(true);
    setActionError(null);
    try {
      await api.invitations.decline(token);
      setCompletedState("declined");
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setActionError(err.message);
      } else {
        setActionError("An error occurred while declining the invitation.");
      }
    } finally {
      setIsDeclining(false);
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    router.push(`/login?next=/invite/${token}`);
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="text-xs text-ink-secondary">Validating invitation security token...</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-surface p-7 sm:p-8 text-center shadow-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 mb-4">
            <XCircle size={24} />
          </div>
          <h1 className="text-lg font-semibold text-ink">Invitation Unavailable</h1>
          <p className="mt-2 text-xs text-ink-secondary leading-relaxed">
            {error || "The link you followed may be expired, revoked, or invalid."}
          </p>
          <div className="mt-6">
            <Link
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              Go to Mwalimu Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-sm text-ink transition-colors">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div className="flex items-center gap-2">
            <MwalimuLogo size={24} priority />
            <span className="font-bold text-sm tracking-tight text-ink">Mwalimu</span>
          </div>
          <span className="rounded-full bg-accent-subtle text-accent border border-accent/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            Library Access
          </span>
        </div>

        {/* Institution Badge & Identity */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-canvas/60 p-3.5 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface border border-border overflow-hidden shrink-0">
            {invitation.institution_badge_url ? (
              <img
                src={invitation.institution_badge_url}
                alt={invitation.institution_name || "Institution"}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 size={20} className="text-accent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-ink truncate">
              {invitation.institution_name || "Mwalimu Learning"}
            </div>
            <div className="text-[11px] text-ink-secondary">
              Official Institutional Library
            </div>
          </div>
        </div>

        {/* Target Library Details */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent mb-1">
            <BookOpen size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-ink">
            {invitation.library_name}
          </h1>
          <p className="text-xs text-ink-secondary">
            Invited by <strong className="text-ink">{invitation.inviter_name || "A Librarian"}</strong> as a{" "}
            <span className="capitalize font-semibold text-accent">{invitation.intended_access}</span>.
          </p>
          <div className="pt-1">
            <span className="inline-block rounded-md bg-subtle px-2 py-1 text-[11px] text-ink-secondary font-mono">
              Sent to: {invitation.masked_recipient_email}
            </span>
          </div>
        </div>

        {/* Action / Feedback Messages */}
        {actionError && (
          <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 dark:bg-rose-950/30 dark:border-rose-800/40 p-3 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{actionError}</div>
          </div>
        )}

        {/* Completed State: Accepted */}
        {completedState === "accepted" && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/40 p-5 text-center space-y-3">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                You&apos;re in!
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                Your access to <strong>{invitation.library_name}</strong> is now active.
              </p>
            </div>
            {acceptedLibraryId && (
              <Link
                href={`/libraries/${acceptedLibraryId}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-700 px-4 text-xs font-medium text-white hover:bg-emerald-800 transition-colors shadow-xs"
              >
                <span>Open Library Workspace</span>
                <ArrowRight size={13} />
              </Link>
            )}
          </div>
        )}

        {/* Completed State: Declined */}
        {completedState === "declined" && (
          <div className="rounded-xl border border-border bg-subtle p-5 text-center space-y-2">
            <h3 className="text-sm font-medium text-ink">Invitation Declined</h3>
            <p className="text-xs text-ink-secondary">
              You have declined access to {invitation.library_name}. You may close this page.
            </p>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="text-xs font-medium text-accent hover:underline"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Pending Actions */}
        {!completedState && (
          <>
            {/* Case A: User Not Logged In */}
            {!isAuthenticated && (
              <div className="space-y-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  To accept this invitation, sign in to or create an account associated with{" "}
                  <strong>{invitation.masked_recipient_email}</strong>.
                </div>

                <div className="space-y-2 pt-1">
                  <Link
                    href={`/login?next=/invite/${token}`}
                    className="flex h-9 w-full items-center justify-center rounded-lg bg-slate-900 px-4 text-xs font-medium text-white hover:bg-slate-800 transition-colors shadow-xs"
                  >
                    Sign In to Accept
                  </Link>
                  <Link
                    href={`/register?next=/invite/${token}`}
                    className="flex h-9 w-full items-center justify-center rounded-lg border border-border bg-surface px-4 text-xs font-medium text-ink hover:bg-subtle transition-colors"
                  >
                    Create a New Account
                  </Link>
                </div>
              </div>
            )}

            {/* Case B: User Logged In */}
            {isAuthenticated && user && (
              <div className="space-y-4">
                {/* Active Session Info */}
                <div className="rounded-lg border border-border bg-canvas p-3 text-xs flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="text-ink-tertiary block text-[10px]">Signed in as</span>
                    <span className="font-semibold text-ink truncate block">{user.email}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    title="Switch Account"
                    className="inline-flex items-center gap-1 rounded p-1 text-[11px] text-ink-secondary hover:text-ink hover:bg-subtle transition-colors"
                  >
                    <LogOut size={12} />
                    <span>Switch</span>
                  </button>
                </div>

                {/* Email Verification Warning */}
                {!user.is_email_verified && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/40 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-2">
                    <p>
                      Your account email address must be verified before accepting library invitations.
                    </p>
                    <Link
                      href={`/verify-email?email=${encodeURIComponent(user.email)}&next=/invite/${token}`}
                      className="inline-block font-semibold text-accent hover:underline"
                    >
                      Verify Email Address Now →
                    </Link>
                  </div>
                )}

                {/* Action Buttons */}
                {user.is_email_verified && (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={isAccepting || isDeclining}
                      onClick={handleAccept}
                      className="inline-flex h-9 w-full sm:flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-semibold text-white hover:bg-accent/90 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                    >
                      {isAccepting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <UserCheck size={14} />
                      )}
                      <span>Accept & Join Library</span>
                    </button>
                    <button
                      type="button"
                      disabled={isAccepting || isDeclining}
                      onClick={handleDecline}
                      className="inline-flex h-9 w-full sm:w-auto items-center justify-center rounded-lg border border-border bg-surface px-4 text-xs font-medium text-ink-secondary hover:bg-subtle hover:text-ink disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isDeclining ? <Loader2 size={13} className="animate-spin" /> : "Decline"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Expiration Note */}
        <div className="mt-6 border-t border-border pt-3 flex items-center justify-between text-[10px] text-ink-tertiary">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            <span>
              Expires: {new Date(invitation.expires_at).toLocaleDateString()}
            </span>
          </span>
          <span className="font-mono">Mwalimu Safe Invite</span>
        </div>
      </div>
    </div>
  );
}
