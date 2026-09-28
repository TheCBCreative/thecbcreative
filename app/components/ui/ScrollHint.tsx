import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { DURATION, EASE_IN_OUT } from '~/styles/motion';

// How close to the bottom (px) counts as "reached the end", where the hint fades away.
const END_THRESHOLD = 48;

// A full-width Pine scrim along the bottom of the screen with a Brass chevron, shown while there's
// more page below. It fades out near the end, and never appears when the page fits the screen.
export function ScrollHint() {
  const [more, setMore] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const update = () => {
      const root = document.documentElement;
      setMore(root.scrollHeight - window.innerHeight - window.scrollY > END_THRESHOLD);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(document.body);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <AnimatePresence>
      {more && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-16 items-end justify-center bg-linear-to-t from-pine/90 to-pine/0 pb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.reveal }}
        >
          <motion.svg
            viewBox="0 0 24 12"
            className="h-3 w-6 fill-none stroke-brass-light stroke-(length:--stroke-outline)"
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ duration: 2, ease: EASE_IN_OUT, repeat: Infinity }}
          >
            <path d="M1 1 L12 11 L23 1" />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
