"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building01Icon,
  Home01Icon,
  SchoolIcon,
  Mortarboard01Icon,
  Certificate01Icon,
  Globe02Icon,
  Folder01Icon,
} from "hugeicons-react";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import type { InstitutionType } from "../../types";

const TYPE_OPTIONS: Array<{
  type: InstitutionType;
  title: string;
  desc: string;
  icon: typeof Building01Icon;
}> = [
  {
    type: "school",
    title: "School (K-12)",
    desc: "Primary, secondary, or unified school administration.",
    icon: SchoolIcon,
  },
  {
    type: "university",
    title: "University / Higher Ed",
    desc: "Higher education faculties, deans, and academic departments.",
    icon: Mortarboard01Icon,
  },
  {
    type: "college",
    title: "College / Tertiary",
    desc: "Vocational colleges, polytechnics, and tertiary institutes.",
    icon: Certificate01Icon,
  },
  {
    type: "family",
    title: "Family Workspace",
    desc: "Parents and guardians managing learning libraries for children.",
    icon: Home01Icon,
  },
  {
    type: "training_center",
    title: "Training Center",
    desc: "Professional academies, bootcamps, and corporate trainers.",
    icon: Building01Icon,
  },
  {
    type: "education_organization",
    title: "Educational NGO / Org",
    desc: "Non-profits, foundations, and educational programs.",
    icon: Globe02Icon,
  },
  {
    type: "other",
    title: "Other Organization",
    desc: "Custom learning group, independent institute, or research lab.",
    icon: Folder01Icon,
  },
];

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useSession();
  const { createInstitution } = useInstitution();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [selectedType, setSelectedType] = useState<InstitutionType>("school");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    if (!isSlugCustomized) {
      setSlug(generateSlug(val));
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugCustomized(true);
    setSlug(generateSlug(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your institution name.");
      return;
    }
    if (!slug.trim()) {
      setError("Please provide a valid slug identifier.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await createInstitution({
        name: name.trim(),
        slug: slug.trim(),
        institution_type: selectedType,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create institution.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-xs text-ink-secondary">Loading session...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white font-bold text-sm">
            M
          </div>
          <h1 className="text-xl font-semibold text-ink">
            Register Your Institutional Workspace
          </h1>
          <p className="mt-1 text-xs text-ink-secondary">
            Set up your organization. You will automatically become the primary
            administrator of this learning workspace.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-danger-fg/20 bg-danger-bg p-3 text-xs text-danger-fg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. St. Jude High School, Makerere University, The Smith Family"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus-ring"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-1">
              Workspace URL Slug
            </label>
            <div className="flex items-center rounded-md border border-border bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1">
              <span className="text-xs text-ink-tertiary select-none">
                ai-mwalimu.com/inst/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="st-jude-high"
                className="w-full border-none bg-transparent p-0 text-sm text-ink outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-ink-tertiary">
              Unique identifier used for your workspace routing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink mb-2">
              Institution Classification
            </label>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-border bg-surface hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 mt-0.5 ${
                        isSelected ? "text-accent" : "text-ink-tertiary"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-medium text-ink">
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-ink-secondary leading-relaxed">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-accent px-5 py-2.5 text-xs font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-50 focus-ring"
            >
              {isSubmitting ? "Provisioning Workspace..." : "Create Workspace & Enter Console"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
