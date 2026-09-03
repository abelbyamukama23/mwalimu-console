"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      // If someone hit /libraries/<id>, seamlessly redirect to /libraries/view?id=<id>
      const match = path.match(/^\/libraries\/([^\/\?]+)/);
      if (match && match[1] && match[1] !== "view") {
        router.replace(`/libraries/view?id=${match[1]}`);
        return;
      }
    }
  }, [router]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Page Not Found</h2>
      <p className="mt-2 text-xs text-slate-500">
        Redirecting to your workspace...
      </p>
    </div>
  );
}
