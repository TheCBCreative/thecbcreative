// Copy mirrors the Services grid and the expanded service frames in Figma.
export interface Service {
  slug: string;
  number: string;
  tag: string;
  title: string;
  titleLines: [string, string];
  teaser: string;
  description: string[];
}

export const SERVICES: Service[] = [
  {
    slug: 'custom-website',
    number: '01',
    tag: 'Design & Build',
    title: 'Custom Website',
    titleLines: ['Custom', 'Website'],
    teaser: 'Custom-designed. Custom-coded. Built around your brand.',
    description: [
      'A fully custom-designed, fully custom-coded site — including the brand identity behind it (colors, type, logo) — built around your business, not a template.',
      'Every build is accessible from day one, checked against a real accessibility standard, not just eyeballed.',
    ],
  },
  {
    slug: 'website-refresh',
    number: '02',
    tag: 'Refresh & Modernize',
    title: 'Website Refresh',
    titleLines: ['Website', 'Refresh'],
    teaser: "Outdated or off-brand? I'll rebuild it right.",
    description: [
      "Already have a site that's outdated or off-brand? I'll rebuild it with the same care as a from-scratch site, without you starting over.",
    ],
  },
  {
    slug: 'landing-pages',
    number: '03',
    tag: 'Focused & Fast',
    title: 'Landing Pages',
    titleLines: ['Landing', 'Pages'],
    teaser: 'One focused page, built to convert.',
    description: [
      'One focused, fast-loading page for a launch or campaign — built to convert, not just to look good.',
    ],
  },
];

export function getService(slug: string | undefined) {
  return SERVICES.find((service) => service.slug === slug);
}

// The last service pages back to the first, as in the Figma folio.
export function getNextService(slug: string) {
  const index = SERVICES.findIndex((service) => service.slug === slug);
  return SERVICES[(index + 1) % SERVICES.length];
}
