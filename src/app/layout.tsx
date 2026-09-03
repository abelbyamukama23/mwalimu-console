import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "../lib/auth/session-context";
import { InstitutionProvider } from "../lib/institution/institution-context";

export const metadata: Metadata = {
  title: "Mwalimu Institutional Console",
  description: "Institutional Control Plane for Learning Workspaces",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink antialiased">
        <SessionProvider>
          <InstitutionProvider>{children}</InstitutionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
