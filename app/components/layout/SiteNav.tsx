import { motion, useTransform } from 'motion/react';
import { Link, useLocation } from 'react-router';
import { UnderlineLink } from '~/components/ui/UnderlineLink';
import { Wordmark } from '~/components/ui/Wordmark';
import { NAV_LINKS, SITE } from '~/data/site';
import { useLogoHandoff } from '~/hooks/useLogoHandoff';

const MotionLink = motion.create(Link);

export function SiteNav() {
  const isHome = useLocation().pathname === '/';
  const opacity = useLogoHandoff();
  const visibility = useTransform(opacity, (value) => (value === 0 ? 'hidden' : 'visible'));

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-nav bg-pine/(--opacity-nav-tint) shadow-nav backdrop-blur-nav">
      <nav aria-label="Primary" className="flex h-full items-center justify-between px-edge">
        <ul className="flex gap-9 eyebrow text-caption tracking-caps text-snow">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <UnderlineLink to={link.to} nav={!link.to.includes('#')}>
                {link.label}
              </UnderlineLink>
            </li>
          ))}
        </ul>
        <MotionLink to="/" aria-label={`${SITE.name} — home`} style={isHome ? { opacity, visibility } : undefined}>
          <Wordmark className="h-10 w-32" />
        </MotionLink>
      </nav>
    </header>
  );
}
