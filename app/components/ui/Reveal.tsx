import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { DURATION, EASE_OUT, REVEAL_OFFSET, REVEAL_VIEWPORT } from '~/styles/motion';

interface RevealProps {
  children: ReactNode;
  index?: number;
  className?: string;
  // false fades in place, for content already on screen at load where a rise reads as a jump.
  rise?: boolean;
}

// D1: fades up once as it enters the viewport; `index` staggers siblings.
export function Reveal({ children, index = 0, className, rise = true }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: rise ? REVEAL_OFFSET : 0 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={REVEAL_VIEWPORT}
      transition={{ duration: DURATION.reveal, delay: index * DURATION.stagger, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
