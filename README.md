<p align="center">
  <img src="./public/brand/inveliq-logo-readme.svg" alt="Inveliq" width="220" />
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
