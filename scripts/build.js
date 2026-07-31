#!/usr/bin/env node
/**
 * build.js
 *
 * Assembles the deployable site from the componentized source tree:
 *   content/content-schema/site-content.json — single source of truth for all copy
 *   content/images/                 — all image assets
 *   common/navigation/, common/footer/, common/styles/  — shared chrome + tokens
 *   sections/*                      — homepage section components
 *   pages/home|portfolio|contact/   — page layouts + page-specific styles/js
 *
 * Output (what actually gets deployed) is written to /public — kept
 * completely separate from the source tree above. index.html, portfolio.html,
 * contact.html, one bundled css/*.css and js/*.js per page, and a copy of
 * content/images/ all land in public/. Real text is baked into the HTML at
 * build time — not fetched or injected in the browser — so search engines
 * and AI/AEO crawlers see full content in the raw page source with no
 * JavaScript execution required.
 *
 * public/ is fully generated — never hand-edit anything inside it, and it's
 * excluded from git. When you're ready to deploy, point Vercel's Output
 * Directory at "public" (this also happens to be Vercel's own default for
 * static/no-framework projects).
 *
 * Run with: npm run build
 */

const fs = require('fs');
const path = require('path');
const { render, escapeHtml } = require('./lib/template.js');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = 'public';

const content = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'content', 'content-schema', 'site-content.json'), 'utf8')
);

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function write(relativePath, data) {
  const fullPath = path.join(ROOT, OUT_DIR, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, data, 'utf8');
}

function cleanOutDir() {
  fs.rmSync(path.join(ROOT, OUT_DIR), { recursive: true, force: true });
  fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
}

// Manual recursive copy (read + write) rather than fs.cpSync — plain
// read/write behaves more predictably across mounted/networked filesystems.
function copyDir(srcRelative, destRelativeInsideOut) {
  const srcRoot = path.join(ROOT, srcRelative);
  const destRoot = path.join(ROOT, OUT_DIR, destRelativeInsideOut);

  function walk(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (entry.name === '.DS_Store') continue;
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        walk(srcPath, destPath);
      } else {
        fs.writeFileSync(destPath, fs.readFileSync(srcPath));
      }
    }
  }

  walk(srcRoot, destRoot);
}

function concat(relativePaths, label) {
  return relativePaths
    .map((p) => `/* ---- ${label ? label + ': ' : ''}${p} ---- */\n${read(p)}`)
    .join('\n');
}

function attr(str) {
  return escapeHtml(str);
}

function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}

// Builds a "renderedHeadline" string from a template that may contain an
// "{emphasis}" token, wrapping the emphasis text in <em>, and converting
// literal newlines to <br>. Returned as raw HTML for {{{renderedHeadline}}}.
function headlineHtml(template, emphasisText) {
  const escaped = escapeHtml(template);
  if (escaped.includes('{emphasis}') && emphasisText) {
    return nl2br(escaped.replace('{emphasis}', `<em>${escapeHtml(emphasisText)}</em>`));
  }
  return nl2br(escaped);
}

function fieldControlHtml(field) {
  const requiredAttr = field.required ? ' required' : '';
  if (field.type === 'textarea') {
    return `<textarea id="${attr(field.id)}" name="${attr(field.id)}" placeholder="${attr(field.placeholder)}"${requiredAttr}></textarea>`;
  }
  return `<input type="${attr(field.type)}" id="${attr(field.id)}" name="${attr(field.id)}" placeholder="${attr(field.placeholder)}"${requiredAttr}>`;
}

// ---------------------------------------------------------------------------
// Shared chrome: nav + footer (rendered from common/)
// ---------------------------------------------------------------------------

function renderNav(activeHref, light) {
  const template = read('common/navigation/navigation.html');
  const context = {
    siteName: content.site.name,
    logoLight: content.site.logo.light,
    light,
    links: content.nav.links.map((link) => ({
      ...link,
      active: link.href === activeHref,
    })),
  };
  return render(template, context);
}

function renderFooter() {
  const template = read('common/footer/footer.html');
  const context = {
    siteName: content.site.name,
    logoDarkBg: content.site.logo.darkBg,
    copyright: content.footer.copyright,
  };
  return render(template, context);
}

// ---------------------------------------------------------------------------
// Document shell (head / doctype wrapper — shared structure, per-page meta)
// ---------------------------------------------------------------------------

const FAVICON_DIR = '/content/images/logos';

