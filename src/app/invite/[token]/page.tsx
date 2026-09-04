import React, { Suspense } from "react";
import InviteLandingClient from "./invite-landing-client";

export function generateStaticParams() {
  return [{ token: "preview" }];
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
          <div className="text-xs text-ink-secondary">Loading invitation...</div>
        </div>
      }
    >
      <InviteLandingClient />
    </Suspense>
  );
}
