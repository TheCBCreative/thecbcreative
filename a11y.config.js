// Accessibility gate (github.com/TheCBCreative/a11y-gate).
// Run with `npm run a11y` after a build (and in CI on every push). Fails on serious or critical
// axe-core violations in the generated pages.
module.exports = {
  staticDirs: ['public'],
  failOn: 'serious',
};
