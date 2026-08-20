# The CB Creative — Website

Live at [thecbcreative.com](https://thecbcreative.com)

Source for my freelance web design & development studio site. Built as a custom static site generator from scratch — no framework, no site builder — driven by a single content schema so pages and copy stay easy to update without duplicating markup.

## Stack

- Vanilla JavaScript (Node)
- Custom build pipeline (`scripts/build.js`) that compiles pages from a shared content schema
- Custom local dev server (`scripts/dev-server.mjs`)
- Contact form backed by a serverless API route (`api/`), with an automated test covering the submission flow (`scripts/test-contact.mjs`)
- Deployed on Vercel

## Structure

- `pages/` — page templates
- `sections/` — reusable page sections/components
- `content/` — the content schema driving the site
- `common/` — shared utilities/helpers
- `api/` — serverless API routes (contact form)
- `scripts/` — build, dev server, and test scripts

## Why build it this way

For a small, content-driven marketing site, a lightweight custom generator gives full control over performance and markup without the overhead of a framework — and it's easy to extend as the site (and client roster) grows.

## Run locally

\`\`\`
npm run dev
\`\`\`

## Test

\`\`\`
npm
