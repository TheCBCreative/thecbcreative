import { motion, useReducedMotion, useScroll, useSpring } from 'motion/react';
import { Fragment, useRef } from 'react';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { WHY_NOT_AI } from '~/data/home';
import { STRIKE_SCROLL } from '~/styles/motion';

export function WhyNotAI() {
  // The strike follows the scroll: it draws across as "average" rises to the main spot in view,
  // and undraws if you scroll back up. Reduced motion shows it already struck.
  const ghost = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ghost, offset: STRIKE_SCROLL.offset });
  const strike = useSpring(scrollYProgress, STRIKE_SCROLL.spring);

  return (
    <Chapter id="why-not-ai" labelledBy="why-title" grade>
      <div className="grid grid-cols-[minmax(0,520px)_1fr] gap-36 px-page pt-23 -mb-5 max-lg:grid-cols-1 max-lg:gap-10 max-lg:pt-0 max-lg:mb-0">
        <div>
          <Reveal>
            <p className="eyebrow text-eyebrow tracking-caps text-brass-light">{WHY_NOT_AI.eyebrow}</p>
            <h2 id="why-title" className="mt-5 font-display text-display-lg leading-tighter tracking-headline">
              {WHY_NOT_AI.headline.map(({ text, breakOn }) => (
                <Fragment key={text}>
                  {text} {breakOn && <br className={breakOn === 'desktop' ? 'max-lg:hidden' : 'lg:hidden'} />}
                </Fragment>
              ))}
            </h2>
          </Reveal>
          <Reveal index={1}>
            <p className="mt-9 text-lead leading-relaxed">{WHY_NOT_AI.intro}</p>
            <p className="mt-6 max-w-120 text-body-sm leading-airy">{WHY_NOT_AI.body}</p>
          </Reveal>
        </div>
        <ol className="border-b border-snow/(--opacity-hairline-on-video)">
          {WHY_NOT_AI.points.map((point, index) => (
            <li key={point.numeral} className="border-t border-snow/(--opacity-hairline-on-video)">
              <Reveal index={index} className="grid grid-cols-[64px_1fr] pt-5 pb-7 max-lg:grid-cols-[48px_1fr]">
                <span aria-hidden className="font-display text-numeral leading-snug text-brass-light">
                  {point.numeral}
                </span>
                <div>
                  <h3 className="font-display text-heading-xs leading-snug">{point.title}</h3>
                  <p className="mt-2 text-body-sm leading-relaxed">{point.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>

      {/* The closing line sits on the struck-through "average", as in Figma (below it on phones). */}
      <div
        ref={ghost}
        className="relative mt-auto -mb-18 flex justify-center max-lg:mt-14 max-lg:mb-0 max-lg:flex-col max-lg:items-center"
      >
        <span aria-hidden className="relative font-display text-ghost-word leading-[normal] tracking-display text-outline text-brass/40">
          {WHY_NOT_AI.ghostWord}
          <motion.span
            className="absolute -inset-x-10 top-[59%] h-[2px] origin-left bg-brass max-lg:-inset-x-6"
            style={{ scaleX: reduce ? 1 : strike }}
          />
        </span>
        <p className="absolute inset-x-0 top-1/2 text-center font-accent text-heading-sm italic max-lg:static max-lg:mt-2 max-lg:px-page">
          {WHY_NOT_AI.closing}
        </p>
      </div>
    </Chapter>
  );
}
