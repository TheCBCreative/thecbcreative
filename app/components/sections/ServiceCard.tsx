import { Link } from 'react-router';
import type { Service } from '~/data/services';

// The whole card is one link (stretched from the title); E1 hover lifts it and brightens the border.
export function ServiceCard({ service }: { service: Service }) {
  return (
    <article
      className="group relative flex h-115 flex-col rounded-sm border border-brass/50 bg-pine/(--opacity-glass-tint) p-9 shadow-card backdrop-blur-glass transition duration-(--duration-cta-fill) ease-out-soft hover:-translate-y-1.5 hover:border-brass hover:shadow-card-hover has-focus-visible:-translate-y-1.5 has-focus-visible:border-brass has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-(--focus-ring) motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      style={{ viewTransitionName: `service-${service.slug}` }}
    >
      <div className="flex items-center justify-between border-b border-brass/45 pb-3.5">
        <span aria-hidden className="font-display text-numeral-sm text-brass-light">
          {service.number}
        </span>
        <p className="eyebrow text-eyebrow tracking-eyebrow text-snow/75">{service.tag}</p>
      </div>
      <div className="mt-auto">
        <h3 className="font-display text-display-sm leading-tight tracking-tight">
          <Link
            to={`/services/${service.slug}`}
            viewTransition
            className="after:absolute after:inset-0 focus-visible:outline-none"
          >
            {service.titleLines[0]}
            <br />
            {service.titleLines[1]}
          </Link>
        </h3>
        <div className="mt-5.5 flex items-end justify-between">
          <p className="max-w-59 text-body-sm leading-body text-snow/80">{service.teaser}</p>
          <span aria-hidden className="font-body text-display-xs leading-none font-extralight text-brass">
            +
          </span>
        </div>
      </div>
    </article>
  );
}
