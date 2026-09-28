import { AnimatePresence, motion, type Variants } from 'motion/react';
import { useCallback, useEffect } from 'react';
import { data, Link, useLocation } from 'react-router';
import type { Route } from './+types/service';
import { useFlip } from '~/components/flip/flip-context';
import { SkipLink } from '~/components/layout/SkipLink';
import { GhostNumeral } from '~/components/service/GhostNumeral';
import { Button } from '~/components/ui/Button';
import { groupUnderline } from '~/styles/underline';
import { Wordmark } from '~/components/ui/Wordmark';
import { getNextService, getService, SERVICES } from '~/data/services';
import { SITE } from '~/data/site';
import { DURATION, EASE_OUT, REVEAL_OFFSET } from '~/styles/motion';

export function loader({ params }: Route.LoaderArgs) {
  const service = getService(params.slug);
  if (!service) throw data(null, { status: 404 });
  return { service, next: getNextService(service.slug) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  return [
    { title: `${loaderData.service.title} | ${SITE.name}` },
    { name: 'description', content: loaderData.service.description[0] },
  ];
}

// Reveal order from the motion spec: furniture → eyebrow → headline lines → rule → description → CTA.
const stagger: Variants = {
  shown: { transition: { staggerChildren: DURATION.stagger } },
};
const fade: Variants = {
  hidden: { opacity: 0 },
  shown: { opacity: 1, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};
const fadeUp: Variants = {
  hidden: { opacity: 0, y: REVEAL_OFFSET },
  shown: { opacity: 1, y: 0, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};
const rise: Variants = {
  hidden: { y: '100%', opacity: 0 },
  shown: { y: 0, opacity: 1, transition: { duration: DURATION.reveal * 1.5, ease: EASE_OUT } },
};
const draw: Variants = {
  hidden: { scaleX: 0 },
  shown: { scaleX: 1, transition: { duration: DURATION.reveal, ease: EASE_OUT } },
};

export default function Service({ loaderData }: Route.ComponentProps) {
  const { service, next } = loaderData;
  const { close } = useFlip();
  const location = useLocation();
  const fromHome = Boolean((location.state as { fromHome?: boolean } | null)?.fromHome);
  const position = SERVICES.findIndex((item) => item.slug === service.slug) + 1;

  // Escape closes the page, like the Close link.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(service, fromHome);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close, service, fromHome]);

  // After an in-app navigation, focus the heading as it mounts (after the cross-fade on Next).
  const arrivedIn = location.key !== 'default';
  const heading = useCallback(
    (element: HTMLHeadingElement | null) => {
      if (element && arrivedIn) element.focus({ preventScroll: true });
    },
    [arrivedIn],
  );

  return (
    <div className="relative flex min-h-svh flex-col overflow-clip surface-cream">
      <SkipLink />
      <motion.header
        className="relative z-10 mx-edge grid h-bar grid-cols-3 items-center border-b border-pine/(--opacity-page-rule)"
        variants={fade}
        initial="hidden"
        animate="shown"
      >
        <Link
          to="/#services"
          onClick={(event) => {
            event.preventDefault();
            close(service, fromHome);
          }}
          className="group flex items-center gap-3 justify-self-start"
        >
          <span aria-hidden className="font-body text-heading-xs leading-none font-extralight">
            ×
          </span>
          <span className={`${groupUnderline} eyebrow text-caption tracking-caps`}>Close</span>
        </Link>
        <p className="justify-self-center eyebrow text-caption tracking-caps text-pine/(--opacity-muted-text)">Services</p>
        <Link to="/" aria-label={`${SITE.name} — home`} className="justify-self-end">
          <Wordmark className="h-10 w-32" />
        </Link>
      </motion.header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={service.slug}
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-page pt-lede pb-flow-md focus:outline-none"
          exit={{ opacity: 0, transition: { duration: DURATION.fade } }}
        >
          <GhostNumeral number={service.number} />
          <motion.div className="relative" variants={stagger} initial="hidden" animate="shown">
            <motion.p variants={fade} className="eyebrow text-eyebrow tracking-caps text-brass-deep">
              {service.tag}
            </motion.p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="mt-flow-xs flex flex-col font-display text-display-2xl leading-tightest tracking-display focus:outline-none"
            >
              {service.titleLines.map((line) => (
                <span key={line} className="mask-line">
                  <motion.span variants={rise} className="block">
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div variants={draw} className="mt-flow-lg h-px w-12 origin-left bg-brass" />
            <motion.div variants={fadeUp} className="mt-flow-sm max-w-135 space-y-flow-xs text-body-lg leading-airy text-pine/88">
              {service.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </motion.div>
            <motion.div variants={fadeUp} className="mt-flow-md">
              <Button to="/contact">Let's talk</Button>
            </motion.div>
          </motion.div>
        </motion.main>
      </AnimatePresence>

      <motion.footer
        className="relative z-10 mx-edge flex h-bar items-center justify-between border-t border-pine/(--opacity-page-rule)"
        variants={fade}
        initial="hidden"
        animate="shown"
      >
        <p className="font-display text-lead-sm">
          <span aria-hidden>
            {service.number} / {String(SERVICES.length).padStart(2, '0')}
          </span>
          <span className="sr-only">
            Service {position} of {SERVICES.length}
          </span>
        </p>
        <Link to={`/services/${next.slug}`} state={{ fromHome }} className="group flex items-center gap-4">
          <span className={`${groupUnderline} eyebrow text-caption tracking-caps`}>
            <span className="sr-only">Next service: </span>
            <span aria-hidden>Next — </span>
            {next.title}
          </span>
          <span aria-hidden className="font-body text-icon leading-none font-extralight text-brass">
            →
          </span>
        </Link>
      </motion.footer>
    </div>
  );
}
