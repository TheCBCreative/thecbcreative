import { useEffect } from 'react';

// iOS browsers can open a page a few dozen pixels down while their toolbars settle, which hides the top of the page.
// On a fresh load with no #section target, put the page back at the very top, unless the visitor has already begun scrolling.
export function useStartAtTop(enabled: boolean, maxOffset = 120) {
  useEffect(() => {
    if (!enabled || window.location.hash) return;
    let touched = false;
    const stop = () => (touched = true);
    const toTop = () => {
      if (!touched && window.scrollY > 0 && window.scrollY < maxOffset) window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('touchstart', stop, { once: true, passive: true });
    window.addEventListener('wheel', stop, { once: true, passive: true });
    toTop();
    const timers = [150, 500, 1000].map((delay) => window.setTimeout(toTop, delay));
    return () => {
      timers.forEach(window.clearTimeout);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
    };
  }, [enabled, maxOffset]);
}
