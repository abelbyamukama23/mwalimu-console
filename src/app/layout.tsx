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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-ink antialiased">
        <SessionProvider>
          <InstitutionProvider>{children}</InstitutionProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
