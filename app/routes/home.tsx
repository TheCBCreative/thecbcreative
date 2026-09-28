import { About } from '~/components/sections/About';
import { Closing } from '~/components/sections/Closing';
import { Hero } from '~/components/sections/Hero';
import { Services } from '~/components/sections/Services';
import { WhyNotAI } from '~/components/sections/WhyNotAI';
import { useSectionHash } from '~/hooks/useSectionHash';

const NAV_SECTIONS = ['about', 'services'] as const;

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
