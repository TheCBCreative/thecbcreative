# The CB Creative — Website

Live at [thecbcreative.com](https://thecbcreative.com)

Source for my web design & development studio site: an editorial, cinematic single-page home over a looping mountain video, a page per service, and a contact form that emails me directly. The design lives in Figma (file "Home — v4"), which is the source of truth — the code follows it.

## Stack

- [React Router](https://reactrouter.com) in framework mode with TypeScript, **pre-rendered** to static HTML at build (`ssr: false`), so every page is fast and its content is already in the HTML for search and AI engines to crawl
- Tailwind CSS v4, locked to the design tokens in `app/styles/tokens.css` — Tailwind's defaults are cleared, so only the brand's colors, type sizes and spacing can be used
- [Motion](https://motion.dev) for the reveals, the card flip and the scroll-linked details, with `prefers-reduced-motion` respected throughout
- Contact form backed by a Vercel Function (`api/contact.mjs`) that emails submissions through [Resend](https://resend.com)
- Vitest for tests, oxlint for linting, and [a11y-gate](https://github.com/TheCBCreative/a11y-gate) for accessibility
- Deployed on Vercel

## Structure

- `app/routes/` — one file per page (home, contact, service pages, 404) plus the shared site layout
- `app/components/` — `sections/` (homepage chapters), `layout/` (nav, menu, footer, video), `contact/`, `service/`, `flip/` (the card flip) and `ui/` (shared pieces like buttons and reveals)
- `app/data/` — all copy and content (homepage, services, contact, site details) — edit words here, not in components
- `app/styles/` — `tokens.css` (design tokens, mirroring the Figma variables) and `motion.ts` (every animation timing)
- `app/seo/` — page titles, share cards and structured data
- `api/contact.mjs` — the contact form endpoint
- `scripts/` — the dev-server hook that runs the contact endpoint locally, and a static server for previewing the build
- `tests/` — tests for the contact endpoint
- `public/` — brand assets, the headshot and the mountain video (a 720p version is served to phones)

The build also writes `sitemap.xml`, `robots.txt`, `llms.txt` and `404.html` (see `react-router.config.ts`).

## Run locally

Copy `.env.example` to `.env.local` and fill in the real values (the contact form needs a Resend API key — see the comments in `.env.example`).

```bash
npm install
npm run dev
```

The dev server runs the contact endpoint too, so **submitting the form locally sends a real email** using the keys in `.env.local`.

## Build and preview

```bash
npm run build     # outputs the static site to build/client
npm run preview   # serves build/client the way Vercel does, at http://localhost:4173
```

## Check

```bash
npm run lint
npm run typecheck
npm test          # contact endpoint tests (nothing is actually emailed)
npm run a11y      # builds, serves the build, and crawls every page at desktop, mobile and 320px reflow
```

CI (`.github/workflows/ci.yml`) runs all four on every push and pull request.

## Deploy

Vercel builds with `npm run build` and serves `build/client` (see `vercel.json`, which also sets the redirects and cache headers). Set `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` under Project Settings → Environment Variables.
