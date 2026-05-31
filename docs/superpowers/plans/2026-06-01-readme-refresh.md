# Inveliq README Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the starter README with a logo-first personal open-source guide and remove the author's active Convex deployment values from the committed environment template.

**Architecture:** This is a documentation-only update. `README.md` becomes the public repository landing page and `.env.example` becomes a neutral template that directs each adopter to their own Convex deployment. No application code, Convex functions, dependencies, or runtime behavior change.

**Tech Stack:** Markdown, SVG repository assets, Convex CLI, Git

---

## File Structure

- Modify: `README.md`
  - Public repository landing page with logo, personal-use note, screenshot placeholder, feature list, setup steps, scripts, project map, and brand asset links.
- Modify: `.env.example`
  - Neutral Convex environment-variable placeholders with no author-specific deployment identifiers or URLs.

### Task 1: Replace The Starter README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` with the approved personal open-source guide**

Use this exact Markdown:

```markdown
<p align="center">
  <img src="./public/brand/inveliq-logo.svg" alt="Inveliq" width="220" />
</p>

<p align="center">
  <strong>Track time into invoices.</strong>
</p>

<p align="center">
  A calm personal workspace for tracking freelance work, reviewing billable time, and sharing invoices with clients.
</p>

## About This Project

I built Inveliq for my own freelance workflow: keeping project time organized, turning billable entries into invoices, and checking what has been paid without moving between several tools.

This repository is shared as a personal open-source project. It is not a hosted multi-user service. If you want to use Inveliq, connect your own [Convex](https://www.convex.dev/) project so your clients, projects, time entries, and invoices stay in your own database.

## Screenshot

> A polished dashboard screenshot will be added here soon.

## Features

- Track time against real projects with a live timer.
- Add, edit, and delete manual time entries.
- Manage clients and billable projects.
- Review work through timer, calendar, overview, and reporting views.
- Create invoices from selected billable entries.
- Mark invoices as draft, ready, sent, or paid.
- Share invoices through client-safe public links.
- Prepare invoice email drafts inside the app.
- Switch between light and dark themes.
- Use responsive desktop and mobile navigation.

## Run Your Own Copy

### Requirements

- Node.js 20 or newer
- npm
- A free [Convex](https://www.convex.dev/) account

### 1. Install dependencies

```bash
npm install
```

### 2. Connect your own Convex database

Log into Convex and configure a new or existing project:

```bash
npx convex login
npx convex dev --configure
```

Convex writes your deployment settings to `.env.local`. That file is intentionally ignored by Git.

If you need to configure the values manually, copy the template first:

```bash
cp .env.example .env.local
```

Then replace the placeholder values in `.env.local` with the values from your own Convex project.

### 3. Start the app

Run Convex in one terminal:

```bash
npm run convex:dev
```

Run Vite in another terminal:

```bash
npm run dev
```

Open the local URL printed by Vite, usually [http://localhost:5173](http://localhost:5173).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run convex:dev` | Sync Convex functions and watch for backend changes. |
| `npm run convex:deploy` | Deploy Convex functions for production. |
| `npm run build` | Type-check and create a production build. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run the Vitest suite. |
| `npm run test:brand` | Check core brand color contrast pairs. |

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/` | React UI, workspace views, brand tokens, and frontend helpers. |
| `convex/` | Convex schema, queries, mutations, and generated type bindings. |
| `public/brand/` | Inveliq logo assets used by the app and invoice views. |
| `docs/brand-guidelines.md` | Brand voice, logo, color, and invoice guidance. |

## Brand

Inveliq uses a graphite, paper, and signal-teal visual system designed for focused daily work.

- [Brand guidelines](./docs/brand-guidelines.md)
- [Primary logo](./public/brand/inveliq-logo.svg)
- [Compact mark](./public/brand/inveliq-mark.svg)
- [Monochrome mark](./public/brand/inveliq-mark-mono.svg)
- [Invoice header logo](./public/brand/inveliq-invoice-header.svg)

## Notes

- Authentication is intentionally out of scope for this personal version.
- Public invoice links are secret-link views intended for sharing directly with a client.
- Payment processing, external calendar sync, and hosted email delivery are not included.

## License

No license has been added yet. Please treat the repository as source-available for personal reference unless a license is added later.
```

- [ ] **Step 2: Review the rendered Markdown structure**

Run:

```bash
rg -n "^#|^##|^###|inveliq-logo|Screenshot|Convex" README.md
```

Expected: the logo path, screenshot placeholder, Convex setup section, and all major headings are present.

- [ ] **Step 3: Commit the README rewrite**

```bash
git add README.md
git commit -m "Refresh project README"
```

### Task 2: Remove Author-Specific Convex Values

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Replace `.env.example` with neutral placeholders**

Use this exact content:

```dotenv
CONVEX_DEPLOYMENT=dev:your-deployment-name
VITE_CONVEX_URL=https://your-deployment.convex.cloud
VITE_CONVEX_SITE_URL=https://your-deployment.convex.site
```

- [ ] **Step 2: Verify committed public documentation does not expose the author's deployment**

Run:

```bash
rg -n "judicious-boar-808|local-ryan_ad23d|ryan_ad23d" README.md .env.example
```

Expected: no matches.

- [ ] **Step 3: Verify `.env.local` remains ignored**

Run:

```bash
git check-ignore -v .env.local
```

Expected: `.gitignore` matches `.env.local` through `*.local`.

- [ ] **Step 4: Commit the environment-template cleanup**

```bash
git add .env.example
git commit -m "Use neutral Convex environment placeholders"
```

### Task 3: Verify The Documentation Update

**Files:**
- Verify: `README.md`
- Verify: `.env.example`

- [ ] **Step 1: Check Markdown and environment-template diff quality**

Run:

```bash
git diff HEAD~2..HEAD --check
```

Expected: no whitespace errors.

- [ ] **Step 2: Confirm the README references existing repository assets**

Run:

```bash
test -f public/brand/inveliq-logo.svg &&
test -f public/brand/inveliq-mark.svg &&
test -f public/brand/inveliq-mark-mono.svg &&
test -f public/brand/inveliq-invoice-header.svg
```

Expected: exit code `0`.

- [ ] **Step 3: Confirm only documentation-template changes remain in the two implementation commits**

Run:

```bash
git diff --stat HEAD~2..HEAD
```

Expected: only `README.md` and `.env.example` appear.

- [ ] **Step 4: Push the committed documentation updates**

Run:

```bash
git push origin main
```

Expected: the remote `main` branch advances successfully.
