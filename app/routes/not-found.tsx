import { Button } from '~/components/ui/Button';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { NOT_FOUND } from '~/data/not-found';
import { SITE } from '~/data/site';
import { pageMeta } from '~/seo/meta';

export function meta() {
  return pageMeta({ title: `Page not found | ${SITE.name}`, description: NOT_FOUND.body, path: '/404', noindex: true });
}

// Minimal, over the video like the closing chapter: eyebrow, headline, one line, a way home.
export default function NotFound() {
  return (
    <Chapter labelledBy="not-found-title" grade screen withFooter className="items-center justify-center px-page text-center">
      <Reveal rise={false}>
        <p className="eyebrow text-eyebrow-lg tracking-eyebrow text-brass-light">{NOT_FOUND.eyebrow}</p>
        <h1 id="not-found-title" className="mt-4 font-display text-display-lg leading-tighter tracking-headline">
          {NOT_FOUND.headline}
        </h1>
      </Reveal>
      <Reveal rise={false} index={1} className="flex flex-col items-center">
        <p className="mt-8 max-w-110 text-body-lg leading-copy text-mist">{NOT_FOUND.body}</p>
        <Button to={NOT_FOUND.cta.to} className="mt-10">
          {NOT_FOUND.cta.label}
        </Button>
      </Reveal>
    </Chapter>
  );
}
