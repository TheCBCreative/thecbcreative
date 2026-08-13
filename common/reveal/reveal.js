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

  // will-change on only while transitioning; '' (not 'auto') on cleanup so
  // elements with their own conditional will-change (e.g. hover rules)
  // get their stylesheet behavior back.
  const setVisible = (el, visible) => {
    el.style.willChange = 'opacity, transform';
    el.classList.toggle('is-visible', visible);
  };

  els.forEach((el) => {
    el.addEventListener('transitionend', (e) => {
      if (e.target !== el) return;
      if (e.propertyName !== 'opacity' && e.propertyName !== 'transform') return;
      el.style.willChange = '';
    });
  });

  // No IntersectionObserver support (very old browser) — just show
  // everything rather than risk content staying invisible. Nothing is
  // transitioning here, so no will-change needed.
  if (!('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
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

// On mobile there's no hover state, so cards come alive on scroll instead:
// each swells as it nears the centre of the viewport and eases back as it
// moves away. Same visual language as the desktop hover, driven by scroll.
//
// Note it never sets a transform on the card element itself — [data-reveal]
// owns that (see reveal.css), and an inline transform here would silently
// override the reveal animation. Only the card's inner parts move.
function initCardScrollScale(selector, opts) {
  const cards = document.querySelectorAll(selector);
  if (!cards.length) return;

  const { textSelector, imgFrom, imgRange, minHeight } = opts;
  const mq = window.matchMedia('(max-width: 768px)');
  let ticking = false;

  const parts = (card) => ({
    img: card.querySelector('img'),
    text: textSelector ? card.querySelector(textSelector) : null,
  });

  const update = () => {
    const viewportCenter = window.innerHeight / 2;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + rect.height / 2;
      const distance = Math.abs(viewportCenter - cardCenter);
      const maxDistance = viewportCenter + rect.height / 2;
      const proximity = Math.max(0, 1 - distance / maxDistance);

      const { img, text } = parts(card);
      if (img) img.style.transform = `scale(${(imgFrom + proximity * imgRange).toFixed(3)})`;
      if (text) text.style.transform = `scale(${(1 + proximity * 0.2).toFixed(3)})`;
      if (minHeight) card.style.minHeight = `${minHeight.base + proximity * minHeight.growth}px`;
    });
    ticking = false;
  };

  const reset = () => {
    cards.forEach((card) => {
      const { img, text } = parts(card);
      if (img) img.style.transform = '';
      if (text) text.style.transform = '';
      if (minHeight) card.style.minHeight = '';
    });
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
      reset();
    }
  };

  enable();
  mq.addEventListener('change', enable);
}

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();

  // Homepage service cards — photo zooms hard, copy grows, card gets taller.
  // imgFrom is slightly over 1 so the photo always overscans its frame a
  // hair, avoiding a subpixel seam at the card edge.
  initCardScrollScale('.service-card', {
    textSelector: '.service-card__text',
    imgFrom: 1.05,
    imgRange: 0.4,
    minHeight: { base: 480, growth: 180 },
  });

  // Portfolio cards — same idea, dialled well back. These are sized by
  // aspect-ratio rather than min-height, so only the photo moves.
  initCardScrollScale('.portfolio-card', { imgFrom: 1.01, imgRange: 0.12 });
});
