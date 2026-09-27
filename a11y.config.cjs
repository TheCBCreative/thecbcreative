// Accessibility gate (github.com/TheCBCreative/a11y-gate). `npm run a11y` builds, then audits every
// pre-rendered page and fails on serious or critical axe-core violations.
module.exports = {
  staticDirs: ['build/client'],
  failOn: 'serious',
  reducedMotion: true,
  viewport: { width: 1440, height: 1024 },
};
