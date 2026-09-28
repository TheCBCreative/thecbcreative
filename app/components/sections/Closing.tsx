import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { CLOSING } from '~/data/home';

export function Closing() {
  return (
    <Chapter labelledBy="closing-title" grade withFooter className="items-center justify-center text-center">
      <div className="flex flex-1 flex-col items-center justify-center px-page max-lg:py-10">
        <Reveal>
          <h2 id="closing-title" className="mx-auto max-w-260 font-display text-display leading-display tracking-headline">
            {CLOSING.tagline[0]} <span className="text-brass-light">{CLOSING.tagline[1]}</span> {CLOSING.tagline[2]}
          </h2>
        </Reveal>
        <Reveal index={1} className="flex flex-col items-center">
          <span aria-hidden className="mt-10 h-px w-12 bg-brass" />
          <p className="mt-8 font-accent text-heading italic">{CLOSING.signOff}</p>
          <Button to={CLOSING.cta.to} className="mt-10">
            {CLOSING.cta.label}
          </Button>
        </Reveal>
      </div>
    </Chapter>
  );
}
