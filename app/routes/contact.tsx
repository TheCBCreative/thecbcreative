import { ContactForm } from '~/components/contact/ContactForm';
import { LoopingVideo } from '~/components/ui/LoopingVideo';
import { Reveal } from '~/components/ui/Reveal';
import { ScrollHint } from '~/components/ui/ScrollHint';
import { CONTACT } from '~/data/contact';
import { MOUNTAIN_VIDEO } from '~/data/media';
import { SITE } from '~/data/site';

export function meta() {
  return [{ title: `Contact | ${SITE.name}` }, { name: 'description', content: CONTACT.intro }];
}

// A cream panel inset over the video: the misty image window carries the headline, the form sits beside it.
// Below the switch point the panel runs full width and the image becomes a band at the top.
export default function Contact() {
  return (
    <section aria-labelledby="contact-title" className="min-h-[calc(100svh-var(--spacing)*18)] px-edge pt-nav pb-12 max-lg:px-0 max-lg:pb-0">
      <div className="my-6 grid grid-cols-[minmax(0,600px)_minmax(0,520px)] gap-22 p-6 shadow-panel surface-cream max-lg:mt-0 max-lg:grid-cols-1 max-lg:gap-0 max-lg:p-0 max-lg:pb-16">
        <div className="relative min-h-0 overflow-hidden max-lg:h-80">
          {/* A cropped window onto the same mountain footage: "Contact" in Pine sits in the bright fog at the top,
              the eyebrow in Brass Light over the dark treeline, helped by a soft Pine grade at the foot. */}
          <LoopingVideo {...MOUNTAIN_VIDEO} />
          <div aria-hidden className="absolute inset-0 z-20 bg-linear-to-t from-pine/70 to-pine/0 to-35%" />
          <Reveal className="absolute inset-x-0 top-0 z-30 p-10 max-lg:p-page max-lg:pt-8">
            <h1 id="contact-title" className="font-display text-display-xl leading-none tracking-display text-pine">
              {CONTACT.headline}
            </h1>
          </Reveal>
          <Reveal index={1} className="absolute inset-x-0 bottom-0 z-30 p-10 pb-16 max-lg:p-page max-lg:pb-10">
            <p className="eyebrow text-body-sm tracking-eyebrow text-brass-light">{CONTACT.eyebrow}</p>
          </Reveal>
        </div>
        <div className="py-4 max-lg:px-page max-lg:pt-10 max-lg:pb-0">
          <Reveal>
            <p className="text-body leading-relaxed">{CONTACT.intro}</p>
          </Reveal>
          <Reveal index={1} className="mt-12">
            <ContactForm />
          </Reveal>
        </div>
      </div>
      <ScrollHint />
    </section>
  );
}
