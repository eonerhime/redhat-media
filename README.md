# Project Specification & Architecture: RedHat Media Platform Redesign

## 1. Project Overview

- **Project Name:** RedHat Media Corporate & Digital Solutions Platform (`redhat-media.vercel.app`)
- **Objective:** Revamp the existing single-page landing page into a robust, high-performance, enterprise-grade Next.js web application that reflects true technical and media production capacity. It must seamlessly showcase full-stack engineering work from Emo Onerhime's portfolio (`emo-onerhime.vercel.app`) alongside detailed multi-disciplinary media and digital agency services.
- **Methodology:** Spec-Driven Development (SDD). The mission, approved tech stack and phased roadmap live in [`specs/`](specs/). All code implementation must strictly adhere to the data schemas, technical boundaries, and security rules outlined in this document.

---

## 2. Tech Stack & Architectural Rules

- **Frontend Framework:** Next.js (App Router) + React.js
- **Styling:** Tailwind CSS (mobile-first, sleek creative-tech aesthetic: high-contrast dark theme, bold typography, polished interactive card grids)
- **Language:** TypeScript (strict mode enabled; no implicit `any`)
- **Primary Database & ORM:** Neon (Serverless PostgreSQL) via **Prisma** (Neon serverless driver adapter)
- **Validation:** Zod (shared across server actions, client forms, and API routes)
- **Staff Authentication:** **Better Auth** (email + password, roles `admin`, `editor`, `sales`, public sign-up disabled)
- **Media Management:**
  - **Images & Photos:** Cloudinary (signed browser uploads, automated delivery, responsive transformations, and high-res photography galleries).
  - **Video Content:** Added via URL (YouTube / Vimeo) and embedded using click-to-play facades with auto-fetched poster thumbnails. No raw video files are self-hosted.
- **Security & Protection:**
  - **Rate Limiting:** Database-backed request throttling on all public contact/inquiry forms and CMS mutations using rolling windows.
  - **Brute-Force Protection:** IP and account-level login hardening with exponential delays and multi-factor requirement paths for staff users.
  - **Edge Security:** Cloudflare Turnstile bot challenges on high-intent forms, least-privilege Neon connection roles, strict Content Security Policies (CSP), and automated dependency vulnerability scans.
- **Transactional Email:** Resend (for client project inquiries, media booking requests, and internal team notifications)
- **Deployment & Hosting:** Vercel (Frontend & Server Actions)
- **UI/UX & Aesthetic Direction:**
  - **Industrial Creative Standard:** Clean modern agency feel blending high-end visual production (photography/videography showcases) with elite engineering rigor (clean code metrics, tech stack badges).
  - **Micro-Interactions & Motion:** Restrained, purposeful animations (`transition-all duration-200 ease-in-out`), smooth card hover elevation (`hover:-translate-y-1 hover:shadow-xl`), and crisp image scaling on project cards (`group-hover:scale-105`).

---

## 3. Project Directory Structure

```text
├── app/
│   ├── (public)/          # Public marketing site and portfolio explorer (EditModeProvider mounted here)
│   │   ├── page.tsx       # Homepage (Hero, core metrics, featured portfolio, service highlights)
│   │   ├── about/         # Agency story, mission, and multidisciplinary capabilities
│   │   ├── services/      # Detailed service breakdowns (Photography, Videography, Web & App Dev, Digital Marketing)
│   │   ├── portfolio/     # Combined showcase (Engineering products from emo-onerhime + Media/Production case studies)
│   │   └── contact/       # Project booking & inquiry form with rate limiting and Turnstile
│   ├── cms/               # Staff area: unlinked from public navigation, noindex
│   │   ├── login/         # Staff authentication (Better Auth), the only entry point signed-out
│   │   └── (protected)/   # Dashboard, lead inbox, staff management, and audit logs (role-checked)
│   └── api/               # Auth handler, session validation, webhooks
├── components/
│   └── cms/               # EditModeProvider, Editable text/image/gallery/video components
├── content/               # Default static text blocks keyed for the in-place CMS
├── lib/
│   ├── auth/              # Better Auth configuration and server-side role guard checks
│   ├── media/             # Cloudinary signing utility and video provider metadata parsers
│   └── validation/        # Zod validation schemas
├── prisma/                # Prisma database schema, migrations, and seed scripts
├── public/                # Static assets
└── specs/                 # SDD specification and architecture control files
```

---

## 4. Core Features & Functional Requirements

### A. Integrated Portfolio Hub (Engineering + Media Showcase)

- **Dual-Track Presentation:** Showcases full-stack software products originating from `emo-onerhime.vercel.app` (e.g., _SportsPred_, _HireFlow_, _toutMessages_, _Abara_, _AfroJamz_) featuring live demo links, tech stack badges, and architecture summaries, alongside professional photography, videography, and digital marketing case studies.
- **Filtering & Detail Modals:** Instant category filtering (`All`, `Web & Apps`, `Photography`, `Videography`, `Marketing`) with deep link support and responsive media lightbox viewers.

### B. Detailed Service Renderings & Scope Breakdown

- Dedicated deep-dive sections for each RedHat Media capability:

1. _Photography & Videography_ (Commercial, event, and portrait workflows with high-res gallery previews).
2. _Digital & Social Media Marketing_ (Campaign analytics, brand positioning, and social oversight).
3. _Web & App Development_ (High-performance web applications built under Spec-Driven Development principles).

