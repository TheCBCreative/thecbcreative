import type { MetaDescriptor } from 'react-router';
import { SITE } from '~/data/site';

interface PageMeta {
  title: string;
  description: string;
  path: string;
  // Pages people shouldn't land on from search (the 404).
  noindex?: boolean;
  // Extra schema.org records for this page, alongside the site-wide business and website records.
  structuredData?: Record<string, unknown>[];
}

export const absoluteUrl = (path: string) => `${SITE.url}${path === '/' ? '/' : path}`;

const BUSINESS_ID = `${SITE.url}/#business`;

// The business record every page carries, so search and AI answer engines can cite it accurately.
// Only what the site itself publishes: city and region, no street address, email or phone.
const business = {
  '@type': 'ProfessionalService',
  '@id': BUSINESS_ID,
  name: SITE.name,
  url: absoluteUrl('/'),
  logo: absoluteUrl(SITE.logo),
  image: absoluteUrl(SITE.socialImage),
  description: SITE.description,
  founder: { '@type': 'Person', name: SITE.founder },
  address: { '@type': 'PostalAddress', addressLocality: SITE.locality, addressRegion: SITE.region, addressCountry: 'US' },
  areaServed: [`${SITE.locality}, ${SITE.region}`, SITE.areaServed],
};

const website = { '@type': 'WebSite', '@id': `${SITE.url}/#website`, name: SITE.name, url: absoluteUrl('/'), publisher: { '@id': BUSINESS_ID } };

export const businessRef = { '@id': BUSINESS_ID };

// Title, description, canonical, social preview cards and structured data for one page.
export function pageMeta({ title, description, path, noindex, structuredData = [] }: PageMeta): MetaDescriptor[] {
  const url = absoluteUrl(path);
  const image = absoluteUrl(SITE.socialImage);
  return [
    { title },
    { name: 'description', content: description },
    ...(noindex ? [{ name: 'robots', content: 'noindex, follow' }] : [{ tagName: 'link', rel: 'canonical', href: url }]),
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE.name },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: image },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { 'script:ld+json': { '@context': 'https://schema.org', '@graph': [business, website, ...structuredData] } },
  ];
}
