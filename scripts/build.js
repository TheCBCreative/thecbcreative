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
  // autocomplete helps both AT (announces the field's purpose) and sighted
  // users (browser/password-manager autofill) — worth setting explicitly
  // rather than leaving it to the browser to guess from the label text.
  const autocompleteAttr = field.autocomplete ? ` autocomplete="${attr(field.autocomplete)}"` : '';
  if (field.type === 'textarea') {
    return `<textarea id="${attr(field.id)}" name="${attr(field.id)}" placeholder="${attr(field.placeholder)}"${requiredAttr}${autocompleteAttr}></textarea>`;
  }
  return `<input type="${attr(field.type)}" id="${attr(field.id)}" name="${attr(field.id)}" placeholder="${attr(field.placeholder)}"${requiredAttr}${autocompleteAttr}>`;
}

// ---------------------------------------------------------------------------
// Shared chrome: nav + footer (rendered from common/)
// ---------------------------------------------------------------------------

function renderNav(activeHref, light) {
  const template = read('common/navigation/navigation.html');
  const context = {
    siteName: content.site.name,
    // "light" nav (frosted, sits over a plain cream section) needs the
    // ink-colored logo; the default dark-overlay nav (sits over the hero
    // photo) needs the cream logo for contrast.
    logoSrc: light ? content.site.logo.horizontal.onLight : content.site.logo.horizontal.onDark,
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
    logoDarkBg: content.site.logo.horizontal.onDark,
    copyright: content.footer.copyright,
  };
  return render(template, context);
}

// ---------------------------------------------------------------------------
// Document shell (head / doctype wrapper — shared structure, per-page meta)
// ---------------------------------------------------------------------------

const FAVICON_DIR = '/content/images/logos';

// One ProfessionalService record, reused on every page (standard practice —
// search engines and AI answer engines expect it site-wide, not just on the
// homepage). Deliberately includes only what's actually published on the
// site itself (name, url, logo, description, service area) — no invented
// phone/email/street address.
function renderStructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: content.site.name,
    url: content.site.url,
    image: `${content.site.url}${content.site.logo.socialShare}`,
    logo: `${content.site.url}${content.site.logo.horizontal.onLight}`,
    description: content.pages.home.meta.description,
    areaServed: ['Snoqualmie, WA', 'Greater Seattle Area'],
  };
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
}

function renderDocument({ title, description, canonical, cssHref, scriptSrc, bodyHtml, preloadImage }) {
  const ogImage = `${content.site.url}${content.site.logo.socialShare}`;
  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script>document.documentElement.classList.remove('no-js');</script>
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${attr(description)}">
  <link rel="canonical" href="${attr(canonical)}">

  <!-- Favicon / browser tab icon -->
  <link rel="icon" type="image/svg+xml" href="${FAVICON_DIR}/favicon.svg">
  <link rel="icon" type="image/png" sizes="32x32" href="${FAVICON_DIR}/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="${FAVICON_DIR}/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="192x192" href="${FAVICON_DIR}/icon-192.png">
  <link rel="icon" type="image/png" sizes="512x512" href="${FAVICON_DIR}/icon-512.png">
  <link rel="apple-touch-icon" sizes="180x180" href="${FAVICON_DIR}/apple-touch-icon.png">
  <link rel="shortcut icon" href="${FAVICON_DIR}/favicon.ico">

  <!-- Open Graph / Twitter Card — the preview card shown when this link is
       shared over text, Messenger, Slack, iMessage, etc. -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${attr(content.site.name)}">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${attr(canonical)}">
  <meta property="og:image" content="${attr(ogImage)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${attr(title)}">
  <meta name="twitter:description" content="${attr(description)}">
  <meta name="twitter:image" content="${attr(ogImage)}">

  <!-- Structured data — lets search engines and AI answer engines cite the
       business accurately rather than guessing from prose alone. -->
  ${renderStructuredData()}

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@1,400&family=Geist:wght@300;400;500;600&display=swap" rel="stylesheet">
  ${preloadImage ? `<link rel="preload" as="image" href="${attr(preloadImage)}" fetchpriority="high">` : ''}

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
    nav: renderNav('/', false),
    footer: renderFooter(),
    hero: renderSection('hero', {
      ...s.hero,
      renderedHeadline: headlineHtml(s.hero.headline, s.hero.headlineEmphasis),
    }),
    about: renderSection('about', s.about),
    services: renderSection('services', s.services),
    portfolioTeaser: renderSection('portfolio-teaser', {
      ...s.portfolioTeaser,
      renderedHeadline: headlineHtml(s.portfolioTeaser.headline, s.portfolioTeaser.headlineEmphasis),
    }),
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
    // Hero's main photo is this page's LCP element — preload it so it starts
    // fetching in parallel with the CSS/fonts instead of waiting for the
    // stylesheet to be parsed before the browser even discovers the <img>.
    preloadImage: s.hero.images.main.src,
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
      submittingLabel: s.form.submittingLabel,
      // Status copy lives in the schema like everything else, but the form
      // needs it in JS at submit time — so it's emitted once as a data
      // attribute on the form rather than hardcoded in contact.js.
      statusJson: JSON.stringify(s.form.status),
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
const BASE_CSS = 'common/styles/base.css';
const COMMON_CSS = ['common/navigation/navigation.css', 'common/footer/footer.css', 'common/reveal/reveal.css'];
const COMMON_JS = ['common/navigation/navigation.js', 'common/footer/footer.js', 'common/reveal/reveal.js'];

function sectionAssetPaths(name, ext) {
  return `sections/${name}/${name}.${ext}`;
}

const homeCss = [
  BRAND_CSS,
  BASE_CSS,
  ...COMMON_CSS,
  ...HOME_SECTIONS.map((n) => sectionAssetPaths(n, 'css')),
  'pages/home/home.css',
];
const homeJs = [
  ...COMMON_JS,
  ...HOME_SECTIONS.map((n) => sectionAssetPaths(n, 'js')),
  'pages/home/home.js',
];

const portfolioCss = [BRAND_CSS, BASE_CSS, ...COMMON_CSS, 'pages/portfolio/portfolio.css'];
const portfolioJs = [...COMMON_JS, 'pages/portfolio/portfolio.js'];

const contactCss = [BRAND_CSS, BASE_CSS, ...COMMON_CSS, 'pages/contact/contact.css'];
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

// ---------------------------------------------------------------------------
// robots.txt + sitemap.xml — generated from the same page list/canonicals
// used above, so they can't drift out of sync with the actual site.
// ---------------------------------------------------------------------------

const SITE_PAGES = [content.pages.home, content.pages.portfolio, content.pages.contact];

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Sitemap: ${content.site.url}/sitemap.xml
`;
}

function buildSitemapXml() {
  const today = new Date().toISOString().slice(0, 10);
  const urls = SITE_PAGES.map(
    (page) => `  <url>
    <loc>${escapeHtml(page.meta.canonical)}</loc>
    <lastmod>${today}</lastmod>
  </url>`
  ).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

write('robots.txt', buildRobotsTxt());
write('sitemap.xml', buildSitemapXml());
console.log(`Wrote ${OUT_DIR}/robots.txt, ${OUT_DIR}/sitemap.xml`);

console.log('\nDone. Source: content/content-schema/site-content.json + common/ + sections/ + pages/');
console.log(`Deployable output: ${OUT_DIR}/`);