function renderDocument({ title, description, canonical, cssHref, scriptSrc, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${attr(description)}">
  <link rel="canonical" href="${attr(canonical)}">

  <link rel="icon" type="image/svg+xml" href="${FAVICON_DIR}/favicon.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="${FAVICON_DIR}/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="${FAVICON_DIR}/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${FAVICON_DIR}/favicon-16x16.png">

  <link rel="stylesheet" href="${attr(cssHref)}">
</head>
<body>

  <a href="#main-content" class="skip-link">Skip to content</a>

${bodyHtml}

  <script src="${attr(scriptSrc)}"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Home page — composed from sections/*
// ---------------------------------------------------------------------------

const HOME_SECTIONS = [
  'hero',
  'about',
  'services',
  'portfolio-teaser',
  'quote',
  'why-not-ai',
  'cta',
];

function renderSection(name, data) {
  const template = read(`sections/${name}/${name}.html`);
  return render(template, data);
}

function buildHome() {
  const page = content.pages.home;
  const s = page.sections;

  const rendered = {
    nav: renderNav(null, false),
    footer: renderFooter(),
    hero: renderSection('hero', {
      ...s.hero,
      renderedHeadline: headlineHtml(s.hero.headline, s.hero.headlineEmphasis),
    }),
    about: renderSection('about', s.about),
    services: renderSection('services', s.services),
    portfolioTeaser: renderSection('portfolio-teaser', s.portfolioTeaser),
    quote: renderSection('quote', s.quote),
    whyNotAI: renderSection('why-not-ai', {
      ...s.whyNotAI,
      renderedHeadline: headlineHtml(s.whyNotAI.headline),
    }),
    cta: renderSection('cta', s.cta),
  };

  const bodyHtml = render(read('pages/home/home.html'), rendered);

  return renderDocument({
    title: page.meta.title,
    description: page.meta.description,
    canonical: page.meta.canonical,
    cssHref: '/css/index.css',
    scriptSrc: '/js/index.js',
    bodyHtml,
  });
}

// ---------------------------------------------------------------------------
// Portfolio page
// ---------------------------------------------------------------------------

function buildPortfolio() {
  const page = content.pages.portfolio;
  const s = page.sections;

  const context = {
    nav: renderNav('/portfolio.html', true),
    footer: renderFooter(),
    header: {
      ...s.header,
      renderedHeadline: headlineHtml(s.header.headline, s.header.headlineEmphasis),
    },
    gallery: s.gallery,
  };

  const bodyHtml = render(read('pages/portfolio/portfolio.html'), context);

  return renderDocument({
    title: page.meta.title,
    description: page.meta.description,
    canonical: page.meta.canonical,
    cssHref: '/css/portfolio.css',
    scriptSrc: '/js/portfolio.js',
    bodyHtml,
  });
}

// ---------------------------------------------------------------------------
// Contact page
// ---------------------------------------------------------------------------

function buildContact() {
  const page = content.pages.contact;
  const s = page.sections;

  const context = {
    nav: renderNav('/contact.html', true),
    footer: renderFooter(),
    info: {
      ...s.info,
      renderedHeadline: headlineHtml(s.info.headline, s.info.headlineEmphasis),
    },
    form: {
      fields: s.form.fields.map((f) => ({ ...f, renderedControl: fieldControlHtml(f) })),
      upload: s.form.upload,
      submitLabel: s.form.submitLabel,
    },
  };

  const bodyHtml = render(read('pages/contact/contact.html'), context);

  return renderDocument({
    title: page.meta.title,
    description: page.meta.description,
    canonical: page.meta.canonical,
    cssHref: '/css/contact.css',
    scriptSrc: '/js/contact.js',
    bodyHtml,
  });
}

// ---------------------------------------------------------------------------
// CSS / JS bundling per page
// ---------------------------------------------------------------------------

const BRAND_CSS = 'common/styles/brand.css';
const COMMON_CSS = ['common/navigation/navigation.css', 'common/footer/footer.css'];
const COMMON_JS = ['common/navigation/navigation.js', 'common/footer/footer.js'];

function sectionAssetPaths(name, ext) {
  return `sections/${name}/${name}.${ext}`;
}

const homeCss = [
  BRAND_CSS,
  ...COMMON_CSS,
  ...HOME_SECTIONS.map((n) => sectionAssetPaths(n, 'css')),
  'pages/home/home.css',
];
const homeJs = [
  ...COMMON_JS,
  ...HOME_SECTIONS.map((n) => sectionAssetPaths(n, 'js')),
  'pages/home/home.js',
];

const portfolioCss = [BRAND_CSS, ...COMMON_CSS, 'pages/portfolio/portfolio.css'];
const portfolioJs = [...COMMON_JS, 'pages/portfolio/portfolio.js'];

const contactCss = [BRAND_CSS, ...COMMON_CSS, 'pages/contact/contact.css'];
const contactJs = [...COMMON_JS, 'pages/contact/contact.js'];

// ---------------------------------------------------------------------------
// Write output — everything lands in /public, which is fully generated
// ---------------------------------------------------------------------------

cleanOutDir();
console.log(`Cleaned ${OUT_DIR}/`);

write('index.html', buildHome());
write('portfolio.html', buildPortfolio());
write('contact.html', buildContact());
console.log(`Built ${OUT_DIR}/index.html, ${OUT_DIR}/portfolio.html, ${OUT_DIR}/contact.html`);

write('css/index.css', concat(homeCss));
write('css/portfolio.css', concat(portfolioCss));
write('css/contact.css', concat(contactCss));
console.log(`Bundled ${OUT_DIR}/css/index.css, ${OUT_DIR}/css/portfolio.css, ${OUT_DIR}/css/contact.css`);

write('js/index.js', concat(homeJs));
write('js/portfolio.js', concat(portfolioJs));
write('js/contact.js', concat(contactJs));
console.log(`Bundled ${OUT_DIR}/js/index.js, ${OUT_DIR}/js/portfolio.js, ${OUT_DIR}/js/contact.js`);

copyDir('content/images', 'content/images');
console.log(`Copied content/images/ → ${OUT_DIR}/content/images/`);

console.log('\nDone. Source: content/content-schema/site-content.json + common/ + sections/ + pages/');
console.log(`Deployable output: ${OUT_DIR}/`);
