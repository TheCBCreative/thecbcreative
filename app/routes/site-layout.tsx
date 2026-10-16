import { Outlet, useLocation } from 'react-router';
import { useStartAtTop } from '~/hooks/useStartAtTop';
import { SiteFooter } from '~/components/layout/SiteFooter';
import { SiteNav } from '~/components/layout/SiteNav';
import { SkipLink } from '~/components/layout/SkipLink';
import { VideoBackground } from '~/components/layout/VideoBackground';
import { ScrollHint } from '~/components/ui/ScrollHint';

export default function SiteLayout() {
  useStartAtTop(useLocation().pathname === '/');
  return (
    <div id="top">
      <SkipLink />
      <VideoBackground />
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
      {/* Phones show a nudge whenever there's more page below. Wider screens only get it on Contact (see there). */}
      <ScrollHint className="lg:hidden" />
    </div>
  );
}
