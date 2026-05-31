# Inveliq

Inveliq is a personal freelance time-tracking and invoice app brand system. This starter contains the sharp, calm Inveliq identity, reusable React UI primitives, SVG logo assets, a brand guide, and a sample invoice PDF generator.

## Scripts

- `npm run dev` - start the brand preview app.
- `npm run convex:dev` - run Convex locally or push functions to the configured dev deployment.
- `npm run convex:deploy` - deploy Convex functions for production.
- `npm run build` - typecheck and build the Vite app.
- `npm run lint` - run ESLint.
- `npm run test:brand` - check core brand color contrast pairs.
- `npm run generate:sample-invoice` - generate `docs/sample-invoice.pdf`.

## Convex Setup

The app is configured for:

- Cloud URL: `https://judicious-boar-808.convex.cloud`
- HTTP Actions URL: `https://judicious-boar-808.convex.site`
- Deployment: `dev:judicious-boar-808`

To push the schema and functions to that Convex project, run:

```bash
npx convex login
npm run convex:dev
```

The current backend uses Convex identity when available and falls back to a personal dev user in anonymous/local mode. Full Convex Auth UI can be layered in next.

## Brand Assets

- Brand guide: `docs/brand-guidelines.md`
- Primary logo: `public/brand/inveliq-logo.svg`
- Compact mark: `public/brand/inveliq-mark.svg`
- Monochrome mark: `public/brand/inveliq-mark-mono.svg`
- Invoice header logo: `public/brand/inveliq-invoice-header.svg`
- Favicon: `public/favicon.svg`

Positioning: Track time. Shape invoices. Know what your work is worth.
