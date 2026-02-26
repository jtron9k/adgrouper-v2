# Search Ads Campaign Builder

An AI-powered web application that automates Google Ads campaign creation. It crawls your landing pages, groups keywords into tightly themed ad groups (TTAGs), generates compliant ad copy, and exports everything to Excel — all driven by your choice of OpenAI, Google Gemini, or Anthropic Claude.

---

## Features

- **Landing Page Analysis** — Scrapes and summarizes landing pages using an AI prompt so the model understands each page's specific value proposition before grouping keywords
- **Intelligent Keyword Grouping** — Groups keywords into tightly themed ad groups (TTAGs) following Google Ads best practices; each ad group maps to exactly one landing page and shares a single search intent
- **AI-Powered Ad Copy** — Generates 6 headlines (≤30 chars) and 3 descriptions (≤90 chars) per ad group, keyword-aware and aligned to the landing page
- **Keyword Suggestions** — Suggests additional closely related keywords for any existing ad group
- **Inline Editing** — Edit headlines and descriptions directly in the results view with real-time character-count enforcement
- **Excel Export** — One-click XLSX export of the complete campaign structure
- **Campaign History** — Every run is saved to SQLite; restore any previous campaign to the build page to re-run or tweak
- **Multiple AI Providers** — Switch between OpenAI, Google Gemini, and Anthropic Claude; models are fetched live from each provider's API
- **Customizable Prompts** — Every prompt template (extraction, keyword grouping, ad copy, keyword suggestion) can be edited per-campaign on the build page
- **Admin: Default Prompts** — Admins can set system-wide default prompts that all users start with; per-campaign edits still override them
- **Admin: User Management** — Invite and manage approved users; assign admin or user roles
- **Admin: API Key Management** — Store provider API keys in the database so they don't need to be in `.env.local` on every deployment
- **Dark Mode** — Follows system preference via Tailwind's `media` strategy

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router, TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite via `better-sqlite3` |
| Auth | Stateless HMAC-SHA256 signed session cookies (no external service) |
| AI | OpenAI SDK, `@google/generative-ai`, Anthropic SDK |
| Export | `xlsx` |

---

## Setup

### Prerequisites

- Node.js 18+
- API key(s) for at least one of: OpenAI, Google Gemini, or Anthropic Claude

### 1. Clone and install

```bash
git clone https://github.com/jtron9k/adgrouper-v2.git
cd adgrouper-v2
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Required — used to sign session cookies (min 32 random characters)
AUTH_SESSION_SECRET=replace-with-a-long-random-secret-at-least-32-chars

# AI provider keys — only set the ones you plan to use
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=AIza...
ANTHROPIC_API_KEY=sk-ant-...

# Comma-separated list of approved email addresses
# The first email in the list is automatically assigned the "admin" role
APPROVED_EMAILS=you@example.com,colleague@example.com
```

> **Note:** API keys can also be stored in the database via the Admin → Manage API Keys page after first login. Database values take precedence over `.env.local`.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The SQLite database (`data/adgrouper.db`) and all tables are created automatically on first startup. Emails listed in `APPROVED_EMAILS` are seeded into the `approved_emails` table.

### 4. Log in

Navigate to `/login` and enter one of the approved email addresses. No password is required — the app uses a simple email allowlist. You'll be redirected to the home page.

---

## Usage

### Step 1 — Select provider and model

Choose an AI provider (OpenAI, Gemini, or Claude), click **Load Models** to fetch available models, select one, then click **Continue**.

Your selection is saved in `localStorage` and persists between sessions.

### Step 2 — Build your campaign

| Field | Notes |
|---|---|
| Campaign Name | Descriptive label (e.g., "Summer Shoe Sale 2025") |
| Campaign Goal | One sentence describing your objective; included in every prompt |
| Landing Page URLs | Up to 10 URLs, one per line, or upload a CSV |
| Keywords | Up to 200 keywords, one per line, or upload a CSV |
| Edit Prompts | Expand any of the 4 prompt editors to customize for this campaign |

Click **Submit**. The app runs three sequential steps with a progress indicator:

1. Scrapes and summarizes each landing page
2. Groups keywords into ad groups
3. Generates ad copy for each ad group

### Step 3 — Review and export

- Edit any headline or description inline (character limits are enforced in real time)
- Click **Suggest Keywords** on an ad group to add more closely related keywords
- Click **Regenerate Ads** to re-run ad copy generation for an ad group
- Remove keywords with the × button
- Click **Export to Excel** to download the complete campaign as XLSX

### Campaign History

Visit `/history` to see all previous runs. Click **Restore** on any run to reload it into the build page with all original inputs and prompts.

---

## Admin

Admin features are accessible from the **Admin** dropdown in the navigation bar. Only users with the `admin` role can see or access these pages. The first email in `APPROVED_EMAILS` is assigned `admin` on first startup.

### Manage Users (`/admin/users`)

- View all approved users and their roles
- Add new approved email addresses
- Change a user's role between `admin` and `user`
- Remove users (they will be unable to log in)

### Manage API Keys (`/admin/api-keys`)

Store AI provider API keys in the database. This is useful for deployments where setting environment variables is inconvenient. Database values take precedence over `.env.local`.

### Manage Default Prompts (`/admin/prompts`)

Edit the four system-wide prompt templates that all users see when starting a new campaign:

- **Landing Page Summary Prompt** — How the AI summarizes each scraped page
- **Keyword Grouping Prompt** — How keywords are grouped into ad groups
- **Ad Copy Generation Prompt** — How headlines and descriptions are written
- **Keyword Suggestion Prompt** — How additional keywords are suggested

Changes take effect immediately for all new campaigns. Users can still override any prompt per-campaign on the build page, and those overrides are saved with the campaign history.

---

## Architecture

```
app/
  api/           Route handlers (all require auth)
  admin/         Admin pages (require admin role)
  build/         Campaign input form
  results/       Ad group review and export
  history/       Campaign run history
  login/         Email login form
components/      Client-side React components
lib/
  auth-session   HMAC session token creation/verification
  require-auth   requireAuth() / requireAdmin() helpers
  db             SQLite singleton, schema init, all query helpers
  providers      Unified callLLM() interface
  prompts        Hard-coded default prompt templates
  api-keys       Env var + DB key resolution
types.ts         Shared TypeScript interfaces
data/            SQLite DB file (git-ignored, created at runtime)
```

### Auth

Session cookies are HMAC-SHA256 signed with `AUTH_SESSION_SECRET`. No external auth service. User IDs are deterministic SHA-256 hashes of email addresses.

### Database tables

| Table | Purpose |
|---|---|
| `approved_emails` | Email allowlist with roles |
| `runs` | Campaign run metadata |
| `snapshots` | Full campaign state as JSON (FK → runs) |
| `api_keys` | Provider API keys stored in DB |
| `default_prompts` | Admin-customized prompt defaults |

---

## Development

```bash
npm run dev     # Start dev server
npm run build   # Production build
npm run lint    # ESLint
npm start       # Start production server
```

No test framework is configured.

---

## Troubleshooting

**Login fails / 401 errors**
- Confirm the email is in `APPROVED_EMAILS` and matches exactly
- Check that `AUTH_SESSION_SECRET` is set and at least 32 characters

**No models load**
- Verify at least one API key is set (env var or via Admin → Manage API Keys)
- Check the browser console and server logs for the specific error

**Keywords not grouping as expected**
- Try editing the keyword grouping prompt on the build page or in Admin → Manage Default Prompts
- Make the campaign goal more specific

**Excel export is empty or malformed**
- Ensure at least one ad group has been generated before exporting

---

## License

[Add your license here]
