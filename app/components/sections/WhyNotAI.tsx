import { motion } from 'motion/react';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { WHY_NOT_AI } from '~/data/home';
import { DURATION, EASE_OUT } from '~/styles/motion';

export function WhyNotAI() {
  return (
    <Chapter id="why-not-ai" labelledBy="why-title" grade>
      <div className="grid grid-cols-[32.5rem_1fr] gap-36 px-page pt-23 -mb-5">
        <div>
          <Reveal>
            <p className="eyebrow text-eyebrow tracking-caps text-brass-light">{WHY_NOT_AI.eyebrow}</p>
            <h2 id="why-title" className="mt-5 font-display text-display-lg leading-tighter tracking-headline">
              {WHY_NOT_AI.headlineLines[0]}
              <br />
              {WHY_NOT_AI.headlineLines[1]}
            </h2>
          </Reveal>
          <Reveal index={1}>
            <p className="mt-9 text-lead leading-relaxed">{WHY_NOT_AI.intro}</p>
            <p className="mt-5.5 max-w-120 text-body-sm leading-airy">{WHY_NOT_AI.body}</p>
          </Reveal>
        </div>
        <ol className="border-b border-snow/(--opacity-hairline-on-video)">
          {WHY_NOT_AI.points.map((point, index) => (
            <li key={point.numeral} className="border-t border-snow/(--opacity-hairline-on-video)">
              <Reveal index={index} className="grid grid-cols-[64px_1fr] pt-5 pb-6.5">
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

      {/* The closing line sits on the struck-through "average", as in Figma. */}
      {/* The parent watches the viewport: a scaleX(0) line has no area, so it can't. */}
      <motion.div
        className="relative mt-auto -mb-17.5 flex justify-center"
        initial="hidden"
        whileInView="shown"
        viewport={{ once: true }}
      >
        <span aria-hidden className="relative font-display text-ghost-word leading-[normal] tracking-display text-outline text-brass/40">
          {WHY_NOT_AI.ghostWord}
          <motion.span
            className="absolute -inset-x-10 top-[59%] h-0.5 origin-left bg-brass"
            variants={{ hidden: { scaleX: 0 }, shown: { scaleX: 1 } }}
            transition={{ duration: DURATION.draw, ease: EASE_OUT }}
          />
        </span>
        <p className="absolute inset-x-0 top-1/2 text-center font-accent text-heading-sm italic">{WHY_NOT_AI.closing}</p>
      </motion.div>
    </Chapter>
  );
}
