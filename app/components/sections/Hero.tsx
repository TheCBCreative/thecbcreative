import { motion } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { HERO } from '~/data/home';
import { DURATION, EASE_OUT } from '~/styles/motion';

export function Hero() {
  return (
    <Chapter labelledBy="hero-title" grade className="px-page text-center">
      <motion.div
        className="mx-auto flex w-full max-w-225 flex-1 flex-col items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: DURATION.reveal * 2, ease: EASE_OUT }}
      >
        <p className="eyebrow text-body-sm tracking-wide">{HERO.eyebrow}</p>
        <h1 id="hero-title" className="mt-5 font-display">
          <span className="block text-heading-md leading-subhead tracking-hero">{HERO.lead}</span>
          <span className="mt-14 block text-display-lg leading-heading tracking-hero">
            {HERO.headline} <span className="text-brass-light">{HERO.headlineAccent}</span>
          </span>
        </h1>
        <p className="mt-10 max-w-155 text-body-lg leading-copy text-mist">{HERO.body}</p>
        <Button to={HERO.cta.to} variant="outline" className="mt-8">
          {HERO.cta.label}
        </Button>
      </motion.div>
    </Chapter>
  );
}
