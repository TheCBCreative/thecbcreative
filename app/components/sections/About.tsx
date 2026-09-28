import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { ABOUT } from '~/data/home';

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
            className="relative aspect-400/487 w-full object-cover max-lg:aspect-39/47 max-lg:max-h-photo max-lg:object-top"
          />
          {/* On phones the photo runs edge to edge and fades into Pine under the heading. */}
          <div aria-hidden className="absolute inset-0 bg-linear-to-b from-pine/0 from-45% to-pine/95 lg:hidden" />
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
          <Reveal index={3}>
            <ol className="mt-9 grid grid-cols-2 gap-x-6 max-lg:grid-cols-1">
              {ABOUT.points.map((point, index) => (
                <li key={point} className="grid grid-cols-[36px_1fr] border-t border-snow/(--opacity-hairline-on-video) pt-3 pb-3">
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
