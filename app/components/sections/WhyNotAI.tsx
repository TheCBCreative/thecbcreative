import { motion } from 'motion/react';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { WHY_NOT_AI } from '~/data/home';
import { DURATION, EASE_OUT } from '~/styles/motion';

export function WhyNotAI() {
  return (
    <Chapter id="why-not-ai" labelledBy="why-title" grade className="overflow-hidden">
      <div className="grid grid-cols-[520px_1fr] gap-36 px-page pt-44">
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

      <p className="relative mt-auto pt-14 text-center font-accent text-heading-sm italic">{WHY_NOT_AI.closing}</p>
      <div aria-hidden className="relative -mb-16 flex justify-center">
        <span className="font-display text-ghost-word leading-none tracking-display text-outline text-brass/40">
          {WHY_NOT_AI.ghostWord}
        </span>
        <motion.span
          className="absolute -inset-x-10 top-[58%] h-0.5 origin-left bg-brass"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: DURATION.draw, ease: EASE_OUT }}
        />
      </div>
    </Chapter>
  );
}
