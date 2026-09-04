"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Bell,
  Users,
  GraduationCap,
  BookOpen,
  Shield,
  Network,
  Settings,
  Building2,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import { useTheme } from "../../lib/theme/theme-context";
import { INSTITUTION_TYPE_LABELS } from "../../types";
import { MwalimuLogo } from "../ui/logo";
import { NotificationCenter } from "../notifications/notification-center";

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Intelligence",
    items: [
      { id: "dashboard", label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { id: "usage", label: "AI Usage", href: "/usage", icon: Cpu },
      { id: "activity", label: "Audit Ledger", href: "/activity", icon: Bell },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "people", label: "People & Members", href: "/people", icon: Users },
      {
        id: "academic-structure",
        label: "Academic Structure",
        href: "/academic-structure",
        icon: GraduationCap,
      },
      { id: "libraries", label: "Knowledge Libraries", href: "/libraries", icon: BookOpen },
      { id: "access", label: "Access Policies", href: "/access", icon: Shield },
    ],
  },
  {
    title: "Integrations",
    items: [
      { id: "connectors", label: "Knowledge Connectors", href: "/connectors", icon: Network },
    ],
  },
  {
    title: "Configuration",
    items: [
      { id: "settings", label: "Organization Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const { activeInstitution } = useInstitution();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink transition-colors duration-150">
      {/* Sidebar Desktop */}
      <aside className="hidden w-60 h-screen flex-col border-r border-sidebar-border bg-sidebar shrink-0 md:flex transition-colors duration-150">
        {/* Brand Header */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <MwalimuLogo size={24} priority />
            <span className="text-base font-semibold tracking-tight text-ink">Mwalimu</span>
            <span className="rounded bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              Console
            </span>
          </div>

          {/* Quick theme toggle */}
          <button
            onClick={cycleTheme}
            title={`Theme: ${theme} (Click to change)`}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-ink-secondary hover:bg-subtle hover:text-ink transition-colors"
          >
            {theme === "dark" ? (
              <Moon size={14} className="text-accent" />
            ) : theme === "light" ? (
              <Sun size={14} className="text-amber-500" />
            ) : (
              <Monitor size={14} className="text-ink-secondary" />
            )}
          </button>
        </div>

        {/* Static Institution Identity Card */}
        <div className="border-b border-sidebar-border p-3">
          <div className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface px-2.5 py-2 text-left shadow-xs transition-colors">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-active text-accent shrink-0 overflow-hidden border border-border/40">
              {activeInstitution?.badge_url ? (
                <img
                  src={activeInstitution.badge_url}
                  alt={activeInstitution.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 size={15} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-ink text-xs leading-tight">
                {activeInstitution ? activeInstitution.name : "Institution"}
              </div>
              <div className="truncate text-[10px] text-ink-secondary leading-tight mt-0.5">
                {activeInstitution
                  ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type] ||
                    activeInstitution.institution_type
                  : "Institutional Console"}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-active text-accent font-semibold"
                        : "text-ink-secondary hover:bg-subtle hover:text-ink"
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${isActive ? "text-accent" : "text-ink-tertiary"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Account / Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg bg-surface border border-border px-2.5 py-2 text-xs transition-colors">
            <div className="min-w-0 pr-2">
              <div className="truncate font-medium text-ink">
                {user?.profile?.display_name || user?.email || "Administrator"}
              </div>
              <div className="truncate text-[10px] text-ink-secondary">
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded p-1 text-ink-tertiary hover:bg-subtle hover:text-rose-500 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area — Scrolls independently */}
      <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0 bg-canvas transition-colors duration-150">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden shrink-0 transition-colors">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded p-1.5 text-ink-secondary hover:bg-subtle"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <MwalimuLogo size={22} priority />
            <span className="font-semibold text-sm text-ink">Mwalimu</span>
            <span className="rounded bg-accent-subtle text-accent border border-accent/20 px-1 py-0.2 text-[9px] font-semibold uppercase">
              Console
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            <button
              onClick={cycleTheme}
              title="Toggle theme"
              className="flex h-7 w-7 items-center justify-center rounded border border-border bg-surface text-ink-secondary"
            >
              {resolvedTheme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <div className="text-xs font-medium text-accent truncate max-w-[110px]">
              {activeInstitution?.name}
            </div>
          </div>
        </header>

        {/* Desktop Top Header */}
        <header className="hidden md:flex h-14 items-center justify-between border-b border-border bg-surface px-6 shrink-0 transition-colors">
          <div className="flex items-center gap-2 text-xs text-ink-secondary">
            <span className="font-semibold text-ink">{activeInstitution?.name || "Institution"}</span>
            <span className="text-ink-tertiary">/</span>
            <span className="capitalize">{pathname.split("/")[1] || "overview"}</span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/50 md:hidden backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="h-full w-64 bg-sidebar p-4 text-ink overflow-y-auto shadow-2xl border-r border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <MwalimuLogo size={24} />
                  <span className="font-semibold text-base text-ink">Mwalimu</span>
                  <span className="rounded bg-accent-subtle text-accent border border-accent/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase">
                    Console
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded p-1 text-ink-secondary hover:text-ink"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-0.5">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      {group.title}
                    </div>
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            isActive
                              ? "bg-active text-accent font-semibold"
                              : "text-ink-secondary hover:bg-subtle hover:text-ink"
                          }`}
                        >
                          <Icon size={16} className={`shrink-0 ${isActive ? "text-accent" : "text-ink-tertiary"}`} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="mt-8 border-t border-border pt-4">
                <div className="flex items-center justify-between rounded-lg bg-surface border border-border p-2 text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-medium text-ink">{user?.email}</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded p-1 text-ink-secondary hover:text-rose-500"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
