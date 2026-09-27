import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { DURATION, EASE_OUT, REVEAL_OFFSET } from '~/styles/motion';

interface RevealProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

// D1: fades up once as it enters the viewport; `index` staggers siblings.
export function Reveal({ children, index = 0, className }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: REVEAL_OFFSET }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: DURATION.reveal, delay: index * DURATION.stagger, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
