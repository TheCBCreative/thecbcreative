import { motion, useReducedMotion } from 'motion/react';
import { GHOST_NUMERAL_BLEED, GHOST_NUMERAL_HEIGHT, GHOST_NUMERALS } from '~/data/ghost-numerals';
import { DURATION, EASE_IN_OUT } from '~/styles/motion';

// The oversized outlined number behind each service page; its outline draws itself in.
// The viewBox stops at the page edges and the glyph overflows it, so the bleed scales with the numeral.
// On narrow windows it shrinks (anchored bottom-right) rather than run under the description;
// on phones it sits faintly behind the headline instead.
export function GhostNumeral({ number }: { number: string }) {
  const reduce = useReducedMotion();
  const numeral = GHOST_NUMERALS[number];
  if (!numeral) return null;

  return (
    <svg
      aria-hidden
      preserveAspectRatio="xMaxYMax meet"
      viewBox={`0 0 ${numeral.width - GHOST_NUMERAL_BLEED.right} ${GHOST_NUMERAL_HEIGHT - GHOST_NUMERAL_BLEED.bottom}`}
      className="pointer-events-none absolute right-0 bottom-0 h-ghost-numeral max-w-[calc(100%-var(--spacing-ghost-clear))] overflow-visible max-lg:top-6 max-lg:bottom-auto max-lg:max-w-none max-lg:opacity-45 fill-none stroke-brass/75 stroke-(length:--stroke-outline)"
    >
      <motion.path
        d={numeral.path}
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: DURATION.draw, ease: EASE_IN_OUT }}
      />
    </svg>
  );
}
