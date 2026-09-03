# Mwalimu Institutional Console

The **Institutional Console** is the administrative management workspace and control plane of the Mwalimu educational AI platform.

Conceptually analogous to platforms such as `platform.deepseek.com` and OpenAI developer consoles, the Institutional Console enables organizations to govern learning workspaces, manage members and roles, curate knowledge libraries, ingest textbooks and educational documents, configure pedagogical context catchment regions, and inspect AI token telemetry.

---

## Architecture & System Boundaries

```text
Browser
   │
   ▼
mwalimu-console (console.ai-mwalimu.com)
Institutional Control Plane (Next.js 16 + React 19 + Tailwind CSS v4)
   │
   │ HTTPS REST
   │ Bearer JWT Authentication
   │ X-Institution-Id Context Header
   ▼
mwalimu_final / platform_api (backend.ai-mwalimu.com)
Platform API System of Record (Django + Django REST Framework)
   ├── institutions (Tenant boundaries & classification)
   ├── memberships (Institutional roles: Admin, Teacher, Student, Librarian)
   ├── users (Authoritative identity database & OTP verification)
   ├── libraries (Personal & institutional knowledge containers)
   ├── resources (Document metadata & binary S3 keys)
   ├── processing (Hierarchical outlines, index terms, page maps, pgvector)
   ├── connectors (Google Drive, Notion, S3, Web Crawlers)
   ├── context (Geographic focus catchment regions)
   └── agents (Durable session ledgers & AI token telemetry)
```

### Tri-Plane Separation
1. **Experience Plane** (`app.ai-mwalimu.com`): Dedicated to learners and classroom teachers for interactive AI chat, problem-solving, and lesson plans.
2. **Control Plane** (`console.ai-mwalimu.com`, this repository): Dedicated to organization leaders, administrators, and librarians for governance and configuration.
3. **System of Record** (`backend.ai-mwalimu.com`): Authoritative Platform API enforcing all permissions, business rules, and database operations.

---

## Domain Models & Roles

### 1. Institution Types (`InstitutionType`)
An institution is an **organizational learning workspace**, not strictly a traditional school:
* `family`: Family workspace (parents managing libraries for children).
* `school`: Primary, secondary, or unified K-12 school.
* `college`: Vocational college or polytechnic.
* `university`: University faculty or higher-education institution.
* `training_center`: Professional academy or corporate training center.
* `education_organization`: Educational NGO or foundation.
* `other`: Independent learning group or research institute.

### 2. Membership Roles (`MembershipRole`)
* `administrator`: Full institutional workspace governance.
* `teacher`: Educator managing classroom resources and student assignments.
* `student`: Learner accessing authorized libraries.
* `librarian`: Specialist curating documents and external connectors.

---

## Authentication & Multi-Tenant Context

1. **Centralized Identity**: Authentication is owned authoritatively by the Platform API. Access tokens are short-lived HMAC-SHA256 JWTs passed in `Authorization: Bearer <token>`, with refresh tokens stored in HttpOnly cookies.
2. **Server-Authoritative Context**: The console injects the active workspace ID via the `X-Institution-Id: <uuid>` header on API requests. The Platform API independently verifies that the caller is an active member with the required role before granting access.
3. **Orphan Prevention**: The backend strictly blocks the final active administrator of an institution from being deleted, deactivated, or suspended.

---

## Getting Started (Local Development)

### Prerequisites
* Node.js v20+ (tested on Node v25)
* pnpm v10+ (or npm v11+)
* Platform API running locally at `http://localhost:8000` (or configured remote URL)

### Installation
```bash
# Clone or navigate to directory
cd Desktop/mwalimu-console

# Install dependencies
pnpm install
```

### Environment Configuration
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure `NEXT_PUBLIC_API_URL`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Development Server
```bash
pnpm dev
```
Open [http://localhost:3001](http://localhost:3001) in your browser.

### Production Build & Typecheck
```bash
# Run TypeScript typecheck
pnpm typecheck

# Build optimized production bundle
pnpm build

# Run production server
pnpm start
```

---

## Navigation & Workspaces

* `/login` & `/register`: Self-service administrator authentication.
* `/verify-email`: 6-digit OTP identity verification.
* `/onboarding`: Institution creation wizard (Name, Slug, Classification).
* `/dashboard`: Workspace overview, status badges, and quick actions.
* `/people`: Member directory, role modification, status toggles, and safe member removal.
* `/libraries`: Institutional knowledge containers, creation wizard, and visibility controls.
* `/resources`: Document repository, file dropzone, ingestion pipeline inspector, and binary download.
* `/access`: Granular library RBAC access policy matrix, member role grants, and revocations.
* `/settings`: Workspace profile, slug identifier, and danger zone.

---

## License & Governance
Proprietary — Mwalimu AI Platform. All rights reserved.
