// reveal.js — fades/lifts [data-reveal] elements into place as they scroll
// into view, so the page has some movement beyond the fixed nav underline
// and quote background zoom. Shared across every page.
//
// The effect replays every time an element crosses in or out of view, in
// either scroll direction — not just once on first arrival — so scrolling
// back up re-triggers the same reveal on the way out and back in again.

function initScrollReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const setVisible = (el, visible) => el.classList.toggle('is-visible', visible);

  // No IntersectionObserver support (very old browser) — just show
  // everything rather than risk content staying invisible.
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => setVisible(el, true));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        setVisible(entry.target, entry.isIntersecting);
      });
    },
    { threshold: 0, rootMargin: '0px 0px -10% 0px' }
  );

  els.forEach((el) => observer.observe(el));
}

// On mobile, service cards don't get a hover state (no mouse), so instead
// each card grows slightly as it scrolls toward the center of the viewport
// and eases back as it moves away — the photo zooms, the copy enlarges a
// touch, and the card itself gets a little taller, all tied to how close
// its center is to the viewport's center. Same visual language as the
// desktop hover (photo fog/zoom), just driven by scroll instead of mouse.
function initServiceCardScrollScale() {
  const cards = document.querySelectorAll('.service-card');
  if (!cards.length) return;

  const BASE_MIN_HEIGHT = 480; // matches .service-card mobile min-height
  const MAX_HEIGHT_GROWTH = 180; // extra px at full proximity

  const mq = window.matchMedia('(max-width: 768px)');
  let ticking = false;

  const update = () => {
    const viewportCenter = window.innerHeight / 2;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);
      const maxDistance = viewportCenter + rect.height / 2;
      const proximity = Math.max(0, 1 - distance / maxDistance);

      const img = card.querySelector('img');
      const text = card.querySelector('.service-card__text');

      // Baseline is slightly over 1 (not exactly 1:1) so the photo always
      // overscans its frame a hair — avoids a subpixel seam at the card
      // edge where the section's light background could peek through.
      if (img) img.style.transform = `scale(${(1.05 + proximity * 0.4).toFixed(3)})`;
      if (text) text.style.transform = `scale(${(1 + proximity * 0.2).toFixed(3)})`;
      card.style.minHeight = `${BASE_MIN_HEIGHT + proximity * MAX_HEIGHT_GROWTH}px`;
    });
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const enable = () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (mq.matches) {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      update();
    } else {
      cards.forEach((card) => {
        const img = card.querySelector('img');
        const text = card.querySelector('.service-card__text');
        if (img) img.style.transform = '';
        if (text) text.style.transform = '';
        card.style.minHeight = '';
      });
    }
  };

  enable();
  mq.addEventListener('change', enable);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initServiceCardScrollScale();
});
