import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { SERVICES_INTRO } from '~/data/home';
import { SERVICES } from '~/data/services';
import { ServiceCard } from './ServiceCard';

export function Services() {
  return (
    <Chapter id="services" labelledBy="services-title" grade className="justify-center">
      <div className="px-page">
        <Reveal>
          <p className="eyebrow text-eyebrow-lg tracking-eyebrow">{SERVICES_INTRO.eyebrow}</p>
          <h2 id="services-title" className="mt-4 font-display text-heading-lg">
            {SERVICES_INTRO.headline}
          </h2>
          <p className="mt-8.5 max-w-155 text-body-lg leading-copy">{SERVICES_INTRO.body}</p>
        </Reveal>
        <ul className="mt-16 grid grid-cols-3 gap-8">
          {SERVICES.map((service, index) => (
            <li key={service.slug}>
              <Reveal index={index}>
                <ServiceCard service={service} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </Chapter>
  );
}
