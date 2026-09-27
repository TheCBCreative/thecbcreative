import { motion, type Variants } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { HERO } from '~/data/home';
import { EASE_OUT, HERO_ENTRANCE, REVEAL_OFFSET } from '~/styles/motion';

const container: Variants = {
  shown: { transition: { delayChildren: HERO_ENTRANCE.delay, staggerChildren: HERO_ENTRANCE.stagger } },
};

const line: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  shown: { opacity: 1, y: 0, transition: { duration: HERO_ENTRANCE.duration, ease: EASE_OUT } },
};

export function Hero() {
  return (
    <Chapter labelledBy="hero-title" grade className="px-page text-center">
      <motion.div
        className="mx-auto flex w-full max-w-225 flex-1 flex-col items-center justify-center"
        variants={container}
        initial="hidden"
        animate="shown"
      >
        <motion.p variants={line} className="eyebrow text-body-sm tracking-wide">
          {HERO.eyebrow}
        </motion.p>
        <h1 id="hero-title" className="mt-5 font-display">
          <motion.span variants={line} className="block text-heading-md leading-subhead tracking-hero">
            {HERO.lead}
          </motion.span>
          <motion.span variants={line} className="mt-14 block text-display-lg leading-heading tracking-hero">
            {HERO.headline} <span className="text-brass-light">{HERO.headlineAccent}</span>
          </motion.span>
        </h1>
        <motion.p variants={line} className="mt-10 max-w-155 text-body-lg leading-copy text-mist">
          {HERO.body}
        </motion.p>
        <motion.div variants={line} className="mt-8">
          <Button to={HERO.cta.to} variant="outline">
            {HERO.cta.label}
          </Button>
        </motion.div>
      </motion.div>
    </Chapter>
  );
}
