import React, { Suspense } from "react";
import LibraryDetailClient from "../[id]/library-detail-client";

export default function LibraryViewPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-400">
          Loading library shelves...
        </div>
      }
    >
      <LibraryDetailClient />
    </Suspense>
  );
}
