import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { ABOUT } from '~/data/home';

export function About() {
  return (
    <Chapter id="about" labelledBy="about-title" className="justify-center pb-12">
      <div className="grid grid-cols-[25rem_40rem] items-center gap-30 px-page">
        <Reveal className="relative">
          <div aria-hidden className="absolute inset-0 translate-x-5 translate-y-5 bg-brass" />
          <img
            src={ABOUT.photo.src}
            alt={ABOUT.photo.alt}
            width={ABOUT.photo.width}
            height={ABOUT.photo.height}
            loading="lazy"
            className="relative aspect-400/487 w-full object-cover"
          />
        </Reveal>
        <div>
          <Reveal index={1}>
            <p className="eyebrow text-eyebrow-lg tracking-eyebrow">{ABOUT.eyebrow}</p>
            <h2 id="about-title" className="mt-7.5 font-display text-display-xs">
              {ABOUT.headline}
            </h2>
          </Reveal>
          <Reveal index={2} className="mt-7 space-y-3.5 text-body leading-loose text-mist">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </Reveal>
          <Reveal index={3}>
            <ol className="mt-9 grid grid-cols-2 gap-x-6">
              {ABOUT.points.map((point, index) => (
                <li key={point} className="grid grid-cols-[2.25rem_1fr] border-t border-snow/(--opacity-hairline-on-video) pt-3 pb-3">
                  <span aria-hidden className="font-display text-lead-sm text-brass-light">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-label leading-body">{point}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </Chapter>
  );
}
