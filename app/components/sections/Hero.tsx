import { motion, useTransform } from 'motion/react';
import type { CSSProperties } from 'react';
import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { HERO } from '~/data/home';
import { SITE } from '~/data/site';
import { useLogoHandoff } from '~/hooks/useLogoHandoff';
import { HERO_ENTRANCE } from '~/styles/motion';

// The entrance runs in CSS (.hero-line in app.css), so it starts at first paint instead of waiting for JavaScript to load.
// Each line sets its place in the sequence; the timings come from HERO_ENTRANCE.
const entrance = {
  '--hero-delay': `${HERO_ENTRANCE.delay}s`,
  '--hero-duration': `${HERO_ENTRANCE.duration}s`,
  '--hero-stagger': `${HERO_ENTRANCE.stagger}s`,
} as CSSProperties;
const step = (index: number) => ({ '--hero-index': index }) as CSSProperties;

export function Hero() {
  const handoff = useLogoHandoff();
  const logoOpacity = useTransform(handoff, (value) => 1 - value);

  return (
    <Chapter id="home" labelledBy="hero-title" grade gradeFromTop screen className="px-page text-center">
      {/* Desktop centres everything; phones spread it top / middle / bottom so the hero fills the screen. */}
      <div
        className="mx-auto flex w-full max-w-250 flex-1 flex-col items-center justify-center max-lg:justify-start max-lg:pt-6 max-lg:pb-12"
        style={entrance}
      >
        <div className="flex flex-col items-center">
          <div className="hero-line" style={step(0)}>
            <motion.img
              src="/static/logo-mark.4f38d8b9.svg"
              alt={SITE.name}
              width={80}
              height={80}
              className="size-20 max-lg:size-22"
              style={{ opacity: logoOpacity }}
            />
          </div>
          <p style={step(1)} className="hero-line mt-6 eyebrow text-body-sm tracking-wide max-lg:mt-5">
            {HERO.eyebrow}
          </p>
        </div>
        <h1 id="hero-title" className="mt-3 font-display max-lg:my-auto max-lg:py-10">
          <span style={step(2)} className="hero-line block text-heading-md leading-subhead tracking-hero">
            {HERO.lead}
          </span>
          <span
            style={step(3)}
            className="hero-line mt-2 block text-display-lg leading-heading tracking-hero max-lg:mt-3 max-lg:text-display-md max-lg:leading-tighter"
          >
            {HERO.headline} <span className="text-brass-light">{HERO.headlineAccent}</span>
          </span>
        </h1>
        <div className="flex flex-col items-center">
          <p style={step(4)} className="hero-line mt-18 max-w-155 text-body-lg leading-copy text-mist max-lg:mt-0">
            {HERO.body}
          </p>
          <div style={step(5)} className="hero-line mt-8 max-lg:mt-7">
            <Button to={HERO.cta.to} variant="outline">
              {HERO.cta.label}
            </Button>
          </div>
        </div>
      </div>
    </Chapter>
  );
}
