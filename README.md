# The CB Creative — Website

Live at [thecbcreative.com](https://thecbcreative.com)

Source for my freelance web design & development studio site. Built as a custom static site generator from scratch — no framework, no site builder — driven by a single content schema so pages and copy stay easy to update without duplicating markup.

## Stack

- Vanilla JavaScript (Node)
- Custom build pipeline (`scripts/build.js`) that compiles pages from a shared content schema, using a small in-house mustache-lite template engine (`scripts/lib/template.js`)
- Tailwind CSS (v4, CSS-first config) for layout and styling, alongside a small set of shared CSS primitives (`common/styles/base.css`, `common/styles/brand.css`) for global resets and design tokens
- Custom local dev server (`scripts/dev-server.mjs`)
- Contact form backed by a serverless API route (`api/contact.mjs`), with an automated test covering the submission flow (`scripts/test-contact.mjs`)
- Deployed on Vercel

## Structure

- `pages/` — page templates
- `sections/` — reusable page sections/components
- `content/` — the content schema driving the site
- `common/` — shared utilities, nav/footer, and global styles (`common/styles/tailwind.css` is the Tailwind entry point)
- `api/` — serverless API routes (contact form)
- `scripts/` — build, dev server, and test scripts

## Why build it this way

For a small, content-driven marketing site, a lightweight custom generator gives full control over performance and markup without the overhead of a framework — and it's easy to extend as the site (and client roster) grows.

## Run locally

Copy `.env.example` to `.env.local` and fill in real values (contact form needs a Resend API key — see comments in `.env.example`).

npm install
npm run dev


This builds the site, compiles Tailwind, and starts the local dev server.

## Build

npm run build


Outputs the deployable site to `public/`.

## Test

npm test


Runs the contact form submission test (`scripts/test-contact.mjs`) against the serverless API route.


