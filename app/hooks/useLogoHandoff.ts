import { useReducedMotion, useScroll, useTransform } from 'motion/react';
import { LOGO_HANDOFF } from '~/styles/motion';

// 0 while the hero logo owns the brand, 1 once the nav logo has taken over.
// Reduced motion skips the crossfade and swaps halfway.
export function useLogoHandoff() {
  const { scrollY } = useScroll();
  const reduce = useReducedMotion();
  return useTransform(scrollY, (y) => {
    if (typeof window === 'undefined') return 0;
    const [start, end] = LOGO_HANDOFF;
    const progress = Math.min(Math.max((y / window.innerHeight - start) / (end - start), 0), 1);
    return reduce ? Math.round(progress) : progress;
  });
}
