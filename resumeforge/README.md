# ResumeForge — AI Career Intelligence Platform

Production-grade Next.js 14 frontend for ResumeForge, an AI-powered career optimization platform.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + custom design system |
| UI Components | shadcn/ui (Radix UI primitives) |
| State | Zustand (global) + TanStack Query v5 (server state) |
| Forms | React Hook Form + Zod validation |
| HTTP | Axios with JWT interceptors + auto token refresh |
| Charts | Recharts (radar, progress) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | Sonner |
| Theme | next-themes (dark/light/system) |

## Project Structure

```
resumeforge/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # Email + password login
│   │   └── register/page.tsx       # Registration with features panel
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + topbar shell
│   │   ├── page.tsx                # Dashboard home
│   │   ├── resume/page.tsx         # Resume upload & versioning
│   │   ├── ats-score/page.tsx      # ATS compatibility scorer
│   │   ├── optimize/page.tsx       # AI resume optimizer (async polling)
│   │   ├── interview/
│   │   │   ├── page.tsx            # Interview history + start new
│   │   │   └── [sessionId]/page.tsx # Active interview session
│   │   ├── skills/page.tsx         # Skill gap + learning roadmap
│   │   ├── settings/page.tsx       # Profile & security settings
│   │   └── error.tsx               # Dashboard error boundary
│   ├── globals.css                 # CSS variables + custom utilities
│   └── layout.tsx                  # Root layout with providers
│
├── components/
│   ├── ui/                         # Base component library
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── textarea.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── skeleton.tsx
│   │   ├── progress.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── accordion.tsx
│   ├── providers.tsx               # TanStack Query + Theme providers
│   └── error-boundary.tsx          # Error boundary + fallback UI
│
├── lib/
│   ├── api/
│   │   ├── client.ts               # Axios + JWT interceptors + token refresh
│   │   ├── types.ts                # All TypeScript interfaces
│   │   ├── auth.ts                 # login, register, refresh, logout, getMe
│   │   ├── resume.ts               # upload, list, download, delete, setActive
│   │   ├── ai.ts                   # getAtsScore, startOptimize, pollOptimize
│   │   ├── interview.ts            # startSession, submitAnswer, endSession
│   │   └── skills.ts               # runGapAnalysis, getRoadmap, updateRoadmapItem
│   ├── config.ts                   # API URLs, env vars, constants
│   └── utils.ts                    # cn(), formatters, score helpers
│
├── store/
│   ├── auth.store.ts               # user, isAuthenticated, login, logout
│   ├── resume.store.ts             # selectedResumeId
│   └── ui.store.ts                 # sidebarOpen, theme
│
└── middleware.ts                   # JWT route protection
```

## Features

### 1. Resume Management (`/dashboard/resume`)
- Drag-and-drop upload (react-dropzone) with animated progress bar
- Version grid with status badges (processing/ready/error)
- Download via presigned URL, delete with confirmation dialog
- Optimistic delete (instant UI update, reverts on error)
- Set active resume for use across features

### 2. ATS Scorer (`/dashboard/ats-score`)
- Resume selector + job description textarea (min 200 chars)
- Animated circular progress (SVG, score-colored)
- Score pillar breakdown: Keyword Match, Semantic Fit, Format Quality
- Matched vs missing keyword badges
- CTA to pre-fill AI Optimizer with the same JD

### 3. AI Optimizer (`/dashboard/optimize`)
- Async job submission → polling via TanStack Query `refetchInterval`
- Step indicator: Analyzing → Processing → Generating → Creating PDF
- Side-by-side diff view: original (muted) vs optimized (green highlight)
- Score improvement badge: `62 → 89 (+27)`
- Download optimized PDF

### 4. Mock Interview (`/dashboard/interview`)
- Session config modal: type × difficulty × question count
- Active session: question card, textarea answer, AI feedback card
- Feedback: score/10, strengths, improvements, ideal answer preview
- Session summary: radar chart + per-question score table
- Interview history table

### 5. Skill Gap Analyzer (`/dashboard/skills`)
- Gap analysis → color-coded skill grid (present/partial/missing)
- Skills by category (accordion)
- Kanban roadmap: Not Started → In Progress → Completed
- Optimistic status updates on roadmap cards
- Roadmap completion progress ring

## Auth Flow
- JWT stored in localStorage (access) + httpOnly cookie (refresh)
- Axios interceptor: 401 → refresh → retry original request → logout on failure
- `middleware.ts`: protects all `/dashboard/*` routes, redirects to `/login`
- Zustand auth store persisted to localStorage

## Design System
- **Dark-first**: `#0F0F11` background, `#18181B` cards, `#27272A` borders
- **Primary**: Indigo `#6366F1` for CTAs, active states, highlights
- **Mono**: JetBrains Mono for scores, version numbers, code
- **Cards**: 1px border, subtle hover lift (`-translate-y-0.5`)
- **Skeletons**: All async sections have matching skeleton shapes
- **Framer Motion**: Page transitions, card entrances, circular progress

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL to your backend

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:4000/api`) |

## Backend API Contract

The frontend expects these endpoints on `NEXT_PUBLIC_API_URL`:

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns `{ user, tokens }` |
| POST | `/auth/register` | Returns `{ user, tokens }` |
| POST | `/auth/refresh` | Returns `{ accessToken, refreshToken }` |
| POST | `/auth/logout` | Invalidates refresh token |
| GET | `/auth/me` | Returns current user |
| GET | `/resumes` | List user resumes |
| POST | `/resumes/upload` | Multipart upload |
| GET | `/resumes/:id/download` | Returns `{ url }` presigned URL |
| DELETE | `/resumes/:id` | Delete resume |
| PATCH | `/resumes/:id/active` | Set active resume |
| POST | `/ai/ats-score` | Returns `ATSScoreResult` |
| POST | `/ai/optimize` | Returns `{ jobId, status }` |
| GET | `/ai/optimize/:jobId` | Poll optimize status |
| GET | `/ai/optimize/:jobId/download` | Returns `{ url }` |
| GET | `/interviews` | List sessions |
| POST | `/interviews` | Start session |
| GET | `/interviews/:id` | Get session |
| POST | `/interviews/:id/answer` | Submit answer |
| POST | `/interviews/:id/end` | End session |
| POST | `/skills/analyze` | Run gap analysis |
| GET | `/skills/roadmap` | Get roadmap items |
| PATCH | `/skills/roadmap/:id` | Update item status |
| GET | `/dashboard/stats` | Returns `DashboardStats` |
| GET | `/dashboard/activity` | Returns `ActivityItem[]` |
