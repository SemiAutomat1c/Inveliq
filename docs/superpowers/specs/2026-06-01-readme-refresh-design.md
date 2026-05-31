# Inveliq README Refresh Design

## Goal

Replace the starter README with a logo-first personal open-source project guide. The README should explain that Inveliq was built for one developer's own freelance workflow and that anyone who wants to use a copy should connect their own Convex database.

## Audience

The primary audience is a developer visiting the public repository. They should quickly understand what Inveliq does, why the project exists, and how to run their own self-hosted copy without relying on the author's database.

## README Structure

1. Center the existing Inveliq horizontal logo at the top.
2. Add a concise product summary and the tagline: "Track time into invoices."
3. Include a visible personal-use note:
   - Inveliq is built for the author's own freelance workflow.
   - It is shared as a personal project, not offered as a hosted multi-user service.
   - Other users should connect their own Convex project and manage their own data.
4. Add a screenshot section with a clear placeholder until a polished dashboard image is committed.
5. Summarize the working product surfaces:
   - project-based time tracking
   - manual entries
   - clients and projects
   - calendar and reporting views
   - invoice creation and status tracking
   - shareable public invoice links
   - light and dark themes
6. Add a quick-start section:
   - install dependencies
   - log into Convex
   - configure an existing or new Convex project with `npx convex dev --configure`
   - copy `.env.example` to `.env.local` only when manual configuration is needed
   - run Convex and Vite development processes
7. Add a neutral environment-variable example using placeholders instead of the author's development deployment values.
8. Document the useful npm scripts and the main project directories.
9. Link the existing brand guide and logo assets.

## Content Rules

- Keep the tone clear, concise, and quietly confident.
- Avoid marketing language that implies a hosted SaaS product.
- Do not publish the author's active Convex URLs or deployment identifier in the README or `.env.example`.
- Remove outdated PDF-generator references. Invoices are shared through public links.
- Keep the README useful without requiring a screenshot asset to exist yet.

## Files

- Update `README.md`.
- Update `.env.example` with neutral placeholders.
- Do not change application behavior, Convex functions, or dependencies.

## Verification

- Confirm the README renders with the existing SVG logo path.
- Confirm the screenshot section clearly states that the image will be added later.
- Confirm no active Convex deployment URL or deployment identifier remains in `README.md` or `.env.example`.
- Run `git diff --check`.
