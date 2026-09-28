import { About } from '~/components/sections/About';
import { Closing } from '~/components/sections/Closing';
import { Hero } from '~/components/sections/Hero';
import { Services } from '~/components/sections/Services';
import { WhyNotAI } from '~/components/sections/WhyNotAI';
import { SITE } from '~/data/site';
import { useSectionHash } from '~/hooks/useSectionHash';
import { pageMeta } from '~/seo/meta';

const NAV_SECTIONS = ['home', 'about', 'services'] as const;

export function meta() {
  return pageMeta({ title: SITE.title, description: SITE.description, path: '/' });
}

export default function Home() {
  useSectionHash(NAV_SECTIONS);

  return (
    <>
      <Hero />
      <About />
      <Services />
      <WhyNotAI />
      <Closing />
    </>
  );
}
