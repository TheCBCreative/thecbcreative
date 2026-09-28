// Accessibility gate (github.com/TheCBCreative/a11y-gate). `npm run a11y` builds, serves the build like Vercel,
// crawls every page (plus the 404) at desktop, mobile and 320px reflow, and fails on serious or critical issues.
// The build is served over HTTP rather than read from disk: its asset paths are root-absolute (/assets/…),
// which don't resolve from file:// URLs.
const ORIGIN = 'http://localhost:4173';

module.exports = {
  crawl: { from: [`${ORIGIN}/`] },
  urls: [`${ORIGIN}/this-page-does-not-exist`],
  server: { command: 'node scripts/serve-build.mjs', url: `${ORIGIN}/`, readyTimeout: 30000 },
  failOn: 'serious',
  reducedMotion: true,
};
