"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Home,
  School,
  GraduationCap,
  Award,
  Globe,
  Folder,
} from "lucide-react";
import { useSession } from "../../lib/auth/session-context";
import { useInstitution } from "../../lib/institution/institution-context";
import type { InstitutionType } from "../../types";

const TYPE_OPTIONS: Array<{
  type: InstitutionType;
  title: string;
  desc: string;
  icon: typeof Building2;
}> = [
  {
    type: "school",
    title: "School (K-12)",
    desc: "Primary, secondary, or unified school administration.",
    icon: School,
  },
  {
    type: "university",
    title: "University / Higher Ed",
    desc: "Higher education faculties, deans, and academic departments.",
    icon: GraduationCap,
  },
  {
    type: "college",
    title: "College / Tertiary",
    desc: "Vocational colleges, polytechnics, and tertiary institutes.",
    icon: Award,
  },
  {
    type: "family",
    title: "Family Workspace",
    desc: "Parents and guardians managing learning libraries for children.",
    icon: Home,
  },
  {
    type: "training_center",
    title: "Training Center",
    desc: "Professional academies, bootcamps, and corporate trainers.",
    icon: Building2,
  },
  {
    type: "education_organization",
    title: "Educational NGO / Org",
    desc: "Non-profits, foundations, and educational programs.",
    icon: Globe,
  },
  {
    type: "other",
    title: "Other Organization",
    desc: "Custom learning group, independent institute, or research lab.",
    icon: Folder,
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
  const { institutions, isLoading: instLoading, createInstitution } = useInstitution();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugCustomized, setIsSlugCustomized] = useState(false);
  const [selectedType, setSelectedType] = useState<InstitutionType>("school");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    } else if (
      !authLoading &&
      !instLoading &&
      isAuthenticated &&
      institutions.length > 0
    ) {
      // Once an institution exists for this account, onboarding is permanently sealed.
      router.replace("/dashboard");
    }
  }, [authLoading, instLoading, isAuthenticated, institutions.length, router]);

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

  if (authLoading || instLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-xs text-slate-400">Verifying institutional credentials...</div>
      </div>
    );
  }

  // If the user already has an established institution, suppress rendering during redirect
  if (institutions.length > 0) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="mb-6">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg font-bold tracking-tight text-slate-900">mwalimu</span>
            <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
              Console
            </span>
            <span className="ml-2 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
              Setup: Who are you?
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight">
            Who are you? (Set Up Your Workspace)
          </h1>
          <p className="mt-1 text-xs sm:text-[13px] text-slate-500">
            Select your institution type and organization name. Once established, your institutional profile is permanently bound to this administrative account.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. St. Jude High School, Makerere University, The Smith Family"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Workspace URL Slug
            </label>
            <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50/50 px-3 focus-within:bg-white focus-within:border-accent">
              <span className="text-xs text-slate-400 select-none">
                ai-mwalimu.com/inst/
              </span>
              <input
                type="text"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="st-jude-high"
                className="w-full border-none bg-transparent p-0 text-xs text-slate-900 outline-none"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Unique identifier used for your workspace routing.
            </p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-2">
              Institution Classification
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType(opt.type)}
                    className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/5 ring-1 ring-accent"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <Icon
                      size={16}
                      className={`shrink-0 mt-0.5 ${
                        isSelected ? "text-accent" : "text-slate-400"
                      }`}
                    />
                    <div>
                      <div className="text-xs font-medium text-slate-900">
                        {opt.title}
                      </div>
                      <div className="text-[11px] text-slate-500 leading-normal">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-9 rounded-lg bg-slate-900 px-4 text-xs font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? "Provisioning Workspace..." : "Create Workspace & Enter Console"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
