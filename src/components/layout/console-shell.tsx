"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building01Icon,
  Grid02Icon,
  UserGroupIcon,
  Book02Icon,
  File01Icon,
  LockKeyIcon,
  Settings01Icon,
  Logout01Icon,
  ArrowDown01Icon,
  PlusSignIcon,
  Menu01Icon,
  Cancel01Icon,
} from "hugeicons-react";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import { INSTITUTION_TYPE_LABELS } from "../../types";

const NAV_ITEMS = [
  { id: "dashboard", label: "Overview", href: "/dashboard", icon: Grid02Icon },
  { id: "people", label: "People & Members", href: "/people", icon: UserGroupIcon },
  { id: "libraries", label: "Libraries & Knowledge", href: "/libraries", icon: Book02Icon },
  { id: "resources", label: "Resources & Ingestion", href: "/resources", icon: File01Icon },
  { id: "access", label: "Access Policies", href: "/access", icon: LockKeyIcon },
  { id: "settings", label: "Organization Settings", href: "/settings", icon: Settings01Icon },
];

export function ConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();
  const {
    institutions,
    activeInstitution,
    setActiveInstitution,
  } = useInstitution();

  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* Sidebar Desktop */}
      <aside className="hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-slate-100 md:flex">
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-white font-bold text-sm shadow-sm">
            M
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              Mwalimu
            </div>
            <div className="text-xs text-slate-400">Institutional Console</div>
          </div>
        </div>

        {/* Institution Switcher */}
        <div className="relative border-b border-sidebar-border p-3">
          <button
            onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
            className="flex w-full items-center justify-between rounded-md bg-sidebar-hover px-3 py-2.5 text-left text-xs transition-colors hover:bg-sidebar-active focus-ring"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Building01Icon size={16} className="shrink-0 text-accent" />
              <div className="min-w-0">
                <div className="truncate font-medium text-white">
                  {activeInstitution ? activeInstitution.name : "Select Institution"}
                </div>
                <div className="truncate text-[10px] text-slate-400">
                  {activeInstitution
                    ? INSTITUTION_TYPE_LABELS[activeInstitution.institution_type] ||
                      activeInstitution.institution_type
                    : "No workspace selected"}
                </div>
              </div>
            </div>
            <ArrowDown01Icon size={14} className="shrink-0 text-slate-400" />
          </button>

          {/* Switcher Dropdown */}
          {isSwitcherOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md border border-sidebar-border bg-slate-900 p-1.5 shadow-xl">
              <div className="px-2 py-1 text-[11px] font-medium text-slate-400">
                Your Workspaces
              </div>
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {institutions.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      setActiveInstitution(inst.id);
                      setIsSwitcherOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition-colors ${
                      inst.id === activeInstitution?.id
                        ? "bg-accent text-white font-medium"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <span className="truncate">{inst.name}</span>
                    <span className="text-[10px] opacity-70">
                      {inst.institution_type}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-1 border-t border-slate-800 pt-1">
                <Link
                  href="/onboarding"
                  onClick={() => setIsSwitcherOpen(false)}
                  className="flex items-center gap-2 rounded px-2.5 py-1.5 text-xs text-accent hover:bg-slate-800 transition-colors"
                >
                  <PlusSignIcon size={14} />
                  <span>Register New Workspace</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-white"
                    : "text-slate-400 hover:bg-sidebar-hover hover:text-slate-200"
                }`}
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Account / Footer */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-md bg-sidebar-hover px-3 py-2 text-xs">
            <div className="min-w-0 pr-2">
              <div className="truncate font-medium text-white">
                {user?.profile?.display_name || user?.email || "Administrator"}
              </div>
              <div className="truncate text-[10px] text-slate-400">
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-rose-400 transition-colors"
            >
              <Logout01Icon size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded p-1.5 text-ink-secondary hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <Cancel01Icon size={20} /> : <Menu01Icon size={20} />}
            </button>
            <span className="font-semibold text-sm">Mwalimu Console</span>
          </div>
          <div className="text-xs font-medium text-accent">
            {activeInstitution?.name}
          </div>
        </header>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <div
              className="h-full w-64 bg-sidebar p-4 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 text-sm font-semibold">Mwalimu Console</div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block rounded px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
