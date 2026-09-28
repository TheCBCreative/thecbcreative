import { UnderlineLink } from '~/components/ui/UnderlineLink';
import { SITE } from '~/data/site';

export function SiteFooter() {
  return (
    <footer className="px-edge">
      <div className="flex h-18 items-center justify-between border-t border-snow/(--opacity-footer-rule) eyebrow text-caption tracking-caps text-snow max-lg:h-auto max-lg:flex-col max-lg:gap-4 max-lg:py-8 max-lg:text-center">
        <img src="/brand/logo-mark.svg" alt="" width={40} height={40} className="size-10" />
        <p>
          {SITE.locality}, {SITE.region} <span aria-hidden>·</span> © {new Date().getFullYear()} {SITE.name}
        </p>
        <UnderlineLink to="#top">
          Back to top <span aria-hidden>↑</span>
        </UnderlineLink>
      </div>
    </footer>
  );
}
