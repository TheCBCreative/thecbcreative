import { About } from '~/components/sections/About';
import { Closing } from '~/components/sections/Closing';
import { Hero } from '~/components/sections/Hero';
import { Services } from '~/components/sections/Services';
import { WhyNotAI } from '~/components/sections/WhyNotAI';

export default function Home() {
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
