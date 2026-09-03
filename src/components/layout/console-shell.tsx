"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Cpu,
  Bell,
  Users,
  BookOpen,
  Shield,
  Network,
  Settings,
  Building2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import { INSTITUTION_TYPE_LABELS } from "../../types";

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
      { id: "activity", label: "Notifications", href: "/activity", icon: Bell },
    ],
  },
  {
    title: "Management",
    items: [
      { id: "people", label: "People & Members", href: "/people", icon: Users },
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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink">
      {/* Sidebar Desktop */}
      <aside className="hidden w-60 h-screen flex-col border-r border-sidebar-border bg-sidebar shrink-0 md:flex">
        {/* Brand Header (DeepSeek style wordmark + badge) */}
        <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900">mwalimu</span>
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wider">
              Console
            </span>
          </div>
        </div>

        {/* Static Institution Identity Card (Single Workspace) */}
        <div className="border-b border-sidebar-border p-3">
          <div className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-white px-2.5 py-2 text-left shadow-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10 text-accent shrink-0">
              <Building2 size={15} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-slate-900 text-xs leading-tight">
                {activeInstitution ? activeInstitution.name : "Institution"}
              </div>
              <div className="truncate text-[10px] text-slate-500 leading-tight mt-0.5">
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
              <div className="px-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
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
                        ? "bg-accent-subtle text-accent font-semibold"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={16} className={`shrink-0 ${isActive ? "text-accent" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Account / Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-slate-50 border border-slate-100 px-2.5 py-2 text-xs">
            <div className="min-w-0 pr-2">
              <div className="truncate font-medium text-slate-900">
                {user?.profile?.display_name || user?.email || "Administrator"}
              </div>
              <div className="truncate text-[10px] text-slate-500">
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area — Scrolls independently */}
      <div className="flex flex-1 flex-col h-screen overflow-y-auto min-w-0 bg-canvas">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded p-1.5 text-ink-secondary hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="font-bold text-sm text-slate-900">mwalimu</span>
            <span className="rounded bg-slate-900 px-1 py-0.2 text-[9px] font-semibold text-white uppercase">
              Console
            </span>
          </div>
          <div className="text-xs font-medium text-accent truncate max-w-[160px]">
            {activeInstitution?.name}
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/40 md:hidden backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div
              className="h-full w-64 bg-white p-4 text-slate-900 overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-slate-900">mwalimu</span>
                  <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-semibold text-white uppercase">
                    Console
                  </span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded p-1 text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="space-y-4">
                {NAV_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-0.5">
                    <div className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {group.title}
                    </div>
                    {group.items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block rounded-lg px-2.5 py-2 text-xs ${
                          pathname === item.href
                            ? "bg-accent-subtle text-accent font-semibold"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
