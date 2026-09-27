import { Outlet } from 'react-router';
import { SiteFooter } from '~/components/layout/SiteFooter';
import { SiteNav } from '~/components/layout/SiteNav';
import { SkipLink } from '~/components/layout/SkipLink';
import { VideoBackground } from '~/components/layout/VideoBackground';

export default function SiteLayout() {
  return (
    <div id="top">
      <SkipLink />
      <VideoBackground />
      <SiteNav />
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
}
