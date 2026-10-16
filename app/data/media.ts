export interface Footage {
  video: string;
  poster: string;
  media: string;
}

const PHONE = '(max-width: 767px)';

// The mountain footage behind the site, also cropped into the contact page's image window.
// Phones get a portrait cut; everything wider gets the landscape one.
export const MOUNTAIN_VIDEO = {
  phone: { video: '/static/mountain-mobile.59a7d03e.mp4', poster: '/static/mountain-mobile.3120ba41.webp', media: PHONE },
  desktop: { video: '/static/mountain-desktop.7bf5ce1e.mp4', poster: '/static/mountain-desktop.cce12cfc.webp', media: `not all and ${PHONE}` },
} as const satisfies Record<string, Footage>;
