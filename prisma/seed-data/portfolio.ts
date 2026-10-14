// Portfolio seed content, approved by the owner on 2026-10-13 (Phase 9 spec,
// Appendix A). Every highlight traces to the product's README or to
// emo-onerhime.vercel.app; no metric is invented (D1). Cover files live in the
// upload script's source folder, never in this repository (D6).

import type { PortfolioSeedItem } from "../../lib/portfolio/schema.ts";

const credit = "Design & Engineering: Emo Onerhime";
// The mission links engineering credits to the personal portfolio (Phase 12 spec, D8).
const creditUrl = "https://emo-onerhime.vercel.app";
const publishedAt = "2026-10-13";

export const portfolioSeed: readonly PortfolioSeedItem[] = [
  {
    slug: "sportspred",
    title: "SportsPred",
    category: "WEB_APP",
    summary: "AI-powered football predictions for African bettors.",
    description:
      "A prediction platform that blends Poisson, Elo and form/head-to-head models across 13 football leagues. It ships an accumulator builder, a betting history tracker with real payout maths, 13-currency auto-detection and Paystack subscription tiers.",
    credit,
    creditUrl,
    highlights: [
      "Predictions across 13 football leagues from a three-model engine: Poisson, Elo and form/head-to-head.",
      "A backtested weighted blend of the three models: Poisson 10%, Elo 60%, form/head-to-head 30%.",
      "Accumulator builder with pick limits per plan (Free 3, Premium 7, Pro unlimited).",
      "Tracked bets settle automatically when match results arrive.",
      "13 currencies, auto-detected from the visitor's location.",
    ],
    techStack: [
      "Next.js 16",
      "TypeScript",
      "Tailwind CSS 4",
      "Prisma",
      "PostgreSQL (Neon)",
      "NextAuth",
      "Paystack",
      "Resend",
    ],
    liveUrl: "https://sportspred.ng",
    featured: true,
    publishedAt,
    cover: {
      source: "sportspred.webp",
      alt: "SportsPred home page with today's football predictions, league filters and accuracy figures.",
    },
  },
  {
    slug: "hireflow-track",
    title: "HireFlow",
    category: "WEB_APP",
    summary: "A job application tracker, built in public with specs.",
    description:
      "A six-stage Kanban pipeline for tracking job applications, contacts and follow-up reminders, built entirely in the open. Every feature starts as a written spec before any code ships.",
    credit,
    creditUrl,
    highlights: [
      "Six-stage Kanban pipeline for applications, contacts and follow-up reminders.",
      "A browser extension that saves job postings from LinkedIn Easy Apply or any job page.",
      "Applications are never hard-deleted; a timestamp marks deletion.",
      "JWT sessions in HTTP-only cookies, verified at the edge with the Web Crypto API.",
      "Built in public: every feature is specified before it is coded.",
    ],
    techStack: [
      "Next.js 15",
      "TypeScript",
      "Prisma",
      "PostgreSQL (Neon)",
      "Tailwind CSS 4",
      "Zod",
      "Jest",
    ],
    liveUrl: "https://hireflow-track.vercel.app",
    repoUrl: "https://github.com/eonerhime/hireflow-track",
    featured: false,
    publishedAt,
    cover: {
      source: "hireflow-track.webp",
      alt: "HireFlow dashboard showing the application pipeline from Applied to Offer, with totals.",
    },
  },
  {
    slug: "afro-jamz",
    title: "AfroJamz",
    category: "WEB_APP",
    summary: "A marketplace for African beat producers and buyers.",
    description:
      "A full-stack beat marketplace where producers upload and license beats and buyers purchase and download them. It has role-based access, Google sign-in and a Fiverr-style escrow wallet with a seven-day withdrawal hold.",
    credit,
    creditUrl,
    highlights: [
      "Escrow-style wallet that holds producer earnings for seven days before withdrawal.",
      "A 30% platform commission enforced on the server for every transaction.",
      "60+ API endpoints documented with Swagger.",
      "Producer and buyer roles, with Google sign-in.",
      "Beat uploads in MP3, WAV, M4A or FLAC, up to 50 MB.",
    ],
    techStack: [
      "React 19",
      "Vite",
      "Tailwind CSS 4",
      "Express 5",
      "Google OAuth",
      "Cloudinary",
      "Jest",
    ],
    liveUrl: "https://afro-jamz.vercel.app",
    featured: true,
    publishedAt,
    cover: {
      source: "afro-jamz.webp",
      alt: "AfroJamz home page with the headline “The sound of Africa, yours to own.” and a beat search box.",
    },
  },
  {
    slug: "toutmessages",
    title: "toutMessages",
    category: "WEB_APP",
    summary: "One inbox for every social channel, built for teams.",
    description:
      "A multi-tenant support inbox that brings DMs, comments and mentions from nine platforms into one list: WhatsApp, Instagram, Facebook, Threads, Telegram, email, X, TikTok and LinkedIn. It includes AI-drafted replies, an analytics dashboard and organisation-level billing.",
    credit,
    creditUrl,
    highlights: [
      "Every DM and comment across nine channels in one inbox.",
      "AI-drafted replies on demand, generated with Claude.",
      "Outbound webhooks signed with HMAC-SHA256.",
      "Billing through Stripe, or Paystack and Flutterwave in African markets, chosen by location.",
      "Multi-tenant, with organisation-level billing and analytics.",
    ],
    techStack: [
      "Next.js 16",
      "Express 5",
      "TypeScript",
      "PostgreSQL (Neon)",
      "Clerk",
      "Stripe",
      "Paystack",
      "Anthropic API",
    ],
    liveUrl: "https://toutmessages.vercel.app",
    featured: true,
    publishedAt,
    cover: {
      source: "toutmessages.webp",
      alt: "toutMessages inbox with conversations grouped by channel and a reply box.",
    },
  },
  {
    slug: "abara",
    title: "Abara",
    category: "WEB_APP",
    summary: "WhatsApp-first inventory and business management.",
    description:
      "A business tool run entirely by WhatsApp message: sales, restocks, income and expenses are logged with plain-language commands and a small set of optional shortcuts. Stock and money always reconcile, because no sale posts without moving inventory and no restock posts without its real cost.",
    credit,
    creditUrl,
    highlights: [
      "Sales, restocks, income and expenses logged by WhatsApp message in plain language.",
      "Optional shortcuts for speed: s/ for a sale, r/ for a restock, + and - for money, ? for a question.",
      "Stock and money always reconcile: every sale moves inventory and every restock records its cost.",
      "Staff pay, invoices and receipts from the same chat.",
      "A web dashboard for inventory, the ledger and reports.",
    ],
    techStack: [
      "Next.js 16",
      "Express 5",
      "TypeScript",
      "PostgreSQL (Neon)",
      "Drizzle ORM",
      "BullMQ",
      "Clerk",
      "WhatsApp",
    ],
    liveUrl: "https://abara.vercel.app",
    featured: false,
    publishedAt,
    cover: {
      source: "abara.webp",
      alt: "Abara dashboard with quick actions, today's snapshot, recent sales and restocks, and inventory alerts.",
    },
  },
];
