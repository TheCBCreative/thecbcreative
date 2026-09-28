import { useCallback, useRef, useState } from 'react';
import { ContactForm } from '~/components/contact/ContactForm';
import { ThankYou } from '~/components/contact/ThankYou';
import { LoopingVideo } from '~/components/ui/LoopingVideo';
import { Reveal } from '~/components/ui/Reveal';
import { ScrollHint } from '~/components/ui/ScrollHint';
import { CONTACT } from '~/data/contact';
import { MOUNTAIN_VIDEO } from '~/data/media';
import { SITE } from '~/data/site';
import { pageMeta } from '~/seo/meta';

export function meta() {
  return pageMeta({ title: `Contact | ${SITE.name}`, description: CONTACT.metaDescription, path: '/contact' });
}

// Matches the 1200px switch point in tokens.css.
const SIDE_BY_SIDE = '(width >= 1200px)';

export default function Contact() {
  const panel = useRef<HTMLDivElement>(null);
  // The thank-you takes over the card. On desktop the card keeps its height; stacked, it shrinks and scrolls to the top.
  const [sent, setSent] = useState<{ height?: number }>();
  const onSent = useCallback(() => {
    const sideBySide = window.matchMedia(SIDE_BY_SIDE).matches;
    setSent({ height: sideBySide ? panel.current?.offsetHeight : undefined });
    if (!sideBySide) window.scrollTo({ top: 0 });
  }, []);

  return (
    <section aria-labelledby="contact-title" className="flex min-h-above-footer flex-col px-edge pt-nav pb-12 max-lg:px-0 max-lg:pb-0">
      <div ref={panel} className="my-6 flex flex-col shadow-panel surface-cream max-lg:mt-0" style={{ minHeight: sent?.height }}>
        {!sent ? (
          <div className="grid grid-cols-[minmax(0,600px)_minmax(0,520px)] gap-22 p-6 max-lg:grid-cols-1 max-lg:gap-0 max-lg:p-0 max-lg:pb-16">
            <div className="relative min-h-0 overflow-hidden max-lg:h-80">
              {/* The mountain footage, cropped: "Contact" sits in the fog, the eyebrow over the graded treeline. */}
              <LoopingVideo {...MOUNTAIN_VIDEO} />
              <div aria-hidden className="absolute inset-0 z-20 bg-linear-to-t from-pine/70 to-pine/0 to-35%" />
              <Reveal rise={false} className="absolute inset-x-0 top-0 z-30 p-10 max-lg:p-page max-lg:pt-8">
                <h1 id="contact-title" className="font-display text-display-xl leading-none tracking-display text-pine">
                  {CONTACT.headline}
                </h1>
              </Reveal>
              <Reveal rise={false} index={1} className="absolute inset-x-0 bottom-0 z-30 p-10 pb-16 max-lg:p-page max-lg:pb-10">
                <p className="eyebrow text-body-sm tracking-eyebrow text-brass-light">{CONTACT.eyebrow}</p>
              </Reveal>
            </div>
            <div className="py-4 max-lg:px-page max-lg:pt-10 max-lg:pb-0">
              <Reveal rise={false}>
                <p className="text-body leading-relaxed">{CONTACT.intro}</p>
              </Reveal>
              <Reveal rise={false} index={1} className="mt-12">
                <ContactForm onSent={onSent} />
              </Reveal>
            </div>
          </div>
        ) : (
          <ThankYou />
        )}
      </div>
      <ScrollHint />
    </section>
  );
}
