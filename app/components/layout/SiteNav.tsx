import { Link } from 'react-router';
import { UnderlineLink } from '~/components/ui/UnderlineLink';
import { NAV_LINKS, SITE } from '~/data/site';

export function SiteNav() {
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
        <Link to="/" aria-label={`${SITE.name} — home`}>
          <img src="/brand/logo-wordmark.svg" alt="" width={128} height={40} />
        </Link>
      </nav>
    </header>
  );
}
