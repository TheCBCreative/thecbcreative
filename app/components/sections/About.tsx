import { motion, type Variants } from 'motion/react';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { ABOUT } from '~/data/home';
import { EASE_OUT, POINTS_REVEAL, REVEAL_OFFSET } from '~/styles/motion';

// The 01–06 points arrive one at a time as the list scrolls into view.
const points: Variants = { shown: { transition: { staggerChildren: POINTS_REVEAL.stagger } } };
const point: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET / 2 },
  shown: { opacity: 1, y: 0, transition: { duration: POINTS_REVEAL.duration, ease: EASE_OUT } },
};

export function About() {
  return (
    <Chapter id="about" labelledBy="about-title" flush className="justify-center pb-12">
      <div className="grid grid-cols-[minmax(0,400px)_minmax(0,640px)] items-center gap-30 px-page max-lg:block max-lg:px-0">
        <Reveal className="relative">
          <div aria-hidden className="absolute inset-0 translate-x-5 translate-y-5 bg-brass max-lg:hidden" />
          <img
            src={ABOUT.photo.src}
            alt={ABOUT.photo.alt}
            width={ABOUT.photo.width}
            height={ABOUT.photo.height}
            loading="lazy"
            className="relative aspect-400/487 w-full object-cover max-lg:aspect-39/47 max-lg:max-h-photo max-lg:object-top max-lg:mask-b-from-60%"
          />
          {/* On phones the photo runs edge to edge and dissolves into the video under the heading:
              its bottom fades out, a soft blur covers the seam, and a Pine wash keeps the heading legible. */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-b from-pine/0 from-40% via-pine/60 via-75% to-pine/0 lg:hidden" />
          <div aria-hidden className="absolute inset-x-0 -bottom-24 h-64 backdrop-blur-glass mask-y-from-50% lg:hidden" />
        </Reveal>
        <div className="relative max-lg:-mt-40 max-lg:px-page">
          <Reveal index={1}>
            <p className="eyebrow text-eyebrow-lg tracking-eyebrow">{ABOUT.eyebrow}</p>
            <h2 id="about-title" className="mt-8 font-display text-display-lg leading-tighter tracking-headline">
              {ABOUT.headline}
            </h2>
          </Reveal>
          <Reveal index={2} className="mt-7 space-y-4 text-body leading-loose text-mist">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
          <motion.ol
            className="mt-9 grid grid-cols-2 gap-x-6 max-lg:grid-cols-1"
            variants={points}
            initial="hidden"
            whileInView="shown"
            viewport={{ once: true, margin: '0px 0px -10% 0px' }}
          >
            {ABOUT.points.map((text, index) => (
              <motion.li
                key={text}
                variants={point}
                className="grid grid-cols-[36px_1fr] border-t border-snow/(--opacity-hairline-on-video) pt-3 pb-3"
              >
                <span aria-hidden className="font-display text-lead-sm text-brass-light">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-label leading-body">{text}</span>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </div>
    </Chapter>
  );
}
