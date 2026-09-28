import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, type ReactNode } from 'react';
import { data, Link, useLocation } from 'react-router';
import type { Route } from './+types/service';
import { cameFromHome, useFlip } from '~/components/flip/flip-context';
import { SkipLink } from '~/components/layout/SkipLink';
import { GhostNumeral } from '~/components/service/GhostNumeral';
import { Button } from '~/components/ui/Button';
import { Wordmark } from '~/components/ui/Wordmark';
import { getNextService, getService, SERVICES, type Service } from '~/data/services';
import { SITE } from '~/data/site';
import { absoluteUrl, businessRef, pageMeta } from '~/seo/meta';
import { DURATION } from '~/styles/motion';
import { pageDraw, pageFade, pageFadeUp, pageRise, pageStagger } from '~/styles/page-reveal';
import { groupUnderline } from '~/styles/underline';
import { cx } from '~/utils/cx';
import { twoDigits } from '~/utils/format';

export function loader({ params }: Route.LoaderArgs) {
  const service = getService(params.slug);
  if (!service) throw data(null, { status: 404 });
  return { service, next: getNextService(service.slug) ?? null };
}

export function meta({ loaderData }: Route.MetaArgs) {
  if (!loaderData) return [];
  const { service } = loaderData;
  const path = `/services/${service.slug}`;
  const description = service.description[0];
  return pageMeta({
    title: `${service.title} | ${SITE.name}`,
    description,
    path,
    structuredData: [
      {
        '@type': 'Service',
        name: service.title,
        serviceType: service.tag,
        description: service.description.join(' '),
        url: absoluteUrl(path),
        provider: businessRef,
        areaServed: [`${SITE.locality}, ${SITE.region}`, SITE.areaServed],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
          { '@type': 'ListItem', position: 2, name: 'Services', item: absoluteUrl('/#services') },
          { '@type': 'ListItem', position: 3, name: service.title, item: absoluteUrl(path) },
        ],
      },
    ],
  });
}

export default function Service({ loaderData }: Route.ComponentProps) {
  const { service, next } = loaderData;
  const { close } = useFlip();
  const location = useLocation();
  const fromHome = cameFromHome(location.state);
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
        className="relative z-10 mx-edge grid h-bar grid-cols-3 items-center border-b border-pine/(--opacity-page-rule) max-lg:grid-cols-2"
        variants={pageFade}
        initial="hidden"
        animate="shown"
      >
        <CloseLink service={service} fromHome={fromHome} className="justify-self-start gap-3">
          <span aria-hidden className="font-body text-heading-xs leading-none font-extralight">
            ×
          </span>
          <span className={`${groupUnderline} eyebrow text-caption tracking-caps`}>Close</span>
        </CloseLink>
        <p className="justify-self-center eyebrow text-caption tracking-caps text-pine/(--opacity-muted-text) max-lg:hidden">Services</p>
        <Link to="/" aria-label={`${SITE.name} — home`} className="justify-self-end">
          <Wordmark />
        </Link>
      </motion.header>

      <AnimatePresence mode="wait">
        <motion.main
          key={service.slug}
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-page pt-lede pb-flow-md focus:outline-none"
          exit={{ opacity: 0, transition: { duration: DURATION.fade } }}
        >
          <GhostNumeral number={service.number} />
          <motion.div className="relative" variants={pageStagger} initial="hidden" animate="shown">
            <motion.p variants={pageFade} className="eyebrow text-eyebrow tracking-caps text-brass-deep">
              {service.tag}
            </motion.p>
            <h1
              ref={heading}
              tabIndex={-1}
              className="mt-flow-2xs flex flex-col font-display text-display-2xl leading-tightest tracking-display focus:outline-none"
            >
              {service.titleLines.map((line) => (
                <span key={line} className="mask-line">
                  <motion.span variants={pageRise} className="block">
                    {line}
                  </motion.span>
                </span>
              ))}
            </h1>
            <motion.div variants={pageDraw} className="mt-flow-lg h-px w-12 origin-left bg-brass" />
            <motion.div variants={pageFadeUp} className="mt-flow-sm max-w-172 space-y-flow-xs text-body-lg leading-airy text-pine/88">
              {service.description.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </motion.div>
            <motion.div variants={pageFadeUp} className="mt-flow-md">
              <Button to="/contact">Let's talk</Button>
            </motion.div>
          </motion.div>
        </motion.main>
      </AnimatePresence>

      <motion.footer
        className="relative z-10 mx-edge flex h-bar items-center justify-between border-t border-pine/(--opacity-page-rule)"
        variants={pageFade}
        initial="hidden"
        animate="shown"
      >
        <p className="font-display text-lead-sm">
          <span aria-hidden>
            {service.number} / {twoDigits(SERVICES.length)}
          </span>
          <span className="sr-only">
            Service {position} of {SERVICES.length}
          </span>
        </p>
        {next ? (
          // Replace, so Close still goes straight back to the homepage.
          <Link to={`/services/${next.slug}`} state={{ fromHome }} replace className="group flex items-center gap-4">
            <span className={`${groupUnderline} eyebrow text-caption tracking-caps`}>
              <span className="sr-only">Next service: </span>
              <span aria-hidden>Next — </span>
              {next.title}
            </span>
            <span aria-hidden className="font-body text-icon leading-none font-extralight text-brass">
              →
            </span>
          </Link>
        ) : (
          <CloseLink service={service} fromHome={fromHome} className="gap-4">
            <span className={`${groupUnderline} eyebrow text-caption tracking-caps`}>See all services</span>
            <span aria-hidden className="font-body text-icon leading-none font-extralight text-brass">
              ×
            </span>
          </CloseLink>
        )}
      </motion.footer>
    </div>
  );
}

// Closes the page with the reverse flip, landing back on the card in Services.
function CloseLink({
  service,
  fromHome,
  className,
  children,
}: {
  service: Service;
  fromHome: boolean;
  className?: string;
  children: ReactNode;
}) {
  const { close } = useFlip();
  return (
    <Link
      to="/#services"
      onClick={(event) => {
        event.preventDefault();
        close(service, fromHome);
      }}
      className={cx('group flex items-center', className)}
    >
      {children}
    </Link>
  );
}
