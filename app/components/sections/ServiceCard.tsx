import { useRef, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { useFlip } from '~/components/flip/flip-context';
import type { Service } from '~/data/services';
import { cx } from '~/utils/cx';

interface ServiceCardProps {
  service: Service;
  // The glass face drawn by the flip overlay: same look, no link or hover.
  face?: boolean;
}

// The whole card is one link (stretched from the title); E1 hover lifts it and brightens the border.
export function ServiceCard({ service, face }: ServiceCardProps) {
  const card = useRef<HTMLElement>(null);
  const flip = useFlip();

  const open = (event: MouseEvent) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !card.current) return;
    event.preventDefault();
    flip.open(service, card.current.getBoundingClientRect());
  };

  const title = (
    <>
      {service.titleLines[0]}
      <br />
      {service.titleLines[1]}
    </>
  );

  return (
    <article
      ref={card}
      className={cx(
        'group relative flex flex-col rounded-sm border border-brass/50 bg-pine/(--opacity-glass-tint) p-9 shadow-card backdrop-blur-glass',
        face
          ? 'h-full'
          : 'h-card transition duration-(--duration-link-underline) ease-out-soft hover:-translate-y-2 hover:border-brass hover:shadow-card-hover has-focus-visible:-translate-y-2 has-focus-visible:border-brass has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-(--focus-ring) motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      )}
    >
      <div className="flex items-center justify-between border-b border-brass/45 pb-4">
        <span aria-hidden className="font-display text-numeral-sm text-brass-light">
          {service.number}
        </span>
        <p className="eyebrow text-eyebrow tracking-eyebrow text-snow/75">{service.tag}</p>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-display-sm leading-tight tracking-tight">
          {face ? (
            title
          ) : (
            <Link
              to={`/services/${service.slug}`}
              onClick={open}
              className="after:absolute after:inset-0 focus-visible:outline-none"
            >
              {title}
            </Link>
          )}
        </h3>
        <p className="mt-6 max-w-59 text-body-sm leading-body text-snow/80">{service.teaser}</p>
        <span aria-hidden className="pointer-events-none absolute right-7 bottom-3 font-body text-display-xl leading-none font-extralight text-brass">
          +
        </span>
      </div>
    </article>
  );
}
