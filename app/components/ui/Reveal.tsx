import { motion, useInView } from 'motion/react';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { DURATION, EASE_OUT, REVEAL_OFFSET, REVEAL_VIEWPORT } from '~/styles/motion';

interface RevealProps {
  children: ReactNode;
  index?: number;
  className?: string;
  // false fades in place, for content already on screen at load where a rise reads as a jump.
  rise?: boolean;
}

// D1: fades up once as it enters the viewport; `index` staggers siblings.
// Anything already on screen when the page loads fades in straight away instead of waiting for a scroll.
// Both cases set the same target, so the second can't restart a fade the first began.
export function Reveal({ children, index = 0, className, rise = true }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, REVEAL_VIEWPORT);
  const [onScreenAtLoad, setOnScreenAtLoad] = useState(false);

  useLayoutEffect(() => {
    const box = ref.current?.getBoundingClientRect();
    if (box && box.top < window.innerHeight && box.bottom > 0) setOnScreenAtLoad(true);
  }, []);

  return (
    <motion.div
      ref={ref}
      data-reveal
      className={className}
      initial={{ opacity: 0, y: rise ? REVEAL_OFFSET : 0 }}
      animate={inView || onScreenAtLoad ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: DURATION.reveal, delay: index * DURATION.stagger, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}
