import { motion, useReducedMotion } from 'motion/react';
import { GHOST_NUMERAL_BLEED, GHOST_NUMERAL_HEIGHT, GHOST_NUMERALS } from '~/data/ghost-numerals';
import { DURATION, EASE_IN_OUT } from '~/styles/motion';

// The oversized outlined number behind each service page, drawn in on arrival. It bleeds off the bottom-right
// corner, shrinks rather than run under the description, and on phones stays fixed in the bottom-right corner of the
// screen, fainter, with the copy scrolling over it.
export function GhostNumeral({ number }: { number: string }) {
  const reduce = useReducedMotion();
  const numeral = GHOST_NUMERALS[number];
  if (!numeral) return null;

  return (
    <svg
      aria-hidden
      preserveAspectRatio="xMaxYMax meet"
      viewBox={`0 0 ${numeral.width - GHOST_NUMERAL_BLEED.right} ${GHOST_NUMERAL_HEIGHT - GHOST_NUMERAL_BLEED.bottom}`}
      className="pointer-events-none absolute right-0 bottom-0 h-ghost-numeral max-w-[calc(100%-var(--spacing-ghost-clear))] overflow-visible max-lg:fixed max-lg:max-w-none max-lg:opacity-35 fill-none stroke-brass/75 stroke-(length:--stroke-outline)"
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
