import { useFlip } from '~/components/flip/flip-context';
import { Chapter } from '~/components/ui/Chapter';
import { Reveal } from '~/components/ui/Reveal';
import { SERVICES_INTRO } from '~/data/home';
import { SERVICES } from '~/data/services';
import { cx } from '~/utils/cx';
import { ServiceCard } from './ServiceCard';

export function Services() {
  const { activeSlug } = useFlip();

  return (
    <Chapter id="services" labelledBy="services-title" grade className="justify-center">
      <div className="px-page">
        <Reveal className="grid grid-cols-3 items-end gap-8">
          <div>
            <p className="eyebrow text-eyebrow-lg tracking-eyebrow">{SERVICES_INTRO.eyebrow}</p>
            <h2 id="services-title" className="mt-4 font-display text-display-lg leading-tighter tracking-headline">
              {SERVICES_INTRO.headline}
            </h2>
          </div>
          <p className="col-span-2 max-w-155 text-body-lg leading-copy">{SERVICES_INTRO.body}</p>
        </Reveal>
        <ul className="mt-16 grid grid-cols-3 gap-16">
          {SERVICES.map((service, index) => (
            // Hidden while the flip overlay stands in for this card.
            <li key={service.slug} data-service={service.slug} className={cx(activeSlug === service.slug && 'invisible')}>
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
