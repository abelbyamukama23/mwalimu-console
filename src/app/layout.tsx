import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "../lib/auth/session-context";
import { InstitutionProvider } from "../lib/institution/institution-context";
import { ThemeProvider } from "../lib/theme/theme-context";

export const metadata: Metadata = {
  title: "Mwalimu Institutional Console",
  description: "Institutional Control Plane for Learning Workspaces",
};

const themeScript = `(function() {
  try {
    var raw = localStorage.getItem('mwalimu.device_preferences');
    var theme = 'system';
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed.theme) theme = parsed.theme;
    }
    var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-canvas text-ink antialiased">
        <ThemeProvider>
          <SessionProvider>
            <InstitutionProvider>{children}</InstitutionProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
