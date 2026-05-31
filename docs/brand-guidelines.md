# Inveliq Brand Guidelines

## Brand Story

**Mission:** Help freelance developers turn tracked work into clear invoices.

**Positioning:** Track time. Shape invoices. Know what your work is worth.

**Primary tagline:** Track time into invoices.

**Values:** clarity, quiet confidence, precision, and daily usefulness.

## Logo

The Inveliq mark combines a timer with ledger lines. It should communicate that tracked work becomes billable proof.

Logo files:

- Primary horizontal logo: `public/brand/inveliq-logo.svg`
- Compact mark: `public/brand/inveliq-mark.svg`
- Monochrome mark: `public/brand/inveliq-mark-mono.svg`
- Invoice header logo: `public/brand/inveliq-invoice-header.svg`
- Favicon: `public/favicon.svg`

Usage:

- Use the horizontal logo in the app sidebar and top-level brand surfaces.
- Use the compact mark for favicon, mobile app icon, collapsed sidebar, and PDF headers with limited space.
- Keep clear space around the logo equal to the height of the mark.
- Do not stretch, rotate, recolor outside the approved palette, or place the mark on noisy backgrounds.

## Color

Primary:

- Graphite: `#151B1F`
- Signal teal: `#12B8A6`
- Signal teal dark: `#087F75`
- Signal teal soft: `#DDF8F4`

Neutrals:

- Ink: `#101416`
- Graphite muted: `#263238`
- Text muted: `#607078`
- Border: `#D8DDD9`
- Paper: `#F7F4EE`
- Surface: `#FFFFFF`

Semantic:

- Success: `#16835D`
- Warning: `#C47A19`
- Error: `#A73531`

Usage:

- Use graphite for app chrome, text, and premium contrast.
- Use signal teal for active timers, primary actions, invoice-ready states, and paid states.
- Use paper for the app background and invoice page warmth.
- Use semantic colors sparingly for feedback and status badges.

## Typography

Use a refined system sans stack to keep the product fast and clean:

- Display: `"Aptos Display", "Segoe UI", system-ui, sans-serif`
- Body: `"Aptos", "Segoe UI", system-ui, sans-serif`
- Mono: `"SFMono-Regular", "Cascadia Mono", Consolas, monospace`

Guidelines:

- Use display type for `Inveliq`, page titles, and invoice totals.
- Use body type for dense tables, form fields, and dashboard labels.
- Use mono only for timer durations, invoice numbers, and compact numeric data.
- Keep letter spacing at `0` for headings and normal body text. Use small uppercase labels only for short metadata.

## Voice And Tone

Inveliq sounds clear, concise, and quietly confident.

Do:

- Use direct phrases: "Timer started," "Invoice ready," "Your week is balanced."
- Address the user directly when useful.
- Keep errors practical: "Something went wrong. Try again?"
- Prefer short verbs: track, send, mark, review, export.

Do not:

- Sound playful or overly casual.
- Use accounting jargon when a simpler phrase works.
- Over-promise payment outcomes.

## Applications

Dashboard:

- The first screen is the working dashboard, not a marketing hero.
- Keep controls compact, predictable, and scan-friendly.
- Prioritize active timer, weekly totals, invoice-ready amount, and recent time entries.

Invoice PDF:

- Use the invoice header logo.
- Use teal only for the brand line, status, and key totals.
- Keep line items spacious and totals unmistakable.

Email draft:

Subject: `Invoice [Invoice number] from Inveliq`

Body:

```text
Hi [Client],

Invoice [Invoice number] is ready for the tracked work from [Month].

Total: [Currency amount]
Due: [Due date]

Thanks,
[Sender name]
```
