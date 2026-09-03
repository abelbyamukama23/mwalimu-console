import type { InstitutionType, MembershipRole } from "../../types";

export interface InstitutionClassificationConfig {
  type: InstitutionType;
  title: string;
  subtitle: string;
  badgeStyle: string;
  roleLabels: Record<MembershipRole, string>;
  roleDescriptions: Record<MembershipRole, string>;
  defaultShelves: Array<{ name: string; description: string }>;
}

export const CLASSIFICATION_CONFIGS: Record<
  InstitutionType,
  InstitutionClassificationConfig
> = {
  school: {
    type: "school",
    title: "School (K-12)",
    subtitle: "Primary, secondary, or unified school administration",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200",
    roleLabels: {
      administrator: "School Administrator",
      teacher: "Teacher / Educator",
      student: "Student / Learner",
      librarian: "School Librarian",
    },
    roleDescriptions: {
      administrator: "Full management of school libraries, teachers, students, and settings.",
      teacher: "Can curate curriculum libraries, upload textbooks, and review student AI interactions.",
      student: "Read and query access to assigned classroom and grade libraries.",
      librarian: "Manages cataloging, document ingestion, and textbook shelves.",
    },
    defaultShelves: [
      { name: "Core Textbooks", description: "Official syllabus textbooks and primary readers." },
      { name: "Past Exam Papers", description: "National and school mock exam papers with marking schemes." },
      { name: "Laboratory & Practicals", description: "Experiment worksheets, safety guidelines, and practical manuals." },
      { name: "Teacher Notes & Syllabi", description: "Curriculum outlines, lesson plans, and teaching aids." },
    ],
  },
  university: {
    type: "university",
    title: "University / Higher Ed",
    subtitle: "Higher education faculties, academic departments, and research centers",
    badgeStyle: "bg-indigo-50 text-indigo-700 border-indigo-200",
    roleLabels: {
      administrator: "Dean / Faculty Admin",
      teacher: "Professor / Lecturer",
      student: "Undergraduate / Graduate Student",
      librarian: "Academic Librarian",
    },
    roleDescriptions: {
      administrator: "Full governance of academic faculties, departments, and course libraries.",
      teacher: "Directs course reading lists, uploads research literature, and assigns modules.",
      student: "Access to faculty course literature, lecture transcripts, and citations.",
      librarian: "Administers institutional repository indexing, DOIs, and cataloging.",
    },
    defaultShelves: [
      { name: "Required Course Readers", description: "Prescribed course literature and book chapters." },
      { name: "Lecture Slides & Transcripts", description: "Weekly lecture materials and audio/video transcripts." },
      { name: "Research & Academic Papers", description: "Peer-reviewed publications, dissertations, and journal articles." },
      { name: "Departmental Syllabi", description: "Academic course guides and assessment grading rubrics." },
    ],
  },
  college: {
    type: "college",
    title: "College / Tertiary",
    subtitle: "Polytechnics, vocational colleges, and tertiary institutes",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200",
    roleLabels: {
      administrator: "College Administrator",
      teacher: "Tutor / Instructor",
      student: "Apprentice / Student",
      librarian: "Campus Librarian",
    },
    roleDescriptions: {
      administrator: "Manages vocational programs, tutors, and learning resources.",
      teacher: "Curates technical modules, workshop manuals, and assessments.",
      student: "Access to vocational guides, textbooks, and technical references.",
      librarian: "Organizes technical manuals and trade reference materials.",
    },
    defaultShelves: [
      { name: "Technical Coursebooks", description: "Vocational textbooks and standard trade manuals." },
      { name: "Workshop Guides", description: "Step-by-step practical procedures and safety manuals." },
      { name: "Certification Modules", description: "Exam modules and industry certification prep." },
    ],
  },
  family: {
    type: "family",
    title: "Family Workspace",
    subtitle: "Parents and guardians managing personalized learning libraries for children",
    badgeStyle: "bg-amber-50 text-amber-700 border-amber-200",
    roleLabels: {
      administrator: "Parent / Guardian",
      teacher: "Home Tutor / Mentor",
      student: "Child / Learner",
      librarian: "Family Curator",
    },
    roleDescriptions: {
      administrator: "Supervises children's reading libraries, AI guardrails, and progress.",
      teacher: "Assigns homework reading, revision materials, and educational games.",
      student: "Interactive, safe AI learning aligned with age-appropriate books.",
      librarian: "Organizes home library collections and storybooks.",
    },
    defaultShelves: [
      { name: "Storybooks & Readers", description: "Bedtime readers, fiction, and age-graded literature." },
      { name: "Homework & Worksheets", description: "Weekly school homework tasks and practice worksheets." },
      { name: "Curiosity & Exploration", description: "Science, nature, encyclopedia entries, and general knowledge." },
    ],
  },
  training_center: {
    type: "training_center",
    title: "Training Center",
    subtitle: "Professional bootcamps, executive academies, and corporate learning centers",
    badgeStyle: "bg-cyan-50 text-cyan-700 border-cyan-200",
    roleLabels: {
      administrator: "Training Center Director",
      teacher: "Lead Trainer / Instructor",
      student: "Trainee / Participant",
      librarian: "Content Manager",
    },
    roleDescriptions: {
      administrator: "Administers corporate training cohorts, instructors, and certificates.",
      teacher: "Uploads training playbooks, case studies, and hands-on exercises.",
      student: "Access to professional training modules and certification materials.",
      librarian: "Maintains standard operating procedures and playbook documentation.",
    },
    defaultShelves: [
      { name: "Training Playbooks", description: "Standard operating procedures and company training manuals." },
      { name: "Case Studies", description: "Real-world industry examples and scenario simulations." },
      { name: "Assessment Drills", description: "Evaluation quizzes, practical prompts, and exams." },
    ],
  },
  education_organization: {
    type: "education_organization",
    title: "Educational Org / NGO",
    subtitle: "Non-profit foundations, educational initiatives, and ministry projects",
    badgeStyle: "bg-teal-50 text-teal-700 border-teal-200",
    roleLabels: {
      administrator: "Program Director",
      teacher: "Facilitator / Educator",
      student: "Participant / Beneficiary",
      librarian: "Resource Officer",
    },
    roleDescriptions: {
      administrator: "Manages educational grant programs, field teams, and resources.",
      teacher: "Distributes community learning kits and curriculum modules.",
      student: "Engages with educational content and community materials.",
      librarian: "Curates open educational resources and translations.",
    },
    defaultShelves: [
      { name: "Community Learning Kits", description: "Public education materials and field guides." },
      { name: "Policy & Guidelines", description: "Program standards, ethical guidelines, and manuals." },
      { name: "Open Educational Resources", description: "Freely accessible textbooks and public domain literature." },
    ],
  },
  other: {
    type: "other",
    title: "Learning Workspace",
    subtitle: "Independent research group, community lab, or learning collective",
    badgeStyle: "bg-slate-100 text-slate-700 border-slate-200",
    roleLabels: {
      administrator: "Workspace Admin",
      teacher: "Instructor / Lead",
      student: "Member / Learner",
      librarian: "Curator",
    },
    roleDescriptions: {
      administrator: "Workspace configuration, member directory, and libraries.",
      teacher: "Knowledge authoring and learning supervision.",
      student: "Access to shared knowledge repositories.",
      librarian: "Document classification and repository health.",
    },
    defaultShelves: [
      { name: "Core Documents", description: "Primary reference manuals and guidelines." },
      { name: "Shared Resources", description: "General literature, books, and working drafts." },
    ],
  },
};

