export const SITE = {
  name: 'The CB Creative',
  url: 'https://thecbcreative.com',
  founder: 'Cait Burke',
  locality: 'Snoqualmie',
  region: 'WA',
  areaServed: 'Greater Seattle area',
  socialImage: '/brand/social-share.jpg',
  logo: '/brand/icon-512.png',
  title: 'The CB Creative | Web Design & Development — Snoqualmie, WA',
  description:
    'Clean, custom, intentional websites for small businesses in Snoqualmie, WA and the greater Seattle area. Design, code, and brand strategy under one roof.',
} as const;

// Hash links scroll to homepage chapters. The underline marks the current page, or the chapter in view on the homepage.
export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'About', to: '/#about' },
  { label: 'Services', to: '/#services' },
  { label: 'Contact', to: '/contact' },
] as const;
