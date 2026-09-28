import type { Variants } from 'motion/react';
import { DURATION, EASE_OUT, REVEAL_OFFSET } from './motion';

// The cream "page" reveal from the motion spec, shared by the service pages and the thank-you card:
// furniture → eyebrow → headline lines rise from a mask → Brass rule draws → copy → CTA.
export const pageStagger: Variants = {
  shown: { transition: { staggerChildren: DURATION.stagger } },
};
export const pageFade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};
export const pageFadeUp: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  shown: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};
export const pageRise: Variants = {
  hidden: { y: '100%', opacity: 0 },
  shown: { y: 0, opacity: 1, transition: { duration: DURATION.reveal * 1.5, ease: EASE_OUT } },
};
export const pageDraw: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};
