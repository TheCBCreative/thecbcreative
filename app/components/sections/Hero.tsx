import { motion, useTransform, type Variants } from 'motion/react';
import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { HERO } from '~/data/home';
import { SITE } from '~/data/site';
import { useLogoHandoff } from '~/hooks/useLogoHandoff';
import { EASE_IN_OUT, HERO_ENTRANCE } from '~/styles/motion';

const container: Variants = {
  shown: { transition: { delayChildren: HERO_ENTRANCE.delay, staggerChildren: HERO_ENTRANCE.stagger } },
};

const line: Variants = {
  hidden: { opacity: 0, filter: `blur(${HERO_ENTRANCE.blur}px)` },
  shown: { opacity: 1, filter: 'blur(0px)', transition: { duration: HERO_ENTRANCE.duration, ease: EASE_IN_OUT } },
};

export function Hero() {
  const handoff = useLogoHandoff();
  const logoOpacity = useTransform(handoff, (value) => 1 - value);

  return (
    <Chapter id="home" labelledBy="hero-title" grade screen className="px-page text-center">
      {/* Desktop centres everything; phones spread it top / middle / bottom so the hero fills the screen. */}
      <motion.div
        className="mx-auto flex w-full max-w-250 flex-1 flex-col items-center justify-center max-lg:justify-start max-lg:pt-6 max-lg:pb-12"
        variants={container}
        initial="hidden"
        animate="shown"
      >
        <div className="flex flex-col items-center">
          <motion.div variants={line}>
            <motion.img
              src="/brand/logo-mark.svg"
              alt={SITE.name}
              width={80}
              height={80}
              className="size-20 max-lg:size-22"
              style={{ opacity: logoOpacity }}
            />
          </motion.div>
          <motion.p variants={line} className="mt-6 eyebrow text-body-sm tracking-wide max-lg:mt-5">
            {HERO.eyebrow}
          </motion.p>
        </div>
        <h1 id="hero-title" className="mt-3 font-display max-lg:my-auto max-lg:py-10">
          <motion.span variants={line} className="block text-heading-md leading-subhead tracking-hero">
            {HERO.lead}
          </motion.span>
          <motion.span
            variants={line}
            className="mt-2 block text-display-lg leading-heading tracking-hero max-lg:mt-3 max-lg:text-display-md max-lg:leading-tighter"
          >
            {HERO.headline} <span className="text-brass-light">{HERO.headlineAccent}</span>
          </motion.span>
        </h1>
        <div className="flex flex-col items-center">
          <motion.p variants={line} className="mt-18 max-w-155 text-body-lg leading-copy text-mist max-lg:mt-0">
            {HERO.body}
          </motion.p>
          <motion.div variants={line} className="mt-8 max-lg:mt-7">
            <Button to={HERO.cta.to} variant="outline">
              {HERO.cta.label}
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </Chapter>
  );
}
