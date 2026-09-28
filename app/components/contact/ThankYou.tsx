import { motion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { Button } from '~/components/ui/Button';
import { CONTACT } from '~/data/contact';
import { pageDraw, pageFadeUp, pageRise, pageStagger } from '~/styles/page-reveal';

// Takes over the whole contact card once the message is sent, styled like the expanded service pages.
export function ThankYou() {
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  return (
    <motion.div className="flex flex-1 flex-col justify-center px-page py-flow-md max-lg:py-12" variants={pageStagger} initial="hidden" animate="shown">
      <motion.p variants={pageFadeUp} className="eyebrow text-eyebrow tracking-caps text-brass-deep">
        {CONTACT.success.eyebrow}
      </motion.p>
      <h1 id="contact-title" ref={heading} tabIndex={-1} className="mt-flow-2xs font-display text-display-2xl leading-tightest tracking-display focus:outline-none">
        <span className="mask-line">
          <motion.span variants={pageRise} className="block">
            {CONTACT.success.headline}
          </motion.span>
        </span>
      </h1>
      <motion.div variants={pageDraw} className="mt-flow-lg h-px w-12 origin-left bg-brass" />
      <motion.p variants={pageFadeUp} className="mt-flow-sm max-w-135 text-body-lg leading-airy text-pine/88">
        {CONTACT.success.body}
      </motion.p>
      <motion.div variants={pageFadeUp} className="mt-flow-md">
        <Button to="/">{CONTACT.success.back}</Button>
      </motion.div>
    </motion.div>
  );
}