export function getInstitutionConfig(
  type: InstitutionType | string | undefined | null
): InstitutionClassificationConfig {
  if (!type || !(type in CLASSIFICATION_CONFIGS)) {
    return CLASSIFICATION_CONFIGS.school;
  }
  return CLASSIFICATION_CONFIGS[type as InstitutionType];
}

export function getRoleLabel(
  role: MembershipRole | string,
  institutionType?: InstitutionType | string | null
): string {
  const config = getInstitutionConfig(institutionType);
  if (role in config.roleLabels) {
    return config.roleLabels[role as MembershipRole];
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function getRoleDescription(
  role: MembershipRole | string,
  institutionType?: InstitutionType | string | null
): string {
  const config = getInstitutionConfig(institutionType);
  if (role in config.roleDescriptions) {
    return config.roleDescriptions[role as MembershipRole];
  }
  return "";
}

/**
 * Parses a resource name to extract virtual shelf and document title.
 * Formats supported:
 * - "[Shelf Name] Title" -> { shelf: "Shelf Name", title: "Title" }
 * - "Shelf Name / Title" -> { shelf: "Shelf Name", title: "Title" }
 * - "Title" -> { shelf: "General Documents", title: "Title" }
 */
export function parseShelfAndTitle(resourceName: string): {
  shelf: string;
  title: string;
} {
  const bracketMatch = resourceName.match(/^\[([^\]]+)\]\s*(.+)$/);
  if (bracketMatch) {
    return { shelf: bracketMatch[1].trim(), title: bracketMatch[2].trim() };
  }

  const slashMatch = resourceName.match(/^([^\/]+)\s*\/\s*(.+)$/);
  if (slashMatch) {
    return { shelf: slashMatch[1].trim(), title: slashMatch[2].trim() };
  }

  return { shelf: "General Documents", title: resourceName.trim() };
}

/**
 * Formats shelf and document title for storage in the backend name field.
 */
export function formatShelfResourceName(shelf: string, title: string): string {
  const cleanShelf = shelf.trim();
  const cleanTitle = title.trim();
  if (!cleanShelf || cleanShelf === "General Documents" || cleanShelf === "All") {
    return cleanTitle;
  }
  return `[${cleanShelf}] ${cleanTitle}`;
}
