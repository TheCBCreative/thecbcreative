import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { DURATION, EASE_IN_OUT } from '~/styles/motion';
import { cx } from '~/utils/cx';

// Pixels from the bottom of the page where the hint fades away.
const END_THRESHOLD = 48;

// Pine pages get a Pine scrim with a Brass Light chevron; cream pages get a Snow scrim with a Brass Deep one.
const TONES = {
  pine: { scrim: 'from-pine/90 to-pine/0', chevron: 'stroke-brass-light' },
  cream: { scrim: 'from-snow/95 to-snow/0', chevron: 'stroke-brass-deep' },
} as const;

interface ScrollHintProps {
  tone?: keyof typeof TONES;
  // When the page scrolls inside an element instead of the document, that element's id.
  scrollerId?: string;
  className?: string;
}

// A scrim and chevron along the bottom of the screen while there's more page below.
export function ScrollHint({ tone = 'pine', scrollerId, className }: ScrollHintProps) {
  const [more, setMore] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const scroller = scrollerId ? document.getElementById(scrollerId) : null;
    const update = () => {
      if (scroller) {
        setMore(scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop > END_THRESHOLD);
        return;
      }
      const root = document.documentElement;
      setMore(root.scrollHeight - window.innerHeight - window.scrollY > END_THRESHOLD);
    };
    update();
    const observer = new ResizeObserver(update);
    if (scroller) {
      observer.observe(scroller);
      for (const child of scroller.children) observer.observe(child);
    } else {
      observer.observe(document.body);
    }
    const scrolled = scroller ?? window;
    scrolled.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      scrolled.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollerId]);

  return (
    <AnimatePresence>
      {more && (
        <motion.div
          aria-hidden
          className={cx('pointer-events-none fixed inset-x-0 bottom-0 z-40 flex h-scroll-hint items-end justify-center bg-linear-to-t pb-4', TONES[tone].scrim, className)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.reveal }}
        >
          <motion.svg
            viewBox="0 0 24 12"
            className={cx('h-3 w-6 fill-none stroke-(length:--stroke-outline)', TONES[tone].chevron)}
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
