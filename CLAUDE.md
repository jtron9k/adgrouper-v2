# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (runs version script + next dev)
npm run build        # Production build (runs version script + next build)
npm run lint         # ESLint
npm start            # Start production server
```

There is no test framework configured in this project.

## Environment Variables

Required in `.env.local`:
- `AUTH_SESSION_SECRET` — HMAC signing secret for session cookies (min 32 bytes)
- `OPENAI_API_KEY` — OpenAI API key
- `GEMINI_API_KEY` — Google Gemini API key
- `ANTHROPIC_API_KEY` — Anthropic Claude API key
- `APPROVED_EMAILS` — Comma-separated email whitelist (seeded into SQLite on first run)

## Architecture

**Next.js 14 App Router** with TypeScript, Tailwind CSS, and SQLite (`better-sqlite3`).

### App Flow

1. `/login` — Email-only auth against `approved_emails` table (no passwords)
2. `/` — Select AI provider (OpenAI / Gemini / Claude) and model
3. `/build` — Input campaign name, goal, landing page URLs, keywords; customize prompts
4. `/results` — View/edit generated ad groups and ad copy; export to Excel
5. `/history` — View and restore previous campaign runs

### Key Directories

- `app/api/` — Route handlers (all protected via `requireAuth()`)
- `components/` — Client-side React components
- `lib/` — Shared utilities (auth, AI providers, prompts, db, Excel export)
- `types.ts` — All TypeScript interfaces (`Campaign`, `Adgroup`, `Keyword`, `Run`, `Snapshot`, etc.)

### Auth System

Custom HMAC-SHA256 signed session cookies (`app_session`, 7-day expiry). No external auth service.

- `lib/auth-session.ts` — Token creation/verification with timing-safe comparison
- `lib/require-auth.ts` — Middleware helper that validates session and returns `{email, userId}`
- User IDs are deterministic SHA-256 hashes of email addresses

### AI Provider Integration

`lib/providers.ts` exports a unified `callLLM(provider, systemPrompt, userPrompt)` interface that dispatches to OpenAI, Gemini, or Claude SDKs. API keys are read server-side from environment variables via `lib/api-keys.ts`.

### Data Pipeline

1. `/api/scrape` — Scrape landing pages and generate LLM-powered summaries
2. `/api/group-keywords` — Group keywords into tightly themed ad groups (TTAGs)
3. `/api/generate-ads` — Generate headlines/descriptions per ad group
4. `/api/suggest-keywords` — Suggest additional keywords for an ad group
5. `/api/export` — Generate XLSX file with campaign data

### State Management

- `sessionStorage` for in-progress campaign data between pages
- `localStorage` for user preferences (selected provider/model)
- SQLite `runs` + `snapshots` tables for persistent history

### Database

SQLite via `better-sqlite3`. DB file lives at `data/adgrouper.db` (git-ignored). Schema and all query helpers are in `lib/db.ts`.

Tables:
- `approved_emails` — Email whitelist (seeded from `APPROVED_EMAILS` env var on startup)
- `runs` — Campaign run metadata (user_id, campaign_name, stage)
- `snapshots` — Full campaign state as JSON text (references runs, cascades on delete)

### Prompt System

Default prompts live in `lib/prompts.ts`. Users can customize all four prompt templates (landing page extraction, keyword grouping, ad copy, keyword suggestion) via the `PromptEditor` component on the build page.

## Style

- Tailwind CSS with dark mode via `media` strategy (follows system preference)
- `dark:` variant classes throughout components and `globals.css`
- Path alias: `@/*` maps to project root
