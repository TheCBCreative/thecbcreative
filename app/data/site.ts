export const SITE = {
  name: 'The CB Creative',
  url: 'https://thecbcreative.com',
  founder: 'Cait Burke',
  locality: 'Snoqualmie',
  region: 'WA',
  areaServed: 'Greater Seattle area',
  socialImage: '/brand/social-share.jpg',
} as const;

// Hash links scroll to homepage chapters; page links get aria-current.
export const NAV_LINKS = [
  { label: 'About', to: '/#about' },
  { label: 'Services', to: '/#services' },
  { label: 'Contact', to: '/contact' },
] as const;
