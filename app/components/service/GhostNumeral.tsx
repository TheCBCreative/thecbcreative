import { motion, useReducedMotion } from 'motion/react';
import { GHOST_NUMERAL_HEIGHT, GHOST_NUMERALS } from '~/data/ghost-numerals';
import { DURATION, EASE_IN_OUT } from '~/styles/motion';

// The oversized outlined number behind each service page; its outline draws itself in.
export function GhostNumeral({ number }: { number: string }) {
  const reduce = useReducedMotion();
  const numeral = GHOST_NUMERALS[number];
  if (!numeral) return null;

  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${numeral.width} ${GHOST_NUMERAL_HEIGHT}`}
      className="pointer-events-none absolute -right-37.5 -bottom-5.25 h-ghost-numeral fill-none stroke-brass/75 stroke-(length:--stroke-outline)"
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
