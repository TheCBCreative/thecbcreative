import { motion, useTransform, type MotionStyle } from 'motion/react';
import { Link, useLocation } from 'react-router';
import { UnderlineLink } from '~/components/ui/UnderlineLink';
import { Wordmark } from '~/components/ui/Wordmark';
import { NAV_LINKS, SITE } from '~/data/site';
import { useLogoHandoff } from '~/hooks/useLogoHandoff';
import { useNavCurrent } from '~/hooks/useNavCurrent';
import { MobileMenu } from './MobileMenu';

const MotionLink = motion.create(Link);

export function SiteNav() {
  const isHome = useLocation().pathname === '/';
  const current = useNavCurrent();
  // On the homepage the nav logo (and, on phones, its tinted bar) fades in as the hero's logo scrolls away.
  const handoff = useLogoHandoff();
  const visibility = useTransform(handoff, (value) => (value === 0 ? 'hidden' : 'visible'));

  return (
    <motion.header className="fixed inset-x-0 top-0 z-50 h-nav" style={{ '--nav-fade': isHome ? handoff : 1 } as MotionStyle}>
      <div aria-hidden className="absolute inset-0 bg-pine/(--opacity-nav-tint) shadow-nav backdrop-blur-nav max-lg:opacity-(--nav-fade)" />
      <nav aria-label="Primary" className="relative flex h-full items-center justify-between px-edge">
        <ul className="flex gap-9 eyebrow text-caption tracking-caps text-snow max-lg:hidden">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <UnderlineLink to={link.to} aria-current={current(link.to)}>
                {link.label}
              </UnderlineLink>
            </li>
          ))}
        </ul>
        <MotionLink
          to="/"
          aria-label={`${SITE.name} — home`}
          className="max-lg:order-first"
          style={{ opacity: isHome ? handoff : 1, visibility: isHome ? visibility : 'visible' }}
        >
          <Wordmark />
        </MotionLink>
        <MobileMenu />
      </nav>
    </motion.header>
  );
}