### C. Multi-Tiered Client Booking & Project Inquiry Flow

- Interactive project scope selector where clients can specify service tiers, budget ranges, and project descriptions.
- Backed by database rate limiting, Zod validation, and Cloudflare Turnstile bot protection.
- Successful submissions are stored securely in the Neon database (`Inquiry` table) and instantly dispatched via Resend to the agency team with automated client confirmation emails.

### D. In-Place CMS ("Editing: On/Off") & Staff Back Office

- **Hidden Staff Entry:** Public pages contain no login button. Staff sign in exclusively via `/cms`. Unauthenticated visitors hitting `/cms` are routed to `/cms/login`. All CMS routes are marked `noindex`.
- **Edit Mode Toggle:** Authenticated `editor` and `admin` users see a floating toggle bar on the public site to modify text content inline, swap out Cloudinary images, reorder gallery items, or inject new video URLs on the fly.
- **Secure Mutations:** Every inline change triggers a server action verifying user role permissions (`requireRole`), validating inputs via Zod, refreshing cached Vercel ISR views, and writing an immutable audit log entry.
- **Back Office Dashboard (`/cms`):** Manage inbound client leads, view project booking statuses (`NEW`, `REVIEWING`, `PROPOSAL_SENT`, `CLOSED`), manage staff access roles, and inspect security audit trails.

---

## 5. Database Schema Blueprint (Neon PostgreSQL)

> **Note:** `specs/tech-stack.md` → *Schema decisions* lists deliberate changes to this blueprint (e.g. `ONLINE_PRESENCE`, multi-service inquiries, Better Auth tables). Phase 0 folds them into the schema below; until then the spec wins.

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../lib/generated/prisma"
}

enum ServiceCategory { WEB_APP PHOTOGRAPHY VIDEOGRAPHY DIGITAL_MARKETING SOCIAL_MEDIA BRANDING }
enum InquiryStatus   { NEW REVIEWING PROPOSAL_SENT CLOSED }
enum StaffRole       { ADMIN EDITOR SALES }
enum MediaKind       { IMAGE VIDEO }
enum VideoProvider   { YOUTUBE VIMEO }
enum MediaOwner      { PORTFOLIO_ITEM SERVICE PAGE }

model PortfolioItem {
  id           String          @id @default(cuid())
  title        String
  slug         String          @unique
  category     ServiceCategory
  summary      String
  description  String
  liveUrl      String?
  repoUrl      String?
  techStack    String[]        // e.g., ["Next.js", "TypeScript", "Tailwind CSS"]
  featured     Boolean         @default(false)
  published    Boolean         @default(false)
  sortOrder    Int             @default(0)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  // media: MediaItem rows with ownerType = PORTFOLIO_ITEM, ownerId = id
}

model MediaItem {
  id            String         @id @default(cuid())
  ownerType     MediaOwner
  ownerId       String         // portfolio item id, service id, or page slot key
  kind          MediaKind
  cloudinaryId  String?
  videoProvider VideoProvider?
  videoId       String?
  videoUrl      String?
  thumbnailUrl  String?
  alt           String?
  title         String?
  caption       String?
  sortOrder     Int            @default(0)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@index([ownerType, ownerId, sortOrder])
}

model ContentBlock {
  key         String   @id // e.g. "home.hero.headline"
  value       String
  updatedById String?
  updatedAt   DateTime @updatedAt
}

model Inquiry {
  id              String        @id @default(cuid())
  clientName      String
  companyName     String?
  email           String
  phone           String
  selectedService ServiceCategory
  budgetRange     String?
  projectNotes    String
  status          InquiryStatus @default(NEW)
  emailSentAt     DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

model RateLimitHit {
  id        String   @id @default(cuid())
  bucket    String   // e.g. "redhat.inquiry", "redhat.cms.mutation"
  keyHash   String   // SHA-256(salt + IP)
  windowEnd DateTime
  count     Int      @default(1)

  @@unique([bucket, keyHash, windowEnd])
  @@index([windowEnd])
}

model AuditEvent {
  id         String   @id @default(cuid())
  actorId    String
  action     String   // e.g. "portfolio.update", "inquiry.status"
  entityType String
  entityId   String
  diff       Json?
  createdAt  DateTime @default(now())

  @@index([entityType, entityId])
}

```

---

## 6. Security, Rate Limiting & Brute-Force Architecture

1. **Database-Backed Rate Limiting:** All public form submissions (contact/inquiries) and mutations pass through a centralized rate-limiting middleware that queries the `RateLimitHit` table. In-memory rate limiting is strictly prohibited to maintain consistency across distributed Vercel serverless functions.
2. **Brute-Force Login Hardening:** The Better Auth login endpoint on `/cms/login` enforces sliding-window IP tracking and account lockouts after consecutive failed authentication attempts.
3. **Authorization Enforcement:** Every server action handling database writes must explicitly invoke `requireRole(['ADMIN', 'EDITOR'])` or `requireRole(['SALES'])`. Client-side UI visibility checks never replace server-side validation.
4. **Data Sanitization:** Strict Zod validation schemas are enforced on all inbound parameters. Use of `dangerouslySetInnerHTML` or unescaped raw SQL queries (`$queryRawUnsafe`) is banned across the codebase.
