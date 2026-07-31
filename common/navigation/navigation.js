// navigation.js — shared mobile menu toggle (single source for every page)

function initNavigation() {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (!menuBtn || !mobileMenu) return;

  const setOpen = (open) => {
    mobileMenu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  menuBtn.addEventListener('click', () => {
    setOpen(!mobileMenu.classList.contains('open'));
  });

  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => setOpen(false));
  });
}

// Highlights the nav link for whichever in-page section (Home, About,
// Services) is currently in view, so the sage underline follows scroll
// position on the home page. Standalone pages (Portfolio, Contact) already
// get their active link marked at build time and have no sections to spy on.
function initScrollSpy() {
  const navAnchors = Array.from(document.querySelectorAll('.nav__links a, .mobile-menu a'));
  if (!navAnchors.length) return;

  // Hash links (#about, #services) map to their own section. The Home link
  // ("/") has no hash to match, so it's mapped to the hero section instead —
  // that way scrolling back to the top re-activates Home instead of leaving
  // whatever section was last active still highlighted.
  const sections = [];
  navAnchors.forEach((a) => {
    const href = a.getAttribute('href') || '';
    let target = null;
    if (href.includes('#')) {
      const hash = href.split('#')[1];
      target = hash && document.getElementById(hash);
    } else if (href === '/') {
      target = document.getElementById('hero');
    }
    if (target && !sections.some((s) => s.target === target)) {
      sections.push({ href, target });
    }
  });
  if (!sections.length) return;

  const hrefBySection = new Map(sections.map((s) => [s.target, s.href]));

  const setActive = (href) => {
    document.querySelectorAll('.nav__links a[aria-current], .mobile-menu a[aria-current]').forEach((a) => {
      a.removeAttribute('aria-current');
    });
    document.querySelectorAll('.nav__links a, .mobile-menu a').forEach((a) => {
      if (a.getAttribute('href') === href) a.setAttribute('aria-current', 'page');
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(hrefBySection.get(entry.target));
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach(({ target }) => observer.observe(target));
}

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollSpy();
});
