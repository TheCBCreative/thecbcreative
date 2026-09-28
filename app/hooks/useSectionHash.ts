import { useEffect } from 'react';

// Keeps the URL hash in step with the chapter in the middle of the screen (#about, #services),
// and clears it back in the hero or chapters without a nav link. Uses replaceState so scrolling adds no history.
export function useSectionHash(ids: readonly string[]) {
  useEffect(() => {
    const sections = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const inView = new Set<string>();

    const update = () => {
      const current = ids.find((id) => inView.has(id));
      const hash = current ? `#${current}` : '';
      if (window.location.hash === hash) return;
      window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}${hash}`);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inView.add(entry.target.id);
          else inView.delete(entry.target.id);
        }
        update();
      },
      { rootMargin: '-50% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);
}
