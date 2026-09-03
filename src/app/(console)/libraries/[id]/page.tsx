import LibraryDetailClient from "./library-detail-client";

export function generateStaticParams() {
  return [{ id: "view" }];
}

export default function LibraryDetailPage() {
  return <LibraryDetailClient />;
}
